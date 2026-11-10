import { defineStore } from 'pinia'
import { ref } from 'vue'

/** Mensajes emergentes (éxito / error) */
export const useAvisosStore = defineStore('avisos', () => {
  const lista = ref([])
  let siguiente = 1

  function mostrar(texto, tipo = 'exito') {
    const id = siguiente++
    lista.value.push({ id, texto, tipo })
    setTimeout(() => cerrar(id), 4500)
  }

  function cerrar(id) {
    lista.value = lista.value.filter((a) => a.id !== id)
  }

  return {
    lista,
    exito: (t) => mostrar(t, 'exito'),
    error: (t) => mostrar(t, 'error'),
    cerrar,
  }
})
