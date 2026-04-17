export type formatDateOptions = {
  /** 是否展示时分秒，默认 `true`；设为 `false` 则仅年月日 */
  time?: boolean
}

function parseDate(dateInput: string | number | Date): Date | null {
  const d = dateInput instanceof Date ? dateInput : new Date(dateInput)
  return Number.isNaN(d.getTime()) ? null : d
}

function invalidFallback(dateInput: string | number | Date): string {
  return typeof dateInput === 'string' ? dateInput : ''
}

/**
 * 中文本地化日期时间。
 * - 默认含时分秒，例：`2026年4月16日 18:56:47`
 * - `formatDate(iso, { time: false })` 仅年月日
 * 手动拼接避免依赖 Intl API（微信小程序不完整支持）
 */
export function formatDate(
  dateInput: string | number | Date,
  options?: formatDateOptions,
): string {
  const d = parseDate(dateInput)
  if (!d) return invalidFallback(dateInput)

  const year = d.getFullYear()
  const month = d.getMonth() + 1
  const day = d.getDate()

  if (options?.time === false) {
    return `${year}年${month}月${day}日`
  }

  const hh = String(d.getHours()).padStart(2, '0')
  const mm = String(d.getMinutes()).padStart(2, '0')
  const ss = String(d.getSeconds()).padStart(2, '0')
  return `${year}年${month}月${day}日 ${hh}:${mm}:${ss}`
}

