import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import api from '../../services/api'
import { useSocket } from '../../context/SocketContext'

const STATUS_INFO = {
  PENDENTE:   { label: 'Pedido recebido', desc: 'Aguardando confirmação do restaurante...', icon: '⏳', color: '#f59e0b', step: 1 },
  PREPARANDO: { label: 'Preparando', desc: 'O restaurante está preparando seu pedido!', icon: '👨‍🍳', color: '#6366f1', step: 2 },
  PRONTO:     { label: 'Pronto para retirada', desc: 'Seu pedido está pronto!', icon: '✅', color: '#10b981', step: 3 },
  CONCLUIDO:  { label: 'Concluído', desc: 'Pedido entregue. Bom apetite!', icon: '🎉', color: '#10b981', step: 4 },
  CANCELADO:  { label: 'Cancelado', desc: 'O pedido foi cancelado.', icon: '❌', color: '#ef4444', step: 0 },
}

export default function PedidoRestaurante() {
  const { pedidoId } = useParams()
  const navigate = useNavigate()
  const { socket } = useSocket()

  const [pedido, setPedido] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get(`/restaurantes/pedido/${pedidoId}`)
      .then(r => setPedido(r.data.data))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [pedidoId])

  useEffect(() => {
    if (!socket) return
    socket.emit('entrar_pedido_rest', pedidoId)
    const statusHandler = ({ status }) => setPedido(prev => prev ? { ...prev, status } : prev)
    socket.on('restaurante:status', statusHandler)
    return () => socket.off('restaurante:status', statusHandler)
  }, [socket, pedidoId])

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100dvh' }}>
      <div className="spinner" style={{ width: 40, height: 40 }} />
    </div>
  )

  if (!pedido) return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100dvh', gap: 12 }}>
      <div style={{ fontSize: 48 }}>😕</div>
      <p style={{ fontWeight: 700 }}>Pedido não encontrado</p>
      <button onClick={() => navigate('/restaurantes')} style={{ background: '#f59e0b', border: 'none', borderRadius: 12, padding: '12px 24px', color: '#fff', fontWeight: 700, cursor: 'pointer' }}>Ver restaurantes</button>
    </div>
  )

  const info = STATUS_INFO[pedido.status] || STATUS_INFO.PENDENTE
  const STEPS = [
    { label: 'Recebido', icon: '📥', step: 1 },
    { label: 'Preparando', icon: '👨‍🍳', step: 2 },
    { label: 'Pronto', icon: '✅', step: 3 },
  ]

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100dvh', background: 'var(--bg)' }}>

      {/* Header */}
      <div style={{ background: `linear-gradient(135deg, ${info.color}, ${info.color}cc)`, padding: '52px 20px 28px', paddingTop: 'max(52px, calc(20px + env(safe-area-inset-top)))', textAlign: 'center', position: 'relative' }}>
        <button onClick={() => navigate('/restaurantes')} style={{ position: 'absolute', top: 'max(16px, env(safe-area-inset-top))', left: 16, background: 'rgba(255,255,255,0.2)', border: 'none', borderRadius: 10, width: 36, height: 36, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#fff', fontSize: 18 }}>←</button>
        <div style={{ fontSize: 64, marginBottom: 12 }}>{info.icon}</div>
        <div style={{ color: '#fff', fontWeight: 900, fontSize: 22 }}>{info.label}</div>
        <div style={{ color: 'rgba(255,255,255,0.8)', fontSize: 14, marginTop: 4 }}>{info.desc}</div>
        <div style={{ marginTop: 8, color: 'rgba(255,255,255,0.7)', fontSize: 13 }}>
          Pedido #{pedido.numero} · {pedido.restaurante?.nome}
        </div>
      </div>

      {/* Barra de progresso */}
      {pedido.status !== 'CANCELADO' && (
        <div style={{ background: '#fff', padding: '20px 24px', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            {STEPS.map((s, idx) => (
              <div key={s.step} style={{ display: 'flex', alignItems: 'center', flex: idx < STEPS.length - 1 ? 1 : 'none' }}>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                  <div style={{ width: 40, height: 40, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, background: info.step >= s.step ? info.color : '#f3f4f6', transition: 'all 0.3s' }}>
                    {s.icon}
                  </div>
                  <span style={{ fontSize: 11, fontWeight: 600, color: info.step >= s.step ? info.color : '#9ca3af' }}>{s.label}</span>
                </div>
                {idx < STEPS.length - 1 && (
                  <div style={{ flex: 1, height: 3, background: info.step > s.step ? info.color : '#e5e7eb', margin: '0 6px', marginBottom: 20, borderRadius: 99, transition: 'all 0.3s' }} />
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Itens do pedido */}
      <div style={{ flex: 1, padding: '16px 20px', paddingBottom: 'max(24px, env(safe-area-inset-bottom))' }}>
        <div style={{ fontWeight: 800, fontSize: 16, marginBottom: 12 }}>Itens do pedido</div>
        <div style={{ background: '#fff', borderRadius: 14, overflow: 'hidden', boxShadow: '0 2px 8px rgba(0,0,0,0.05)', marginBottom: 14 }}>
          {pedido.itens.map((item, i) => (
            <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px', borderBottom: i < pedido.itens.length - 1 ? '1px solid #f3f4f6' : 'none' }}>
              <div>
                <span style={{ fontWeight: 600, fontSize: 14 }}>{item.quantidade}× {item.nome}</span>
              </div>
              <span style={{ fontWeight: 700, color: '#f59e0b' }}>R$ {(item.preco * item.quantidade).toFixed(2)}</span>
            </div>
          ))}
          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 16px', borderTop: '2px solid #f3f4f6', background: '#fafafa' }}>
            <span style={{ fontWeight: 700 }}>Total</span>
            <span style={{ fontWeight: 900, fontSize: 18, color: '#f59e0b' }}>R$ {pedido.total.toFixed(2)}</span>
          </div>
        </div>

        {pedido.observacoes && (
          <div style={{ background: '#fff', borderRadius: 14, padding: '12px 16px', boxShadow: '0 2px 8px rgba(0,0,0,0.05)', marginBottom: 14 }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: '#9ca3af', marginBottom: 4 }}>OBSERVAÇÕES</div>
            <div style={{ fontSize: 14 }}>{pedido.observacoes}</div>
          </div>
        )}

        {(pedido.status === 'CONCLUIDO' || pedido.status === 'CANCELADO') && (
          <button
            onClick={() => navigate('/restaurantes')}
            style={{ width: '100%', padding: '14px', background: '#f59e0b', border: 'none', borderRadius: 14, color: '#fff', fontWeight: 800, fontSize: 16, cursor: 'pointer' }}
          >
            Fazer novo pedido
          </button>
        )}
      </div>
    </div>
  )
}
