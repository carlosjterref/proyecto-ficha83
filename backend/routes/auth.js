const express = require('express');
const router  = express.Router();
const bcrypt  = require('bcryptjs');
const jwt     = require('jsonwebtoken');
const db      = require('../config/db');
require('dotenv').config();

// POST /api/auth/login
// Body: { usuario, contrasena, rol }  -> rol: 'alumno' | 'docente' | 'acudiente'
router.post('/login', async (req, res) => {
  const { usuario, contrasena, rol } = req.body;

  if (!usuario || !contrasena || !rol) {
    return res.status(400).json({ mensaje: 'Usuario, contraseña y rol son obligatorios.' });
  }

  try {
    let tabla, idCampo, condicion;

    if (rol === 'alumno') {
      tabla     = 'alumno';
      idCampo   = 'idAlumno';
      condicion = 'usuario = ? OR correo = ?';     // entra por usuario o correo
    } else if (rol === 'docente') {
      tabla     = 'docente';
      idCampo   = 'idDocente';
      condicion = 'usuario = ? OR correo = ?';     // entra por usuario o correo
    } else if (rol === 'acudiente') {
      tabla     = 'padreacudiente';
      idCampo   = 'idPadre';
      condicion = 'usuario = ? OR documento = ?';  // entra por usuario o documento
    } else {
      return res.status(400).json({ mensaje: 'Rol no válido.' });
    }

    const [filas] = await db.query(
      `SELECT * FROM ${tabla} WHERE ${condicion}`,
      [usuario, usuario]   // el mismo valor se compara contra ambas columnas
    );

    if (filas.length === 0) {
      return res.status(401).json({ mensaje: 'Credenciales incorrectas.' });
    }

    const user = filas[0];
    const passwordValida = await bcrypt.compare(contrasena, user.contrasena);

    if (!passwordValida) {
      return res.status(401).json({ mensaje: 'Credenciales incorrectas.' });
    }

    const token = jwt.sign(
      { id: user[idCampo], usuario: user.usuario, rol },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN }
    );

    res.json({
      mensaje: 'Login exitoso.',
      token,
      usuario: {
        id:      user[idCampo],
        nombre:  user.nombre,
        usuario: user.usuario,
        rol,
      },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ mensaje: 'Error interno del servidor.' });
  }
});

module.exports = router;
