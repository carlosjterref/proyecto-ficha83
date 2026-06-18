const express = require('express');
const router  = express.Router();
const db      = require('../config/db');
const { verificarToken, soloRol } = require('../middleware/auth');

// GET /api/noticias  — PÚBLICO: lista de noticias publicadas (más recientes primero)
router.get('/', async (req, res) => {
  const { categoria } = req.query; // opcional: filtrar por categoría
  try {
    let sql = `SELECT n.idNoticia, n.titulo, n.contenido, n.categoria,
                      n.mediaUrl, n.tipoMedia, n.fechaPublicacion,
                      a.nombre AS autor
               FROM noticia n
               INNER JOIN administrador a ON n.idAdmin = a.idAdmin`;
    const params = [];
    if (categoria) { sql += ' WHERE n.categoria = ?'; params.push(categoria); }
    sql += ' ORDER BY n.fechaPublicacion DESC';

    const [filas] = await db.query(sql, params);
    res.json(filas);
  } catch (err) {
    res.status(500).json({ mensaje: 'Error al obtener noticias.' });
  }
});

// GET /api/noticias/:id  — PÚBLICO: una noticia
router.get('/:id', async (req, res) => {
  try {
    const [filas] = await db.query(
      `SELECT n.*, a.nombre AS autor
       FROM noticia n
       INNER JOIN administrador a ON n.idAdmin = a.idAdmin
       WHERE n.idNoticia = ?`,
      [req.params.id]
    );
    if (filas.length === 0) return res.status(404).json({ mensaje: 'Noticia no encontrada.' });
    res.json(filas[0]);
  } catch (err) {
    res.status(500).json({ mensaje: 'Error al obtener la noticia.' });
  }
});

// POST /api/noticias  — solo admin
router.post('/', verificarToken, soloRol('admin'), async (req, res) => {
  const { titulo, contenido, categoria, mediaUrl, tipoMedia } = req.body;

  if (!titulo || !contenido) {
    return res.status(400).json({ mensaje: 'El título y el contenido son obligatorios.' });
  }

  try {
    const [resultado] = await db.query(
      `INSERT INTO noticia (titulo, contenido, categoria, mediaUrl, tipoMedia, idAdmin)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [titulo, contenido, categoria || 'Noticia', mediaUrl || null,
       tipoMedia || 'ninguno', req.usuario.id]
    );
    res.status(201).json({ mensaje: 'Noticia publicada.', id: resultado.insertId });
  } catch (err) {
    res.status(500).json({ mensaje: 'Error al publicar la noticia.' });
  }
});

// PUT /api/noticias/:id  — solo admin
router.put('/:id', verificarToken, soloRol('admin'), async (req, res) => {
  const { titulo, contenido, categoria, mediaUrl, tipoMedia } = req.body;
  try {
    const [resultado] = await db.query(
      `UPDATE noticia SET titulo=?, contenido=?, categoria=?, mediaUrl=?, tipoMedia=?
       WHERE idNoticia=?`,
      [titulo, contenido, categoria, mediaUrl || null, tipoMedia || 'ninguno', req.params.id]
    );
    if (resultado.affectedRows === 0) return res.status(404).json({ mensaje: 'Noticia no encontrada.' });
    res.json({ mensaje: 'Noticia actualizada.' });
  } catch (err) {
    res.status(500).json({ mensaje: 'Error al actualizar la noticia.' });
  }
});

// DELETE /api/noticias/:id  — solo admin
router.delete('/:id', verificarToken, soloRol('admin'), async (req, res) => {
  try {
    const [resultado] = await db.query('DELETE FROM noticia WHERE idNoticia = ?', [req.params.id]);
    if (resultado.affectedRows === 0) return res.status(404).json({ mensaje: 'Noticia no encontrada.' });
    res.json({ mensaje: 'Noticia eliminada.' });
  } catch (err) {
    res.status(500).json({ mensaje: 'Error al eliminar la noticia.' });
  }
});

module.exports = router;
