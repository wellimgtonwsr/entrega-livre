import { io } from 'socket.io-client'

export const createSocket = (userId) => {
  return io(import.meta.env.VITE_SOCKET_URL || 'http://localhost:3000', {
    auth: { userId },
    transports: ['websocket'],
  })
}
