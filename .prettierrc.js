// ==============================================
// Vue3 + Vite + TypeScript 项目 Prettier 最佳实践配置
// ==============================================

export default {
  // 每行最大长度，超出会换行
  printWidth: 180,

  // 缩进空格数
  tabWidth: 2,

  // 不使用制表符
  useTabs: false,

  // 语句末尾添加分号
  semi: true,

  // 字符串使用单引号（社区主流推荐）
  singleQuote: true,

  // 尾随逗号：对象/数组等使用（ES5 支持的地方）
  trailingComma: "es5",

  // 对象字面量、解构、导入导出的大括号内是否加空格
  bracketSpacing: true,

  // 箭头函数参数只有一个时是否加括号
  arrowParens: "always",

  // HTML / JSX / Vue 模板标签右括号是否与内容同一行
  bracketSameLine: false,

  // HTML 空白敏感度（'css' 为推荐值）
  htmlWhitespaceSensitivity: "css",

  // Vue 单行标签属性是否每个属性独占一行（false 表示允许一行多个属性）
  singleAttributePerLine: false,

  // Vue 文件中缩进 script 和 style 标签内的代码
  vueIndentScriptAndStyle: true,

  // 对象属性引号风格：保持一致性
  quoteProps: "consistent",

  // 行尾换行符：LF，和 Git 保持一致
  endOfLine: "lf",

  // 针对不同文件类型自定义解析器
  overrides: [
    {
      files: ["*.vue"],
      options: {
        parser: "vue",
      },
    },
    {
      files: ["*.ts", "*.tsx"],
      options: {
        parser: "typescript",
      },
    },
    {
      files: ["*.js", "*.jsx"],
      options: {
        parser: "babel",
      },
    },
    {
      files: ["*.css"],
      options: {
        parser: "css",
      },
    },
    {
      files: ["*.scss", "*.sass"],
      options: {
        parser: "scss",
      },
    },
    {
      files: ["*.less"],
      options: {
        parser: "less",
      },
    },
  ],
  plugins: ["@trivago/prettier-plugin-sort-imports"],
  // --- Import 排序规则 ---
  importOrder: [
    "^vue",
    "^react",
    "<THIRD_PARTY_MODULES>",
    "^@/components/(.*)$",
    "^@/views/(.*)$",
    "^@/assets/(.*)$",
    "^@/(.*)$", // 兜底所有 @ 开头的别名
    "^[./]", // 相对路径
    "<THIRD_PARTY_TS_TYPES>", // 第三方类型导入
    "<TS_TYPES>", // 本地类型导入
  ],
  importOrderSeparation: true,
  importOrderSortSpecifiers: true,
};
