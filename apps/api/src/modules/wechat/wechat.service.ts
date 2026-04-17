import { Injectable } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import axios from 'axios'

@Injectable()
export class WechatService {
  constructor(private config: ConfigService) {}

  private cachedToken: string | null = null
  private tokenExpiresAt = 0   // Unix ms

  // 获取微信 access_token，有效期内复用缓存，提前 5 分钟刷新
  private async getAccessToken(): Promise<string> {
    if (this.cachedToken && Date.now() < this.tokenExpiresAt) {
      return this.cachedToken
    }
    const appid = this.config.get('WX_APPID')
    const secret = this.config.get('WX_SECRET')
    if (!appid || !secret) {
      throw new Error('缺少 WX_APPID / WX_SECRET 配置')
    }
    const url = `https://api.weixin.qq.com/cgi-bin/token?grant_type=client_credential&appid=${appid}&secret=${secret}`
    const { data } = await axios.get(url)
    if (!data?.access_token) {
      throw new Error(`获取 access_token 失败: ${JSON.stringify(data)}`)
    }
    this.cachedToken = data.access_token as string
    // 微信 token 有效期 7200s，提前 5 分钟过期以留出刷新余量
    this.tokenExpiresAt = Date.now() + (data.expires_in - 300) * 1000
    return this.cachedToken
  }

  // 发送订阅消息
  async sendSubscribeMessage(params: {
    openid: string // 用户的微信 openid
    title: string // 事件标题
    location: string // 事件位置
    level: string // 告警等级
    time: string // 发生时间
  }) {
    try {
      const accessToken = await this.getAccessToken()
      const templateId = this.config.get('WX_SUBSCRIBE_TEMPLATE_ID')
      if (!templateId) {
        console.warn('[Wechat] 缺少 WX_SUBSCRIBE_TEMPLATE_ID，跳过发送')
        return false
      }

      const { data } = await axios.post(
        `https://api.weixin.qq.com/cgi-bin/message/subscribe/send?access_token=${accessToken}`,
        {
          touser: params.openid,
          template_id: templateId,
          page: 'pages/orders/index', // 点击消息跳转的页面
          data: {
            thing1: { value: params.title }, // 模板字段按实际申请的填
            thing2: { value: params.location },
            thing3: { value: params.level === 'high' ? '高危' : '中危' },
            time4: { value: params.time },
          },
        },
      )
      if (data?.errcode && data.errcode !== 0) {
        console.warn('[Wechat] 订阅消息发送失败:', data)
        return false
      }
      console.log('[Wechat] 订阅消息发送成功', {
        openid: `${params.openid.slice(0, 6)}***`,
        title: params.title,
      })
      return true
    } catch (err) {
      // 订阅消息失败不影响主流程，静默处理
      console.warn('订阅消息发送失败:', err?.response?.data || err.message)
      return false
    }
  }

  /** 使用 wx.login(code) 换取 openid（小程序） */
  async getOpenidByCode(code: string): Promise<string | null> {
    const appid = this.config.get('WX_APPID')
    const secret = this.config.get('WX_SECRET')
    if (!appid || !secret || !code) return null
    try {
      const url = `https://api.weixin.qq.com/sns/jscode2session?appid=${appid}&secret=${secret}&js_code=${code}&grant_type=authorization_code`
      const { data } = await axios.get(url)
      if (data?.openid) return data.openid as string
      console.warn('[Wechat] jscode2session 未返回 openid:', data)
      return null
    } catch (err) {
      console.warn('[Wechat] jscode2session 失败:', err?.response?.data || err?.message)
      return null
    }
  }
}