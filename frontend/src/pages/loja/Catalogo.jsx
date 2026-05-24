import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../../services/api'
import BottomNav from '../../components/BottomNav'

const GREEN = '#16a34a'
const GREEN_LIGHT = '#dcfce7'

const baseModal = {
  position: 'fixed', inset: 0, zIndex: 200,
  background: 'rgba(0,0,0,0.45)',
  display: 'flex', alignItems: 'flex-end', justifyContent: 'center',
}

const baseSheet = {
  background: '#fff', borderRadius: '20px 20px 0 0',
  padding: '24px 20px 40px', width: '100%', maxWidth: 480,
  boxShadow: '0 -4px 24px rgba(0,0,0,0.15)',
}

export default function LojaCatalogo() {
  const navigate = useNavigate()
  const [restaurante, setRestaurante] = useState(null)
  const [loading, setLoading] = useState(true)

  // modals
  const [catModal, setCatModal] = useState(null)   // null | { id?, nome, icone }
  const [prodModal, setProdModal] = useState(null)  // null | { id?, nome, preco, descricao, imagem, categoriaId, disponivel }
  const [saving, setSaving] = useState(false)
  const [erro, setErro] = useState('')

  async function carregar() {
    try {
      const { data } = await api.get('/loja/catalogo')
      setRestaurante(data.data)
    } catch {
      setErro('Não foi possível carregar o catálogo.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { carregar() }, [])

  // ── Categorias ───────────────────────────────────────────────────────────────

  function abrirNovaCat() {
    setCatModal({ nome: '', icone: '🍽️' })
  }

  function abrirEditCat(cat) {
    setCatModal({ id: cat.id, nome: cat.nome, icone: cat.icone || '🍽️' })
  }

  async function salvarCategoria() {
    if (!catModal.nome.trim()) return
    setSaving(true)
    try {
      if (catModal.id) {
        await api.put(`/loja/categorias/${catModal.id}`, { nome: catModal.nome, icone: catModal.icone })
      } else {
        await api.post('/loja/categorias', { nome: catModal.nome, icone: catModal.icone })
      }
      setCatModal(null)
      await carregar()
    } catch {
      setErro('Erro ao salvar categoria.')
    } finally {
      setSaving(false)
    }
  }

  async function deletarCategoria(catId) {
    if (!confirm('Deletar categoria e todos os seus produtos?')) return
    try {
      await api.delete(`/loja/categorias/${catId}`)
      await carregar()
    } catch {
      setErro('Erro ao deletar categoria.')
    }
  }

  // ── Produtos ─────────────────────────────────────────────────────────────────

  function abrirNovoProd(categoriaId) {
    setProdModal({ nome: '', preco: '', descricao: '', imagem: '', categoriaId, disponivel: true })
  }

  function abrirEditProd(prod) {
    setProdModal({
      id: prod.id,
      nome: prod.nome,
      preco: String(prod.preco),
      descricao: prod.descricao || '',
      imagem: prod.imagem || '',
      categoriaId: prod.categoriaId,
      disponivel: prod.disponivel,
    })
  }

  async function salvarProduto() {
    if (!prodModal.nome.trim() || !prodModal.preco) return
    setSaving(true)
    try {
      const payload = {
        nome: prodModal.nome,
        preco: parseFloat(prodModal.preco),
        descricao: prodModal.descricao || null,
        imagem: prodModal.imagem || null,
        categoriaId: prodModal.categoriaId,
        disponivel: prodModal.disponivel,
      }
      if (prodModal.id) {
        await api.put(`/loja/produtos/${prodModal.id}`, payload)
      } else {
        await api.post('/loja/produtos', payload)
      }
      setProdModal(null)
      await carregar()
    } catch {
      setErro('Erro ao salvar produto.')
    } finally {
      setSaving(false)
    }
  }

  async function toggleDisponivel(prod) {
    try {
      await api.put(`/loja/produtos/${prod.id}`, { disponivel: !prod.disponivel })
      await carregar()
    } catch {
      setErro('Erro ao atualizar disponibilidade.')
    }
  }

  async function deletarProduto(prodId) {
    if (!confirm('Deletar este produto?')) return
    try {
      await api.delete(`/loja/produtos/${prodId}`)
      await carregar()
    } catch {
      setErro('Erro ao deletar produto.')
    }
  }

  // ── Render ───────────────────────────────────────────────────────────────────

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100dvh' }}>
      Carregando catálogo...
    </div>
  )

  return (
    <div style={{ minHeight: '100dvh', background: '#f8fafb', paddingBottom: 80 }}>

      {/* Header */}
      <div style={{
        background: GREEN, padding: '16px 16px 18px',
        paddingTop: 'max(16px, env(safe-area-inset-top))',
        display: 'flex', alignItems: 'center', gap: 12,
      }}>
        <button
          onClick={() => navigate(-1)}
          style={{
            background: 'rgba(255,255,255,0.18)', border: 'none', borderRadius: 10,
            width: 36, height: 36, cursor: 'pointer', fontSize: 20, color: '#fff',
            display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
          }}
        >←</button>
        <div style={{ flex: 1 }}>
          <h1 style={{ margin: 0, color: '#fff', fontSize: 18, fontWeight: 700 }}>Catálogo</h1>
          <p style={{ margin: 0, color: 'rgba(255,255,255,0.8)', fontSize: 13 }}>
            {restaurante?.nome || 'Minha loja'}
          </p>
        </div>
        <button
          onClick={abrirNovaCat}
          style={{
            background: '#fff', color: GREEN, border: 'none', borderRadius: 10,
            padding: '8px 14px', fontWeight: 700, fontSize: 13, cursor: 'pointer',
          }}
        >+ Categoria</button>
      </div>

      {/* Erro global */}
      {erro && (
        <div style={{
          margin: '12px 16px', background: '#fee2e2', border: '1px solid #fca5a5',
          borderRadius: 10, padding: '10px 14px', color: '#991b1b', fontSize: 14,
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        }}>
          {erro}
          <button onClick={() => setErro('')} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 18, color: '#991b1b' }}>×</button>
        </div>
      )}

      {/* Categorias */}
      <div style={{ padding: '16px 16px 0' }}>
        {(!restaurante?.categorias || restaurante.categorias.length === 0) && (
          <div style={{
            background: '#fff', borderRadius: 14, padding: 32, textAlign: 'center',
            border: '2px dashed #d1fae5', marginBottom: 16,
          }}>
            <div style={{ fontSize: 48, marginBottom: 12 }}>📦</div>
            <p style={{ color: '#6b7280', margin: 0 }}>Nenhuma categoria ainda.<br />Crie uma para começar.</p>
          </div>
        )}

        {restaurante?.categorias?.map(cat => (
          <div key={cat.id} style={{ background: '#fff', borderRadius: 14, marginBottom: 16, overflow: 'hidden', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>

            {/* Cabeçalho da categoria */}
            <div style={{
              background: GREEN_LIGHT, padding: '12px 14px',
              display: 'flex', alignItems: 'center', gap: 8,
            }}>
              <span style={{ fontSize: 22 }}>{cat.icone || '🍽️'}</span>
              <span style={{ flex: 1, fontWeight: 700, color: '#14532d', fontSize: 15 }}>{cat.nome}</span>
              <span style={{ color: '#6b7280', fontSize: 12, marginRight: 8 }}>{cat.produtos.length} produto(s)</span>
              <button
                onClick={() => abrirEditCat(cat)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 18, padding: '2px 6px' }}
                title="Editar categoria"
              >✏️</button>
              <button
                onClick={() => deletarCategoria(cat.id)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 18, padding: '2px 6px' }}
                title="Deletar categoria"
              >🗑️</button>
            </div>

            {/* Produtos */}
            {cat.produtos.map(prod => (
              <div key={prod.id} style={{
                padding: '12px 14px',
                borderBottom: '1px solid #f1f5f9',
                display: 'flex', alignItems: 'center', gap: 10,
                opacity: prod.disponivel ? 1 : 0.5,
              }}>
                {prod.imagem && (
                  <img
                    src={prod.imagem} alt={prod.nome}
                    style={{ width: 48, height: 48, borderRadius: 8, objectFit: 'cover', flexShrink: 0 }}
                    onError={e => { e.target.style.display = 'none' }}
                  />
                )}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 600, color: '#1e293b', fontSize: 14, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {prod.nome}
                  </div>
                  {prod.descricao && (
                    <div style={{ color: '#6b7280', fontSize: 12, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {prod.descricao}
                    </div>
                  )}
                  <div style={{ color: GREEN, fontWeight: 700, fontSize: 14, marginTop: 2 }}>
                    R$ {Number(prod.preco).toFixed(2).replace('.', ',')}
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  {/* Toggle disponível */}
                  <button
                    onClick={() => toggleDisponivel(prod)}
                    title={prod.disponivel ? 'Desativar' : 'Ativar'}
                    style={{
                      background: prod.disponivel ? '#d1fae5' : '#f1f5f9',
                      border: 'none', borderRadius: 20, padding: '4px 10px',
                      cursor: 'pointer', fontSize: 11, fontWeight: 600,
                      color: prod.disponivel ? '#15803d' : '#9ca3af',
                    }}
                  >{prod.disponivel ? 'Ativo' : 'Inativo'}</button>
                  <button
                    onClick={() => abrirEditProd(prod)}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 18 }}
                    title="Editar produto"
                  >✏️</button>
                  <button
                    onClick={() => deletarProduto(prod.id)}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 18 }}
                    title="Deletar produto"
                  >🗑️</button>
                </div>
              </div>
            ))}

            {/* Botão adicionar produto */}
            <button
              onClick={() => abrirNovoProd(cat.id)}
              style={{
                display: 'block', width: '100%', background: 'none', border: 'none',
                padding: '12px 14px', cursor: 'pointer', color: GREEN,
                fontWeight: 600, fontSize: 14, textAlign: 'left',
              }}
            >+ Adicionar produto</button>
          </div>
        ))}
      </div>

      {/* Modal: Categoria */}
      {catModal && (
        <div style={baseModal} onClick={e => { if (e.target === e.currentTarget) setCatModal(null) }}>
          <div style={baseSheet}>
            <h2 style={{ margin: '0 0 20px', fontSize: 18, color: '#1e293b' }}>
              {catModal.id ? 'Editar Categoria' : 'Nova Categoria'}
            </h2>
            <label style={{ display: 'block', marginBottom: 12 }}>
              <span style={{ fontSize: 13, color: '#374151', fontWeight: 600 }}>Ícone (emoji)</span>
              <input
                value={catModal.icone}
                onChange={e => setCatModal(p => ({ ...p, icone: e.target.value }))}
                maxLength={4}
                style={{
                  display: 'block', width: '100%', marginTop: 6, padding: '10px 12px',
                  border: '1.5px solid #e2e8f0', borderRadius: 10, fontSize: 22,
                  boxSizing: 'border-box',
                }}
              />
            </label>
            <label style={{ display: 'block', marginBottom: 20 }}>
              <span style={{ fontSize: 13, color: '#374151', fontWeight: 600 }}>Nome *</span>
              <input
                value={catModal.nome}
                onChange={e => setCatModal(p => ({ ...p, nome: e.target.value }))}
                placeholder="Ex: Lanches, Bebidas..."
                style={{
                  display: 'block', width: '100%', marginTop: 6, padding: '10px 12px',
                  border: '1.5px solid #e2e8f0', borderRadius: 10, fontSize: 15,
                  boxSizing: 'border-box',
                }}
              />
            </label>
            <div style={{ display: 'flex', gap: 10 }}>
              <button
                onClick={() => setCatModal(null)}
                style={{
                  flex: 1, padding: '12px', border: '1.5px solid #e2e8f0', borderRadius: 12,
                  background: '#fff', cursor: 'pointer', fontWeight: 600, fontSize: 14, color: '#6b7280',
                }}
              >Cancelar</button>
              <button
                onClick={salvarCategoria}
                disabled={saving || !catModal.nome.trim()}
                style={{
                  flex: 2, padding: '12px', border: 'none', borderRadius: 12,
                  background: GREEN, color: '#fff', cursor: saving ? 'not-allowed' : 'pointer',
                  fontWeight: 700, fontSize: 15, opacity: saving ? 0.7 : 1,
                }}
              >{saving ? 'Salvando...' : 'Salvar'}</button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Produto */}
      {prodModal && (
        <div style={baseModal} onClick={e => { if (e.target === e.currentTarget) setProdModal(null) }}>
          <div style={{ ...baseSheet, maxHeight: '90dvh', overflowY: 'auto' }}>
            <h2 style={{ margin: '0 0 20px', fontSize: 18, color: '#1e293b' }}>
              {prodModal.id ? 'Editar Produto' : 'Novo Produto'}
            </h2>

            {[
              { label: 'Nome *', key: 'nome', placeholder: 'Ex: X-Burguer' },
              { label: 'Preço (R$) *', key: 'preco', placeholder: '0.00', type: 'number' },
              { label: 'Descrição', key: 'descricao', placeholder: 'Ingredientes, detalhes...' },
              { label: 'URL da Imagem', key: 'imagem', placeholder: 'https://...' },
            ].map(f => (
              <label key={f.key} style={{ display: 'block', marginBottom: 14 }}>
                <span style={{ fontSize: 13, color: '#374151', fontWeight: 600 }}>{f.label}</span>
                <input
                  type={f.type || 'text'}
                  value={prodModal[f.key]}
                  onChange={e => setProdModal(p => ({ ...p, [f.key]: e.target.value }))}
                  placeholder={f.placeholder}
                  style={{
                    display: 'block', width: '100%', marginTop: 6, padding: '10px 12px',
                    border: '1.5px solid #e2e8f0', borderRadius: 10, fontSize: 15,
                    boxSizing: 'border-box',
                  }}
                />
              </label>
            ))}

            {/* Toggle disponível */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
              <span style={{ fontSize: 13, color: '#374151', fontWeight: 600 }}>Disponível no cardápio</span>
              <button
                onClick={() => setProdModal(p => ({ ...p, disponivel: !p.disponivel }))}
                style={{
                  background: prodModal.disponivel ? GREEN : '#e2e8f0',
                  border: 'none', borderRadius: 20, width: 44, height: 24,
                  cursor: 'pointer', position: 'relative', transition: 'background 0.2s',
                }}
              >
                <span style={{
                  position: 'absolute', top: 3, left: prodModal.disponivel ? 22 : 3,
                  width: 18, height: 18, borderRadius: '50%', background: '#fff',
                  transition: 'left 0.2s', boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
                }} />
              </button>
              <span style={{ fontSize: 13, color: '#6b7280' }}>{prodModal.disponivel ? 'Sim' : 'Não'}</span>
            </div>

            <div style={{ display: 'flex', gap: 10 }}>
              <button
                onClick={() => setProdModal(null)}
                style={{
                  flex: 1, padding: '12px', border: '1.5px solid #e2e8f0', borderRadius: 12,
                  background: '#fff', cursor: 'pointer', fontWeight: 600, fontSize: 14, color: '#6b7280',
                }}
              >Cancelar</button>
              <button
                onClick={salvarProduto}
                disabled={saving || !prodModal.nome.trim() || !prodModal.preco}
                style={{
                  flex: 2, padding: '12px', border: 'none', borderRadius: 12,
                  background: GREEN, color: '#fff', cursor: saving ? 'not-allowed' : 'pointer',
                  fontWeight: 700, fontSize: 15, opacity: saving ? 0.7 : 1,
                }}
              >{saving ? 'Salvando...' : 'Salvar'}</button>
            </div>
          </div>
        </div>
      )}

      <BottomNav role="LOJA" />
    </div>
  )
}
