/** Saludo con nombre; sin nombre devuelve null para que el llamador use su texto base. */
export function greetingText(
  template: string,
  name: string | null | undefined,
): string | null {
  const value = (name ?? '').trim();
  return value ? template.replace('{name}', value) : null;
}
