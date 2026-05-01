import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { GoogleMap, useJsApiLoader, DirectionsRenderer, Marker } from '@react-google-maps/api'
import api from '../../services/api'

export default function CorridaDetalhe() {
  const { corridaId } = useParams()
  const navigate = useNavigate()
  const { isLoaded } = useJsApiLoader({ googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_KEY || '' })

  const [corrida, setCorrida] = useState(null)
  const [directions, setDirections] = useState(null)
  const [mostraPropor, setMostraPropor] = useState(false)
  const [contraValor, setContraValor] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    api.get(`/corridas/${corridaId}`).then(r => {
      const c = r.data.data
      setCorrida(c)
      setContraValor(Number(c.valorSugerido).toFixed(2))
    }).catch(() => navigate(-1))
  }, [corridaId, navigate])

  useEffect(() => {
    if (!isLoaded || !corrida || !window.google) return
    const svc = new window.google.maps.DirectionsService()
    svc.route({
      origin: { lat: corrida.origemLat, lng: corrida.origemLng },
      destination: { lat: corrida.destinoLat, lng: corrida.destinoLng },
      travelMode: window.google.maps.TravelMode.DRIVING,
    }, (result, status) => {
      if (status === 'OK') setDirections(result)
    })
  }, [isLoaded, corrida])

  const enviarProposta = async (valor) => {
    setLoading(true)
    setError('')
    try {
      await api.post(`/corridas/${corridaId}/proposta`, { valor: parseFloat(valor) })
      alert('Proposta enviada! Aguarde o passageiro aceitar.')
      navigate('/motoboy/dashboard')
    } catch (err) {
      setError(err.response?.data?.message || 'Erro ao enviar proposta')
    } finally {
      setLoading(false)
    }
  }

  if (!corrida) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100dvh' }}>
      <div className="spinner" />
    </div>
  )

  const expiraEm = Math.max(0, new Date(corrida.expiresAt) - new Date())
  const minutos = Math.floor(expiraEm / 60000)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100dvh', background: 'var(--bg)' }}>
      {/* Header */}
      <div className="page-header">
        <button className="btn btn-ghost btn-sm" style={{ padding: '4px 8px', marginRight: 8 }} onClick={() => navigate(-1)}>←</button>
        <div>
          <div className="page-header-title">🏍️ Corrida de mototaxi</div>
          {minutos > 0 && <div className="page-header-sub">⏱ Expira em {minutos} min</div>}
        </div>
      </div>

      {/* Mapa */}
      <div style={{ height: '42dvh', flexShrink: 0 }}>
        {isLoaded && (
          <GoogleMap
            mapContainerStyle={{ width: '100%', height: '100%' }}
            zoom={13}
            center={{ lat: corrida.origemLat, lng: corrida.origemLng }}
            options={{ disableDefaultUI: true, zoomControl: true }}
          >
            {directions ? (
              <DirectionsRenderer directions={directions} />
            ) : (
              <>
                <Marker position={{ lat: corrida.origemLat, lng: corrida.origemLng }} label="A" />
                <Marker position={{ lat: corrida.destinoLat, lng: corrida.destinoLng }} label="B" />
              </>
            )}
          </GoogleMap>
        )}
      </div>

      {/* Info scrollable */}
      <div style={{ flex: 1, background: 'var(--card)', overflowY: 'auto', padding: '16px 20px', paddingBottom: 'max(24px, env(safe-area-inset-bottom))' }}>
        {/* Badges */}
        <div style={{ display: 'flex', gap: 10, marginBottom: 16 }}>
          <div className="info-badge" style={{ flex: 1 }}>
            <div className="info-badge-val">{Number(corrida.distanciaKm).toFixed(1)} km</div>
            <div className="info-badge-lbl">Distância</div>
          </div>
          <div className="info-badge" style={{ flex: 1 }}>
            <div className="info-badge-val">{corrida.tempoEstimadoMin} min</div>
            <div className="info-badge-lbl">Tempo est.</div>
          </div>
        </div>

        {/* Passageiro */}
        {corrida.passageiro && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14, padding: '10px 14px', background: 'var(--bg)', borderRadius: 14 }}>
            <div style={{ width: 40, height: 40, borderRadius: '50%', background: 'linear-gradient(135deg,#6366f1,#4f46e5)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 800, fontSize: 16 }}>
              {corrida.passageiro.name?.[0]?.toUpperCase()}
            </div>
            <div>
              <div style={{ fontWeight: 700, color: 'var(--text)', fontSize: 14 }}>{corrida.passageiro.name}</div>
              <div style={{ fontSize: 12, color: 'var(--text2)' }}>⭐ {Number(corrida.passageiro.rating).toFixed(1)}</div>
            </div>
          </div>
        )}

        {/* Rota */}
        <div className="card" style={{ marginBottom: 14, padding: '12px 14px', background: 'var(--bg)' }}>
          <div style={{ fontSize: 12, color: 'var(--text3)', marginBottom: 2 }}>📍 Partida</div>
          <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 8 }}>{corrida.origemEndereco}</div>
          <div style={{ fontSize: 12, color: 'var(--text3)', marginBottom: 2 }}>🏁 Destino</div>
          <div style={{ fontWeight: 600, fontSize: 14 }}>{corrida.destinoEndereco}</div>
        </div>

        {/* Valor sugerido */}
        <div style={{ background: '#ede9fe', borderRadius: 14, padding: '14px 18px', marginBottom: 16, textAlign: 'center', border: '1.5px solid #c4b5fd' }}>
          <div style={{ fontSize: 13, color: '#6d28d9', fontWeight: 600 }}>Passageiro sugere</div>
          <div style={{ fontSize: 28, fontWeight: 800, color: '#4c1d95', marginTop: 2 }}>R$ {Number(corrida.valorSugerido).toFixed(2)}</div>
          <div style={{ fontSize: 12, color: '#6d28d9', marginTop: 4 }}>Você fica com 100% deste valor</div>
        </div>

        {error && <div className="alert alert-error" style={{ marginBottom: 12 }}>{error}</div>}

        {!mostraPropor ? (
          <div style={{ display: 'flex', gap: 10 }}>
            <button
              className="btn btn-primary"
              style={{ flex: 2, fontSize: 16, background: '#6366f1', borderColor: '#6366f1' }}
              onClick={() => enviarProposta(corrida.valorSugerido)}
              disabled={loading}
            >
              {loading ? '...' : `✓ Aceitar R$ ${Number(corrida.valorSugerido).toFixed(2)}`}
            </button>
            <button className="btn btn-outline" style={{ flex: 1 }} onClick={() => setMostraPropor(true)}>
              Propor valor
            </button>
          </div>
        ) : (
          <div>
            <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text)', marginBottom: 8 }}>Seu valor proposto:</div>
            <input
              className="inp"
              type="number" min="1" step="0.50"
              value={contraValor}
              onChange={e => setContraValor(e.target.value)}
              style={{ textAlign: 'center', fontSize: 20, fontWeight: 700, marginBottom: 10 }}
            />
            <button
              className="btn btn-primary"
              style={{ width: '100%', background: '#6366f1', borderColor: '#6366f1' }}
              onClick={() => enviarProposta(contraValor)}
              disabled={loading}
            >
              {loading ? 'Enviando...' : 'Enviar proposta'}
            </button>
            <button
              onClick={() => setMostraPropor(false)}
              style={{ width: '100%', marginTop: 8, padding: 10, background: 'none', border: 'none', color: 'var(--text3)', cursor: 'pointer', fontSize: 14 }}
            >
              Cancelar
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
