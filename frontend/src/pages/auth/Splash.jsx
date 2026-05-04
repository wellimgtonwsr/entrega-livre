import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'

export default function Splash() {
  const navigate = useNavigate()
  const { user } = useAuth()

  useEffect(() => {
    if (!user) return
    if (user.role === 'MOTOBOY') navigate('/motoboy/dashboard', { replace: true })
    else if (user.role === 'LOJA') navigate('/loja/dashboard', { replace: true })
    else if (user.role === 'ADMIN') navigate('/admin', { replace: true })
  }, [navigate, user])

  const ir = (path) => user ? navigate(path) : navigate(`/cadastro?role=CLIENT&next=${encodeURIComponent(path)}`)

  const card = (onClick, iconBg, icon, title, subtitle, arrowColor) => (
    <button onClick={onClick} style={{
      background: '#fff', border: '1px solid #e5e7eb',
      borderRadius: 16, padding: '14px 16px',
      display: 'flex', alignItems: 'center', gap: 14,
      cursor: 'pointer', textAlign: 'left', width: '100%',
      boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
    }}>
      <div style={{
        width: 48, height: 48, borderRadius: 13,
        background: iconBg, display: 'flex',
        alignItems: 'center', justifyContent: 'center',
        fontSize: 22, flexShrink: 0,
      }}>{icon}</div>
      <div>
        <div style={{ color: '#111827', fontWeight: 700, fontSize: 15, marginBottom: 2 }}>{title}</div>
        <div style={{ color: '#6b7280', fontSize: 13 }}>{subtitle}</div>
      </div>
      <div style={{ marginLeft: 'auto', color: arrowColor, fontSize: 20, fontWeight: 600, paddingLeft: 8 }}>›</div>
    </button>
  )

  const secondaryBtn = (onClick, icon, label) => (
    <button onClick={onClick} style={{
      background: '#fff', border: '1px solid #e5e7eb',
      borderRadius: 14, padding: '13px 16px',
      display: 'flex', alignItems: 'center',
      cursor: 'pointer', textAlign: 'left', width: '100%',
      boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
    }}>
      <span style={{ fontSize: 18, marginRight: 10 }}>{icon}</span>
      <span style={{ color: '#374151', fontWeight: 600, fontSize: 14 }}>{label}</span>
      <span style={{ marginLeft: 'auto', color: '#9ca3af', fontSize: 18 }}>›</span>
    </button>
  )

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100dvh', background: '#fff', fontFamily: 'system-ui, sans-serif' }}>

      {/* Logo */}
      <div style={{ padding: '36px 20px 8px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <img src="/entrega-livre/logo.png" alt="Entrega Livre" style={{ width: '100%', maxWidth: 300, objectFit: 'contain', mixBlendMode: 'multiply' }} />
        <p style={{ color: '#6b7280', fontSize: 13, marginTop: 6, textAlign: 'center', fontStyle: 'italic' }}>Sem taxa. Lucro pra você.</p>
      </div>

      {/* Heading */}
      <div style={{ padding: '20px 20px 4px', textAlign: 'center' }}>
        <h1 style={{ color: '#111827', fontSize: 22, fontWeight: 800, margin: '0 0 6px' }}>Como podemos ajudar você hoje?</h1>
        <p style={{ color: '#6b7280', fontSize: 14, margin: 0 }}>Escolha o serviço que melhor atende às suas necessidades.</p>
      </div>

      {/* Cards */}
      <div style={{ flex: 1, padding: '16px 16px 0', display: 'flex', flexDirection: 'column', gap: 10 }}>
        {card(() => ir('/restaurantes'), '#16a34a', '🍴', 'Pedir comida', 'Restaurantes e lanchonetes perto de você', '#9ca3af')}
        {card(() => ir('/passageiro/nova-viagem'), '#2563eb', '👤', 'Passageiro Livre', 'Mototáxi — pague o preço justo', '#9ca3af')}
        {card(() => ir('/cliente/novo-pedido'), '#7c3aed', '📦', 'Enviar pacote', 'Motoboy fica com 100% do combinado', '#9ca3af')}
        {card(() => user?.role === 'LOJA' ? navigate('/loja/dashboard') : navigate('/cadastro?role=LOJA'), '#16a34a', '🏪', 'Criar minha loja', 'Restaurante, lanchonete ou lojista — PF ou PJ', '#9ca3af')}
      </div>

      {/* Secondary actions */}
      <div style={{ padding: '14px 16px 0', display: 'flex', flexDirection: 'column', gap: 8 }}>
        {secondaryBtn(() => navigate('/cadastro?role=MOTOTAXI'), '🏍️', 'Quero ser mototáxi')}
        {secondaryBtn(() => navigate('/cadastro?role=MOTOBOY'), '🟢', 'Quero fazer entregas')}
      </div>

      {/* Login link */}
      <div style={{ padding: '14px 16px 20px', textAlign: 'center' }}>
        <button onClick={() => navigate('/login')} style={{ background: 'transparent', border: 'none', color: '#6b7280', fontSize: 13, cursor: 'pointer', padding: 0 }}>
          Já tenho conta —{' '}
          <span style={{ color: '#16a34a', fontWeight: 700 }}>Entrar</span>
        </button>
      </div>

      {/* Footer */}
      <div style={{ background: '#111827', padding: '20px 16px', paddingBottom: 'max(20px, calc(16px + env(safe-area-inset-bottom)))', display: 'flex', justifyContent: 'space-around', gap: 8 }}>
        {[
          { icon: '✅', title: 'Sem taxas abusivas', sub: 'Mais lucro para você' },
          { icon: '💳', title: 'Pagamento justo', sub: 'Transparência sempre' },
          { icon: '💬', title: 'Suporte humano', sub: 'Estamos aqui para ajudar' },
        ].map(({ icon, title, sub }) => (
          <div key={title} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', flex: 1 }}>
            <span style={{ fontSize: 18, marginBottom: 4 }}>{icon}</span>
            <span style={{ color: '#f9fafb', fontSize: 11, fontWeight: 700, marginBottom: 2 }}>{title}</span>
            <span style={{ color: '#9ca3af', fontSize: 10 }}>{sub}</span>
          </div>
        ))}
      </div>

    </div>
  )
}