const express = require('express');
const router  = express.Router();
const bcrypt  = require('bcryptjs');
const db      = require('../config/db');

// POST /api/inscripciones  — PÚBLICO: registra un estudiante y su acudiente
// Body: { estudiante: {...}, acudiente: {...} }
router.post('/', async (req, res) => {
  const est = req.body.estudiante || {};
  const acu = req.body.acudiente  || {};

  // Validación de campos obligatorios
  if (!est.nombre || !est.apellido || !est.documento || !est.grado || !est.usuario || !est.contrasena) {
    return res.status(400).json({ mensaje: 'Faltan datos obligatorios del estudiante.' });
  }
  if (!acu.nombre || !acu.documento || !acu.parentesco || !acu.usuario || !acu.contrasena) {
    return res.status(400).json({ mensaje: 'Faltan datos obligatorios del acudiente.' });
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
