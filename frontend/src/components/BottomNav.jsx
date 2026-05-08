import { NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

const tabsCliente = [
  { to: '/cliente/novo-pedido', icon: '➕', label: 'Novo Pedido' },
  { to: '/cliente/historico',   icon: '📋', label: 'Histórico' },
]

const tabsMotoboy = [
  { to: '/motoboy/dashboard',   icon: '🗺️',  label: 'Mapa' },
  { to: '/motoboy/historico',   icon: '💰', label: 'Ganhos' },
  { to: '/motoboy/assinatura',  icon: '💳', label: 'Plano' },
]

const tabsLoja = [
  { to: '/loja/dashboard', icon: '🔔', label: 'Pedidos' },
]

export default function BottomNav({ role }) {
  const tabs = role === 'MOTOBOY' ? tabsMotoboy
    : role === 'LOJA' ? tabsLoja
    : tabsCliente

  const { logout } = useAuth()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    navigate('/splash', { replace: true })
  }

  return (
    <nav style={{
      position: 'fixed', left: 0, right: 0, bottom: 0, zIndex: 999,
      background: 'rgba(255,255,255,0.96)',
      backdropFilter: 'blur(12px)',
      borderTop: '1px solid var(--border)',
      display: 'flex',
      paddingBottom: 'env(safe-area-inset-bottom)',
    }}>
      {tabs.map(t => (
        <NavLink
          key={t.to}
          to={t.to}
          style={({ isActive }) => ({
            flex: 1, display: 'flex', flexDirection: 'column',
            alignItems: 'center', justifyContent: 'center',
            padding: '10px 4px 8px',
            textDecoration: 'none',
            color: isActive ? 'var(--brand-dark)' : 'var(--text3)',
            fontWeight: isActive ? 700 : 500,
            fontSize: 11,
            gap: 3,
            transition: 'color 0.2s',
            borderTop: isActive ? '2px solid var(--brand)' : '2px solid transparent',
          })}
        >
          {({ isActive }) => (
            <>
              <span style={{ fontSize: 22, lineHeight: 1, filter: isActive ? 'none' : 'grayscale(0.3)' }}>
                {t.icon}
              </span>
              {t.label}
            </>
          )}
        </NavLink>
      ))}
      <button onClick={handleLogout} style={{
        flex: 1, display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        padding: '10px 4px 8px',
        background: 'none', border: 'none',
        color: 'var(--text3)', fontWeight: 500, fontSize: 11,
        gap: 3, cursor: 'pointer',
        borderTop: '2px solid transparent',
      }}>
        <span style={{ fontSize: 22, lineHeight: 1 }}>🚪</span>
        Sair
      </button>
    </nav>
  )
}
