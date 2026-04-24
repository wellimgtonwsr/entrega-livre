import { useState, useEffect, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import api from '../../services/api'
import { useSocket } from '../../context/SocketContext'
import CardProposta from '../../components/CardProposta'

const s = {
  wrap: { display: 'flex', flexDirection: 'column', height: '100dvh', background: '#f5f5f5' },
  header: { background: '#1a1a2e', padding: '20px', color: '#fff' },
  title: { fontSize: 20, fontWeight: 800 },
  timerRow: { display: 'flex', alignItems: 'center', gap: 8, marginTop: 8 },
  timerBadge: { background: 'rgba(245,158,11,0.2)', color: '#f59e0b', padding: '4px 12px', borderRadius: 20, fontSize: 14, fontWeight: 700 },
  body: { flex: 1, overflowY: 'auto', padding: '16px 16px 80px' },
  empty: { textAlign: 'center', color: '#888', marginTop: 40, fontSize: 15 },
  anim: { fontSize: 40, display: 'block', marginBottom: 12 },
  cancelBtn: { width: '100%', padding: 14, borderRadius: 14, background: '#fee2e2', border: 'none', color: '#dc2626', fontSize: 16, fontWeight: 700, cursor: 'pointer', marginTop: 16 },
}

export default function AguardandoOfertas() {
  const { pedidoId } = useParams()
  const navigate = useNavigate()
  const { socket } = useSocket()
  const [propostas, setPropostas] = useState([])
  const [pedido, setPedido] = useState(null)
  const [timer, setTimer] = useState(null)
  const [loading, setLoading] = useState(false)

  const carregar = useCallback(async () => {
    try {
      const [pedRes, propRes] = await Promise.all([
        api.get(`/pedidos/${pedidoId}`),
        api.get(`/pedidos/${pedidoId}/propostas`),
      ])
      setPedido(pedRes.data.data)
      setPropostas(propRes.data.data)
    } catch {}
  }, [pedidoId])

  useEffect(() => {
    carregar()
  }, [carregar])

  // Timer
  useEffect(() => {
    if (!pedido?.expiresAt) return
    const tick = () => {
      const diff = Math.max(0, new Date(pedido.expiresAt) - new Date())
      const m = String(Math.floor(diff / 60000)).padStart(2, '0')
      const s = String(Math.floor((diff % 60000) / 1000)).padStart(2, '0')
      setTimer(`${m}:${s}`)
      if (diff === 0) carregar()
    }
    tick()
    const id = setInterval(tick, 1000)
    return () => clearInterval(id)
  }, [pedido?.expiresAt, carregar])

  // Socket: nova proposta
  useEffect(() => {
    if (!socket) return
    socket.emit('pedido:join', { pedidoId })

    const handler = ({ proposta }) => {
      setPropostas(prev => {
        const existe = prev.find(p => p.id === proposta.id)
        return existe ? prev : [proposta, ...prev]
      })
    }
    socket.on('proposta:nova', handler)

    const aceitoHandler = ({ motoboyId }) => {
      navigate(`/cliente/acompanhar/${pedidoId}`)
    }
    socket.on('pedido:aceito', aceitoHandler)

    return () => {
      socket.off('proposta:nova', handler)
      socket.off('pedido:aceito', aceitoHandler)
    }
  }, [socket, pedidoId, navigate])

  const aceitar = async (propostaId) => {
    setLoading(true)
    try {
      await api.post(`/propostas/${propostaId}/aceitar`)
      navigate(`/cliente/acompanhar/${pedidoId}`)
    } catch (err) {
      alert(err.response?.data?.message || 'Erro')
    } finally {
      setLoading(false)
    }
  }

  const cancelar = async () => {
    if (!confirm('Cancelar pedido?')) return
    try {
      await api.delete(`/pedidos/${pedidoId}/cancelar`)
      navigate('/cliente/novo-pedido')
    } catch (err) {
      alert(err.response?.data?.message || 'Erro ao cancelar')
    }
  }

  const isPendente = pedido?.status === 'WAITING_OFFERS'
  const pendentes = propostas.filter(p => p.status === 'PENDING')

  return (
    <div style={s.wrap}>
      <div style={s.header}>
        <div style={s.title}>Aguardando motoboys 🛵</div>
        <div style={s.timerRow}>
          <span style={{ color: 'rgba(255,255,255,0.7)', fontSize: 13 }}>Expira em:</span>
          <span style={s.timerBadge}>⏱ {timer || '--:--'}</span>
          <span style={{ color: 'rgba(255,255,255,0.7)', fontSize: 13 }}>Proposta: R$ {pedido?.valorProposto?.toFixed(2)}</span>
        </div>
      </div>

      <div style={s.body}>
        {pendentes.length === 0 ? (
          <div style={s.empty}>
            <span style={s.anim}>🔍</span>
            Procurando motoboys próximos...
            <br /><br />
            <span style={{ fontSize: 13 }}>Se ninguém responder, tente aumentar o valor proposto.</span>
          </div>
        ) : (
          <>
            <div style={{ fontSize: 15, fontWeight: 700, color: '#444', marginBottom: 12 }}>
              {pendentes.length} proposta{pendentes.length > 1 ? 's' : ''} recebida{pendentes.length > 1 ? 's' : ''}
            </div>
            {pendentes.map(prop => (
              <CardProposta key={prop.id} proposta={prop} onAceitar={() => aceitar(prop.id)} disabled={loading} />
            ))}
          </>
        )}

        {isPendente && (
          <button style={s.cancelBtn} onClick={cancelar}>Cancelar pedido</button>
        )}

        {pedido?.status === 'EXPIRED' && (
          <div style={{ textAlign: 'center', marginTop: 20 }}>
            <div style={{ fontSize: 36, marginBottom: 8 }}>⏰</div>
            <div style={{ fontWeight: 700, color: '#dc2626' }}>Pedido expirado</div>
            <button style={{ ...s.cancelBtn, background: '#f59e0b', color: '#1a1a2e', marginTop: 12 }} onClick={() => navigate('/cliente/novo-pedido')}>
              Fazer novo pedido
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
