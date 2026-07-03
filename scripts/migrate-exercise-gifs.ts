import { readFileSync } from 'fs';
import { resolve } from 'path';

// ─── Load .env.local ───
const envPath = resolve(__dirname, '..', '.env.local');
const envRaw = readFileSync(envPath, 'utf-8');
const env: Record<string, string> = {};
envRaw.split('\n').forEach((line) => {
  const [key, ...rest] = line.split('=');
  if (key && rest.length > 0) {
    env[key.trim()] = rest.join('=').trim();
  }
});

const SUPABASE_URL = env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_ROLE_KEY = env.SUPABASE_SERVICE_ROLE_KEY;
const WORKOUTX_KEY = env.WORKOUTX_API_KEY;

if (!SUPABASE_URL || !SERVICE_ROLE_KEY || !WORKOUTX_KEY) {
  console.error('Missing required env vars.');
  process.exit(1);
}

const WORKOUTX_API = 'https://api.workoutxapp.com/v1';

// ─── Supabase REST headers ───
const SUPABASE_HEADERS = {
  apikey: SERVICE_ROLE_KEY,
  Authorization: `Bearer ${SERVICE_ROLE_KEY}`,
  'Content-Type': 'application/json',
};

interface WorkoutXExercise {
  id: string;
  name: string;
  difficulty: string;
  instructions: string[];
  equipment: string;
  muscle_groups: string[];
}

