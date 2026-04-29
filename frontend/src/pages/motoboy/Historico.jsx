import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../../services/api'
import BottomNav from '../../components/BottomNav'

const STATUS_LABELS = {
  WAITING_OFFERS: { label: 'Aguardando', color: '#f59e0b' },
  ACCEPTED: { label: 'Aceito', color: '#3b82f6' },
  IN_PROGRESS: { label: 'Em andamento', color: '#8b5cf6' },
  DELIVERED: { label: 'Entregue', color: '#10b981' },
  CANCELLED: { label: 'Cancelado', color: '#ef4444' },
  EXPIRED: { label: 'Expirado', color: '#9ca3af' },
}



export default function HistoricoMotoboy() {
  const navigate = useNavigate()
  const [pedidos, setPedidos] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get('/pedidos/historico').then(r => setPedidos(r.data.data)).catch(() => {}).finally(() => setLoading(false))
  }, [])

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100dvh', background: 'var(--bg)' }}>
      <div className="page-header">
        <div className="page-header-title">Meu histórico 💰</div>
      </div>
      <div style={{ flex: 1, padding: '16px', paddingBottom: 'max(90px, calc(90px + env(safe-area-inset-bottom)))' }}>
        {loading && <div style={{ textAlign: 'center', color: 'var(--text3)', marginTop: 60 }}><div className="spinner" style={{ margin: '0 auto' }} /></div>}
        {!loading && pedidos.length === 0 && (
          <div style={{ textAlign: 'center', color: 'var(--text3)', marginTop: 60 }}>
            <div style={{ fontSize: 40, marginBottom: 10 }}>🛵</div>
            <p style={{ fontWeight: 600 }}>Nenhuma corrida ainda</p>
          </div>
        )}
        {pedidos.map(p => {
          const st = STATUS_LABELS[p.status] || { label: p.status, color: 'var(--text3)' }
          return (
            <div key={p.id} className="card" style={{ marginBottom: 12 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                <span className="badge" style={{ background: st.color + '22', color: st.color }}>{st.label}</span>
                <span style={{ fontSize: 12, color: 'var(--text3)' }}>{new Date(p.createdAt).toLocaleDateString('pt-BR')}</span>
              </div>
              <div style={{ color: 'var(--text2)', fontSize: 14, marginBottom: 4 }}>📍 {p.origemEndereco}</div>
              <div style={{ color: 'var(--text2)', fontSize: 14, marginBottom: 8 }}>🏁 {p.destinoEndereco}</div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ fontWeight: 800, fontSize: 20, color: 'var(--success)' }}>+R$ {(p.valorFinal ?? p.valorProposto).toFixed(2)}</div>
                {(p.status === 'ACCEPTED' || p.status === 'IN_PROGRESS') && (
                  <button onClick={() => navigate(`/motoboy/em-andamento/${p.id}`)} className="btn btn-sm" style={{ background: 'var(--dark)', color: '#fff' }}>
                    Abrir
                  </button>
                )}
              </div>
            </div>
          )
        })}
      </div>
      <BottomNav role="MOTOBOY" />
    </div>
  )
}
