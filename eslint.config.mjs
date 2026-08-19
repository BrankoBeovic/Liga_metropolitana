import nextCoreWebVitals from 'eslint-config-next/core-web-vitals'
import prettier from 'eslint-config-prettier/flat'

/**
 * Flat config de ESLint.
 *
 * `eslint-config-next/core-web-vitals` ya trae typescript-eslint, react,
 * react-hooks, jsx-a11y y las reglas de Core Web Vitals de Next, asi que no
 * hace falta componerlas a mano.
 *
 * `prettier` va ultimo: apaga las reglas de estilo que chocan con el
 * formateador. El formato lo decide Prettier, no ESLint.
 *
 * @type {import('eslint').Linter.Config[]}
 */
const config = [
  {
    ignores: [
      '.next/**',
      'out/**',
      'build/**',
      'coverage/**',
      'next-env.d.ts',
      // Generado por `pnpm supabase:types`, no se edita ni se lintea.
      'src/types/database.types.ts',
      'supabase/.temp/**',
    ],
  },
  ...nextCoreWebVitals,
  prettier,
]

export default config
