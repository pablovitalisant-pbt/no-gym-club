import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { resolve } from 'path';

const root = resolve(__dirname, '..');

function read(rel: string): string {
  return readFileSync(resolve(root, rel), 'utf-8');
}

const client = read('app/[locale]/(app)/settings/settings-client.tsx');

/** Trozos de JSX que son un <input type="file" ...> completo. */
function fileInputs(src: string): string[] {
  return src.match(/<input[\s\S]*?\/>/g)?.filter((tag) => tag.includes('type="file"')) ?? [];
}

describe('Slice v3-09 — tomar foto o elegir de la galería', () => {
  it('hay exactamente dos inputs de archivo junto al avatar', () => {
    expect(fileInputs(client)).toHaveLength(2);
  });

  it('uno abre la cámara (capture) y el otro no', () => {
    const [camera, gallery] = fileInputs(client);
    expect(camera).toMatch(/capture="(user|environment)"/);
    expect(camera).not.toMatch(/capture="environment"/);
    expect(gallery).toMatch(/accept="image\/\*"/);
    expect(gallery).not.toContain('capture');
  });

  it('ambos aceptan imagen y llaman a handleFile limpiando el valor', () => {
    for (const input of fileInputs(client)) {
      expect(input).toMatch(/accept="image\/\*"/);
      expect(input).toContain('handleFile');
      expect(input).toContain('e.target.value');
    }
  });

  it('ambos se deshabilitan mientras sube el avatar', () => {
    const [, gallery] = fileInputs(client);
    expect(gallery).toContain("disabled={avatarState === 'saving'}");
  });

  it('i18n es/en simétrico con takePhoto y chooseFromGallery', () => {
    const es = JSON.parse(read('messages/es.json'));
    const en = JSON.parse(read('messages/en.json'));
    expect(es.settings.takePhoto).toBe('Tomar foto');
    expect(en.settings.takePhoto).toBe('Take photo');
    expect(es.settings.chooseFromGallery).toBe('Elegir de la galería');
    expect(en.settings.chooseFromGallery).toBe('Choose from gallery');
    expect(Object.keys(es.settings).sort()).toEqual(Object.keys(en.settings).sort());
  });
});
