import type { Metadata } from 'next'

import { AdminShell } from '@/components/admin/AdminShell'
import { PasswordForm } from '@/components/admin/PasswordForm'
import {
  ProfileForm,
  type PerfilEditable,
} from '@/components/admin/ProfileForm'
import { requerirSesion } from '@/lib/admin/session'

import { createClient } from '@/lib/supabase/server'

export const metadata: Metadata = { title: 'Mi perfil' }
export const dynamic = 'force-dynamic'

export default async function PerfilPage() {
  // Cualquier usuario del equipo, y cada uno edita el suyo. No hay pantalla
  // para editar el perfil de otra persona: la politica `profiles_update` deja
  // al admin hacerlo, pero cambiarle la bio a un colega no es una tarea que
  // valga una interfaz.
  const sesion = await requerirSesion()
  const supabase = await createClient()

  const { data } = await supabase
    .from('profiles')
    .select('id, full_name, bio, avatar_url, twitter_url, instagram_url')
    .eq('id', sesion.userId)
    .maybeSingle()

  /*
    Respaldo por si la fila todavia no existe.

    El trigger `handle_new_user` la crea al dar de alta el usuario, asi que en
    la practica siempre esta. Pero si por lo que sea falta, es mejor mostrar el
    formulario vacio con el nombre de la sesion que una pantalla de error: al
    guardar, el update simplemente no encuentra fila y lo dice.
  */
  const perfil: PerfilEditable = data ?? {
    id: sesion.userId,
    full_name: sesion.fullName,
    bio: null,
    avatar_url: null,
    twitter_url: null,
    instagram_url: null,
  }

  return (
    <AdminShell
      sesion={sesion}
      titulo="Mi perfil"
      descripcion="Así te ven los lectores en tus notas."
    >
      <div className="max-w-3xl">
        <section className="rounded-xl p-6 ring-1 ring-black/5">
          <ProfileForm perfil={perfil} />
        </section>

        {/*
          Seccion aparte y no un campo mas del perfil: son dos tareas distintas,
          y guardar la bio no deberia pedir la contraseña actual.
        */}
        <section
          aria-labelledby="password-titulo"
          className="mt-6 rounded-xl p-6 ring-1 ring-black/5"
        >
          <h2
            id="password-titulo"
            className="font-display text-ink text-base font-bold tracking-tight"
          >
            Cambiar contraseña
          </h2>
          <p className="text-ink/55 mt-1 mb-4 text-[13px]">
            Se pide la actual para que una sesión abierta y olvidada no alcance
            para dejarte afuera de tu propia cuenta.
          </p>
          <PasswordForm />
        </section>

        <div className="mt-6 rounded-xl bg-black/[0.03] p-5">
          <p className="text-ink/65 text-[13px] leading-relaxed">
            Tu perfil sale al pie de cada nota que firmes.{' '}
            {sesion.esAdmin
              ? 'Como admin puedes editar todo el contenido del sitio.'
              : 'Como editora o editor puedes crear y publicar tus propias notas.'}
          </p>
          <p className="text-ink/45 mt-2 text-xs">
            El correo ({sesion.email ?? 'sin correo'}) y el rol no se cambian
            desde acá: los maneja quien administra las cuentas.
          </p>
        </div>
      </div>
    </AdminShell>
  )
}
