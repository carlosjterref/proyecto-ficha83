const bcrypt = require('bcryptjs');
const db     = require('../config/db');

async function encriptarContrasenas() {
  console.log('Iniciando encriptación de contraseñas...\n');

  try {
    // 1. Obtener todos los alumnos con contraseña en texto plano
    const [alumnos] = await db.query(
      'SELECT idAlumno, usuario, contrasena FROM alumno'
    );

    console.log(`Se encontraron ${alumnos.length} alumnos.\n`);

    for (const alumno of alumnos) {
      // 2. Verificar si ya está encriptada (los hashes bcrypt empiezan con "$2")
      if (alumno.contrasena.startsWith('$2')) {
        console.log(`[OMITIDO]  ${alumno.usuario} — ya tiene contraseña encriptada.`);
        continue;
      }

      // 3. Encriptar la contraseña actual
      const hash = await bcrypt.hash(alumno.contrasena, 10);

      // 4. Actualizar en la base de datos
      await db.query(
        'UPDATE alumno SET contrasena = ? WHERE idAlumno = ?',
        [hash, alumno.idAlumno]
      );

      console.log(`[OK]       ${alumno.usuario} — contraseña encriptada correctamente.`);
    }

    console.log('\nProceso completado.');
  } catch (err) {
    console.error('Error durante la encriptación:', err.message);
  } finally {
    process.exit();
  }
}

encriptarContrasenas();
