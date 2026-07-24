import { describe, it, expect } from 'vitest';
import { readFileSync, existsSync, statSync } from 'fs';
import { resolve } from 'path';

const root = resolve(__dirname, '..');

describe('PWA manifest + íconos', () => {
  // ─── Riesgo 1: manifest.ts exporta campos obligatorios ───
  it('app/manifest.ts existe y exporta name, short_name, display, start_url, colors', () => {
    const path = resolve(root, 'app/manifest.ts');
    expect(existsSync(path), 'app/manifest.ts no existe').toBe(true);
    const src = readFileSync(path, 'utf-8');
    expect(src).toContain('name');
    expect(src).toContain('short_name');
    expect(src).toContain("display: 'standalone'");
    expect(src).toContain('start_url');
    expect(src).toContain('background_color');
    expect(src).toContain('theme_color');
  });

  // ─── Riesgo 2: icons array completo ───
  it('icons tiene 192x192, 512x512, any y maskable', () => {
    const path = resolve(root, 'app/manifest.ts');
    const src = readFileSync(path, 'utf-8');
    expect(src).toContain('192x192');
    expect(src).toContain('512x512');
    expect(src).toContain("purpose: 'any'");
    expect(src).toContain("purpose: 'maskable'");
  });

  // ─── Riesgo 3: Los 4 PNG existen y no están vacíos ───
  const ICONS = [
    { path: 'public/icons/icon-192.png', label: 'icon-192' },
    { path: 'public/icons/icon-512.png', label: 'icon-512' },
    { path: 'public/icons/icon-512-maskable.png', label: 'icon-512-maskable' },
    { path: 'public/icons/apple-touch-icon.png', label: 'apple-touch-icon' },
  ];

  ICONS.forEach(({ path, label }) => {
    it(`${label} existe en disco y pesa >0 bytes`, () => {
      const full = resolve(root, path);
      expect(existsSync(full), `${path} no existe`).toBe(true);
      expect(statSync(full).size).toBeGreaterThan(0);
    });
  });

  // ─── Riesgo 4: dimensiones reales de cada PNG ───
  function pngSize(filePath: string): { w: number; h: number } {
    const buf = readFileSync(filePath);
    // PNG header: bytes 16-19 width, 20-23 height (big-endian)
    const w = buf.readUInt32BE(16);
    const h = buf.readUInt32BE(20);
    return { w, h };
  }

  it('icon-192.png mide 192×192', () => {
    const full = resolve(root, 'public/icons/icon-192.png');
    const { w, h } = pngSize(full);
    expect(w).toBe(192);
    expect(h).toBe(192);
  });

  it('icon-512.png mide 512×512', () => {
    const full = resolve(root, 'public/icons/icon-512.png');
    const { w, h } = pngSize(full);
    expect(w).toBe(512);
    expect(h).toBe(512);
  });

  it('icon-512-maskable.png mide 512×512', () => {
    const full = resolve(root, 'public/icons/icon-512-maskable.png');
    const { w, h } = pngSize(full);
    expect(w).toBe(512);
    expect(h).toBe(512);
  });

  it('apple-touch-icon.png mide 180×180', () => {
    const full = resolve(root, 'public/icons/apple-touch-icon.png');
    const { w, h } = pngSize(full);
    expect(w).toBe(180);
    expect(h).toBe(180);
  });

  // ─── Riesgo 5: layout exporta metadata con manifest ───
  it('layout exporta metadata con manifest y appleWebApp', () => {
    const layout = readFileSync(resolve(root, 'app/[locale]/layout.tsx'), 'utf-8');
    expect(layout).toContain("manifest: '/manifest.webmanifest'");
    expect(layout).toContain('appleWebApp');
    expect(layout).toContain('capable: true');
  });

  // ─── Riesgo 6: layout exporta viewport separado ───
  it('layout exporta viewport (separado de metadata) con themeColor y viewportFit', () => {
    const layout = readFileSync(resolve(root, 'app/[locale]/layout.tsx'), 'utf-8');
    expect(layout).toContain('export const viewport');
    expect(layout).toContain('themeColor');
    expect(layout).toContain("viewportFit: 'cover'");
  });

  // ─── Riesgo 7: themeColor NO está dentro de metadata (API antigua) ───
  it('themeColor no aparece dentro del export metadata (debe estar en viewport)', () => {
    const layout = readFileSync(resolve(root, 'app/[locale]/layout.tsx'), 'utf-8');
    // Buscar la línea de export metadata y verificar que no contiene themeColor
    const metaIdx = layout.indexOf('export const metadata');
    const viewportIdx = layout.indexOf('export const viewport');
    // Si viewportIdx > metaIdx, el metadata está antes que viewport
    const beforeViewport = layout.slice(metaIdx, viewportIdx > metaIdx ? viewportIdx : undefined);
    expect(beforeViewport).not.toContain('themeColor');
  });
});
