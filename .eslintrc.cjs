module.exports = {
  extends: [
    // add more generic rulesets here, such as:
    // 'eslint:recommended',
    'plugin:vue/vue3-recommended',
    // 'plugin:vue/recommended' // Use this if you are using Vue.js 2.x.
    '@vue/eslint-config-typescript',
    'plugin:prettier/recommended',
  ],
  rules: {
    indent: ['error', 2],
    semi: [2, 'always'],
    'object-curly-spacing': ['error', 'always'],
    'key-spacing': ['error', { beforeColon: false }],
  },
  ignorePatterns: ['.eslintrc.cjs', 'dist'],
};
