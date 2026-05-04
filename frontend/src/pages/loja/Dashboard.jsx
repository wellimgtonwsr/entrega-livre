import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { useSocket } from '../../context/SocketContext'
import api from '../../services/api'
import BottomNav from '../../components/BottomNav'

const STATUS_LABEL = {
  PENDENTE: { label: 'Pendente', color: '#f59e0b', bg: 'rgba(245,158,11,0.15)' },
  PREPARANDO: { label: 'Preparando', color: '#3b82f6', bg: 'rgba(59,130,246,0.15)' },
  PRONTO: { label: 'Pronto', color: '#8b5cf6', bg: 'rgba(139,92,246,0.15)' },
  ENTREGANDO: { label: 'Entregando', color: '#f97316', bg: 'rgba(249,115,22,0.15)' },
  ENTREGUE: { label: 'Entregue', color: '#16a34a', bg: 'rgba(22,163,74,0.15)' },
  CANCELADO: { label: 'Cancelado', color: '#ef4444', bg: 'rgba(239,68,68,0.15)' },
}

const NEXT_STATUS = {
  PENDENTE: 'PREPARANDO',
  PREPARANDO: 'PRONTO',
  PRONTO: 'ENTREGANDO',
}

export default function LojaDashboard() {
  const navigate = useNavigate()
  const { user, logout } = useAuth()
  const { socket } = useSocket()
  const [pedidos, setPedidos] = useState([])
  const [loading, setLoading] = useState(true)
  const [restaurante, setRestaurante] = useState(null)

  const perfil = user?.lojaProfile

  const carregar = useCallback(async () => {
    try {
      setLoading(true)
      const res = await api.get('/restaurantes/minha-loja/pedidos')
      setPedidos(res.data.data || [])
      if (!restaurante && res.data.restaurante) setRestaurante(res.data.restaurante)
    } catch {
      setPedidos([])
    } finally {
      setLoading(false)
    }
  }, [restaurante])

  const carregarRestaurante = useCallback(async () => {
    try {
      const res = await api.get('/restaurantes/minha-loja')
      setRestaurante(res.data.data)
    } catch {}
  }, [])

  useEffect(() => {
    carregarRestaurante()
    carregar()
  }, [carregar, carregarRestaurante])

  useEffect(() => {
    if (!socket || !restaurante?.id) return
    socket.emit('entrar_restaurante', restaurante.id)
    const handler = (pedido) => {
      setPedidos(prev => {
        const existe = prev.find(p => p.id === pedido.id)
        return existe ? prev : [pedido, ...prev]
      })
    }
    socket.on('pedido_restaurante:novo', handler)
    return () => socket.off('pedido_restaurante:novo', handler)
  }, [socket, restaurante?.id])

  const avancarStatus = async (pedidoId, novoStatus) => {
    try {
      await api.patch(`/restaurantes/pedidos/${pedidoId}/status`, { status: novoStatus })
      setPedidos(prev => prev.map(p => p.id === pedidoId ? { ...p, status: novoStatus } : p))
    } catch (err) {
      alert(err.response?.data?.message || 'Erro ao atualizar status')
    }
  }

  const pendentes = pedidos.filter(p => ['PENDENTE', 'PREPARANDO', 'PRONTO', 'ENTREGANDO'].includes(p.status))
  const finalizados = pedidos.filter(p => ['ENTREGUE', 'CANCELADO'].includes(p.status))

  const tipo = perfil?.tipo === 'PJ' ? '🏢 Pessoa Jurídica' : '👤 Pessoa Física'

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100dvh', background: 'var(--bg)', overflow: 'hidden' }}>
      {/* Header */}
      <div style={{
        background: 'linear-gradient(135deg,#16a34a,#15803d)',
        padding: '20px 16px 16px',
        paddingTop: 'max(20px, calc(20px + env(safe-area-inset-top)))',
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <div style={{ color: 'rgba(255,255,255,0.7)', fontSize: 12, marginBottom: 2 }}>
              🏪 {tipo}
            </div>
            <div style={{ color: '#fff', fontWeight: 800, fontSize: 20 }}>
              {perfil?.nomeFantasia || user?.name}
            </div>
            {restaurante && (
              <div style={{ color: 'rgba(255,255,255,0.75)', fontSize: 13, marginTop: 2 }}>
                {restaurante.nome}
              </div>
            )}
          </div>
          <button onClick={logout} style={{
            background: 'rgba(255,255,255,0.15)', border: 'none',
            borderRadius: 10, padding: '8px 12px', color: '#fff',
            fontSize: 13, fontWeight: 600, cursor: 'pointer',
          }}>Sair</button>
        </div>

        {/* Stats rápidas */}
        <div style={{ display: 'flex', gap: 8, marginTop: 14 }}>
          {[
            { label: 'Hoje', val: pedidos.filter(p => new Date(p.createdAt).toDateString() === new Date().toDateString()).length },
            { label: 'Abertos', val: pendentes.length },
            { label: 'Total', val: pedidos.length },
          ].map(({ label, val }) => (
            <div key={label} style={{
              flex: 1, background: 'rgba(255,255,255,0.15)',
              borderRadius: 12, padding: '10px 8px', textAlign: 'center',
            }}>
              <div style={{ color: '#fff', fontWeight: 800, fontSize: 20 }}>{val}</div>
              <div style={{ color: 'rgba(255,255,255,0.7)', fontSize: 11 }}>{label}</div>
            </div>
          ))}
        </div>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: '14px 16px', paddingBottom: 'max(90px, calc(90px + env(safe-area-inset-bottom)))' }}>
        {!restaurante ? (
          <div style={{ textAlign: 'center', marginTop: 40 }}>
            <div style={{ fontSize: 48, marginBottom: 12 }}>🏪</div>
            <p style={{ fontWeight: 700, color: 'var(--text)', fontSize: 16, marginBottom: 8 }}>
              Sua loja ainda não foi configurada
            </p>
            <p style={{ color: 'var(--text3)', fontSize: 14, marginBottom: 20 }}>
              Aguarde aprovação do administrador ou entre em contato com o suporte.
            </p>
            <button className="btn btn-primary" style={{ background: 'linear-gradient(135deg,#16a34a,#15803d)' }}
              onClick={() => carregar()}>
              Verificar novamente
            </button>
          </div>
        ) : loading ? (
          <div style={{ textAlign: 'center', marginTop: 60 }}>
            <span className="spinner" style={{ borderTopColor: '#16a34a', width: 32, height: 32, borderWidth: 3 }} />
          </div>
        ) : (
          <>
            {pendentes.length === 0 && finalizados.length === 0 ? (
              <div style={{ textAlign: 'center', marginTop: 48 }}>
                <div style={{ fontSize: 52, marginBottom: 12 }}>🔔</div>
                <p style={{ fontWeight: 700, color: 'var(--text)', fontSize: 16 }}>Nenhum pedido ainda</p>
                <p style={{ color: 'var(--text3)', fontSize: 13, marginTop: 4 }}>Os pedidos aparecerão aqui em tempo real.</p>
              </div>
            ) : (
              <>
                {pendentes.length > 0 && (
                  <>
                    <p className="sect-title" style={{ marginBottom: 10 }}>
                      Pedidos ativos ({pendentes.length})
                    </p>
                    {pendentes.map(p => <PedidoCard key={p.id} pedido={p} onAvancar={avancarStatus} />)}
                  </>
                )}

                {finalizados.length > 0 && (
                  <>
                    <p className="sect-title" style={{ marginTop: 20, marginBottom: 10 }}>
                      Histórico de hoje
                    </p>
                    {finalizados.slice(0, 20).map(p => <PedidoCard key={p.id} pedido={p} />)}
                  </>
                )}
              </>
            )}
          </>
        )}
      </div>

      <BottomNav role="LOJA" />
    </div>
  )
}

