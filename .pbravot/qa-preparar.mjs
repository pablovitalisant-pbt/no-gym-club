#!/usr/bin/env node
import { randomBytes } from 'node:crypto';
import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { createClient } from '@supabase/supabase-js';

const EXCEPTION = 'pablo-2026-11-21';
const accounts = [
  { email: 'qa.extremo@nogym.test', profile: { age: 52, weight_kg: 118, height_cm: 172, training_history: 'never', health_limitations: ['knees', 'lower_back'], cardio_preference: 'light', available_days_per_week: 3, available_equipment: ['bodyweight', 'wall', 'ground'], par_q_cleared: true, assessment_completed: true }, assessment: { pushup_variant: 'wall', pushup_variant_reps: 5, sit_to_stand_30s: 6, walk_minutes: 8, knee_plank_seconds: 10, dead_hang_seconds: 0 } },
  { email: 'qa.intermedio@nogym.test', profile: { age: 30, weight_kg: 75, height_cm: 178, training_history: 'active', health_limitations: [], cardio_preference: 'moderate', focus_areas: ['chest', 'shoulders'], available_days_per_week: 4, available_equipment: ['bodyweight', 'bar', 'ground', 'wall'], par_q_cleared: true, assessment_completed: true }, assessment: { pushup_variant: 'floor', pushup_variant_reps: 25, dead_hang_seconds: 45 } },
  { email: 'qa.nuevo@nogym.test', profile: null, assessment: null },
];

function password() { return `Qa!${randomBytes(18).toString('base64url')}9`; }

async function main() {
  if (process.env.QA_EXCEPCION_PRODUCCION !== EXCEPTION) throw new Error('Falta la excepcion QA autorizada');
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error('Faltan NEXT_PUBLIC_SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY');
  const supabase = createClient(url, key, { auth: { autoRefreshToken: false, persistSession: false } });
  const { data: listed, error: listError } = await supabase.auth.admin.listUsers({ perPage: 1000 });
  if (listError) throw listError;
  const output = {};
  for (const account of accounts) {
    const secret = password();
    const existing = listed.users.find((user) => user.email === account.email);
    const result = existing
      ? await supabase.auth.admin.updateUserById(existing.id, { password: secret, email_confirm: true })
      : await supabase.auth.admin.createUser({ email: account.email, password: secret, email_confirm: true });
    if (result.error) throw result.error;
    const userId = result.data.user.id;
    for (const table of ['workout_sessions', 'training_plans', 'assessment_results']) {
      const { error } = await supabase.from(table).delete().eq('user_id', userId);
      if (error) throw error;
    }
    if (account.profile) {
      const { error } = await supabase.from('profiles').upsert({ id: userId, ...account.profile });
      if (error) throw error;
      const { error: assessmentError } = await supabase.from('assessment_results').insert({ user_id: userId, ...account.assessment });
      if (assessmentError) throw assessmentError;
    } else {
      const { error } = await supabase.from('profiles').delete().eq('id', userId);
      if (error) throw error;
    }
    output[account.email] = { role: 'user', password: secret };
  }
  const dir = process.env.PBRAVOT_QA_DIR;
  if (!dir) throw new Error('Falta PBRAVOT_QA_DIR');
  mkdirSync(dir, { recursive: true });
  writeFileSync(join(dir, 'cuentas.json'), `${JSON.stringify(output, null, 2)}\n`, 'utf8');
  console.log(`[qa-preparar] ${accounts.length} cuentas preparadas; JSON escrito en ${join(dir, 'cuentas.json')}`);
}

main().catch((error) => { console.error(`[qa-preparar] ${error.message}`); process.exitCode = 1; });