async function main() {
  console.log('Supabase URL:', SUPABASE_URL ? `${SUPABASE_URL.slice(0, 30)}...` : 'MISSING');
  console.log('Service Key:', SERVICE_ROLE_KEY ? `${SERVICE_ROLE_KEY.slice(0, 20)}...` : 'MISSING');
  console.log('WorkoutX Key:', WORKOUTX_KEY ? `${WORKOUTX_KEY.slice(0, 20)}...` : 'MISSING');

  // 1. Fetch WorkoutX exercises (paginated — free tier limits 10 per request)
  console.log('Fetching WorkoutX bodyweight exercises (paginated)...');
  const wxData: WorkoutXExercise[] = [];
  let offset = 0;
  const limit = 10;
  while (true) {
    const wxRes = await fetch(
      `${WORKOUTX_API}/exercises/equipment/body%20weight?limit=${limit}&offset=${offset}`,
      { headers: { 'X-WorkoutX-Key': WORKOUTX_KEY } },
    );
    if (!wxRes.ok) {
      const errText = await wxRes.text();
      console.error(`WorkoutX API error at offset ${offset}: ${wxRes.status} — ${errText.slice(0, 200)}`);
      process.exit(1);
    }
    const wxJson = await wxRes.json();
    const page: WorkoutXExercise[] = Array.isArray(wxJson) ? wxJson : (wxJson as { data: WorkoutXExercise[] }).data || [];
    wxData.push(...page);
    console.log(`  offset ${offset}: ${page.length} exercises (total: ${wxData.length})`);
    if (page.length < limit) break;
    offset += limit;
    // Rate limit: 30 req/60s → 2s between requests
    await new Promise((r) => setTimeout(r, 2100));
  }
  console.log(`Got ${wxData.length} WorkoutX exercises total.`);

  // 2. Fetch No Gym Club exercises via REST API
  console.log('Fetching No Gym Club exercises...');
  const ngcRes = await fetch(
    `${SUPABASE_URL}/rest/v1/exercises?id=not.is.null&is_active=eq.true&select=id,slug,name_en`,
    { headers: SUPABASE_HEADERS },
  );
  if (!ngcRes.ok) {
    console.error(`Supabase REST error: ${ngcRes.status}`);
    const errText = await ngcRes.text();
    console.error(errText.slice(0, 500));
    process.exit(1);
  }
  const ngcExercises = (await ngcRes.json()) as { id: string; slug: string; name_en: string }[];
  console.log(`Got ${ngcExercises.length} No Gym Club exercises.`);

  // 3. Check/create storage bucket via REST
  console.log('Checking exercise-gifs bucket...');
  const bucketRes = await fetch(
    `${SUPABASE_URL}/storage/v1/bucket/exercise-gifs`,
    { headers: SUPABASE_HEADERS },
  );
  if (bucketRes.status === 404) {
    console.log('Creating exercise-gifs bucket...');
    const createRes = await fetch(
      `${SUPABASE_URL}/storage/v1/bucket`,
      {
        method: 'POST',
        headers: SUPABASE_HEADERS,
        body: JSON.stringify({ id: 'exercise-gifs', name: 'exercise-gifs', public: true }),
      },
    );
    if (!createRes.ok) {
      console.error('Bucket creation failed:', await createRes.text());
      process.exit(1);
    }
    console.log('Bucket created.');
  } else if (!bucketRes.ok) {
    console.error('Bucket check failed:', bucketRes.status);
    process.exit(1);
  }

  // 4. Match and migrate
  let matched = 0;
  let unmatched = 0;

  for (const ngc of ngcExercises) {
    const ngcName = (ngc.name_en as string).toLowerCase().trim();

    // Find best match by name
    const match = wxData.find((wx) => {
      const wxName = wx.name.toLowerCase().trim();
      return (
        wxName === ngcName ||
        wxName.includes(ngcName) ||
        ngcName.includes(wxName)
      );
    });

    if (!match) {
      console.log(`  ✗ No match: ${ngc.name_en} (${ngc.slug})`);
      unmatched++;
      continue;
    }

    console.log(`  ✓ Matched: ${ngc.name_en} → WorkoutX "${match.name}"`);

    // Download GIF
    let gifBuffer: ArrayBuffer;
    try {
      const gifRes = await fetch(
        `${WORKOUTX_API}/gifs/${match.id}.gif`,
        { headers: { 'X-WorkoutX-Key': WORKOUTX_KEY } },
      );
      if (!gifRes.ok) {
        console.log(`    ⚠ GIF not found for ${match.id}, skipping`);
        unmatched++;
        continue;
      }
      gifBuffer = await gifRes.arrayBuffer();
    } catch {
      console.log(`    ⚠ Failed to download GIF for ${match.id}`);
      unmatched++;
      continue;
    }

    // Upload to Supabase Storage via REST
    const fileName = `${ngc.slug}.gif`;
    const uploadRes = await fetch(
      `${SUPABASE_URL}/storage/v1/object/exercise-gifs/${fileName}`,
      {
        method: 'POST',
        headers: {
          ...SUPABASE_HEADERS,
          'Content-Type': 'image/gif',
          'x-upsert': 'true',
        },
        body: gifBuffer,
      },
    );

    if (!uploadRes.ok) {
      console.log(`    ⚠ Upload error: ${uploadRes.status} — ${await uploadRes.text().then(t => t.slice(0, 100))}`);
      unmatched++;
      continue;
    }

    const gifUrl = `${SUPABASE_URL}/storage/v1/object/public/exercise-gifs/${fileName}`;

    // Update exercise record via REST
    const updateRes = await fetch(
      `${SUPABASE_URL}/rest/v1/exercises?id=eq.${ngc.id}`,
      {
        method: 'PATCH',
        headers: SUPABASE_HEADERS,
        body: JSON.stringify({
          gif_url: gifUrl,
          instructions_en: Array.isArray(match.instructions)
            ? match.instructions
            : typeof match.instructions === 'string'
              ? [match.instructions]
              : [],
          difficulty: match.difficulty || 'beginner',
        }),
      },
    );

    if (!updateRes.ok) {
      const errText = await updateRes.text();
      console.log(`    ⚠ DB update error: ${updateRes.status} — ${errText.slice(0, 100)}`);
      unmatched++;
      continue;
    }

    console.log(`    ↳ GIF uploaded, DB updated.`);
    matched++;
  }

  console.log(`\nDone. Matched: ${matched}, Unmatched: ${unmatched}`);
}

main().catch(console.error);
