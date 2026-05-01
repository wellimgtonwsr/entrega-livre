import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { GoogleMap, useJsApiLoader, Marker } from '@react-google-maps/api'
import api from '../../services/api'
import { useSocket } from '../../context/SocketContext'
import { useAuth } from '../../context/AuthContext'
import CardPedido from '../../components/CardPedido'
import StatusAssinatura from '../../components/StatusAssinatura'
import BottomNav from '../../components/BottomNav'

const s = {
  wrap: { display: 'flex', flexDirection: 'column', height: '100dvh', background: 'var(--bg)', overflow: 'hidden' },
  mapWrap: { height: '42dvh', position: 'relative', flexShrink: 0 },
  list: { flex: 1, overflowY: 'auto', padding: '14px 16px', paddingBottom: 'max(90px, calc(90px + env(safe-area-inset-bottom)))' },
}

export default function Dashboard() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const { socket } = useSocket()
  const { isLoaded } = useJsApiLoader({ googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_KEY || '' })

  const [pedidos, setPedidos] = useState([])
  const [corridas, setCorridas] = useState([])
  const [motoPos, setMotoPos] = useState(null)
  const [assinatura, setAssinatura] = useState(null)
  const [loading, setLoading] = useState(true)
  const [abaAtiva, setAbaAtiva] = useState('entregas')

  // Atualiza localização a cada 30s
  const atualizarPosicao = useCallback((lat, lng) => {
    api.put('/motoboy/localizacao', { lat, lng }).catch(() => {})
    if (socket) socket.emit('motoboy:location', { motoboyId: user?.motoboy?.id, lat, lng })
  }, [socket, user])

  useEffect(() => {
    navigator.geolocation?.watchPosition(({ coords }) => {
      const pos = { lat: coords.latitude, lng: coords.longitude }
      setMotoPos(pos)
      atualizarPosicao(pos.lat, pos.lng)
    }, null, { enableHighAccuracy: true })
  }, [atualizarPosicao])

  const carregarPedidos = useCallback(async () => {
    try {
      const res = await api.get('/pedidos/disponiveis')
      setPedidos(res.data.data)
    } catch {
      setPedidos([])
    } finally {
      setLoading(false)
    }
  }, [])

  const carregarCorridas = useCallback(async () => {
    try {
      const res = await api.get('/corridas/disponiveis')
      setCorridas(res.data.data)
    } catch {
      setCorridas([])
    }
  }, [])

  useEffect(() => {
    api.get('/assinatura/status').then(r => setAssinatura(r.data.data)).catch(() => {})
    carregarPedidos()
    carregarCorridas()
  }, [carregarPedidos, carregarCorridas])

  // Socket: novo pedido
  useEffect(() => {
    if (!socket) return
    if (user?.id) socket.emit('motoboy:online', { motoboyId: user?.motoboy?.id, lat: motoPos?.lat, lng: motoPos?.lng })

    const handler = (pedido) => {
      setPedidos(prev => {
        const existe = prev.find(p => p.id === pedido.pedidoId)
        return existe ? prev : [{ id: pedido.pedidoId, ...pedido }, ...prev]
      })
    }
    const encerrarHandler = ({ pedidoId }) => {
      setPedidos(prev => prev.filter(p => p.id !== pedidoId))
    }

    socket.on('pedido:novo', handler)
    socket.on('pedido:expirado', encerrarHandler)
    socket.on('pedido:cancelado', encerrarHandler)

    // Corridas mototaxi
    const corridaHandler = (corrida) => {
      setCorridas(prev => {
        const existe = prev.find(c => c.id === corrida.corridaId)
        return existe ? prev : [{ id: corrida.corridaId, ...corrida }, ...prev]
      })
    }
    const encerrarCorrida = ({ corridaId }) => {
      setCorridas(prev => prev.filter(c => c.id !== corridaId))
    }
    socket.on('corrida:nova', corridaHandler)
    socket.on('corrida_status', ({ corridaId, status }) => {
      if (status === 'ACEITA') {
        // Minha proposta foi aceita — navegar para corrida em andamento
        navigate(`/motoboy/corrida-em-andamento/${corridaId}`)
      }
      if (['CANCELADA', 'EXPIRADA'].includes(status))
        setCorridas(prev => prev.filter(c => c.id !== corridaId))
    })

    return () => {
      socket.off('pedido:novo', handler)
      socket.off('pedido:expirado', encerrarHandler)
      socket.off('pedido:cancelado', encerrarHandler)
      socket.off('corrida:nova', corridaHandler)
      socket.off('corrida_status')
    }
  }, [socket, user?.id, motoPos])

  const assinaturaAtiva = assinatura?.status === 'ACTIVE'

  return (
    <div style={s.wrap}>
      {/* Header */}
      <div className="page-header" style={{ justifyContent: 'space-between' }}>
        <div>
          <div className="page-header-title">🛵 Dashboard</div>
          <div className="page-header-sub">
            {motoPos ? '🟢 Online — atualizando posição' : 'Obtendo localização...'}
          </div>
        </div>
        <StatusAssinatura assinatura={assinatura} compact />
      </div>

      {/* Banner assinatura inativa */}
      {!assinaturaAtiva && (
        <div style={{
          background: 'linear-gradient(90deg,#fee2e2,#fecaca)',
          padding: '10px 16px', fontSize: 13,
          color: '#dc2626', display: 'flex', alignItems: 'center', gap: 6,
        }}>
          ⚠️ Assinatura inativa.
          <span onClick={() => navigate('/motoboy/assinatura')}
            style={{ fontWeight: 700, cursor: 'pointer', textDecoration: 'underline', marginLeft: 4 }}>
            Ativar agora
          </span>
        </div>
      )}

      <div style={s.mapWrap}>
        {isLoaded && (
          <GoogleMap
            mapContainerStyle={{ width: '100%', height: '100%' }}
            zoom={14}
            center={motoPos || { lat: -23.55, lng: -46.63 }}
            options={{ disableDefaultUI: true, zoomControl: true }}
          >
            {motoPos && <Marker position={motoPos} label="🛵" />}
            {pedidos.map(p => (
              <Marker
                key={p.id}
                position={{ lat: p.origemLat, lng: p.origemLng }}
                onClick={() => navigate(`/motoboy/pedido/${p.id}`)}
                label={{ text: `R$${p.valorProposto?.toFixed(0)}`, color: '#fff', fontWeight: 'bold', fontSize: '11px' }}
                icon={{ path: window.google?.maps?.SymbolPath?.CIRCLE, scale: 20, fillColor: '#f59e0b', fillOpacity: 1, strokeColor: '#fff', strokeWeight: 2 }}
              />
            ))}
          </GoogleMap>
        )}
      </div>

      <div style={s.list}>
        {/* Abas Entregas / Mototaxi */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 14 }}>
          <button
            onClick={() => setAbaAtiva('entregas')}
            style={{
              flex: 1, padding: '8px 0', borderRadius: 10, border: 'none', cursor: 'pointer', fontWeight: 700, fontSize: 13,
              background: abaAtiva === 'entregas' ? '#f59e0b' : 'var(--bg)',
              color: abaAtiva === 'entregas' ? '#fff' : 'var(--text2)',
            }}
          >
            📦 Entregas {pedidos.length > 0 && `(${pedidos.length})`}
          </button>
          <button
            onClick={() => setAbaAtiva('mototaxi')}
            style={{
              flex: 1, padding: '8px 0', borderRadius: 10, border: 'none', cursor: 'pointer', fontWeight: 700, fontSize: 13,
              background: abaAtiva === 'mototaxi' ? '#6366f1' : 'var(--bg)',
              color: abaAtiva === 'mototaxi' ? '#fff' : 'var(--text2)',
            }}
          >
            🏍️ Mototaxi {corridas.length > 0 && `(${corridas.length})`}
          </button>
        </div>

        {/* Aba Entregas */}
        {abaAtiva === 'entregas' && (
          <>
            <p className="sect-title">Pedidos na sua área ({pedidos.length})</p>
            {loading && (
              <div style={{ textAlign: 'center', color: 'var(--text3)', marginTop: 30, fontSize: 14 }}>
                ⏳ Buscando pedidos...
              </div>
            )}
            {!loading && pedidos.length === 0 && (
              <div style={{ textAlign: 'center', color: 'var(--text3)', marginTop: 30 }}>
                <div style={{ fontSize: 40, marginBottom: 10 }}>🛍️</div>
                <p style={{ fontWeight: 600 }}>Nenhum pedido próximo agora</p>
                <p style={{ fontSize: 13, marginTop: 4 }}>Aguarde novos pedidos aparecerem</p>
              </div>
            )}
            {pedidos.map(p => (
              <CardPedido
                key={p.id}
                pedido={p}
                onClick={() => navigate(`/motoboy/pedido/${p.id}`)}
              />
            ))}
          </>
        )}

        {/* Aba Mototaxi */}
        {abaAtiva === 'mototaxi' && (
          <>
            <p className="sect-title">Corridas na sua área ({corridas.length})</p>
            {corridas.length === 0 && (
              <div style={{ textAlign: 'center', color: 'var(--text3)', marginTop: 30 }}>
                <div style={{ fontSize: 40, marginBottom: 10 }}>🏍️</div>
                <p style={{ fontWeight: 600 }}>Nenhuma corrida próxima agora</p>
                <p style={{ fontSize: 13, marginTop: 4 }}>Aguarde novas corridas aparecerem</p>
              </div>
            )}
            {corridas.map(c => (
              <div
                key={c.id}
                onClick={() => navigate(`/motoboy/corrida/${c.id}`)}
                style={{
                  background: '#fff', borderRadius: 16, padding: '14px 16px', marginBottom: 10,
                  boxShadow: '0 2px 12px rgba(0,0,0,0.06)', cursor: 'pointer',
                  border: '1.5px solid #e0e7ff',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                  <span style={{ fontWeight: 800, color: '#6366f1', fontSize: 16 }}>
                    R$ {Number(c.valorSugerido).toFixed(2)}
                  </span>
                  <span style={{ background: '#ede9fe', color: '#7c3aed', borderRadius: 8, padding: '2px 8px', fontSize: 11, fontWeight: 700 }}>
                    🏍️ Mototaxi
                  </span>
                </div>
                <div style={{ display: 'flex', gap: 6, alignItems: 'flex-start', marginBottom: 4 }}>
                  <span style={{ fontSize: 13 }}>📍</span>
                  <span style={{ fontSize: 13, color: 'var(--text)', flex: 1 }}>{c.origemEndereco}</span>
                </div>
                <div style={{ display: 'flex', gap: 6, alignItems: 'flex-start', marginBottom: 8 }}>
                  <span style={{ fontSize: 13 }}>🏁</span>
                  <span style={{ fontSize: 13, color: 'var(--text)', flex: 1 }}>{c.destinoEndereco}</span>
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <span className="badge" style={{ background: '#ede9fe', color: '#6366f1' }}>
                    📍 {Number(c.distanciaKm).toFixed(1)} km
                  </span>
                  <span className="badge" style={{ background: '#ede9fe', color: '#7c3aed' }}>
                    ⏱ ~{c.tempoEstimadoMin} min
                  </span>
                </div>
              </div>
            ))}
          </>
        )}
      </div>

      <BottomNav role="MOTOBOY" />
    </div>
  )
}
