import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { GoogleMap, useJsApiLoader, Marker } from '@react-google-maps/api'
import api from '../../services/api'
import { useSocket } from '../../context/SocketContext'
import { useAuth } from '../../context/AuthContext'
import Chat from '../../components/Chat'

const PASSOS = [
  { key: 'ACEITA', label: 'Cheguei no local', nextStatus: 'EM_ANDAMENTO', icon: '📍' },
  { key: 'EM_ANDAMENTO', label: 'Corrida concluída', nextStatus: 'CONCLUIDA', icon: '✅' },
]

export default function CorridaEmAndamento() {
  const { corridaId } = useParams()
  const navigate = useNavigate()
  const { socket } = useSocket()
  const { user } = useAuth()
  const { isLoaded } = useJsApiLoader({ googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_KEY || '' })

  const [corrida, setCorrida] = useState(null)
  const [motoPos, setMotoPos] = useState(null)
  const [status, setStatus] = useState('')
  const [loading, setLoading] = useState(false)
  const [showChat, setShowChat] = useState(false)

  useEffect(() => {
    api.get(`/corridas/${corridaId}`).then(r => {
      setCorrida(r.data.data)
      setStatus(r.data.data.status)
    }).catch(() => {})

    const watch = navigator.geolocation?.watchPosition(({ coords }) => {
      const pos = { lat: coords.latitude, lng: coords.longitude }
      setMotoPos(pos)
      if (socket) {
        socket.emit('corrida:location', {
          corridaId,
          motoboyId: user?.motoboy?.id,
          lat: pos.lat,
          lng: pos.lng,
        })
      }
      api.put('/motoboy/localizacao', pos).catch(() => {})
    }, null, { enableHighAccuracy: true })

    return () => { if (watch) navigator.geolocation.clearWatch(watch) }
  }, [corridaId, socket, user])

  useEffect(() => {
    if (!socket) return
    socket.emit('entrar_corrida', corridaId)
    const corridaStatusHandler = ({ status: s }) => {
      if (s === 'CANCELADA') {
        alert('Corrida cancelada pelo passageiro.')
        navigate('/motoboy/dashboard')
      }
    }
    socket.on('corrida_status', corridaStatusHandler)
    return () => socket.off('corrida_status', corridaStatusHandler)
  }, [socket, corridaId, navigate])

  const atualizarStatus = async (novoStatus) => {
    setLoading(true)
    try {
      await api.patch(`/corridas/${corridaId}/status`, { status: novoStatus })
      setStatus(novoStatus)
      if (novoStatus === 'CONCLUIDA') navigate(`/motoboy/avaliar-corrida/${corridaId}`)
    } catch (err) {
      alert(err.response?.data?.message || 'Erro ao atualizar status')
    } finally {
      setLoading(false)
    }
  }

  if (!corrida) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100dvh' }}>
      <div className="spinner" />
    </div>
  )

  const passo = PASSOS.find(p => p.key === status)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100dvh', background: 'var(--bg)' }}>
      {/* Header */}
      <div className="page-header" style={{ background: 'linear-gradient(135deg,#6366f1,#4f46e5)' }}>
        <button onClick={() => navigate(-1)} style={{ background: 'rgba(255,255,255,0.15)', border: 'none', borderRadius: 10, width: 36, height: 36, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#fff', fontSize: 18, flexShrink: 0 }}>←</button>
        <div>
          <div className="page-header-title" style={{ color: '#fff' }}>🏍️ Corrida em andamento</div>
          <div className="page-header-sub" style={{ color: 'rgba(255,255,255,0.75)' }}>
            {status === 'ACEITA' ? 'Vá buscar o passageiro' : 'Corrida iniciada'}
          </div>
        </div>
      </div>

      {/* Mapa */}
      <div style={{ height: '40dvh', flexShrink: 0, position: 'relative' }}>
        {isLoaded && (
          <GoogleMap
            mapContainerStyle={{ width: '100%', height: '100%' }}
            zoom={15}
            center={motoPos || { lat: corrida.origemLat, lng: corrida.origemLng }}
            options={{ disableDefaultUI: true, zoomControl: true }}
          >
            {motoPos && (
              <Marker
                position={motoPos}
                icon={{ url: 'data:image/svg+xml;charset=utf8,' + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 32 32"><circle cx="16" cy="16" r="14" fill="#6366f1"/><text x="16" y="21" text-anchor="middle" font-size="16">🏍️</text></svg>'), scaledSize: { width: 40, height: 40 } }}
              />
            )}
            <Marker position={{ lat: corrida.origemLat, lng: corrida.origemLng }} label="A" />
            <Marker position={{ lat: corrida.destinoLat, lng: corrida.destinoLng }} label="B" />
          </GoogleMap>
        )}
        {/* Botão chat flutuante */}
        <button
          onClick={() => setShowChat(true)}
          style={{
            position: 'absolute', bottom: 16, right: 16,
            background: '#6366f1', border: 'none', borderRadius: '50%',
            width: 52, height: 52, fontSize: 22, cursor: 'pointer',
            boxShadow: '0 4px 12px rgba(99,102,241,0.5)', zIndex: 10,
          }}
          title="Chat com o Passageiro"
        >💬</button>
      </div>

      {/* Detalhes */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '16px 20px', paddingBottom: 'max(24px, env(safe-area-inset-bottom))' }}>
        {/* Passageiro */}
        {corrida.passageiro && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14, padding: '10px 14px', background: '#fff', borderRadius: 14, boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
            <div style={{ width: 40, height: 40, borderRadius: '50%', background: 'linear-gradient(135deg,#6366f1,#4f46e5)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 800, fontSize: 16 }}>
              {corrida.passageiro?.name?.[0]?.toUpperCase()}
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 700, fontSize: 14 }}>{corrida.passageiro?.name}</div>
              <div style={{ fontSize: 12, color: 'var(--text2)' }}>⭐ {Number(corrida.passageiro?.rating || 5).toFixed(1)}</div>
            </div>
            {corrida.passageiro?.phone && (
              <a href={`tel:${corrida.passageiro.phone}`} style={{ width: 40, height: 40, borderRadius: '50%', background: '#dcfce7', display: 'flex', alignItems: 'center', justifyContent: 'center', textDecoration: 'none', fontSize: 18 }}>📞</a>
            )}
          </div>
        )}

        {/* Rota */}
        <div style={{ background: '#fff', borderRadius: 14, padding: '12px 14px', marginBottom: 14, boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
          <div style={{ fontSize: 11, color: 'var(--text3)', fontWeight: 600 }}>📍 PARTIDA</div>
          <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 8 }}>{corrida.origemEndereco}</div>
          <div style={{ fontSize: 11, color: 'var(--text3)', fontWeight: 600 }}>🏁 DESTINO</div>
          <div style={{ fontWeight: 600, fontSize: 14 }}>{corrida.destinoEndereco}</div>
        </div>

        {/* Valor */}
        <div style={{ background: '#ede9fe', borderRadius: 14, padding: '12px 16px', marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontWeight: 700, color: '#6d28d9', fontSize: 14 }}>Valor combinado</span>
          <span style={{ fontWeight: 800, color: '#4c1d95', fontSize: 20 }}>R$ {Number(corrida.valorFinal || corrida.valorSugerido).toFixed(2)}</span>
        </div>

        {/* Botão GPS */}
        <a
          href={`https://www.google.com/maps/dir/?api=1&destination=${status === 'ACEITA' ? corrida.origemLat + ',' + corrida.origemLng : corrida.destinoLat + ',' + corrida.destinoLng}`}
          target="_blank"
          rel="noopener noreferrer"
          style={{ display: 'block', textAlign: 'center', padding: '12px', background: 'var(--bg)', borderRadius: 12, color: '#4f46e5', fontWeight: 700, fontSize: 14, textDecoration: 'none', marginBottom: 12, border: '1.5px solid #c7d2fe' }}
        >
          🗺️ Abrir no Google Maps
        </a>

        {/* Ação principal */}
        {passo && (
          <button
            className="btn btn-primary"
            style={{ width: '100%', fontSize: 16, padding: '14px', background: '#6366f1', borderColor: '#6366f1' }}
            onClick={() => atualizarStatus(passo.nextStatus)}
            disabled={loading}
          >
            {loading ? 'Aguarde...' : `${passo.icon} ${passo.label}`}
          </button>
        )}
      </div>

      {showChat && (
        <Chat corridaId={corridaId} title="Chat com o Passageiro" onClose={() => setShowChat(false)} />
      )}
    </div>
  )
}
