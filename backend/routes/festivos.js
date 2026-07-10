const express = require('express');
const router  = express.Router();

/* =============================================
   SERVICIO DE CONSUMO DE API EXTERNA
   Consume la API pública Nager.Date para obtener
   los días festivos de Colombia y los expone en
   nuestra propia API: GET /api/festivos
   ============================================= */

// Caché en memoria para no llamar al servicio externo en cada petición
const cache = {};                 // { anio: { data, ts } }
const TTL = 1000 * 60 * 60 * 12;  // 12 horas

// GET /api/festivos  — PÚBLICO
// Query opcional: ?anio=2026  (por defecto, el año actual)
router.get('/', async (req, res) => {
  const anio = parseInt(req.query.anio, 10) || new Date().getFullYear();

  // Si está en caché y aún es válido, se devuelve sin consultar el servicio externo
  if (cache[anio] && (Date.now() - cache[anio].ts) < TTL) {
    return res.json(cache[anio].data);
  }

  try {
    const url = `https://date.nager.at/api/v3/PublicHolidays/${anio}/CO`;
    const respuesta = await fetch(url); // fetch nativo de Node 18+

    if (!respuesta.ok) {
      return res.status(502).json({ mensaje: 'El servicio externo de festivos no está disponible.' });
    }

    const festivos = await respuesta.json();

    // Simplificamos la respuesta a lo que necesita el frontend
    const data = festivos.map(f => ({
      fecha:  f.date,        // "2026-01-01"
      nombre: f.localName,   // nombre en español
      nombreIngles: f.name,
    }));

    cache[anio] = { data, ts: Date.now() };
    res.json(data);
  } catch (err) {
    console.error('Error al consumir la API de festivos:', err.message);
    res.status(500).json({ mensaje: 'Error al consultar el servicio de festivos.' });
  }
});

module.exports = router;
