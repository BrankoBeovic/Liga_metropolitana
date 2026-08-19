import type { Metadata } from 'next'
import Link from 'next/link'

import { LoginForm } from '@/components/admin/LoginForm'
import { SITE_NAME } from '@/lib/navigation'

export const metadata: Metadata = { title: 'Entrar' }

type Props = { searchParams: Promise<{ redirectTo?: string }> }

export default async function LoginPage({ searchParams }: Props) {
  const { redirectTo } = await searchParams

  return (
    <main className="flex min-h-dvh items-center justify-center px-5 py-12">
      <div className="w-full max-w-sm">
        <h1 className="font-display text-ink text-2xl font-bold tracking-tight">
          {SITE_NAME}
        </h1>
        <p className="text-ink/55 mt-1 text-sm">
          Panel de redacción. Solo para el equipo.
        </p>

        <LoginForm redirectTo={redirectTo} />

        {/*
          Sin enlace de "crear cuenta": el registro publico esta deshabilitado
          en Supabase Auth y los editores se crean por invitacion (CLAUDE.md
          seccion 7). Ofrecer el enlace seria prometer algo que no existe.
        */}
        <p className="text-ink/45 mt-6 text-xs leading-relaxed">
          ¿No tienes cuenta? Las cuentas de editor se crean por invitación.
          Escribe a quien administra el sitio.
        </p>

        <Link
          href="/"
          className="text-ink/50 hover:text-accent mt-6 inline-flex min-h-11 items-center text-sm transition-colors"
        >
          ← Volver al sitio
        </Link>
      </div>
    </main>
  )
}
