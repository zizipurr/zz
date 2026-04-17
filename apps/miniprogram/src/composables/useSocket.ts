import { io, Socket } from 'socket.io-client'

let socketInstance: Socket | null = null

export function useSocket() {
  if (!socketInstance) {
    const token = uni.getStorageSync('staff_token') as string
    const wsUrl = import.meta.env.VITE_WS_URL as string
    const wsPath = (import.meta.env.VITE_WS_PATH as string) || '/socket.io'
    socketInstance = io(wsUrl, {
      path: wsPath,
      auth: { token },
      transports: ['websocket'],
    })
    socketInstance.on('connect', () => {
      console.log('[Socket] connected:', socketInstance!.id)
    })
    socketInstance.on('disconnect', () => {
      console.log('[Socket] disconnected')
    })
  }

  return {
    socket: socketInstance,
    on: (event: string, handler: (...args: any[]) => void) => {
      socketInstance!.on(event, handler)
    },
    off: (event: string, handler?: (...args: any[]) => void) => {
      socketInstance!.off(event, handler)
    },
    emit: (event: string, ...args: any[]) => {
      socketInstance!.emit(event, ...args)
    },
    disconnect: () => {
      socketInstance?.disconnect()
      socketInstance = null
    },
  }
}