'use client'

import { motion, useReducedMotion } from 'framer-motion'
import type { ReactNode } from 'react'

/** Milisegundos de retraso que suma cada tarjeta sobre la anterior. */
const STAGGER_MS = 50

/** A partir de esta posicion el retraso deja de crecer. */
const MAX_STAGGER_STEPS = 8

type MotionCardProps = {
  children: ReactNode
  /**
   * Posicion de la tarjeta en su grilla. Define el retraso del stagger.
   * Se pasa explicito en vez de deducirlo con un contexto para que el
   * componente sirva igual suelto que dentro de una lista.
   */
  index?: number
  className?: string
}

/**
 * Fade Up on Scroll (CLAUDE.md seccion 3): `y: 24 -> 0`, `opacity: 0 -> 1`,
 * con +50ms de stagger por tarjeta.
 *
 * NO usar en el Hero: arranca en `opacity: 0` y eso penaliza el LCP, que es
 * justo lo que CLAUDE.md pide cuidar ahi. El Hero va estatico.
 *
 * El tope de stagger evita que la tarjeta 30 de un feed largo tarde un segundo
 * y medio en aparecer.
 */
export function MotionCard({
  children,
  index = 0,
  className,
}: MotionCardProps) {
  const prefersReducedMotion = useReducedMotion()

  if (prefersReducedMotion) {
    return <div className={className}>{children}</div>
  }

  const delay = (Math.min(index, MAX_STAGGER_STEPS) * STAGGER_MS) / 1000

  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-10% 0px' }}
      transition={{ duration: 0.5, delay, ease: [0.22, 1, 0.36, 1] }}
      style={{ willChange: 'transform, opacity' }}
    >
      {children}
    </motion.div>
  )
}
