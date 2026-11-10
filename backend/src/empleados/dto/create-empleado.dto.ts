import { ApiProperty } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import {
  IsDateString,
  IsEmail,
  IsEnum,
  IsIn,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  Min,
} from 'class-validator';
import { DEPARTAMENTOS, EstadoEmpleado, Genero, TipoContrato } from '../empleado.enums.js';

const trim = ({ value }: { value: unknown }) => (typeof value === 'string' ? value.trim() : value);

export class CreateEmpleadoDto {
  @ApiProperty({ example: '1710034065' })
  @Matches(/^\d{10}$/, { message: 'La cédula debe tener 10 dígitos' })
  cedula: string;

  @ApiProperty({ example: 'María José' })
  @Transform(trim)
  @IsString()
  @IsNotEmpty({ message: 'Los nombres son obligatorios' })
  @MaxLength(80)
  nombres: string;

  @ApiProperty({ example: 'Andrade Pérez' })
  @Transform(trim)
  @IsString()
  @IsNotEmpty({ message: 'Los apellidos son obligatorios' })
  @MaxLength(80)
  apellidos: string;

  @ApiProperty({ example: '1995-04-12' })
  @IsDateString({}, { message: 'Fecha de nacimiento inválida (AAAA-MM-DD)' })
  fechaNacimiento: string;

  @ApiProperty({ enum: Genero })
  @IsEnum(Genero, { message: 'Género inválido' })
  genero: Genero;

  @ApiProperty({ example: 'maria.andrade@empresa.ec' })
  @Transform(({ value }) => (typeof value === 'string' ? value.trim().toLowerCase() : value))
  @IsEmail({}, { message: 'Email inválido' })
  @MaxLength(120)
  email: string;

  @ApiProperty({ example: '0991234567' })
  @Matches(/^0\d{8,9}$/, { message: 'Teléfono inválido (ej. 0991234567 o 022345678)' })
  telefono: string;

  @ApiProperty({ example: 'Av. 12 de Octubre N24-563, Quito' })
  @Transform(trim)
  @IsString()
  @IsNotEmpty({ message: 'La dirección es obligatoria' })
  @MaxLength(200)
  direccion: string;

  @ApiProperty({ enum: DEPARTAMENTOS })
  @IsIn(DEPARTAMENTOS, { message: 'Departamento inválido' })
  departamento: string;

  @ApiProperty({ example: 'Analista de Sistemas' })
  @Transform(trim)
  @IsString()
  @IsNotEmpty({ message: 'El cargo es obligatorio' })
  @MaxLength(80)
  cargo: string;

  @ApiProperty({ example: '2022-03-01' })
  @IsDateString({}, { message: 'Fecha de ingreso inválida (AAAA-MM-DD)' })
  fechaIngreso: string;

  @ApiProperty({ example: 1200.5 })
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 }, { message: 'Salario inválido' })
  @Min(0)
  salario: number;

  @ApiProperty({ enum: TipoContrato })
  @IsEnum(TipoContrato, { message: 'Tipo de contrato inválido' })
  tipoContrato: TipoContrato;

  @ApiProperty({ enum: EstadoEmpleado, required: false })
  @IsOptional()
  @IsEnum(EstadoEmpleado, { message: 'Estado inválido' })
  estado?: EstadoEmpleado;
}
