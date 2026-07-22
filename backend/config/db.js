const mysql = require('mysql2');
require('dotenv').config();

// Configuración reutilizable de la conexión.
// Lee primero las variables propias (DB_*, uso local) y, si no existen,
// usa las que inyectan algunos servicios de despliegue (MYSQL*).
// Si DB_SSL=true, se conecta con TLS (requerido por proveedores en la nube
// como TiDB Cloud). En local (XAMPP) se omite y todo sigue igual.
const configuracion = {
  host:     process.env.DB_HOST     || process.env.MYSQLHOST,
  user:     process.env.DB_USER     || process.env.MYSQLUSER,
  password: process.env.DB_PASSWORD ?? process.env.MYSQLPASSWORD ?? '',
  database: process.env.DB_NAME     || process.env.MYSQLDATABASE,
  port:     process.env.DB_PORT     || process.env.MYSQLPORT || 3306,
  charset: 'utf8mb4',   // soporte completo de acentos y ñ en español
};

if (process.env.DB_SSL === 'true') {
  configuracion.ssl = { minVersion: 'TLSv1.2', rejectUnauthorized: true };
}

const pool = mysql.createPool({
  ...configuracion,
  waitForConnections: true,
  connectionLimit: 10,
});

module.exports = pool.promise();

// Se expone también la configuración para que los scripts reutilicen
// los mismos parámetros (incluido el TLS) al abrir sus propias conexiones.
module.exports.configuracion = configuracion;
