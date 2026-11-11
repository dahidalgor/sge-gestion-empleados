<script setup>
import { useAvisosStore } from '@/stores/avisos'
const avisos = useAvisosStore()
</script>

<template>
  <div class="avisos">
    <TransitionGroup name="aviso">
      <div v-for="a in avisos.lista" :key="a.id" class="aviso" :class="a.tipo" @click="avisos.cerrar(a.id)">
        {{ a.texto }}
      </div>
    </TransitionGroup>
  </div>
</template>

<style scoped>
.avisos { position: fixed; right: 16px; bottom: 16px; display: flex; flex-direction: column; gap: 8px; z-index: 100; max-width: calc(100vw - 32px); }
.aviso { padding: 10px 14px; border-radius: var(--radio); border: 1px solid; border-left-width: 4px; background: #fff; cursor: pointer; max-width: 420px; font-size: 13px; }
.exito { border-color: #c4dccb; border-left-color: var(--exito); color: var(--exito); }
.error { border-color: #e6c3c3; border-left-color: var(--peligro); color: var(--peligro); }
.aviso-enter-from, .aviso-leave-to { opacity: 0; transform: translateY(10px); }
.aviso-enter-active, .aviso-leave-active { transition: all .2s; }
</style>
