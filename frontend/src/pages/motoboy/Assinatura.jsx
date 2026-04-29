import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import api from '../../services/api'
import StatusAssinatura from '../../components/StatusAssinatura'
import BottomNav from '../../components/BottomNav'



export default function Assinatura() {
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const [planos, setPlanos] = useState([])
  const [assinatura, setAssinatura] = useState(null)
  const [selected, setSelected] = useState(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    Promise.all([
      api.get('/planos'),
      api.get('/assinatura/status'),
    ]).then(([pRes, aRes]) => {
      setPlanos(pRes.data.data)
      setAssinatura(aRes.data.data)
      if (pRes.data.data.length > 0) setSelected(pRes.data.data[0].id)
    }).catch(() => {})
  }, [])

  const assinar = async () => {
    if (!selected) return
    setLoading(true)
    try {
      const res = await api.post('/assinatura/criar', { planoId: selected })
      const { initPoint } = res.data.data
      if (initPoint && initPoint !== '#') {
        window.location.href = initPoint
      } else {
        alert('Assinatura criada! Aguarde confirmação do pagamento.')
        navigate('/motoboy/dashboard')
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Erro ao iniciar assinatura')
    } finally {
      setLoading(false)
    }
  }

  const cancelar = async () => {
    if (!confirm('Cancelar assinatura?')) return
    try {
      await api.delete('/assinatura/cancelar')
      setAssinatura(prev => ({ ...prev, status: 'CANCELLED' }))
    } catch (err) {
      alert(err.response?.data?.message || 'Erro ao cancelar')
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100dvh', background: 'var(--bg)' }}>
      <div className="page-header" style={{ flexDirection: 'column', alignItems: 'flex-start', gap: 4 }}>
        <div className="page-header-title">Assinatura 💳</div>
        <div className="page-header-sub">Pague mensalidade fixa, fique com 100% de cada entrega</div>
      </div>

      <div style={{ flex: 1, padding: '16px', paddingBottom: 'max(90px, calc(90px + env(safe-area-inset-bottom)))' }}>
        <StatusAssinatura assinatura={assinatura} />

        {assinatura?.status !== 'ACTIVE' && (
          <>
            <p className="sect-title">Escolha seu plano</p>
            {planos.map(p => (
              <div
                key={p.id}
                className="card"
                style={{
                  marginBottom: 12, cursor: 'pointer',
                  border: selected === p.id ? '2px solid var(--brand)' : '2px solid transparent',
                  transition: 'border-color 0.15s',
                }}
                onClick={() => setSelected(p.id)}
              >
                <div style={{ fontWeight: 800, fontSize: 18, color: 'var(--text)', marginBottom: 4 }}>{p.name}</div>
                <div style={{ fontWeight: 800, fontSize: 28, color: 'var(--success)', marginBottom: 4 }}>
                  R$ {p.price.toFixed(2)}<span style={{ fontSize: 14, color: 'var(--text3)', fontWeight: 400 }}>/mês</span>
                </div>
                <div style={{ color: 'var(--text2)', fontSize: 14 }}>{p.description}</div>
                {selected === p.id && <div style={{ color: 'var(--brand)', fontWeight: 700, fontSize: 13, marginTop: 6 }}>✓ Selecionado</div>}
              </div>
            ))}

            <button className="btn btn-primary" style={{ width: '100%', marginTop: 8 }} onClick={assinar} disabled={loading || !selected}>
              {loading ? 'Redirecionando...' : '💳 Assinar agora via Mercado Pago'}
            </button>
            <p style={{ fontSize: 13, color: 'var(--text3)', textAlign: 'center', marginTop: 12 }}>
              Clientes usam o app GRÁTIS. Só o motoboy paga mensalidade.
            </p>
          </>
        )}

        {assinatura?.status === 'ACTIVE' && (
          <>
            <div className="alert alert-success" style={{ marginBottom: 14 }}>
              <div style={{ fontWeight: 700, fontSize: 15 }}>✅ Assinatura ativa</div>
              <div style={{ fontSize: 13, marginTop: 4 }}>
                Plano: {assinatura.plano?.name} — R$ {assinatura.plano?.price?.toFixed(2)}/mês<br />
                Válida até: {assinatura.endDate ? new Date(assinatura.endDate).toLocaleDateString('pt-BR') : '—'}
              </div>
            </div>
            <button className="btn btn-danger" style={{ width: '100%' }} onClick={cancelar}>
              Cancelar assinatura
            </button>
          </>
        )}
      </div>
      <BottomNav role="MOTOBOY" />
    </div>
  )
}
