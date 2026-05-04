import { useState } from 'react'
import { useNavigate, useSearchParams, Link } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'

export default function Cadastro() {
  const [params] = useSearchParams()
  const role = params.get('role') || 'CLIENT'
  const { register } = useAuth()
  const navigate = useNavigate()

  const [form, setForm] = useState({
    name: '', email: '', password: '', phone: '',
    // motoboy fields
    cnh: '', vehicle: '', plate: '',
    // loja fields
    tipo: 'PF', documento: '', nomeFantasia: '',
  })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handle = (e) => setForm(f => ({ ...f, [e.target.name]: e.target.value }))

  const submit = async (e) => {
    e.preventDefault()
    setError('')
    if (form.password.length < 6) { setError('Senha mínimo 6 caracteres'); return }
    if (role === 'LOJA' && !form.documento) { setError('CPF/CNPJ obrigatório'); return }
    setLoading(true)
    try {
      const user = await register({ ...form, role })
      if (user.role === 'LOJA') navigate('/loja/dashboard', { replace: true })
      else if (user.role === 'CLIENT') navigate('/splash', { replace: true })
      else if (user.role === 'MOTOTAXI') navigate('/mototaxi/dashboard', { replace: true })
      else navigate('/motoboy/assinatura', { replace: true })
    } catch (err) {
      setError(err.response?.data?.message || 'Erro ao cadastrar')
    } finally {
      setLoading(false)
    }
  }

  const isClient = role === 'CLIENT'
  const isMotoboy = role === 'MOTOBOY'
  const isMototaxi = role === 'MOTOTAXI'
  const isLoja = role === 'LOJA'
  const isWorker = isMotoboy || isMototaxi

  const gradient = isClient
    ? 'linear-gradient(160deg,#0f1729 0%,#1a2540 60%,#0f2f5c 100%)'
    : isLoja
      ? 'linear-gradient(160deg,#0f1729 0%,#0f2918 60%,#14532d 100%)'
      : isMototaxi
        ? 'linear-gradient(160deg,#0f1729 0%,#1a1a2e 60%,#16213e 100%)'
        : 'linear-gradient(160deg,#0f1729 0%,#1c1a2e 60%,#2d1458 100%)'

  const iconBg = isClient
    ? 'linear-gradient(135deg,#f59e0b,#d97706)'
    : isLoja
      ? 'linear-gradient(135deg,#16a34a,#15803d)'
      : isMototaxi
        ? 'linear-gradient(135deg,#6366f1,#4f46e5)'
        : 'linear-gradient(135deg,#a855f7,#7c3aed)'

  const iconShadow = isClient
    ? '0 4px 16px rgba(245,158,11,0.4)'
    : isLoja
      ? '0 4px 16px rgba(22,163,74,0.4)'
      : isMototaxi
        ? '0 4px 16px rgba(99,102,241,0.4)'
        : '0 4px 16px rgba(124,58,237,0.4)'

  const btnBg = isLoja
    ? 'linear-gradient(135deg,#16a34a,#15803d)'
    : isMototaxi
      ? 'linear-gradient(135deg,#6366f1,#4f46e5)'
      : undefined

  const btnShadow = isLoja
    ? '0 4px 16px rgba(22,163,74,0.35)'
    : isMototaxi
      ? '0 4px 16px rgba(99,102,241,0.35)'
      : undefined

  const titulo = isClient ? 'Criar conta de cliente'
    : isLoja ? 'Cadastrar minha loja'
    : isMototaxi ? 'Cadastrar como mototáxi'
    : 'Cadastrar como motoboy'

  const subtitulo = isClient ? 'Envie pacotes pagando o valor justo'
    : isLoja ? 'Anuncie seus produtos e receba pedidos'
    : isMototaxi ? 'Leve passageiros e ganhe mais'
    : 'Ganhe 100% de cada corrida'

  const emoji = isClient ? '📦' : isLoja ? '🏪' : isMototaxi ? '🏍️' : '🛵'

  return (
    <div style={{ minHeight: '100dvh', display: 'flex', flexDirection: 'column', background: gradient }}>
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
          width: 56, height: 56, borderRadius: 16, background: iconBg,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 28, marginBottom: 14, boxShadow: iconShadow,
        }}>{emoji}</div>
        <h1 style={{ color: '#fff', fontSize: 26, fontWeight: 900, marginBottom: 4, letterSpacing: -0.5 }}>
          {titulo}
        </h1>
        <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 14 }}>{subtitulo}</p>
      </div>

      {/* Form card */}
      <div style={{ flex: 1, display: 'flex', alignItems: 'flex-end', marginTop: 24, animation: 'fadeUp 0.4s 0.1s ease both' }}>
        <div style={{
          background: '#fff', width: '100%',
          borderRadius: '28px 28px 0 0',
          padding: '28px 24px',
          paddingBottom: 'max(28px, calc(28px + env(safe-area-inset-bottom)))',
          boxShadow: '0 -8px 40px rgba(0,0,0,0.2)',
          maxHeight: '74dvh', overflowY: 'auto',
        }}>
          {error && (
            <div className="alert alert-error" style={{ marginBottom: 16 }}>⚠️ {error}</div>
          )}

          <form onSubmit={submit}>
            {/* ── Dados básicos ── */}
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

            {/* ── Loja: PF / PJ ── */}
            {isLoja && (
              <>
                <div className="divider" />
                <p className="sect-title" style={{ marginBottom: 14 }}>🏪 Dados da loja</p>

                {/* Toggle PF / PJ */}
                <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
                  {['PF', 'PJ'].map(t => (
                    <button key={t} type="button" onClick={() => setForm(f => ({ ...f, tipo: t }))} style={{
                      flex: 1, padding: '10px 0', borderRadius: 12, border: '2px solid',
                      borderColor: form.tipo === t ? '#16a34a' : '#e5e7eb',
                      background: form.tipo === t ? '#f0fdf4' : '#fff',
                      color: form.tipo === t ? '#15803d' : '#6b7280',
                      fontWeight: 700, fontSize: 14, cursor: 'pointer',
                      transition: 'all 0.15s',
                    }}>
                      {t === 'PF' ? '👤 Pessoa Física' : '🏢 Pessoa Jurídica'}
                    </button>
                  ))}
                </div>

                <div className="form-group">
                  <label className="lbl">{form.tipo === 'PF' ? 'CPF' : 'CNPJ'}</label>
                  <input className="inp" name="documento" value={form.documento} onChange={handle}
                    placeholder={form.tipo === 'PF' ? '000.000.000-00' : '00.000.000/0001-00'} required />
                </div>

                <div className="form-group">
                  <label className="lbl">Nome da loja / fantasia</label>
                  <input className="inp" name="nomeFantasia" value={form.nomeFantasia} onChange={handle}
                    placeholder="Ex: Burger do Zé" required />
                </div>
              </>
            )}

            {/* ── Motoboy / Mototaxi: veículo ── */}
            {isWorker && (
              <>
                <div className="divider" />
                <p className="sect-title" style={{ marginBottom: 14 }}>🏍️ Dados do veículo</p>

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
              marginTop: 8, fontSize: 17, background: btnBg, boxShadow: btnShadow,
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

