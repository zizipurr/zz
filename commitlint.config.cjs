// 这是多个前端项目的commitlint共享配置文件，请勿轻易修改

const headerPattern = (parsed, when = "always", value = ".*") => {
  const header = parsed.header || "";
  // 如果 value 是字符串，则转换成正则表达式
  const regex = typeof value === "string" ? new RegExp(value) : value;
  const isMatch = regex.test(header);
  const pass = when === "always" ? isMatch : !isMatch;
  return [pass, `header ${when === "always" ? "must match" : "must not match"} pattern ${regex}`];
};

module.exports = {
  extends: ["@commitlint/config-conventional"],
  rules: {
    // 例如允许中文或长度规则等
    "subject-empty": [2, "never"],
    "header-max-length": [2, "always", 100],
    "subject-case": [0], // 允许中文或大小写自由
    // 校验提交信息的头部格式，要求必须以 Issue ID 结尾 (例如: #1354#1356)
    "header-pattern": [2, "always", /^(config|build|ci|docs|feat|fix|perf|refactor|revert|style|test|chore)(\([^)]+\))?: .+ (#[0-9]+)+$/],
    // 限制提交类型枚举
    "type-enum": [2, "always", ["config", "build", "ci", "docs", "feat", "fix", "perf", "refactor", "revert", "style", "test", "chore"]]
  },
  plugins: [
    {
      rules: {
        "header-pattern": headerPattern
      }
    }
  ]
};
