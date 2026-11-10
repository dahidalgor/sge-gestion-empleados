export enum Rol {
  ADMIN = 'admin',
  CONSULTA = 'consulta',
}

/** Datos que viajan dentro del JWT (payload) */
export interface JwtPayload {
  sub: number;
  usuario: string;
  nombre: string;
  rol: Rol;
}
