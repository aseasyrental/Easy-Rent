import axios from 'axios'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api'

const apiClient = axios.create({
  baseURL: API_URL,
  timeout: 10000,
})

// Request interceptor
apiClient.interceptors.request.use(
  config => {
    const token = localStorage.getItem('token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  error => Promise.reject(error)
)

// Response interceptor — surgical token clearing.
// Only wipe the token when the auth endpoint itself rejects it.
// Other 401s (e.g. transient middleware issues) should not silently
// log Bill out — the UI will surface the error instead.
apiClient.interceptors.response.use(
  response => response,
  error => {
    const status = error.response?.status
    const config = error.config
    const message = error.response?.data?.message

    if (status === 401) {
      const isAuthMe = config?.url === '/auth/me'
      const isInvalidToken = message === 'Invalid token'

      if (isAuthMe || isInvalidToken) {
        localStorage.removeItem('token')
      } else {
        // Log for diagnostics — Bill shouldn't lose his session
        // because a non-auth endpoint returned 401.
        console.warn('[api] 401 intercepted but token NOT cleared:', {
          url: config?.url,
          method: config?.method,
          message,
        })
      }
    }
    return Promise.reject(error)
  }
)

export default apiClient
