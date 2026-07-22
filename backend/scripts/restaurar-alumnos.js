/* =============================================
   RESTAURAR-ALUMNOS.JS
   Recrea los 4 estudiantes originales del proyecto con sus
   identificadores, grados y contraseñas conocidas.
   Seguro de ejecutar varias veces (no duplica por usuario).
   ============================================= */

const bcrypt = require('bcryptjs');
const db     = require('../config/db');

const ALUMNOS = [
  { id: 1, nombre: 'Paula Andrea',   apellido: 'Rojas Jimenez',      usuario: 'parj', grado: 601, clave: '123pau' },
  { id: 2, nombre: 'Carlos Javier',  apellido: 'Terreros Folleco',   usuario: 'cjtf', grado: 602, clave: '123cjt' },
  { id: 4, nombre: 'Luisa Fernanda', apellido: 'Moreno Jimenez',     usuario: 'lfmj', grado: 901, clave: '123lfm' },
  { id: 5, nombre: 'Luis Alexander', apellido: 'Clavijo Gutierrez',  usuario: 'lacg', grado: 702, clave: '123lac' },
];

async function restaurar() {
  console.log(`Restaurando alumnos en: ${process.env.DB_NAME} @ ${process.env.DB_HOST}\n`);
  let creados = 0, omitidos = 0;

  try {
    for (const a of ALUMNOS) {
      const [existe] = await db.query('SELECT idAlumno FROM alumno WHERE usuario = ?', [a.usuario]);
      if (existe.length > 0) {
        console.log(`[OMITIDO] ${a.usuario} — ya existe`);
        omitidos++;
        continue;
      }

      const hash = await bcrypt.hash(a.clave, 10);
      await db.query(
        `INSERT INTO alumno (idAlumno, nombre, apellido, grado, usuario, contrasena)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [a.id, a.nombre, a.apellido, a.grado, a.usuario, hash]
      );
      console.log(`[OK] ${a.usuario} — ${a.nombre} ${a.apellido} (grado ${a.grado})`);
      creados++;
    }

    console.log(`\nCreados: ${creados} | Omitidos: ${omitidos}`);
    const [t] = await db.query('SELECT COUNT(*) AS c FROM alumno');
    console.log(`Total de alumnos en la BD: ${t[0].c}`);
  } catch (err) {
    console.error('Error al restaurar:', err.message);
  } finally {
    process.exit();
  }
}

restaurar();
