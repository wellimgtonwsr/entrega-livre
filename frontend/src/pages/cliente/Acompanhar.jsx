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

  if (!isLoaded || !pedido) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100dvh' }}>
      <div className="spinner" />
    </div>
  )

  const motoboy = pedido.motoboy
  const nomeM = motoboy?.user?.name || 'Motoboy'

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100dvh' }}>
      {/* Status bar */}
      <div style={{ background: 'var(--dark)', padding: '10px 16px', color: '#fff', fontSize: 14, fontWeight: 600, zIndex: 1 }}>
        {STATUS_LABELS[status] || status}
      </div>

      {/* Map */}
      <div style={{ flex: 1, position: 'relative' }}>
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

        <button
          onClick={() => setShowChat(true)}
          style={{
            position: 'absolute', bottom: 220, right: 16,
            background: 'var(--brand)', border: 'none', borderRadius: '50%',
            width: 56, height: 56, fontSize: 24, cursor: 'pointer',
            boxShadow: '0 4px 16px rgba(245,158,11,0.4)',
          }}
        >💬</button>
      </div>

      {/* Motoboy card */}
      <div style={{ background: 'var(--card)', padding: '16px 20px', boxShadow: '0 -4px 20px rgba(0,0,0,0.08)', paddingBottom: 'max(20px,env(safe-area-inset-bottom))' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 8 }}>
          <img
            style={{ width: 48, height: 48, borderRadius: '50%', objectFit: 'cover', background: 'var(--border)' }}
            src={motoboy?.user?.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(nomeM)}&background=1a253e&color=fff`}
            alt={nomeM}
          />
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 700, fontSize: 16, color: 'var(--text)' }}>{nomeM}</div>
            <div style={{ color: 'var(--brand)', fontSize: 13 }}>{'⭐'.repeat(Math.round(motoboy?.user?.rating || 5))} {motoboy?.user?.rating?.toFixed(1)}</div>
            <div style={{ fontSize: 13, color: 'var(--text3)' }}>{motoboy?.vehicle} • {motoboy?.plate}</div>
          </div>
          <a href={`tel:${motoboy?.user?.phone}`} className="btn btn-primary btn-sm">
            📞 Ligar
          </a>
        </div>
        <div style={{ color: 'var(--text3)', fontSize: 13 }}>
          📍 {pedido.origemEndereco} → {pedido.destinoEndereco}
        </div>
        <div style={{ color: 'var(--text)', fontWeight: 700, fontSize: 16, marginTop: 6 }}>
          Valor combinado: R$ {pedido.valorFinal?.toFixed(2)}
        </div>
      </div>

      {showChat && <Chat pedidoId={pedidoId} onClose={() => setShowChat(false)} />}
    </div>
  )
}
