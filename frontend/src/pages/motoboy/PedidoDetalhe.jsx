import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { GoogleMap, useJsApiLoader, DirectionsRenderer, Marker } from '@react-google-maps/api'
import api from '../../services/api'



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

  if (!pedido) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100dvh' }}>
      <div className="spinner" />
    </div>
  )

  const expiraEm = Math.max(0, new Date(pedido.expiresAt) - new Date())
  const minutos = Math.floor(expiraEm / 60000)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100dvh', background: 'var(--bg)' }}>
      {/* Header */}
      <div className="page-header">
        <button className="btn btn-ghost btn-sm" style={{ padding: '4px 8px', marginRight: 8 }} onClick={() => navigate(-1)}>←</button>
        <div>
          <div className="page-header-title">Detalhes do pedido</div>
          {minutos > 0 && <div className="page-header-sub">⏱ Expira em {minutos} min</div>}
        </div>
      </div>

      {/* Mapa */}
      <div style={{ height: '42dvh', flexShrink: 0 }}>
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

      {/* Info scrollable */}
      <div style={{ flex: 1, background: 'var(--card)', overflowY: 'auto', padding: '16px 20px', paddingBottom: 'max(24px, env(safe-area-inset-bottom))' }}>
        {/* Badges distância / tempo */}
        <div style={{ display: 'flex', gap: 10, marginBottom: 16 }}>
          <div className="info-badge" style={{ flex: 1 }}>
            <div className="info-badge-val">{pedido.distanciaKm?.toFixed(1)} km</div>
            <div className="info-badge-lbl">Distância</div>
          </div>
          <div className="info-badge" style={{ flex: 1 }}>
            <div className="info-badge-val">{pedido.tempoEstimadoMin} min</div>
            <div className="info-badge-lbl">Tempo est.</div>
          </div>
        </div>

        {/* Rota */}
        <div className="card" style={{ marginBottom: 14, padding: '12px 14px', background: 'var(--bg)' }}>
          <div style={{ fontSize: 12, color: 'var(--text3)', marginBottom: 2 }}>📍 Origem</div>
          <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 8 }}>{pedido.origemEndereco}</div>
          <div style={{ fontSize: 12, color: 'var(--text3)', marginBottom: 2 }}>🏁 Destino</div>
          <div style={{ fontWeight: 600, fontSize: 14 }}>{pedido.destinoEndereco}</div>
        </div>

        {pedido.descricao && (
          <div style={{ color: 'var(--text2)', fontSize: 14, marginBottom: 14 }}>📦 {pedido.descricao}</div>
        )}

        {/* Valor */}
        <div style={{ background: 'var(--brand-light)', borderRadius: 14, padding: '14px 18px', marginBottom: 16, textAlign: 'center', border: '1.5px solid #fde68a' }}>
          <div style={{ fontSize: 13, color: '#92400e', fontWeight: 600 }}>Cliente propõe</div>
          <div style={{ fontSize: 28, fontWeight: 800, color: 'var(--dark)', marginTop: 2 }}>R$ {pedido.valorProposto?.toFixed(2)}</div>
          <div style={{ fontSize: 12, color: '#92400e', marginTop: 4 }}>Você fica com 100% deste valor</div>
        </div>

        {error && <div className="alert alert-error" style={{ marginBottom: 12 }}>{error}</div>}

        {!mostraPropor ? (
          <div style={{ display: 'flex', gap: 10 }}>
            <button className="btn btn-primary" style={{ flex: 2, fontSize: 16 }} onClick={() => enviarProposta(pedido.valorProposto)} disabled={loading}>
              {loading ? '...' : `✓ Aceitar R$ ${pedido.valorProposto?.toFixed(2)}`}
            </button>
            <button className="btn btn-outline" style={{ flex: 1 }} onClick={() => setMostraPropor(true)}>Propor valor</button>
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
            <button className="btn btn-primary" style={{ width: '100%' }} onClick={() => enviarProposta(contraValor)} disabled={loading}>
              {loading ? 'Enviando...' : 'Enviar proposta'}
            </button>
            <button onClick={() => setMostraPropor(false)} style={{ width: '100%', marginTop: 8, padding: 10, background: 'none', border: 'none', color: 'var(--text3)', cursor: 'pointer', fontSize: 14 }}>
              Cancelar
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
