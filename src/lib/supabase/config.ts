/**
 * Credenciales publicas de Supabase, validadas una sola vez.
 *
 * Next reemplaza `process.env.NEXT_PUBLIC_*` en tiempo de build, pero solo
 * cuando la referencia esta escrita literal. Por eso se leen aca de forma
 * explicita y no con destructuring dinamico.
 */

function required(value: string | undefined, name: string): string {
  if (!value) {
    throw new Error(
      `Falta la variable de entorno ${name}. Copiar .env.example a .env.local y completarla.`
    )
  }
  return value
}

export const SUPABASE_URL = required(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  'NEXT_PUBLIC_SUPABASE_URL'
)

/**
 * Clave publicable: viaja al navegador a proposito. No es un secreto, y no
 * hace falta que lo sea: lo que protege los datos son las politicas RLS.
 *
 * La contraparte secreta (`SUPABASE_SECRET_KEY`) no se lee en este modulo
 * justamente para que no pueda colarse en un bundle de cliente por importarlo
 * desde el lugar equivocado.
 */
export const SUPABASE_PUBLISHABLE_KEY = required(
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
  'NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY'
)
