import { useState, useEffect, useRef } from 'react'
import { useAuth } from '../context/AuthContext'
import { useSocket } from '../context/SocketContext'

const s = {
  overlay: { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'flex-end', justifyContent: 'center', zIndex: 1200 },
  box: { width: '100%', maxWidth: 460, height: '72dvh', background: '#fff', borderRadius: '18px 18px 0 0', display: 'flex', flexDirection: 'column' },
  head: { padding: '14px 16px', borderBottom: '1px solid #eee', display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  msgs: { flex: 1, overflowY: 'auto', padding: 12, background: '#f8fafc' },
  row: { marginBottom: 8, display: 'flex' },
  bubble: { maxWidth: '75%', padding: '8px 12px', borderRadius: 14, fontSize: 14 },
  inputWrap: { display: 'flex', gap: 8, padding: 12, borderTop: '1px solid #eee' },
  input: { flex: 1, padding: '10px 12px', borderRadius: 10, border: '2px solid #e5e5e5', outline: 'none' },
  btn: { padding: '10px 14px', borderRadius: 10, border: 'none', background: '#1a1a2e', color: '#fff', cursor: 'pointer' },
}

export default function Chat({ pedidoId, onClose }) {
  const { user } = useAuth()
  const { socket } = useSocket()
  const [msgs, setMsgs] = useState([])
  const [texto, setTexto] = useState('')
  const endRef = useRef(null)

  useEffect(() => {
    if (!socket) return
    socket.emit('pedido:join', { pedidoId })

    const onMsg = (msg) => {
      if (msg.pedidoId === pedidoId) setMsgs(prev => [...prev, msg])
    }
    socket.on('chat:receber', onMsg)
    return () => socket.off('chat:receber', onMsg)
  }, [socket, pedidoId])

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [msgs])

  const enviar = () => {
    const t = texto.trim()
    if (!t || !socket) return
    socket.emit('chat:enviar', { pedidoId, texto: t, senderId: user.id })
    setTexto('')
  }

  return (
    <div style={s.overlay} onClick={onClose}>
      <div style={s.box} onClick={e => e.stopPropagation()}>
        <div style={s.head}>
          <div style={{ fontWeight: 700 }}>Chat da corrida</div>
          <button onClick={onClose} style={{ border: 'none', background: 'none', fontSize: 20, cursor: 'pointer' }}>×</button>
        </div>
        <div style={s.msgs}>
          {msgs.map(m => {
            const meu = m.senderId === user.id
            return (
              <div key={m.id || `${m.createdAt}-${m.texto}`} style={{ ...s.row, justifyContent: meu ? 'flex-end' : 'flex-start' }}>
                <div style={{ ...s.bubble, background: meu ? '#1a1a2e' : '#fff', color: meu ? '#fff' : '#111', border: meu ? 'none' : '1px solid #e5e7eb' }}>
                  {m.texto}
                </div>
              </div>
            )
          })}
          <div ref={endRef} />
        </div>
        <div style={s.inputWrap}>
          <input
            style={s.input}
            value={texto}
            onChange={e => setTexto(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && enviar()}
            placeholder="Digite uma mensagem..."
          />
          <button style={s.btn} onClick={enviar}>Enviar</button>
        </div>
      </div>
    </div>
  )
}
