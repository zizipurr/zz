export type AnyFn = (...args: any[]) => any

/**
 * 按钮防连点（leading）
 * - 默认首次立即执行
 * - 冷却时间内重复触发直接丢弃
 * - 支持 async：等待 fn 结束后再开始冷却
 */
export function withTapDebounce<T extends AnyFn>(fn: T, cooldownMs = 700): T {
  let locked = false
  let timer: ReturnType<typeof setTimeout> | null = null

  const wrapped = (async (...args: Parameters<T>) => {
    if (locked) return
    locked = true
    try {
      return await fn(...args)
    } finally {
      if (timer) clearTimeout(timer)
      timer = setTimeout(() => {
        locked = false
      }, cooldownMs)
    }
  }) as unknown as T

  return wrapped
}

