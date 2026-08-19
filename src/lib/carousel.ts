/**
 * Atributo que marca lo unico que detiene el carrusel al pasarle el mouse.
 *
 * Lo pone cada tarjeta en su boton de play y lo lee `ui/Carousel.tsx` por
 * delegacion de eventos.
 *
 * Vive en un modulo neutro y no dentro de `Carousel.tsx` porque ese archivo es
 * `'use client'`: una constante importada desde ahi por un Server Component no
 * llega con su valor, y la clave calculada terminaba resolviendo a `undefined`,
 * asi que el atributo no se renderizaba y la pausa no funcionaba nunca.
 */
export const ATRIBUTO_PAUSA = 'data-pausa-carrusel'

/** Listo para esparcir en el JSX: `{...PROPS_PAUSA}`. */
export const PROPS_PAUSA = { [ATRIBUTO_PAUSA]: 'true' } as const
