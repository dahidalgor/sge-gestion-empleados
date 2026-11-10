import './assets/main.css'

import { createApp } from 'vue'
import { createPinia } from 'pinia'

import App from './App.vue'
import router from './router'
import { configurarInterceptores } from './services/api'
import { useAuthStore } from './stores/auth'
import { useAvisosStore } from './stores/avisos'

const app = createApp(App)
app.use(createPinia())
app.use(router)

const auth = useAuthStore()
configurarInterceptores({
  getToken: () => auth.token,
  onNoAutorizado: (error) => {
    auth.logout()
    useAvisosStore().error(error.response?.data?.message ?? 'Sesión no válida')
    router.push({ name: 'login' })
  },
})

app.mount('#app')
