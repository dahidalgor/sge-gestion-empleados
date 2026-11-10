import axios from 'axios'

/** Cliente HTTP para consumir el API REST de NestJS */
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? 'http://localhost:3000/api',
  timeout: 10000,
})

/**
 * Se configura desde main.js para evitar dependencias circulares:
 * - getToken: devuelve el JWT actual
 * - onNoAutorizado: se ejecuta cuando el backend responde 401
 */
export function configurarInterceptores({ getToken, onNoAutorizado }) {
  // 1) Antes de cada petición se adjunta el JWT en el encabezado Authorization
  api.interceptors.request.use((config) => {
    const token = getToken()
    if (token) config.headers.Authorization = `Bearer ${token}`
    return config
  })

  // 2) Si el backend rechaza el token (401), se cierra la sesión
  api.interceptors.response.use(
    (res) => res,
    (error) => {
      const esLogin = error.config?.url?.includes('/auth/login')
      if (error.response?.status === 401 && !esLogin) onNoAutorizado(error)
      return Promise.reject(error)
    },
  )
}

export default api
