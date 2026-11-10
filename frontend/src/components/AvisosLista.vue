<script setup>
import { useAvisosStore } from '@/stores/avisos'
const avisos = useAvisosStore()
</script>

<template>
  <div class="avisos">
    <TransitionGroup name="aviso">
      <div v-for="a in avisos.lista" :key="a.id" class="aviso" :class="a.tipo" @click="avisos.cerrar(a.id)">
        <span>{{ a.tipo === 'exito' ? '✓' : '!' }}</span>
        {{ a.texto }}
      </div>
    </TransitionGroup>
  </div>
</template>

<style scoped>
.avisos { position: fixed; right: 16px; bottom: 16px; display: flex; flex-direction: column; gap: 8px; z-index: 100; max-width: calc(100vw - 32px); }
.aviso { display: flex; gap: 10px; align-items: center; padding: 12px 16px; border-radius: 10px; color: #fff; box-shadow: var(--sombra); cursor: pointer; max-width: 420px; }
.aviso span { font-weight: 800; }
.exito { background: var(--exito); }
.error { background: var(--peligro); }
.aviso-enter-from, .aviso-leave-to { opacity: 0; transform: translateY(10px); }
.aviso-enter-active, .aviso-leave-active { transition: all .2s; }
</style>
