import { onMounted, onUnmounted } from 'vue'

/**
 * 轮询 Hook —— 替代 socket.io 实时推送
 * 小程序不支持 socket.io-client，用定时拉取代替
 */
export function usePolling(
  callback: () => void,
  interval = 3000,
  canRun?: () => boolean
) {
  let timer: ReturnType<typeof setInterval> | null = null

  onMounted(() => {
    timer = setInterval(() => {
      if (canRun && !canRun()) return
      callback()
    }, interval)
  })

  onUnmounted(() => {
    if (timer !== null) {
      clearInterval(timer)
      timer = null
    }
  })
}
