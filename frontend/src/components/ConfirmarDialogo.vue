<script setup>
defineProps({ titulo: String, mensaje: String, cargando: Boolean })
defineEmits(['confirmar', 'cancelar'])
</script>

<template>
  <div class="fondo" @click.self="$emit('cancelar')">
    <div class="tarjeta dialogo" role="alertdialog">
      <h2>{{ titulo }}</h2>
      <p>{{ mensaje }}</p>
      <div class="acciones">
        <button class="btn btn-borde" @click="$emit('cancelar')">Cancelar</button>
        <button class="btn btn-peligro" :disabled="cargando" @click="$emit('confirmar')">
          {{ cargando ? 'Eliminando…' : 'Eliminar' }}
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.fondo { position: fixed; inset: 0; background: rgba(20, 33, 61, .45); display: grid; place-items: center; z-index: 60; padding: 16px; }
.dialogo { padding: 24px; max-width: 420px; width: 100%; display: flex; flex-direction: column; gap: 12px; }
.dialogo p { margin: 0; color: var(--texto-suave); }
.acciones { display: flex; justify-content: flex-end; gap: 8px; margin-top: 8px; }
</style>
