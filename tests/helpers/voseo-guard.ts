// Guardián compartido de voseo (español neutro, tuteo).
export const VOSEO = /\b(?:tenés|podés|querés|sabés|sentís|elegí|contanos|hacé|tocá|empezá|guardá|registrá|volvé|seleccioná|marcá|respondé|consultá|arrancá|probá|decí|mirá|usá|buscá|poné|andá|vení|salí|escribí|completá|revisá|activá|desactivá|agregá|borrá|cambiá|pedí|repetí|mantené)\b/i;

const TILDE_FINAL = /[áéí]$/i;
const PERMITIDAS = new Set([
  'está', 'qué', 'sí', 'él', 'más', 'entrené', 'esté', 'aquí', 'así', 'ahí', 'allí',
]);

export function tildesVoseantes(texto: string): string[] {
  return texto
    .split(/[^\p{L}]+/u)
    .filter((w) => TILDE_FINAL.test(w) && !PERMITIDAS.has(w.toLowerCase()));
}

export function esVoseo(texto: string): boolean {
  return VOSEO.test(texto) || tildesVoseantes(texto).length > 0;
}
