const getStatus = (status) => {
  const map = {
    ACTIVE: { text: 'Ativa', color: '#10b981', bg: '#dcfce7' },
    PENDING: { text: 'Pendente', color: '#f59e0b', bg: '#fef3c7' },
    EXPIRED: { text: 'Expirada', color: '#ef4444', bg: '#fee2e2' },
    CANCELLED: { text: 'Cancelada', color: '#ef4444', bg: '#fee2e2' },
  }
  return map[status] || { text: 'Sem assinatura', color: '#6b7280', bg: '#f3f4f6' }
}

export default function StatusAssinatura({ assinatura, compact = false, onCancelar }) {
  const st = getStatus(assinatura?.status)

  if (compact) {
    return (
      <span style={{ background: st.bg, color: st.color, padding: '4px 10px', borderRadius: 20, fontSize: 12, fontWeight: 700 }}>
        {st.text}
      </span>
    )
  }

  return (
    <div style={{ background: st.bg, borderRadius: 14, padding: 14, marginBottom: 14 }}>
      <div style={{ color: st.color, fontWeight: 700, fontSize: 15 }}>Status: {st.text}</div>
      {assinatura?.plano && (
        <div style={{ fontSize: 13, color: '#666', marginTop: 4 }}>
          Plano {assinatura.plano.name} • R$ {assinatura.plano.price?.toFixed(2)}/mês
        </div>
      )}
      {assinatura?.endDate && (
        <div style={{ fontSize: 13, color: '#666', marginTop: 2 }}>
          Válida até {new Date(assinatura.endDate).toLocaleDateString('pt-BR')}
        </div>
      )}
      {assinatura?.status === 'ACTIVE' && onCancelar && (
        <button onClick={onCancelar} style={{ marginTop: 10, padding: '8px 12px', borderRadius: 10, border: 'none', background: '#fee2e2', color: '#dc2626', cursor: 'pointer', fontWeight: 700, fontSize: 12 }}>
          Cancelar assinatura
        </button>
      )}
    </div>
  )
}
