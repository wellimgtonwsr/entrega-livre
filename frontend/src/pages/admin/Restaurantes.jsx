import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../../services/api'

const CATEGORIAS_TIPO = ['Restaurante', 'Lanchonete', 'Pizzaria', 'Japonês', 'Açaí', 'Padaria', 'Mercado']

function ModalRestaurante({ inicial, onSalvar, onFechar }) {
  const [form, setForm] = useState({ nome: '', descricao: '', categoria: 'Restaurante', logo: '', endereco: '', ...inicial })
  const [loading, setLoading] = useState(false)
  const set = (k, v) => setForm(p => ({ ...p, [k]: v }))

  const salvar = async () => {
    if (!form.nome) return alert('Nome obrigatório')
    setLoading(true)
    try { await onSalvar(form) } finally { setLoading(false) }
  }

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
      <div style={{ background: '#fff', borderRadius: 20, padding: 24, width: '100%', maxWidth: 480 }}>
        <div style={{ fontWeight: 800, fontSize: 18, marginBottom: 16 }}>{inicial ? 'Editar restaurante' : 'Novo restaurante'}</div>
        {[['nome', 'Nome *'], ['descricao', 'Descrição'], ['logo', 'URL do logo'], ['endereco', 'Endereço']].map(([k, label]) => (
          <div key={k} style={{ marginBottom: 12 }}>
            <label style={{ fontSize: 12, fontWeight: 600, color: '#666', display: 'block', marginBottom: 4 }}>{label}</label>
            <input value={form[k]} onChange={e => set(k, e.target.value)} style={{ width: '100%', boxSizing: 'border-box', border: '1px solid #e5e7eb', borderRadius: 10, padding: '10px 12px', fontSize: 14, outline: 'none' }} />
          </div>
        ))}
        <div style={{ marginBottom: 16 }}>
          <label style={{ fontSize: 12, fontWeight: 600, color: '#666', display: 'block', marginBottom: 4 }}>Categoria</label>
          <select value={form.categoria} onChange={e => set('categoria', e.target.value)} style={{ width: '100%', border: '1px solid #e5e7eb', borderRadius: 10, padding: '10px 12px', fontSize: 14, outline: 'none' }}>
            {CATEGORIAS_TIPO.map(c => <option key={c}>{c}</option>)}
          </select>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button onClick={onFechar} style={{ flex: 1, padding: 12, background: '#f3f4f6', border: 'none', borderRadius: 12, fontWeight: 700, cursor: 'pointer' }}>Cancelar</button>
          <button onClick={salvar} disabled={loading} style={{ flex: 1, padding: 12, background: '#f59e0b', border: 'none', borderRadius: 12, color: '#fff', fontWeight: 700, cursor: 'pointer' }}>{loading ? 'Salvando...' : 'Salvar'}</button>
        </div>
      </div>
    </div>
  )
}

