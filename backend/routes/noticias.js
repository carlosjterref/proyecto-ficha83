const express = require('express');
const router  = express.Router();
const db      = require('../config/db');
const { verificarToken, soloRol } = require('../middleware/auth');
const { aEntero } = require('../middleware/permisos');
const { texto, urlHttp } = require('../middleware/validaciones');

const TIPOS_MEDIA = ['imagen', 'video', 'ninguno'];

// Valida y normaliza el cuerpo de una noticia. Devuelve { datos } o { error }.
function validarNoticia(cuerpo) {
  const titulo    = texto(cuerpo.titulo, 200);
  const contenido = texto(cuerpo.contenido, 20000);
  const categoria = cuerpo.categoria ? texto(cuerpo.categoria, 50) : 'Noticia';
  const tipoMedia = cuerpo.tipoMedia || 'ninguno';

  if (!titulo || !contenido) return { error: 'El título y el contenido son obligatorios.' };
  if (!categoria) return { error: 'La categoría no es válida.' };
  if (!TIPOS_MEDIA.includes(tipoMedia)) return { error: 'El tipo de multimedia no es válido.' };

  let mediaUrl = null;
  if (cuerpo.mediaUrl) {
    mediaUrl = urlHttp(cuerpo.mediaUrl);
    if (!mediaUrl) return { error: 'El enlace de la multimedia debe ser una dirección http o https válida.' };
  }
  return { datos: { titulo, contenido, categoria, tipoMedia, mediaUrl } };
}

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
  const { datos, error } = validarNoticia(req.body);
  if (error) return res.status(400).json({ mensaje: error });

  try {
    const [resultado] = await db.query(
      `INSERT INTO noticia (titulo, contenido, categoria, mediaUrl, tipoMedia, idAdmin)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [datos.titulo, datos.contenido, datos.categoria, datos.mediaUrl, datos.tipoMedia, req.usuario.id]
    );
    res.status(201).json({ mensaje: 'Noticia publicada.', id: resultado.insertId });
  } catch (err) {
    res.status(500).json({ mensaje: 'Error al publicar la noticia.' });
  }
});

// PUT /api/noticias/:id  — solo admin
router.put('/:id', verificarToken, soloRol('admin'), async (req, res) => {
  const idNoticia = aEntero(req.params.id);
  if (!idNoticia) return res.status(400).json({ mensaje: 'Identificador de noticia no válido.' });
  const { datos, error } = validarNoticia(req.body);
  if (error) return res.status(400).json({ mensaje: error });

  try {
    const [resultado] = await db.query(
      `UPDATE noticia SET titulo=?, contenido=?, categoria=?, mediaUrl=?, tipoMedia=?
       WHERE idNoticia=?`,
      [datos.titulo, datos.contenido, datos.categoria, datos.mediaUrl, datos.tipoMedia, idNoticia]
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
