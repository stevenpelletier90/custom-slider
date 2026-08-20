import js from '@eslint/js';
import prettier from 'eslint-config-prettier';
import globals from 'globals';

const sharedRules = {
  ...js.configs.recommended.rules,
  'no-unused-vars': ['warn', { args: 'none' }],
};

export default [
  {
    ignores: ['dist/**', 'node_modules/**', 'demo/img/**', 'demo/assets/vendor/**', '.claude/**'],
  },
  {
    // Demo-page chrome: a plain deferred script, no modules and no bundler.
    files: ['demo/assets/**/*.js'],
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'script',
      globals: {
        ...globals.browser,
      },
    },
    rules: sharedRules,
  },
  {
    // Carousel source: ES modules bundled to a classic script by esbuild.
    files: ['src/**/*.js'],
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      globals: {
        ...globals.browser,
      },
    },
    rules: sharedRules,
  },
  {
    // Node-side tooling: .mjs helpers plus the .js Claude format hook
    // ("type": "module" makes both ESM).
    files: ['scripts/**/*.{js,mjs}', '*.config.js'],
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      globals: {
        ...globals.nodeBuiltin,
      },
    },
    rules: sharedRules,
  },
  prettier,
];
