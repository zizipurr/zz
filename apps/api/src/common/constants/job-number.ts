/** 工号前缀（全局） */
export const JOB_NUMBER_PREFIX = 'GR-' as const

/** 前缀后的数字位数（全局唯一键为完整字符串，如 GR-10001） */
export const JOB_NUMBER_SUFFIX_DIGITS = 5

/** 小程序注册分配：GR-10000 … GR-99999（首位为 1） */
export const JOB_NUMBER_REGISTER_NUMERIC_MIN = 10000
export const JOB_NUMBER_REGISTER_NUMERIC_MAX = 99999

export function formatJobNumber(numeric: number): string {
  return `${JOB_NUMBER_PREFIX}${String(numeric).padStart(JOB_NUMBER_SUFFIX_DIGITS, '0')}`
}
