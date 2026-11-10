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
    <section class="marca">
      <div class="logo">SGE</div>
      <h1>Sistema de Gestión de Empleados</h1>
      <p>Administración del talento humano con acceso seguro mediante JSON Web Tokens.</p>
      <ul>
        <li>Autenticación con JWT firmado (HS256)</li>
        <li>Rutas protegidas en el frontend y en el API</li>
        <li>Permisos según el rol incluido en el token</li>
      </ul>
    </section>

    <section class="formulario">
      <form class="tarjeta caja" novalidate @submit.prevent="ingresar">
        <h2>Iniciar sesión</h2>
        <p class="texto-suave">Ingrese sus credenciales para continuar</p>

        <div v-if="errorGeneral" class="alerta alerta-error">{{ errorGeneral }}</div>

        <div class="campo" :class="{ invalido: errores.usuario }">
          <label for="usuario">Usuario</label>
          <input id="usuario" v-model="form.usuario" autocomplete="username" autofocus />
          <span v-if="errores.usuario" class="error">{{ errores.usuario }}</span>
        </div>

        <div class="campo" :class="{ invalido: errores.password }">
          <label for="password">Contraseña</label>
          <div class="con-boton">
            <input id="password" v-model="form.password" :type="verPassword ? 'text' : 'password'" autocomplete="current-password" />
            <button type="button" class="btn btn-icono" @click="verPassword = !verPassword">
              {{ verPassword ? 'Ocultar' : 'Ver' }}
            </button>
          </div>
          <span v-if="errores.password" class="error">{{ errores.password }}</span>
        </div>

        <button class="btn btn-primario" type="submit" :disabled="cargando">
          {{ cargando ? 'Verificando…' : 'Ingresar' }}
        </button>

        <div class="alerta alerta-info demo">
          <strong>Usuarios de prueba</strong><br />
          admin / Admin123* (puede crear, editar y eliminar)<br />
          consulta / Consulta123* (solo lectura)
        </div>
      </form>
    </section>
  </div>
</template>

<style scoped>
.pantalla { min-height: 100vh; display: grid; grid-template-columns: 1fr 1fr; }
.marca { background: linear-gradient(150deg, #14213d 0%, #1f3f7a 100%); color: #e6ecf8; padding: 64px; display: flex; flex-direction: column; justify-content: center; gap: 16px; }
.marca h1 { font-size: 32px; color: #fff; }
.marca p { font-size: 16px; max-width: 440px; color: #c9d3e8; margin: 0; }
.marca ul { padding-left: 18px; color: #c9d3e8; margin: 8px 0 0; display: grid; gap: 6px; }
.logo { width: 56px; height: 56px; border-radius: 14px; background: #fff; color: var(--lateral); display: grid; place-items: center; font-weight: 800; font-size: 18px; }
.formulario { display: grid; place-items: center; padding: 32px 16px; }
.caja { width: 100%; max-width: 380px; padding: 32px; display: flex; flex-direction: column; gap: 16px; }
.caja p { margin: -10px 0 4px; }
.con-boton { display: flex; gap: 6px; }
.demo { line-height: 1.6; }
@media (max-width: 820px) {
  .pantalla { grid-template-columns: 1fr; }
  .marca { padding: 32px 20px; }
  .marca h1 { font-size: 24px; }
  .marca ul { display: none; }
}
</style>
