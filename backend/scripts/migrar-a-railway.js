/* =============================================
   MIGRAR-A-RAILWAY.JS
   Copia TODOS los datos de la base local (.env) a la base de Railway (.env.railway).
   Reemplaza los datos existentes en Railway (borra y vuelve a insertar),
   preservando los IDs y las contraseñas ya encriptadas.
   Uso: node scripts/migrar-a-railway.js
   ============================================= */

const fs     = require('fs');
const path   = require('path');
const dotenv = require('dotenv');
const mysql  = require('mysql2/promise');

// Orden respetando llaves foráneas (padres primero)
const TABLAS = [
  'administrador', 'docente', 'alumno', 'padreacudiente',
  'materia', 'materia_alumno', 'nota',
  'comunicacion', 'comunicacion_receptor', 'noticia', 'circular',
];

function cfg(obj) {
  const c = {
    host:     obj.DB_HOST,
    user:     obj.DB_USER,
    password: obj.DB_PASSWORD || '',
    database: obj.DB_NAME,
    port:     obj.DB_PORT || 3306,
    charset:  'utf8mb4',
  };
  // TLS obligatorio en varios proveedores en la nube (TiDB Cloud, etc.)
  if (obj.DB_SSL === 'true') c.ssl = { minVersion: 'TLSv1.2', rejectUnauthorized: true };
  return c;
}

async function migrar() {
  // El archivo de destino se puede pasar como argumento:
  //   node scripts/migrar-a-railway.js .env.nube
  const archivoDestino = process.argv[2] || '.env.railway';

  const localEnv = dotenv.parse(fs.readFileSync(path.join(__dirname, '..', '.env')));
  const railEnv  = dotenv.parse(fs.readFileSync(path.join(__dirname, '..', archivoDestino)));

  const local = await mysql.createConnection(cfg(localEnv));
  const rail  = await mysql.createConnection(cfg(railEnv));
  console.log(`Origen (local): ${localEnv.DB_NAME} @ ${localEnv.DB_HOST}`);
  console.log(`Destino (${archivoDestino}): ${railEnv.DB_NAME} @ ${railEnv.DB_HOST}\n`);

  try {
    await rail.query('SET FOREIGN_KEY_CHECKS = 0');

    // 1. Vaciar las tablas de Railway (en orden inverso por seguridad)
    for (const t of [...TABLAS].reverse()) {
      await rail.query('DELETE FROM `' + t + '`');
    }
    console.log('Tablas de Railway vaciadas.\n');

    // 2. Copiar tabla por tabla
    for (const t of TABLAS) {
      const [filas] = await local.query('SELECT * FROM `' + t + '`');
      if (filas.length === 0) { console.log(`${t.padEnd(22)}: 0 filas (vacía)`); continue; }

      const cols = Object.keys(filas[0]);
      const valores = filas.map(f => cols.map(c => f[c]));
      const colsSql = cols.map(c => '`' + c + '`').join(', ');
      await rail.query(`INSERT INTO \`${t}\` (${colsSql}) VALUES ?`, [valores]);
      console.log(`${t.padEnd(22)}: ${filas.length} filas copiadas`);
    }

    await rail.query('SET FOREIGN_KEY_CHECKS = 1');
    console.log('\nMigración completada. Railway ahora refleja tu base local.');
  } catch (err) {
    console.error('Error en la migración:', err.message);
  } finally {
    await local.end();
    await rail.end();
    process.exit();
  }
}

migrar();
