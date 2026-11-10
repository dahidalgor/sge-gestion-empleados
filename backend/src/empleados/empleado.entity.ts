import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { numericTransformer } from '../common/numeric.transformer.js';
import { EstadoEmpleado, Genero, TipoContrato } from './empleado.enums.js';

@Entity('empleados')
export class Empleado {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ length: 10, unique: true })
  cedula: string;

  @Column({ length: 80 })
  nombres: string;

  @Column({ length: 80 })
  apellidos: string;

  @Column({ name: 'fecha_nacimiento', type: 'date' })
  fechaNacimiento: string;

  @Column({ type: 'enum', enum: Genero })
  genero: Genero;

  @Column({ length: 120, unique: true })
  email: string;

  @Column({ length: 15 })
  telefono: string;

  @Column({ length: 200 })
  direccion: string;

  @Column({ length: 60 })
  departamento: string;

  @Column({ length: 80 })
  cargo: string;

  @Column({ name: 'fecha_ingreso', type: 'date' })
  fechaIngreso: string;

  @Column({ type: 'numeric', precision: 10, scale: 2, transformer: numericTransformer })
  salario: number;

  @Column({ name: 'tipo_contrato', type: 'enum', enum: TipoContrato })
  tipoContrato: TipoContrato;

  @Column({ type: 'enum', enum: EstadoEmpleado, default: EstadoEmpleado.ACTIVO })
  estado: EstadoEmpleado;

  // ---- Auditoría (controles del sistema) ----
  @Column({ name: 'creado_por', length: 50 })
  creadoPor: string;

  @Column({ name: 'actualizado_por', type: 'varchar', length: 50, nullable: true })
  actualizadoPor: string | null;

  @CreateDateColumn({ name: 'fecha_creacion' })
  fechaCreacion: Date;

  @UpdateDateColumn({ name: 'fecha_actualizacion' })
  fechaActualizacion: Date;
}
