#!/usr/bin/env node
import { randomBytes } from 'node:crypto';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createClient } from '@supabase/supabase-js';

const EXCEPTION = 'pablo-2026-11-21';
const FIXTURES = join(dirname(fileURLToPath(import.meta.url)), 'fixtures');
const accounts = [
  { email: 'qa.extremo@nogym.test', profile: { age: 52, weight_kg: 118, height_cm: 172, training_history: 'never', health_limitations: ['knees', 'lower_back'], cardio_preference: 'light', available_days_per_week: 3, available_equipment: ['bodyweight', 'wall', 'ground'], par_q_cleared: true, assessment_completed: true }, assessment: { pushup_variant: 'wall', pushup_variant_reps: 5, sit_to_stand_30s: 6, walk_minutes: 8, knee_plank_seconds: 10, dead_hang_seconds: 0 }, plan: { fixture: 'fase0-extremo.json', start_level: 'untrained_extreme' } },
  { email: 'qa.intermedio@nogym.test', profile: { age: 30, weight_kg: 75, height_cm: 178, training_history: 'active', health_limitations: [], cardio_preference: 'moderate', focus_areas: ['chest', 'shoulders'], available_days_per_week: 4, available_equipment: ['bodyweight', 'bar', 'ground', 'wall'], par_q_cleared: true, assessment_completed: true }, assessment: { pushup_variant: 'floor', pushup_variant_reps: 25, dead_hang_seconds: 45 }, plan: { fixture: 'fase0-intermedio.json', start_level: 'intermediate' } },
  { email: 'qa.nuevo@nogym.test', profile: null, assessment: null, plan: null },
];

function password() { return `Qa!${randomBytes(18).toString('base64url')}9`; }

// Subconjunto portable de lib/plan/validate-phase.ts (desde .mjs no se importa TS).
export function validateFixture(phase, label) {
  if (!phase || phase.index !== 0) throw new Error(`${label}: index debe ser 0`);
  if (!Array.isArray(phase.week_template) || phase.week_template.length !== 7) {
    throw new Error(`${label}: week_template debe tener exactamente 7 dias`);
  }
  if (!phase.week_template.some((day) => day && day.type === 'rest')) {
    throw new Error(`${label}: week_template debe incluir al menos 1 dia rest`);
  }
  return phase;
}

function readFixture(file) {
  return validateFixture(JSON.parse(readFileSync(join(FIXTURES, file), 'utf8')), file);
}

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
    if (account.plan) {
      const phase = readFixture(account.plan.fixture);
      const { error } = await supabase.from('training_plans').insert({
        user_id: userId,
        plan_data: { version: 2, total_weeks: 12, phase_weeks: 4, phases: [phase] },
        current_day_index: 0,
        completed_day_indexes: [],
        start_level: account.plan.start_level,
        is_active: true,
      });
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

const isMain = process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (isMain) main().catch((error) => { console.error(`[qa-preparar] ${error.message}`); process.exitCode = 1; });
