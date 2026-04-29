import { useState, useEffect, useRef } from 'react'
import { useAuth } from '../context/AuthContext'
import { useSocket } from '../context/SocketContext'


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
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'flex-end', justifyContent: 'center', zIndex: 1200 }} onClick={onClose}>
      <div style={{ width: '100%', maxWidth: 460, height: '72dvh', background: 'var(--card)', borderRadius: '18px 18px 0 0', display: 'flex', flexDirection: 'column' }} onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div style={{ padding: '14px 16px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ fontWeight: 700, color: 'var(--text)' }}>Chat da corrida</div>
          <button onClick={onClose} style={{ border: 'none', background: 'none', fontSize: 22, cursor: 'pointer', color: 'var(--text3)', lineHeight: 1 }}>×</button>
        </div>

        {/* Messages */}
        <div style={{ flex: 1, overflowY: 'auto', padding: 12, background: 'var(--bg)' }}>
          {msgs.map(m => {
            const meu = m.senderId === user.id
            return (
              <div key={m.id || `${m.createdAt}-${m.texto}`} style={{ marginBottom: 8, display: 'flex', justifyContent: meu ? 'flex-end' : 'flex-start' }}>
                <div style={{
                  maxWidth: '75%', padding: '8px 12px', borderRadius: 14, fontSize: 14,
                  background: meu ? 'var(--dark)' : 'var(--card)',
                  color: meu ? '#fff' : 'var(--text)',
                  border: meu ? 'none' : '1px solid var(--border)',
                }}>
                  {m.texto}
                </div>
              </div>
            )
          })}
          <div ref={endRef} />
        </div>

        {/* Input */}
        <div style={{ display: 'flex', gap: 8, padding: 12, borderTop: '1px solid var(--border)' }}>
          <input
            className="inp"
            style={{ flex: 1 }}
            value={texto}
            onChange={e => setTexto(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && enviar()}
            placeholder="Digite uma mensagem..."
          />
          <button className="btn btn-primary" onClick={enviar}>Enviar</button>
        </div>
      </div>
    </div>
  )
}
