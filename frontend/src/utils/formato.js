const moneda = new Intl.NumberFormat('es-EC', { style: 'currency', currency: 'USD' })

export const formatoMoneda = (v) => moneda.format(Number(v ?? 0))

export const formatoFecha = (iso) => {
  if (!iso) return '—'
  const [a, m, d] = String(iso).slice(0, 10).split('-')
  return `${d}/${m}/${a}`
}

export const formatoTiempo = (seg) => {
  const m = Math.floor(seg / 60)
  const s = seg % 60
  return `${m}:${String(s).padStart(2, '0')}`
}

export const DEPARTAMENTOS = ['Tecnología', 'Finanzas', 'Recursos Humanos', 'Ventas', 'Marketing', 'Operaciones', 'Legal']
export const GENEROS = ['Masculino', 'Femenino', 'Otro']
export const TIPOS_CONTRATO = ['Indefinido', 'Plazo fijo', 'Servicios profesionales']
export const ESTADOS = ['Activo', 'Vacaciones', 'Licencia', 'Inactivo']

/** Convierte la respuesta de error del API en un texto legible */
export function mensajeError(error) {
  const msg = error?.response?.data?.message
  if (Array.isArray(msg)) return msg.join(' · ')
  if (msg) return msg
  if (error?.code === 'ERR_NETWORK') return 'No se pudo conectar con el servidor'
  return 'Ocurrió un error inesperado'
}
