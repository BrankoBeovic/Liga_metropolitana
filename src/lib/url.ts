/**
 * Acepta solo http y https.
 *
 * Todo lo que el CMS guarda como enlace termina en un `href` del sitio
 * publico. Sin este filtro se puede guardar `javascript:...`, y eso se
 * convierte en un XSS en cuanto un lector hace clic.
 *
 * Vive suelto en `lib` porque lo necesitan los sponsors, los reels y los
 * perfiles. Estaba copiado en dos de esos tres, y a la tercera copia conviene
 * que la regla sea una sola.
 */
export function urlValida(valor: string): boolean {
  try {
    const u = new URL(valor)
    return u.protocol === 'http:' || u.protocol === 'https:'
  } catch {
    return false
  }
}
