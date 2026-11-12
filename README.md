# SGE · Sistema de Gestión de Empleados

Proyecto práctico de **Desarrollo de Aplicaciones en Sistemas de Información** (PUCE).

Aplicación web con:

1. **Pantalla de login**
2. **JSON Web Token (JWT)** para controlar la sesión
3. **CRUD de empleados** (14 campos + auditoría) al que solo se accede con un JWT válido

| Capa | Tecnología |
|---|---|
| Frontend | Vue 3 + Vite, Vue Router, Pinia, Axios |
| Backend (API REST) | NestJS, Passport JWT, bcrypt, class-validator, Swagger |
| Base de datos | PostgreSQL + TypeORM |
| Pruebas | Vitest (pruebas unitarias del backend) |

---

## Cómo ejecutarlo

Requisitos: Node.js 22+ y PostgreSQL (en esta máquina: `/Library/PostgreSQL/18`).

```bash
npm run instalar      # instala dependencias (solo la primera vez)
npm run db:crear      # crea un servidor PostgreSQL local en ./.pgdata, puerto 5433 (solo la primera vez)
npm run dev           # inicia base de datos + API + frontend en una sola terminal
```

`npm run dev` enciende PostgreSQL si está apagado y luego corre el API (http://localhost:3000/api) y la app (http://localhost:5173) juntos; `Ctrl+C` detiene ambos. Para apagar la base de datos: `npm run db:detener`.

Si se prefiere por separado: `npm run db:iniciar`, `npm run api` y `npm run web` en terminales distintas.

Al arrancar por primera vez, el API crea las tablas y carga datos de muestra:

| Usuario | Contraseña | Rol | Permisos |
|---|---|---|---|
| `admin` | `Admin123*` | admin | ver, crear, editar, eliminar |
| `consulta` | `Consulta123*` | consulta | solo ver |

- Documentación del API (Swagger): http://localhost:3000/api/docs
- Pruebas unitarias: `npm test`
- Para usar otro servidor PostgreSQL, editar `backend/.env` (`DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD`, `DB_NAME`).

---

## Cómo funciona el JWT

```
 Vue (login)            NestJS                        PostgreSQL
     │  POST /api/auth/login {usuario, password}          │
     │ ─────────────────────▶ bcrypt.compare(...) ◀──────▶│ usuarios
     │ ◀──────────────────── { access_token: "eyJ..." }    │
     │                                                    │
     │  GET /api/empleados                                │
     │  Authorization: Bearer eyJ...                      │
     │ ─────────────────────▶ JwtAuthGuard (firma + exp)  │
     │                        RolesGuard (rol del token)  │
     │ ◀──────────────────── 200 datos | 401 | 403 ◀─────▶│ empleados
```

**Backend**
- `auth.service.ts`: valida la contraseña con bcrypt y firma el token (HS256, expira en 1 h) con `sub`, `usuario`, `nombre` y `rol`.
- `jwt.strategy.ts` y `jwt-auth.guard.ts`: leen el encabezado `Authorization: Bearer …` y verifican la firma y la expiración. Sin token válido responden **401**.
- `roles.guard.ts`: crear, editar y eliminar requieren `rol = admin` dentro del token; si no, responden **403**.
- `creado_por` y `actualizado_por` se llenan con el usuario que viene en el token (auditoría).

**Frontend**
- `stores/auth.js`: guarda el token y decodifica su payload (usuario, rol, expiración).
- `services/api.js`: un interceptor de Axios agrega el token a cada petición. Si el API responde 401, se cierra la sesión.
- `router/index.js`: la guardia de navegación solo deja ver el login si no hay un token vigente.
- La cabecera muestra una cuenta regresiva hasta que expira el token.
- La pantalla **Sesión JWT** muestra el token dividido en sus 3 partes y permite llamar al API con y sin token para ver el 200 y el 401.

---

## Tabla `empleados`

| # | Campo | Tipo | Regla |
|---|---|---|---|
| 1 | cedula | varchar(10) | única, cédula ecuatoriana válida (módulo 10) |
| 2 | nombres | varchar(80) | obligatorio |
| 3 | apellidos | varchar(80) | obligatorio |
| 4 | fecha_nacimiento | date | mayor de edad |
| 5 | genero | enum | Masculino / Femenino / Otro |
| 6 | email | varchar(120) | único, formato email |
| 7 | telefono | varchar(15) | formato ecuatoriano (0XXXXXXXXX) |
| 8 | direccion | varchar(200) | obligatorio |
| 9 | departamento | varchar(60) | lista cerrada |
| 10 | cargo | varchar(80) | obligatorio |
| 11 | fecha_ingreso | date | no futura; 18 años o más al ingresar |
| 12 | salario | numeric(10,2) | ≥ salario básico (`SALARIO_BASICO` en `.env`) |
| 13 | tipo_contrato | enum | Indefinido / Plazo fijo / Servicios profesionales |
| 14 | estado | enum | Activo / Vacaciones / Licencia / Inactivo |
| – | creado_por, actualizado_por, fecha_creacion, fecha_actualizacion | auditoría | automáticos |

## Endpoints

| Método | Ruta | Protección |
|---|---|---|
| POST | `/api/auth/login` | pública |
| GET | `/api/auth/perfil` | JWT |
| GET | `/api/empleados?buscar=&departamento=&estado=&ordenarPor=&orden=&pagina=&limite=` | JWT |
| GET | `/api/empleados/resumen` | JWT |
| GET | `/api/empleados/:id` | JWT |
| POST | `/api/empleados` | JWT + rol admin |
| PATCH | `/api/empleados/:id` | JWT + rol admin |
| DELETE | `/api/empleados/:id` | JWT + rol admin |

---

## Relación con el sílabo

| Tema | Dónde se aplica |
|---|---|
| 1.03 Middleware | El API REST (NestJS) actúa como middleware entre la interfaz y la base de datos |
| 2.02 Metodologías: prototipos / RAD | Desarrollo incremental: login → JWT → CRUD → pruebas |
| 2.06 Control de versiones | Repositorio Git |
| 3.02 Contratación del personal | Dominio del sistema: gestión de empleados |
| 3.03 Preparación de datos | Carga automática de datos de muestra (`seed.service.ts`) |
| 3.04 Pruebas unitarias | `*.spec.ts`: reglas de negocio, generación de JWT, control por roles |
| 3.06 Documentación y reporte de errores | README, Swagger y mensajes de error claros |
| 5.04 / 5.05 Almacenamiento e integridad de datos | PostgreSQL, restricciones UNIQUE y ENUM, validación en cliente y servidor |
| 5.07 Presentación de la información | Panel con indicadores, tabla con búsqueda, filtros, orden y paginación |
| 6.01 Diseño de sistemas de seguridad | bcrypt, JWT, guards, roles |
| 6.02 Prevención y corrección de errores | Validaciones, 400/401/403/404/409 con mensajes en español |
| 6.04 Controles de sistemas | Campos de auditoría y expiración de la sesión |

## Estructura

```
backend/src/
  auth/        login, JWT (strategy, guard), roles
  usuarios/    entidad y servicio de usuarios
  empleados/   entidad, DTOs, reglas de negocio, servicio, controlador
  seed/        datos de muestra
frontend/src/
  views/       Login, Layout, Panel, Empleados, Sesión JWT
  components/  formulario de empleado, diálogo de confirmación, avisos
  services/    cliente Axios con interceptores del JWT
  stores/      sesión (Pinia)
  router/      rutas protegidas
```
