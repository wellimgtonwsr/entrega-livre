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
    api.get('/lojas').then(r => setLojas(r.data.data || [])).catch(() => {}).finally(() => setLoading(false))
  }, [])

  const filtradas = lojas.filter(l => {
    const matchBusca = l.nome.toLowerCase().includes(busca.toLowerCase())
    const matchCat = categoria === 'Todos' || l.categoria === categoria
    return matchBusca && matchCat && l.ativa
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

        {/* Barra de busca */}
        <input
          className="inp"
          style={{ marginTop: 12, background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', '::placeholder': { color: 'rgba(255,255,255,0.4)' } }}
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

        {/* Grid de lojas */}
        <div style={{ display: 'grid', gap: 14 }}>
          {filtradas.map(loja => (
            <div
              key={loja.id}
              className="card"
              style={{ cursor: 'pointer', padding: 0, overflow: 'hidden' }}
              onClick={() => navigate(`/restaurante/${loja.id}`)}
            >
              {/* Banner */}
              <div style={{
                height: 140, background: loja.foto ? `url(${loja.foto}) center/cover` : 'linear-gradient(135deg,#1a253e,#0f1729)',
                display: 'flex', alignItems: 'flex-end', padding: '12px 14px',
                position: 'relative',
              }}>
                {!loja.foto && (
                  <div style={{ fontSize: 48, position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-60%)' }}>
                    {loja.categoria === 'Pizzaria' ? '🍕' : loja.categoria === 'Japonês' ? '🍱' : loja.categoria === 'Açaí' ? '🍇' : loja.categoria === 'Mercado' ? '🏪' : '🍔'}
                  </div>
                )}
                <span style={{ background: 'rgba(0,0,0,0.55)', color: '#fff', fontSize: 11, fontWeight: 700, padding: '3px 8px', borderRadius: 99 }}>
                  {loja.categoria}
                </span>
              </div>

              {/* Info */}
              <div style={{ padding: '12px 14px' }}>
                <div style={{ fontWeight: 800, fontSize: 16, color: 'var(--text)', marginBottom: 4 }}>{loja.nome}</div>
                {loja.descricao && <div style={{ fontSize: 13, color: 'var(--text3)', marginBottom: 8 }}>{loja.descricao}</div>}
                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                  <span className="badge" style={{ background: '#dcfce7', color: '#166534' }}>⭐ {loja.avaliacao?.toFixed(1) || '5.0'}</span>
                  <span className="badge">🕒 {loja.tempoEntrega || '30-45'} min</span>
                  {loja.taxaEntrega === 0
                    ? <span className="badge" style={{ background: '#dcfce7', color: '#166534' }}>🆓 Frete grátis</span>
                    : <span className="badge">🛵 R$ {loja.taxaEntrega?.toFixed(2)}</span>
                  }
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <BottomNav role="CLIENT" />
    </div>
  )
}
