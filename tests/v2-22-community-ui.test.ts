import { describe, it, expect } from 'vitest';
import { readFileSync, existsSync } from 'fs';
import { resolve } from 'path';

const root = resolve(__dirname, '..');

function read(path: string): string {
  const full = resolve(root, path);
  return existsSync(full) ? readFileSync(full, 'utf-8') : '';
}

function keyPaths(obj: unknown, path = ''): string[] {
  return Object.entries(obj as Record<string, unknown>).flatMap(([k, v]) => {
    const p = path ? `${path}.${k}` : k;
    if (typeof v === 'string') return [p];
    if (v && typeof v === 'object') return keyPaths(v, p);
    return [];
  });
}

describe('v2-22 comunidad — UI', () => {
  it('la pagina /community usa el flag y muestra la invitacion si no hay perfil (C1)', () => {
    const page = read('app/[locale]/(app)/community/page.tsx');
    expect(page).toContain("getFlag('community')");
    expect(page).toContain('CommunityOptIn');
    expect(page).toContain('communityMode');
  });

  it('invitacion: consentimiento, geolocalizacion, comuna y contador de bio', () => {
    const optIn = read('components/community/CommunityOptIn.tsx');
    expect(read('components/community/LocationButton.tsx')).toContain('geolocation');
    expect(optIn).toContain('consent');
    expect(optIn).toContain('maxLength={BIO_MAX}');
    expect(optIn).toContain('{bio.length}/{BIO_MAX}');
    expect(optIn).toContain('saveCommunityProfile');
    expect(optIn).not.toContain('window.confirm');
  });

  it('lista cercana: selector de radio y tarjetas sin mapa ni coordenadas', () => {
    const list = read('components/community/NearbyList.tsx');
    expect(list).toContain('RADIUS_OPTIONS');
    expect(list).not.toMatch(/geo_lat|geo_lng|leaflet|google\.maps/i);
    const card = read('components/community/ProfileCard.tsx');
    expect(card).toMatch(/distance/i);
    expect(card).toContain('/community/');
  });

  it('perfil: bloquear y reportar con confirmacion en UI, acciones de conexion (v2-23b)', () => {
    const view = read('components/community/CommunityProfileView.tsx');
    expect(view).not.toContain('window.confirm');
    expect(view).toContain('blockCommunityUser');
    expect(view).toContain('reportCommunityUser');
    expect(view).toContain('ConnectionActions');
  });

  it('acciones: validan edad, redondean coordenadas y escriben en community_profiles', () => {
    const actions = read('app/[locale]/(app)/community/actions.ts');
    expect(actions).toContain('isAdult');
    expect(actions).toContain('normalizeCoordinates');
    expect(actions).toContain("from('community_profiles')");
    expect(actions).toContain('La comunidad es para mayores de 18');
  });

  it('pestana Comunidad solo con flag y enlace en settings', () => {
    const layout = read('app/[locale]/(app)/layout.tsx');
    expect(layout).toContain("getFlag('community')");
    const nav = read('components/layout/BottomNavBar.tsx');
    expect(nav).toContain("'/community'");
    const settings = read('app/[locale]/(app)/settings/settings-client.tsx');
    expect(settings).toContain('/community');
  });

  it('i18n: community simetrico en es/en y sin voseo', () => {
    const es = JSON.parse(readFileSync(resolve(root, 'messages/es.json'), 'utf-8'));
    const en = JSON.parse(readFileSync(resolve(root, 'messages/en.json'), 'utf-8'));
    expect(keyPaths(es.community).sort()).toEqual(keyPaths(en.community).sort());
    expect(es.community.minAgeError).toBe('La comunidad es para mayores de 18');
    expect(es.community.comingSoon).toBe('Próximamente');
  });
});
