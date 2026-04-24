import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'

const s = {
  container: { display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100dvh', background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)', padding: 24 },
  logo: { fontSize: 48, marginBottom: 8 },
  name: { color: '#fff', fontSize: 32, fontWeight: 800, marginBottom: 6, letterSpacing: -1 },
  tagline: { color: 'rgba(255,255,255,0.7)', fontSize: 16, marginBottom: 60, textAlign: 'center' },
  btn: { width: '100%', maxWidth: 360, padding: '18px 24px', borderRadius: 16, border: 'none', fontSize: 18, fontWeight: 700, cursor: 'pointer', marginBottom: 14, transition: 'transform 0.1s, opacity 0.1s' },
  btnPrimary: { background: '#f59e0b', color: '#1a1a2e' },
  btnSecondary: { background: 'rgba(255,255,255,0.1)', color: '#fff', border: '2px solid rgba(255,255,255,0.2)' },
  link: { color: 'rgba(255,255,255,0.5)', fontSize: 14, marginTop: 20, cursor: 'pointer', textDecoration: 'underline' },
}

export default function Splash() {
  const navigate = useNavigate()
  const { user } = useAuth()

  if (user) {
    if (user.role === 'CLIENT') navigate('/cliente/novo-pedido', { replace: true })
    else if (user.role === 'MOTOBOY') navigate('/motoboy/dashboard', { replace: true })
  }

  return (
    <div style={s.container}>
      <div style={s.logo}>🛵</div>
      <h1 style={s.name}>Entrega Livre</h1>
      <p style={s.tagline}>Sem taxa por corrida. O motoboy fica com 100% do combinado.</p>

      <button style={{ ...s.btn, ...s.btnPrimary }} onClick={() => navigate('/cadastro?role=CLIENT')}>
        📦 Quero enviar um pacote
      </button>
      <button style={{ ...s.btn, ...s.btnSecondary }} onClick={() => navigate('/cadastro?role=MOTOBOY')}>
        🛵 Quero fazer entregas
      </button>
      <span style={s.link} onClick={() => navigate('/login')}>Já tenho conta</span>
    </div>
  )
}
