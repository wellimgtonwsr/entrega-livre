import { useState, useCallback, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { GoogleMap, useJsApiLoader, Autocomplete, DirectionsRenderer, Marker } from '@react-google-maps/api'
import api from '../../services/api'
import BottomNav from '../../components/BottomNav'

const LIBRARIES = ['places']

export default function NovoPedido() {
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
  const [sugestaoServidor, setSugestaoServidor] = useState(null)
  const [descricao, setDescricao] = useState('')
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
    }, async (result, status) => {
      if (status !== 'OK') return
      setDirections(result)
      const leg = result.routes[0].legs[0]
      const km = leg.distance.value / 1000
      const min = Math.ceil(leg.duration.value / 60)
      setRota({ distanciaKm: km, tempoEstimadoMin: min })

      // Buscar sugestão de preço do servidor (fórmula oficial)
      try {
        const res = await api.post('/pedidos/calcular', {
          origemLat: o.lat, origemLng: o.lng,
          destinoLat: d.lat, destinoLng: d.lng,
        })
        const sug = res.data.data.valorCalculado
        setSugestaoServidor(sug)
        setValor(sug.toFixed(2))
      } catch {
        // fallback: usar km calculado pelo Maps
        setSugestaoServidor(null)
        setValor((km * 2).toFixed(2))
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
      const res = await api.post('/pedidos', {
        origemEndereco: origem.endereco,
        origemLat: origem.lat,
        origemLng: origem.lng,
        destinoEndereco: destino.endereco,
        destinoLat: destino.lat,
        destinoLng: destino.lng,
        distanciaKm: rota.distanciaKm,
        tempoEstimadoMin: rota.tempoEstimadoMin,
        valorProposto: parseFloat(valor),
        descricao,
      })
      navigate(`/cliente/aguardando/${res.data.data.id}`)
    } catch (err) {
      setError(err.response?.data?.message || 'Erro ao solicitar')
    } finally {
      setLoading(false)
    }
  }

  if (!isLoaded) return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100dvh', gap: 12 }}>
      <span style={{ fontSize: 40 }}>🗺️</span>
      <p style={{ color: 'var(--text2)', fontWeight: 600 }}>Carregando mapa...</p>
    </div>
  )

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100dvh', background: 'var(--bg)' }}>
      {/* Header */}
      <div className="page-header">
        <button onClick={() => navigate(-1)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 22, color: '#fff', padding: '4px 8px', marginRight: 4 }}>←</button>
        <div>
          <div className="page-header-title">📦 Nova entrega</div>
          <div className="page-header-sub">Proponha o valor, o motoboy decide</div>
        </div>
      </div>

      {/* Mapa */}
      <div style={{ flex: 1, position: 'relative' }}>
        <GoogleMap
          mapContainerStyle={{ width: '100%', height: '100%' }}
          zoom={13}
          center={origem || { lat: -23.55, lng: -46.63 }}
          onLoad={setMap}
          options={{ disableDefaultUI: true, zoomControl: true }}
        >
          {!directions && origem && <Marker position={origem} />}
          {!directions && destino && <Marker position={destino} label="B" />}
          {directions && <DirectionsRenderer directions={directions} />}
        </GoogleMap>
      </div>

      {/* Painel inferior */}
      <div style={{
        background: '#fff', padding: '20px 20px',
        borderRadius: '24px 24px 0 0',
        boxShadow: '0 -6px 24px rgba(0,0,0,0.10)',
        maxHeight: '54dvh', overflowY: 'auto',
        paddingBottom: 'max(90px, calc(90px + env(safe-area-inset-bottom)))',
      }}>
        {error && <div className="alert alert-error" style={{ marginBottom: 12 }}>⚠️ {error}</div>}

        <div className="form-group">
          <label className="lbl">Origem</label>
          <div style={{ display: 'flex', gap: 8 }}>
            <Autocomplete onLoad={ac => acOrigem.current = ac} onPlaceChanged={onOrigemPlace} style={{ flex: 1 }}>
              <input ref={origemRef} className="inp" placeholder="De onde sai?" style={{ marginBottom: 0 }} />
            </Autocomplete>
            <button onClick={usarGPS} style={{
              padding: '0 16px', borderRadius: 'var(--radius-sm)',
              background: 'var(--dark)', border: 'none',
              color: '#fff', fontSize: 20, flexShrink: 0,
            }}>📍</button>
          </div>
        </div>

        <div className="form-group">
          <label className="lbl">Destino</label>
          <Autocomplete onLoad={ac => acDestino.current = ac} onPlaceChanged={onDestinoPlace}>
            <input className="inp" placeholder="Para onde vai?" />
          </Autocomplete>
        </div>

        {rota && (
          <div className="info-row">
            <div className="info-badge">
              <div className="info-badge-val">{rota.distanciaKm.toFixed(1)} km</div>
              <div className="info-badge-lbl">Distância</div>
            </div>
            <div className="info-badge">
              <div className="info-badge-val">{rota.tempoEstimadoMin} min</div>
              <div className="info-badge-lbl">Tempo est.</div>
            </div>
          </div>
        )}

        <div className="form-group">
          <label className="lbl">Quanto você quer pagar?</label>
          <input
            className="inp"
            type="number" min="1" step="0.50"
            value={valor} onChange={e => setValor(e.target.value)}
            placeholder="R$ 0,00"
            style={{
              fontSize: 24, fontWeight: 800, textAlign: 'center',
              border: '2px solid var(--brand)',
              boxShadow: '0 0 0 3px rgba(245,158,11,0.12)',
            }}
          />
          {sugestaoServidor && (
            <p style={{ textAlign: 'center', fontSize: 13, color: 'var(--text2)', marginTop: 6 }}>
              💡 Sugestão do sistema: <strong
                onClick={() => setValor(sugestaoServidor.toFixed(2))}
                style={{ color: 'var(--brand)', cursor: 'pointer', textDecoration: 'underline' }}
              >
                R$ {sugestaoServidor.toFixed(2)}
              </strong> <span style={{ color: 'var(--text3)' }}>(toque para aplicar)</span>
            </p>
          )}
        </div>

        <div className="form-group">
          <label className="lbl">Descrição (opcional)</label>
          <input className="inp" value={descricao} onChange={e => setDescricao(e.target.value)} placeholder="Ex: caixa pequena, documentos..." />
        </div>

        <button
          className="btn btn-primary"
          onClick={solicitar}
          disabled={!origem || !destino || !valor || loading}
          style={{ fontSize: 17 }}
        >
          {loading ? <span className="spinner" style={{ borderTopColor: 'var(--dark)' }} /> : '🛵 Solicitar entrega'}
        </button>
      </div>
      <BottomNav role="CLIENT" />
    </div>
  )
}
