'use client'

import { motion, useReducedMotion, type Variants } from 'framer-motion'
import type { ElementType, ReactNode } from 'react'

type RevealTextProps = {
  children: ReactNode
  /** Etiqueta semantica del texto. El wrapper que enmascara es siempre un span. */
  as?: ElementType
  /**
   * `scroll`: se revela al entrar en viewport. Para titulos de seccion.
   *
   * `mount`: arranca apenas hidrata, sin esperar interseccion.
   *
   * `none`: sin animacion. El texto se pinta en su posicion final desde el
   * HTML del servidor. Es la unica opcion que no toca el LCP para nada.
   */
  trigger?: 'scroll' | 'mount' | 'none'
  delay?: number
  className?: string
}

/**
 * Content Unmasking Reveal (CLAUDE.md seccion 3).
 *
 * Un contenedor con `overflow-hidden` recorta el texto, que entra desde abajo
 * pasando de `translate-y-full` a `translate-y-0`.
 *
 * OJO con donde va la deteccion de viewport: tiene que estar en la mascara, no
 * en el span que se mueve. El span animado arranca desplazado su propia altura
 * y queda 100% recortado por la mascara, y el IntersectionObserver tiene en
 * cuenta el recorte de los ancestros: reporta el elemento como fuera de vista,
 * la animacion nunca dispara y el texto queda invisible para siempre. Por eso
 * observa la mascara (que nunca esta recortada) y el estado baja al hijo por
 * variantes.
 *
 * Sobre LCP: la animacion mueve el texto, nunca toca `opacity`. Aun asi, en
 * `scroll` y `mount` el texto arranca recortado, o sea invisible en el primer
 * frame. **En el Hero no se usa**: ahi el titulo va estatico.
 *
 * Con `prefers-reduced-motion` el texto aparece directo en su lugar.
 */
export function RevealText({
  children,
  as: Tag = 'span',
  trigger = 'scroll',
  delay = 0,
  className,
}: RevealTextProps) {
  const prefersReducedMotion = useReducedMotion()
  const animated = trigger !== 'none' && !prefersReducedMotion

  if (!animated) {
    return <Tag className={className}>{children}</Tag>
  }

  const variants: Variants = {
    oculto: { y: '100%' },
    visible: {
      y: 0,
      transition: {
        duration: 0.7,
        delay,
        // Salida rapida y frenada suave: da la sensacion de que el texto
        // "aterriza" en vez de deslizarse.
        ease: [0.22, 1, 0.36, 1],
      },
    },
  }

  return (
    <Tag className={className}>
      {/*
        La mascara. inline-block obligatorio: un inline no respeta overflow.
        Es tambien el elemento observado.
      */}
      <motion.span
        className="inline-block overflow-hidden align-bottom"
        initial="oculto"
        {...(trigger === 'mount'
          ? { animate: 'visible' }
          : {
              whileInView: 'visible',
              viewport: { once: true, margin: '-10% 0px' },
            })}
      >
        <motion.span
          className="inline-block transform-gpu will-change-transform"
          variants={variants}
        >
          {children}
        </motion.span>
      </motion.span>
    </Tag>
  )
}
