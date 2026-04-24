import { useState, useEffect } from 'react'
import api from '../../services/api'

const s = {
  wrap: { minHeight: '100dvh', background: '#0f172a', color: '#fff', padding: 20 },
  title: { fontSize: 26, fontWeight: 800, marginBottom: 20 },
  grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 12, marginBottom: 20 },
  card: { background: 'rgba(255,255,255,0.08)', borderRadius: 14, padding: 16 },
  cardLabel: { fontSize: 13, opacity: 0.7, marginBottom: 6 },
  cardVal: { fontSize: 28, fontWeight: 800 },
  section: { background: 'rgba(255,255,255,0.06)', borderRadius: 14, padding: 16, marginBottom: 14 },
  sectionTitle: { fontSize: 16, fontWeight: 700, marginBottom: 12 },
  table: { width: '100%', borderCollapse: 'collapse' },
  th: { textAlign: 'left', fontSize: 12, opacity: 0.7, paddingBottom: 8 },
  td: { padding: '10px 0', borderTop: '1px solid rgba(255,255,255,0.1)', fontSize: 14 },
  btn: { background: '#f59e0b', color: '#1a1a2e', border: 'none', borderRadius: 10, padding: '6px 12px', fontSize: 12, fontWeight: 700, cursor: 'pointer' },
}

export default function PainelAdmin() {
  const [metricas, setMetricas] = useState(null)
  const [receita, setReceita] = useState(null)
  const [motoboys, setMotoboys] = useState([])
  const [pedidos, setPedidos] = useState([])

  const carregar = async () => {
    try {
      const [mRes, rRes, mbRes, pRes] = await Promise.all([
        api.get('/admin/metricas'),
        api.get('/admin/receita'),
        api.get('/admin/motoboys?limit=10'),
        api.get('/admin/pedidos?limit=10'),
      ])
      setMetricas(mRes.data.data)
      setReceita(rRes.data.data)
      setMotoboys(mbRes.data.data)
      setPedidos(pRes.data.data)
    } catch (err) {
      console.error(err)
    }
  }

  useEffect(() => { carregar() }, [])

  const aprovar = async (id) => {
    try {
      await api.put(`/admin/motoboy/${id}/aprovar`)
      carregar()
    } catch (err) {
      alert(err.response?.data?.message || 'Erro ao aprovar')
    }
  }

  return (
    <div style={s.wrap}>
      <div style={s.title}>Painel Admin ⚙️</div>

      <div style={s.grid}>
        <div style={s.card}><div style={s.cardLabel}>Pedidos totais</div><div style={s.cardVal}>{metricas?.totalPedidos ?? '-'}</div></div>
        <div style={s.card}><div style={s.cardLabel}>Pedidos hoje</div><div style={s.cardVal}>{metricas?.pedidosHoje ?? '-'}</div></div>
        <div style={s.card}><div style={s.cardLabel}>Taxa de conclusão</div><div style={s.cardVal}>{metricas?.taxaConclusao ?? '-'}</div></div>
        <div style={s.card}><div style={s.cardLabel}>Assinaturas ativas</div><div style={s.cardVal}>{receita?.assinaturasAtivas ?? '-'}</div></div>
        <div style={s.card}><div style={s.cardLabel}>Receita mensal</div><div style={s.cardVal}>R$ {receita?.receitaMensal?.toFixed?.(2) ?? '-'}</div></div>
      </div>

      <div style={s.section}>
        <div style={s.sectionTitle}>Motoboys recentes</div>
        <table style={s.table}>
          <thead>
            <tr>
              <th style={s.th}>Nome</th>
              <th style={s.th}>Status</th>
              <th style={s.th}>Assinatura</th>
              <th style={s.th}>Ação</th>
            </tr>
          </thead>
          <tbody>
            {motoboys.map(m => (
              <tr key={m.id}>
                <td style={s.td}>{m.user?.name}</td>
                <td style={s.td}>{m.status}</td>
                <td style={s.td}>{m.assinatura?.status || 'SEM_ASSINATURA'}</td>
                <td style={s.td}>
                  {m.status === 'PENDING' ? (
                    <button style={s.btn} onClick={() => aprovar(m.id)}>Aprovar</button>
                  ) : '—'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div style={s.section}>
        <div style={s.sectionTitle}>Pedidos recentes</div>
        <table style={s.table}>
          <thead>
            <tr>
              <th style={s.th}>Data</th>
              <th style={s.th}>Cliente</th>
              <th style={s.th}>Status</th>
              <th style={s.th}>Valor</th>
            </tr>
          </thead>
          <tbody>
            {pedidos.map(p => (
              <tr key={p.id}>
                <td style={s.td}>{new Date(p.createdAt).toLocaleDateString('pt-BR')}</td>
                <td style={s.td}>{p.cliente?.name}</td>
                <td style={s.td}>{p.status}</td>
                <td style={s.td}>R$ {(p.valorFinal ?? p.valorProposto).toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
