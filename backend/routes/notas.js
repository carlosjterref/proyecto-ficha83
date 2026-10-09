const express = require('express');
const router  = express.Router();
const db      = require('../config/db');
const { verificarToken, soloRol } = require('../middleware/auth');
const { aEntero, puedeVerNotasDeAlumno, relacionConMateria, relacionConNota, alumnoEnMateria, rechazarSiNoEsPropia } = require('../middleware/permisos');
const { texto, numero } = require('../middleware/validaciones');

// GET /api/notas/alumno/:idAlumno  — notas de un alumno
// Lo puede ver el propio alumno, su acudiente o un docente.
router.get('/alumno/:idAlumno', verificarToken, async (req, res) => {
  try {
    const idAlumno = aEntero(req.params.idAlumno);
    if (!idAlumno) return res.status(400).json({ mensaje: 'Identificador de alumno no válido.' });
    if (!(await puedeVerNotasDeAlumno(req.usuario, idAlumno))) {
      return res.status(403).json({ mensaje: 'No tienes permiso para esta acción.' });
    }

    const [filas] = await db.query(
      `SELECT n.idNota, n.calificacion, n.periodo,
              m.nombre AS materia, m.grado,
              d.nombre AS docente
       FROM nota n
       INNER JOIN materia m ON n.idMateria = m.idMateria
       INNER JOIN docente d ON n.idDocente = d.idDocente
       WHERE n.idAlumno = ?
       ORDER BY n.periodo, m.nombre`,
      [idAlumno]
    );
    res.json(filas);
  } catch (err) {
    res.status(500).json({ mensaje: 'Error al obtener notas.' });
  }
});

// GET /api/notas/materia/:idMateria  — notas de una materia (solo el docente que la dicta)
router.get('/materia/:idMateria', verificarToken, soloRol('docente'), async (req, res) => {
  try {
    const idMateria = aEntero(req.params.idMateria);
    if (!idMateria) return res.status(400).json({ mensaje: 'Identificador de materia no válido.' });
    if (rechazarSiNoEsPropia(res, await relacionConMateria(req.usuario.id, idMateria), 'Materia')) return;

    const [filas] = await db.query(
      `SELECT n.idNota, n.calificacion, n.periodo,
              a.nombre AS alumno, a.apellido, a.grado
       FROM nota n
       INNER JOIN alumno a ON n.idAlumno = a.idAlumno
       WHERE n.idMateria = ?
       ORDER BY n.periodo, a.apellido`,
      [idMateria]
    );
    res.json(filas);
  } catch (err) {
    res.status(500).json({ mensaje: 'Error al obtener notas por materia.' });
  }
});

// POST /api/notas  — solo el docente que dicta la materia, para un alumno inscrito en ella.
// El docente que queda registrado es el de la sesión (no el que envíe el navegador).
router.post('/', verificarToken, soloRol('docente'), async (req, res) => {
  const calificacion = numero(req.body.calificacion);
  const periodo      = texto(req.body.periodo, 20);
  const idAlumno     = aEntero(req.body.idAlumno);
  const idMateria    = aEntero(req.body.idMateria);

  if (!calificacion || !periodo || !idAlumno || !idMateria) {
    return res.status(400).json({ mensaje: 'Faltan campos obligatorios.' });
  }

  if (calificacion < 0 || calificacion > 10) {
    return res.status(400).json({ mensaje: 'La calificación debe estar entre 0 y 10.' });
  }

  try {
    if (rechazarSiNoEsPropia(res, await relacionConMateria(req.usuario.id, idMateria), 'Materia')) return;
    if (!(await alumnoEnMateria(idAlumno, idMateria))) {
      return res.status(400).json({ mensaje: 'El alumno no está inscrito en esa materia.' });
    }

    const [resultado] = await db.query(
      'INSERT INTO nota (calificacion, periodo, idAlumno, idMateria, idDocente) VALUES (?, ?, ?, ?, ?)',
      [calificacion, periodo, idAlumno, idMateria, req.usuario.id]
    );
    res.status(201).json({ mensaje: 'Nota registrada.', id: resultado.insertId });
  } catch (err) {
    res.status(500).json({ mensaje: 'Error al registrar la nota.' });
  }
});

// PUT /api/notas/:id  — solo el docente que dicta la materia de la nota
router.put('/:id', verificarToken, soloRol('docente'), async (req, res) => {
  const idNota       = aEntero(req.params.id);
  const calificacion = numero(req.body.calificacion);
  const periodo      = texto(req.body.periodo, 20);

  if (!idNota) return res.status(400).json({ mensaje: 'Identificador de nota no válido.' });
  if (calificacion === null || !periodo) {
    return res.status(400).json({ mensaje: 'Faltan campos obligatorios.' });
  }
  if (calificacion < 0 || calificacion > 10) {
    return res.status(400).json({ mensaje: 'La calificación debe estar entre 0 y 10.' });
  }

  try {
    if (rechazarSiNoEsPropia(res, await relacionConNota(req.usuario.id, idNota), 'Nota')) return;

    const [resultado] = await db.query(
      'UPDATE nota SET calificacion=?, periodo=? WHERE idNota=?',
      [calificacion, periodo, idNota]
    );
    if (resultado.affectedRows === 0) return res.status(404).json({ mensaje: 'Nota no encontrada.' });
    res.json({ mensaje: 'Nota actualizada.' });
  } catch (err) {
    res.status(500).json({ mensaje: 'Error al actualizar la nota.' });
  }
});

// DELETE /api/notas/:id  — solo el docente que dicta la materia de la nota
router.delete('/:id', verificarToken, soloRol('docente'), async (req, res) => {
  try {
    const idNota = aEntero(req.params.id);
    if (!idNota) return res.status(400).json({ mensaje: 'Identificador de nota no válido.' });
    if (rechazarSiNoEsPropia(res, await relacionConNota(req.usuario.id, idNota), 'Nota')) return;

    const [resultado] = await db.query('DELETE FROM nota WHERE idNota = ?', [idNota]);
    if (resultado.affectedRows === 0) return res.status(404).json({ mensaje: 'Nota no encontrada.' });
    res.json({ mensaje: 'Nota eliminada.' });
  } catch (err) {
    res.status(500).json({ mensaje: 'Error al eliminar la nota.' });
  }
});

module.exports = router;
