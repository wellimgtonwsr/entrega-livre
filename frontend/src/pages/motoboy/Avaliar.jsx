import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import api from '../../services/api'
import AvaliacaoStars from '../../components/AvaliacaoStars'



export default function AvaliarMotoboy() {
  const { pedidoId } = useParams()
  const navigate = useNavigate()
  const [pedido, setPedido] = useState(null)
  const [nota, setNota] = useState(5)
  const [comentario, setComentario] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    api.get(`/pedidos/${pedidoId}`).then(r => setPedido(r.data.data)).catch(() => {})
  }, [pedidoId])

  const enviar = async () => {
    if (!pedido?.clienteId) return
    setLoading(true)
    try {
      await api.post('/avaliacoes', { pedidoId, avaliadoId: pedido.clienteId, nota, comentario })
      navigate('/motoboy/dashboard')
    } catch (err) {
      alert(err.response?.data?.message || 'Erro')
    } finally {
      setLoading(false)
    }
  }

  if (!pedido) return null

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '100dvh', background: 'var(--bg)', padding: 24 }}>
      <div className="card anim-up" style={{ width: '100%', maxWidth: 400, textAlign: 'center', padding: 32 }}>
        <div style={{ fontSize: 52, marginBottom: 8 }}>💰</div>
        <h1 style={{ fontSize: 22, fontWeight: 800, color: 'var(--text)', marginBottom: 6 }}>Entrega concluída!</h1>
        <div style={{ fontSize: 30, fontWeight: 800, color: 'var(--success)', marginBottom: 8 }}>+R$ {pedido.valorFinal?.toFixed(2)}</div>
        <p style={{ color: 'var(--text3)', marginBottom: 24, fontSize: 14 }}>100% para você. Agora avalie o cliente.</p>

        <AvaliacaoStars value={nota} onChange={setNota} />

        <textarea
          className="inp"
          style={{ marginTop: 16, resize: 'none', boxSizing: 'border-box' }}
          rows={3}
          value={comentario}
          onChange={e => setComentario(e.target.value)}
          placeholder="Comentário sobre o cliente (opcional)..."
        />

        <button
          className="btn"
          style={{ width: '100%', marginTop: 16, fontSize: 17, background: 'var(--success)', color: '#fff', border: 'none' }}
          onClick={enviar}
          disabled={loading}
        >
          {loading ? 'Enviando...' : 'Enviar avaliação'}
        </button>
      </div>
    </div>
  )
}
