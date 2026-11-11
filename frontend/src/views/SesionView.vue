<script setup>
import { computed, onMounted, onUnmounted, ref } from 'vue'
import api from '@/services/api'
import { useAuthStore } from '@/stores/auth'
import { formatoTiempo } from '@/utils/formato'
import { segundosRestantes } from '@/utils/jwt'

const auth = useAuthStore()
const restante = ref(segundosRestantes(auth.token))
let reloj
onMounted(() => (reloj = setInterval(() => (restante.value = segundosRestantes(auth.token)), 1000)))
onUnmounted(() => clearInterval(reloj))

const partes = computed(() => auth.token?.split('.') ?? [])
const fecha = (seg) => new Date(seg * 1000).toLocaleString('es-EC')

/** Demostración: llamar al API con y sin el JWT */
const pruebas = ref([])
async function probar(conToken) {
  const url = (api.defaults.baseURL ?? '') + '/empleados?limite=1'
  const inicio = performance.now()
  const res = await fetch(url, { headers: conToken ? { Authorization: `Bearer ${auth.token}` } : {} })
  const cuerpo = await res.json()
  pruebas.value.unshift({
    id: Date.now(),
    conToken,
    estado: res.status,
    ms: Math.round(performance.now() - inicio),
    respuesta: res.ok ? `${cuerpo.total} empleados en total (se devolvió 1)` : cuerpo.message,
  })
}

const perfil = ref(null)
async function verPerfil() {
  perfil.value = (await api.get('/auth/perfil')).data
}
</script>

<template>
  <div class="vista">
    <div>
      <h1>Sesión y JSON Web Token</h1>
      <p class="texto-suave">Así funciona el control de sesiones del sistema.</p>
    </div>

    <section class="tarjeta bloque">
      <h2>Token actual</h2>
      <p class="texto-suave">Un JWT tiene tres partes separadas por puntos: <b class="c1">encabezado</b>, <b class="c2">datos (payload)</b> y <b class="c3">firma</b>.</p>
      <div class="token mono">
        <span class="c1">{{ partes[0] }}</span>.<span class="c2">{{ partes[1] }}</span>.<span class="c3">{{ partes[2] }}</span>
      </div>
    </section>

    <div class="columnas">
      <section class="tarjeta bloque">
        <h2><span class="punto c1f"></span>Encabezado</h2>
        <pre class="mono">{{ JSON.stringify(auth.datos?.header, null, 2) }}</pre>
      </section>
      <section class="tarjeta bloque">
        <h2><span class="punto c2f"></span>Payload</h2>
        <pre class="mono">{{ JSON.stringify(auth.datos?.payload, null, 2) }}</pre>
        <ul class="detalle">
          <li><b>sub</b>: id del usuario · <b>rol</b>: define los permisos</li>
          <li><b>iat</b> (emitido): {{ fecha(auth.datos?.payload.iat) }}</li>
          <li><b>exp</b> (expira): {{ fecha(auth.datos?.payload.exp) }} · quedan <b>{{ formatoTiempo(restante) }}</b></li>
        </ul>
      </section>
    </div>

    <section class="tarjeta bloque">
      <h2>Prueba en vivo del API</h2>
      <p class="texto-suave">El backend rechaza con <b>401</b> cualquier petición a <code>/api/empleados</code> sin un token válido.</p>
      <div class="botones">
        <button class="btn btn-primario" @click="probar(true)">Llamar con token</button>
        <button class="btn btn-borde" @click="probar(false)">Llamar sin token</button>
        <button class="btn btn-borde" @click="verPerfil">GET /auth/perfil</button>
      </div>
      <pre v-if="perfil" class="mono">GET /auth/perfil → {{ JSON.stringify(perfil) }}</pre>
      <table v-if="pruebas.length" class="resultados">
        <thead><tr><th>Petición</th><th>Estado</th><th>Tiempo</th><th>Respuesta</th></tr></thead>
        <tbody>
          <tr v-for="p in pruebas" :key="p.id">
            <td>{{ p.conToken ? 'Con Authorization: Bearer …' : 'Sin encabezado Authorization' }}</td>
            <td><span class="etiqueta" :class="p.estado === 200 ? 'etiqueta-Activo' : 'etiqueta-Licencia'">{{ p.estado }}</span></td>
            <td class="mono">{{ p.ms }} ms</td>
            <td>{{ p.respuesta }}</td>
          </tr>
        </tbody>
      </table>
    </section>
  </div>
</template>

<style scoped>
.vista { display: flex; flex-direction: column; gap: 16px; }
.vista > div p { margin: 4px 0 0; }
.bloque { padding: 16px; display: flex; flex-direction: column; gap: 12px; min-width: 0; }
.bloque p { margin: 0; }
.token { word-break: break-all; background: var(--gris-suave); border: 1px solid var(--borde); padding: 12px; border-radius: var(--radio); line-height: 1.6; }
.c1 { color: #a82a2a; } .c2 { color: #5b3f8a; } .c3 { color: #1f5f7a; }
.punto { display: inline-block; width: 8px; height: 8px; margin-right: 8px; }
.c1f { background: #a82a2a; } .c2f { background: #5b3f8a; }
pre { margin: 0; background: var(--gris-suave); border: 1px solid var(--borde); padding: 10px; border-radius: var(--radio); overflow-x: auto; }
.columnas { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
.detalle { margin: 0; padding-left: 18px; display: grid; gap: 4px; color: var(--texto-suave); font-size: 13px; }
.botones { display: flex; gap: 8px; flex-wrap: wrap; }
.resultados { width: 100%; border-collapse: collapse; font-size: 13px; }
.resultados th, .resultados td { text-align: left; padding: 8px 10px; border-bottom: 1px solid var(--borde); }
.resultados th { color: var(--texto-suave); font-size: 12px; }
@media (max-width: 860px) { .columnas { grid-template-columns: 1fr; } }
</style>
