import eslint from '@eslint/js';
import tseslint from 'typescript-eslint';
import prettier from 'eslint-config-prettier';
import globals from 'globals';

export default tseslint.config(
  {
    ignores: [
      '**/node_modules/**',
      '**/dist/**',
      '**/.next/**',
      '**/coverage/**',
      '**/typechain-types/**',
      '**/artifacts/**',
      '**/cache/**',
      '**/jest.config.js',
      '**/next-env.d.ts',
      'eslint.config.mjs',
      'apps/web/postcss.config.mjs',
    ],
  },
  {
    files: ['**/*.{ts,tsx}'],
    extends: [eslint.configs.recommended, ...tseslint.configs.recommended, prettier],
  },
  {
    files: ['**/*.mjs'],
    extends: [eslint.configs.recommended, prettier],
    languageOptions: {
      globals: globals.node,
      sourceType: 'module',
    },
  },
);
