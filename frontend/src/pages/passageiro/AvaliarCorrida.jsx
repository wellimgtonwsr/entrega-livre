import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import api from '../../services/api'
import AvaliacaoStars from '../../components/AvaliacaoStars'

export default function AvaliarCorrida() {
  const { corridaId } = useParams()
  const navigate = useNavigate()
  const [corrida, setCorrida] = useState(null)
  const [nota, setNota] = useState(5)
  const [comentario, setComentario] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    api.get(`/corridas/${corridaId}`).then(r => setCorrida(r.data.data)).catch(() => {})
  }, [corridaId])

  const enviar = async () => {
    if (!corrida?.motoboy?.id) return
    setLoading(true)
    try {
      const motoboyUserId = corrida.motoboy.id
      await api.post(`/corridas/${corridaId}/avaliar`, { avaliadoId: motoboyUserId, nota, comentario })
      navigate('/passageiro/nova-viagem')
    } catch (err) {
      alert(err.response?.data?.message || 'Erro ao enviar avaliação')
    } finally {
      setLoading(false)
    }
  }

  const pular = () => navigate('/passageiro/nova-viagem')

  if (!corrida) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100dvh' }}>
      <div className="spinner" />
    </div>
  )

  const motoboy = corrida.motoboy

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '100dvh', background: 'var(--bg)', padding: 24 }}>
      <div className="card anim-up" style={{ width: '100%', maxWidth: 400, textAlign: 'center', padding: 32 }}>
        <div style={{ fontSize: 52, marginBottom: 8 }}>🏍️</div>
        <h1 style={{ fontSize: 22, fontWeight: 800, color: 'var(--text)', marginBottom: 6 }}>Corrida concluída!</h1>
        <div style={{ fontSize: 28, fontWeight: 800, color: 'var(--success)', marginBottom: 4 }}>
          R$ {corrida.valorFinal?.toFixed(2)}
        </div>
        {motoboy && (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, margin: '16px 0' }}>
            <img
              src={motoboy.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(motoboy.nome || 'M')}&background=6366f1&color=fff`}
              alt={motoboy.nome}
              style={{ width: 48, height: 48, borderRadius: '50%', objectFit: 'cover' }}
            />
            <div style={{ textAlign: 'left' }}>
              <div style={{ fontWeight: 700, color: 'var(--text)' }}>{motoboy.nome}</div>
              <div style={{ fontSize: 13, color: 'var(--text3)' }}>{motoboy.vehicle} • {motoboy.plate}</div>
            </div>
          </div>
        )}

        <p style={{ color: 'var(--text3)', marginBottom: 20, fontSize: 14 }}>Como foi sua experiência com o motoboy?</p>

        <AvaliacaoStars value={nota} onChange={setNota} />

        <textarea
          className="inp"
          style={{ marginTop: 16, resize: 'none', boxSizing: 'border-box' }}
          rows={3}
          value={comentario}
          onChange={e => setComentario(e.target.value)}
          placeholder="Comentário (opcional)..."
        />

        <button
          className="btn"
          style={{ width: '100%', marginTop: 16, fontSize: 17, background: 'linear-gradient(135deg,#6366f1,#4f46e5)', color: '#fff', border: 'none' }}
          onClick={enviar}
          disabled={loading}
        >
          {loading ? 'Enviando...' : 'Enviar avaliação'}
        </button>

        <button
          onClick={pular}
          style={{ marginTop: 12, background: 'none', border: 'none', color: 'var(--text3)', fontSize: 14, cursor: 'pointer' }}
        >
          Pular
        </button>
      </div>
    </div>
  )
}
