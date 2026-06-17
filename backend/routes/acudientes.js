const express = require('express');
const router  = express.Router();
const bcrypt  = require('bcryptjs');
const db      = require('../config/db');
const { verificarToken, soloRol } = require('../middleware/auth');

// GET /api/acudientes  — solo docentes
router.get('/', verificarToken, soloRol('docente'), async (req, res) => {
  try {
    const [filas] = await db.query(
      `SELECT p.idPadre, p.nombre, p.documento, p.parentesco, p.usuario,
              a.nombre AS nombreAlumno, a.apellido AS apellidoAlumno
       FROM padreacudiente p
       INNER JOIN alumno a ON p.idAlumno = a.idAlumno`
    );
    res.json(filas);
  } catch (err) {
    res.status(500).json({ mensaje: 'Error al obtener acudientes.' });
  }
});

// GET /api/acudientes/:id
router.get('/:id', verificarToken, async (req, res) => {
  try {
    const [filas] = await db.query(
      `SELECT p.idPadre, p.nombre, p.documento, p.parentesco, p.usuario, p.idAlumno,
              a.nombre AS nombreAlumno, a.apellido AS apellidoAlumno
       FROM padreacudiente p
       INNER JOIN alumno a ON p.idAlumno = a.idAlumno
       WHERE p.idPadre = ?`,
      [req.params.id]
    );
    if (filas.length === 0) return res.status(404).json({ mensaje: 'Acudiente no encontrado.' });
    res.json(filas[0]);
  } catch (err) {
    res.status(500).json({ mensaje: 'Error al obtener el acudiente.' });
  }
});

// POST /api/acudientes  — solo docentes
router.post('/', verificarToken, soloRol('docente'), async (req, res) => {
  const { nombre, documento, parentesco, usuario, contrasena, idAlumno } = req.body;

  if (!nombre || !documento || !usuario || !contrasena || !idAlumno) {
    return res.status(400).json({ mensaje: 'Faltan campos obligatorios.' });
  }

  try {
    const hash = await bcrypt.hash(contrasena, 10);
    const [resultado] = await db.query(
      'INSERT INTO padreacudiente (nombre, documento, parentesco, usuario, contrasena, idAlumno) VALUES (?, ?, ?, ?, ?, ?)',
      [nombre, documento, parentesco, usuario, hash, idAlumno]
    );
    res.status(201).json({ mensaje: 'Acudiente creado.', id: resultado.insertId });
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ mensaje: 'El usuario o documento ya existe.' });
    }
    res.status(500).json({ mensaje: 'Error al crear el acudiente.' });
  }
});

// PUT /api/acudientes/:id  — solo docentes
router.put('/:id', verificarToken, soloRol('docente'), async (req, res) => {
  const { nombre, documento, parentesco, usuario, idAlumno } = req.body;

  try {
    const [resultado] = await db.query(
      'UPDATE padreacudiente SET nombre=?, documento=?, parentesco=?, usuario=?, idAlumno=? WHERE idPadre=?',
      [nombre, documento, parentesco, usuario, idAlumno, req.params.id]
    );
    if (resultado.affectedRows === 0) return res.status(404).json({ mensaje: 'Acudiente no encontrado.' });
    res.json({ mensaje: 'Acudiente actualizado.' });
  } catch (err) {
    res.status(500).json({ mensaje: 'Error al actualizar el acudiente.' });
  }
});

// DELETE /api/acudientes/:id  — solo docentes
router.delete('/:id', verificarToken, soloRol('docente'), async (req, res) => {
  try {
    const [resultado] = await db.query('DELETE FROM padreacudiente WHERE idPadre = ?', [req.params.id]);
    if (resultado.affectedRows === 0) return res.status(404).json({ mensaje: 'Acudiente no encontrado.' });
    res.json({ mensaje: 'Acudiente eliminado.' });
  } catch (err) {
    res.status(500).json({ mensaje: 'Error al eliminar el acudiente.' });
  }
});

module.exports = router;
