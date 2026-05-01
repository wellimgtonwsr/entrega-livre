import { useState, useEffect, useRef } from 'react'
import { useAuth } from '../context/AuthContext'
import { useSocket } from '../context/SocketContext'

/**
 * Chat genérico via Socket.IO.
 *
 * Props:
 *  pedidoId       — atalho: usa eventos padrão (chat:enviar / chat:receber / pedido:join)
 *  corridaId      — atalho: usa eventos de corrida (corrida:chat:enviar / corrida:chat:receber)
 *  lojaId         — atalho: usa eventos de loja (loja:chat:enviar / loja:chat:receber via pedido_loja:join)
 *  title          — título exibido no cabeçalho
 *  onClose        — callback ao fechar
 *
 * Os três modos são mutuamente exclusivos. pedidoId tem prioridade, depois corridaId, depois lojaId.
 */
export default function Chat({ pedidoId, corridaId, lojaId, title, onClose }) {
  const { user } = useAuth()
  const { socket } = useSocket()
  const [msgs, setMsgs] = useState([])
  const [texto, setTexto] = useState('')
  const endRef = useRef(null)

  // Resolver modo
  const modo = pedidoId ? 'pedido' : corridaId ? 'corrida' : 'loja'
  const sendEvent   = modo === 'pedido'  ? 'chat:enviar'         : modo === 'corrida' ? 'corrida:chat:enviar' : 'loja:chat:enviar'
  const receiveEvent= modo === 'pedido'  ? 'chat:receber'        : modo === 'corrida' ? 'corrida:chat:receber': 'loja:chat:receber'
  const joinEvent   = modo === 'pedido'  ? 'pedido:join'         : modo === 'corrida' ? 'corrida:chat:join'   : 'pedido_loja:join'
  const joinPayload = modo === 'pedido'  ? { pedidoId }          : modo === 'corrida' ? { corridaId }         : { pedidoId: lojaId }
  const filterKey   = modo === 'corrida' ? 'corridaId'           : 'pedidoId'
  const filterId    = modo === 'pedido'  ? pedidoId              : modo === 'corrida' ? corridaId             : lojaId
  const headerTitle = title || (modo === 'pedido' ? 'Chat com o Cliente' : modo === 'corrida' ? 'Chat com o Passageiro' : 'Chat com a Loja')

  useEffect(() => {
    if (!socket) return
    socket.emit(joinEvent, joinPayload)

    const onMsg = (msg) => {
      if (msg[filterKey] === filterId) setMsgs(prev => [...prev, msg])
    }
    socket.on(receiveEvent, onMsg)
    return () => socket.off(receiveEvent, onMsg)
  }, [socket, filterId]) // eslint-disable-line

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [msgs])

  const enviar = () => {
    const t = texto.trim()
    if (!t || !socket) return
    const payload = { texto: t, senderId: user.id, [filterKey]: filterId }
    socket.emit(sendEvent, payload)
    // Otimismo local
    setMsgs(prev => [...prev, { ...payload, id: Date.now(), createdAt: new Date() }])
    setTexto('')
  }

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.55)', display: 'flex', alignItems: 'flex-end', justifyContent: 'center', zIndex: 1200 }} onClick={onClose}>
      <div style={{ width: '100%', maxWidth: 460, height: '72dvh', background: 'var(--card)', borderRadius: '18px 18px 0 0', display: 'flex', flexDirection: 'column' }} onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div style={{ padding: '14px 16px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ fontWeight: 700, color: 'var(--text)', fontSize: 15 }}>💬 {headerTitle}</div>
          <button onClick={onClose} style={{ border: 'none', background: 'none', fontSize: 22, cursor: 'pointer', color: 'var(--text3)', lineHeight: 1 }}>×</button>
        </div>

        {/* Messages */}
        <div style={{ flex: 1, overflowY: 'auto', padding: 12, background: 'var(--bg)' }}>
          {msgs.length === 0 && (
            <div style={{ textAlign: 'center', color: 'var(--text3)', fontSize: 13, marginTop: 24 }}>Nenhuma mensagem ainda</div>
          )}
          {msgs.map((m, i) => {
            const meu = m.senderId === user.id
            return (
              <div key={m.id || i} style={{ marginBottom: 8, display: 'flex', justifyContent: meu ? 'flex-end' : 'flex-start' }}>
                <div style={{
                  maxWidth: '75%', padding: '8px 12px', borderRadius: 14, fontSize: 14,
                  background: meu ? 'var(--dark)' : 'var(--card)',
                  color: meu ? '#fff' : 'var(--text)',
                  border: meu ? 'none' : '1px solid var(--border)',
                }}>
                  {m.sender?.name && !meu && (
                    <div style={{ fontSize: 11, fontWeight: 700, marginBottom: 3, opacity: 0.7 }}>{m.sender.name}</div>
                  )}
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
            autoFocus
          />
          <button className="btn btn-primary" onClick={enviar}>Enviar</button>
        </div>
      </div>
    </div>
  )
}
