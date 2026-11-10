import { ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Rol } from '../common/roles.js';
import { RolesGuard } from './roles.guard.js';

function contexto(rol?: Rol): ExecutionContext {
  return {
    getHandler: () => () => undefined,
    getClass: () => class {},
    switchToHttp: () => ({ getRequest: () => ({ user: rol ? { rol } : undefined }) }),
  } as unknown as ExecutionContext;
}

describe('RolesGuard', () => {
  const reflector = new Reflector();
  const guard = new RolesGuard(reflector);

  it('permite el acceso si la ruta no exige roles', () => {
    vi.spyOn(reflector, 'getAllAndOverride').mockReturnValue(undefined);
    expect(guard.canActivate(contexto(Rol.CONSULTA))).toBe(true);
  });

  it('permite al admin en rutas de admin', () => {
    vi.spyOn(reflector, 'getAllAndOverride').mockReturnValue([Rol.ADMIN]);
    expect(guard.canActivate(contexto(Rol.ADMIN))).toBe(true);
  });

  it('bloquea con 403 al rol consulta en rutas de admin', () => {
    vi.spyOn(reflector, 'getAllAndOverride').mockReturnValue([Rol.ADMIN]);
    expect(() => guard.canActivate(contexto(Rol.CONSULTA))).toThrow(ForbiddenException);
  });
});
