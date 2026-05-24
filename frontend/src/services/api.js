import axios from 'axios'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3000/api',
  timeout: 15000, // 15s — tolerante a conexões lentas
})

// Retry automático em falhas de rede (não em erros 4xx/5xx do servidor)
const MAX_RETRIES = 3
api.interceptors.response.use(
  (res) => res,
  async (error) => {
    const config = error.config
    if (!config) return Promise.reject(error)

    // Só retentar em erros de rede ou timeout (sem resposta do servidor)
    const isNetworkError = !error.response
    const retryCount = config.__retryCount ?? 0

    if (isNetworkError && retryCount < MAX_RETRIES) {
      config.__retryCount = retryCount + 1
      // Backoff exponencial: 1s, 2s, 4s
      const delay = 1000 * 2 ** retryCount
      await new Promise((resolve) => setTimeout(resolve, delay))
      return api(config)
    }

    return Promise.reject(error)
  }
)

export default api
