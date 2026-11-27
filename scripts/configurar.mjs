// Crea backend/.env y frontend/.env a partir de las plantillas .env.example (solo si no existen)
import { copyFileSync, existsSync } from 'node:fs';
import path from 'node:path';
import { RAIZ } from './postgres.mjs';

for (const carpeta of ['backend', 'frontend']) {
  const plantilla = path.join(RAIZ, carpeta, '.env.example');
  const destino = path.join(RAIZ, carpeta, '.env');
  if (existsSync(destino)) {
    console.log(`${carpeta}/.env ya existe (no se modifica).`);
  } else {
    copyFileSync(plantilla, destino);
    console.log(`${carpeta}/.env creado desde .env.example.`);
  }
}
