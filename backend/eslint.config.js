module.exports = [
  {
    ignores: ['node_modules/**', 'dist/**', 'coverage/**', 'src/**', 'tests/**'],
  },
  {
    files: ['*.js', '*.mjs'],
    rules: {
      'no-unused-vars': 'off',
    },
  },
];
