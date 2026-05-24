import { lazy, Suspense } from 'react'
import { BrowserRouter, HashRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

// Auth
const Splash = lazy(() => import('../pages/auth/Splash'))
const Login = lazy(() => import('../pages/auth/Login'))
const Cadastro = lazy(() => import('../pages/auth/Cadastro'))

// Cliente
const NovoPedido = lazy(() => import('../pages/cliente/NovoPedido'))
const AguardandoOfertas = lazy(() => import('../pages/cliente/AguardandoOfertas'))
const Acompanhar = lazy(() => import('../pages/cliente/Acompanhar'))
const AvaliarCliente = lazy(() => import('../pages/cliente/Avaliar'))
const HistoricoCliente = lazy(() => import('../pages/cliente/Historico'))

// Passageiro (mototaxi)
const NovaViagem = lazy(() => import('../pages/passageiro/NovaViagem'))
const AguardandoMototaxi = lazy(() => import('../pages/passageiro/AguardandoMototaxi'))
const AcompanharViagem = lazy(() => import('../pages/passageiro/AcompanharViagem'))

// Motoboy
const Dashboard = lazy(() => import('../pages/motoboy/Dashboard'))
const PedidoDetalhe = lazy(() => import('../pages/motoboy/PedidoDetalhe'))
const CorridaDetalhe = lazy(() => import('../pages/motoboy/CorridaDetalhe'))
const CorridaEmAndamento = lazy(() => import('../pages/motoboy/CorridaEmAndamento'))
const EmAndamento = lazy(() => import('../pages/motoboy/EmAndamento'))
const AvaliarMotoboy = lazy(() => import('../pages/motoboy/Avaliar'))
const Assinatura = lazy(() => import('../pages/motoboy/Assinatura'))
const HistoricoMotoboy = lazy(() => import('../pages/motoboy/Historico'))

// Admin
const Painel = lazy(() => import('../pages/admin/Painel'))
const AdminRestaurantes = lazy(() => import('../pages/admin/Restaurantes'))

// Loja
const LojaDashboard = lazy(() => import('../pages/loja/Dashboard'))
const LojaCatalogo = lazy(() => import('../pages/loja/Catalogo'))

// Cliente — Restaurantes
const Restaurantes = lazy(() => import('../pages/cliente/Restaurantes'))
const Cardapio = lazy(() => import('../pages/cliente/Cardapio'))
const PedidoRestaurante = lazy(() => import('../pages/cliente/PedidoRestaurante'))

const PageLoader = () => (
  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100dvh', flexDirection: 'column', gap: 12 }}>
    <div style={{ width: 36, height: 36, border: '3px solid #e5e7eb', borderTopColor: '#f97316', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
    <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
  </div>
)

function PrivateRoute({ children, roles }) {
  const { user, loading } = useAuth()
  if (loading) return <PageLoader />
  if (!user) return <Navigate to="/login" replace />
  if (roles && !roles.includes(user.role)) return <Navigate to="/" replace />
  return children
}

export default function AppRouter() {
  const { user, loading } = useAuth()

  if (loading) return <PageLoader />

  const homeRedirect = () => {
    if (!user) return <Navigate to="/splash" replace />
    if (user.role === 'CLIENT') return <Navigate to="/splash" replace />
    if (user.role === 'MOTOBOY') return <Navigate to="/motoboy/dashboard" replace />
    if (user.role === 'LOJA') return <Navigate to="/loja/dashboard" replace />
    if (user.role === 'ADMIN') return <Navigate to="/admin" replace />
    return <Navigate to="/splash" replace />
  }

  // Cada plataforma precisa de um base/router diferente
  const platform = import.meta.env.VITE_PLATFORM || 'web'
  const basename = platform === 'web' ? '/entrega-livre' : '/'
  const RouterComponent = platform === 'electron' ? HashRouter : BrowserRouter
  const routerProps = platform === 'electron' ? {} : { basename }

  return (
    <RouterComponent {...routerProps}>
      <Suspense fallback={<PageLoader />}>
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

          {/* Passageiro (mototaxi) */}
          <Route path="/passageiro/nova-viagem" element={<PrivateRoute roles={['CLIENT']}><NovaViagem /></PrivateRoute>} />
          <Route path="/passageiro/aguardando/:corridaId" element={<PrivateRoute roles={['CLIENT']}><AguardandoMototaxi /></PrivateRoute>} />
          <Route path="/passageiro/acompanhar/:corridaId" element={<PrivateRoute roles={['CLIENT']}><AcompanharViagem /></PrivateRoute>} />

          {/* Motoboy */}
          <Route path="/motoboy/dashboard" element={<PrivateRoute roles={['MOTOBOY']}><Dashboard /></PrivateRoute>} />
          <Route path="/motoboy/pedido/:pedidoId" element={<PrivateRoute roles={['MOTOBOY']}><PedidoDetalhe /></PrivateRoute>} />
          <Route path="/motoboy/corrida/:corridaId" element={<PrivateRoute roles={['MOTOBOY']}><CorridaDetalhe /></PrivateRoute>} />
          <Route path="/motoboy/corrida-em-andamento/:corridaId" element={<PrivateRoute roles={['MOTOBOY']}><CorridaEmAndamento /></PrivateRoute>} />
          <Route path="/motoboy/em-andamento/:pedidoId" element={<PrivateRoute roles={['MOTOBOY']}><EmAndamento /></PrivateRoute>} />
          <Route path="/motoboy/avaliar/:pedidoId" element={<PrivateRoute roles={['MOTOBOY']}><AvaliarMotoboy /></PrivateRoute>} />
          <Route path="/motoboy/assinatura" element={<PrivateRoute roles={['MOTOBOY']}><Assinatura /></PrivateRoute>} />
          <Route path="/motoboy/historico" element={<PrivateRoute roles={['MOTOBOY']}><HistoricoMotoboy /></PrivateRoute>} />

          {/* Admin */}
          <Route path="/admin" element={<PrivateRoute roles={['ADMIN']}><Painel /></PrivateRoute>} />
          <Route path="/admin/restaurantes" element={<PrivateRoute roles={['ADMIN']}><AdminRestaurantes /></PrivateRoute>} />

          {/* Loja */}
          <Route path="/loja/dashboard" element={<PrivateRoute roles={['LOJA']}><LojaDashboard /></PrivateRoute>} />
          <Route path="/loja/catalogo" element={<PrivateRoute roles={['LOJA']}><LojaCatalogo /></PrivateRoute>} />

          {/* Restaurantes (público / cliente) */}
          <Route path="/restaurantes" element={<Restaurantes />} />
          <Route path="/restaurantes/:id" element={<Cardapio />} />
          <Route path="/restaurantes/pedido/:pedidoId" element={<PedidoRestaurante />} />

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Suspense>
    </RouterComponent>
  )
}
