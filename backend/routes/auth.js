const express = require('express');
const router  = express.Router();
const bcrypt  = require('bcryptjs');
const jwt     = require('jsonwebtoken');
const db      = require('../config/db');
const { verificarToken } = require('../middleware/auth');
require('dotenv').config();

// Mapea un rol a su tabla y su campo de id (reutilizado por login y cambio de clave)
function tablaPorRol(rol) {
  switch (rol) {
    case 'alumno':    return { tabla: 'alumno',         idCampo: 'idAlumno' };
    case 'docente':   return { tabla: 'docente',        idCampo: 'idDocente' };
    case 'acudiente': return { tabla: 'padreacudiente', idCampo: 'idPadre' };
    case 'admin':     return { tabla: 'administrador',  idCampo: 'idAdmin' };
    default:          return null;
  }
}

// POST /api/auth/login
// Body: { usuario, contrasena, rol }  -> rol: 'alumno' | 'docente' | 'acudiente'
router.post('/login', async (req, res) => {
  const { usuario, contrasena, rol } = req.body;

  if (!usuario || !contrasena || !rol) {
    return res.status(400).json({ mensaje: 'Usuario, contraseña y rol son obligatorios.' });
  }

  try {
    let tabla, idCampo;

    if (rol === 'alumno') {
      tabla   = 'alumno';
      idCampo = 'idAlumno';
    } else if (rol === 'docente') {
      tabla   = 'docente';
      idCampo = 'idDocente';
    } else if (rol === 'acudiente') {
      tabla   = 'padreacudiente';
      idCampo = 'idPadre';
    } else if (rol === 'admin') {
      tabla   = 'administrador';
      idCampo = 'idAdmin';
    } else {
      return res.status(400).json({ mensaje: 'Rol no válido.' });
    }

    // Las tres tablas comparten los campos de identidad: usuario, correo y documento.
    // El usuario puede ingresar con cualquiera de los tres.
    const [filas] = await db.query(
      `SELECT * FROM ${tabla} WHERE usuario = ? OR correo = ? OR documento = ?`,
      [usuario, usuario, usuario]   // el mismo valor se compara contra los tres campos
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

// PUT /api/auth/password  — el usuario autenticado cambia su propia contraseña
// Body: { actual, nueva }
router.put('/password', verificarToken, async (req, res) => {
  const { actual, nueva } = req.body;
  const { id, rol } = req.usuario; // viene del token

  if (!actual || !nueva) {
    return res.status(400).json({ mensaje: 'Debe indicar la contraseña actual y la nueva.' });
  }
  if (nueva.length < 4) {
    return res.status(400).json({ mensaje: 'La nueva contraseña es demasiado corta.' });
  }

  const mapa = tablaPorRol(rol);
  if (!mapa) return res.status(400).json({ mensaje: 'Rol no válido.' });

  try {
    const [filas] = await db.query(
      `SELECT contrasena FROM ${mapa.tabla} WHERE ${mapa.idCampo} = ?`,
      [id]
    );
    if (filas.length === 0) return res.status(404).json({ mensaje: 'Usuario no encontrado.' });

    // Verificar que la contraseña actual sea correcta
    const valida = await bcrypt.compare(actual, filas[0].contrasena);
    if (!valida) return res.status(401).json({ mensaje: 'La contraseña actual es incorrecta.' });

    // Guardar la nueva contraseña encriptada
    const hash = await bcrypt.hash(nueva, 10);
    await db.query(
      `UPDATE ${mapa.tabla} SET contrasena = ? WHERE ${mapa.idCampo} = ?`,
      [hash, id]
    );

    res.json({ mensaje: 'Contraseña actualizada correctamente.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ mensaje: 'Error al cambiar la contraseña.' });
  }
});

module.exports = router;
