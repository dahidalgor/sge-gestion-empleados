<script setup>
import { computed, onMounted, ref } from 'vue'
import { RouterLink } from 'vue-router'
import { empleadosService } from '@/services/empleados'
import { useAuthStore } from '@/stores/auth'
import { formatoMoneda, mensajeError } from '@/utils/formato'

const auth = useAuthStore()
const resumen = ref(null)
const error = ref('')

onMounted(async () => {
  try {
    resumen.value = await empleadosService.resumen()
  } catch (e) {
    error.value = mensajeError(e)
  }
})

const cantidad = (estado) => resumen.value?.porEstado.find((e) => e.estado === estado)?.cantidad ?? 0
const maxDep = computed(() => Math.max(1, ...(resumen.value?.porDepartamento.map((d) => d.cantidad) ?? [1])))
</script>

<template>
  <div class="panel">
    <div>
      <h1>Hola, {{ auth.usuario?.nombre }}</h1>
      <p class="texto-suave">Resumen general del talento humano de la organización.</p>
    </div>

    <div v-if="error" class="alerta alerta-error">{{ error }}</div>

    <template v-if="resumen">
      <div class="indicadores">
        <div class="tarjeta indicador">
          <span class="texto-suave">Total de empleados</span>
          <strong>{{ resumen.total }}</strong>
        </div>
        <div class="tarjeta indicador">
          <span class="texto-suave">Activos</span>
          <strong class="verde">{{ cantidad('Activo') }}</strong>
        </div>
        <div class="tarjeta indicador">
          <span class="texto-suave">Vacaciones / Licencia</span>
          <strong class="morado">{{ cantidad('Vacaciones') + cantidad('Licencia') }}</strong>
        </div>
        <div class="tarjeta indicador">
          <span class="texto-suave">Nómina mensual</span>
          <strong>{{ formatoMoneda(resumen.nominaMensual) }}</strong>
          <small class="texto-suave">sin empleados inactivos</small>
        </div>
      </div>

      <div class="columnas">
        <section class="tarjeta bloque">
          <h2>Empleados por departamento</h2>
          <div class="barras">
            <div v-for="d in resumen.porDepartamento" :key="d.departamento" class="barra">
              <span class="nombre">{{ d.departamento }}</span>
              <div class="pista"><div class="relleno" :style="{ width: (d.cantidad / maxDep) * 100 + '%' }"></div></div>
              <span class="valor">{{ d.cantidad }}</span>
            </div>
          </div>
        </section>

        <section class="tarjeta bloque">
          <h2>Empleados por estado</h2>
          <ul class="estados">
            <li v-for="e in resumen.porEstado" :key="e.estado">
              <span class="etiqueta" :class="'etiqueta-' + e.estado">{{ e.estado }}</span>
              <strong>{{ e.cantidad }}</strong>
            </li>
          </ul>
          <RouterLink :to="{ name: 'empleados' }" class="btn btn-primario">Ir a empleados</RouterLink>
        </section>
      </div>
    </template>
  </div>
</template>

<style scoped>
.panel { display: flex; flex-direction: column; gap: 20px; }
.panel p { margin: 4px 0 0; }
.indicadores { display: grid; grid-template-columns: repeat(auto-fit, minmax(190px, 1fr)); gap: 14px; }
.indicador { padding: 18px; display: flex; flex-direction: column; gap: 6px; }
.indicador strong { font-size: 26px; font-variant-numeric: tabular-nums; }
.verde { color: var(--exito); }
.morado { color: var(--info); }
.columnas { display: grid; grid-template-columns: 2fr 1fr; gap: 14px; }
.bloque { padding: 20px; display: flex; flex-direction: column; gap: 16px; }
.barras { display: flex; flex-direction: column; gap: 10px; }
.barra { display: grid; grid-template-columns: 130px 1fr 28px; align-items: center; gap: 10px; }
.nombre { font-size: 13px; }
.pista { background: var(--gris-suave); border-radius: 6px; height: 12px; overflow: hidden; }
.relleno { background: var(--primario); height: 100%; border-radius: 6px; transition: width .4s; }
.valor { text-align: right; font-weight: 600; font-variant-numeric: tabular-nums; }
.estados { list-style: none; padding: 0; margin: 0; display: flex; flex-direction: column; gap: 10px; }
.estados li { display: flex; justify-content: space-between; align-items: center; }
@media (max-width: 860px) { .columnas { grid-template-columns: 1fr; } .barra { grid-template-columns: 100px 1fr 24px; } }
</style>
