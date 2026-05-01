import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import api from '../../services/api'
import { useAuth } from '../../context/AuthContext'

export default function Cardapio() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()

  const [restaurante, setRestaurante] = useState(null)
  const [loading, setLoading] = useState(true)
  const [busca, setBusca] = useState('')
  const [catAtiva, setCatAtiva] = useState('todas')
  const [carrinho, setCarrinho] = useState([])
  const [showCarrinho, setShowCarrinho] = useState(false)
  const [obs, setObs] = useState('')
  const [enviando, setEnviando] = useState(false)

  useEffect(() => {
    api.get(`/restaurantes/${id}`)
      .then(r => setRestaurante(r.data.data))
      .catch(() => navigate('/restaurantes'))
      .finally(() => setLoading(false))
  }, [id, navigate])

  const addItem = (produto) => {
    setCarrinho(prev => {
      const idx = prev.findIndex(i => i.produtoId === produto.id)
      if (idx >= 0) {
        const n = [...prev]
        n[idx] = { ...n[idx], quantidade: n[idx].quantidade + 1 }
        return n
      }
      return [...prev, { produtoId: produto.id, nome: produto.nome, preco: produto.preco, imagem: produto.imagem, quantidade: 1 }]
    })
  }

  const removeItem = (produtoId) => {
    setCarrinho(prev => {
      const idx = prev.findIndex(i => i.produtoId === produtoId)
      if (idx < 0) return prev
      const n = [...prev]
      if (n[idx].quantidade > 1) { n[idx] = { ...n[idx], quantidade: n[idx].quantidade - 1 }; return n }
      return prev.filter(i => i.produtoId !== produtoId)
    })
  }

  const qtdNoCarrinho = (produtoId) => carrinho.find(i => i.produtoId === produtoId)?.quantidade || 0
  const totalCarrinho = carrinho.reduce((s, i) => s + i.preco * i.quantidade, 0)
  const totalItens = carrinho.reduce((s, i) => s + i.quantidade, 0)

  const enviarPedido = async () => {
    if (carrinho.length === 0) return
    setEnviando(true)
    try {
      const { data } = await api.post(`/restaurantes/${id}/pedido`, {
        itens: carrinho.map(i => ({ produtoId: i.produtoId, quantidade: i.quantidade })),
        observacoes: obs || null,
        nomeCliente: user?.name || '',
      })
      navigate(`/restaurantes/pedido/${data.data.id}`)
    } catch (e) {
      alert(e.response?.data?.message || 'Erro ao enviar pedido')
    } finally {
      setEnviando(false)
    }
  }

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100dvh' }}>
      <div className="spinner" style={{ width: 40, height: 40 }} />
    </div>
  )

  if (!restaurante) return null

  // Produtos filtrados
  const todosProdutos = restaurante.categorias.flatMap(c => c.produtos.map(p => ({ ...p, _catNome: c.nome })))
  const produtosFiltrados = todosProdutos.filter(p =>
    (catAtiva === 'todas' || p.categoriaId === catAtiva) &&
    (!busca || p.nome.toLowerCase().includes(busca.toLowerCase()))
  )

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100dvh', background: 'var(--bg)' }}>

      {/* Header */}
      <div style={{
        background: 'linear-gradient(135deg,#f59e0b,#d97706)',
        padding: '16px 20px',
        paddingTop: 'max(16px, env(safe-area-inset-top))',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
          <button onClick={() => navigate('/restaurantes')} style={{ background: 'rgba(255,255,255,0.2)', border: 'none', borderRadius: 10, width: 36, height: 36, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#fff', fontSize: 18 }}>←</button>
          {restaurante.logo
            ? <img src={restaurante.logo} alt={restaurante.nome} style={{ width: 44, height: 44, borderRadius: 12, objectFit: 'cover' }} />
            : <div style={{ width: 44, height: 44, borderRadius: 12, background: 'rgba(255,255,255,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22 }}>🍔</div>
          }
          <div style={{ flex: 1 }}>
            <div style={{ color: '#fff', fontWeight: 900, fontSize: 18 }}>{restaurante.nome}</div>
            <div style={{ color: 'rgba(255,255,255,0.75)', fontSize: 12 }}>{restaurante.categoria}</div>
          </div>
        </div>

        {/* Busca */}
        <input
          style={{ width: '100%', boxSizing: 'border-box', background: 'rgba(255,255,255,0.2)', border: 'none', borderRadius: 12, padding: '10px 14px', color: '#fff', fontSize: 14, outline: 'none' }}
          placeholder="🔍 Buscar no cardápio..."
          value={busca}
          onChange={e => setBusca(e.target.value)}
        />
      </div>

      {/* Tabs de categoria */}
      <div style={{ display: 'flex', gap: 8, overflowX: 'auto', padding: '12px 16px', background: '#fff', boxShadow: '0 2px 8px rgba(0,0,0,0.06)', scrollbarWidth: 'none', flexShrink: 0 }}>
        <button
          onClick={() => setCatAtiva('todas')}
          style={{ padding: '6px 14px', borderRadius: 99, fontSize: 13, fontWeight: 700, whiteSpace: 'nowrap', cursor: 'pointer', flexShrink: 0, border: 'none', background: catAtiva === 'todas' ? '#f59e0b' : '#f3f4f6', color: catAtiva === 'todas' ? '#fff' : '#374151' }}
        >
          Todos
        </button>
        {restaurante.categorias.map(c => (
          <button
            key={c.id}
            onClick={() => setCatAtiva(c.id)}
            style={{ padding: '6px 14px', borderRadius: 99, fontSize: 13, fontWeight: 700, whiteSpace: 'nowrap', cursor: 'pointer', flexShrink: 0, border: 'none', background: catAtiva === c.id ? '#f59e0b' : '#f3f4f6', color: catAtiva === c.id ? '#fff' : '#374151' }}
          >
            {c.icone} {c.nome}
          </button>
        ))}
      </div>

      {/* Lista de produtos */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '12px 16px', paddingBottom: totalItens > 0 ? 100 : 24 }}>
        {produtosFiltrados.length === 0 && (
          <div style={{ textAlign: 'center', marginTop: 60, color: 'var(--text3)' }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>🍽️</div>
            <p>Nenhum item encontrado</p>
          </div>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {produtosFiltrados.map(p => {
            const qtd = qtdNoCarrinho(p.id)
            return (
              <div key={p.id} style={{ background: '#fff', borderRadius: 14, padding: '12px 14px', display: 'flex', gap: 12, alignItems: 'center', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
                {p.imagem
                  ? <img src={p.imagem} alt={p.nome} style={{ width: 70, height: 70, borderRadius: 10, objectFit: 'cover', flexShrink: 0 }} />
                  : <div style={{ width: 70, height: 70, borderRadius: 10, background: '#f3f4f6', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 28, flexShrink: 0 }}>🍽️</div>
                }
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 700, fontSize: 14, color: '#1a253e', marginBottom: 2 }}>{p.nome}</div>
                  {p.descricao && <div style={{ fontSize: 12, color: '#666', marginBottom: 4, lineHeight: 1.3 }}>{p.descricao}</div>}
                  <div style={{ fontWeight: 800, color: '#f59e0b', fontSize: 16 }}>R$ {p.preco.toFixed(2)}</div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
                  {qtd > 0 ? (
                    <>
                      <button onClick={() => removeItem(p.id)} style={{ width: 30, height: 30, borderRadius: '50%', background: '#fee2e2', border: 'none', cursor: 'pointer', fontSize: 18, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#dc2626', fontWeight: 900 }}>−</button>
                      <span style={{ fontWeight: 800, fontSize: 16, minWidth: 20, textAlign: 'center' }}>{qtd}</span>
                    </>
                  ) : null}
                  <button onClick={() => addItem(p)} style={{ width: 30, height: 30, borderRadius: '50%', background: '#f59e0b', border: 'none', cursor: 'pointer', fontSize: 18, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 900 }}>+</button>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Barra de carrinho flutuante */}
      {totalItens > 0 && !showCarrinho && (
        <div style={{ position: 'fixed', bottom: 0, left: 0, right: 0, padding: '12px 16px', paddingBottom: 'max(16px, env(safe-area-inset-bottom))', background: '#fff', boxShadow: '0 -4px 24px rgba(0,0,0,0.12)' }}>
          <button
            onClick={() => setShowCarrinho(true)}
            style={{ width: '100%', padding: '14px', background: 'linear-gradient(135deg,#f59e0b,#d97706)', border: 'none', borderRadius: 14, color: '#fff', fontWeight: 800, fontSize: 16, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}
          >
            <span style={{ background: 'rgba(255,255,255,0.25)', borderRadius: 99, padding: '2px 10px', fontSize: 14 }}>{totalItens}</span>
            <span>Ver carrinho</span>
            <span>R$ {totalCarrinho.toFixed(2)}</span>
          </button>
        </div>
      )}

      {/* Modal do carrinho */}
      {showCarrinho && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 100, display: 'flex', alignItems: 'flex-end' }} onClick={e => e.target === e.currentTarget && setShowCarrinho(false)}>
          <div style={{ background: '#fff', borderRadius: '24px 24px 0 0', width: '100%', maxHeight: '80dvh', display: 'flex', flexDirection: 'column' }}>
            <div style={{ padding: '20px 20px 0' }}>
              <div style={{ width: 40, height: 4, background: '#e5e7eb', borderRadius: 2, margin: '0 auto 16px' }} />
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
                <div style={{ fontWeight: 800, fontSize: 18 }}>Seu pedido 🛒</div>
                <button onClick={() => setShowCarrinho(false)} style={{ background: '#f3f4f6', border: 'none', borderRadius: 10, padding: '6px 12px', cursor: 'pointer', fontWeight: 700 }}>Fechar</button>
              </div>
            </div>

            <div style={{ flex: 1, overflowY: 'auto', padding: '0 20px' }}>
              {carrinho.map(item => (
                <div key={item.produtoId} style={{ display: 'flex', alignItems: 'center', gap: 12, paddingBottom: 12, marginBottom: 12, borderBottom: '1px solid #f3f4f6' }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 700, fontSize: 14 }}>{item.nome}</div>
                    <div style={{ color: '#f59e0b', fontWeight: 800 }}>R$ {(item.preco * item.quantidade).toFixed(2)}</div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <button onClick={() => removeItem(item.produtoId)} style={{ width: 28, height: 28, borderRadius: '50%', background: '#fee2e2', border: 'none', cursor: 'pointer', color: '#dc2626', fontWeight: 900, fontSize: 16 }}>−</button>
                    <span style={{ fontWeight: 800, minWidth: 20, textAlign: 'center' }}>{item.quantidade}</span>
                    <button onClick={() => addItem({ id: item.produtoId, nome: item.nome, preco: item.preco, imagem: item.imagem })} style={{ width: 28, height: 28, borderRadius: '50%', background: '#f59e0b', border: 'none', cursor: 'pointer', color: '#fff', fontWeight: 900, fontSize: 16 }}>+</button>
                  </div>
                </div>
              ))}

              <textarea
                style={{ width: '100%', boxSizing: 'border-box', border: '1px solid #e5e7eb', borderRadius: 12, padding: '10px 12px', fontSize: 14, resize: 'none', outline: 'none', marginBottom: 8 }}
                rows={2}
                placeholder="Observações (ex: sem cebola)..."
                value={obs}
                onChange={e => setObs(e.target.value)}
              />
            </div>

            <div style={{ padding: '16px 20px', paddingBottom: 'max(20px, env(safe-area-inset-bottom))', borderTop: '1px solid #f3f4f6' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
                <span style={{ fontWeight: 600, color: '#666' }}>Total</span>
                <span style={{ fontWeight: 900, fontSize: 20, color: '#f59e0b' }}>R$ {totalCarrinho.toFixed(2)}</span>
              </div>
              <button
                onClick={enviarPedido}
                disabled={enviando}
                style={{ width: '100%', padding: '14px', background: enviando ? '#d1d5db' : 'linear-gradient(135deg,#f59e0b,#d97706)', border: 'none', borderRadius: 14, color: '#fff', fontWeight: 800, fontSize: 16, cursor: enviando ? 'not-allowed' : 'pointer' }}
              >
                {enviando ? 'Enviando...' : 'Confirmar pedido'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
