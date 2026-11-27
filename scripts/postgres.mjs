// Utilidades comunes: programas de PostgreSQL, configuración de backend/.env y conexión a la base.
// PostgreSQL viene dentro del paquete npm "embedded-postgres", así que solo se necesita Node.js
// (Windows, macOS o Linux).
import { spawnSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import pg from 'pg';

export const RAIZ = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
export const ES_WINDOWS = process.platform === 'win32';

/** Lee un archivo .env simple (CLAVE=valor) y devuelve un objeto */
function leerEnv(ruta) {
  const valores = {};
  if (!existsSync(ruta)) return valores;
  for (const linea of readFileSync(ruta, 'utf8').split(/\r?\n/)) {
    const limpia = linea.trim();
    if (limpia === '' || limpia.startsWith('#')) continue;
    const posicion = limpia.indexOf('=');
    if (posicion === -1) continue;
    valores[limpia.slice(0, posicion).trim()] = limpia.slice(posicion + 1).trim();
  }
  return valores;
}

/** Configuración de la base de datos: backend/.env y, si falta, backend/.env.example */
export function configuracionBD() {
  let env = leerEnv(path.join(RAIZ, 'backend', '.env'));
  if (Object.keys(env).length === 0) env = leerEnv(path.join(RAIZ, 'backend', '.env.example'));
  return {
    host: env.DB_HOST || 'localhost',
    puerto: Number(env.DB_PORT || 5433),
    usuario: env.DB_USER || 'postgres',
    password: env.DB_PASSWORD || '',
    nombre: env.DB_NAME || 'sge_empleados',
  };
}

/** Abre una conexión a la base indicada usando los datos de backend/.env */
export async function conectar(nombreBase) {
  const bd = configuracionBD();
  const cliente = new pg.Client({
    host: bd.host,
    port: bd.puerto,
    user: bd.usuario,
    password: bd.password,
    database: nombreBase,
  });
  try {
    await cliente.connect();
  } catch (error) {
    console.error(`\nNo se pudo conectar con PostgreSQL en ${bd.host}:${bd.puerto} (${error.message}).`);
    console.error('¿Está encendido? Use "npm run db:iniciar" o revise DB_HOST, DB_PORT y DB_PASSWORD en backend/.env');
    process.exit(1);
  }
  return cliente;
}

/** Carpeta del paquete con los binarios de PostgreSQL para este sistema operativo */
function carpetaPaquete() {
  const sistemas = { win32: 'windows', darwin: 'darwin', linux: 'linux' };
  const nombre = `${sistemas[process.platform]}-${process.arch}`; // p. ej. darwin-arm64, windows-x64
  const carpeta = path.join(RAIZ, 'node_modules', '@embedded-postgres', nombre);
  if (!existsSync(carpeta)) {
    console.error(`\nNo se encontró PostgreSQL para este sistema (${nombre}).`);
    console.error('Ejecute primero "npm run instalar" en la carpeta del proyecto.');
    process.exit(1);
  }
  return carpeta;
}

let enlacesPreparados = false;

/** Devuelve la ruta completa de un programa de PostgreSQL (initdb, pg_ctl) */
export function programa(nombre) {
  const carpeta = carpetaPaquete();

  // En Linux el paquete necesita crear algunos enlaces de librerías. npm puede bloquear
  // ese paso al instalar, así que se ejecuta aquí (si ya existen, no hace nada).
  if (!enlacesPreparados) {
    spawnSync(process.execPath, [path.join(carpeta, 'scripts', 'hydrate-symlinks.js')], { stdio: 'ignore' });
    enlacesPreparados = true;
  }

  let archivo = nombre;
  if (ES_WINDOWS) archivo = `${nombre}.exe`;
  return path.join(carpeta, 'native', 'bin', archivo);
}

/** Ejecuta un programa mostrando su salida; si falla, detiene el script */
export function ejecutar(ruta, argumentos) {
  const resultado = spawnSync(ruta, argumentos, { cwd: RAIZ, stdio: 'inherit' });
  if (resultado.status !== 0) {
    console.error(`\nFalló: ${path.basename(ruta)} ${argumentos.join(' ')}`);
    process.exit(resultado.status || 1);
  }
}
