const getStatus = (status) => {
  const map = {
    ACTIVE:    { text: 'Ativa',     color: 'var(--success)', bg: '#dcfce7', badgeClass: 'badge badge-success' },
    PENDING:   { text: 'Pendente',  color: 'var(--brand)',   bg: 'var(--brand-light)', badgeClass: 'badge badge-warn' },
    EXPIRED:   { text: 'Expirada',  color: 'var(--error)',   bg: '#fee2e2', badgeClass: 'badge badge-error' },
    CANCELLED: { text: 'Cancelada', color: 'var(--error)',   bg: '#fee2e2', badgeClass: 'badge badge-error' },
  }
  return map[status] || { text: 'Sem assinatura', color: 'var(--text3)', bg: 'var(--border)', badgeClass: 'badge' }
}

export default function StatusAssinatura({ assinatura, compact = false, onCancelar }) {
  const st = getStatus(assinatura?.status)

  if (compact) {
    return (
      <span className={st.badgeClass} style={{ fontSize: 11 }}>
        {st.text}
      </span>
    )
  }

  return (
    <div className="card" style={{ background: st.bg, border: `1.5px solid ${st.color}22`, marginBottom: 14 }}>
      <div style={{ color: st.color, fontWeight: 700, fontSize: 15, marginBottom: 4 }}>
        Status: {st.text}
      </div>
      {assinatura?.plano && (
        <div style={{ fontSize: 13, color: 'var(--text2)' }}>
          Plano {assinatura.plano.name} · R$ {assinatura.plano.price?.toFixed(2)}/mês
        </div>
      )}
      {assinatura?.endDate && (
        <div style={{ fontSize: 13, color: 'var(--text2)', marginTop: 2 }}>
          Válida até {new Date(assinatura.endDate).toLocaleDateString('pt-BR')}
        </div>
      )}
      {assinatura?.status === 'ACTIVE' && onCancelar && (
        <button onClick={onCancelar} className="btn btn-danger btn-sm" style={{ marginTop: 12 }}>
          Cancelar assinatura
        </button>
      )}
    </div>
  )
}
