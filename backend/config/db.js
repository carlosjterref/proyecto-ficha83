const mysql = require('mysql2');
require('dotenv').config();

// Lee primero las variables propias (DB_*, uso local) y, si no existen,
// usa las que Railway inyecta automáticamente (MYSQL*), para el despliegue.
const pool = mysql.createPool({
  host:     process.env.DB_HOST     || process.env.MYSQLHOST,
  user:     process.env.DB_USER     || process.env.MYSQLUSER,
  password: process.env.DB_PASSWORD ?? process.env.MYSQLPASSWORD ?? '',
  database: process.env.DB_NAME     || process.env.MYSQLDATABASE,
  port:     process.env.DB_PORT     || process.env.MYSQLPORT || 3306,
  waitForConnections: true,
  connectionLimit: 10,
  charset: 'utf8mb4',   // soporte completo de acentos y ñ en español
});

module.exports = pool.promise();
