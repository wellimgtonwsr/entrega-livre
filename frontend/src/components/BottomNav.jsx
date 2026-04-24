import { NavLink } from 'react-router-dom'

const s = {
  nav: { position: 'fixed', left: 0, right: 0, bottom: 0, background: '#fff', borderTop: '1px solid #eee', display: 'flex', justifyContent: 'space-around', padding: '8px 0', zIndex: 999 },
  link: { display: 'flex', flexDirection: 'column', alignItems: 'center', textDecoration: 'none', fontSize: 11, color: '#888', fontWeight: 600, minWidth: 64 },
  icon: { fontSize: 20, marginBottom: 2 },
}

const tabsCliente = [
  { to: '/cliente/novo-pedido', icon: '➕', label: 'Novo' },
  { to: '/cliente/historico', icon: '📋', label: 'Histórico' },
]

const tabsMotoboy = [
  { to: '/motoboy/dashboard', icon: '🗺', label: 'Mapa' },
  { to: '/motoboy/historico', icon: '💰', label: 'Ganhos' },
  { to: '/motoboy/assinatura', icon: '💳', label: 'Plano' },
]

export default function BottomNav({ role }) {
  const tabs = role === 'MOTOBOY' ? tabsMotoboy : tabsCliente

  return (
    <nav style={s.nav}>
      {tabs.map(t => (
        <NavLink
          key={t.to}
          to={t.to}
          style={({ isActive }) => ({ ...s.link, color: isActive ? '#1a1a2e' : '#888' })}
        >
          <span style={s.icon}>{t.icon}</span>
          {t.label}
        </NavLink>
      ))}
    </nav>
  )
}
