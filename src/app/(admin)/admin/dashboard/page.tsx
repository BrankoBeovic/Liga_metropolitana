import type { Metadata } from 'next'
import Link from 'next/link'

import { AdminShell } from '@/components/admin/AdminShell'
import { requerirSesion } from '@/lib/admin/session'
import { getReelsInstagram, REELS_EN_PORTADA } from '@/lib/instagram'
import { createClient } from '@/lib/supabase/server'

export const metadata: Metadata = { title: 'Inicio' }

/**
 * El CMS nunca se cachea.
 *
 * Lee datos que dependen del usuario logueado y muestra borradores. Servir una
 * version estatica aca significaria mostrarle a un editor el panel de otro.
 */
export const dynamic = 'force-dynamic'

export default async function DashboardPage() {
  const sesion = await requerirSesion()
  const supabase = await createClient()

  // Las consultas pasan por RLS con la identidad del usuario: un editor cuenta
  // solo lo suyo y un admin cuenta todo, sin que haya que filtrar aca.
  const [publicados, borradores, reels, sponsors, documentos, jugadores] =
    await Promise.all([
      supabase
        .from('posts')
        .select('id', { count: 'exact', head: true })
        .eq('status', 'published'),
      supabase
        .from('posts')
        .select('id', { count: 'exact', head: true })
        .eq('status', 'draft'),
      /*
        Los Reels no se cuentan en la base: se preguntan a la misma funcion que
        usa la portada. Sin token configurado la lista llega vacia y la tarjeta
        muestra 0, que es exactamente lo que el sitio esta mostrando.
      */
      getReelsInstagram(REELS_EN_PORTADA),
      supabase.from('sponsors').select('id', { count: 'exact', head: true }),
      supabase
        .from('documents')
        .select('id', { count: 'exact', head: true })
        .eq('is_active', true),
      supabase.from('players').select('id', { count: 'exact', head: true }),
    ])

  return (
    <AdminShell
      sesion={sesion}
      titulo={`Hola, ${sesion.fullName.split(' ')[0]}`}
      descripcion={
        sesion.esAdmin
          ? 'Puedes ver y editar todo el contenido del sitio.'
          : 'Puedes ver y editar tus propias notas.'
      }
      acciones={
        <Link
          href="/admin/noticias/nueva"
          className="bg-accent font-display flex h-11 items-center rounded-lg px-4 text-sm font-bold text-white"
        >
          Nueva nota
        </Link>
      }
    >
      <ul className="grid gap-4 sm:grid-cols-3">
        <Tarjeta
          titulo="Publicadas"
          valor={publicados.count}
          href="/admin/noticias"
        />
        <Tarjeta
          titulo="Borradores"
          valor={borradores.count}
          href="/admin/noticias"
        />
        {/*
          Sin enlace, a diferencia de las otras: no hay pantalla de Reels y no
          va a haberla. Se publican en Instagram y el sitio los toma solo.
        */}
        <Tarjeta titulo="Reels en portada" valor={reels.length} />
        <Tarjeta
          titulo="Sponsors"
          valor={sponsors.count}
          href="/admin/sponsors"
        />
        <Tarjeta
          titulo="Documentos"
          valor={documentos.count}
          href="/admin/documentos"
        />
        <Tarjeta
          titulo="Jugadores"
          valor={jugadores.count}
          href="/admin/jugadores"
        />
      </ul>
    </AdminShell>
  )
}

/**
 * Tarjeta de numero del tablero.
 *
 * `href` es opcional: una tarjeta sin pantalla a donde ir se dibuja igual pero
 * sin enlace. Un enlace que no lleva a ningun lado es peor que ninguno.
 */
function Tarjeta({
  titulo,
  valor,
  href,
}: {
  titulo: string
  valor: number | null
  href?: string
}) {
  const contenido = (
    <>
      <p className="font-display text-ink/45 text-[11px] font-bold tracking-[0.16em] uppercase">
        {titulo}
      </p>
      <p className="font-display text-ink mt-2 text-3xl font-bold tracking-tight">
        {valor ?? '-'}
      </p>
    </>
  )

  return (
    <li>
      {href ? (
        <Link
          href={href}
          className="hover:ring-accent/30 block rounded-xl p-5 ring-1 ring-black/5 transition-shadow"
        >
          {contenido}
        </Link>
      ) : (
        <div className="rounded-xl p-5 ring-1 ring-black/5">{contenido}</div>
      )}
    </li>
  )
}
