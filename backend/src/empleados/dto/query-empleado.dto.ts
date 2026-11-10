import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsEnum, IsIn, IsInt, IsOptional, IsString, Max, Min } from 'class-validator';
import { DEPARTAMENTOS, EstadoEmpleado } from '../empleado.enums.js';

export const CAMPOS_ORDEN = ['apellidos', 'cedula', 'departamento', 'cargo', 'fechaIngreso', 'salario', 'estado'] as const;

export class QueryEmpleadoDto {
  @ApiPropertyOptional({ description: 'Busca por nombres, apellidos, cédula o email' })
  @IsOptional()
  @IsString()
  buscar?: string;

  @ApiPropertyOptional({ enum: DEPARTAMENTOS })
  @IsOptional()
  @IsIn(DEPARTAMENTOS)
  departamento?: string;

  @ApiPropertyOptional({ enum: EstadoEmpleado })
  @IsOptional()
  @IsEnum(EstadoEmpleado)
  estado?: EstadoEmpleado;

  @ApiPropertyOptional({ enum: CAMPOS_ORDEN, default: 'apellidos' })
  @IsOptional()
  @IsIn(CAMPOS_ORDEN)
  ordenarPor?: (typeof CAMPOS_ORDEN)[number];

  @ApiPropertyOptional({ enum: ['ASC', 'DESC'], default: 'ASC' })
  @IsOptional()
  @IsIn(['ASC', 'DESC'])
  orden?: 'ASC' | 'DESC';

  @ApiPropertyOptional({ default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  pagina?: number;

  @ApiPropertyOptional({ default: 10 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limite?: number;
}
