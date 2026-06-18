const mysql = require('mysql2');
require('dotenv').config();

const pool = mysql.createPool({
  host:     process.env.DB_HOST,
  user:     process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port:     process.env.DB_PORT,
  waitForConnections: true,
  connectionLimit: 10,
  charset: 'utf8mb4',   // soporte completo de acentos y ñ en español
});

module.exports = pool.promise();
