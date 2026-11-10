import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import bcrypt from 'bcryptjs';
import { Repository } from 'typeorm';
import { Rol } from '../common/roles.js';
import { Usuario } from './usuario.entity.js';

@Injectable()
export class UsuariosService {
  constructor(@InjectRepository(Usuario) private readonly repo: Repository<Usuario>) {}

  /** Busca un usuario incluyendo el hash de la contraseña (solo para el login) */
  findByUsuarioConPassword(usuario: string) {
    return this.repo
      .createQueryBuilder('u')
      .addSelect('u.passwordHash')
      .where('u.usuario = :usuario', { usuario })
      .getOne();
  }

  count() {
    return this.repo.count();
  }

  async crear(datos: { usuario: string; nombre: string; password: string; rol: Rol }) {
    const passwordHash = await bcrypt.hash(datos.password, 10);
    return this.repo.save(
      this.repo.create({ usuario: datos.usuario, nombre: datos.nombre, rol: datos.rol, passwordHash }),
    );
  }
}
