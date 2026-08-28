import { defineConfig, globalIgnores } from 'eslint/config';
// @ts-expect-error -- no types for eslint-config-next flat exports
import nextVitals from 'eslint-config-next/core-web-vitals';
// @ts-expect-error -- no types for eslint-config-next flat exports
import nextTs from 'eslint-config-next/typescript';

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  globalIgnores([
    '.next/**',
    'out/**',
    'build/**',
    'node_modules/**',
    'next-env.d.ts',
  ]),
  {
    rules: {
      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }],
      'react-hooks/exhaustive-deps': 'error',
      '@typescript-eslint/no-require-imports': 'error',
    },
  },
]);

export default eslintConfig;
