// 微信订阅消息模板ID，在微信公众平台申请后填入
const TEMPLATE_ID = 'dOESzhg-o8eoAz1dywQkZ9skZYKehBVgEiPAiKWxTH8'

// 请求订阅授权（静默处理，用户拒绝不报错）
export async function requestSubscribe(): Promise<boolean> {
  // `requestSubscribeMessage` 仅在微信小程序环境可用，H5 不支持。
  if (typeof uni.requestSubscribeMessage !== 'function') {
    console.log('[Subscribe] 当前环境不支持 requestSubscribeMessage')
    return false
  }

  return new Promise((resolve) => {
    uni.requestSubscribeMessage({
      tmplIds: [TEMPLATE_ID],
      success: (res: any) => {
        // accept = 用户同意，reject = 拒绝，ban = 已被后台封禁
        const status = res[TEMPLATE_ID]
        console.log('[Subscribe] 授权结果:', status)
        resolve(status === 'accept')
      },
      fail: (err: any) => {
        console.warn('[Subscribe] 授权调用失败:', err?.errMsg || err)
        resolve(false)
      }, // 静默失败，不打扰用户
    })
  })
}