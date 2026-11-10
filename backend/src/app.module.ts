import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from './auth/auth.module.js';
import { EmpleadosModule } from './empleados/empleados.module.js';
import { SeedModule } from './seed/seed.module.js';
import { UsuariosModule } from './usuarios/usuarios.module.js';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        type: 'postgres',
        host: config.get('DB_HOST', 'localhost'),
        port: Number(config.get('DB_PORT', 5432)),
        username: config.get('DB_USER', 'postgres'),
        password: config.get('DB_PASSWORD', ''),
        database: config.get('DB_NAME', 'sge_empleados'),
        autoLoadEntities: true,
        // Crea/actualiza las tablas a partir de las entidades (solo para desarrollo)
        synchronize: true,
      }),
    }),
    UsuariosModule,
    AuthModule,
    EmpleadosModule,
    SeedModule,
  ],
})
export class AppModule {}
