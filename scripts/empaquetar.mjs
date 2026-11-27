// Genera entrega/SGE-gestion-empleados.zip con todo lo necesario para instalar el sistema
// en otra computadora: código fuente, manuales y el respaldo actual de la base de datos.
// No incluye node_modules, .pgdata ni los .env (se reconstruyen al instalar).
import { createWriteStream, mkdirSync, readdirSync, statSync } from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import archiver from 'archiver';
import { RAIZ } from './postgres.mjs';

const CARPETA_SALIDA = path.join(RAIZ, 'entrega');
const ARCHIVO_ZIP = path.join(CARPETA_SALIDA, 'SGE-gestion-empleados.zip');
const CARPETA_DENTRO_DEL_ZIP = 'sge-gestion-empleados';

// Carpetas y archivos que no se entregan
const CARPETAS_EXCLUIDAS = new Set(['node_modules', '.pgdata', 'dist', '.git', 'entrega', '.claude', '.vscode']);
const ARCHIVOS_EXCLUIDOS = new Set(['.env', '.DS_Store', 'AGENTS.md', 'CLAUDE.md']);
const EXTENSIONES_EXCLUIDAS = ['.log', '.tsbuildinfo'];

/** Recorre una carpeta y devuelve las rutas relativas de los archivos que sí se entregan */
function listarArchivos(carpeta, relativa = '') {
  const archivos = [];
  for (const nombre of readdirSync(carpeta)) {
    const rutaCompleta = path.join(carpeta, nombre);
    const rutaRelativa = path.join(relativa, nombre);
    if (statSync(rutaCompleta).isDirectory()) {
      if (CARPETAS_EXCLUIDAS.has(nombre)) continue;
      archivos.push(...listarArchivos(rutaCompleta, rutaRelativa));
    } else {
      if (ARCHIVOS_EXCLUIDOS.has(nombre)) continue;
      if (EXTENSIONES_EXCLUIDAS.some((extension) => nombre.endsWith(extension))) continue;
      archivos.push(rutaRelativa);
    }
  }
  return archivos;
}

// 1. Respaldo actualizado de la base de datos
console.log('1/2  Respaldando la base de datos...');
const respaldo = spawnSync(process.execPath, [path.join(RAIZ, 'scripts', 'db.mjs'), 'respaldar'], { stdio: 'inherit' });
if (respaldo.status !== 0) {
  console.error('No se pudo respaldar la base. Verifique que PostgreSQL esté encendido (npm run db:iniciar).');
  process.exit(1);
}

// 2. Comprimir el proyecto
console.log('2/2  Comprimiendo el proyecto...');
mkdirSync(CARPETA_SALIDA, { recursive: true });
const archivos = listarArchivos(RAIZ);
const salida = createWriteStream(ARCHIVO_ZIP);
const zip = archiver('zip', { zlib: { level: 9 } });

salida.on('close', () => {
  const megas = (zip.pointer() / 1024 / 1024).toFixed(2);
  console.log(`\nListo: entrega/SGE-gestion-empleados.zip (${archivos.length} archivos, ${megas} MB)`);
  console.log('En la otra computadora: descomprimir y seguir el Manual de instalación (docs/).');
});
zip.on('error', (error) => {
  throw error;
});

zip.pipe(salida);
for (const archivo of archivos) {
  // Dentro del zip siempre se usan barras "/" para que se abra bien en cualquier sistema
  const destino = `${CARPETA_DENTRO_DEL_ZIP}/${archivo.split(path.sep).join('/')}`;
  zip.file(path.join(RAIZ, archivo), { name: destino });
}
zip.finalize();
