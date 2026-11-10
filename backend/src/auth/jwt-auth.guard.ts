import { Injectable, UnauthorizedException } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

/** Bloquea con 401 toda petición sin un JWT válido */
@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  handleRequest<T>(err: unknown, user: T, info: { name?: string } | undefined): T {
    if (err || !user) {
      const mensaje =
        info?.name === 'TokenExpiredError'
          ? 'La sesión expiró, vuelva a iniciar sesión'
          : 'Token ausente o inválido';
      throw new UnauthorizedException(mensaje);
    }
    return user;
  }
}
