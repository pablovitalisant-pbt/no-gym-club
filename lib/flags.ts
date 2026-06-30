import { readFileSync } from 'fs';
import { resolve } from 'path';

// ponytail: sync read, archivo de config chico (~bytes), no necesita cache ni async
export function getFlag(key: string): boolean {
  const flagsPath = resolve(process.cwd(), 'config/feature-flags.json');
  const raw = readFileSync(flagsPath, 'utf-8');
  const flags: Record<string, boolean> = JSON.parse(raw);
  return flags[key] ?? false;
}
