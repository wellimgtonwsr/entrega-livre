import { useState, useEffect, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import api from '../../services/api'
import { useSocket } from '../../context/SocketContext'
import CardProposta from '../../components/CardProposta'



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

  // Timer — auto-redireciona quando expira
  useEffect(() => {
    if (!pedido?.expiresAt) return
    const tick = () => {
      const diff = Math.max(0, new Date(pedido.expiresAt) - new Date())
      const m = String(Math.floor(diff / 60000)).padStart(2, '0')
      const s = String(Math.floor((diff % 60000) / 1000)).padStart(2, '0')
      setTimer(`${m}:${s}`)
      if (diff === 0) {
        clearInterval(id)
        setPedido(prev => prev ? { ...prev, status: 'EXPIRED' } : prev)
      }
    }
    let id = setInterval(tick, 1000)
    tick()
    return () => clearInterval(id)
  }, [pedido?.expiresAt])

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
    <div style={{ display: 'flex', flexDirection: 'column', height: '100dvh', background: 'var(--bg)' }}>
      {/* Header */}
      <div className="page-header" style={{ flexDirection: 'column', alignItems: 'flex-start', gap: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <button onClick={() => navigate(-1)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 22, color: '#fff', padding: '4px 8px' }}>←</button>
          <div className="page-header-title">Aguardando motoboys 🛵</div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
          <span style={{ color: 'rgba(255,255,255,0.6)', fontSize: 13 }}>Expira em:</span>
          <span className="badge" style={{ background: 'rgba(245,158,11,0.2)', color: 'var(--brand)', fontWeight: 700 }}>⏱ {timer || '--:--'}</span>
          <span style={{ color: 'rgba(255,255,255,0.6)', fontSize: 13 }}>Proposta: R$ {pedido?.valorProposto?.toFixed(2)}</span>
        </div>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: '16px 16px', paddingBottom: 'max(24px, env(safe-area-inset-bottom))' }}>
        {pendentes.length === 0 ? (
          <div style={{ textAlign: 'center', color: 'var(--text3)', marginTop: 48 }}>
            <div style={{ fontSize: 52, marginBottom: 12 }} className="anim-in">🔍</div>
            <p style={{ fontWeight: 600, color: 'var(--text)', fontSize: 15 }}>Procurando motoboys próximos...</p>
            <p style={{ fontSize: 13, marginTop: 4 }}>Se ninguém responder, tente aumentar o valor proposto.</p>
          </div>
        ) : (
          <>
            <p className="sect-title">{pendentes.length} proposta{pendentes.length > 1 ? 's' : ''} recebida{pendentes.length > 1 ? 's' : ''}</p>
            {pendentes.map(prop => (
              <CardProposta key={prop.id} proposta={prop} onAceitar={() => aceitar(prop.id)} disabled={loading} />
            ))}
          </>
        )}

        {isPendente && (
          <button className="btn btn-danger" style={{ width: '100%', marginTop: 20 }} onClick={cancelar}>Cancelar pedido</button>
        )}

        {pedido?.status === 'EXPIRED' && (
          <div style={{ textAlign: 'center', marginTop: 32 }}>
            <div style={{ fontSize: 48, marginBottom: 8 }}>⏰</div>
            <p style={{ fontWeight: 700, color: 'var(--error)', fontSize: 15 }}>Pedido expirado</p>
            <button className="btn btn-primary" style={{ width: '100%', marginTop: 16 }} onClick={() => navigate('/cliente/novo-pedido')}>
              Fazer novo pedido
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
