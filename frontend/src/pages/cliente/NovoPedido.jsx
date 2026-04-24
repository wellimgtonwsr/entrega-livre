import { useState, useCallback, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { GoogleMap, useJsApiLoader, Autocomplete, DirectionsRenderer, Marker } from '@react-google-maps/api'
import api from '../../services/api'
import BottomNav from '../../components/BottomNav'

const LIBRARIES = ['places']
const PRECO_POR_KM = 2.5
const PRECO_MINIMO = 8

const s = {
  wrap: { display: 'flex', flexDirection: 'column', height: '100dvh', background: '#f5f5f5' },
  header: { background: '#1a1a2e', padding: '16px 20px 12px', color: '#fff' },
  title: { fontSize: 20, fontWeight: 800 },
  sub: { fontSize: 13, opacity: 0.7, marginTop: 2 },
  mapBox: { flex: 1, position: 'relative' },
  form: { background: '#fff', padding: '16px 20px', borderRadius: '24px 24px 0 0', boxShadow: '0 -4px 20px rgba(0,0,0,0.08)', maxHeight: '52dvh', overflowY: 'auto' },
  label: { fontSize: 12, fontWeight: 700, color: '#888', textTransform: 'uppercase', marginBottom: 4, display: 'block' },
  input: { width: '100%', padding: '12px 14px', borderRadius: 12, border: '2px solid #e5e5e5', fontSize: 15, marginBottom: 12, outline: 'none' },
  infoRow: { display: 'flex', gap: 10, marginBottom: 14 },
  infoBadge: { flex: 1, background: '#f8fafc', borderRadius: 10, padding: '10px', textAlign: 'center' },
  infoBadgeVal: { fontSize: 16, fontWeight: 700, color: '#1a1a2e' },
  infoBadgeLbl: { fontSize: 11, color: '#888', marginTop: 2 },
  valorWrap: { marginBottom: 14 },
  valorInput: { width: '100%', padding: '14px', borderRadius: 12, border: '2px solid #f59e0b', fontSize: 22, fontWeight: 700, color: '#1a1a2e', outline: 'none', textAlign: 'center' },
  sugestao: { textAlign: 'center', fontSize: 13, color: '#666', marginTop: 6 },
  btn: { width: '100%', padding: 16, borderRadius: 14, background: '#f59e0b', border: 'none', color: '#1a1a2e', fontSize: 17, fontWeight: 700, cursor: 'pointer' },
  btnDisabled: { opacity: 0.5, cursor: 'not-allowed' },
}

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
    }, (result, status) => {
      if (status === 'OK') {
        setDirections(result)
        const leg = result.routes[0].legs[0]
        const km = leg.distance.value / 1000
        const min = Math.ceil(leg.duration.value / 60)
        setRota({ distanciaKm: km, tempoEstimadoMin: min })
        const sug = Math.max(PRECO_MINIMO, km * PRECO_POR_KM).toFixed(2)
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

  if (!isLoaded) return <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100dvh' }}>Carregando mapa...</div>

  return (
    <div style={s.wrap}>
      <div style={s.header}>
        <div style={s.title}>Nova entrega 📦</div>
        <div style={s.sub}>Proponha o valor, o motoboy decide</div>
      </div>

      <div style={s.mapBox}>
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

      <div style={s.form}>
        {error && <div style={{ background: '#fee2e2', color: '#dc2626', padding: '10px', borderRadius: 10, marginBottom: 12, fontSize: 14 }}>{error}</div>}

        <label style={s.label}>Origem</label>
        <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
          <Autocomplete onLoad={ac => acOrigem.current = ac} onPlaceChanged={onOrigemPlace}>
            <input ref={origemRef} style={{ ...s.input, marginBottom: 0, flex: 1 }} placeholder="De onde sai?" />
          </Autocomplete>
          <button onClick={usarGPS} style={{ padding: '12px', borderRadius: 12, background: '#1a1a2e', border: 'none', color: '#fff', cursor: 'pointer', fontSize: 18 }}>📍</button>
        </div>

        <label style={s.label}>Destino</label>
        <Autocomplete onLoad={ac => acDestino.current = ac} onPlaceChanged={onDestinoPlace}>
          <input style={s.input} placeholder="Para onde vai?" />
        </Autocomplete>

        {rota && (
          <div style={s.infoRow}>
            <div style={s.infoBadge}>
              <div style={s.infoBadgeVal}>{rota.distanciaKm.toFixed(1)} km</div>
              <div style={s.infoBadgeLbl}>Distância</div>
            </div>
            <div style={s.infoBadge}>
              <div style={s.infoBadgeVal}>{rota.tempoEstimadoMin} min</div>
              <div style={s.infoBadgeLbl}>Tempo est.</div>
            </div>
          </div>
        )}

        <div style={s.valorWrap}>
          <label style={s.label}>Quanto você quer pagar?</label>
          <input
            style={s.valorInput}
            type="number"
            min="1"
            step="0.50"
            value={valor}
            onChange={e => setValor(e.target.value)}
            placeholder="R$ 0,00"
          />
          {rota && <div style={s.sugestao}>Sugestão: R$ {Math.max(PRECO_MINIMO, rota.distanciaKm * PRECO_POR_KM).toFixed(2)}</div>}
        </div>

        <label style={s.label}>O que será entregue? (opcional)</label>
        <input style={s.input} value={descricao} onChange={e => setDescricao(e.target.value)} placeholder="Ex: caixa pequena, documentos..." />

        <button
          style={{ ...s.btn, ...((!origem || !destino || !valor || loading) ? s.btnDisabled : {}) }}
          onClick={solicitar}
          disabled={!origem || !destino || !valor || loading}
        >
          {loading ? 'Solicitando...' : '🛵 Solicitar entrega'}
        </button>
      </div>
      <BottomNav role="CLIENT" />
    </div>
  )
}
