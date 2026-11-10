/**
 * Reglas de negocio puras (sin base de datos) para poder probarlas con pruebas unitarias.
 */

/** Valida una cédula ecuatoriana (algoritmo módulo 10) */
export function esCedulaValida(cedula: string): boolean {
  if (!/^\d{10}$/.test(cedula)) return false;

  const provincia = Number(cedula.slice(0, 2));
  if (!((provincia >= 1 && provincia <= 24) || provincia === 30)) return false;
  if (Number(cedula[2]) >= 6) return false;

  const coeficientes = [2, 1, 2, 1, 2, 1, 2, 1, 2];
  const suma = coeficientes.reduce((acc, coef, i) => {
    let producto = Number(cedula[i]) * coef;
    if (producto > 9) producto -= 9;
    return acc + producto;
  }, 0);
  const verificador = (10 - (suma % 10)) % 10;
  return verificador === Number(cedula[9]);
}

/** Completa una cédula de 9 dígitos con su dígito verificador (usado para datos de prueba) */
export function completarCedula(nueveDigitos: string): string {
  const coeficientes = [2, 1, 2, 1, 2, 1, 2, 1, 2];
  const suma = coeficientes.reduce((acc, coef, i) => {
    let producto = Number(nueveDigitos[i]) * coef;
    if (producto > 9) producto -= 9;
    return acc + producto;
  }, 0);
  return nueveDigitos + ((10 - (suma % 10)) % 10);
}

/** Edad cumplida en años a una fecha dada */
export function calcularEdad(nacimiento: Date, alDia: Date = new Date()): number {
  let edad = alDia.getUTCFullYear() - nacimiento.getUTCFullYear();
  const m = alDia.getUTCMonth() - nacimiento.getUTCMonth();
  if (m < 0 || (m === 0 && alDia.getUTCDate() < nacimiento.getUTCDate())) edad--;
  return edad;
}

export interface DatosValidables {
  cedula?: string;
  fechaNacimiento?: string;
  fechaIngreso?: string;
  salario?: number;
}

/** Devuelve la lista de errores de negocio (vacía si todo es correcto) */
export function validarReglasEmpleado(
  datos: DatosValidables,
  salarioBasico: number,
  hoy: Date = new Date(),
): string[] {
  const errores: string[] = [];

  if (datos.cedula !== undefined && !esCedulaValida(datos.cedula)) {
    errores.push('La cédula no es una cédula ecuatoriana válida');
  }

  const nacimiento = datos.fechaNacimiento ? new Date(datos.fechaNacimiento) : undefined;
  const ingreso = datos.fechaIngreso ? new Date(datos.fechaIngreso) : undefined;

  if (nacimiento && calcularEdad(nacimiento, hoy) < 18) {
    errores.push('El empleado debe ser mayor de edad (18 años o más)');
  }
  if (ingreso && ingreso > hoy) {
    errores.push('La fecha de ingreso no puede ser futura');
  }
  if (nacimiento && ingreso && calcularEdad(nacimiento, ingreso) < 18) {
    errores.push('A la fecha de ingreso el empleado debía tener al menos 18 años');
  }
  if (datos.salario !== undefined && datos.salario < salarioBasico) {
    errores.push(`El salario no puede ser menor al salario básico ($${salarioBasico})`);
  }

  return errores;
}
