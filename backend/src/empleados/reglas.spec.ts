import { calcularEdad, completarCedula, esCedulaValida, validarReglasEmpleado } from './reglas.js';

describe('Reglas de negocio de empleados', () => {
  describe('esCedulaValida', () => {
    it('acepta una cédula ecuatoriana válida', () => {
      expect(esCedulaValida('1710034065')).toBe(true);
    });

    it('rechaza un dígito verificador incorrecto', () => {
      expect(esCedulaValida('1710034066')).toBe(false);
    });

    it('rechaza longitud, caracteres o provincia inválidos', () => {
      expect(esCedulaValida('171003406')).toBe(false);
      expect(esCedulaValida('17100340AB')).toBe(false);
      expect(esCedulaValida('2510034065')).toBe(false); // provincia 25 no existe
    });

    it('completarCedula genera siempre cédulas válidas', () => {
      for (let i = 0; i < 50; i++) {
        const base = `${String((i % 24) + 1).padStart(2, '0')}${i % 6}${String(100000 + i * 4373).slice(-6)}`;
        expect(esCedulaValida(completarCedula(base))).toBe(true);
      }
    });
  });

  describe('calcularEdad', () => {
    it('cuenta solo años cumplidos', () => {
      const hoy = new Date('2026-06-15');
      expect(calcularEdad(new Date('2000-06-15'), hoy)).toBe(26);
      expect(calcularEdad(new Date('2000-06-16'), hoy)).toBe(25);
    });
  });

  describe('validarReglasEmpleado', () => {
    const hoy = new Date('2026-11-10');
    const valido = { cedula: '1710034065', fechaNacimiento: '1990-01-01', fechaIngreso: '2020-01-01', salario: 800 };

    it('no devuelve errores para datos correctos', () => {
      expect(validarReglasEmpleado(valido, 470, hoy)).toEqual([]);
    });

    it('rechaza menores de edad', () => {
      const errores = validarReglasEmpleado({ ...valido, fechaNacimiento: '2010-01-01' }, 470, hoy);
      expect(errores).toContain('El empleado debe ser mayor de edad (18 años o más)');
    });

    it('rechaza salario menor al básico', () => {
      const errores = validarReglasEmpleado({ ...valido, salario: 300 }, 470, hoy);
      expect(errores[0]).toMatch(/salario básico/);
    });

    it('rechaza fecha de ingreso futura', () => {
      const errores = validarReglasEmpleado({ ...valido, fechaIngreso: '2027-01-01' }, 470, hoy);
      expect(errores).toContain('La fecha de ingreso no puede ser futura');
    });

    it('valida solo los campos enviados (edición parcial)', () => {
      expect(validarReglasEmpleado({ salario: 1000 }, 470, hoy)).toEqual([]);
    });
  });
});
