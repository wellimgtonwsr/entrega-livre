const s = {
  card: { background: '#fff', borderRadius: 14, padding: 14, marginBottom: 10, boxShadow: '0 2px 8px rgba(0,0,0,0.05)' },
  row: { display: 'flex', alignItems: 'center', gap: 10 },
  avatar: { width: 44, height: 44, borderRadius: '50%', objectFit: 'cover', background: '#eee' },
  nome: { fontWeight: 700, fontSize: 15, color: '#1a1a2e' },
  stars: { color: '#f59e0b', fontSize: 12 },
  vehicle: { color: '#888', fontSize: 12 },
  valor: { marginLeft: 'auto', fontSize: 22, fontWeight: 800, color: '#10b981' },
  btn: { width: '100%', marginTop: 10, padding: 12, borderRadius: 12, border: 'none', background: '#1a1a2e', color: '#fff', cursor: 'pointer', fontWeight: 700 },
}

export default function CardProposta({ proposta, onAceitar, disabled }) {
  const m = proposta.motoboy
  const nome = m?.user?.name || 'Motoboy'

  return (
    <div style={s.card}>
      <div style={s.row}>
        <img style={s.avatar} src={m?.user?.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(nome)}&background=1a1a2e&color=fff`} alt={nome} />
        <div>
          <div style={s.nome}>{nome}</div>
          <div style={s.stars}>{'⭐'.repeat(Math.round(m?.user?.rating || 5))} {m?.user?.rating?.toFixed?.(1) || '5.0'}</div>
          <div style={s.vehicle}>{m?.vehicle} • {m?.plate}</div>
        </div>
        <div style={s.valor}>R$ {proposta.valor?.toFixed(2)}</div>
      </div>
      <button style={s.btn} onClick={onAceitar} disabled={disabled}>Escolher este</button>
    </div>
  )
}
