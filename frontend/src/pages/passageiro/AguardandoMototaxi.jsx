import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import api from '../../services/api'
import { useSocket } from '../../context/SocketContext'
import CardProposta from '../../components/CardProposta'

export default function AguardandoMototaxi() {
  const { corridaId } = useParams()
  const navigate = useNavigate()
  const { socket } = useSocket()

  const [corrida, setCorrida] = useState(null)
  const [propostas, setPropostas] = useState([])
  const [loading, setLoading] = useState(true)
  const [aceitando, setAceitando] = useState(null)

  useEffect(() => {
    api.get(`/corridas/${corridaId}`).then(({ data }) => {
      setCorrida(data)
      setLoading(false)
    }).catch(() => setLoading(false))
  }, [corridaId])

  useEffect(() => {
    if (!socket) return
    socket.emit('entrar_corrida', corridaId)
    const onProposta = (p) => setPropostas(prev => {
      const idx = prev.findIndex(x => x.id === p.id)
      if (idx >= 0) { const n = [...prev]; n[idx] = p; return n }
      return [...prev, p]
    })
    socket.on('nova_proposta_corrida', onProposta)
    return () => socket.off('nova_proposta_corrida', onProposta)
  }, [socket, corridaId])

  const aceitar = async (propostaId) => {
    setAceitando(propostaId)
    try {
      await api.post(`/corridas/${corridaId}/aceitar`, { propostaId })
      navigate(`/passageiro/acompanhar/${corridaId}`)
    } catch {
      setAceitando(null)
    }
  }

  const cancelar = async () => {
    await api.delete(`/corridas/${corridaId}`).catch(() => {})
    navigate('/passageiro/nova-viagem')
  }

  if (loading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100dvh', gap: 16 }}>
        <div className="spinner" style={{ width: 40, height: 40 }} />
        <p style={{ color: 'var(--text2)' }}>Carregando...</p>
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100dvh', background: 'var(--bg)' }}>
      {/* Header */}
      <div style={{
        background: 'linear-gradient(135deg,#6366f1,#4f46e5)',
        padding: '52px 20px 24px',
        paddingTop: 'max(52px, calc(20px + env(safe-area-inset-top)))',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <div style={{ width: 48, height: 48, borderRadius: 14, background: 'rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22 }}>
            🏍️
          </div>
          <div>
            <h1 style={{ color: '#fff', fontSize: 20, fontWeight: 800, margin: 0 }}>Aguardando mototaxi</h1>
            <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: 13, margin: 0 }}>Motoboys estão recebendo sua solicitação...</p>
          </div>
        </div>

        {corrida && (
          <div style={{ marginTop: 16, background: 'rgba(255,255,255,0.12)', borderRadius: 14, padding: '12px 14px', display: 'flex', justifyContent: 'space-between' }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ color: 'rgba(255,255,255,0.6)', fontSize: 11 }}>Distância</div>
              <div style={{ color: '#fff', fontWeight: 800, fontSize: 16 }}>{corrida.distanciaKm?.toFixed(1)} km</div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ color: 'rgba(255,255,255,0.6)', fontSize: 11 }}>Tempo est.</div>
              <div style={{ color: '#fff', fontWeight: 800, fontSize: 16 }}>{corrida.tempoEstimadoMin} min</div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ color: 'rgba(255,255,255,0.6)', fontSize: 11 }}>Seu valor</div>
              <div style={{ color: '#fff', fontWeight: 800, fontSize: 16 }}>R$ {Number(corrida.valorSugerido).toFixed(2)}</div>
            </div>
          </div>
        )}
      </div>

      {/* Route */}
      {corrida && (
        <div style={{ margin: '16px 16px 0', background: '#fff', borderRadius: 16, padding: '14px 16px', boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
          <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start', marginBottom: 8 }}>
            <span style={{ fontSize: 16, marginTop: 1 }}>📍</span>
            <div>
              <div style={{ fontSize: 11, color: 'var(--text3)', fontWeight: 600 }}>PARTIDA</div>
              <div style={{ fontSize: 14, color: 'var(--text)', fontWeight: 600 }}>{corrida.origemEndereco}</div>
            </div>
          </div>
          <div style={{ width: 2, height: 16, background: '#e5e7eb', marginLeft: 19, marginBottom: 8 }} />
          <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
            <span style={{ fontSize: 16, marginTop: 1 }}>🏁</span>
            <div>
              <div style={{ fontSize: 11, color: 'var(--text3)', fontWeight: 600 }}>DESTINO</div>
              <div style={{ fontSize: 14, color: 'var(--text)', fontWeight: 600 }}>{corrida.destinoEndereco}</div>
            </div>
          </div>
        </div>
      )}

      {/* Propostas */}
      <div style={{ flex: 1, padding: '16px 16px', display: 'flex', flexDirection: 'column', gap: 12 }}>
        <p className="sect-title">
          Propostas recebidas
          {propostas.length > 0 && (
            <span style={{ marginLeft: 6, background: '#6366f1', color: '#fff', borderRadius: 99, padding: '2px 8px', fontSize: 11 }}>{propostas.length}</span>
          )}
        </p>

        {propostas.length === 0 ? (
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '40px 0', gap: 12 }}>
            <div style={{ fontSize: 48 }}>🏍️</div>
            <p style={{ color: 'var(--text2)', textAlign: 'center', lineHeight: 1.5 }}>
              Aguardando motoboys disponíveis na sua área...
            </p>
            <div style={{ display: 'flex', gap: 6 }}>
              {[0, 1, 2].map(i => (
                <div key={i} style={{ width: 8, height: 8, borderRadius: '50%', background: '#6366f1', animation: `pulse 1.2s ${i * 0.3}s infinite` }} />
              ))}
            </div>
          </div>
        ) : (
          propostas.map(p => (
            <CardProposta
              key={p.id}
              proposta={p}
              onAceitar={() => aceitar(p.id)}
              loading={aceitando === p.id}
              acaoLabel="Aceitar corrida"
            />
          ))
        )}
      </div>

      {/* Cancel */}
      <div style={{ padding: '12px 16px', paddingBottom: 'max(24px, calc(16px + env(safe-area-inset-bottom)))' }}>
        <button className="btn btn-danger" style={{ width: '100%' }} onClick={cancelar}>
          Cancelar solicitação
        </button>
      </div>
    </div>
  )
}
