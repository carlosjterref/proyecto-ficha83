const express = require('express');
const router  = express.Router();
const db      = require('../config/db');
const { verificarToken, soloRol } = require('../middleware/auth');

// GET /api/notas/alumno/:idAlumno  — notas de un alumno (alumno o docente)
router.get('/alumno/:idAlumno', verificarToken, async (req, res) => {
  try {
    const [filas] = await db.query(
      `SELECT n.idNota, n.calificacion, n.periodo,
              m.nombre AS materia, m.grado,
              d.nombre AS docente
       FROM nota n
       INNER JOIN materia m ON n.idMateria = m.idMateria
       INNER JOIN docente d ON n.idDocente = d.idDocente
       WHERE n.idAlumno = ?
       ORDER BY n.periodo, m.nombre`,
      [req.params.idAlumno]
    );
    res.json(filas);
  } catch (err) {
    res.status(500).json({ mensaje: 'Error al obtener notas.' });
  }
});

// GET /api/notas/materia/:idMateria  — notas de una materia (solo docentes)
router.get('/materia/:idMateria', verificarToken, soloRol('docente'), async (req, res) => {
  try {
    const [filas] = await db.query(
      `SELECT n.idNota, n.calificacion, n.periodo,
              a.nombre AS alumno, a.apellido, a.grado
       FROM nota n
       INNER JOIN alumno a ON n.idAlumno = a.idAlumno
       WHERE n.idMateria = ?
       ORDER BY n.periodo, a.apellido`,
      [req.params.idMateria]
    );
    res.json(filas);
  } catch (err) {
    res.status(500).json({ mensaje: 'Error al obtener notas por materia.' });
  }
});

// POST /api/notas  — solo docentes
router.post('/', verificarToken, soloRol('docente'), async (req, res) => {
  const { calificacion, periodo, idAlumno, idMateria, idDocente } = req.body;

  if (!calificacion || !periodo || !idAlumno || !idMateria || !idDocente) {
    return res.status(400).json({ mensaje: 'Faltan campos obligatorios.' });
  }

  if (calificacion < 0 || calificacion > 10) {
    return res.status(400).json({ mensaje: 'La calificación debe estar entre 0 y 10.' });
  }

  try {
    const [resultado] = await db.query(
      'INSERT INTO nota (calificacion, periodo, idAlumno, idMateria, idDocente) VALUES (?, ?, ?, ?, ?)',
      [calificacion, periodo, idAlumno, idMateria, idDocente]
    );
    res.status(201).json({ mensaje: 'Nota registrada.', id: resultado.insertId });
  } catch (err) {
    res.status(500).json({ mensaje: 'Error al registrar la nota.' });
  }
});

// PUT /api/notas/:id  — solo docentes
router.put('/:id', verificarToken, soloRol('docente'), async (req, res) => {
  const { calificacion, periodo } = req.body;

  if (calificacion < 0 || calificacion > 10) {
    return res.status(400).json({ mensaje: 'La calificación debe estar entre 0 y 10.' });
  }

  try {
    const [resultado] = await db.query(
      'UPDATE nota SET calificacion=?, periodo=? WHERE idNota=?',
      [calificacion, periodo, req.params.id]
    );
    if (resultado.affectedRows === 0) return res.status(404).json({ mensaje: 'Nota no encontrada.' });
    res.json({ mensaje: 'Nota actualizada.' });
  } catch (err) {
    res.status(500).json({ mensaje: 'Error al actualizar la nota.' });
  }
});

// DELETE /api/notas/:id  — solo docentes
router.delete('/:id', verificarToken, soloRol('docente'), async (req, res) => {
  try {
    const [resultado] = await db.query('DELETE FROM nota WHERE idNota = ?', [req.params.id]);
    if (resultado.affectedRows === 0) return res.status(404).json({ mensaje: 'Nota no encontrada.' });
    res.json({ mensaje: 'Nota eliminada.' });
  } catch (err) {
    res.status(500).json({ mensaje: 'Error al eliminar la nota.' });
  }
});

module.exports = router;