function PedidoCard({ pedido, onAvancar }) {
  const st = STATUS_LABEL[pedido.status] || STATUS_LABEL.PENDENTE
  const prox = NEXT_STATUS[pedido.status]
  const proxLabel = prox ? STATUS_LABEL[prox]?.label : null

  return (
    <div style={{
      background: 'var(--card)', borderRadius: 16, padding: 16,
      marginBottom: 12, boxShadow: 'var(--shadow)',
      borderLeft: `4px solid ${st.color}`,
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
        <div style={{ fontWeight: 700, fontSize: 15 }}>
          Pedido #{pedido.numero || pedido.id.slice(-4).toUpperCase()}
        </div>
        <span style={{
          background: st.bg, color: st.color,
          borderRadius: 20, padding: '3px 10px', fontSize: 12, fontWeight: 700,
        }}>{st.label}</span>
      </div>

      <div style={{ fontSize: 13, color: 'var(--text2)', marginBottom: 6 }}>
        👤 {pedido.nomeCliente || pedido.cliente?.name || 'Cliente'}
      </div>

      {pedido.itens?.length > 0 && (
        <div style={{ marginBottom: 10 }}>
          {pedido.itens.map((it, i) => (
            <div key={i} style={{ fontSize: 13, color: 'var(--text)', display: 'flex', justifyContent: 'space-between' }}>
              <span>{it.quantidade}x {it.produto?.nome || it.nome}</span>
              <span style={{ color: 'var(--text2)' }}>R$ {((it.precoUnitario || 0) * it.quantidade).toFixed(2)}</span>
            </div>
          ))}
        </div>
      )}

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 8 }}>
        <div style={{ fontWeight: 800, color: 'var(--brand)', fontSize: 16 }}>
          R$ {pedido.total?.toFixed(2) || '0,00'}
        </div>
        {proxLabel && onAvancar && (
          <button
            onClick={() => onAvancar(pedido.id, prox)}
            style={{
              background: 'linear-gradient(135deg,#16a34a,#15803d)',
              border: 'none', borderRadius: 10, padding: '8px 14px',
              color: '#fff', fontWeight: 700, fontSize: 13, cursor: 'pointer',
            }}
          >
            → {proxLabel}
          </button>
        )}
      </div>
    </div>
  )
}
