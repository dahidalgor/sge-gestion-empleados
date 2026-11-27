// Administración de la base de datos del proyecto (Windows, macOS y Linux)
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
import { ES_WINDOWS, RAIZ, configuracionBD, ejecutar, programa } from './postgres.mjs';

const CARPETA_DATOS = path.join(RAIZ, '.pgdata');
const ARCHIVO_RESPALDO = path.join(RAIZ, 'respaldo', 'sge_empleados.sql');
const bd = configuracionBD();

/** Argumentos de conexión comunes para psql y pg_dump */
function conexion(nombreBase) {
  return ['-h', bd.host, '-p', bd.puerto, '-U', bd.usuario, '-d', nombreBase];
}

/** Ejecuta una consulta y devuelve el texto de la respuesta (sin mostrarla) */
function consultar(sql, nombreBase) {
  const resultado = spawnSync(programa('psql'), [...conexion(nombreBase), '-tAc', sql], {
    encoding: 'utf8',
    env: { ...process.env, PGPASSWORD: bd.password },
  });
  if (resultado.status !== 0) {
    console.error(resultado.stderr);
    console.error('No se pudo conectar con PostgreSQL. ¿Está encendido? Revise DB_HOST, DB_PORT y DB_PASSWORD en backend/.env');
    process.exit(1);
  }
  return resultado.stdout.trim();
}

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

function crearBaseSiNoExiste() {
  const existe = consultar(`SELECT 1 FROM pg_database WHERE datname = '${bd.nombre}'`, 'postgres');
  if (existe === '1') return;
  ejecutar(programa('psql'), [...conexion('postgres'), '-c', `CREATE DATABASE ${bd.nombre};`], { password: bd.password });
  console.log(`Base de datos "${bd.nombre}" creada.`);
}

function crear() {
  if (existsSync(CARPETA_DATOS)) {
    console.log('El servidor local ya existe en .pgdata (no se modifica).');
  } else {
    ejecutar(programa('initdb'), ['-D', CARPETA_DATOS, '-U', 'postgres', '--auth=trust', '-E', 'UTF8', '--locale=C']);
  }
  if (!servidorLocalEncendido()) iniciar();
  crearBaseSiNoExiste();
  if (existsSync(ARCHIVO_RESPALDO)) restaurar();
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

function respaldar() {
  mkdirSync(path.dirname(ARCHIVO_RESPALDO), { recursive: true });
  ejecutar(
    programa('pg_dump'),
    [...conexion(bd.nombre), '--clean', '--if-exists', '--no-owner', '--no-privileges', '--encoding=UTF8', '-f', ARCHIVO_RESPALDO],
    { password: bd.password },
  );

  // Se quitan las órdenes que solo entienden las versiones más nuevas de psql,
  // para que el respaldo se pueda restaurar también en PostgreSQL 16 o 17.
  const lineas = readFileSync(ARCHIVO_RESPALDO, 'utf8').split('\n');
  const compatibles = lineas.filter((linea) => {
    if (linea.startsWith('\\restrict') || linea.startsWith('\\unrestrict')) return false;
    if (linea.startsWith('SET transaction_timeout')) return false;
    return true;
  });
  const encabezado = `-- Respaldo de la base "${bd.nombre}" del SGE generado el ${new Date().toLocaleString('es-EC')}\n`;
  writeFileSync(ARCHIVO_RESPALDO, encabezado + compatibles.join('\n'));

  const empleados = consultar('SELECT count(*) FROM empleados', bd.nombre);
  const usuarios = consultar('SELECT count(*) FROM usuarios', bd.nombre);
  console.log(`Respaldo guardado en respaldo/sge_empleados.sql (${empleados} empleados, ${usuarios} usuarios).`);
}

function restaurar() {
  if (!existsSync(ARCHIVO_RESPALDO)) {
    console.error('No existe respaldo/sge_empleados.sql. Primero ejecute "npm run db:respaldar" en la computadora de origen.');
    process.exit(1);
  }
  crearBaseSiNoExiste();

  // Protección: si la base ya tiene empleados, no se reemplaza sin confirmarlo
  const hayTabla = consultar("SELECT to_regclass('public.empleados') IS NOT NULL", bd.nombre) === 't';
  if (hayTabla && !process.argv.includes('--forzar')) {
    const cantidad = Number(consultar('SELECT count(*) FROM empleados', bd.nombre));
    if (cantidad > 0) {
      console.error(`La base "${bd.nombre}" ya tiene ${cantidad} empleados y el respaldo los reemplazaría.`);
      console.error('Si es lo que quiere, ejecute:  npm run db:restaurar -- --forzar');
      process.exit(1);
    }
  }

  // client_min_messages=warning oculta los avisos "no existe, se omite" del --clean
  process.env.PGOPTIONS = '-c client_min_messages=warning';
  // La salida normal de psql (resultados de setval) se descarta; los errores sí se muestran
  let salidaDescartada = '/dev/null';
  if (ES_WINDOWS) salidaDescartada = 'NUL';
  ejecutar(programa('psql'), [...conexion(bd.nombre), '-q', '-v', 'ON_ERROR_STOP=1', '-o', salidaDescartada, '-f', ARCHIVO_RESPALDO], {
    password: bd.password,
  });

  const empleados = consultar('SELECT count(*) FROM empleados', bd.nombre);
  const usuarios = consultar('SELECT count(*) FROM usuarios', bd.nombre);
  console.log(`Respaldo restaurado en "${bd.nombre}": ${empleados} empleados y ${usuarios} usuarios.`);
}

const acciones = { crear, iniciar, asegurar, detener, respaldar, restaurar };
const accion = acciones[process.argv[2]];
if (!accion) {
  console.error(`Uso: node scripts/db.mjs <${Object.keys(acciones).join('|')}>`);
  process.exit(1);
}
accion();
