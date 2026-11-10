import { UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import bcrypt from 'bcryptjs';
import { Rol } from '../common/roles.js';
import type { UsuariosService } from '../usuarios/usuarios.service.js';
import { AuthService } from './auth.service.js';

describe('AuthService', () => {
  const jwt = new JwtService({ secret: 'secreto-de-prueba', signOptions: { expiresIn: '1h' } });
  let usuarios: { findByUsuarioConPassword: ReturnType<typeof vi.fn> };
  let service: AuthService;

  beforeEach(async () => {
    const passwordHash = await bcrypt.hash('Clave123*', 4);
    usuarios = {
      findByUsuarioConPassword: vi.fn(async (u: string) =>
        u === 'admin'
          ? { id: 1, usuario: 'admin', nombre: 'Administrador', rol: Rol.ADMIN, activo: true, passwordHash }
          : null,
      ),
    };
    service = new AuthService(usuarios as unknown as UsuariosService, jwt);
  });

  it('genera un JWT válido con los datos del usuario', async () => {
    const r = await service.login({ usuario: 'admin', password: 'Clave123*' });

    expect(r.token_type).toBe('Bearer');
    const payload = await jwt.verifyAsync(r.access_token);
    expect(payload).toMatchObject({ sub: 1, usuario: 'admin', rol: 'admin' });
    expect(payload.exp - payload.iat).toBe(3600);
  });

  it('rechaza una contraseña incorrecta', async () => {
    await expect(service.login({ usuario: 'admin', password: 'mala' })).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it('rechaza un usuario inexistente con el mismo mensaje', async () => {
    await expect(service.login({ usuario: 'nadie', password: 'x' })).rejects.toThrow('Usuario o contraseña incorrectos');
  });

  it('un token firmado con otro secreto no es válido', async () => {
    const r = await service.login({ usuario: 'admin', password: 'Clave123*' });
    const otro = new JwtService({ secret: 'otro-secreto' });
    await expect(otro.verifyAsync(r.access_token)).rejects.toThrow();
  });
});