function ModalCardapio({ restauranteId, restauranteNome, onFechar }) {
  const [categorias, setCategorias] = useState([])
  const [produtos, setProdutos] = useState([])
  const [aba, setAba] = useState('produtos')
  const [novaCategoria, setNovaCategoria] = useState({ nome: '', icone: '🍽️' })
  const [novoProduto, setNovoProduto] = useState({ nome: '', preco: '', descricao: '', imagem: '', categoriaId: '' })
  const [loading, setLoading] = useState(false)
  const [pedidos, setPedidos] = useState([])

  const carregar = () => {
    api.get(`/restaurantes/${restauranteId}`).then(r => {
      setCategorias(r.data.data.categorias || [])
      setProdutos(r.data.data.categorias.flatMap(c => c.produtos.map(p => ({ ...p, _catNome: c.nome }))))
    }).catch(() => {})
  }

  const carregarPedidos = () => {
    api.get(`/admin/restaurantes/${restauranteId}/pedidos`).then(r => setPedidos(r.data.data || [])).catch(() => {})
  }

  useEffect(() => { carregar(); carregarPedidos() }, [restauranteId])

  const criarCategoria = async () => {
    if (!novaCategoria.nome) return
    setLoading(true)
    try {
      await api.post(`/admin/restaurantes/${restauranteId}/categorias`, novaCategoria)
      setNovaCategoria({ nome: '', icone: '🍽️' })
      carregar()
    } finally { setLoading(false) }
  }

  const deletarCategoria = async (id) => {
    if (!confirm('Excluir categoria e todos os produtos dela?')) return
    await api.delete(`/admin/categorias/${id}`).catch(() => {})
    carregar()
  }

  const criarProduto = async () => {
    if (!novoProduto.nome || !novoProduto.preco || !novoProduto.categoriaId) return alert('Nome, preço e categoria são obrigatórios')
    setLoading(true)
    try {
      await api.post(`/admin/restaurantes/${restauranteId}/produtos`, { ...novoProduto, preco: parseFloat(novoProduto.preco) })
      setNovoProduto({ nome: '', preco: '', descricao: '', imagem: '', categoriaId: '' })
      carregar()
    } finally { setLoading(false) }
  }

  const toggleDisponivel = async (prod) => {
    await api.put(`/admin/produtos/${prod.id}`, { disponivel: !prod.disponivel }).catch(() => {})
    carregar()
  }

  const deletarProduto = async (id) => {
    if (!confirm('Excluir produto?')) return
    await api.delete(`/admin/produtos/${id}`).catch(() => {})
    carregar()
  }

  const atualizarStatusPedido = async (pedidoId, status) => {
    await api.patch(`/admin/pedidos-restaurante/${pedidoId}/status`, { status }).catch(() => {})
    carregarPedidos()
  }

  const STATUS_PEDIDO = { PENDENTE: '#f59e0b', PREPARANDO: '#6366f1', PRONTO: '#10b981', CANCELADO: '#ef4444', CONCLUIDO: '#9ca3af' }
  const PROXIMOS_STATUS = { PENDENTE: 'PREPARANDO', PREPARANDO: 'PRONTO', PRONTO: 'CONCLUIDO' }

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 200, display: 'flex', alignItems: 'flex-end' }}>
      <div style={{ background: '#fff', borderRadius: '20px 20px 0 0', width: '100%', height: '90dvh', display: 'flex', flexDirection: 'column' }}>
        <div style={{ padding: '20px 20px 0' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <div style={{ fontWeight: 800, fontSize: 18 }}>📋 {restauranteNome}</div>
            <button onClick={onFechar} style={{ background: '#f3f4f6', border: 'none', borderRadius: 10, padding: '6px 14px', cursor: 'pointer', fontWeight: 700 }}>Fechar</button>
          </div>
          <div style={{ display: 'flex', gap: 8, marginBottom: 0 }}>
            {[['produtos', '🍽️ Produtos'], ['categorias', '🗂️ Categorias'], ['pedidos', '📦 Pedidos']].map(([k, label]) => (
              <button key={k} onClick={() => setAba(k)} style={{ padding: '8px 14px', borderRadius: 10, border: 'none', cursor: 'pointer', fontWeight: 700, fontSize: 13, background: aba === k ? '#f59e0b' : '#f3f4f6', color: aba === k ? '#fff' : '#374151' }}>{label}</button>
            ))}
          </div>
        </div>

        <div style={{ flex: 1, overflowY: 'auto', padding: '16px 20px' }}>

          {/* ABA CATEGORIAS */}
          {aba === 'categorias' && (
            <div>
              <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
                <input placeholder="Nome da categoria" value={novaCategoria.nome} onChange={e => setNovaCategoria(p => ({ ...p, nome: e.target.value }))} style={{ flex: 1, border: '1px solid #e5e7eb', borderRadius: 10, padding: '10px 12px', fontSize: 14, outline: 'none' }} />
                <input placeholder="Ícone" value={novaCategoria.icone} onChange={e => setNovaCategoria(p => ({ ...p, icone: e.target.value }))} style={{ width: 60, border: '1px solid #e5e7eb', borderRadius: 10, padding: '10px', fontSize: 14, outline: 'none', textAlign: 'center' }} />
                <button onClick={criarCategoria} disabled={loading} style={{ background: '#f59e0b', border: 'none', borderRadius: 10, padding: '10px 16px', color: '#fff', fontWeight: 700, cursor: 'pointer' }}>+ Criar</button>
              </div>
              {categorias.map(c => (
                <div key={c.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', background: '#f9fafb', borderRadius: 12, marginBottom: 8 }}>
                  <span style={{ fontSize: 22 }}>{c.icone}</span>
                  <span style={{ flex: 1, fontWeight: 600 }}>{c.nome}</span>
                  <span style={{ fontSize: 12, color: '#9ca3af' }}>{c.produtos?.length || 0} produtos</span>
                  <button onClick={() => deletarCategoria(c.id)} style={{ background: '#fee2e2', border: 'none', borderRadius: 8, padding: '4px 10px', color: '#dc2626', cursor: 'pointer', fontWeight: 700, fontSize: 12 }}>Excluir</button>
                </div>
              ))}
            </div>
          )}

          {/* ABA PRODUTOS */}
          {aba === 'produtos' && (
            <div>
              <div style={{ background: '#f9fafb', borderRadius: 14, padding: 16, marginBottom: 16 }}>
                <div style={{ fontWeight: 700, marginBottom: 12 }}>Novo produto</div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 8 }}>
                  <input placeholder="Nome *" value={novoProduto.nome} onChange={e => setNovoProduto(p => ({ ...p, nome: e.target.value }))} style={{ border: '1px solid #e5e7eb', borderRadius: 10, padding: '10px 12px', fontSize: 14, outline: 'none' }} />
                  <input placeholder="Preço *" type="number" step="0.01" value={novoProduto.preco} onChange={e => setNovoProduto(p => ({ ...p, preco: e.target.value }))} style={{ border: '1px solid #e5e7eb', borderRadius: 10, padding: '10px 12px', fontSize: 14, outline: 'none' }} />
                </div>
                <input placeholder="Descrição" value={novoProduto.descricao} onChange={e => setNovoProduto(p => ({ ...p, descricao: e.target.value }))} style={{ width: '100%', boxSizing: 'border-box', border: '1px solid #e5e7eb', borderRadius: 10, padding: '10px 12px', fontSize: 14, outline: 'none', marginBottom: 8 }} />
                <input placeholder="URL da imagem" value={novoProduto.imagem} onChange={e => setNovoProduto(p => ({ ...p, imagem: e.target.value }))} style={{ width: '100%', boxSizing: 'border-box', border: '1px solid #e5e7eb', borderRadius: 10, padding: '10px 12px', fontSize: 14, outline: 'none', marginBottom: 8 }} />
                <select value={novoProduto.categoriaId} onChange={e => setNovoProduto(p => ({ ...p, categoriaId: e.target.value }))} style={{ width: '100%', border: '1px solid #e5e7eb', borderRadius: 10, padding: '10px 12px', fontSize: 14, outline: 'none', marginBottom: 10, background: '#fff' }}>
                  <option value="">Selecione a categoria *</option>
                  {categorias.map(c => <option key={c.id} value={c.id}>{c.icone} {c.nome}</option>)}
                </select>
                <button onClick={criarProduto} disabled={loading} style={{ width: '100%', background: '#f59e0b', border: 'none', borderRadius: 10, padding: 10, color: '#fff', fontWeight: 700, cursor: 'pointer' }}>{loading ? 'Salvando...' : '+ Adicionar produto'}</button>
              </div>

              {produtos.map(p => (
                <div key={p.id} style={{ display: 'flex', gap: 10, padding: '10px 14px', background: p.disponivel ? '#fff' : '#fef2f2', borderRadius: 12, marginBottom: 8, boxShadow: '0 1px 4px rgba(0,0,0,0.06)', alignItems: 'center' }}>
                  {p.imagem ? <img src={p.imagem} alt={p.nome} style={{ width: 50, height: 50, borderRadius: 8, objectFit: 'cover', flexShrink: 0 }} /> : <div style={{ width: 50, height: 50, borderRadius: 8, background: '#f3f4f6', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22 }}>🍽️</div>}
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 700, fontSize: 14 }}>{p.nome}</div>
                    <div style={{ fontSize: 12, color: '#9ca3af' }}>{p._catNome}</div>
                    <div style={{ fontWeight: 800, color: '#f59e0b' }}>R$ {p.preco.toFixed(2)}</div>
                  </div>
                  <div style={{ display: 'flex', gap: 6 }}>
                    <button onClick={() => toggleDisponivel(p)} style={{ background: p.disponivel ? '#dcfce7' : '#fee2e2', border: 'none', borderRadius: 8, padding: '4px 8px', cursor: 'pointer', fontSize: 11, fontWeight: 700, color: p.disponivel ? '#166534' : '#dc2626' }}>{p.disponivel ? 'ON' : 'OFF'}</button>
                    <button onClick={() => deletarProduto(p.id)} style={{ background: '#fee2e2', border: 'none', borderRadius: 8, padding: '4px 8px', color: '#dc2626', cursor: 'pointer', fontWeight: 700, fontSize: 11 }}>Excluir</button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* ABA PEDIDOS */}
          {aba === 'pedidos' && (
            <div>
              <button onClick={carregarPedidos} style={{ marginBottom: 12, background: '#f3f4f6', border: 'none', borderRadius: 10, padding: '8px 14px', cursor: 'pointer', fontWeight: 700, fontSize: 13 }}>🔄 Atualizar</button>
              {pedidos.length === 0 && <div style={{ textAlign: 'center', color: '#9ca3af', marginTop: 40 }}>Nenhum pedido</div>}
              {pedidos.map(p => (
                <div key={p.id} style={{ background: '#fff', borderRadius: 14, padding: 14, marginBottom: 10, boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                    <span style={{ fontWeight: 800 }}>Pedido #{p.numero}</span>
                    <span style={{ fontSize: 12, fontWeight: 700, color: STATUS_PEDIDO[p.status], background: STATUS_PEDIDO[p.status] + '20', padding: '2px 8px', borderRadius: 99 }}>{p.status}</span>
                  </div>
                  <div style={{ fontSize: 13, color: '#374151', marginBottom: 4 }}>{p.nomeCliente}</div>
                  <div style={{ fontSize: 12, color: '#9ca3af', marginBottom: 8 }}>{p.itens.map(i => `${i.quantidade}× ${i.nome}`).join(', ')}</div>
                  {p.observacoes && <div style={{ fontSize: 12, color: '#6366f1', marginBottom: 8 }}>📝 {p.observacoes}</div>}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontWeight: 800, color: '#f59e0b' }}>R$ {p.total.toFixed(2)}</span>
                    {PROXIMOS_STATUS[p.status] && (
                      <button
                        onClick={() => atualizarStatusPedido(p.id, PROXIMOS_STATUS[p.status])}
                        style={{ background: STATUS_PEDIDO[PROXIMOS_STATUS[p.status]], border: 'none', borderRadius: 10, padding: '6px 14px', color: '#fff', fontWeight: 700, fontSize: 13, cursor: 'pointer' }}
                      >
                        → {PROXIMOS_STATUS[p.status]}
                      </button>
                    )}
                    {p.status === 'PENDENTE' && (
                      <button onClick={() => atualizarStatusPedido(p.id, 'CANCELADO')} style={{ background: '#fee2e2', border: 'none', borderRadius: 10, padding: '6px 12px', color: '#dc2626', fontWeight: 700, fontSize: 12, cursor: 'pointer', marginLeft: 6 }}>Cancelar</button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default function AdminRestaurantes() {
  const navigate = useNavigate()
  const [restaurantes, setRestaurantes] = useState([])
  const [loading, setLoading] = useState(true)
  const [modalNovo, setModalNovo] = useState(false)
  const [editando, setEditando] = useState(null)
  const [gerenciando, setGerenciando] = useState(null)

  const carregar = () => {
    setLoading(true)
    api.get('/admin/restaurantes').then(r => setRestaurantes(r.data.data || [])).catch(() => {}).finally(() => setLoading(false))
  }
  useEffect(carregar, [])

  const criarRestaurante = async (form) => {
    await api.post('/admin/restaurantes', form)
    setModalNovo(false)
    carregar()
  }

  const editarRestaurante = async (form) => {
    await api.put(`/admin/restaurantes/${editando.id}`, form)
    setEditando(null)
    carregar()
  }

  const toggleAtivo = async (r) => {
    await api.put(`/admin/restaurantes/${r.id}`, { ativa: !r.ativa }).catch(() => {})
    carregar()
  }

  return (
    <div style={{ minHeight: '100dvh', background: 'var(--dark)', color: '#fff', padding: 20 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
        <button onClick={() => navigate('/admin')} style={{ background: 'rgba(255,255,255,0.1)', border: 'none', borderRadius: 10, padding: '8px 14px', color: '#fff', cursor: 'pointer', fontWeight: 700 }}>← Voltar</button>
        <div style={{ fontSize: 20, fontWeight: 800 }}>🍔 Restaurantes</div>
        <button onClick={() => setModalNovo(true)} style={{ marginLeft: 'auto', background: '#f59e0b', border: 'none', borderRadius: 12, padding: '10px 18px', color: '#fff', fontWeight: 700, cursor: 'pointer' }}>+ Novo</button>
      </div>

      {loading && <div style={{ textAlign: 'center', marginTop: 60 }}><div className="spinner" style={{ margin: '0 auto' }} /></div>}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {restaurantes.map(r => (
          <div key={r.id} style={{ background: 'rgba(255,255,255,0.08)', borderRadius: 14, padding: '14px 16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
              {r.logo ? <img src={r.logo} alt={r.nome} style={{ width: 44, height: 44, borderRadius: 10, objectFit: 'cover' }} /> : <div style={{ width: 44, height: 44, borderRadius: 10, background: '#f59e0b', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22 }}>🍔</div>}
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 800, fontSize: 15 }}>{r.nome}</div>
                <div style={{ fontSize: 12, opacity: 0.6 }}>{r.categoria} · {r._count?.produtos || 0} produtos</div>
              </div>
              <span style={{ fontSize: 11, fontWeight: 700, padding: '3px 8px', borderRadius: 99, ...(r.ativa ? { background: '#dcfce7', color: '#166534' } : { background: '#fee2e2', color: '#dc2626' }) }}>{r.ativa ? 'ATIVO' : 'INATIVO'}</span>
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={() => setGerenciando(r)} style={{ flex: 1, background: '#f59e0b', border: 'none', borderRadius: 10, padding: '8px', color: '#fff', fontWeight: 700, cursor: 'pointer', fontSize: 13 }}>📋 Gerenciar</button>
              <button onClick={() => setEditando(r)} style={{ flex: 1, background: 'rgba(255,255,255,0.1)', border: 'none', borderRadius: 10, padding: '8px', color: '#fff', fontWeight: 700, cursor: 'pointer', fontSize: 13 }}>✏️ Editar</button>
              <button onClick={() => toggleAtivo(r)} style={{ flex: 1, background: r.ativa ? '#fee2e2' : '#dcfce7', border: 'none', borderRadius: 10, padding: '8px', color: r.ativa ? '#dc2626' : '#166534', fontWeight: 700, cursor: 'pointer', fontSize: 13 }}>{r.ativa ? 'Desativar' : 'Ativar'}</button>
            </div>
          </div>
        ))}
      </div>

      {modalNovo && <ModalRestaurante onSalvar={criarRestaurante} onFechar={() => setModalNovo(false)} />}
      {editando && <ModalRestaurante inicial={editando} onSalvar={editarRestaurante} onFechar={() => setEditando(null)} />}
      {gerenciando && <ModalCardapio restauranteId={gerenciando.id} restauranteNome={gerenciando.nome} onFechar={() => setGerenciando(null)} />}
    </div>
  )
}
