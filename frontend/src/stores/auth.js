import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import api from '@/services/api'
import { decodificarJwt, segundosRestantes } from '@/utils/jwt'

const CLAVE = 'sge_token'

function leerToken() {
  try {
    return localStorage.getItem(CLAVE)
  } catch {
    return null
  }
}

export const useAuthStore = defineStore('auth', () => {
  const token = ref(leerToken())

  const datos = computed(() => (token.value ? decodificarJwt(token.value) : null))
  const usuario = computed(() => datos.value?.payload ?? null)
  const esAdmin = computed(() => usuario.value?.rol === 'admin')

  /** La sesión es válida si hay token y no ha expirado */
  function sesionValida() {
    return !!token.value && segundosRestantes(token.value) > 0
  }

  async function login(usuarioNombre, password) {
    const { data } = await api.post('/auth/login', { usuario: usuarioNombre, password })
    token.value = data.access_token
    try {
      localStorage.setItem(CLAVE, data.access_token)
    } catch {
      /* almacenamiento no disponible: la sesión dura mientras la pestaña esté abierta */
    }
  }

  function logout() {
    token.value = null
    try {
      localStorage.removeItem(CLAVE)
    } catch {
      /* ignorar */
    }
  }

  return { token, datos, usuario, esAdmin, sesionValida, login, logout }
})
