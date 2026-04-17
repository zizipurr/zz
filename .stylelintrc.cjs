module.exports = {
  extends: ['stylelint-config-standard', 'stylelint-config-recommended-vue', 'stylelint-config-recess-order'],
  customSyntax: 'postcss-less',
  // ===== vue项目要增加的配置项============
  overrides: [
    {
      files: ['**/*.vue'],
      customSyntax: 'postcss-html', // 确保路径正确
    },
  ],
  // ======================================
  rules: {
    'no-descending-specificity': null,
    'font-family-no-missing-generic-family-keyword': null,
    // 完全移除该规则的配置，让继承的规则生效
  },
};
