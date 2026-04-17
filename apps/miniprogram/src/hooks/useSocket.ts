import { useEffect } from 'react'
import { io } from 'socket.io-client'

export function useStaffSocket(onEventUpdated?: () => void) {
  useEffect(() => {
    const token = localStorage.getItem('staff_token')
    const socket = io('http://localhost:3000', { auth: { token } })
    socket.on('connect', () => {
      console.log('Socket connected:', socket.id)
    })
    socket.on('event_updated', (data) => {
      console.log('event_updated received:', data)
      window.dispatchEvent(new CustomEvent('refresh_events'))
      onEventUpdated?.()
    })
    return () => { socket.disconnect() }
  }, [onEventUpdated])
}
