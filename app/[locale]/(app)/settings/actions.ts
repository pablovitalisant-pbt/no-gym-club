'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import {
  isTheme,
  normalizeDisplayName,
} from '@/lib/settings/validate';

type ActionResult = { success: true } | { success: false; error: string };

async function authorizedClient() {
  const supabase = createClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();
  if (error || !user) return null;
  return { supabase, user };
}

export async function saveDisplayName(raw: string): Promise<ActionResult> {
  const auth = await authorizedClient();
  if (!auth) return { success: false, error: 'Unauthorized' };

  const name = normalizeDisplayName(raw);
  if (!name.ok) return { success: false, error: name.error };

  const { error } = await auth.supabase
    .from('profiles')
    .update({ display_name: name.value })
    .eq('id', auth.user.id);

  if (error) return { success: false, error: error.message };
  revalidatePath('/', 'layout');
  return { success: true };
}

export async function saveAvatarUrl(url: string): Promise<ActionResult> {
  const auth = await authorizedClient();
  if (!auth) return { success: false, error: 'Unauthorized' };

  const prefix = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/avatars/${auth.user.id}/`;
  if (typeof url !== 'string' || !url.startsWith(prefix)) {
    return { success: false, error: 'invalid_url' };
  }

  const { error } = await auth.supabase
    .from('profiles')
    .update({ avatar_url: url })
    .eq('id', auth.user.id);

  if (error) return { success: false, error: error.message };
  revalidatePath('/', 'layout');
  return { success: true };
}

export async function saveThemePreference(theme: string): Promise<ActionResult> {
  const auth = await authorizedClient();
  if (!auth) return { success: false, error: 'Unauthorized' };
  if (!isTheme(theme)) return { success: false, error: 'invalid_theme' };

  const { error } = await auth.supabase
    .from('profiles')
    .update({ theme_preference: theme })
    .eq('id', auth.user.id);

  if (error) return { success: false, error: error.message };
  revalidatePath('/', 'layout');
  return { success: true };
}

export async function signOutAction(locale: string): Promise<void> {
  const supabase = createClient();
  await supabase.auth.signOut();
  redirect(`/${locale === 'en' ? 'en' : 'es'}/login`);
}
