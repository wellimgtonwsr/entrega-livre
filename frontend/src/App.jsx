import { AuthProvider } from './context/AuthContext'
import { SocketProvider } from './context/SocketContext'
import AppRouter from './router/AppRouter'
import OfflineBanner from './components/OfflineBanner'

export default function App() {
  return (
    <AuthProvider>
      <SocketProvider>
        <OfflineBanner />
        <AppRouter />
      </SocketProvider>
    </AuthProvider>
  )
}
