import api from './api'

export const empleadosService = {
  listar: (params) => api.get('/empleados', { params }).then((r) => r.data),
  resumen: () => api.get('/empleados/resumen').then((r) => r.data),
  obtener: (id) => api.get(`/empleados/${id}`).then((r) => r.data),
  crear: (datos) => api.post('/empleados', datos).then((r) => r.data),
  actualizar: (id, datos) => api.patch(`/empleados/${id}`, datos).then((r) => r.data),
  eliminar: (id) => api.delete(`/empleados/${id}`).then((r) => r.data),
}
