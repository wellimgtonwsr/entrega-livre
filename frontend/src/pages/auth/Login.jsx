import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'

export default function Login() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const [form, setForm] = useState({ email: '', password: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [showPass, setShowPass] = useState(false)

  const handle = (e) => setForm(f => ({ ...f, [e.target.name]: e.target.value }))

  const submit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const user = await login(form.email, form.password)
      if (user.role === 'CLIENT') navigate('/splash', { replace: true })
      else if (user.role === 'MOTOBOY') navigate('/motoboy/dashboard', { replace: true })
      else if (user.role === 'LOJA') navigate('/loja/dashboard', { replace: true })
      else navigate('/admin', { replace: true })
    } catch (err) {
      setError(err.response?.data?.message || 'E-mail ou senha incorretos')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{
      minHeight: '100dvh', display: 'flex', flexDirection: 'column',
      background: '#fff',
    }}>
      {/* Top brand */}
      <div style={{ padding: '32px 16px 0', display: 'flex', justifyContent: 'center' }}>
        <img
          src="/entrega-livre/logo.png"
          alt="Entrega Livre"
          style={{ width: '80%', maxWidth: 280, objectFit: 'contain' }}
        />
      </div>

      {/* Form — sem card flutuante, tudo integrado ao fundo branco */}
      <div style={{
        flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center',
        padding: '24px 24px',
        paddingBottom: 'max(32px, calc(32px + env(safe-area-inset-bottom)))',
        animation: 'fadeUp 0.4s ease both',
      }}>
        <h1 style={{ fontSize: 26, fontWeight: 900, color: '#1a253e', marginBottom: 4 }}>Bem-vindo de volta 👋</h1>
        <p style={{ color: '#555', fontSize: 14, marginBottom: 24, fontWeight: 600 }}>Entre na sua conta para continuar</p>

        {error && (
          <div className="alert alert-error" style={{ marginBottom: 16 }}>
            ⚠️ {error}
          </div>
        )}

        <form onSubmit={submit}>
          <div className="form-group">
            <label className="lbl">E-mail</label>
            <input className="inp" type="email" name="email" value={form.email}
              onChange={handle} placeholder="seu@email.com" required />
          </div>

          <div className="form-group" style={{ position: 'relative' }}>
            <label className="lbl">Senha</label>
            <input className="inp" type={showPass ? 'text' : 'password'}
              name="password" value={form.password}
              onChange={handle} placeholder="Mínimo 6 caracteres" required
              style={{ paddingRight: 48 }}
            />
            <button type="button" onClick={() => setShowPass(p => !p)} style={{
              position: 'absolute', right: 14, top: 36,
              background: 'none', border: 'none',
              color: 'var(--text3)', fontSize: 18, padding: 4,
            }}>
              {showPass ? '🙈' : '👁️'}
            </button>
          </div>

          <button className="btn btn-primary" type="submit" disabled={loading} style={{ marginTop: 8, fontSize: 17 }}>
            {loading ? <span className="spinner" /> : 'Entrar'}
          </button>
        </form>

        <p style={{ textAlign: 'center', marginTop: 20, color: '#555', fontSize: 14, fontWeight: 600 }}>
          Não tem conta?{' '}
          <Link to="/splash" style={{ color: 'var(--brand)', fontWeight: 700 }}>Cadastre-se grátis</Link>
        </p>
      </div>
    </div>
  )
}
