import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { JwtPayload } from '../common/roles.js';

/** Inyecta en el controlador el payload del JWT del usuario que hace la petición */
export const UsuarioActual = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): JwtPayload => ctx.switchToHttp().getRequest().user,
);
