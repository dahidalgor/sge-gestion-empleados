<script setup>
import { onMounted, reactive, ref, watch } from 'vue'
import ConfirmarDialogo from '@/components/ConfirmarDialogo.vue'
import EmpleadoFormulario from '@/components/EmpleadoFormulario.vue'
import { empleadosService } from '@/services/empleados'
import { useAuthStore } from '@/stores/auth'
import { useAvisosStore } from '@/stores/avisos'
import { DEPARTAMENTOS, ESTADOS, formatoFecha, formatoMoneda, mensajeError } from '@/utils/formato'

const auth = useAuthStore()
const avisos = useAvisosStore()

const filtros = reactive({ buscar: '', departamento: '', estado: '', ordenarPor: 'apellidos', orden: 'ASC', pagina: 1, limite: 10 })
const resultado = ref({ datos: [], total: 0, paginas: 0 })
const cargando = ref(false)
const error = ref('')

const formularioAbierto = ref(false)
const editando = ref(null)
const guardando = ref(false)
const errorFormulario = ref('')

const porEliminar = ref(null)
const eliminando = ref(false)

async function cargar() {
  cargando.value = true
  error.value = ''
  try {
    const params = Object.fromEntries(Object.entries(filtros).filter(([, v]) => v !== ''))
    resultado.value = await empleadosService.listar(params)
  } catch (e) {
    error.value = mensajeError(e)
  } finally {
    cargando.value = false
  }
}

onMounted(cargar)

// Búsqueda con pequeña espera para no llamar al API en cada tecla
let espera
watch(() => filtros.buscar, () => {
  clearTimeout(espera)
  espera = setTimeout(() => { filtros.pagina = 1; cargar() }, 300)
})
watch(() => [filtros.departamento, filtros.estado, filtros.limite], () => { filtros.pagina = 1; cargar() })

function ordenar(campo) {
  if (filtros.ordenarPor === campo) filtros.orden = filtros.orden === 'ASC' ? 'DESC' : 'ASC'
  else Object.assign(filtros, { ordenarPor: campo, orden: 'ASC' })
  cargar()
}
const flecha = (campo) => (filtros.ordenarPor === campo ? (filtros.orden === 'ASC' ? '▲' : '▼') : '')

function irA(pagina) {
  filtros.pagina = pagina
  cargar()
}

function limpiarFiltros() {
  Object.assign(filtros, { buscar: '', departamento: '', estado: '' })
}

function abrirNuevo() {
  editando.value = null
  errorFormulario.value = ''
  formularioAbierto.value = true
}

function abrirEdicion(empleado) {
  editando.value = { ...empleado }
  errorFormulario.value = ''
  formularioAbierto.value = true
}

async function guardar(datos) {
  guardando.value = true
  errorFormulario.value = ''
  try {
    if (editando.value) {
      await empleadosService.actualizar(editando.value.id, datos)
      avisos.exito('Empleado actualizado correctamente')
    } else {
      await empleadosService.crear(datos)
      avisos.exito('Empleado creado correctamente')
    }
    formularioAbierto.value = false
    cargar()
  } catch (e) {
    errorFormulario.value = mensajeError(e)
  } finally {
    guardando.value = false
  }
}

async function eliminar() {
  eliminando.value = true
  try {
    const r = await empleadosService.eliminar(porEliminar.value.id)
    avisos.exito(r.mensaje)
    porEliminar.value = null
    if (resultado.value.datos.length === 1 && filtros.pagina > 1) filtros.pagina--
    cargar()
  } catch (e) {
    avisos.error(mensajeError(e))
  } finally {
    eliminando.value = false
  }
}

const columnas = [
  { campo: 'cedula', titulo: 'Cédula' },
  { campo: 'apellidos', titulo: 'Empleado' },
  { campo: 'departamento', titulo: 'Departamento' },
  { campo: 'cargo', titulo: 'Cargo' },
  { campo: 'fechaIngreso', titulo: 'Ingreso' },
  { campo: 'salario', titulo: 'Salario', derecha: true },
  { campo: 'estado', titulo: 'Estado' },
]
</script>

