<script setup>
import { reactive, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { mensajeError } from '@/utils/formato'

const auth = useAuthStore()
const router = useRouter()
const route = useRoute()

const form = reactive({ usuario: '', password: '' })
const errores = reactive({ usuario: '', password: '' })
const errorGeneral = ref('')
const cargando = ref(false)
const verPassword = ref(false)

function validar() {
  errores.usuario = form.usuario.trim() ? '' : 'Ingrese su usuario'
  errores.password = form.password ? '' : 'Ingrese su contraseña'
  return !errores.usuario && !errores.password
}

async function ingresar() {
  errorGeneral.value = ''
  if (!validar()) return
  cargando.value = true
  try {
    await auth.login(form.usuario.trim(), form.password)
    router.push(route.query.redirect || { name: 'panel' })
  } catch (e) {
    errorGeneral.value = mensajeError(e)
  } finally {
    cargando.value = false
  }
}
</script>

<template>
  <div class="pantalla">
    <form class="tarjeta caja" novalidate @submit.prevent="ingresar">
      <header>
        <h1>Sistema de Gestión de Empleados</h1>
        <p class="texto-suave">Inicie sesión para continuar</p>
      </header>

      <div v-if="errorGeneral" class="alerta alerta-error">{{ errorGeneral }}</div>

      <div class="campo" :class="{ invalido: errores.usuario }">
        <label for="usuario">Usuario</label>
        <input id="usuario" v-model="form.usuario" autocomplete="username" autofocus />
        <span v-if="errores.usuario" class="error">{{ errores.usuario }}</span>
      </div>

      <div class="campo" :class="{ invalido: errores.password }">
        <label for="password">Contraseña</label>
        <input id="password" v-model="form.password" :type="verPassword ? 'text' : 'password'" autocomplete="current-password" />
        <span v-if="errores.password" class="error">{{ errores.password }}</span>
        <label class="mostrar"><input v-model="verPassword" type="checkbox" /> Mostrar contraseña</label>
      </div>

      <button class="btn btn-primario" type="submit" :disabled="cargando">
        {{ cargando ? 'Verificando…' : 'Ingresar' }}
      </button>

      <p class="demo texto-suave">
        Usuarios de prueba: <span class="mono">admin / Admin123*</span> ·
        <span class="mono">consulta / Consulta123*</span>
      </p>
    </form>
  </div>
</template>

<style scoped>
.pantalla { min-height: 100vh; display: grid; place-items: center; padding: 24px 16px; }
.caja { width: 100%; max-width: 360px; padding: 28px; display: flex; flex-direction: column; gap: 16px; }
header { border-bottom: 1px solid var(--borde); padding-bottom: 14px; }
header h1 { font-size: 18px; }
header p { margin: 4px 0 0; }
.mostrar { display: flex; align-items: center; gap: 6px; font-weight: 400 !important; color: var(--texto-suave) !important; margin-top: 4px; cursor: pointer; }
.mostrar input { width: auto !important; margin: 0; }
.demo { margin: 0; font-size: 12px; border-top: 1px solid var(--borde); padding-top: 12px; }
</style>
