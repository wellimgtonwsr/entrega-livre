import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'

// Registra Service Worker para PWA
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/entrega-livre/sw.js', { scope: '/entrega-livre/' })
  })
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
)
