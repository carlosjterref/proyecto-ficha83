const express = require('express');
const router  = express.Router();
const db      = require('../config/db');
const { verificarToken, soloRol } = require('../middleware/auth');

// GET /api/circulares  — PÚBLICO: lista de circulares (más recientes primero)
router.get('/', async (req, res) => {
  try {
    const [filas] = await db.query(
      `SELECT c.idCircular, c.titulo, c.descripcion, c.archivoUrl, c.fechaPublicacion,
              a.nombre AS autor
       FROM circular c
       INNER JOIN administrador a ON c.idAdmin = a.idAdmin
       ORDER BY c.fechaPublicacion DESC`
    );
    res.json(filas);
  } catch (err) {
    res.status(500).json({ mensaje: 'Error al obtener circulares.' });
  }
});

// POST /api/circulares  — solo admin
router.post('/', verificarToken, soloRol('admin'), async (req, res) => {
  const { titulo, descripcion, archivoUrl } = req.body;

  if (!titulo || !archivoUrl) {
    return res.status(400).json({ mensaje: 'El título y el enlace del documento son obligatorios.' });
  }

  try {
    const [resultado] = await db.query(
      'INSERT INTO circular (titulo, descripcion, archivoUrl, idAdmin) VALUES (?, ?, ?, ?)',
      [titulo, descripcion || null, archivoUrl, req.usuario.id]
    );
    res.status(201).json({ mensaje: 'Circular publicada.', id: resultado.insertId });
  } catch (err) {
    res.status(500).json({ mensaje: 'Error al publicar la circular.' });
  }
});

// PUT /api/circulares/:id  — solo admin
router.put('/:id', verificarToken, soloRol('admin'), async (req, res) => {
  const { titulo, descripcion, archivoUrl } = req.body;
  try {
    const [resultado] = await db.query(
      'UPDATE circular SET titulo=?, descripcion=?, archivoUrl=? WHERE idCircular=?',
      [titulo, descripcion || null, archivoUrl, req.params.id]
    );
    if (resultado.affectedRows === 0) return res.status(404).json({ mensaje: 'Circular no encontrada.' });
    res.json({ mensaje: 'Circular actualizada.' });
  } catch (err) {
    res.status(500).json({ mensaje: 'Error al actualizar la circular.' });
  }
});

// DELETE /api/circulares/:id  — solo admin
router.delete('/:id', verificarToken, soloRol('admin'), async (req, res) => {
  try {
    const [resultado] = await db.query('DELETE FROM circular WHERE idCircular = ?', [req.params.id]);
    if (resultado.affectedRows === 0) return res.status(404).json({ mensaje: 'Circular no encontrada.' });
    res.json({ mensaje: 'Circular eliminada.' });
  } catch (err) {
    res.status(500).json({ mensaje: 'Error al eliminar la circular.' });
  }
});

module.exports = router;
