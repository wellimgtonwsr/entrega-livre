const s = {
  card: { background: '#fff', borderRadius: 14, padding: 14, marginBottom: 10, boxShadow: '0 2px 8px rgba(0,0,0,0.05)', cursor: 'pointer' },
  route: { color: '#444', fontSize: 13, marginBottom: 4 },
  row: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 8 },
  valor: { fontSize: 20, fontWeight: 800, color: '#10b981' },
  meta: { color: '#888', fontSize: 12 },
}

export default function CardPedido({ pedido, onClick }) {
  return (
    <div style={s.card} onClick={onClick}>
      <div style={s.route}>📍 {pedido.origemEndereco}</div>
      <div style={s.route}>🏁 {pedido.destinoEndereco}</div>
      <div style={s.row}>
        <div style={s.valor}>R$ {pedido.valorProposto?.toFixed(2)}</div>
        <div style={s.meta}>{pedido.distanciaKm?.toFixed(1)} km • {pedido.tempoEstimadoMin} min</div>
      </div>
      {pedido.distanciaAteOrigem !== undefined && (
        <div style={{ ...s.meta, marginTop: 4 }}>Você está a {pedido.distanciaAteOrigem.toFixed(1)} km da coleta</div>
      )}
    </div>
  )
}
