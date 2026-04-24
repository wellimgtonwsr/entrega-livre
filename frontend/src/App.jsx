import { AuthProvider } from './context/AuthContext'
import { SocketProvider } from './context/SocketContext'
import AppRouter from './router/AppRouter'

export default function App() {
  return (
    <AuthProvider>
      <SocketProvider>
        <AppRouter />
      </SocketProvider>
    </AuthProvider>
  )
}
