export enum Genero {
  MASCULINO = 'Masculino',
  FEMENINO = 'Femenino',
  OTRO = 'Otro',
}

export enum TipoContrato {
  INDEFINIDO = 'Indefinido',
  PLAZO_FIJO = 'Plazo fijo',
  SERVICIOS = 'Servicios profesionales',
}

export enum EstadoEmpleado {
  ACTIVO = 'Activo',
  VACACIONES = 'Vacaciones',
  LICENCIA = 'Licencia',
  INACTIVO = 'Inactivo',
}

export const DEPARTAMENTOS = [
  'Tecnología',
  'Finanzas',
  'Recursos Humanos',
  'Ventas',
  'Marketing',
  'Operaciones',
  'Legal',
] as const;
