import { readFileSync } from 'fs';
import { resolve } from 'path';

// ponytail: sync read, archivo de config chico (~bytes), no necesita cache ni async
export function getFlag(key: string): boolean {
  // Env var override: FEATURE_<KEY>=true sobrescribe el JSON
  // Útil para cambiar flags en Vercel sin redeploy
  const envKey = `FEATURE_${key.toUpperCase()}`;
  if (process.env[envKey] !== undefined) {
    return process.env[envKey] === 'true';
  }
  const flagsPath = resolve(process.cwd(), 'config/feature-flags.json');
  const raw = readFileSync(flagsPath, 'utf-8');
  const flags: Record<string, boolean> = JSON.parse(raw);
  return flags[key] ?? false;
}
