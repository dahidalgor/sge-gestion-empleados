import { Injectable, Logger, OnApplicationBootstrap } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Rol } from '../common/roles.js';
import { EstadoEmpleado, Genero, TipoContrato } from '../empleados/empleado.enums.js';
import { Empleado } from '../empleados/empleado.entity.js';
import { completarCedula } from '../empleados/reglas.js';
import { UsuariosService } from '../usuarios/usuarios.service.js';

/** Carga datos de muestra la primera vez que arranca el sistema (preparación de datos) */
@Injectable()
export class SeedService implements OnApplicationBootstrap {
  private readonly logger = new Logger('Seed');

  constructor(
    private readonly usuarios: UsuariosService,
    @InjectRepository(Empleado) private readonly empleados: Repository<Empleado>,
  ) {}

  async onApplicationBootstrap() {
    if ((await this.usuarios.count()) === 0) {
      await this.usuarios.crear({ usuario: 'admin', nombre: 'Administrador', password: 'Admin123*', rol: Rol.ADMIN });
      await this.usuarios.crear({ usuario: 'consulta', nombre: 'Usuario de Consulta', password: 'Consulta123*', rol: Rol.CONSULTA });
      this.logger.log('Usuarios de prueba creados: admin / Admin123*  ·  consulta / Consulta123*');
    }

    if ((await this.empleados.count()) === 0) {
      await this.empleados.save(EMPLEADOS_MUESTRA.map((e) => this.empleados.create({ ...e, creadoPor: 'sistema' })));
      this.logger.log(`${EMPLEADOS_MUESTRA.length} empleados de muestra creados`);
    }
  }
}

const { MASCULINO: M, FEMENINO: F } = Genero;
const { INDEFINIDO, PLAZO_FIJO, SERVICIOS } = TipoContrato;
const { ACTIVO, VACACIONES, LICENCIA, INACTIVO } = EstadoEmpleado;

// [nombres, apellidos, género, nacimiento, departamento, cargo, ingreso, salario, contrato, estado]
const filas: [string, string, Genero, string, string, string, string, number, TipoContrato, EstadoEmpleado][] = [
  ['Carlos Andrés', 'Mora Salazar', M, '1985-02-14', 'Tecnología', 'Jefe de Sistemas', '2012-06-01', 2800, INDEFINIDO, ACTIVO],
  ['Daniela', 'Vásquez Ruiz', F, '1992-07-30', 'Tecnología', 'Desarrolladora Full Stack', '2019-03-11', 1650, INDEFINIDO, ACTIVO],
  ['Luis Fernando', 'Paredes León', M, '1996-11-05', 'Tecnología', 'Analista de Soporte', '2021-08-02', 950, PLAZO_FIJO, ACTIVO],
  ['Gabriela', 'Torres Cevallos', F, '1988-04-22', 'Finanzas', 'Contadora General', '2015-01-15', 1900, INDEFINIDO, ACTIVO],
  ['Jorge', 'Herrera Villacís', M, '1979-09-09', 'Finanzas', 'Director Financiero', '2010-10-04', 3500, INDEFINIDO, VACACIONES],
  ['Paola', 'Jaramillo Ortiz', F, '1998-01-18', 'Finanzas', 'Asistente Contable', '2023-02-06', 650, PLAZO_FIJO, ACTIVO],
  ['Andrea', 'Cárdenas Pazmiño', F, '1990-12-03', 'Recursos Humanos', 'Jefa de Talento Humano', '2016-05-23', 2100, INDEFINIDO, ACTIVO],
  ['Miguel Ángel', 'Rosero Benítez', M, '1994-06-27', 'Recursos Humanos', 'Analista de Nómina', '2020-09-14', 1100, INDEFINIDO, LICENCIA],
  ['Sofía', 'Navarrete Guzmán', F, '1999-03-12', 'Ventas', 'Ejecutiva Comercial', '2022-04-18', 800, PLAZO_FIJO, ACTIVO],
  ['Diego', 'Castillo Andrade', M, '1987-08-19', 'Ventas', 'Gerente de Ventas', '2014-11-03', 2600, INDEFINIDO, ACTIVO],
  ['Valeria', 'Espinoza Lara', F, '1995-10-08', 'Ventas', 'Ejecutiva Comercial', '2021-01-25', 850, INDEFINIDO, ACTIVO],
  ['Ricardo', 'Montalvo Ponce', M, '1991-05-16', 'Marketing', 'Especialista en Marketing Digital', '2018-07-09', 1350, INDEFINIDO, ACTIVO],
  ['Camila', 'Proaño Silva', F, '2000-02-29', 'Marketing', 'Diseñadora Gráfica', '2024-01-08', 750, SERVICIOS, ACTIVO],
  ['Fernando', 'Guerrero Ayala', M, '1983-12-21', 'Operaciones', 'Jefe de Operaciones', '2011-03-14', 2400, INDEFINIDO, ACTIVO],
  ['Natalia', 'Ríos Mejía', F, '1997-09-01', 'Operaciones', 'Coordinadora Logística', '2022-10-10', 1000, PLAZO_FIJO, VACACIONES],
  ['Esteban', 'Zambrano Calle', M, '1993-03-25', 'Operaciones', 'Supervisor de Bodega', '2017-12-04', 900, INDEFINIDO, INACTIVO],
  ['Lucía', 'Benavides Romo', F, '1986-06-11', 'Legal', 'Abogada Corporativa', '2013-08-19', 2300, INDEFINIDO, ACTIVO],
  ['Mateo', 'Cueva Sánchez', M, '2001-08-14', 'Legal', 'Asistente Legal', '2024-06-03', 600, PLAZO_FIJO, ACTIVO],
  ['Isabel', 'Ortega Naranjo', F, '1989-01-07', 'Tecnología', 'Administradora de Base de Datos', '2016-02-29', 1950, INDEFINIDO, ACTIVO],
  ['Sebastián', 'Villota Égüez', M, '1997-04-30', 'Tecnología', 'Desarrollador Frontend', '2023-09-11', 1200, SERVICIOS, ACTIVO],
];

const quitarTildes = (s: string) => s.normalize('NFD').replace(/[̀-ͯ]/g, '');

const EMPLEADOS_MUESTRA = filas.map(
  ([nombres, apellidos, genero, fechaNacimiento, departamento, cargo, fechaIngreso, salario, tipoContrato, estado], i) => {
    const provincia = String((i % 24) + 1).padStart(2, '0');
    const correo = `${quitarTildes(nombres.split(' ')[0])}.${quitarTildes(apellidos.split(' ')[0])}`.toLowerCase();
    return {
      // provincia (2) + tercer dígito < 6 (1) + secuencia (6) + verificador
      cedula: completarCedula(`${provincia}${i % 6}${String(100000 + i * 43731).slice(-6)}`),
      nombres,
      apellidos,
      fechaNacimiento,
      genero,
      email: `${correo}@empresa.ec`,
      telefono: `09${String(81234567 + i * 1031).slice(0, 8)}`,
      direccion: `Calle ${i + 1} y Av. Amazonas, Quito`,
      departamento,
      cargo,
      fechaIngreso,
      salario,
      tipoContrato,
      estado,
    };
  },
);
