<script setup>
import { computed, nextTick, reactive, ref, watch } from 'vue'
import { DEPARTAMENTOS, ESTADOS, GENEROS, TIPOS_CONTRATO } from '@/utils/formato'

const props = defineProps({
  empleado: { type: Object, default: null },
  guardando: Boolean,
  erroresServidor: { type: String, default: '' },
})
const emit = defineEmits(['guardar', 'cancelar'])

const esEdicion = computed(() => !!props.empleado)
const vacio = {
  cedula: '', nombres: '', apellidos: '', fechaNacimiento: '', genero: '', email: '', telefono: '',
  direccion: '', departamento: '', cargo: '', fechaIngreso: '', salario: '', tipoContrato: '', estado: 'Activo',
}
const form = reactive({ ...vacio, ...(props.empleado ?? {}) })
const errores = ref({})
const cuerpo = ref(null)

// Cuando el servidor rechaza los datos, se muestra el mensaje subiendo al inicio del formulario
watch(() => props.erroresServidor, async (msg) => {
  if (msg) { await nextTick(); cuerpo.value?.scrollTo({ top: 0, behavior: 'smooth' }) }
})

/** Validación en el cliente (el backend vuelve a validar todo) */
function validar() {
  const e = {}
  const obligatorio = (c, msg) => { if (!String(form[c] ?? '').trim()) e[c] = msg }
  if (!/^\d{10}$/.test(form.cedula)) e.cedula = 'Debe tener 10 dígitos'
  obligatorio('nombres', 'Obligatorio')
  obligatorio('apellidos', 'Obligatorio')
  obligatorio('fechaNacimiento', 'Obligatorio')
  obligatorio('genero', 'Seleccione una opción')
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) e.email = 'Email inválido'
  if (!/^0\d{8,9}$/.test(form.telefono)) e.telefono = 'Ej. 0991234567'
  obligatorio('direccion', 'Obligatorio')
  obligatorio('departamento', 'Seleccione una opción')
  obligatorio('cargo', 'Obligatorio')
  obligatorio('fechaIngreso', 'Obligatorio')
  if (!(Number(form.salario) > 0)) e.salario = 'Ingrese un valor mayor a 0'
  obligatorio('tipoContrato', 'Seleccione una opción')
  errores.value = e
  return Object.keys(e).length === 0
}

function enviar() {
  if (!validar()) return
  const datos = {}
  for (const clave of Object.keys(vacio)) datos[clave] = typeof form[clave] === 'string' ? form[clave].trim() : form[clave]
  datos.salario = Number(form.salario)
  emit('guardar', datos)
}

const campos = [
  { clave: 'cedula', etiqueta: 'Cédula', tipo: 'text', attrs: { maxlength: 10, inputmode: 'numeric' } },
  { clave: 'nombres', etiqueta: 'Nombres', tipo: 'text' },
  { clave: 'apellidos', etiqueta: 'Apellidos', tipo: 'text' },
  { clave: 'fechaNacimiento', etiqueta: 'Fecha de nacimiento', tipo: 'date' },
  { clave: 'genero', etiqueta: 'Género', opciones: GENEROS },
  { clave: 'email', etiqueta: 'Email', tipo: 'email' },
  { clave: 'telefono', etiqueta: 'Teléfono', tipo: 'tel', attrs: { maxlength: 10 } },
  { clave: 'direccion', etiqueta: 'Dirección', tipo: 'text', ancho: true },
  { clave: 'departamento', etiqueta: 'Departamento', opciones: DEPARTAMENTOS },
  { clave: 'cargo', etiqueta: 'Cargo', tipo: 'text' },
  { clave: 'fechaIngreso', etiqueta: 'Fecha de ingreso', tipo: 'date' },
  { clave: 'salario', etiqueta: 'Salario mensual (USD)', tipo: 'number', attrs: { min: 0, step: '0.01' } },
  { clave: 'tipoContrato', etiqueta: 'Tipo de contrato', opciones: TIPOS_CONTRATO },
  { clave: 'estado', etiqueta: 'Estado', opciones: ESTADOS },
]
</script>

<template>
  <div class="fondo" @click.self="emit('cancelar')">
    <form class="tarjeta modal" novalidate @submit.prevent="enviar">
      <header>
        <h2>{{ esEdicion ? 'Editar empleado' : 'Nuevo empleado' }}</h2>
        <button type="button" class="btn btn-icono" aria-label="Cerrar" @click="emit('cancelar')">✕</button>
      </header>

      <div ref="cuerpo" class="cuerpo">
        <div v-if="erroresServidor" class="alerta alerta-error">{{ erroresServidor }}</div>
        <div class="rejilla">
          <div v-for="c in campos" :key="c.clave" class="campo" :class="{ invalido: errores[c.clave], ancho: c.ancho }">
            <label :for="c.clave">{{ c.etiqueta }}</label>
            <select v-if="c.opciones" :id="c.clave" v-model="form[c.clave]">
              <option value="" disabled>Seleccione…</option>
              <option v-for="o in c.opciones" :key="o" :value="o">{{ o }}</option>
            </select>
            <input v-else :id="c.clave" v-model="form[c.clave]" :type="c.tipo" v-bind="c.attrs" />
            <span v-if="errores[c.clave]" class="error">{{ errores[c.clave] }}</span>
          </div>
        </div>
      </div>

      <footer>
        <button type="button" class="btn btn-borde" @click="emit('cancelar')">Cancelar</button>
        <button type="submit" class="btn btn-primario" :disabled="guardando">
          {{ guardando ? 'Guardando…' : esEdicion ? 'Guardar cambios' : 'Crear empleado' }}
        </button>
      </footer>
    </form>
  </div>
</template>

<style scoped>
.fondo { position: fixed; inset: 0; background: rgba(20, 33, 61, .45); display: grid; place-items: center; z-index: 60; padding: 16px; }
.modal { width: 100%; max-width: 760px; max-height: calc(100vh - 32px); display: flex; flex-direction: column; }
header, footer { display: flex; align-items: center; justify-content: space-between; padding: 16px 20px; }
header { border-bottom: 1px solid var(--borde); }
footer { border-top: 1px solid var(--borde); justify-content: flex-end; gap: 8px; }
.cuerpo { padding: 20px; overflow-y: auto; display: flex; flex-direction: column; gap: 14px; }
.rejilla { display: grid; grid-template-columns: 1fr 1fr; gap: 14px 16px; }
.ancho { grid-column: 1 / -1; }
@media (max-width: 600px) { .rejilla { grid-template-columns: 1fr; } }
</style>
