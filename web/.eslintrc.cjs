module.exports = {
  root: true,
  env: { browser: true, es2020: true },
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
    'plugin:react-hooks/recommended',
    'prettier',
  ],
  ignorePatterns: ['dist', '.eslintrc.cjs'],
  parser: '@typescript-eslint/parser',
  plugins: ['react-refresh'],
  rules: {
    'react-refresh/only-export-components': [
      'warn',
      { allowConstantExport: true },
    ],
    '@typescript-eslint/no-explicit-any': 'error',
    '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
    // Warn against unsafe date parsing to prevent timezone bugs
    // See: web/src/utils/date.utils.ts for safe alternatives
    'no-restricted-syntax': [
      'warn',
      {
        selector: 'NewExpression[callee.name="Date"][arguments.length=1][arguments.0.type="Literal"]',
        message:
          'Avoid new Date(string). Use parseDateSafe() from @/utils/date.utils to prevent timezone bugs.',
      },
    ],
  },
  overrides: [
    {
      // Disable unsafe date parsing rule for test files
      // Test fixtures often need fixed dates for mocking
      files: ['**/*.test.ts', '**/*.test.tsx', '**/tests/**/*.ts', '**/tests/**/*.tsx'],
      rules: {
        'no-restricted-syntax': 'off',
      },
    },
  ],
};
