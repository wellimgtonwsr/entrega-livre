import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'

const s = {
  container: { display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '100dvh', background: '#f5f5f5', padding: 24 },
  card: { background: '#fff', borderRadius: 20, padding: 32, width: '100%', maxWidth: 400, boxShadow: '0 4px 24px rgba(0,0,0,0.08)' },
  title: { fontSize: 26, fontWeight: 800, color: '#1a1a2e', marginBottom: 8 },
  sub: { color: '#666', marginBottom: 28, fontSize: 14 },
  label: { display: 'block', fontSize: 13, fontWeight: 600, color: '#444', marginBottom: 6 },
  input: { width: '100%', padding: '14px 16px', borderRadius: 12, border: '2px solid #e5e5e5', fontSize: 16, outline: 'none', marginBottom: 16, transition: 'border 0.2s' },
  btn: { width: '100%', padding: '16px', borderRadius: 14, background: '#f59e0b', border: 'none', color: '#1a1a2e', fontSize: 17, fontWeight: 700, cursor: 'pointer', marginTop: 8 },
  err: { background: '#fee2e2', color: '#dc2626', padding: '10px 14px', borderRadius: 10, fontSize: 14, marginBottom: 14 },
  link: { textAlign: 'center', marginTop: 20, color: '#666', fontSize: 14 },
}

export default function Login() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const [form, setForm] = useState({ email: '', password: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handle = (e) => setForm(f => ({ ...f, [e.target.name]: e.target.value }))

  const submit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const user = await login(form.email, form.password)
      if (user.role === 'CLIENT') navigate('/cliente/novo-pedido', { replace: true })
      else if (user.role === 'MOTOBOY') navigate('/motoboy/dashboard', { replace: true })
      else navigate('/admin', { replace: true })
    } catch (err) {
      setError(err.response?.data?.message || 'Erro ao entrar')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={s.container}>
      <div style={s.card}>
        <div style={{ fontSize: 36, marginBottom: 4 }}>🛵</div>
        <h1 style={s.title}>Entrar</h1>
        <p style={s.sub}>Bem-vindo de volta!</p>

        {error && <div style={s.err}>{error}</div>}

        <form onSubmit={submit}>
          <label style={s.label}>E-mail</label>
          <input style={s.input} type="email" name="email" value={form.email} onChange={handle} placeholder="seu@email.com" required />

          <label style={s.label}>Senha</label>
          <input style={s.input} type="password" name="password" value={form.password} onChange={handle} placeholder="••••••" required />

          <button style={s.btn} disabled={loading}>{loading ? 'Entrando...' : 'Entrar'}</button>
        </form>

        <div style={s.link}>
          Não tem conta?{' '}
          <Link to="/splash" style={{ color: '#f59e0b', fontWeight: 700, textDecoration: 'none' }}>Cadastrar</Link>
        </div>
      </div>
    </div>
  )
}
