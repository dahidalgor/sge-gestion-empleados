import { SetMetadata } from '@nestjs/common';
import { Rol } from '../common/roles.js';

export const ROLES_KEY = 'roles';
export const Roles = (...roles: Rol[]) => SetMetadata(ROLES_KEY, roles);
