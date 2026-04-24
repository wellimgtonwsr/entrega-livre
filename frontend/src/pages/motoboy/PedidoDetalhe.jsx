import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { GoogleMap, useJsApiLoader, DirectionsRenderer, Marker } from '@react-google-maps/api'
import api from '../../services/api'

const s = {
  wrap: { display: 'flex', flexDirection: 'column', height: '100dvh', background: '#f5f5f5' },
  header: { background: '#1a1a2e', padding: '16px 20px', color: '#fff', display: 'flex', alignItems: 'center', gap: 12 },
  backBtn: { background: 'none', border: 'none', color: '#fff', fontSize: 22, cursor: 'pointer' },
  title: { fontSize: 18, fontWeight: 800 },
  mapWrap: { height: '42dvh' },
  info: { flex: 1, background: '#fff', padding: '16px 20px', overflowY: 'auto' },
  row: { display: 'flex', gap: 10, marginBottom: 14 },
  badge: { flex: 1, background: '#f8fafc', borderRadius: 12, padding: 12, textAlign: 'center' },
  badgeVal: { fontSize: 16, fontWeight: 700, color: '#1a1a2e' },
  badgeLbl: { fontSize: 11, color: '#888' },
  valorBox: { background: '#fef3c7', borderRadius: 14, padding: '14px 18px', marginBottom: 16, textAlign: 'center' },
  valorLabel: { fontSize: 13, color: '#92400e', fontWeight: 600 },
  valorNum: { fontSize: 28, fontWeight: 800, color: '#1a1a2e', marginTop: 2 },
  desc: { color: '#666', fontSize: 14, marginBottom: 16 },
  btnRow: { display: 'flex', gap: 10, marginTop: 8 },
  btnAceitar: { flex: 2, padding: '14px', borderRadius: 14, background: '#10b981', border: 'none', color: '#fff', fontSize: 16, fontWeight: 700, cursor: 'pointer' },
  btnPropor: { flex: 1, padding: '14px', borderRadius: 14, background: '#f5f5f5', border: '2px solid #e5e5e5', color: '#444', fontSize: 14, fontWeight: 700, cursor: 'pointer' },
  contraWrap: { marginTop: 12 },
  contraInput: { width: '100%', padding: '13px', borderRadius: 12, border: '2px solid #f59e0b', fontSize: 20, fontWeight: 700, textAlign: 'center', outline: 'none', marginBottom: 10 },
  btnContra: { width: '100%', padding: '13px', borderRadius: 14, background: '#f59e0b', border: 'none', color: '#1a1a2e', fontSize: 16, fontWeight: 700, cursor: 'pointer' },
}

