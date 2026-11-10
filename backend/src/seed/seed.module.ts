import { Module } from '@nestjs/common';
import { EmpleadosModule } from '../empleados/empleados.module.js';
import { UsuariosModule } from '../usuarios/usuarios.module.js';
import { SeedService } from './seed.service.js';

@Module({
  imports: [UsuariosModule, EmpleadosModule],
  providers: [SeedService],
})
export class SeedModule {}
