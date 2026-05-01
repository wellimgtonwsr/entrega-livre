import { useState, useCallback, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { GoogleMap, useJsApiLoader, Autocomplete, DirectionsRenderer } from '@react-google-maps/api'
import api from '../../services/api'
import BottomNav from '../../components/BottomNav'

const LIBRARIES = ['places']
// Sugestão base para mototaxi (cliente pode alterar livremente — modelo inDrive)
const SUGESTAO_POR_KM = 3.0
const SUGESTAO_MINIMA = 7

export default function NovaViagem() {
  const navigate = useNavigate()
  const { isLoaded } = useJsApiLoader({
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_KEY || '',
    libraries: LIBRARIES,
  })

  const [map, setMap] = useState(null)
  const [directions, setDirections] = useState(null)
  const [origem, setOrigem] = useState(null)
  const [destino, setDestino] = useState(null)
  const [rota, setRota] = useState(null)
  const [valor, setValor] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const origemRef = useRef(null)
  const destinoRef = useRef(null)
  const acOrigem = useRef(null)
  const acDestino = useRef(null)

  const calcularRota = useCallback(async (o, d) => {
    if (!o || !d || !window.google) return
    const svc = new window.google.maps.DirectionsService()
    svc.route({
      origin: { lat: o.lat, lng: o.lng },
      destination: { lat: d.lat, lng: d.lng },
      travelMode: window.google.maps.TravelMode.DRIVING,
    }, (result, status) => {
      if (status === 'OK') {
        setDirections(result)
        const leg = result.routes[0].legs[0]
        const km = leg.distance.value / 1000
        const min = Math.ceil(leg.duration.value / 60)
        setRota({ distanciaKm: km, tempoEstimadoMin: min })
        const sug = Math.max(SUGESTAO_MINIMA, km * SUGESTAO_POR_KM).toFixed(2)
        setValor(sug)
      }
    })
  }, [])

  const onOrigemPlace = () => {
    const place = acOrigem.current?.getPlace()
    if (!place?.geometry) return
    const loc = { lat: place.geometry.location.lat(), lng: place.geometry.location.lng(), endereco: place.formatted_address }
    setOrigem(loc)
    if (destino) calcularRota(loc, destino)
  }

  const onDestinoPlace = () => {
    const place = acDestino.current?.getPlace()
    if (!place?.geometry) return
    const loc = { lat: place.geometry.location.lat(), lng: place.geometry.location.lng(), endereco: place.formatted_address }
    setDestino(loc)
    if (origem) calcularRota(origem, loc)
  }

  const usarGPS = () => {
    navigator.geolocation?.getCurrentPosition(({ coords }) => {
      const loc = { lat: coords.latitude, lng: coords.longitude, endereco: `${coords.latitude.toFixed(6)}, ${coords.longitude.toFixed(6)}` }
      setOrigem(loc)
      if (origemRef.current) origemRef.current.value = loc.endereco
      if (destino) calcularRota(loc, destino)
    })
  }

  const solicitar = async () => {
    if (!origem || !destino || !rota || !valor) return
    setLoading(true)
    setError('')
    try {
      const { data } = await api.post('/corridas', {
        origemLat: origem.lat,
        origemLng: origem.lng,
        origemEndereco: origem.endereco,
        destinoLat: destino.lat,
        destinoLng: destino.lng,
        destinoEndereco: destino.endereco,
        distanciaKm: rota.distanciaKm,
        tempoEstimadoMin: rota.tempoEstimadoMin,
        valorSugerido: parseFloat(valor),
      })
      navigate(`/passageiro/aguardando/${data.data.id}`)
    } catch (e) {
      setError(e.response?.data?.error || 'Erro ao solicitar corrida')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100dvh', background: 'var(--bg)' }}>
      {/* Header */}
      <div className="page-header">
        <button onClick={() => navigate('/splash')} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 20, color: 'var(--text)', display: 'flex', alignItems: 'center', padding: 0 }}>←</button>
        <div>
          <h1 style={{ fontSize: 18, fontWeight: 800, margin: 0, color: 'var(--text)' }}>Passageiro Livre 🏍️</h1>
          <p style={{ fontSize: 12, color: 'var(--text2)', margin: 0 }}>Pague o preço justo</p>
        </div>
        <div />
      </div>

      {/* Map */}
      <div style={{ flex: 1, position: 'relative' }}>
        {isLoaded ? (
          <GoogleMap
            mapContainerStyle={{ width: '100%', height: '100%' }}
            center={{ lat: -15.793, lng: -47.882 }}
            zoom={12}
            onLoad={setMap}
            options={{ disableDefaultUI: true, zoomControl: true }}
          >
            {directions && <DirectionsRenderer directions={directions} options={{ suppressMarkers: false }} />}
          </GoogleMap>
        ) : (
          <div style={{ width: '100%', height: '100%', background: '#e5e7eb', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div className="spinner" />
          </div>
        )}
      </div>

      {/* Bottom sheet */}
      <div style={{
        background: '#fff',
        borderRadius: '24px 24px 0 0',
        boxShadow: '0 -4px 32px rgba(0,0,0,0.10)',
        padding: '20px 20px',
        paddingBottom: 'max(20px, calc(80px + env(safe-area-inset-bottom)))',
        display: 'flex', flexDirection: 'column', gap: 12,
      }}>
        {/* Drag handle */}
        <div style={{ width: 40, height: 4, borderRadius: 2, background: '#e5e7eb', margin: '0 auto 8px' }} />

        {/* Route badge */}
        {rota && (
          <div style={{ display: 'flex', gap: 8, marginBottom: 4 }}>
            <span className="badge" style={{ background: 'var(--brand-light)', color: 'var(--brand)' }}>📍 {rota.distanciaKm.toFixed(1)} km</span>
            <span className="badge" style={{ background: '#ede9fe', color: '#7c3aed' }}>⏱ ~{rota.tempoEstimadoMin} min</span>
          </div>
        )}

        {/* Origem */}
        <div className="form-group">
          <label className="lbl">📍 Onde você está?</label>
          <div style={{ display: 'flex', gap: 8 }}>
            {isLoaded ? (
              <Autocomplete
                onLoad={ac => { acOrigem.current = ac }}
                onPlaceChanged={onOrigemPlace}
                style={{ flex: 1 }}
              >
                <input ref={origemRef} className="inp" placeholder="Endereço de partida" />
              </Autocomplete>
            ) : (
              <input ref={origemRef} className="inp" placeholder="Endereço de partida" disabled />
            )}
            <button
              type="button"
              onClick={usarGPS}
              style={{ padding: '0 14px', background: 'var(--brand-light)', border: '1.5px solid var(--brand)', borderRadius: 12, cursor: 'pointer', fontSize: 18, flexShrink: 0 }}
            >📡</button>
          </div>
        </div>

        {/* Destino */}
        <div className="form-group">
          <label className="lbl">🏁 Para onde vai?</label>
          {isLoaded ? (
            <Autocomplete
              onLoad={ac => { acDestino.current = ac }}
              onPlaceChanged={onDestinoPlace}
            >
              <input ref={destinoRef} className="inp" placeholder="Destino" />
            </Autocomplete>
          ) : (
            <input ref={destinoRef} className="inp" placeholder="Destino" disabled />
          )}
        </div>

        {/* Valor */}
        <div className="form-group">
          <label className="lbl">💰 Quanto você quer pagar? (R$)</label>
          <input
            className="inp"
            type="number"
            min="1"
            step="0.50"
            value={valor}
            onChange={e => setValor(e.target.value)}
            placeholder="R$ 0,00"
            style={{
              fontSize: 22, fontWeight: 800, textAlign: 'center',
              border: '2px solid #6366f1',
              boxShadow: '0 0 0 3px rgba(99,102,241,0.10)',
            }}
          />
          {rota && (
            <p style={{ textAlign: 'center', fontSize: 12, color: 'var(--text2)', marginTop: 6 }}>
              💡 Sugestão: <strong>R$ {Math.max(SUGESTAO_MINIMA, rota.distanciaKm * SUGESTAO_POR_KM).toFixed(2)}</strong> — você pode propor qualquer valor
            </p>
          )}
        </div>

        {error && <div className="alert alert-error">{error}</div>}

        <button
          className="btn btn-primary"
          style={{ fontSize: 16, background: 'linear-gradient(135deg,#6366f1,#4f46e5)', boxShadow: '0 4px 16px rgba(99,102,241,0.35)' }}
          onClick={solicitar}
          disabled={loading || !origem || !destino || !valor}
        >
          {loading ? <span className="spinner" /> : '🏍️ Chamar mototaxi'}
        </button>
      </div>

      <BottomNav role="CLIENT" active="passageiro" />
    </div>
  )
}
