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

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100dvh', background: '#fff' }}>

      <div style={{ padding: '32px 20px 12px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <img src="/entrega-livre/logo.png" alt="Entrega Livre" style={{ width: '100%', maxWidth: 340, objectFit: 'contain' }} />
        <p style={{ color: '#555', fontSize: 13, marginTop: 6, textAlign: 'center', fontWeight: 700 }}>Sem taxa. Lucro pra voce.</p>
      </div>

      <div style={{ margin: '0 20px 14px', height: 1, background: '#f0f0f0' }} />

      <div style={{ flex: 1, padding: '0 16px', display: 'flex', flexDirection: 'column', gap: 10 }}>

        <button onClick={() => ir('/restaurantes')} style={{ background: '#fff8ec', border: '1.5px solid #fde68a', borderRadius: 16, padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 14, cursor: 'pointer', textAlign: 'left' }}>
          <div style={{ width: 46, height: 46, borderRadius: 13, background: 'linear-gradient(135deg,#f59e0b,#d97706)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, flexShrink: 0 }}>🍔</div>
          <div>
            <div style={{ color: '#1a253e', fontWeight: 900, fontSize: 15, marginBottom: 1 }}>Pedir comida</div>
            <div style={{ color: '#555', fontSize: 12, fontWeight: 600 }}>Restaurantes e lanchonetes perto de voce</div>
          </div>
          <div style={{ marginLeft: 'auto', color: '#f59e0b', fontSize: 22, fontWeight: 700 }}>›</div>
        </button>

        <button onClick={() => ir('/passageiro/nova-viagem')} style={{ background: '#eef0ff', border: '1.5px solid #c7d2fe', borderRadius: 16, padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 14, cursor: 'pointer', textAlign: 'left' }}>
          <div style={{ width: 46, height: 46, borderRadius: 13, background: 'linear-gradient(135deg,#6366f1,#4f46e5)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, flexShrink: 0 }}>🏍️</div>
          <div>
            <div style={{ color: '#1a253e', fontWeight: 900, fontSize: 15, marginBottom: 1 }}>Passageiro Livre</div>
            <div style={{ color: '#555', fontSize: 12, fontWeight: 600 }}>Mototaxi — pague o preco justo</div>
          </div>
          <div style={{ marginLeft: 'auto', color: '#6366f1', fontSize: 22, fontWeight: 700 }}>›</div>
        </button>

        <button onClick={() => ir('/cliente/novo-pedido')} style={{ background: '#f3f4f6', border: '1.5px solid #e5e7eb', borderRadius: 16, padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 14, cursor: 'pointer', textAlign: 'left' }}>
          <div style={{ width: 46, height: 46, borderRadius: 13, background: 'linear-gradient(135deg,#374151,#1f2937)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, flexShrink: 0 }}>📦</div>
          <div>
            <div style={{ color: '#1a253e', fontWeight: 900, fontSize: 15, marginBottom: 1 }}>Enviar pacote</div>
            <div style={{ color: '#555', fontSize: 12, fontWeight: 600 }}>Motoboy fica com 100% do combinado</div>
          </div>
          <div style={{ marginLeft: 'auto', color: '#9ca3af', fontSize: 22, fontWeight: 700 }}>›</div>
        </button>

        <button onClick={() => user?.role === 'LOJA' ? navigate('/loja/dashboard') : navigate('/cadastro?role=LOJA')} style={{ background: '#ecfdf5', border: '1.5px solid #a7f3d0', borderRadius: 16, padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 14, cursor: 'pointer', textAlign: 'left' }}>
          <div style={{ width: 46, height: 46, borderRadius: 13, background: 'linear-gradient(135deg,#10b981,#059669)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, flexShrink: 0 }}>🏪</div>
          <div>
            <div style={{ color: '#1a253e', fontWeight: 900, fontSize: 15, marginBottom: 1 }}>Criar minha loja</div>
            <div style={{ color: '#555', fontSize: 12, fontWeight: 600 }}>Restaurante, lanchonete ou lojista</div>
          </div>
          <div style={{ marginLeft: 'auto', color: '#10b981', fontSize: 22, fontWeight: 700 }}>›</div>
        </button>

      </div>

      <div style={{ padding: '16px 16px 32px', paddingBottom: 'max(32px, calc(16px + env(safe-area-inset-bottom)))', display: 'flex', flexDirection: 'column', gap: 8 }}>
        <div style={{ height: 1, background: '#f0f0f0', marginBottom: 4 }} />
        <button style={{ background: '#eef0ff', border: '1.5px solid #c7d2fe', borderRadius: 12, padding: '12px', fontSize: 14, fontWeight: 700, color: '#4f46e5', cursor: 'pointer' }} onClick={() => navigate('/cadastro?role=MOTOTAXI')}>
          🏍️ Quero ser mototaxi
        </button>
        <button style={{ background: '#f3f4f6', border: '1.5px solid #e5e7eb', borderRadius: 12, padding: '12px', fontSize: 14, fontWeight: 700, color: '#374151', cursor: 'pointer' }} onClick={() => navigate('/cadastro?role=MOTOBOY')}>
          🛵 Quero fazer entregas
        </button>
        <button onClick={() => navigate('/login')} style={{ background: 'transparent', border: 'none', color: '#aaa', fontSize: 13, fontWeight: 600, padding: '6px', cursor: 'pointer' }}>
          Ja tenho conta — Entrar
        </button>
      </div>

    </div>
  )
}