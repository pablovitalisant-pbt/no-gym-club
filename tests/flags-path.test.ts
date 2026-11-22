import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdtempSync, writeFileSync, rmSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';

// Bug #10: getFlag debe poder leer una ruta temporal (FEATURE_FLAGS_PATH)
// para que los tests no escriban el config/feature-flags.json real.
describe('FEATURE_FLAGS_PATH', () => {
  let dir: string;
  let tmpFlagsPath: string;

  beforeEach(() => {
    dir = mkdtempSync(join(tmpdir(), 'ngc-flags-'));
    tmpFlagsPath = join(dir, 'feature-flags.json');
    writeFileSync(tmpFlagsPath, JSON.stringify({ landing_page: false }));
    process.env.FEATURE_FLAGS_PATH = tmpFlagsPath;
  });

  afterEach(() => {
    delete process.env.FEATURE_FLAGS_PATH;
    rmSync(dir, { recursive: true, force: true });
  });

  it('getFlag lee los flags del archivo indicado por la variable', async () => {
    const { getFlag } = await import('@/lib/flags');
    expect(getFlag('landing_page')).toBe(false);
    expect(getFlag('flag_que_no_existe')).toBe(false);
  });

  it('no lee el config real cuando la variable esta definida', async () => {
    // el config real tiene landing_page: true; el temporal dice false
    const { getFlag } = await import('@/lib/flags');
    expect(getFlag('landing_page')).toBe(false);
  });
});
