import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { GoogleMap, useJsApiLoader, Marker, DirectionsRenderer } from '@react-google-maps/api'
import api from '../../services/api'
import { useSocket } from '../../context/SocketContext'
import Chat from '../../components/Chat'

const STATUS_LABELS = {
  ACCEPTED: '🛵 Motoboy a caminho da coleta',
  IN_PROGRESS: '📦 Pacote coletado — a caminho do destino',
  DELIVERED: '✅ Entregue!',
}

const s = {
  wrap: { display: 'flex', flexDirection: 'column', height: '100dvh' },
  mapWrap: { flex: 1, position: 'relative' },
  card: { background: '#fff', padding: '16px 20px', boxShadow: '0 -4px 20px rgba(0,0,0,0.1)' },
  statusBar: { background: '#1a1a2e', padding: '10px 16px', color: '#fff', fontSize: 14, fontWeight: 600 },
  row: { display: 'flex', alignItems: 'center', gap: 14, marginBottom: 8 },
  avatar: { width: 48, height: 48, borderRadius: '50%', background: '#e5e5e5', objectFit: 'cover' },
  name: { fontWeight: 700, fontSize: 16 },
  stars: { color: '#f59e0b', fontSize: 13 },
  plate: { fontSize: 13, color: '#888' },
  chatBtn: { position: 'absolute', bottom: 250, right: 16, background: '#f59e0b', border: 'none', borderRadius: '50%', width: 56, height: 56, fontSize: 24, cursor: 'pointer', boxShadow: '0 4px 12px rgba(0,0,0,0.2)' },
}

export default function Acompanhar() {
  const { pedidoId } = useParams()
  const navigate = useNavigate()
  const { socket } = useSocket()
  const { isLoaded } = useJsApiLoader({ googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_KEY || '' })

  const [pedido, setPedido] = useState(null)
  const [motoboyPos, setMotoboyPos] = useState(null)
  const [status, setStatus] = useState('')
  const [showChat, setShowChat] = useState(false)

  useEffect(() => {
    api.get(`/pedidos/${pedidoId}`).then(res => {
      const p = res.data.data
      setPedido(p)
      setStatus(p.status)
      if (p.motoboy?.lat && p.motoboy?.lng) {
        setMotoboyPos({ lat: p.motoboy.lat, lng: p.motoboy.lng })
      }
    }).catch(() => {})
  }, [pedidoId])

  useEffect(() => {
    if (!socket || !pedido?.motoboy) return
    socket.emit('client:track', { pedidoId, motoboyId: pedido.motoboy.id })

    const locHandler = ({ lat, lng }) => setMotoboyPos({ lat, lng })
    const statusHandler = ({ status: s }) => setStatus(s)
    const finalizadaHandler = () => navigate(`/cliente/avaliar/${pedidoId}`)

    socket.on('motoboy:location', locHandler)
    socket.on('corrida:status', statusHandler)
    socket.on('corrida:finalizada', finalizadaHandler)

    return () => {
      socket.off('motoboy:location', locHandler)
      socket.off('corrida:status', statusHandler)
      socket.off('corrida:finalizada', finalizadaHandler)
    }
  }, [socket, pedido?.motoboy?.id, pedidoId, navigate])

  if (!isLoaded || !pedido) return <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100dvh' }}>Carregando...</div>

  const motoboy = pedido.motoboy
  const nomeM = motoboy?.user?.name || 'Motoboy'

  return (
    <div style={s.wrap}>
      <div style={s.statusBar}>{STATUS_LABELS[status] || status}</div>

      <div style={s.mapWrap}>
        <GoogleMap
          mapContainerStyle={{ width: '100%', height: '100%' }}
          zoom={15}
          center={motoboyPos || { lat: pedido.origemLat, lng: pedido.origemLng }}
          options={{ disableDefaultUI: true, zoomControl: true }}
        >
          {motoboyPos && <Marker position={motoboyPos} label="🛵" />}
          <Marker position={{ lat: pedido.origemLat, lng: pedido.origemLng }} label="A" />
          <Marker position={{ lat: pedido.destinoLat, lng: pedido.destinoLng }} label="B" />
        </GoogleMap>

        <button style={s.chatBtn} onClick={() => setShowChat(true)}>💬</button>
      </div>

      <div style={s.card}>
        <div style={s.row}>
          <img style={s.avatar} src={motoboy?.user?.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(nomeM)}&background=1a1a2e&color=fff`} alt={nomeM} />
          <div>
            <div style={s.name}>{nomeM}</div>
            <div style={s.stars}>{'⭐'.repeat(Math.round(motoboy?.user?.rating || 5))} {motoboy?.user?.rating?.toFixed(1)}</div>
            <div style={s.plate}>{motoboy?.vehicle} • {motoboy?.plate}</div>
          </div>
          <a href={`tel:${motoboy?.user?.phone}`} style={{ marginLeft: 'auto', background: '#1a1a2e', color: '#fff', border: 'none', borderRadius: 12, padding: '10px 18px', textDecoration: 'none', fontWeight: 700 }}>
            📞 Ligar
          </a>
        </div>
        <div style={{ color: '#888', fontSize: 13 }}>
          📍 {pedido.origemEndereco} → {pedido.destinoEndereco}
        </div>
        <div style={{ color: '#1a1a2e', fontWeight: 700, fontSize: 16, marginTop: 6 }}>
          Valor combinado: R$ {pedido.valorFinal?.toFixed(2)}
        </div>
      </div>

      {showChat && <Chat pedidoId={pedidoId} onClose={() => setShowChat(false)} />}
    </div>
  )
}
