import { AlertCircle, CheckCircle2 } from 'lucide-react'

type ResultadoProps = {
  estado: { error: string | null; ok: string | null }
}

/**
 * El aviso de exito o de error de un formulario.
 *
 * `role="status"` para el exito y `role="alert"` para el error, que es la
 * diferencia entre "cuando puedas" y "ahora": un lector de pantalla interrumpe
 * lo que esta leyendo para anunciar una alerta, y eso corresponde solo cuando
 * hay algo que corregir.
 *
 * El color no es lo unico que distingue los dos casos: cada uno lleva su icono
 * y su texto. Quien no distingue verde de dorado tiene que poder saber si el
 * mensaje salio.
 */
export function Resultado({ estado }: ResultadoProps) {
  if (estado.error) {
    return (
      <p
        role="alert"
        className="text-ink flex items-start gap-2.5 rounded-xl bg-red-500/10 px-4 py-3 text-sm ring-1 ring-red-500/30"
      >
        <AlertCircle
          aria-hidden
          className="mt-0.5 size-4 shrink-0 text-red-400"
        />
        {estado.error}
      </p>
    )
  }

  if (estado.ok) {
    return (
      <p
        role="status"
        className="text-ink bg-accent/10 border-accent/40 flex items-start gap-2.5 rounded-xl border px-4 py-3 text-sm"
      >
        <CheckCircle2
          aria-hidden
          className="text-accent mt-0.5 size-4 shrink-0"
        />
        {estado.ok}
      </p>
    )
  }

  return null
}
