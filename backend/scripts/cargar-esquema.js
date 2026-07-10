/* =============================================
   CARGAR-ESQUEMA.JS
   Ejecuta scripts/esquema.sql contra la base de datos configurada
   en el .env (útil para inicializar una BD nueva, p. ej. en Railway).
   Uso: node scripts/cargar-esquema.js
   ============================================= */

const fs    = require('fs');
const path  = require('path');
const mysql = require('mysql2/promise');
require('dotenv').config();

async function cargar() {
  let sql = fs.readFileSync(path.join(__dirname, 'esquema.sql'), 'utf8');

  // Quitar las líneas CREATE DATABASE y USE: en un hosting (p. ej. Railway)
  // la base de datos ya existe con otro nombre (railway), así que las tablas
  // se crean en la base de datos a la que nos conectamos (DB_NAME).
  sql = sql
    .split('\n')
    .filter(l => !/^\s*CREATE DATABASE/i.test(l) && !/^\s*USE\s/i.test(l))
    .join('\n');

  // Conexión con multipleStatements para ejecutar todo el script de una vez
  const conn = await mysql.createConnection({
    host:     process.env.DB_HOST     || process.env.MYSQLHOST,
    user:     process.env.DB_USER     || process.env.MYSQLUSER,
    password: process.env.DB_PASSWORD ?? process.env.MYSQLPASSWORD ?? '',
    database: process.env.DB_NAME     || process.env.MYSQLDATABASE,
    port:     process.env.DB_PORT     || process.env.MYSQLPORT || 3306,
    multipleStatements: true,
    charset: 'utf8mb4',
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
