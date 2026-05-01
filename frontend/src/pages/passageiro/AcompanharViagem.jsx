import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { GoogleMap, useJsApiLoader, DirectionsRenderer, Marker } from '@react-google-maps/api'
import api from '../../services/api'
import { useSocket } from '../../context/SocketContext'

export default function AcompanharViagem() {
  const { corridaId } = useParams()
  const navigate = useNavigate()
  const { socket } = useSocket()
  const { isLoaded } = useJsApiLoader({
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_KEY || '',
    libraries: ['places'],
  })

  const [corrida, setCorrida] = useState(null)
  const [motoboyPos, setMotoboyPos] = useState(null)
  const [directions, setDirections] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get(`/corridas/${corridaId}`).then(({ data }) => {
      setCorrida(data.data)
      setLoading(false)
    }).catch(() => setLoading(false))
  }, [corridaId])

  useEffect(() => {
    if (!corrida || !isLoaded || !window.google) return
    const svc = new window.google.maps.DirectionsService()
    svc.route({
      origin: { lat: corrida.origemLat, lng: corrida.origemLng },
      destination: { lat: corrida.destinoLat, lng: corrida.destinoLng },
      travelMode: window.google.maps.TravelMode.DRIVING,
    }, (result, status) => {
      if (status === 'OK') setDirections(result)
    })
  }, [corrida, isLoaded])

  useEffect(() => {
    if (!socket) return
    socket.emit('entrar_corrida', corridaId)
    socket.on('motoboy_location', ({ lat, lng }) => setMotoboyPos({ lat, lng }))
    socket.on('corrida_status', ({ status }) => {
      if (status === 'CONCLUIDA') navigate('/splash')
      if (status === 'CANCELADA') navigate('/passageiro/nova-viagem')
    })
    return () => {
      socket.off('motoboy_location')
      socket.off('corrida_status')
    }
  }, [socket, corridaId, navigate])

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100dvh' }}>
        <div className="spinner" style={{ width: 40, height: 40 }} />
      </div>
    )
  }

  const STATUS_LABELS = {
    AGUARDANDO: { label: 'Aguardando motoboy...', color: '#f59e0b', icon: '⏳' },
    ACEITA: { label: 'Motoboy a caminho!', color: '#6366f1', icon: '🏍️' },
    EM_ANDAMENTO: { label: 'Em andamento', color: '#10b981', icon: '🚀' },
    CONCLUIDA: { label: 'Concluída', color: '#10b981', icon: '✅' },
  }
  const statusInfo = STATUS_LABELS[corrida?.status] || STATUS_LABELS.AGUARDANDO

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100dvh', background: 'var(--bg)' }}>
      {/* Map */}
      <div style={{ flex: 1, position: 'relative' }}>
        {isLoaded ? (
          <GoogleMap
            mapContainerStyle={{ width: '100%', height: '100%' }}
            center={corrida ? { lat: corrida.origemLat, lng: corrida.origemLng } : { lat: -15.793, lng: -47.882 }}
            zoom={14}
            options={{ disableDefaultUI: true, zoomControl: false }}
          >
            {directions && <DirectionsRenderer directions={directions} options={{ suppressMarkers: false }} />}
            {motoboyPos && (
              <Marker
                position={motoboyPos}
                icon={{ url: 'data:image/svg+xml;charset=utf8,' + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 32 32"><circle cx="16" cy="16" r="14" fill="#6366f1"/><text x="16" y="21" text-anchor="middle" font-size="16">🏍️</text></svg>'), scaledSize: { width: 40, height: 40 } }}
              />
            )}
          </GoogleMap>
        ) : (
          <div style={{ width: '100%', height: '100%', background: '#e5e7eb', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div className="spinner" />
          </div>
        )}

        {/* Status pill over map */}
        <div style={{
          position: 'absolute', top: 'max(16px, calc(16px + env(safe-area-inset-top)))', left: '50%', transform: 'translateX(-50%)',
          background: 'rgba(255,255,255,0.95)', borderRadius: 99,
          padding: '8px 18px', boxShadow: '0 2px 16px rgba(0,0,0,0.12)',
          display: 'flex', alignItems: 'center', gap: 8,
          whiteSpace: 'nowrap',
        }}>
          <span>{statusInfo.icon}</span>
          <span style={{ fontWeight: 700, color: statusInfo.color, fontSize: 14 }}>{statusInfo.label}</span>
        </div>
      </div>

      {/* Bottom card */}
      {corrida && (
        <div style={{
          background: '#fff',
          borderRadius: '24px 24px 0 0',
          boxShadow: '0 -4px 24px rgba(0,0,0,0.10)',
          padding: '20px 20px',
          paddingBottom: 'max(24px, calc(16px + env(safe-area-inset-bottom)))',
        }}>
          <div style={{ width: 40, height: 4, background: '#e5e7eb', borderRadius: 2, margin: '0 auto 16px' }} />

          {/* Motoboy info */}
          {corrida.motoboy && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16, padding: '12px 14px', background: 'var(--bg)', borderRadius: 14 }}>
              <div style={{ width: 44, height: 44, borderRadius: '50%', background: 'linear-gradient(135deg,#6366f1,#4f46e5)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 800, fontSize: 18 }}>
                {corrida.motoboy.nome?.[0]?.toUpperCase()}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 700, color: 'var(--text)' }}>{corrida.motoboy.nome}</div>
                <div style={{ fontSize: 12, color: 'var(--text2)' }}>Motoboy</div>
              </div>
              {corrida.motoboy.telefone && (
                <a
                  href={`tel:${corrida.motoboy.telefone}`}
                  style={{ width: 40, height: 40, borderRadius: '50%', background: '#dcfce7', display: 'flex', alignItems: 'center', justifyContent: 'center', textDecoration: 'none', fontSize: 18 }}
                >📞</a>
              )}
            </div>
          )}

          {/* Route */}
          <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start', marginBottom: 8 }}>
            <span>📍</span>
            <div>
              <div style={{ fontSize: 11, color: 'var(--text3)', fontWeight: 600 }}>PARTIDA</div>
              <div style={{ fontSize: 13, color: 'var(--text)' }}>{corrida.origemEndereco}</div>
            </div>
          </div>
          <div style={{ width: 2, height: 12, background: '#e5e7eb', marginLeft: 11, marginBottom: 8 }} />
          <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start', marginBottom: 16 }}>
            <span>🏁</span>
            <div>
              <div style={{ fontSize: 11, color: 'var(--text3)', fontWeight: 600 }}>DESTINO</div>
              <div style={{ fontSize: 13, color: 'var(--text)' }}>{corrida.destinoEndereco}</div>
            </div>
          </div>

          {/* Value */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 14px', background: '#f0f0ff', borderRadius: 12 }}>
            <span style={{ fontWeight: 600, color: 'var(--text)' }}>Valor da corrida</span>
            <span style={{ fontWeight: 900, fontSize: 20, color: '#6366f1' }}>R$ {Number(corrida.valorFinal || corrida.valorSugerido).toFixed(2)}</span>
          </div>
        </div>
      )}
    </div>
  )
}
