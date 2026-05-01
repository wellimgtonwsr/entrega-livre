import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../../services/api'
import BottomNav from '../../components/BottomNav'

const CATEGORIAS = ['Todos', 'Lanchonete', 'Restaurante', 'Pizzaria', 'Japonês', 'Açaí', 'Padaria', 'Mercado']

export default function Restaurantes() {
  const navigate = useNavigate()
  const [lojas, setLojas] = useState([])
  const [loading, setLoading] = useState(true)
  const [busca, setBusca] = useState('')
  const [categoria, setCategoria] = useState('Todos')

  useEffect(() => {
    api.get('/restaurantes').then(r => setLojas(r.data.data || [])).catch(() => {}).finally(() => setLoading(false))
  }, [])

  const filtradas = lojas.filter(l => {
    const matchBusca = l.nome.toLowerCase().includes(busca.toLowerCase())
    const matchCat = categoria === 'Todos' || l.categoria === categoria
    return matchBusca && matchCat
  })

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100dvh', background: 'var(--bg)' }}>
      {/* Header */}
      <div style={{ background: 'var(--dark)', padding: '16px 20px', paddingTop: 'max(16px, env(safe-area-inset-top))' }}>
        <div style={{ color: 'rgba(255,255,255,0.55)', fontSize: 13, marginBottom: 4 }}>📍 Sua região</div>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          <h1 style={{ color: '#fff', fontSize: 22, fontWeight: 900, flex: 1 }}>O que vai pedir? 🍔</h1>
          <button
            onClick={() => navigate('/cliente/novo-pedido')}
            style={{ background: 'rgba(245,158,11,0.15)', border: '1px solid rgba(245,158,11,0.3)', borderRadius: 10, padding: '7px 12px', color: '#f59e0b', fontSize: 12, fontWeight: 700, cursor: 'pointer', whiteSpace: 'nowrap' }}
          >
            📦 Enviar pacote
          </button>
        </div>

        <input
          style={{ marginTop: 12, width: '100%', boxSizing: 'border-box', background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12, padding: '10px 14px', color: '#fff', fontSize: 14, outline: 'none' }}
          placeholder="🔍 Buscar restaurante..."
          value={busca}
          onChange={e => setBusca(e.target.value)}
        />
      </div>

      {/* Filtro de categorias */}
      <div style={{ display: 'flex', gap: 8, overflowX: 'auto', padding: '12px 20px', background: 'var(--dark)', paddingBottom: 16, scrollbarWidth: 'none' }}>
        {CATEGORIAS.map(c => (
          <button
            key={c}
            onClick={() => setCategoria(c)}
            style={{
              padding: '6px 14px', borderRadius: 99, fontSize: 13, fontWeight: 600,
              whiteSpace: 'nowrap', cursor: 'pointer', flexShrink: 0,
              background: categoria === c ? 'var(--brand)' : 'rgba(255,255,255,0.07)',
              color: categoria === c ? 'var(--dark)' : 'rgba(255,255,255,0.6)',
              border: categoria === c ? 'none' : '1px solid rgba(255,255,255,0.1)',
            }}
          >{c}</button>
        ))}
      </div>

      {/* Lista */}
      <div style={{ flex: 1, padding: '16px 20px', paddingBottom: 'max(90px, calc(90px + env(safe-area-inset-bottom)))' }}>
        {loading && (
          <div style={{ textAlign: 'center', marginTop: 40 }}><div className="spinner" style={{ margin: '0 auto' }} /></div>
        )}

        {!loading && filtradas.length === 0 && (
          <div style={{ textAlign: 'center', color: 'var(--text3)', marginTop: 60 }}>
            <div style={{ fontSize: 48, marginBottom: 12 }}>🍽️</div>
            <p style={{ fontWeight: 600 }}>Nenhum restaurante encontrado</p>
            <p style={{ fontSize: 13, marginTop: 4 }}>Tente outra categoria ou busca</p>
          </div>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {filtradas.map(l => (
            <button
              key={l.id}
              onClick={() => navigate(`/restaurantes/${l.id}`)}
              style={{
                background: '#fff', border: 'none', borderRadius: 16, padding: 0,
                overflow: 'hidden', cursor: 'pointer', textAlign: 'left',
                boxShadow: '0 2px 12px rgba(0,0,0,0.08)',
                display: 'flex', alignItems: 'center',
              }}
            >
              <div style={{
                width: 80, height: 80, flexShrink: 0,
                background: l.logo ? 'transparent' : 'linear-gradient(135deg,#f59e0b,#d97706)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 32,
              }}>
                {l.logo ? <img src={l.logo} alt={l.nome} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : '🍔'}
              </div>
              <div style={{ padding: '12px 14px', flex: 1 }}>
                <div style={{ fontWeight: 800, fontSize: 15, color: '#1a253e', marginBottom: 2 }}>{l.nome}</div>
                {l.descricao && <div style={{ fontSize: 12, color: '#666', marginBottom: 4 }}>{l.descricao}</div>}
                <span style={{ fontSize: 11, fontWeight: 700, color: '#f59e0b', background: '#fff8ec', padding: '2px 8px', borderRadius: 99 }}>{l.categoria}</span>
              </div>
              <div style={{ paddingRight: 14, color: '#f59e0b', fontSize: 20, fontWeight: 700 }}>›</div>
            </button>
          ))}
        </div>
      </div>

      <BottomNav />
    </div>
  )
}
