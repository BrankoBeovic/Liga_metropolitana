'use client'

import {
  motion,
  useMotionValue,
  useReducedMotion,
  useSpring,
} from 'framer-motion'
import { useCallback, useRef, type PointerEvent, type ReactNode } from 'react'

import { cn } from '@/lib/cn'

/** Inclinacion maxima en grados. CLAUDE.md acota el efecto a 4-6. */
const MAX_TILT_DEG = 5

const SPRING = { stiffness: 220, damping: 22, mass: 0.4 }

type SpotlightCardProps = {
  children: ReactNode
  className?: string
}

/**
 * Hover Life Card (CLAUDE.md seccion 3).
 *
 * Desktop: spotlight radial que sigue al cursor mas micro-tilt 3D.
 * Touch: nada de eso, solo `active:scale-[0.98]`.
 *
 * La separacion entre ambos mundos la hace `@media (hover: hover)`, tanto en
 * CSS (el overlay solo aparece ahi) como en JS (los handlers salen temprano si
 * el dispositivo no tiene hover real). Sin el corte en JS, un navegador movil
 * que emula pointer events dejaria la tarjeta trabada en angulo despues de un
 * tap.
 *
 * La posicion del spotlight se escribe directo en el DOM con `setProperty` en
 * vez de pasar por estado de React: un `useState` en `pointermove` re-renderiza
 * el arbol en cada pixel y tira abajo los 60 FPS.
 */
export function SpotlightCard({ children, className }: SpotlightCardProps) {
  const overlayRef = useRef<HTMLDivElement>(null)
  const prefersReducedMotion = useReducedMotion()

  const rotateX = useSpring(useMotionValue(0), SPRING)
  const rotateY = useSpring(useMotionValue(0), SPRING)

  const handlePointerMove = useCallback(
    (event: PointerEvent<HTMLDivElement>) => {
      if (prefersReducedMotion) return
      if (!window.matchMedia('(hover: hover)').matches) return

      const bounds = event.currentTarget.getBoundingClientRect()
      const offsetX = event.clientX - bounds.left
      const offsetY = event.clientY - bounds.top

      overlayRef.current?.style.setProperty('--spotlight-x', `${offsetX}px`)
      overlayRef.current?.style.setProperty('--spotlight-y', `${offsetY}px`)

      // -0.5 a 0.5 desde el centro de la tarjeta.
      const ratioX = offsetX / bounds.width - 0.5
      const ratioY = offsetY / bounds.height - 0.5

      // Signo invertido en X: mover el cursor hacia abajo tiene que hundir el
      // borde inferior, no levantarlo.
      rotateX.set(-ratioY * MAX_TILT_DEG * 2)
      rotateY.set(ratioX * MAX_TILT_DEG * 2)
    },
    [prefersReducedMotion, rotateX, rotateY]
  )

  const handlePointerLeave = useCallback(() => {
    rotateX.set(0)
    rotateY.set(0)
  }, [rotateX, rotateY])

  return (
    <motion.div
      onPointerMove={handlePointerMove}
      onPointerLeave={handlePointerLeave}
      style={{ rotateX, rotateY, transformPerspective: 900 }}
      className={cn(
        'group relative transform-gpu transition-transform duration-200 active:scale-[0.98]',
        className
      )}
    >
      {/*
        El spotlight sobre fondo oscuro sube al 26% del acento: sobre el blanco
        de la fuente el mismo halo al 22% ya se veia, y sobre `#15181E` a esa
        opacidad casi no se distinguia del fondo.
      */}
      <div
        ref={overlayRef}
        aria-hidden
        className={cn(
          'pointer-events-none absolute inset-0 z-10 rounded-[inherit] opacity-0 transition-opacity duration-300',
          '[@media(hover:hover)]:group-hover:opacity-100'
        )}
        style={{
          background:
            'radial-gradient(320px circle at var(--spotlight-x, 50%) var(--spotlight-y, 50%), color-mix(in oklab, var(--color-accent) 26%, transparent), transparent 70%)',
        }}
      />
      {children}
    </motion.div>
  )
}
