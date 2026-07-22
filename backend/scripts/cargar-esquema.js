/* =============================================
   CARGAR-ESQUEMA.JS
   Ejecuta scripts/esquema.sql contra una base de datos.

   ⚠️ OPERACIÓN DESTRUCTIVA: el esquema hace DROP TABLE de las 11 tablas.

   Uso:
     node scripts/cargar-esquema.js               -> usa el .env (base local)
     node scripts/cargar-esquema.js .env.nube     -> usa otro archivo de entorno

   Si se indica un archivo y NO existe, el script se DETIENE con error,
   para no ejecutarse por accidente contra la base equivocada.
   ============================================= */

const fs    = require('fs');
const path  = require('path');
const mysql = require('mysql2/promise');

// --- Carga del entorno (antes de requerir config/db) ---
const archivoEnv = process.argv[2];
if (archivoEnv) {
  const ruta = path.join(__dirname, '..', archivoEnv);
  if (!fs.existsSync(ruta)) {
    console.error(`\n❌ No se encontró el archivo de entorno "${archivoEnv}".`);
    console.error(`   Ruta esperada: ${ruta}`);
    console.error('   Revisa el nombre (en Windows puede haberse guardado como .txt).');
    console.error('   El script se detiene para no escribir en la base equivocada.\n');
    process.exit(1);
  }
  require('dotenv').config({ path: ruta, override: true });
} else {
  require('dotenv').config();
}

async function cargar() {
  let sql = fs.readFileSync(path.join(__dirname, 'esquema.sql'), 'utf8');

  // Quitar las líneas CREATE DATABASE y USE: en un hosting (p. ej. Railway)
  // la base de datos ya existe con otro nombre (railway), así que las tablas
  // se crean en la base de datos a la que nos conectamos (DB_NAME).
  sql = sql
    .split('\n')
    .filter(l => !/^\s*CREATE DATABASE/i.test(l) && !/^\s*USE\s/i.test(l))
    .join('\n');

  // Conexión con multipleStatements para ejecutar todo el script de una vez.
  // Reutiliza la configuración central (incluye TLS si DB_SSL=true).
  const { configuracion } = require('../config/db');

  // Aviso visible del destino: evita ejecutar contra la base equivocada
  console.log('──────────────────────────────────────────────');
  console.log(' DESTINO de la carga (se BORRARÁN sus tablas):');
  console.log('   Entorno : ' + (archivoEnv || '.env (por defecto)'));
  console.log('   Host    : ' + configuracion.host);
  console.log('   Base    : ' + configuracion.database);
  console.log('──────────────────────────────────────────────\n');

  const conn = await mysql.createConnection({
    ...configuracion,
    multipleStatements: true,
  });

  try {
    console.log('Ejecutando esquema.sql...');
    await conn.query(sql);
    console.log('Esquema cargado correctamente.');
    const [t] = await conn.query('SHOW TABLES');
    console.log('Tablas creadas:', t.length);
  } catch (err) {
    console.error('Error al cargar el esquema:', err.message);
  } finally {
    await conn.end();
  }
}

cargar();
