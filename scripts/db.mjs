// Administración de la base de datos del proyecto (Windows, macOS y Linux; solo requiere Node.js)
//
//   node scripts/db.mjs crear       crea el servidor local en .pgdata, la base y restaura el respaldo
//   node scripts/db.mjs iniciar     enciende el servidor local
//   node scripts/db.mjs asegurar    lo enciende solo si está apagado (lo usa "npm run dev")
//   node scripts/db.mjs detener     apaga el servidor local
//   node scripts/db.mjs respaldar   guarda la base completa en respaldo/sge_empleados.sql
//   node scripts/db.mjs restaurar   carga respaldo/sge_empleados.sql en la base configurada
import { spawnSync } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { ES_WINDOWS, RAIZ, conectar, configuracionBD, ejecutar, programa } from './postgres.mjs';
import { generarRespaldo } from './respaldo.mjs';

const CARPETA_DATOS = path.join(RAIZ, '.pgdata');
const ARCHIVO_RESPALDO = path.join(RAIZ, 'respaldo', 'sge_empleados.sql');
const bd = configuracionBD();

function servidorLocalEncendido() {
  const resultado = spawnSync(programa('pg_ctl'), ['-D', CARPETA_DATOS, 'status'], { stdio: 'ignore' });
  return resultado.status === 0;
}

function iniciar() {
  // En macOS y Linux el socket se crea en /tmp para no necesitar permisos de administrador
  let opcionesServidor = `-p ${bd.puerto}`;
  if (!ES_WINDOWS) opcionesServidor += ' -k /tmp';
  ejecutar(programa('pg_ctl'), ['-D', CARPETA_DATOS, '-o', opcionesServidor, '-l', path.join(CARPETA_DATOS, 'server.log'), '-w', 'start']);
}

async function crearBaseSiNoExiste() {
  const cliente = await conectar('postgres');
  const resultado = await cliente.query('SELECT 1 FROM pg_database WHERE datname = $1', [bd.nombre]);
  if (resultado.rowCount === 0) {
    await cliente.query(`CREATE DATABASE "${bd.nombre}"`);
    console.log(`Base de datos "${bd.nombre}" creada.`);
  }
  await cliente.end();
}

async function crear() {
  if (existsSync(CARPETA_DATOS)) {
    console.log('El servidor local ya existe en .pgdata (no se modifica).');
  } else {
    ejecutar(programa('initdb'), ['-D', CARPETA_DATOS, '-U', 'postgres', '--auth=trust', '-E', 'UTF8', '--locale=C']);
  }
  if (!servidorLocalEncendido()) iniciar();
  await crearBaseSiNoExiste();
  if (existsSync(ARCHIVO_RESPALDO)) await restaurar();
}

function asegurar() {
  if (!existsSync(CARPETA_DATOS)) {
    console.log('No hay servidor local en .pgdata: se usará el PostgreSQL configurado en backend/.env');
    return;
  }
  if (!servidorLocalEncendido()) iniciar();
}

function detener() {
  ejecutar(programa('pg_ctl'), ['-D', CARPETA_DATOS, 'stop']);
}

/** Texto con la cantidad de filas de cada tabla, p. ej. "21 empleados, 2 usuarios" */
function describir(resumen) {
  return Object.entries(resumen)
    .map(([tabla, cantidad]) => `${cantidad} ${tabla}`)
    .join(', ');
}

async function respaldar() {
  const cliente = await conectar(bd.nombre);
  const { sql, resumen } = await generarRespaldo(cliente);
  await cliente.end();

  const encabezado = `-- Respaldo de la base "${bd.nombre}" del SGE generado el ${new Date().toLocaleString('es-EC')}\n-- Restaurar con: npm run db:restaurar\n\n`;
  mkdirSync(path.dirname(ARCHIVO_RESPALDO), { recursive: true });
  writeFileSync(ARCHIVO_RESPALDO, encabezado + sql);
  console.log(`Respaldo guardado en respaldo/sge_empleados.sql (${describir(resumen)}).`);
}

async function restaurar() {
  if (!existsSync(ARCHIVO_RESPALDO)) {
    console.error('No existe respaldo/sge_empleados.sql. Primero ejecute "npm run db:respaldar" en la computadora de origen.');
    process.exit(1);
  }
  await crearBaseSiNoExiste();
  const cliente = await conectar(bd.nombre);

  // Protección: si la base ya tiene empleados, no se reemplaza sin confirmarlo
  const tabla = await cliente.query("SELECT to_regclass('public.empleados') IS NOT NULL AS existe");
  if (tabla.rows[0].existe && !process.argv.includes('--forzar')) {
    const conteo = await cliente.query('SELECT count(*)::int AS cantidad FROM empleados');
    const cantidad = conteo.rows[0].cantidad;
    if (cantidad > 0) {
      console.error(`La base "${bd.nombre}" ya tiene ${cantidad} empleados y el respaldo los reemplazaría.`);
      console.error('Si es lo que quiere, ejecute:  npm run db:restaurar -- --forzar');
      await cliente.end();
      process.exit(1);
    }
  }

  // El archivo trae BEGIN ... COMMIT: si una orden falla, no se aplica nada
  try {
    await cliente.query(readFileSync(ARCHIVO_RESPALDO, 'utf8'));
  } catch (error) {
    console.error(`No se pudo restaurar el respaldo: ${error.message}`);
    console.error('La base no fue modificada.');
    await cliente.end();
    process.exit(1);
  }

  const empleados = await cliente.query('SELECT count(*)::int AS cantidad FROM empleados');
  const usuarios = await cliente.query('SELECT count(*)::int AS cantidad FROM usuarios');
  await cliente.end();
  console.log(
    `Respaldo restaurado en "${bd.nombre}": ${empleados.rows[0].cantidad} empleados y ${usuarios.rows[0].cantidad} usuarios.`,
  );
}

const acciones = { crear, iniciar, asegurar, detener, respaldar, restaurar };
const accion = acciones[process.argv[2]];
if (!accion) {
  console.error(`Uso: node scripts/db.mjs <${Object.keys(acciones).join('|')}>`);
  process.exit(1);
}
await accion();
