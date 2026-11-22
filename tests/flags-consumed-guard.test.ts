import { describe, it, expect } from 'vitest';
import { readFileSync, readdirSync, statSync } from 'fs';
import { join, resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');

function sourceFiles(dir: string): string[] {
  const out: string[] = [];
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) out.push(...sourceFiles(full));
    else if (/\.(ts|tsx)$/.test(entry)) out.push(full);
  }
  return out;
}

describe('guard: cada feature flag tiene consumidor', () => {
  it('toda key de feature-flags.json se lee con getFlag() en app/components/lib', () => {
    const flags = JSON.parse(
      readFileSync(resolve(root, 'config/feature-flags.json'), 'utf-8'),
    ) as Record<string, boolean>;
    const source = ['app', 'components', 'lib']
      .flatMap((dir) => sourceFiles(resolve(root, dir)))
      .map((file) => readFileSync(file, 'utf-8'))
      .join('\n');

    for (const key of Object.keys(flags)) {
      expect(source, `flag "${key}" sin consumidor`).toContain(`getFlag('${key}')`);
    }
  });
});
