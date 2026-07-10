const express = require('express');
const cors    = require('cors');
const path    = require('path');
require('dotenv').config();

const app = express();

// Middlewares globales
app.use(cors());
app.use(express.json());

// Servir el frontend estático (HTML, CSS, JS, imágenes)
// Así todo corre bajo http://localhost:3000 y se evitan problemas de CORS / file://
app.use(express.static(path.join(__dirname, '..', 'frontend')));

// Rutas
app.use('/api/auth',           require('./routes/auth'));
app.use('/api/alumnos',        require('./routes/alumnos'));
app.use('/api/docentes',       require('./routes/docentes'));
app.use('/api/acudientes',     require('./routes/acudientes'));
app.use('/api/materias',       require('./routes/materias'));
app.use('/api/notas',          require('./routes/notas'));
app.use('/api/comunicaciones', require('./routes/comunicaciones'));
app.use('/api/noticias',       require('./routes/noticias'));
app.use('/api/circulares',     require('./routes/circulares'));
app.use('/api/inscripciones',  require('./routes/inscripciones'));
app.use('/api/festivos',       require('./routes/festivos'));

// Endpoint de salud para comprobar que la API responde
app.get('/api/health', (req, res) => {
  res.json({ mensaje: 'API Colegio Yermo y Parres activa.' });
});

// Manejo de rutas no encontradas
app.use((req, res) => {
  res.status(404).json({ mensaje: 'Ruta no encontrada.' });
});

// Iniciar servidor
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`);
});
