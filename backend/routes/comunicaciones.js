const express = require('express');
const router  = express.Router();
const db      = require('../config/db');
const { verificarToken } = require('../middleware/auth');

// GET /api/comunicaciones/recibidos  — mensajes recibidos por el usuario autenticado
router.get('/recibidos', verificarToken, async (req, res) => {
  const { id, rol } = req.usuario;

  const tipoMap = { docente: 'Docente', alumno: 'Alumno', acudiente: 'PadreAcudiente' };
  const tipoReceptor = tipoMap[rol];

  try {
    const [filas] = await db.query(
      `SELECT c.idMensaje, c.contenido, c.fechaHora, c.tipo, c.leida,
              c.idEmisor, c.emisorTipo
       FROM comunicacion c
       INNER JOIN comunicacion_receptor cr ON c.idMensaje = cr.idMensaje
       WHERE cr.idReceptor = ? AND cr.receptorTipo = ?
       ORDER BY c.fechaHora DESC`,
      [id, tipoReceptor]
    );
    res.json(filas);
  } catch (err) {
    res.status(500).json({ mensaje: 'Error al obtener mensajes recibidos.' });
  }
});

// GET /api/comunicaciones/enviados  — mensajes enviados por el usuario autenticado
router.get('/enviados', verificarToken, async (req, res) => {
  const { id, rol } = req.usuario;
  const tipoMap = { docente: 'Docente', alumno: 'Alumno', acudiente: 'PadreAcudiente' };
  const emisorTipo = tipoMap[rol];

  try {
    const [filas] = await db.query(
      `SELECT idMensaje, contenido, fechaHora, tipo, leida
       FROM comunicacion
       WHERE idEmisor = ? AND emisorTipo = ?
       ORDER BY fechaHora DESC`,
      [id, emisorTipo]
    );
    res.json(filas);
  } catch (err) {
    res.status(500).json({ mensaje: 'Error al obtener mensajes enviados.' });
  }
});

// POST /api/comunicaciones  — enviar mensaje
// Body: { contenido, tipo, receptores: [{ idReceptor, receptorTipo }] }
router.post('/', verificarToken, async (req, res) => {
  const { contenido, tipo, receptores } = req.body;
  const { id, rol } = req.usuario;

  if (!contenido || !receptores || receptores.length === 0) {
    return res.status(400).json({ mensaje: 'Faltan campos obligatorios.' });
  }

  const tipoMap = { docente: 'Docente', alumno: 'Alumno', acudiente: 'PadreAcudiente' };
  const emisorTipo = tipoMap[rol];

  const conn = await (await import('../config/db.js')).default.getConnection
    ? null
    : null;

  try {
    const [resultado] = await db.query(
      'INSERT INTO comunicacion (contenido, tipo, idEmisor, emisorTipo) VALUES (?, ?, ?, ?)',
      [contenido, tipo || null, id, emisorTipo]
    );

    const idMensaje = resultado.insertId;

    const valores = receptores.map(r => [idMensaje, r.idReceptor, r.receptorTipo]);
    await db.query(
      'INSERT INTO comunicacion_receptor (idMensaje, idReceptor, receptorTipo) VALUES ?',
      [valores]
    );

    res.status(201).json({ mensaje: 'Mensaje enviado.', idMensaje });
  } catch (err) {
    console.error(err);
    res.status(500).json({ mensaje: 'Error al enviar el mensaje.' });
  }
});

// PATCH /api/comunicaciones/:id/leer  — marcar mensaje como leído
router.patch('/:id/leer', verificarToken, async (req, res) => {
  try {
    await db.query('UPDATE comunicacion SET leida = 1 WHERE idMensaje = ?', [req.params.id]);
    res.json({ mensaje: 'Mensaje marcado como leído.' });
  } catch (err) {
    res.status(500).json({ mensaje: 'Error al marcar el mensaje.' });
  }
});

module.exports = router;
