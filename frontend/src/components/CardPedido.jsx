export default function CardPedido({ pedido, onClick }) {
  return (
    <div className="card" style={{ cursor: 'pointer', marginBottom: 10, padding: '14px 16px' }} onClick={onClick}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 3, marginBottom: 8 }}>
        <div style={{ fontSize: 13, color: 'var(--text2)' }}>
          📍 <span style={{ fontWeight: 500 }}>{pedido.origemEndereco}</span>
        </div>
        <div style={{ fontSize: 13, color: 'var(--text2)' }}>
          🏁 <span style={{ fontWeight: 500 }}>{pedido.destinoEndereco}</span>
        </div>
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ fontSize: 20, fontWeight: 800, color: 'var(--success)' }}>
          R$ {pedido.valorProposto?.toFixed(2)}
        </div>
        <div style={{ display: 'flex', gap: 6 }}>
          <span className="badge">{pedido.distanciaKm?.toFixed(1)} km</span>
          <span className="badge">{pedido.tempoEstimadoMin} min</span>
        </div>
      </div>
      {pedido.distanciaAteOrigem !== undefined && (
        <div style={{ fontSize: 12, color: 'var(--text3)', marginTop: 6 }}>
          📡 Você está a {pedido.distanciaAteOrigem.toFixed(1)} km da coleta
        </div>
      )}
    </div>
  )
}
