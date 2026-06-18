const express = require('express');
const router  = express.Router();
const db      = require('../config/db');
const { verificarToken, soloRol } = require('../middleware/auth');

// GET /api/materias  — todas las materias con nombre del docente
router.get('/', verificarToken, async (req, res) => {
  try {
    const [filas] = await db.query(
      `SELECT m.idMateria, m.nombre, m.grado, m.idDocente,
              d.nombre AS nombreDocente
       FROM materia m
       INNER JOIN docente d ON m.idDocente = d.idDocente`
    );
    res.json(filas);
  } catch (err) {
    res.status(500).json({ mensaje: 'Error al obtener materias.' });
  }
});

// GET /api/materias/:id
router.get('/:id', verificarToken, async (req, res) => {
  try {
    const [filas] = await db.query(
      `SELECT m.idMateria, m.nombre, m.grado, m.idDocente,
              d.nombre AS nombreDocente
       FROM materia m
       INNER JOIN docente d ON m.idDocente = d.idDocente
       WHERE m.idMateria = ?`,
      [req.params.id]
    );
    if (filas.length === 0) return res.status(404).json({ mensaje: 'Materia no encontrada.' });
    res.json(filas[0]);
  } catch (err) {
    res.status(500).json({ mensaje: 'Error al obtener la materia.' });
  }
});

// GET /api/materias/grado/:grado  — materias por grado
router.get('/grado/:grado', verificarToken, async (req, res) => {
  try {
    const [filas] = await db.query(
      `SELECT m.idMateria, m.nombre, m.grado, d.nombre AS nombreDocente
       FROM materia m
       INNER JOIN docente d ON m.idDocente = d.idDocente
       WHERE m.grado = ?`,
      [req.params.grado]
    );
    res.json(filas);
  } catch (err) {
    res.status(500).json({ mensaje: 'Error al obtener materias por grado.' });
  }
});

// GET /api/materias/:id/alumnos  — alumnos inscritos en una materia (con su nota si existe)
router.get('/:id/alumnos', verificarToken, async (req, res) => {
  const { periodo } = req.query; // opcional: filtra la nota por periodo
  try {
    const [filas] = await db.query(
      `SELECT a.idAlumno, a.nombre, a.apellido, a.documento, a.grado,
              n.idNota, n.calificacion, n.periodo
       FROM materia_alumno ma
       INNER JOIN alumno a ON ma.idAlumno = a.idAlumno
       LEFT JOIN nota n
         ON n.idAlumno = a.idAlumno
        AND n.idMateria = ma.idMateria
        AND (? IS NULL OR n.periodo = ?)
       WHERE ma.idMateria = ?
       ORDER BY a.apellido, a.nombre`,
      [periodo || null, periodo || null, req.params.id]
    );
    res.json(filas);
  } catch (err) {
    res.status(500).json({ mensaje: 'Error al obtener alumnos de la materia.' });
  }
});

// POST /api/materias  — solo docentes
router.post('/', verificarToken, soloRol('docente'), async (req, res) => {
  const { nombre, grado, idDocente } = req.body;

  if (!nombre || !grado || !idDocente) {
    return res.status(400).json({ mensaje: 'Faltan campos obligatorios.' });
  }

  try {
    const [resultado] = await db.query(
      'INSERT INTO materia (nombre, grado, idDocente) VALUES (?, ?, ?)',
      [nombre, grado, idDocente]
    );
    res.status(201).json({ mensaje: 'Materia creada.', id: resultado.insertId });
  } catch (err) {
    res.status(500).json({ mensaje: 'Error al crear la materia.' });
  }
});

// PUT /api/materias/:id  — solo docentes
router.put('/:id', verificarToken, soloRol('docente'), async (req, res) => {
  const { nombre, grado, idDocente } = req.body;

  try {
    const [resultado] = await db.query(
      'UPDATE materia SET nombre=?, grado=?, idDocente=? WHERE idMateria=?',
      [nombre, grado, idDocente, req.params.id]
    );
    if (resultado.affectedRows === 0) return res.status(404).json({ mensaje: 'Materia no encontrada.' });
    res.json({ mensaje: 'Materia actualizada.' });
  } catch (err) {
    res.status(500).json({ mensaje: 'Error al actualizar la materia.' });
  }
});

// DELETE /api/materias/:id  — solo docentes
router.delete('/:id', verificarToken, soloRol('docente'), async (req, res) => {
  try {
    const [resultado] = await db.query('DELETE FROM materia WHERE idMateria = ?', [req.params.id]);
    if (resultado.affectedRows === 0) return res.status(404).json({ mensaje: 'Materia no encontrada.' });
    res.json({ mensaje: 'Materia eliminada.' });
  } catch (err) {
    res.status(500).json({ mensaje: 'Error al eliminar la materia.' });
  }
});

module.exports = router;
