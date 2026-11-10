import { Body, Controller, Get, HttpCode, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import type { JwtPayload } from '../common/roles.js';
import { AuthService } from './auth.service.js';
import { LoginDto } from './dto/login.dto.js';
import { JwtAuthGuard } from './jwt-auth.guard.js';
import { UsuarioActual } from './usuario-actual.decorator.js';

@ApiTags('Autenticación')
@Controller('auth')
export class AuthController {
  constructor(private readonly auth: AuthService) {}

  /** Recibe usuario y contraseña; devuelve el JWT */
  @Post('login')
  @HttpCode(200)
  login(@Body() dto: LoginDto) {
    return this.auth.login(dto);
  }

  /** Devuelve el contenido (payload) del token enviado: sirve para evidenciar el JWT */
  @Get('perfil')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  perfil(@UsuarioActual() usuario: JwtPayload) {
    return usuario;
  }
}
