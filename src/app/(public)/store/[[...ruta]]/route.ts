/**
 * `/store/*` responde 410 Gone, no 404.
 *
 * Es la tienda falsa que los atacantes instalaron en el WordPress antiguo
 * (septiembre de 2026): 22.014 paginas de productos y veinte sitemaps que Google
 * alcanzo a indexar bajo `maxibasquetbol.cl`. Este sitio nunca tuvo `/store`.
 *
 * Un 404 dice "no esta ahora", y Google vuelve a pasar varias veces antes de
 * darla por perdida. Un 410 dice "se borro a proposito" y la saca del indice
 * mas rapido, que es exactamente lo que se quiere con spam indexado a nombre
 * de la Liga.
 *
 * El texto va plano y sin la maqueta del sitio: el que llega aca es un
 * buscador o alguien que siguio un enlace de spam, y a ninguno de los dos le
 * sirve la portada.
 */
function gone(): Response {
  return new Response('Esta pagina ya no existe.', {
    status: 410,
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'X-Robots-Tag': 'noindex',
      'Cache-Control': 'public, max-age=86400',
    },
  })
}

export const GET = gone
export const HEAD = gone
