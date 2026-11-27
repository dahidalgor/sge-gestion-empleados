// Utilidades comunes: ubicar los programas de PostgreSQL y leer la configuración de backend/.env
// Funciona en Windows, macOS y Linux.
import { spawnSync } from 'node:child_process';
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

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
    puerto: env.DB_PORT || '5433',
    usuario: env.DB_USER || 'postgres',
    password: env.DB_PASSWORD || '',
    nombre: env.DB_NAME || 'sge_empleados',
  };
}

/** Carpetas donde suelen instalarse los programas de PostgreSQL en cada sistema */
function carpetasCandidatas() {
  const carpetas = [];
  const agregarVersiones = (base, sufijo) => {
    if (!existsSync(base)) return;
    const versiones = readdirSync(base)
      .filter((nombre) => /^\d+/.test(nombre))
      .sort((a, b) => parseFloat(b) - parseFloat(a)); // la versión más nueva primero
    for (const version of versiones) carpetas.push(path.join(base, version, sufijo));
  };

  if (process.env.PG_BIN) carpetas.push(process.env.PG_BIN); // ruta indicada a mano

  if (ES_WINDOWS) {
    agregarVersiones('C:\\Program Files\\PostgreSQL', 'bin');
  } else if (process.platform === 'darwin') {
    agregarVersiones('/Library/PostgreSQL', 'bin'); // instalador de EDB
    carpetas.push('/Applications/Postgres.app/Contents/Versions/latest/bin');
    carpetas.push('/opt/homebrew/bin', '/usr/local/bin');
  } else {
    agregarVersiones('/usr/lib/postgresql', 'bin'); // Debian / Ubuntu
    carpetas.push('/usr/bin', '/usr/local/bin');
  }
  return carpetas;
}

/** Devuelve la ruta completa de un programa de PostgreSQL (pg_dump, psql, initdb, pg_ctl) */
export function programa(nombre) {
  const archivo = ES_WINDOWS ? `${nombre}.exe` : nombre;
  for (const carpeta of carpetasCandidatas()) {
    const ruta = path.join(carpeta, archivo);
    if (existsSync(ruta)) return ruta;
  }
  // Último intento: que esté en el PATH del sistema
  const buscador = spawnSync(ES_WINDOWS ? 'where' : 'which', [nombre], { encoding: 'utf8' });
  if (buscador.status === 0) return buscador.stdout.split(/\r?\n/)[0].trim();

  console.error(`\nNo se encontró "${nombre}" de PostgreSQL.`);
  console.error('Instale PostgreSQL o indique la carpeta "bin" con la variable PG_BIN, por ejemplo:');
  console.error(ES_WINDOWS ? '  set PG_BIN=C:\\Program Files\\PostgreSQL\\18\\bin' : '  export PG_BIN=/ruta/a/postgresql/bin');
  process.exit(1);
}

/** Ejecuta un programa mostrando su salida; si falla, detiene el script */
export function ejecutar(ruta, argumentos, opciones = {}) {
  const { password = '', permitirFallo = false } = opciones;
  const resultado = spawnSync(ruta, argumentos, {
    cwd: RAIZ,
    stdio: 'inherit',
    env: { ...process.env, PGPASSWORD: password },
  });
  if (resultado.status !== 0 && !permitirFallo) {
    console.error(`\nFalló: ${path.basename(ruta)} ${argumentos.join(' ')}`);
    process.exit(resultado.status || 1);
  }
  return resultado.status === 0;
}
