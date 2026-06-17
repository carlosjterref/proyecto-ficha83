const express = require('express');
const cors    = require('cors');
require('dotenv').config();

const app = express();

// Middlewares globales
app.use(cors());
app.use(express.json());

// Rutas
app.use('/api/auth',           require('./routes/auth'));
app.use('/api/alumnos',        require('./routes/alumnos'));
app.use('/api/docentes',       require('./routes/docentes'));
app.use('/api/acudientes',     require('./routes/acudientes'));
app.use('/api/materias',       require('./routes/materias'));
app.use('/api/notas',          require('./routes/notas'));
app.use('/api/comunicaciones', require('./routes/comunicaciones'));

// Ruta base
app.get('/', (req, res) => {
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
