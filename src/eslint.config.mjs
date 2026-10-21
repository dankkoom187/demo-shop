/* ESLint flat config для статического прототипа.
   Запуск: npm run lint  (без зависимостей от глобальных пакетов) */

const browserGlobals = {
  window: 'readonly',
  document: 'readonly',
  location: 'readonly',
  navigator: 'readonly',
  console: 'readonly',
  setTimeout: 'readonly',
  clearTimeout: 'readonly',
  requestAnimationFrame: 'readonly',
  URLSearchParams: 'readonly',
  URL: 'readonly',
  Intl: 'readonly',
  Event: 'readonly',
  Node: 'readonly',
  Element: 'readonly',
  HTMLInputElement: 'readonly',
  getComputedStyle: 'readonly',
  FormData: 'readonly',
  localStorage: 'readonly',
  performance: 'readonly',
  fetch: 'readonly'
};

export default [
  {
    files: ['**/*.js', '**/*.mjs'],
    ignores: ['node_modules/**'],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'script',
      globals: browserGlobals
    },
    rules: {
      'no-undef': 'error',
      'no-unused-vars': ['warn', { args: 'after-used', argsIgnorePattern: '^_' }],
      'no-console': 'off',
      eqeqeq: ['error', 'smart'],
      'no-var': 'error',
      'prefer-const': 'warn',
      'no-implicit-globals': 'error',
      'no-unused-expressions': ['error', { allowShortCircuit: true }],
      'no-fallthrough': 'error'
    }
  },
  {
    files: ['**/*.mjs'],
    languageOptions: { sourceType: 'module' }
  },
  {
    files: ['tools/**/*.js'],
    languageOptions: {
      sourceType: 'commonjs',
      globals: {
        require: 'readonly',
        module: 'writable',
        process: 'readonly',
        __dirname: 'readonly',
        console: 'readonly'
      }
    }
  }
];
