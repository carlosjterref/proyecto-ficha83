/* =============================================
   DATOS-PRUEBA.JS
   Crea datos mínimos para probar el dashboard docente:
   - 1 docente (con contraseña encriptada)
   - 2 materias asignadas a ese docente
   - Inscribe a TODOS los alumnos existentes en ambas materias
   Es seguro ejecutarlo varias veces (no duplica el docente).
   ============================================= */

const bcrypt = require('bcryptjs');
const db     = require('../config/db');

// Datos del docente de prueba (puedes cambiarlos)
const DOCENTE = {
  nombre:       'Carlos Terreros',
  especialidad: 'Matemáticas',
  correo:       'cterreros@yermoyparres.edu.co',
  usuario:      'cterreros',
  documento:    '1000000001',
  contrasena:   'docente123',
};

async function sembrar() {
  console.log('Generando datos de prueba...\n');
  try {
    // 1. Crear el docente solo si no existe
    let [docs] = await db.query('SELECT idDocente FROM docente WHERE usuario = ?', [DOCENTE.usuario]);
    let idDocente;

    if (docs.length > 0) {
      idDocente = docs[0].idDocente;
      console.log(`Docente ya existía (id ${idDocente}).`);
    } else {
      const hash = await bcrypt.hash(DOCENTE.contrasena, 10);
      const [r] = await db.query(
        'INSERT INTO docente (nombre, especialidad, correo, usuario, documento, contrasena) VALUES (?, ?, ?, ?, ?, ?)',
        [DOCENTE.nombre, DOCENTE.especialidad, DOCENTE.correo, DOCENTE.usuario, DOCENTE.documento, hash]
      );
      idDocente = r.insertId;
      console.log(`Docente creado (id ${idDocente}).`);
      console.log(`   Usuario: ${DOCENTE.usuario}  |  Contraseña: ${DOCENTE.contrasena}`);
    }

    // 2. Tomar el grado del primer alumno para que las materias coincidan
    const [alumnos] = await db.query('SELECT idAlumno, grado FROM alumno');
    if (alumnos.length === 0) {
      console.log('\nNo hay alumnos en la BD. Crea alumnos antes de sembrar materias.');
      return;
    }
    const grado = alumnos[0].grado;

    // 3. Crear dos materias para el docente (si no existen ya)
    const materias = [
      { nombre: 'Matemáticas', grado },
      { nombre: 'Geometría',   grado },
    ];
    const idsMateria = [];

    for (const m of materias) {
      const [existe] = await db.query(
        'SELECT idMateria FROM materia WHERE nombre = ? AND grado = ? AND idDocente = ?',
        [m.nombre, m.grado, idDocente]
      );
      if (existe.length > 0) {
        idsMateria.push(existe[0].idMateria);
        console.log(`Materia "${m.nombre}" ya existía.`);
      } else {
        const [r] = await db.query(
          'INSERT INTO materia (nombre, grado, idDocente) VALUES (?, ?, ?)',
          [m.nombre, m.grado, idDocente]
        );
        idsMateria.push(r.insertId);
        console.log(`Materia "${m.nombre}" creada (id ${r.insertId}).`);
      }
    }

    // 4. Inscribir a todos los alumnos en ambas materias (evitando duplicados)
    for (const idMateria of idsMateria) {
      for (const al of alumnos) {
        const [ya] = await db.query(
          'SELECT id FROM materia_alumno WHERE idMateria = ? AND idAlumno = ?',
          [idMateria, al.idAlumno]
        );
        if (ya.length === 0) {
          await db.query(
            'INSERT INTO materia_alumno (idMateria, idAlumno) VALUES (?, ?)',
            [idMateria, al.idAlumno]
          );
        }
      }
    }
    console.log(`\nInscritos ${alumnos.length} alumnos en ${idsMateria.length} materias.`);

    // 5. Crear un acudiente vinculado al primer alumno (si no existe)
    const primerAlumno = alumnos[0];
    const ACUDIENTE = {
      nombre: 'María Jiménez', documento: '900000001', parentesco: 'Madre',
      correo: 'mjimenez@correo.com', usuario: 'mjimenez', contrasena: 'acudiente123',
    };
    let [acus] = await db.query('SELECT idPadre FROM padreacudiente WHERE usuario = ?', [ACUDIENTE.usuario]);
    if (acus.length === 0) {
      const hashA = await bcrypt.hash(ACUDIENTE.contrasena, 10);
      await db.query(
        'INSERT INTO padreacudiente (nombre, documento, parentesco, correo, usuario, contrasena, idAlumno) VALUES (?, ?, ?, ?, ?, ?, ?)',
        [ACUDIENTE.nombre, ACUDIENTE.documento, ACUDIENTE.parentesco, ACUDIENTE.correo, ACUDIENTE.usuario, hashA, primerAlumno.idAlumno]
      );
      console.log(`\nAcudiente creado para el alumno id ${primerAlumno.idAlumno}.`);
      console.log(`   Usuario: ${ACUDIENTE.usuario}  |  Contraseña: ${ACUDIENTE.contrasena}`);
    } else {
      console.log('\nAcudiente de prueba ya existía.');
    }

    // 6. Registrar algunas notas de ejemplo para el primer alumno (si no tiene)
    const [tieneNotas] = await db.query('SELECT idNota FROM nota WHERE idAlumno = ?', [primerAlumno.idAlumno]);
    if (tieneNotas.length === 0) {
      await db.query(
        'INSERT INTO nota (calificacion, periodo, idAlumno, idMateria, idDocente) VALUES (?, ?, ?, ?, ?), (?, ?, ?, ?, ?)',
        [4.5, 'Período 1', primerAlumno.idAlumno, idsMateria[0], idDocente,
         3.8, 'Período 1', primerAlumno.idAlumno, idsMateria[1], idDocente]
      );
      console.log('Notas de ejemplo registradas para el primer alumno.');
    }

    // 7. Crear un mensaje del docente dirigido al alumno y a su acudiente (si no hay)
    const [hayMsg] = await db.query('SELECT idMensaje FROM comunicacion LIMIT 1');
    if (hayMsg.length === 0) {
      const [msg] = await db.query(
        'INSERT INTO comunicacion (contenido, tipo, idEmisor, emisorTipo) VALUES (?, ?, ?, ?)',
        ['Bienvenidos al nuevo período académico. Recuerden revisar el calendario de evaluaciones.', 'Comunicado', idDocente, 'Docente']
      );
      const idMensaje = msg.insertId;
      const [acu] = await db.query('SELECT idPadre FROM padreacudiente WHERE idAlumno = ?', [primerAlumno.idAlumno]);
      const receptores = [[idMensaje, primerAlumno.idAlumno, 'Alumno']];
      if (acu.length > 0) receptores.push([idMensaje, acu[0].idPadre, 'PadreAcudiente']);
      await db.query('INSERT INTO comunicacion_receptor (idMensaje, idReceptor, receptorTipo) VALUES ?', [receptores]);
      console.log('Mensaje de ejemplo enviado al alumno y acudiente.');
    }

    console.log('\nProceso completado.');
  } catch (err) {
    console.error('Error:', err.message);
  } finally {
    process.exit();
  }
}

sembrar();
