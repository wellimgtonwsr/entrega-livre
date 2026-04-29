import { useState } from 'react'
import { useNavigate, useSearchParams, Link } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'

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
      if (user.role === 'CLIENT') navigate('/splash', { replace: true })
      else if (user.role === 'MOTOTAXI') navigate('/mototaxi/dashboard', { replace: true })
      else navigate('/motoboy/assinatura', { replace: true })
    } catch (err) {
      setError(err.response?.data?.message || 'Erro ao cadastrar')
    } finally {
      setLoading(false)
    }
  }

  const isClient = role === 'CLIENT'
  const isMototaxi = role === 'MOTOTAXI'

  return (
    <div style={{
      minHeight: '100dvh', display: 'flex', flexDirection: 'column',
      background: isClient
        ? 'linear-gradient(160deg, #0f1729 0%, #1a2540 60%, #0f2f5c 100%)'
        : isMototaxi
          ? 'linear-gradient(160deg, #0f1729 0%, #1a1a2e 60%, #16213e 100%)'
          : 'linear-gradient(160deg, #0f1729 0%, #1c1a2e 60%, #2d1458 100%)',
    }}>
      {/* Header */}
      <div style={{ padding: '20px 20px 0', display: 'flex', alignItems: 'center', gap: 12 }}>
        <button onClick={() => navigate(-1)} style={{
          background: 'rgba(255,255,255,0.1)', border: 'none',
          color: '#fff', borderRadius: 10, width: 36, height: 36,
          fontSize: 18, display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>←</button>
        <span style={{ color: 'rgba(255,255,255,0.6)', fontSize: 14 }}>Criar conta</span>
      </div>

      {/* Hero */}
      <div style={{ padding: '24px 24px 0', animation: 'fadeUp 0.4s ease both' }}>
        <div style={{
          width: 56, height: 56, borderRadius: 16,
          background: isClient
            ? 'linear-gradient(135deg,#f59e0b,#d97706)'
            : isMototaxi
              ? 'linear-gradient(135deg,#6366f1,#4f46e5)'
              : 'linear-gradient(135deg,#a855f7,#7c3aed)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 28, marginBottom: 14,
          boxShadow: isClient
            ? '0 4px 16px rgba(245,158,11,0.4)'
            : isMototaxi
              ? '0 4px 16px rgba(99,102,241,0.4)'
              : '0 4px 16px rgba(124,58,237,0.4)',
        }}>
          {isClient ? '📦' : isMototaxi ? '🏍️' : '🛵'}
        </div>
        <h1 style={{ color: '#fff', fontSize: 26, fontWeight: 900, marginBottom: 4, letterSpacing: -0.5 }}>
          {isClient ? 'Criar conta de cliente' : isMototaxi ? 'Cadastrar como mototaxi' : 'Cadastrar como motoboy'}
        </h1>
        <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 14 }}>
          {isClient ? 'Envie pacotes pagando o valor justo' : isMototaxi ? 'Leve passageiros e ganhe mais' : 'Ganhe 100% de cada corrida'}
        </p>
      </div>

      {/* Form card */}
      <div style={{
        flex: 1, display: 'flex', alignItems: 'flex-end', marginTop: 24,
        animation: 'fadeUp 0.4s 0.1s ease both',
      }}>
        <div style={{
          background: '#fff', width: '100%',
          borderRadius: '28px 28px 0 0',
          padding: '28px 24px',
          paddingBottom: 'max(28px, calc(28px + env(safe-area-inset-bottom)))',
          boxShadow: '0 -8px 40px rgba(0,0,0,0.2)',
          maxHeight: '72dvh', overflowY: 'auto',
        }}>
          {error && (
            <div className="alert alert-error" style={{ marginBottom: 16 }}>
              ⚠️ {error}
            </div>
          )}

          <form onSubmit={submit}>
            <div className="form-group">
              <label className="lbl">Nome completo</label>
              <input className="inp" name="name" value={form.name} onChange={handle} placeholder="Seu nome completo" required />
            </div>

            <div className="form-group">
              <label className="lbl">E-mail</label>
              <input className="inp" type="email" name="email" value={form.email} onChange={handle} placeholder="seu@email.com" required />
            </div>

            <div className="form-group">
              <label className="lbl">Senha</label>
              <input className="inp" type="password" name="password" value={form.password} onChange={handle} placeholder="Mínimo 6 caracteres" required />
            </div>

            <div className="form-group">
              <label className="lbl">Telefone / WhatsApp</label>
              <input className="inp" name="phone" value={form.phone} onChange={handle} placeholder="(11) 99999-9999" required />
            </div>

            {!isClient && (
              <>
                <div className="divider" />
                <p className="sect-title" style={{ marginBottom: 14 }}>{isMototaxi ? '🏍️ Dados do veículo' : '📋 Dados do veículo'}</p>

                <div className="form-group">
                  <label className="lbl">Número da CNH</label>
                  <input className="inp" name="cnh" value={form.cnh} onChange={handle} placeholder="00000000000" required />
                </div>

                <div className="form-group">
                  <label className="lbl">Veículo</label>
                  <input className="inp" name="vehicle" value={form.vehicle} onChange={handle} placeholder="Ex: Honda Biz 125" required />
                </div>

                <div className="form-group">
                  <label className="lbl">Placa</label>
                  <input className="inp" name="plate" value={form.plate} onChange={handle} placeholder="AAA-0000" required
                    style={{ textTransform: 'uppercase' }} />
                </div>
              </>
            )}

            <button className="btn btn-primary" type="submit" disabled={loading} style={{
              marginTop: 8, fontSize: 17,
              background: isMototaxi ? 'linear-gradient(135deg,#6366f1,#4f46e5)' : undefined,
              boxShadow: isMototaxi ? '0 4px 16px rgba(99,102,241,0.35)' : undefined,
            }}>
              {loading ? <span className="spinner" style={{ borderTopColor: 'var(--dark)' }} /> : 'Criar conta'}
            </button>
          </form>

          <p style={{ textAlign: 'center', marginTop: 20, color: 'var(--text2)', fontSize: 14 }}>
            Já tem conta?{' '}
            <Link to="/login" style={{ color: 'var(--brand)', fontWeight: 700 }}>Entrar</Link>
          </p>
        </div>
      </div>
    </div>
  )
}

