import { useEffect, useState } from 'react'

export default function OfflineBanner() {
  const [offline, setOffline] = useState(!navigator.onLine)

  useEffect(() => {
    const goOffline = () => setOffline(true)
    const goOnline = () => setOffline(false)
    window.addEventListener('offline', goOffline)
    window.addEventListener('online', goOnline)
    return () => {
      window.removeEventListener('offline', goOffline)
      window.removeEventListener('online', goOnline)
    }
  }, [])

  if (!offline) return null

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      zIndex: 9999,
      backgroundColor: '#1f2937',
      color: '#f9fafb',
      textAlign: 'center',
      padding: '10px 16px',
      fontSize: 14,
      fontWeight: 500,
      letterSpacing: 0.2,
    }}>
      📵 Sem conexão — verifique sua internet
    </div>
  )
}
