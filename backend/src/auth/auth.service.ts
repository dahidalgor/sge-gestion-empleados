import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import bcrypt from 'bcryptjs';
import { JwtPayload } from '../common/roles.js';
import { UsuariosService } from '../usuarios/usuarios.service.js';
import { LoginDto } from './dto/login.dto.js';

@Injectable()
export class AuthService {
  constructor(
    private readonly usuarios: UsuariosService,
    private readonly jwt: JwtService,
  ) {}

  /** Valida credenciales y genera el JSON Web Token de la sesión */
  async login({ usuario, password }: LoginDto) {
    const encontrado = await this.usuarios.findByUsuarioConPassword(usuario);
    const valido = encontrado?.activo && (await bcrypt.compare(password, encontrado.passwordHash));

    // Mismo mensaje en ambos casos para no revelar qué usuarios existen
    if (!encontrado || !valido) {
      throw new UnauthorizedException('Usuario o contraseña incorrectos');
    }

    const payload: JwtPayload = {
      sub: encontrado.id,
      usuario: encontrado.usuario,
      nombre: encontrado.nombre,
      rol: encontrado.rol,
    };
    const accessToken = await this.jwt.signAsync(payload);
    const { exp } = this.jwt.decode<{ exp: number }>(accessToken);

    return {
      access_token: accessToken,
      token_type: 'Bearer',
      expira_en: new Date(exp * 1000).toISOString(),
      usuario: { id: payload.sub, usuario: payload.usuario, nombre: payload.nombre, rol: payload.rol },
    };
  }
}
