import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Brackets, QueryFailedError, Repository } from 'typeorm';
import { CreateEmpleadoDto } from './dto/create-empleado.dto.js';
import { QueryEmpleadoDto } from './dto/query-empleado.dto.js';
import { UpdateEmpleadoDto } from './dto/update-empleado.dto.js';
import { EstadoEmpleado } from './empleado.enums.js';
import { Empleado } from './empleado.entity.js';
import { validarReglasEmpleado } from './reglas.js';

@Injectable()
export class EmpleadosService {
  constructor(
    @InjectRepository(Empleado) private readonly repo: Repository<Empleado>,
    private readonly config: ConfigService,
  ) {}

  private get salarioBasico() {
    return Number(this.config.get('SALARIO_BASICO', 470));
  }

  async listar(q: QueryEmpleadoDto) {
    const pagina = q.pagina ?? 1;
    const limite = q.limite ?? 10;
    const qb = this.repo.createQueryBuilder('e');

    if (q.buscar?.trim()) {
      const texto = `%${q.buscar.trim().toLowerCase()}%`;
      qb.andWhere(
        new Brackets((w) => {
          w.where('LOWER(e.nombres) LIKE :texto', { texto })
            .orWhere('LOWER(e.apellidos) LIKE :texto', { texto })
            .orWhere('e.cedula LIKE :texto', { texto })
            .orWhere('LOWER(e.email) LIKE :texto', { texto });
        }),
      );
    }
    if (q.departamento) qb.andWhere('e.departamento = :dep', { dep: q.departamento });
    if (q.estado) qb.andWhere('e.estado = :estado', { estado: q.estado });

    qb.orderBy(`e.${q.ordenarPor ?? 'apellidos'}`, q.orden ?? 'ASC')
      .addOrderBy('e.id', 'ASC')
      .skip((pagina - 1) * limite)
      .take(limite);

    const [datos, total] = await qb.getManyAndCount();
    return { datos, total, pagina, limite, paginas: Math.ceil(total / limite) };
  }

  async obtener(id: number) {
    const empleado = await this.repo.findOneBy({ id });
    if (!empleado) throw new NotFoundException(`No existe el empleado con id ${id}`);
    return empleado;
  }

  async crear(dto: CreateEmpleadoDto, usuario: string) {
    this.validar(dto);
    const empleado = this.repo.create({ ...dto, creadoPor: usuario });
    return this.guardar(empleado);
  }

  async actualizar(id: number, dto: UpdateEmpleadoDto, usuario: string) {
    const empleado = await this.obtener(id);
    // Se validan las fechas combinando los datos nuevos con los existentes
    this.validar({
      cedula: dto.cedula,
      salario: dto.salario,
      fechaNacimiento: dto.fechaNacimiento ?? empleado.fechaNacimiento,
      fechaIngreso: dto.fechaIngreso ?? empleado.fechaIngreso,
    });
    Object.assign(empleado, dto, { actualizadoPor: usuario });
    return this.guardar(empleado);
  }

  async eliminar(id: number) {
    const empleado = await this.obtener(id);
    await this.repo.remove(empleado);
    return { mensaje: `Empleado ${empleado.nombres} ${empleado.apellidos} eliminado` };
  }

  /** Datos agregados para el panel principal (presentación de la información) */
  async resumen() {
    const total = await this.repo.count();
    const porDepartamento = await this.repo
      .createQueryBuilder('e')
      .select('e.departamento', 'departamento')
      .addSelect('COUNT(*)::int', 'cantidad')
      .groupBy('e.departamento')
      .orderBy('cantidad', 'DESC')
      .getRawMany<{ departamento: string; cantidad: number }>();
    const porEstado = await this.repo
      .createQueryBuilder('e')
      .select('e.estado', 'estado')
      .addSelect('COUNT(*)::int', 'cantidad')
      .groupBy('e.estado')
      .getRawMany<{ estado: string; cantidad: number }>();
    const { nomina } = (await this.repo
      .createQueryBuilder('e')
      .select('COALESCE(SUM(e.salario), 0)::float', 'nomina')
      .where('e.estado != :inactivo', { inactivo: EstadoEmpleado.INACTIVO })
      .getRawOne<{ nomina: number }>())!;

    return { total, nominaMensual: nomina, porDepartamento, porEstado };
  }

  private validar(datos: Parameters<typeof validarReglasEmpleado>[0]) {
    const errores = validarReglasEmpleado(datos, this.salarioBasico);
    if (errores.length) throw new BadRequestException(errores);
  }

  /** Guarda y traduce la violación de campos únicos de PostgreSQL a un 409 claro */
  private async guardar(empleado: Empleado) {
    try {
      return await this.repo.save(empleado);
    } catch (e) {
      const err = e as QueryFailedError & { driverError?: { code?: string; detail?: string } };
      if (err.driverError?.code === '23505') {
        const campo = err.driverError.detail?.includes('email') ? 'email' : 'cédula';
        throw new ConflictException(`Ya existe un empleado con esa ${campo}`);
      }
      throw e;
    }
  }
}
