const bcrypt = require('bcryptjs');
const db     = require('../config/db');

// Agrega aquí todos los alumnos que quieres resetear
const ALUMNOS = [
  { usuario: 'parj',  nuevaClave: '123pau' },
  { usuario: 'cjtf',  nuevaClave: '123cjt' },
  { usuario: 'lfmj',  nuevaClave: '123lfm' },
  { usuario: 'lacg',  nuevaClave: '123lac' },
  // agrega más filas si necesitas...
];

async function resetearContrasenas() {
  console.log('Iniciando reseteo de contraseñas...\n');

  try {
    for (const alumno of ALUMNOS) {
      const [filas] = await db.query(
        'SELECT idAlumno FROM alumno WHERE usuario = ?',
        [alumno.usuario]
      );

      if (filas.length === 0) {
        console.log(`[NO ENCONTRADO]  ${alumno.usuario}`);
        continue;
      }

      const hash = await bcrypt.hash(alumno.nuevaClave, 10);

      await db.query(
        'UPDATE alumno SET contrasena = ? WHERE usuario = ?',
        [hash, alumno.usuario]
      );

      console.log(`[OK]  ${alumno.usuario} → nueva contraseña: ${alumno.nuevaClave}`);
    }

    console.log('\nProceso completado.');
  } catch (err) {
    console.error('Error:', err.message);
  } finally {
    process.exit();
  }
}

resetearContrasenas();
