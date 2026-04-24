import { useState } from 'react'
import { useNavigate, useSearchParams, Link } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'

const s = {
  container: { display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '100dvh', background: '#f5f5f5', padding: 24 },
  card: { background: '#fff', borderRadius: 20, padding: 32, width: '100%', maxWidth: 420, boxShadow: '0 4px 24px rgba(0,0,0,0.08)' },
  title: { fontSize: 24, fontWeight: 800, color: '#1a1a2e', marginBottom: 6 },
  sub: { color: '#666', marginBottom: 24, fontSize: 14 },
  label: { display: 'block', fontSize: 13, fontWeight: 600, color: '#444', marginBottom: 5 },
  input: { width: '100%', padding: '13px 14px', borderRadius: 12, border: '2px solid #e5e5e5', fontSize: 15, outline: 'none', marginBottom: 14 },
  btn: { width: '100%', padding: '15px', borderRadius: 14, background: '#f59e0b', border: 'none', color: '#1a1a2e', fontSize: 16, fontWeight: 700, cursor: 'pointer', marginTop: 6 },
  err: { background: '#fee2e2', color: '#dc2626', padding: '10px 14px', borderRadius: 10, fontSize: 14, marginBottom: 12 },
  roleBadge: { display: 'inline-block', padding: '4px 12px', borderRadius: 20, fontSize: 13, fontWeight: 600, marginBottom: 20 },
}

export default function Cadastro() {
  const [params] = useSearchParams()
  const role = params.get('role') || 'CLIENT'
  const { register } = useAuth()
  const navigate = useNavigate()

  const [form, setForm] = useState({ name: '', email: '', password: '', phone: '', cnh: '', vehicle: '', plate: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handle = (e) => setForm(f => ({ ...f, [e.target.name]: e.target.value }))

  const submit = async (e) => {
    e.preventDefault()
    setError('')
    if (form.password.length < 6) { setError('Senha mínimo 6 caracteres'); return }
    setLoading(true)
    try {
      const user = await register({ ...form, role })
      if (user.role === 'CLIENT') navigate('/cliente/novo-pedido', { replace: true })
      else navigate('/motoboy/assinatura', { replace: true })
    } catch (err) {
      setError(err.response?.data?.message || 'Erro ao cadastrar')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={s.container}>
      <div style={s.card}>
        <div style={{ fontSize: 32, marginBottom: 4 }}>{role === 'CLIENT' ? '📦' : '🛵'}</div>
        <h1 style={s.title}>Criar conta</h1>
        <span style={{ ...s.roleBadge, background: role === 'CLIENT' ? '#fef3c7' : '#dbeafe', color: role === 'CLIENT' ? '#92400e' : '#1e40af' }}>
          {role === 'CLIENT' ? 'Cliente' : 'Motoboy'}
        </span>

        {error && <div style={s.err}>{error}</div>}

        <form onSubmit={submit}>
          <label style={s.label}>Nome completo</label>
          <input style={s.input} name="name" value={form.name} onChange={handle} placeholder="Seu nome" required />

          <label style={s.label}>E-mail</label>
          <input style={s.input} type="email" name="email" value={form.email} onChange={handle} placeholder="seu@email.com" required />

          <label style={s.label}>Senha</label>
          <input style={s.input} type="password" name="password" value={form.password} onChange={handle} placeholder="Mínimo 6 caracteres" required />

          <label style={s.label}>Telefone / WhatsApp</label>
          <input style={s.input} name="phone" value={form.phone} onChange={handle} placeholder="(11) 99999-9999" required />

          {role === 'MOTOBOY' && (
            <>
              <label style={s.label}>Número da CNH</label>
              <input style={s.input} name="cnh" value={form.cnh} onChange={handle} placeholder="00000000000" required />

              <label style={s.label}>Veículo (ex: Honda Biz 125)</label>
              <input style={s.input} name="vehicle" value={form.vehicle} onChange={handle} placeholder="Modelo do veículo" required />

              <label style={s.label}>Placa</label>
              <input style={s.input} name="plate" value={form.plate} onChange={handle} placeholder="AAA-0000" required />
            </>
          )}

          <button style={s.btn} disabled={loading}>{loading ? 'Cadastrando...' : 'Criar conta'}</button>
        </form>

        <div style={{ textAlign: 'center', marginTop: 18, color: '#666', fontSize: 14 }}>
          Já tem conta?{' '}
          <Link to="/login" style={{ color: '#f59e0b', fontWeight: 700, textDecoration: 'none' }}>Entrar</Link>
        </div>
      </div>
    </div>
  )
}
