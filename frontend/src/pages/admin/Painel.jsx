import { useState, useEffect } from 'react'
import api from '../../services/api'



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
    <div style={{ minHeight: '100dvh', background: 'var(--dark)', color: '#fff', padding: 20 }}>
      <div style={{ fontSize: 24, fontWeight: 800, marginBottom: 20 }}>Painel Admin ⚙️</div>

      {/* Métricas */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 12, marginBottom: 20 }}>
        {[
          { label: 'Pedidos totais', val: metricas?.totalPedidos },
          { label: 'Pedidos hoje', val: metricas?.pedidosHoje },
          { label: 'Taxa conclusão', val: metricas?.taxaConclusao },
          { label: 'Assinaturas ativas', val: receita?.assinaturasAtivas },
          { label: 'Receita mensal', val: receita?.receitaMensal != null ? `R$ ${receita.receitaMensal.toFixed(2)}` : null },
        ].map((m, i) => (
          <div key={i} style={{ background: 'rgba(255,255,255,0.08)', borderRadius: 14, padding: 16 }}>
            <div style={{ fontSize: 12, opacity: 0.65, marginBottom: 6 }}>{m.label}</div>
            <div style={{ fontSize: 26, fontWeight: 800 }}>{m.val ?? '—'}</div>
          </div>
        ))}
      </div>

      {/* Motoboys */}
      <div style={{ background: 'rgba(255,255,255,0.06)', borderRadius: 14, padding: 16, marginBottom: 14 }}>
        <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 12 }}>Motoboys recentes</div>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              {['Nome', 'Status', 'Assinatura', 'Ação'].map(h => (
                <th key={h} style={{ textAlign: 'left', fontSize: 12, opacity: 0.6, paddingBottom: 8 }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {motoboys.map(m => (
              <tr key={m.id}>
                <td style={{ padding: '10px 0', borderTop: '1px solid rgba(255,255,255,0.08)', fontSize: 14 }}>{m.user?.name}</td>
                <td style={{ padding: '10px 0', borderTop: '1px solid rgba(255,255,255,0.08)', fontSize: 14 }}>{m.status}</td>
                <td style={{ padding: '10px 0', borderTop: '1px solid rgba(255,255,255,0.08)', fontSize: 14 }}>{m.assinatura?.status || 'SEM'}</td>
                <td style={{ padding: '10px 0', borderTop: '1px solid rgba(255,255,255,0.08)', fontSize: 14 }}>
                  {m.status === 'PENDING' ? (
                    <button className="btn btn-primary btn-sm" onClick={() => aprovar(m.id)}>Aprovar</button>
                  ) : '—'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pedidos */}
      <div style={{ background: 'rgba(255,255,255,0.06)', borderRadius: 14, padding: 16 }}>
        <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 12 }}>Pedidos recentes</div>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              {['Data', 'Cliente', 'Status', 'Valor'].map(h => (
                <th key={h} style={{ textAlign: 'left', fontSize: 12, opacity: 0.6, paddingBottom: 8 }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {pedidos.map(p => (
              <tr key={p.id}>
                <td style={{ padding: '10px 0', borderTop: '1px solid rgba(255,255,255,0.08)', fontSize: 14 }}>{new Date(p.createdAt).toLocaleDateString('pt-BR')}</td>
                <td style={{ padding: '10px 0', borderTop: '1px solid rgba(255,255,255,0.08)', fontSize: 14 }}>{p.cliente?.name}</td>
                <td style={{ padding: '10px 0', borderTop: '1px solid rgba(255,255,255,0.08)', fontSize: 14 }}>{p.status}</td>
                <td style={{ padding: '10px 0', borderTop: '1px solid rgba(255,255,255,0.08)', fontSize: 14 }}>R$ {(p.valorFinal ?? p.valorProposto).toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
