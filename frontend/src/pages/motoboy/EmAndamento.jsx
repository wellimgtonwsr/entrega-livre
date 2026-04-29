import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { GoogleMap, useJsApiLoader, Marker } from '@react-google-maps/api'
import api from '../../services/api'
import { useSocket } from '../../context/SocketContext'
import { useAuth } from '../../context/AuthContext'
import Chat from '../../components/Chat'

const PASSOS = [
  { key: 'ACCEPTED', label: 'Cheguei na coleta', nextStatus: 'IN_PROGRESS', icon: '📍' },
  { key: 'IN_PROGRESS', label: 'Pacote entregue', nextStatus: 'DELIVERED', icon: '✅' },
]



export default function EmAndamento() {
  const { pedidoId } = useParams()
  const navigate = useNavigate()
  const { socket } = useSocket()
  const { user } = useAuth()
  const { isLoaded } = useJsApiLoader({ googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_KEY || '' })

  const [pedido, setPedido] = useState(null)
  const [motoPos, setMotoPos] = useState(null)
  const [status, setStatus] = useState('')
  const [loading, setLoading] = useState(false)
  const [showChat, setShowChat] = useState(false)

  useEffect(() => {
    api.get(`/pedidos/${pedidoId}`).then(r => {
      setPedido(r.data.data)
      setStatus(r.data.data.status)
    }).catch(() => {})

    const watch = navigator.geolocation?.watchPosition(({ coords }) => {
      const pos = { lat: coords.latitude, lng: coords.longitude }
      setMotoPos(pos)
      if (socket) socket.emit('motoboy:location', { motoboyId: user?.motoboy?.id, lat: pos.lat, lng: pos.lng })
      api.put('/motoboy/localizacao', pos).catch(() => {})
    }, null, { enableHighAccuracy: true })

    return () => { if (watch) navigator.geolocation.clearWatch(watch) }
  }, [pedidoId, socket, user])

  useEffect(() => {
    if (!socket) return
    socket.emit('pedido:join', { pedidoId })
    const finalizadaHandler = () => navigate(`/motoboy/avaliar/${pedidoId}`)
    socket.on('corrida:finalizada', finalizadaHandler)
    return () => socket.off('corrida:finalizada', finalizadaHandler)
  }, [socket, pedidoId, navigate])

  const atualizarStatus = async (novoStatus) => {
    setLoading(true)
    try {
      await api.put(`/pedidos/${pedidoId}/status`, { status: novoStatus })
      setStatus(novoStatus)
      if (novoStatus === 'DELIVERED') navigate(`/motoboy/avaliar/${pedidoId}`)
    } catch (err) {
      alert(err.response?.data?.message || 'Erro')
    } finally {
      setLoading(false)
    }
  }

  if (!pedido) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100dvh' }}>
      <div className="spinner" />
    </div>
  )

  const passo = PASSOS.find(p => p.key === status)
  const destino = status === 'IN_PROGRESS'
    ? { lat: pedido.destinoLat, lng: pedido.destinoLng, endereco: pedido.destinoEndereco }
    : { lat: pedido.origemLat, lng: pedido.origemLng, endereco: pedido.origemEndereco }

  const mapsURL = `https://www.google.com/maps/dir/?api=1&destination=${destino.lat},${destino.lng}&travelmode=driving`
  const clienteNome = pedido.cliente?.name || 'Cliente'

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100dvh' }}>
      {/* Map */}
      <div style={{ flex: 1, position: 'relative' }}>
        {isLoaded && (
          <GoogleMap
            mapContainerStyle={{ width: '100%', height: '100%' }}
            zoom={15}
            center={motoPos || { lat: destino.lat, lng: destino.lng }}
            options={{ disableDefaultUI: true, zoomControl: true }}
          >
            {motoPos && <Marker position={motoPos} label="🛵" />}
            <Marker position={destino} label={status === 'IN_PROGRESS' ? 'B' : 'A'} />
          </GoogleMap>
        )}
        <button
          onClick={() => setShowChat(true)}
          style={{
            position: 'absolute', bottom: 260, right: 16,
            background: 'var(--brand)', border: 'none', borderRadius: '50%',
            width: 52, height: 52, fontSize: 22, cursor: 'pointer',
            boxShadow: '0 4px 12px rgba(245,158,11,0.4)',
          }}
        >💬</button>
      </div>

      {/* Bottom card */}
      <div style={{ background: 'var(--card)', padding: '16px 20px', boxShadow: '0 -4px 20px rgba(0,0,0,0.08)', paddingBottom: 'max(20px,env(safe-area-inset-bottom))' }}>
        {/* Valor */}
        <div style={{ background: 'var(--brand-light)', borderRadius: 12, padding: '10px 14px', marginBottom: 14, display: 'flex', justifyContent: 'space-between', alignItems: 'center', border: '1px solid #fde68a' }}>
          <div>
            <div style={{ fontSize: 13, color: '#92400e' }}>Você recebe (100%)</div>
            <div style={{ fontSize: 22, fontWeight: 800, color: 'var(--dark)' }}>R$ {pedido.valorFinal?.toFixed(2)}</div>
          </div>
          <span style={{ fontSize: 28 }}>💰</span>
        </div>

        {/* Cliente */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
          <img
            style={{ width: 44, height: 44, borderRadius: '50%', objectFit: 'cover', background: 'var(--border)' }}
            src={pedido.cliente?.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(clienteNome)}&background=1a253e&color=fff`}
            alt={clienteNome}
          />
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 700, color: 'var(--text)' }}>{clienteNome}</div>
            <div style={{ fontSize: 13, color: 'var(--text3)' }}>{pedido.cliente?.phone}</div>
          </div>
          <a href={`tel:${pedido.cliente?.phone}`} className="btn btn-sm" style={{ background: 'var(--dark)', color: '#fff', textDecoration: 'none' }}>
            📞
          </a>
        </div>

        <a href={mapsURL} target="_blank" rel="noreferrer" className="btn" style={{ display: 'block', textAlign: 'center', background: 'var(--dark)', color: '#fff', textDecoration: 'none', marginBottom: 10, padding: 12 }}>
          🗺 Abrir navegação — {destino.endereco?.slice(0, 35)}...
        </a>

        {passo && (
          <button
            className="btn"
            style={{
              width: '100%', fontSize: 17, fontWeight: 700, padding: 15,
              background: passo.nextStatus === 'DELIVERED' ? 'var(--success)' : 'var(--brand)',
              color: passo.nextStatus === 'DELIVERED' ? '#fff' : 'var(--dark)',
              border: 'none',
            }}
            onClick={() => atualizarStatus(passo.nextStatus)}
            disabled={loading}
          >
            {loading ? 'Atualizando...' : `${passo.icon} ${passo.label}`}
          </button>
        )}
      </div>

      {showChat && <Chat pedidoId={pedidoId} onClose={() => setShowChat(false)} />}
    </div>
  )
}
