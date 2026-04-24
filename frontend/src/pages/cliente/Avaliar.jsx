import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import api from '../../services/api'
import AvaliacaoStars from '../../components/AvaliacaoStars'

const s = {
  wrap: { display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '100dvh', background: '#f5f5f5', padding: 24 },
  card: { background: '#fff', borderRadius: 20, padding: 32, width: '100%', maxWidth: 400, textAlign: 'center', boxShadow: '0 4px 24px rgba(0,0,0,0.08)' },
  title: { fontSize: 22, fontWeight: 800, color: '#1a1a2e', marginBottom: 6 },
  sub: { color: '#888', marginBottom: 24, fontSize: 14 },
  avatar: { width: 72, height: 72, borderRadius: '50%', margin: '0 auto 12px', display: 'block', objectFit: 'cover' },
  nome: { fontWeight: 700, fontSize: 16, marginBottom: 4 },
  textarea: { width: '100%', padding: 12, borderRadius: 12, border: '2px solid #e5e5e5', fontSize: 14, marginTop: 16, resize: 'none', outline: 'none' },
  btn: { width: '100%', padding: 16, borderRadius: 14, background: '#f59e0b', border: 'none', color: '#1a1a2e', fontSize: 17, fontWeight: 700, cursor: 'pointer', marginTop: 16 },
}

export default function AvaliarCliente() {
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
    if (!pedido?.motoboy?.user?.id) return
    setLoading(true)
    try {
      await api.post('/avaliacoes', {
        pedidoId,
        avaliadoId: pedido.motoboy.user.id,
        nota,
        comentario,
      })
      navigate('/cliente/historico')
    } catch (err) {
      alert(err.response?.data?.message || 'Erro ao avaliar')
    } finally {
      setLoading(false)
    }
  }

  if (!pedido) return null
  const motoboyNome = pedido.motoboy?.user?.name || 'Motoboy'

  return (
    <div style={s.wrap}>
      <div style={s.card}>
        <div style={{ fontSize: 48, marginBottom: 8 }}>🌟</div>
        <h1 style={s.title}>Como foi a entrega?</h1>
        <p style={s.sub}>Avalie o motoboy</p>

        <img
          style={s.avatar}
          src={pedido.motoboy?.user?.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(motoboyNome)}&background=1a1a2e&color=fff`}
          alt={motoboyNome}
        />
        <div style={s.nome}>{motoboyNome}</div>
        <div style={{ color: '#888', fontSize: 13, marginBottom: 16 }}>{pedido.motoboy?.vehicle} • {pedido.motoboy?.plate}</div>

        <AvaliacaoStars value={nota} onChange={setNota} />

        <textarea
          style={s.textarea}
          rows={3}
          value={comentario}
          onChange={e => setComentario(e.target.value)}
          placeholder="Deixe um comentário (opcional)..."
        />

        <button style={s.btn} onClick={enviar} disabled={loading}>
          {loading ? 'Enviando...' : 'Enviar avaliação'}
        </button>
      </div>
    </div>
  )
}
