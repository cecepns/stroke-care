module.exports = {
  env: {
    node: true,
    es2021: true
  },
  extends: [
    'eslint:recommended'
  ],
  parserOptions: {
    ecmaVersion: 12,
    sourceType: 'script'
  },
  rules: {
    'no-console': 'off',
    'no-unused-vars': ['error', { 'argsIgnorePattern': '^_' }]
  },
  globals: {
    require: 'readonly',
    process: 'readonly',
    module: 'readonly',
    exports: 'readonly',
    console: 'readonly',
    __dirname: 'readonly',
    __filename: 'readonly',
    global: 'readonly',
    Buffer: 'readonly',
    setImmediate: 'readonly',
    clearImmediate: 'readonly'
  }
};