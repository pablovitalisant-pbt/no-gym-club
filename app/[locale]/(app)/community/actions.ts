'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import {
  isAdult,
  normalizeBio,
  normalizeComuna,
  normalizeCoordinates,
  normalizeReportReason,
} from '@/lib/community/validate';

export type CommunityActionResult = { success: true } | { success: false; error: string };

async function authorizedClient() {
  const supabase = createClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();
  if (error || !user) return null;
  return { supabase, user };
}

export interface CommunityProfileInput {
  comuna: string;
  bio: string;
  showPhoto: boolean;
  showLevel: boolean;
  showGoal: boolean;
  lat: number | null;
  lng: number | null;
}

export async function saveCommunityProfile(
  input: CommunityProfileInput,
): Promise<CommunityActionResult> {
  const auth = await authorizedClient();
  if (!auth) return { success: false, error: 'Unauthorized' };

  const { data: profile } = await auth.supabase
    .from('profiles')
    .select('age')
    .eq('id', auth.user.id)
    .maybeSingle();

  if (!isAdult(profile?.age)) {
    return { success: false, error: 'La comunidad es para mayores de 18' };
  }

  const comuna = normalizeComuna(input.comuna);
  if (!comuna.ok) return { success: false, error: comuna.error };
  const bio = normalizeBio(input.bio);
  if (!bio.ok) return { success: false, error: bio.error };

  // La ubicacion se redondea antes de guardar: nunca se persiste la exacta.
  const coords = normalizeCoordinates(input.lat, input.lng);

  const { error } = await auth.supabase.from('community_profiles').upsert(
    {
      user_id: auth.user.id,
      is_public: true,
      comuna: comuna.value,
      bio: bio.value,
      show_photo: Boolean(input.showPhoto),
      show_level: Boolean(input.showLevel),
      show_goal: Boolean(input.showGoal),
      geo_lat: coords?.lat ?? null,
      geo_lng: coords?.lng ?? null,
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'user_id' },
  );

  if (error) return { success: false, error: error.message };
  revalidatePath('/', 'layout');
  return { success: true };
}

export async function deactivateCommunityProfile(): Promise<CommunityActionResult> {
  const auth = await authorizedClient();
  if (!auth) return { success: false, error: 'Unauthorized' };

  const { error } = await auth.supabase
    .from('community_profiles')
    .update({ is_public: false, updated_at: new Date().toISOString() })
    .eq('user_id', auth.user.id);

  if (error) return { success: false, error: error.message };
  revalidatePath('/', 'layout');
  return { success: true };
}

function isUuid(value: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value);
}

export async function blockCommunityUser(targetId: string): Promise<CommunityActionResult> {
  const auth = await authorizedClient();
  if (!auth) return { success: false, error: 'Unauthorized' };
  if (!isUuid(targetId) || targetId === auth.user.id) {
    return { success: false, error: 'invalid_target' };
  }

  const { error } = await auth.supabase
    .from('community_blocks')
    .insert({ blocker_id: auth.user.id, blocked_id: targetId });

  // 23505 = ya bloqueado; el resultado visible es el mismo.
  if (error && error.code !== '23505') return { success: false, error: error.message };
  revalidatePath('/', 'layout');
  return { success: true };
}

export async function unblockCommunityUser(targetId: string): Promise<CommunityActionResult> {
  const auth = await authorizedClient();
  if (!auth) return { success: false, error: 'Unauthorized' };
  if (!isUuid(targetId)) return { success: false, error: 'invalid_target' };

  const { error } = await auth.supabase
    .from('community_blocks')
    .delete()
    .eq('blocker_id', auth.user.id)
    .eq('blocked_id', targetId);

  if (error) return { success: false, error: error.message };
  revalidatePath('/', 'layout');
  return { success: true };
}

export async function reportCommunityUser(
  targetId: string,
  reason: string,
): Promise<CommunityActionResult> {
  const auth = await authorizedClient();
  if (!auth) return { success: false, error: 'Unauthorized' };
  if (!isUuid(targetId) || targetId === auth.user.id) {
    return { success: false, error: 'invalid_target' };
  }

  const normalized = normalizeReportReason(reason);
  if (!normalized.ok) return { success: false, error: normalized.error };

  const { error } = await auth.supabase.from('community_reports').insert({
    reporter_id: auth.user.id,
    reported_id: targetId,
    reason: normalized.value,
  });

  if (error) return { success: false, error: error.message };
  return { success: true };
}
