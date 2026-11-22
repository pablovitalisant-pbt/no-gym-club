import { describe, it, expect } from 'vitest';
import { readFileSync, existsSync } from 'fs';
import { resolve } from 'path';
import { communityErrorKey } from '@/lib/community/errors';

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

describe('v2-23b solicitudes — UI', () => {
  it('perfil: boton correcto por cada estado de la conexion', () => {
    const src = read('components/community/ConnectionActions.tsx');
    expect(src).toContain('requestConnection');
    expect(src).toContain('cancelConnection');
    expect(src).toContain('respondConnection');
    expect(src).toContain("t('sendRequest')");
    expect(src).toContain("t('requestSent')");
    expect(src).toContain("t('accept')");
    expect(src).toContain("t('reject')");
    expect(src).toContain("t('sendMessage')");
    expect(src).toContain("t('disconnect')");
    expect(src).toContain('disconnectConfirm');
    expect(src).toContain('/community/chat/');
  });

  it('perfil: la vista integra las acciones de conexion y conserva bloquear/reportar', () => {
    const view = read('components/community/CommunityProfileView.tsx');
    expect(view).toContain('ConnectionActions');
    expect(view).toContain('blockCommunityUser');
    expect(view).toContain('reportCommunityUser');
  });

  it('solicitudes: pestanas Recibidas/Enviadas con acciones y vacios amables', () => {
    const src = read('components/community/RequestsView.tsx');
    expect(src).toContain("'received'");
    expect(src).toContain("'sent'");
    expect(src).toContain("t('tabReceived')");
    expect(src).toContain("t('tabSent')");
    expect(src).toContain('respondConnection');
    expect(src).toContain('cancelConnection');
    expect(src).toContain("t('emptyReceived')");
    expect(src).toContain("t('emptySent')");
    expect(src).toContain('CommunityAvatar');
    const page = read('app/[locale]/(app)/community/requests/page.tsx');
    expect(page).toContain('listConnections');
    expect(page).toContain('community_profile');
    expect(page).toContain("getFlag('community_chat')");
  });

  it('accesos de solicitudes y mensajes arriba de Cerca de ti', () => {
    const list = read('components/community/NearbyList.tsx');
    expect(list).toContain('/community/requests');
    expect(list).toContain('/community/chat');
    expect(list).toContain("t('requestsLink'");
    expect(list).toContain("t('messagesLink'");
    const page = read('app/[locale]/(app)/community/page.tsx');
    expect(page).toContain('fetchCommunityCounts');
  });

  it('badge con conteo en BottomNavBar solo con los flags encendidos', () => {
    const nav = read('components/layout/BottomNavBar.tsx');
    expect(nav).toContain('badge');
    const layout = read('app/[locale]/(app)/layout.tsx');
    expect(layout).toContain('fetchCommunityCounts');
    expect(layout).toContain("getFlag('community_chat')");
    expect(layout).toMatch(/badge:\s*communityBadge|badge:\s*pending|badge:\s*count/i);
  });

  it('errores de las funciones traducidos a claves claras', () => {
    expect(communityErrorKey('rate_limited')).toBe('errors.rateLimited');
    expect(communityErrorKey('blocked')).toBe('errors.blocked');
    expect(communityErrorKey('not_allowed')).toBe('errors.ownProfileRequired');
    expect(communityErrorKey('target_not_available')).toBe('errors.targetUnavailable');
    expect(communityErrorKey('connection_exists')).toBe('errors.alreadyConnected');
    expect(communityErrorKey('message_rate_limited')).toBe('errors.messageRateLimited');
    expect(communityErrorKey('message_empty')).toBe('errors.messageEmpty');
    expect(communityErrorKey('message_too_long')).toBe('errors.messageTooLong');
    expect(communityErrorKey('Unauthorized')).toBe('errors.unauthorized');
    expect(communityErrorKey('algo_raro')).toBe('errors.generic');
  });

  it('i18n: claves nuevas simetricas ES/EN y sin voseo', () => {
    const es = JSON.parse(readFileSync(resolve(root, 'messages/es.json'), 'utf-8'));
    const en = JSON.parse(readFileSync(resolve(root, 'messages/en.json'), 'utf-8'));
    expect(keyPaths(es.community).sort()).toEqual(keyPaths(en.community).sort());
    for (const key of [
      'requestsTitle', 'tabReceived', 'tabSent', 'emptyReceived', 'emptySent',
      'accept', 'reject', 'requestSent', 'sendMessage', 'disconnect',
      'disconnectConfirm', 'requestsLink', 'messagesLink',
    ]) {
      expect(typeof es.community[key]).toBe('string');
      expect(es.community[key].length).toBeGreaterThan(0);
    }
    for (const key of ['rateLimited', 'blocked', 'ownProfileRequired', 'targetUnavailable', 'generic']) {
      expect(typeof es.community.errors[key]).toBe('string');
      expect(es.community.errors[key].length).toBeGreaterThan(0);
    }
  });
});
