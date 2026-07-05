const express = require('express');
const router  = express.Router();
const bcrypt  = require('bcryptjs');
const db      = require('../config/db');
const { verificarToken, soloRol } = require('../middleware/auth');

// GET /api/docentes
router.get('/', verificarToken, async (req, res) => {
  try {
    const [filas] = await db.query(
      'SELECT idDocente, nombre, especialidad, correo, usuario FROM docente'
    );
    res.json(filas);
  } catch (err) {
    res.status(500).json({ mensaje: 'Error al obtener docentes.' });
  }
});

// GET /api/docentes/plantel  — PÚBLICO: directorio de docentes para el sitio
router.get('/plantel', async (req, res) => {
  try {
    const [filas] = await db.query(
      `SELECT idDocente, nombre, especialidad, cursoPrincipal
       FROM docente
       WHERE cursoPrincipal IS NOT NULL
       ORDER BY especialidad, nombre`
    );
    res.json(filas);
  } catch (err) {
    res.status(500).json({ mensaje: 'Error al obtener el plantel.' });
  }
});

// GET /api/docentes/:id
router.get('/:id', verificarToken, async (req, res) => {
  try {
    const [filas] = await db.query(
      'SELECT idDocente, nombre, especialidad, correo, usuario FROM docente WHERE idDocente = ?',
      [req.params.id]
    );
    if (filas.length === 0) return res.status(404).json({ mensaje: 'Docente no encontrado.' });
    res.json(filas[0]);
  } catch (err) {
    res.status(500).json({ mensaje: 'Error al obtener el docente.' });
  }
});

// POST /api/docentes
router.post('/', verificarToken, soloRol('docente'), async (req, res) => {
  const { nombre, especialidad, correo, usuario, contrasena } = req.body;

  if (!nombre || !usuario || !contrasena) {
    return res.status(400).json({ mensaje: 'Faltan campos obligatorios.' });
  }

  try {
    const hash = await bcrypt.hash(contrasena, 10);
    const [resultado] = await db.query(
      'INSERT INTO docente (nombre, especialidad, correo, usuario, contrasena) VALUES (?, ?, ?, ?, ?)',
      [nombre, especialidad, correo, usuario, hash]
    );
    res.status(201).json({ mensaje: 'Docente creado.', id: resultado.insertId });
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ mensaje: 'El usuario o correo ya existe.' });
    }
    res.status(500).json({ mensaje: 'Error al crear el docente.' });
  }
});

// PUT /api/docentes/:id
router.put('/:id', verificarToken, soloRol('docente'), async (req, res) => {
  const { nombre, especialidad, correo, usuario } = req.body;

  try {
    const [resultado] = await db.query(
      'UPDATE docente SET nombre=?, especialidad=?, correo=?, usuario=? WHERE idDocente=?',
      [nombre, especialidad, correo, usuario, req.params.id]
    );
    if (resultado.affectedRows === 0) return res.status(404).json({ mensaje: 'Docente no encontrado.' });
    res.json({ mensaje: 'Docente actualizado.' });
  } catch (err) {
    res.status(500).json({ mensaje: 'Error al actualizar el docente.' });
  }
});

// DELETE /api/docentes/:id
router.delete('/:id', verificarToken, soloRol('docente'), async (req, res) => {
  try {
    const [resultado] = await db.query('DELETE FROM docente WHERE idDocente = ?', [req.params.id]);
    if (resultado.affectedRows === 0) return res.status(404).json({ mensaje: 'Docente no encontrado.' });
    res.json({ mensaje: 'Docente eliminado.' });
  } catch (err) {
    res.status(500).json({ mensaje: 'Error al eliminar el docente.' });
  }
});

module.exports = router;
