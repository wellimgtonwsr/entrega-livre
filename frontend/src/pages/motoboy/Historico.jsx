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

const s = {
  wrap: { display: 'flex', flexDirection: 'column', minHeight: '100dvh', background: '#f5f5f5' },
  header: { background: '#1a1a2e', padding: '20px', color: '#fff' },
  title: { fontSize: 20, fontWeight: 800 },
  body: { flex: 1, padding: '16px 16px 80px' },
  card: { background: '#fff', borderRadius: 16, padding: 16, marginBottom: 12, boxShadow: '0 2px 8px rgba(0,0,0,0.05)' },
  row: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  status: { padding: '3px 10px', borderRadius: 20, fontSize: 12, fontWeight: 700 },
  rota: { color: '#444', fontSize: 14, marginBottom: 6 },
  valor: { fontWeight: 800, fontSize: 20, color: '#10b981' },
  data: { fontSize: 12, color: '#aaa' },
  empty: { textAlign: 'center', color: '#aaa', marginTop: 60, fontSize: 15 },
}

export default function HistoricoMotoboy() {
  const navigate = useNavigate()
  const [pedidos, setPedidos] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get('/pedidos/historico').then(r => setPedidos(r.data.data)).catch(() => {}).finally(() => setLoading(false))
  }, [])

  return (
    <div style={s.wrap}>
      <div style={s.header}>
        <div style={s.title}>Meu histórico 💰</div>
      </div>
      <div style={s.body}>
        {loading && <div style={s.empty}>Carregando...</div>}
        {!loading && pedidos.length === 0 && <div style={s.empty}>Nenhuma corrida ainda</div>}

        {pedidos.map(p => {
          const st = STATUS_LABELS[p.status] || { label: p.status, color: '#888' }
          return (
            <div key={p.id} style={s.card}>
              <div style={s.row}>
                <span style={{ ...s.status, background: st.color + '22', color: st.color }}>{st.label}</span>
                <span style={s.data}>{new Date(p.createdAt).toLocaleDateString('pt-BR')}</span>
              </div>
              <div style={s.rota}>📍 {p.origemEndereco}</div>
              <div style={s.rota}>🏁 {p.destinoEndereco}</div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={s.valor}>+R$ {(p.valorFinal ?? p.valorProposto).toFixed(2)}</div>
                {p.status === 'ACCEPTED' || p.status === 'IN_PROGRESS' ? (
                  <button
                    onClick={() => navigate(`/motoboy/em-andamento/${p.id}`)}
                    style={{ background: '#1a1a2e', color: '#fff', border: 'none', borderRadius: 10, padding: '8px 14px', cursor: 'pointer', fontSize: 13, fontWeight: 600 }}
                  >
                    Abrir
                  </button>
                ) : null}
              </div>
            </div>
          )
        })}
      </div>
      <BottomNav role="MOTOBOY" />
    </div>
  )
}
