<script setup>
import { onMounted, onUnmounted, ref } from 'vue'
import { RouterLink, RouterView, useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useAvisosStore } from '@/stores/avisos'
import { formatoTiempo } from '@/utils/formato'
import { segundosRestantes } from '@/utils/jwt'

const auth = useAuthStore()
const avisos = useAvisosStore()
const router = useRouter()
const restante = ref(segundosRestantes(auth.token))
const menuAbierto = ref(false)
let reloj

onMounted(() => {
  // Cuenta regresiva del JWT; al llegar a 0 se cierra la sesión
  reloj = setInterval(() => {
    restante.value = segundosRestantes(auth.token)
    if (restante.value === 0) {
      salir()
      avisos.error('La sesión expiró, vuelva a iniciar sesión')
    }
  }, 1000)
})
onUnmounted(() => clearInterval(reloj))

function salir() {
  clearInterval(reloj)
  auth.logout()
  router.push({ name: 'login' })
}
</script>

<template>
  <div class="app">
    <aside class="lateral" :class="{ abierto: menuAbierto }">
      <div class="marca">SGE<span>Gestión de Empleados</span></div>
      <nav @click="menuAbierto = false">
        <RouterLink :to="{ name: 'panel' }" exact-active-class="activo">Panel</RouterLink>
        <RouterLink :to="{ name: 'empleados' }" active-class="activo">Empleados</RouterLink>
        <RouterLink :to="{ name: 'sesion' }" active-class="activo">Sesión JWT</RouterLink>
      </nav>
    </aside>

    <div class="principal">
      <header class="cabecera">
        <button class="btn btn-icono menu" @click="menuAbierto = !menuAbierto">☰</button>
        <div class="espacio"></div>
        <RouterLink :to="{ name: 'sesion' }" class="token" :class="{ poco: restante < 300 }" title="Tiempo restante del token">
          Sesión: {{ formatoTiempo(restante) }}
        </RouterLink>
        <div class="usuario">
          <strong>{{ auth.usuario?.nombre }}</strong>
          <span class="texto-suave">{{ auth.usuario?.usuario }} · {{ auth.usuario?.rol }}</span>
        </div>
        <button class="btn btn-borde btn-sm" @click="salir">Cerrar sesión</button>
      </header>
      <main class="contenido">
        <RouterView />
      </main>
    </div>
  </div>
</template>

<style scoped>
.app { display: grid; grid-template-columns: 230px 1fr; min-height: 100vh; }
.lateral { background: var(--lateral); color: var(--lateral-texto); padding: 18px 0; display: flex; flex-direction: column; gap: 12px; }
.marca { display: flex; flex-direction: column; color: #fff; font-weight: 600; font-size: 16px; padding: 0 12px 16px; border-bottom: 1px solid #2e3846; }
.marca span { font-size: 12px; font-weight: 400; color: var(--lateral-texto); }
nav { display: flex; flex-direction: column; }
nav a { color: var(--lateral-texto); text-decoration: none; padding: 9px 12px 9px 9px; border-left: 3px solid transparent; }
nav a:hover { background: #242e3c; color: #fff; }
nav a.activo { background: #263244; border-left-color: #8fa8c8; color: #fff; }
.principal { min-width: 0; display: flex; flex-direction: column; }
.cabecera { display: flex; align-items: center; gap: 18px; padding: 10px 24px; background: var(--panel); border-bottom: 1px solid var(--borde); }
.espacio { flex: 1; }
.menu { display: none; font-size: 18px; }
.token { font-size: 12px; color: var(--texto-suave); text-decoration: none; font-variant-numeric: tabular-nums; }
.token:hover { text-decoration: underline; }
.token.poco { color: var(--aviso); font-weight: 600; }
.usuario { display: flex; flex-direction: column; line-height: 1.25; font-size: 13px; text-align: right; }
.contenido { padding: 24px; min-width: 0; }
@media (max-width: 860px) {
  .app { grid-template-columns: 1fr; }
  .lateral { position: fixed; inset: 0 auto 0 0; width: 230px; z-index: 50; transform: translateX(-100%); transition: transform .2s; }
  .lateral.abierto { transform: none; }
  .menu { display: inline-flex; }
  .usuario { display: none; }
  .cabecera { padding: 10px 16px; gap: 8px; }
  .contenido { padding: 16px; }
}
</style>
