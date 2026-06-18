/* =============================================
   CREAR-ADMIN.JS
   Crea un administrador de prueba (contraseña encriptada)
   y una noticia de ejemplo. Seguro de ejecutar varias veces.
   ============================================= */

const bcrypt = require('bcryptjs');
const db     = require('../config/db');

const ADMIN = {
  nombre:     'Ana Gómez',
  cargo:      'Comunicaciones',
  correo:     'comunicaciones@yermoyparres.edu.co',
  documento:  '800000001',
  usuario:    'admin',
  contrasena: 'admin123',
};

async function crear() {
  console.log('Creando administrador de prueba...\n');
  try {
    let [filas] = await db.query('SELECT idAdmin FROM administrador WHERE usuario = ?', [ADMIN.usuario]);
    let idAdmin;

    if (filas.length > 0) {
      idAdmin = filas[0].idAdmin;
      console.log(`El administrador "${ADMIN.usuario}" ya existía (id ${idAdmin}).`);
    } else {
      const hash = await bcrypt.hash(ADMIN.contrasena, 10);
      const [r] = await db.query(
        'INSERT INTO administrador (nombre, cargo, correo, documento, usuario, contrasena) VALUES (?, ?, ?, ?, ?, ?)',
        [ADMIN.nombre, ADMIN.cargo, ADMIN.correo, ADMIN.documento, ADMIN.usuario, hash]
      );
      idAdmin = r.insertId;
      console.log(`Administrador creado (id ${idAdmin}).`);
      console.log(`   Usuario: ${ADMIN.usuario}  |  Contraseña: ${ADMIN.contrasena}`);
    }

    // Noticia de ejemplo (solo si no hay ninguna)
    const [hay] = await db.query('SELECT idNoticia FROM noticia LIMIT 1');
    if (hay.length === 0) {
      await db.query(
        `INSERT INTO noticia (titulo, contenido, categoria, mediaUrl, tipoMedia, idAdmin)
         VALUES (?, ?, ?, ?, ?, ?)`,
        ['¡Bienvenidos al nuevo año escolar!',
         'Damos la bienvenida a toda la comunidad yermista al inicio del nuevo año académico. Los esperamos con grandes proyectos.',
         'Noticia',
         'https://images.unsplash.com/photo-1503676260728-1c00da094a0b?w=800',
         'imagen',
         idAdmin]
      );
      console.log('Noticia de ejemplo creada.');
    }

    console.log('\nProceso completado.');
  } catch (err) {
    console.error('Error:', err.message);
    console.error('¿Ejecutaste primero crear-admin-noticias.sql en phpMyAdmin?');
  } finally {
    process.exit();
  }
}

crear();