<template>
  <div class="vista">
    <div class="encabezado">
      <div>
        <h1>Empleados</h1>
        <p class="texto-suave">{{ resultado.total }} registro(s) encontrados</p>
      </div>
      <button v-if="auth.esAdmin" class="btn btn-primario" @click="abrirNuevo">+ Nuevo empleado</button>
      <span v-else class="etiqueta etiqueta-Licencia" title="Su token tiene rol 'consulta'">Modo solo lectura</span>
    </div>

    <div class="tarjeta filtros">
      <input v-model="filtros.buscar" class="control buscar" placeholder="Buscar por nombre, apellido, cédula o email…" />
      <select v-model="filtros.departamento" class="control">
        <option value="">Todos los departamentos</option>
        <option v-for="d in DEPARTAMENTOS" :key="d" :value="d">{{ d }}</option>
      </select>
      <select v-model="filtros.estado" class="control">
        <option value="">Todos los estados</option>
        <option v-for="e in ESTADOS" :key="e" :value="e">{{ e }}</option>
      </select>
      <button class="btn btn-borde" @click="limpiarFiltros">Limpiar</button>
    </div>

    <div v-if="error" class="alerta alerta-error">{{ error }}</div>

    <div class="tarjeta tabla-contenedor" :class="{ cargando }">
      <table>
        <thead>
          <tr>
            <th v-for="c in columnas" :key="c.campo" :class="{ derecha: c.derecha }" @click="ordenar(c.campo)">
              {{ c.titulo }} <span class="flecha">{{ flecha(c.campo) }}</span>
            </th>
            <th class="derecha">Acciones</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="e in resultado.datos" :key="e.id">
            <td class="mono">{{ e.cedula }}</td>
            <td>
              <strong>{{ e.apellidos }}, {{ e.nombres }}</strong>
              <div class="texto-suave sub">{{ e.email }}</div>
            </td>
            <td>{{ e.departamento }}</td>
            <td>{{ e.cargo }}<div class="texto-suave sub">{{ e.tipoContrato }}</div></td>
            <td>{{ formatoFecha(e.fechaIngreso) }}</td>
            <td class="derecha num">{{ formatoMoneda(e.salario) }}</td>
            <td><span class="etiqueta" :class="'etiqueta-' + e.estado">{{ e.estado }}</span></td>
            <td class="derecha acciones">
              <template v-if="auth.esAdmin">
                <button class="btn btn-sm btn-borde" @click="abrirEdicion(e)">Editar</button>
                <button class="btn btn-sm btn-borde peligro" @click="porEliminar = e">Eliminar</button>
              </template>
              <button v-else class="btn btn-sm btn-borde" @click="abrirEdicion(e)" disabled title="Requiere rol admin">Editar</button>
            </td>
          </tr>
          <tr v-if="!cargando && resultado.datos.length === 0">
            <td :colspan="columnas.length + 1" class="vacio">No hay empleados que coincidan con los filtros.</td>
          </tr>
        </tbody>
      </table>
    </div>

    <div class="paginacion">
      <div class="texto-suave">
        Mostrar
        <select v-model.number="filtros.limite" class="control mini">
          <option :value="5">5</option><option :value="10">10</option><option :value="20">20</option>
        </select>
        por página
      </div>
      <div class="botones">
        <button class="btn btn-sm btn-borde" :disabled="filtros.pagina <= 1" @click="irA(filtros.pagina - 1)">‹ Anterior</button>
        <span>Página {{ filtros.pagina }} de {{ Math.max(1, resultado.paginas) }}</span>
        <button class="btn btn-sm btn-borde" :disabled="filtros.pagina >= resultado.paginas" @click="irA(filtros.pagina + 1)">Siguiente ›</button>
      </div>
    </div>

    <EmpleadoFormulario
      v-if="formularioAbierto"
      :empleado="editando"
      :guardando="guardando"
      :errores-servidor="errorFormulario"
      @guardar="guardar"
      @cancelar="formularioAbierto = false"
    />

    <ConfirmarDialogo
      v-if="porEliminar"
      titulo="Eliminar empleado"
      :mensaje="`¿Seguro que desea eliminar a ${porEliminar.nombres} ${porEliminar.apellidos}? Esta acción no se puede deshacer.`"
      :cargando="eliminando"
      @confirmar="eliminar"
      @cancelar="porEliminar = null"
    />
  </div>
</template>

<style scoped>
.vista { display: flex; flex-direction: column; gap: 16px; }
.encabezado { display: flex; justify-content: space-between; align-items: center; gap: 12px; flex-wrap: wrap; }
.encabezado p { margin: 4px 0 0; }
.filtros { display: flex; gap: 8px; padding: 10px; flex-wrap: wrap; }
.filtros .control { width: auto; }
.buscar { flex: 1; min-width: 220px; }
.tabla-contenedor { overflow-x: auto; transition: opacity .15s; }
.tabla-contenedor.cargando { opacity: .55; }
table { width: 100%; border-collapse: collapse; min-width: 860px; }
th { text-align: left; font-size: 13px; font-weight: 600; color: var(--texto); background: #f7f8fa; padding: 9px 12px; border-bottom: 1px solid var(--borde); cursor: pointer; user-select: none; white-space: nowrap; }
th:last-child { cursor: default; }
td { padding: 8px 12px; border-bottom: 1px solid var(--borde); vertical-align: middle; }
tbody tr:hover { background: #f7f8fa; }
tbody tr:last-child td { border-bottom: none; }
.sub { font-size: 12px; }
.derecha { text-align: right; }
.num { font-variant-numeric: tabular-nums; }
.flecha { font-size: 10px; color: var(--primario); }
.acciones { white-space: nowrap; }
.acciones .btn + .btn { margin-left: 6px; }
.peligro { color: var(--peligro); border-color: #e0b4b4; }
.vacio { text-align: center; padding: 36px; color: var(--texto-suave); }
.paginacion { display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 10px; }
.botones { display: flex; align-items: center; gap: 10px; }
.mini { width: auto; padding: 4px 8px; display: inline-block; margin: 0 4px; }
</style>
