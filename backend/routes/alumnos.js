const express = require('express');
const router  = express.Router();
const bcrypt  = require('bcryptjs');
const db      = require('../config/db');
const { verificarToken, soloRol } = require('../middleware/auth');

// GET /api/alumnos  — solo docentes
router.get('/', verificarToken, soloRol('docente'), async (req, res) => {
  try {
    const [filas] = await db.query(
      'SELECT idAlumno, nombre, apellido, grado, correo, usuario FROM alumno'
    );
    res.json(filas);
  } catch (err) {
    res.status(500).json({ mensaje: 'Error al obtener alumnos.' });
  }
});

// GET /api/alumnos/:id
router.get('/:id', verificarToken, async (req, res) => {
  try {
    const [filas] = await db.query(
      'SELECT idAlumno, nombre, apellido, grado, correo, usuario FROM alumno WHERE idAlumno = ?',
      [req.params.id]
    );
    if (filas.length === 0) return res.status(404).json({ mensaje: 'Alumno no encontrado.' });
    res.json(filas[0]);
  } catch (err) {
    res.status(500).json({ mensaje: 'Error al obtener el alumno.' });
  }
});

// POST /api/alumnos  — solo docentes
router.post('/', verificarToken, soloRol('docente'), async (req, res) => {
  const { nombre, apellido, grado, correo, usuario, contrasena } = req.body;

  if (!nombre || !apellido || !grado || !usuario || !contrasena) {
    return res.status(400).json({ mensaje: 'Faltan campos obligatorios.' });
  }

  try {
    const hash = await bcrypt.hash(contrasena, 10);
    const [resultado] = await db.query(
      'INSERT INTO alumno (nombre, apellido, grado, correo, usuario, contrasena) VALUES (?, ?, ?, ?, ?, ?)',
      [nombre, apellido, grado, correo, usuario, hash]
    );
    res.status(201).json({ mensaje: 'Alumno creado.', id: resultado.insertId });
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ mensaje: 'El usuario o correo ya existe.' });
    }
    res.status(500).json({ mensaje: 'Error al crear el alumno.' });
  }
});

// PUT /api/alumnos/:id  — solo docentes
router.put('/:id', verificarToken, soloRol('docente'), async (req, res) => {
  const { nombre, apellido, grado, correo, usuario } = req.body;

  try {
    const [resultado] = await db.query(
      'UPDATE alumno SET nombre=?, apellido=?, grado=?, correo=?, usuario=? WHERE idAlumno=?',
      [nombre, apellido, grado, correo, usuario, req.params.id]
    );
    if (resultado.affectedRows === 0) return res.status(404).json({ mensaje: 'Alumno no encontrado.' });
    res.json({ mensaje: 'Alumno actualizado.' });
  } catch (err) {
    res.status(500).json({ mensaje: 'Error al actualizar el alumno.' });
  }
});

// DELETE /api/alumnos/:id  — solo docentes
router.delete('/:id', verificarToken, soloRol('docente'), async (req, res) => {
  try {
    const [resultado] = await db.query('DELETE FROM alumno WHERE idAlumno = ?', [req.params.id]);
    if (resultado.affectedRows === 0) return res.status(404).json({ mensaje: 'Alumno no encontrado.' });
    res.json({ mensaje: 'Alumno eliminado.' });
  } catch (err) {
    res.status(500).json({ mensaje: 'Error al eliminar el alumno.' });
  }
});

module.exports = router;
