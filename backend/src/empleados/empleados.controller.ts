import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard.js';
import { Roles } from '../auth/roles.decorator.js';
import { RolesGuard } from '../auth/roles.guard.js';
import { UsuarioActual } from '../auth/usuario-actual.decorator.js';
import { Rol } from '../common/roles.js';
import type { JwtPayload } from '../common/roles.js';
import { CreateEmpleadoDto } from './dto/create-empleado.dto.js';
import { QueryEmpleadoDto } from './dto/query-empleado.dto.js';
import { UpdateEmpleadoDto } from './dto/update-empleado.dto.js';
import { EmpleadosService } from './empleados.service.js';

/**
 * Todas las rutas requieren un JWT válido (JwtAuthGuard).
 * Crear, editar y eliminar además requieren rol "admin" dentro del token (RolesGuard).
 */
@ApiTags('Empleados')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('empleados')
export class EmpleadosController {
  constructor(private readonly empleados: EmpleadosService) {}

  @Get()
  listar(@Query() query: QueryEmpleadoDto) {
    return this.empleados.listar(query);
  }

  @Get('resumen')
  resumen() {
    return this.empleados.resumen();
  }

  @Get(':id')
  obtener(@Param('id', ParseIntPipe) id: number) {
    return this.empleados.obtener(id);
  }

  @Post()
  @Roles(Rol.ADMIN)
  crear(@Body() dto: CreateEmpleadoDto, @UsuarioActual() usuario: JwtPayload) {
    return this.empleados.crear(dto, usuario.usuario);
  }

  @Patch(':id')
  @Roles(Rol.ADMIN)
  actualizar(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateEmpleadoDto,
    @UsuarioActual() usuario: JwtPayload,
  ) {
    return this.empleados.actualizar(id, dto, usuario.usuario);
  }

  @Delete(':id')
  @Roles(Rol.ADMIN)
  eliminar(@Param('id', ParseIntPipe) id: number) {
    return this.empleados.eliminar(id);
  }
}
