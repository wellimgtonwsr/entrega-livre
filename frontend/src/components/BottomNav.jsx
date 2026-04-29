import { NavLink } from 'react-router-dom'

const tabsCliente = [
  { to: '/cliente/novo-pedido', icon: '➕', label: 'Novo Pedido' },
  { to: '/cliente/historico',   icon: '📋', label: 'Histórico' },
]

const tabsMotoboy = [
  { to: '/motoboy/dashboard',   icon: '🗺️',  label: 'Mapa' },
  { to: '/motoboy/historico',   icon: '💰', label: 'Ganhos' },
  { to: '/motoboy/assinatura',  icon: '💳', label: 'Plano' },
]

export default function BottomNav({ role }) {
  const tabs = role === 'MOTOBOY' ? tabsMotoboy : tabsCliente

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
    </nav>
  )
}
