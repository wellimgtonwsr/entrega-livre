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
  wrap: { display: 'flex', flexDirection: 'column', height: '100dvh', background: '#f5f5f5' },
  header: { background: '#1a1a2e', padding: '14px 20px', color: '#fff', display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  title: { fontSize: 18, fontWeight: 800 },
  mapWrap: { height: '45dvh', position: 'relative' },
  list: { flex: 1, overflowY: 'auto', padding: '12px 16px 80px' },
  listTitle: { fontSize: 14, fontWeight: 700, color: '#888', marginBottom: 10, textTransform: 'uppercase' },
  empty: { textAlign: 'center', color: '#aaa', marginTop: 30, fontSize: 14 },
}

export default function Dashboard() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const { socket } = useSocket()
  const { isLoaded } = useJsApiLoader({ googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_KEY || '' })

  const [pedidos, setPedidos] = useState([])
  const [motoPos, setMotoPos] = useState(null)
  const [assinatura, setAssinatura] = useState(null)
  const [loading, setLoading] = useState(true)

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

  useEffect(() => {
    api.get('/assinatura/status').then(r => setAssinatura(r.data.data)).catch(() => {})
    carregarPedidos()
  }, [carregarPedidos])

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

    return () => {
      socket.off('pedido:novo', handler)
      socket.off('pedido:expirado', encerrarHandler)
      socket.off('pedido:cancelado', encerrarHandler)
    }
  }, [socket, user?.id, motoPos])

  const assinaturaAtiva = assinatura?.status === 'ACTIVE'

  return (
    <div style={s.wrap}>
      <div style={s.header}>
        <div style={s.title}>🛵 Dashboard</div>
        <StatusAssinatura assinatura={assinatura} compact />
      </div>

      {!assinaturaAtiva && (
        <div style={{ background: '#fee2e2', padding: '10px 16px', fontSize: 13, color: '#dc2626', textAlign: 'center' }}>
          Assinatura inativa.{' '}
          <span onClick={() => navigate('/motoboy/assinatura')} style={{ fontWeight: 700, cursor: 'pointer', textDecoration: 'underline' }}>Ativar agora</span>
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
        <div style={s.listTitle}>Pedidos na sua área ({pedidos.length})</div>
        {loading && <div style={s.empty}>Buscando pedidos...</div>}
        {!loading && pedidos.length === 0 && <div style={s.empty}>Nenhum pedido próximo agora</div>}
        {pedidos.map(p => (
          <CardPedido
            key={p.id}
            pedido={p}
            onClick={() => navigate(`/motoboy/pedido/${p.id}`)}
          />
        ))}
      </div>

      <BottomNav role="MOTOBOY" />
    </div>
  )
}
