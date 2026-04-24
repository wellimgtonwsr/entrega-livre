import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import api from '../../services/api'
import StatusAssinatura from '../../components/StatusAssinatura'
import BottomNav from '../../components/BottomNav'

const s = {
  wrap: { display: 'flex', flexDirection: 'column', minHeight: '100dvh', background: '#f5f5f5' },
  header: { background: '#1a1a2e', padding: '20px', color: '#fff' },
  title: { fontSize: 20, fontWeight: 800 },
  body: { flex: 1, padding: '16px 16px 80px' },
  card: { background: '#fff', borderRadius: 16, padding: 20, marginBottom: 14, boxShadow: '0 2px 8px rgba(0,0,0,0.05)', border: '2px solid transparent' },
  cardSelected: { border: '2px solid #f59e0b' },
  planoNome: { fontSize: 18, fontWeight: 800, color: '#1a1a2e', marginBottom: 4 },
  planoPreco: { fontSize: 28, fontWeight: 800, color: '#10b981', marginBottom: 4 },
  planoDesc: { color: '#666', fontSize: 14 },
  btn: { width: '100%', padding: 16, borderRadius: 14, background: '#f59e0b', border: 'none', color: '#1a1a2e', fontSize: 17, fontWeight: 700, cursor: 'pointer', marginTop: 16 },
  free: { fontSize: 13, color: '#888', textAlign: 'center', marginTop: 12 },
}

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
    <div style={s.wrap}>
      <div style={s.header}>
        <div style={s.title}>Assinatura 💳</div>
        <div style={{ fontSize: 13, opacity: 0.7, marginTop: 4 }}>Pague mensalidade fixa, fique com 100% de cada entrega</div>
      </div>

      <div style={s.body}>
        <StatusAssinatura assinatura={assinatura} />

        {assinatura?.status !== 'ACTIVE' && (
          <>
            <div style={{ fontWeight: 700, fontSize: 16, color: '#1a1a2e', marginBottom: 14 }}>Escolha seu plano:</div>
            {planos.map(p => (
              <div
                key={p.id}
                style={{ ...s.card, ...(selected === p.id ? s.cardSelected : {}) }}
                onClick={() => setSelected(p.id)}
              >
                <div style={s.planoNome}>{p.name}</div>
                <div style={s.planoPreco}>R$ {p.price.toFixed(2)}<span style={{ fontSize: 14, color: '#888' }}>/mês</span></div>
                <div style={s.planoDesc}>{p.description}</div>
                {selected === p.id && <div style={{ color: '#f59e0b', fontWeight: 700, fontSize: 13, marginTop: 6 }}>✓ Selecionado</div>}
              </div>
            ))}

            <button style={s.btn} onClick={assinar} disabled={loading || !selected}>
              {loading ? 'Redirecionando...' : '💳 Assinar agora via Mercado Pago'}
            </button>
            <div style={s.free}>Clientes usam o app GRÁTIS. Só o motoboy paga mensalidade.</div>
          </>
        )}

        {assinatura?.status === 'ACTIVE' && (
          <>
            <div style={{ background: '#dcfce7', borderRadius: 14, padding: 16, marginBottom: 14 }}>
              <div style={{ fontWeight: 700, color: '#166534', fontSize: 15 }}>✅ Assinatura ativa</div>
              <div style={{ color: '#166534', fontSize: 13, marginTop: 4 }}>
                Plano: {assinatura.plano?.name} — R$ {assinatura.plano?.price?.toFixed(2)}/mês<br />
                Válida até: {assinatura.endDate ? new Date(assinatura.endDate).toLocaleDateString('pt-BR') : '—'}
              </div>
            </div>
            <button
              onClick={cancelar}
              style={{ width: '100%', padding: 14, borderRadius: 14, background: '#fee2e2', border: 'none', color: '#dc2626', fontSize: 15, fontWeight: 700, cursor: 'pointer' }}
            >
              Cancelar assinatura
            </button>
          </>
        )}
      </div>
      <BottomNav role="MOTOBOY" />
    </div>
  )
}
