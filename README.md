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

**Documentación de entrega:** [Manual de instalación (PDF)](docs/Manual%20de%20instalacion%20-%20SGE.pdf) · [Manual de usuario (PDF)](docs/Manual%20de%20usuario%20-%20SGE.pdf). Los PDF se generan desde `docs/fuente/`.

---

## Cómo ejecutarlo

Requisitos: Node.js 22+ y PostgreSQL 16+ (Windows, macOS o Linux). Los scripts encuentran PostgreSQL solos; si no, indicar su carpeta `bin` en la variable `PG_BIN`.

```bash
npm run instalar      # dependencias + backend/.env y frontend/.env (solo la primera vez)
npm run db:crear      # servidor PostgreSQL propio en ./.pgdata (puerto 5433) + base + restaura el respaldo
npm run dev           # base de datos + API + frontend en una sola terminal
```

`npm run preparar` hace los dos primeros pasos juntos. Con un PostgreSQL ya instalado: ajustar `DB_PORT`/`DB_PASSWORD` en `backend/.env` y usar `npm run db:restaurar` en lugar de `db:crear`.

### Entregar el proyecto a otra computadora

```bash
npm run empaquetar    # respalda la base y genera entrega/SGE-gestion-empleados.zip
```

El zip lleva el código, los manuales y `respaldo/sge_empleados.sql` (la base completa, con usuarios y empleados reales). En la otra computadora se descomprime y se siguen los tres comandos de arriba. Otros comandos: `npm run db:respaldar`, `npm run db:restaurar` (no reemplaza una base con datos salvo con `-- --forzar`), `npm run db:iniciar`, `npm run db:detener`.

> `respaldo/` y `entrega/` están en `.gitignore` porque contienen datos reales: el zip se entrega por un medio privado.

Si no se restauró ningún respaldo, al arrancar por primera vez el API crea las tablas y carga datos de muestra:

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
  seed/        datos de muestra (solo si la base está vacía)
frontend/src/
  views/       Login, Layout, Panel, Empleados, Sesión JWT
  components/  formulario de empleado, diálogo de confirmación, avisos
  services/    cliente Axios con interceptores del JWT
  stores/      sesión (Pinia)
  router/      rutas protegidas
scripts/       base de datos (crear, respaldar, restaurar) y empaquetado del zip
```
