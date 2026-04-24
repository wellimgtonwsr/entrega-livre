import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import api from '../../services/api'
import AvaliacaoStars from '../../components/AvaliacaoStars'

const s = {
  wrap: { display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '100dvh', background: '#f5f5f5', padding: 24 },
  card: { background: '#fff', borderRadius: 20, padding: 32, width: '100%', maxWidth: 400, textAlign: 'center', boxShadow: '0 4px 24px rgba(0,0,0,0.08)' },
  btn: { width: '100%', padding: 16, borderRadius: 14, background: '#10b981', border: 'none', color: '#fff', fontSize: 17, fontWeight: 700, cursor: 'pointer', marginTop: 16 },
  textarea: { width: '100%', padding: 12, borderRadius: 12, border: '2px solid #e5e5e5', fontSize: 14, marginTop: 16, resize: 'none', outline: 'none' },
}

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
    <div style={s.wrap}>
      <div style={s.card}>
        <div style={{ fontSize: 48, marginBottom: 8 }}>💰</div>
        <h1 style={{ fontSize: 22, fontWeight: 800, color: '#1a1a2e', marginBottom: 6 }}>Entrega concluída!</h1>
        <div style={{ fontSize: 28, fontWeight: 800, color: '#10b981', marginBottom: 8 }}>+R$ {pedido.valorFinal?.toFixed(2)}</div>
        <p style={{ color: '#888', marginBottom: 24, fontSize: 14 }}>100% para você. Agora avalie o cliente.</p>

        <AvaliacaoStars value={nota} onChange={setNota} />

        <textarea
          style={s.textarea}
          rows={3}
          value={comentario}
          onChange={e => setComentario(e.target.value)}
          placeholder="Comentário sobre o cliente (opcional)..."
        />

        <button style={s.btn} onClick={enviar} disabled={loading}>
          {loading ? 'Enviando...' : 'Enviar avaliação'}
        </button>
      </div>
    </div>
  )
}
