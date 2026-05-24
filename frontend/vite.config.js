import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig(() => {
  const platform = process.env.VITE_PLATFORM || 'web'
  // web → GitHub Pages  |  capacitor → serve local  |  electron → relative
  const base = platform === 'electron' ? './' : platform === 'capacitor' ? '/' : '/entrega-livre/'

  return {
    plugins: [react()],
    base,
    build: {
      outDir: 'dist',
      // Alertar ao passar de 500 kB por chunk (ajuda a detectar dependências pesadas)
      chunkSizeWarningLimit: 500,
      rollupOptions: {
        output: {
          manualChunks: {
            // React core — carregado uma vez e cacheado pelo browser
            'vendor-react': ['react', 'react-dom', 'react-router-dom'],
            // Socket.IO — separado para não atrasar o boot
            'vendor-socket': ['socket.io-client'],
            // Google Maps — só carrega em páginas que usam mapa
            'vendor-maps': ['@react-google-maps/api'],
          },
        },
      },
    },
    define: {
      'import.meta.env.VITE_PLATFORM': JSON.stringify(platform),
    },
  }
})
