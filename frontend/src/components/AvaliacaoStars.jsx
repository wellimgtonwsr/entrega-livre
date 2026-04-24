const s = {
  wrap: { display: 'flex', justifyContent: 'center', gap: 8 },
  star: { fontSize: 34, cursor: 'pointer', transition: 'transform 0.1s' },
}

export default function AvaliacaoStars({ value = 5, onChange }) {
  return (
    <div style={s.wrap}>
      {[1, 2, 3, 4, 5].map(n => (
        <span
          key={n}
          onClick={() => onChange?.(n)}
          style={{ ...s.star, color: n <= value ? '#f59e0b' : '#d1d5db' }}
        >
          ★
        </span>
      ))}
    </div>
  )
}
