import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import api from '../../services/api'
import AvaliacaoStars from '../../components/AvaliacaoStars'



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
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '100dvh', background: 'var(--bg)', padding: 24 }}>
      <div className="card anim-up" style={{ width: '100%', maxWidth: 400, textAlign: 'center', padding: 32 }}>
        <div style={{ fontSize: 52, marginBottom: 8 }}>🌟</div>
        <h1 style={{ fontSize: 22, fontWeight: 800, color: 'var(--text)', marginBottom: 6 }}>Como foi a entrega?</h1>
        <p style={{ color: 'var(--text3)', marginBottom: 24, fontSize: 14 }}>Avalie o motoboy</p>

        <img
          style={{ width: 72, height: 72, borderRadius: '50%', margin: '0 auto 12px', display: 'block', objectFit: 'cover', border: '3px solid var(--border)' }}
          src={pedido.motoboy?.user?.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(motoboyNome)}&background=1a253e&color=fff`}
          alt={motoboyNome}
        />
        <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 4, color: 'var(--text)' }}>{motoboyNome}</div>
        <div style={{ color: 'var(--text3)', fontSize: 13, marginBottom: 20 }}>{pedido.motoboy?.vehicle} • {pedido.motoboy?.plate}</div>

        <AvaliacaoStars value={nota} onChange={setNota} />

        <textarea
          className="inp"
          style={{ marginTop: 16, resize: 'none', boxSizing: 'border-box' }}
          rows={3}
          value={comentario}
          onChange={e => setComentario(e.target.value)}
          placeholder="Deixe um comentário (opcional)..."
        />

        <button className="btn btn-primary" style={{ width: '100%', marginTop: 16, fontSize: 17 }} onClick={enviar} disabled={loading}>
          {loading ? 'Enviando...' : 'Enviar avaliação'}
        </button>
      </div>
    </div>
  )
}
