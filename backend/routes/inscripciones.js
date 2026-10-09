const express = require('express');
const router  = express.Router();
const bcrypt  = require('bcryptjs');
const db      = require('../config/db');
const { texto, correo, enteroEnRango, sinMarcado, MENSAJE_MARCADO } = require('../middleware/validaciones');

// Longitud mínima de contraseña (la misma que exige el cambio de contraseña) y máxima
// (bcrypt solo usa los primeros 72 caracteres).
const CLAVE_MIN = 4, CLAVE_MAX = 72;
const claveValida = c => typeof c === 'string' && c.length >= CLAVE_MIN && c.length <= CLAVE_MAX;

// POST /api/inscripciones  — PÚBLICO: registra un estudiante y su acudiente
// Body: { estudiante: {...}, acudiente: {...} }
router.post('/', async (req, res) => {
  const e = (req.body && req.body.estudiante) || {};
  const a = (req.body && req.body.acudiente)  || {};

  // Validación de campos obligatorios, tipos y longitudes (las de las columnas de la base de datos)
  const est = {
    nombre: texto(e.nombre, 100), apellido: texto(e.apellido, 100), documento: texto(e.documento, 20),
    grado: enteroEnRango(e.grado, 0, 999), correo: correo(e.correo),
    usuario: texto(e.usuario, 80, 3), contrasena: e.contrasena,
  };
  const acu = {
    nombre: texto(a.nombre, 100), documento: texto(a.documento, 20), parentesco: texto(a.parentesco, 50),
    correo: correo(a.correo), usuario: texto(a.usuario, 80, 3), contrasena: a.contrasena,
  };

  if (!est.nombre || !est.apellido || !est.documento || est.grado === null || !est.usuario || !est.contrasena) {
    return res.status(400).json({ mensaje: 'Faltan datos obligatorios del estudiante, o alguno no es válido.' });
  }
  if (!acu.nombre || !acu.documento || !acu.parentesco || !acu.usuario || !acu.contrasena) {
    return res.status(400).json({ mensaje: 'Faltan datos obligatorios del acudiente, o alguno no es válido.' });
  }
  if (est.correo === null || acu.correo === null) {
    return res.status(400).json({ mensaje: 'El correo electrónico no es válido.' });
  }
  if (!sinMarcado(est.nombre, est.apellido, est.documento, est.correo, est.usuario,
                  acu.nombre, acu.documento, acu.parentesco, acu.correo, acu.usuario)) {
    return res.status(400).json({ mensaje: MENSAJE_MARCADO });
  }
  if (!claveValida(est.contrasena) || !claveValida(acu.contrasena)) {
    return res.status(400).json({ mensaje: `La contraseña debe tener entre ${CLAVE_MIN} y ${CLAVE_MAX} caracteres.` });
  }

  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();

    // 1. Crear el estudiante
    const hashEst = await bcrypt.hash(est.contrasena, 10);
    const [rEst] = await conn.query(
      `INSERT INTO alumno (nombre, apellido, documento, grado, correo, usuario, contrasena)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [est.nombre, est.apellido, est.documento, est.grado, est.correo || null, est.usuario, hashEst]
    );
    const idAlumno = rEst.insertId;

    // 2. Crear el acudiente vinculado al estudiante
    const hashAcu = await bcrypt.hash(acu.contrasena, 10);
    await conn.query(
      `INSERT INTO padreacudiente (nombre, documento, correo, parentesco, usuario, contrasena, idAlumno)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [acu.nombre, acu.documento, acu.correo || null, acu.parentesco, acu.usuario, hashAcu, idAlumno]
    );

    await conn.commit();
    res.status(201).json({ mensaje: 'Inscripción registrada correctamente.', idAlumno });
  } catch (err) {
    await conn.rollback();
    if (err.code === 'ER_DUP_ENTRY') {
      // Detectar qué campo se duplicó para dar un mensaje útil
      let campo = 'usuario, documento o correo';
      if (err.message.includes('usuario'))   campo = 'nombre de usuario';
      else if (err.message.includes('documento')) campo = 'número de documento';
      else if (err.message.includes('correo'))    campo = 'correo';
      return res.status(409).json({ mensaje: `El ${campo} ya está registrado. Use uno diferente.` });
    }
    console.error(err);
    res.status(500).json({ mensaje: 'Error al registrar la inscripción.' });
  } finally {
    conn.release();
  }
});

module.exports = router;
