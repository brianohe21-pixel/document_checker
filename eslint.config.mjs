import eslint from '@eslint/js';
import tseslint from 'typescript-eslint';
import prettier from 'eslint-config-prettier';

export default tseslint.config(
  eslint.configs.recommended,
  ...tseslint.configs.recommended,
  prettier,
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
    ],
  },
);
