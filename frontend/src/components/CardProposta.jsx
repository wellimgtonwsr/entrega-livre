export default function CardProposta({ proposta, onAceitar, disabled }) {
  const m = proposta.motoboy
  const nome = m?.user?.name || 'Motoboy'

  return (
    <div className="card" style={{ marginBottom: 10 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <img
          style={{ width: 46, height: 46, borderRadius: '50%', objectFit: 'cover', background: 'var(--border)', flexShrink: 0 }}
          src={m?.user?.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(nome)}&background=1a253e&color=fff`}
          alt={nome}
        />
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: 700, fontSize: 15, color: 'var(--text)' }}>{nome}</div>
          <div style={{ color: 'var(--brand)', fontSize: 12 }}>{'\u2b50'.repeat(Math.round(m?.user?.rating || 5))} {m?.user?.rating?.toFixed?.(1) || '5.0'}</div>
          <div style={{ color: 'var(--text3)', fontSize: 12 }}>{m?.vehicle} \u2022 {m?.plate}</div>
        </div>
        <div style={{ fontSize: 22, fontWeight: 800, color: 'var(--success)' }}>R$ {proposta.valor?.toFixed(2)}</div>
      </div>
      <button className="btn btn-primary" style={{ width: '100%', marginTop: 12 }} onClick={onAceitar} disabled={disabled}>
        Escolher este
      </button>
    </div>
  )
}