export default function PedidoDetalhe() {
  const { pedidoId } = useParams()
  const navigate = useNavigate()
  const { isLoaded } = useJsApiLoader({ googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_KEY || '' })

  const [pedido, setPedido] = useState(null)
  const [directions, setDirections] = useState(null)
  const [mostraPropor, setMostraPropor] = useState(false)
  const [contraValor, setContraValor] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    api.get(`/pedidos/${pedidoId}`).then(r => {
      const p = r.data.data
      setPedido(p)
      setContraValor(p.valorProposto?.toFixed(2))
    }).catch(() => navigate(-1))
  }, [pedidoId, navigate])

  useEffect(() => {
    if (!isLoaded || !pedido || !window.google) return
    const svc = new window.google.maps.DirectionsService()
    svc.route({
      origin: { lat: pedido.origemLat, lng: pedido.origemLng },
      destination: { lat: pedido.destinoLat, lng: pedido.destinoLng },
      travelMode: window.google.maps.TravelMode.DRIVING,
    }, (result, status) => {
      if (status === 'OK') setDirections(result)
    })
  }, [isLoaded, pedido])

  const enviarProposta = async (valor) => {
    setLoading(true)
    setError('')
    try {
      await api.post(`/pedidos/${pedidoId}/proposta`, { valor: parseFloat(valor) })
      alert('Proposta enviada! Aguarde o cliente aceitar.')
      navigate('/motoboy/dashboard')
    } catch (err) {
      setError(err.response?.data?.message || 'Erro ao enviar proposta')
    } finally {
      setLoading(false)
    }
  }

  if (!pedido) return <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100dvh' }}>Carregando...</div>

  const expiraEm = Math.max(0, new Date(pedido.expiresAt) - new Date())
  const minutos = Math.floor(expiraEm / 60000)

  return (
    <div style={s.wrap}>
      <div style={s.header}>
        <button style={s.backBtn} onClick={() => navigate(-1)}>←</button>
        <div>
          <div style={s.title}>Detalhes do pedido</div>
          {minutos > 0 && <div style={{ fontSize: 12, opacity: 0.7 }}>⏱ Expira em {minutos} min</div>}
        </div>
      </div>

      <div style={s.mapWrap}>
        {isLoaded && (
          <GoogleMap
            mapContainerStyle={{ width: '100%', height: '100%' }}
            zoom={13}
            center={{ lat: pedido.origemLat, lng: pedido.origemLng }}
            options={{ disableDefaultUI: true, zoomControl: true }}
          >
            {directions ? (
              <DirectionsRenderer directions={directions} />
            ) : (
              <>
                <Marker position={{ lat: pedido.origemLat, lng: pedido.origemLng }} label="A" />
                <Marker position={{ lat: pedido.destinoLat, lng: pedido.destinoLng }} label="B" />
              </>
            )}
          </GoogleMap>
        )}
      </div>

      <div style={s.info}>
        <div style={s.row}>
          <div style={s.badge}><div style={s.badgeVal}>{pedido.distanciaKm?.toFixed(1)} km</div><div style={s.badgeLbl}>Distância</div></div>
          <div style={s.badge}><div style={s.badgeVal}>{pedido.tempoEstimadoMin} min</div><div style={s.badgeLbl}>Tempo est.</div></div>
        </div>

        <div style={{ marginBottom: 14 }}>
          <div style={{ fontSize: 13, color: '#888', marginBottom: 4 }}>📍 Origem</div>
          <div style={{ fontWeight: 600, fontSize: 14 }}>{pedido.origemEndereco}</div>
          <div style={{ fontSize: 13, color: '#888', marginTop: 8, marginBottom: 4 }}>🏁 Destino</div>
          <div style={{ fontWeight: 600, fontSize: 14 }}>{pedido.destinoEndereco}</div>
        </div>

        {pedido.descricao && <div style={s.desc}>📦 {pedido.descricao}</div>}

        <div style={s.valorBox}>
          <div style={s.valorLabel}>Cliente propõe</div>
          <div style={s.valorNum}>R$ {pedido.valorProposto?.toFixed(2)}</div>
          <div style={{ fontSize: 12, color: '#92400e', marginTop: 4 }}>Você fica com 100% deste valor</div>
        </div>

        {error && <div style={{ background: '#fee2e2', color: '#dc2626', padding: 10, borderRadius: 10, fontSize: 14, marginBottom: 12 }}>{error}</div>}

        {!mostraPropor ? (
          <div style={s.btnRow}>
            <button style={s.btnAceitar} onClick={() => enviarProposta(pedido.valorProposto)} disabled={loading}>
              {loading ? '...' : `✓ Aceitar R$ ${pedido.valorProposto?.toFixed(2)}`}
            </button>
            <button style={s.btnPropor} onClick={() => setMostraPropor(true)}>Propor valor</button>
          </div>
        ) : (
          <div style={s.contraWrap}>
            <div style={{ fontSize: 13, fontWeight: 700, color: '#444', marginBottom: 8 }}>Seu valor proposto:</div>
            <input
              style={s.contraInput}
              type="number"
              min="1"
              step="0.50"
              value={contraValor}
              onChange={e => setContraValor(e.target.value)}
            />
            <button style={s.btnContra} onClick={() => enviarProposta(contraValor)} disabled={loading}>
              {loading ? 'Enviando...' : 'Enviar proposta'}
            </button>
            <button onClick={() => setMostraPropor(false)} style={{ width: '100%', marginTop: 8, padding: 10, background: 'none', border: 'none', color: '#888', cursor: 'pointer', fontSize: 14 }}>
              Cancelar
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
