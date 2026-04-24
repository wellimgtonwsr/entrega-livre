import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

// Auth
import Splash from '../pages/auth/Splash'
import Login from '../pages/auth/Login'
import Cadastro from '../pages/auth/Cadastro'

// Cliente
import NovoPedido from '../pages/cliente/NovoPedido'
import AguardandoOfertas from '../pages/cliente/AguardandoOfertas'
import Acompanhar from '../pages/cliente/Acompanhar'
import AvaliarCliente from '../pages/cliente/Avaliar'
import HistoricoCliente from '../pages/cliente/Historico'

// Motoboy
import Dashboard from '../pages/motoboy/Dashboard'
import PedidoDetalhe from '../pages/motoboy/PedidoDetalhe'
import EmAndamento from '../pages/motoboy/EmAndamento'
import AvaliarMotoboy from '../pages/motoboy/Avaliar'
import Assinatura from '../pages/motoboy/Assinatura'
import HistoricoMotoboy from '../pages/motoboy/Historico'

// Admin
import Painel from '../pages/admin/Painel'

function PrivateRoute({ children, roles }) {
  const { user, loading } = useAuth()
  if (loading) return <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100dvh' }}>Carregando...</div>
  if (!user) return <Navigate to="/login" replace />
  if (roles && !roles.includes(user.role)) return <Navigate to="/" replace />
  return children
}

export default function AppRouter() {
  const { user, loading } = useAuth()

  if (loading) return <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100dvh' }}>Carregando...</div>

  const homeRedirect = () => {
    if (!user) return <Navigate to="/splash" replace />
    if (user.role === 'CLIENT') return <Navigate to="/cliente/novo-pedido" replace />
    if (user.role === 'MOTOBOY') return <Navigate to="/motoboy/dashboard" replace />
    if (user.role === 'ADMIN') return <Navigate to="/admin" replace />
    return <Navigate to="/splash" replace />
  }

  return (
    <BrowserRouter basename="/entrega-livre">
      <Routes>
        <Route path="/" element={homeRedirect()} />
        <Route path="/splash" element={<Splash />} />
        <Route path="/login" element={<Login />} />
        <Route path="/cadastro" element={<Cadastro />} />

        {/* Cliente */}
        <Route path="/cliente/novo-pedido" element={<PrivateRoute roles={['CLIENT']}><NovoPedido /></PrivateRoute>} />
        <Route path="/cliente/aguardando/:pedidoId" element={<PrivateRoute roles={['CLIENT']}><AguardandoOfertas /></PrivateRoute>} />
        <Route path="/cliente/acompanhar/:pedidoId" element={<PrivateRoute roles={['CLIENT']}><Acompanhar /></PrivateRoute>} />
        <Route path="/cliente/avaliar/:pedidoId" element={<PrivateRoute roles={['CLIENT']}><AvaliarCliente /></PrivateRoute>} />
        <Route path="/cliente/historico" element={<PrivateRoute roles={['CLIENT']}><HistoricoCliente /></PrivateRoute>} />

        {/* Motoboy */}
        <Route path="/motoboy/dashboard" element={<PrivateRoute roles={['MOTOBOY']}><Dashboard /></PrivateRoute>} />
        <Route path="/motoboy/pedido/:pedidoId" element={<PrivateRoute roles={['MOTOBOY']}><PedidoDetalhe /></PrivateRoute>} />
        <Route path="/motoboy/em-andamento/:pedidoId" element={<PrivateRoute roles={['MOTOBOY']}><EmAndamento /></PrivateRoute>} />
        <Route path="/motoboy/avaliar/:pedidoId" element={<PrivateRoute roles={['MOTOBOY']}><AvaliarMotoboy /></PrivateRoute>} />
        <Route path="/motoboy/assinatura" element={<PrivateRoute roles={['MOTOBOY']}><Assinatura /></PrivateRoute>} />
        <Route path="/motoboy/historico" element={<PrivateRoute roles={['MOTOBOY']}><HistoricoMotoboy /></PrivateRoute>} />

        {/* Admin */}
        <Route path="/admin" element={<PrivateRoute roles={['ADMIN']}><Painel /></PrivateRoute>} />

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
