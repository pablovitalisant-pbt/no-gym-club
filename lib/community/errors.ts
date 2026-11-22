// v2-23b: errores crudos de las funciones SQL -> claves i18n de community.
const KEYS: Record<string, string> = {
  rate_limited: 'errors.rateLimited',
  blocked: 'errors.blocked',
  not_allowed: 'errors.ownProfileRequired',
  target_not_available: 'errors.targetUnavailable',
  connection_exists: 'errors.alreadyConnected',
  not_found: 'errors.generic',
  message_rate_limited: 'errors.messageRateLimited',
  message_empty: 'errors.messageEmpty',
  message_too_long: 'errors.messageTooLong',
  Unauthorized: 'errors.unauthorized',
  unauthorized: 'errors.unauthorized',
  invalid_target: 'errors.invalid',
  invalid_connection: 'errors.invalid',
};

export function communityErrorKey(error: string): string {
  return KEYS[error] ?? 'errors.generic';
}
