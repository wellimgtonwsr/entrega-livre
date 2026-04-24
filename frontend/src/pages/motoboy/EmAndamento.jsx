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

const s = {
  wrap: { display: 'flex', flexDirection: 'column', height: '100dvh' },
  mapWrap: { flex: 1, position: 'relative' },
  card: { background: '#fff', padding: '16px 20px', boxShadow: '0 -4px 20px rgba(0,0,0,0.1)' },
  valorBox: { background: '#fef3c7', borderRadius: 12, padding: '10px 14px', marginBottom: 14, display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  valorNum: { fontSize: 22, fontWeight: 800, color: '#1a1a2e' },
  valorLbl: { fontSize: 13, color: '#92400e' },
  clienteRow: { display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 },
  avatar: { width: 44, height: 44, borderRadius: '50%', objectFit: 'cover', background: '#e5e5e5' },
  nome: { fontWeight: 700 },
  telefone: { fontSize: 13, color: '#888' },
  statusBtn: { width: '100%', padding: '15px', borderRadius: 14, border: 'none', fontSize: 17, fontWeight: 700, cursor: 'pointer' },
  chatBtn: { position: 'absolute', bottom: 260, right: 16, background: '#f59e0b', border: 'none', borderRadius: '50%', width: 52, height: 52, fontSize: 22, cursor: 'pointer', boxShadow: '0 4px 12px rgba(0,0,0,0.2)' },
  navBtn: { display: 'block', textAlign: 'center', padding: '10px', background: '#1a1a2e', color: '#fff', borderRadius: 12, textDecoration: 'none', fontSize: 14, fontWeight: 600, marginBottom: 10 },
}

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

  if (!pedido) return <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100dvh' }}>Carregando...</div>

  const passo = PASSOS.find(p => p.key === status)
  const destino = status === 'IN_PROGRESS'
    ? { lat: pedido.destinoLat, lng: pedido.destinoLng, endereco: pedido.destinoEndereco }
    : { lat: pedido.origemLat, lng: pedido.origemLng, endereco: pedido.origemEndereco }

  const mapsURL = `https://www.google.com/maps/dir/?api=1&destination=${destino.lat},${destino.lng}&travelmode=driving`
  const clienteNome = pedido.cliente?.name || 'Cliente'

  return (
    <div style={s.wrap}>
      <div style={s.mapWrap}>
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
        <button style={s.chatBtn} onClick={() => setShowChat(true)}>💬</button>
      </div>

      <div style={s.card}>
        <div style={s.valorBox}>
          <div>
            <div style={s.valorLbl}>Você recebe (100%)</div>
            <div style={s.valorNum}>R$ {pedido.valorFinal?.toFixed(2)}</div>
          </div>
          <span style={{ fontSize: 28 }}>💰</span>
        </div>

        <div style={s.clienteRow}>
          <img style={s.avatar} src={pedido.cliente?.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(clienteNome)}&background=1a1a2e&color=fff`} alt={clienteNome} />
          <div>
            <div style={s.nome}>{clienteNome}</div>
            <div style={s.telefone}>{pedido.cliente?.phone}</div>
          </div>
          <a href={`tel:${pedido.cliente?.phone}`} style={{ marginLeft: 'auto', background: '#1a1a2e', color: '#fff', padding: '8px 14px', borderRadius: 10, textDecoration: 'none', fontSize: 13, fontWeight: 600 }}>
            📞
          </a>
        </div>

        <a href={mapsURL} target="_blank" rel="noreferrer" style={s.navBtn}>
          🗺 Abrir navegação — {destino.endereco?.slice(0, 35)}...
        </a>

        {passo && (
          <button
            style={{ ...s.statusBtn, background: passo.nextStatus === 'DELIVERED' ? '#10b981' : '#f59e0b', color: passo.nextStatus === 'DELIVERED' ? '#fff' : '#1a1a2e' }}
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
