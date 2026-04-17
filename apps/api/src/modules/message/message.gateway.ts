import { WebSocketGateway, WebSocketServer, OnGatewayConnection } from '@nestjs/websockets'
import { Server, Socket } from 'socket.io'

@WebSocketGateway({
  cors: {
    // 回显请求来源，避免多端本地联调（8000/8001/8002）时出现 CORS 头不匹配
    origin: true,
    credentials: true,
  },
})
export class MessageGateway implements OnGatewayConnection {
  @WebSocketServer()
  server: Server

  handleConnection(client: Socket) {
    const auth = client.handshake.auth as { userId?: number; token?: string } | undefined
    let userId = auth?.userId

    // 兼容前端仅传 token 的场景，解析 payload 中的 sub 作为 userId
    if (!userId && auth?.token) {
      try {
        const payload = auth.token.split('.')[1]
        const normalized = payload.replace(/-/g, '+').replace(/_/g, '/')
        const decoded = JSON.parse(Buffer.from(normalized, 'base64').toString())
        userId = decoded?.sub
      } catch {
        // ignore token parse errors
      }
    }

    if (userId) client.join(`user_${userId}`)
  }

  sendToUser(userId: number, data: any) {
    this.server.to(`user_${userId}`).emit('new_message', data)
  }
}
