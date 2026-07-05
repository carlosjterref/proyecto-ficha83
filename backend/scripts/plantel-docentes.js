/* =============================================
   PLANTEL-DOCENTES.JS
   - Agrega la columna cursoPrincipal a la tabla docente (si no existe)
   - Inserta los 45 docentes del plantel con credenciales generadas
   Seguro de ejecutar varias veces (no duplica por usuario).
   Contraseña por defecto de todos: docente123
   ============================================= */

const bcrypt = require('bcryptjs');
const db     = require('../config/db');

const PLANTEL = [
  ['Ana María Rodríguez', 'Matemáticas', '6°A'],
  ['Carlos Andrés Gómez', 'Matemáticas', '6°B'],
  ['Diana Carolina López', 'Matemáticas', '7°A'],
  ['Javier Mauricio Pérez', 'Matemáticas', '7°B'],
  ['Laura Camila Torres', 'Matemáticas', '8°A'],
  ['Felipe Rojas', 'Matemáticas', '8°B'],
  ['Natalia Herrera', 'Matemáticas', '9°A'],
  ['Andrés Felipe Castro', 'Matemáticas', '10°A'],
  ['Paola Sánchez', 'Matemáticas', '11°A'],
  ['Juan Sebastián Ramírez', 'Lengua Castellana', '6°A'],
  ['Marcela Gutiérrez', 'Lengua Castellana', '6°B'],
  ['Sandra Milena Díaz', 'Lengua Castellana', '7°A'],
  ['Óscar Eduardo Martínez', 'Lengua Castellana', '8°A'],
  ['Viviana León', 'Lengua Castellana', '9°A'],
  ['Ricardo Molina', 'Lengua Castellana', '10°A'],
  ['Carolina Vargas', 'Inglés', '6°A'],
  ['Nicolás Cárdenas', 'Inglés', '7°A'],
  ['Juliana Moreno', 'Inglés', '8°A'],
  ['Daniel Forero', 'Inglés', '9°A'],
  ['Andrea Beltrán', 'Inglés', '10°A'],
  ['Mauricio Salazar', 'Ciencias Naturales', '6°A'],
  ['Liliana Romero', 'Ciencias Naturales', '7°A'],
  ['Diego Acosta', 'Biología', '8°A'],
  ['Patricia Mendoza', 'Biología', '10°A'],
  ['Héctor Suárez', 'Física', '11°A'],
  ['Gloria Rincón', 'Química', '10°B'],
  ['Camilo Arias', 'Química', '11°B'],
  ['Diana Parra', 'Ciencias Sociales', '6°A'],
  ['Fernando Muñoz', 'Ciencias Sociales', '7°A'],
  ['Mónica Silva', 'Ciencias Sociales', '8°A'],
  ['Sergio Cifuentes', 'Filosofía', '10°A'],
  ['Claudia Pineda', 'Filosofía', '11°A'],
  ['Edgar Bonilla', 'Ciencias Políticas y Económicas', '11°B'],
  ['Lina Fernández', 'Tecnología e Informática', '6°A'],
  ['Cristian Méndez', 'Tecnología e Informática', '9°A'],
  ['Ángela Duarte', 'Educación Artística', '6°A'],
  ['Mauricio Bernal', 'Música', '7°A'],
  ['Verónica Castillo', 'Danzas', '8°A'],
  ['Jorge Medina', 'Educación Física', '6°A'],
  ['David Castaño', 'Educación Física', '9°A'],
  ['Sandra Acuña', 'Educación Religiosa', '6°A'],
  ['Miguel Ángel Peña', 'Ética y Valores', '8°A'],
  ['Diana Restrepo', 'Preescolar', 'Transición'],
  ['Luisa Fernanda Ortiz', 'Básica Primaria (Docente Integral)', '3°A'],
  ['José Manuel Cruz', 'Básica Primaria (Docente Integral)', '5°B'],
];

// Quita acentos y caracteres no alfanuméricos
function normaliza(txt) {
  const mapa = { 'á':'a','é':'e','í':'i','ó':'o','ú':'u','ü':'u','ñ':'n' };
  return txt.toLowerCase().replace(/[áéíóúüñ]/g, c => mapa[c]).replace(/[^a-z0-9]/g, '');
}

async function ejecutar() {
  console.log('Configurando plantel de docentes...\n');
  try {
    // 1. Agregar columna cursoPrincipal si no existe
    const [existe] = await db.query(
      `SELECT COUNT(*) AS n FROM information_schema.columns
       WHERE table_schema = DATABASE() AND table_name = 'docente' AND column_name = 'cursoPrincipal'`
    );
    if (existe[0].n === 0) {
      await db.query('ALTER TABLE docente ADD COLUMN cursoPrincipal VARCHAR(20) NULL AFTER especialidad');
      console.log('Columna cursoPrincipal agregada a la tabla docente.');
    } else {
      console.log('La columna cursoPrincipal ya existía.');
    }

    // 2. Preparar usuarios únicos
    const usados = new Set();
    const [previos] = await db.query('SELECT usuario FROM docente');
    previos.forEach(p => usados.add(p.usuario));

    const hash = await bcrypt.hash('docente123', 10);
    let creados = 0, omitidos = 0, doc = 1010000000;

    for (const [nombre, materia, curso] of PLANTEL) {
      const partes = nombre.trim().split(/\s+/);
      const base = normaliza(partes[0][0] + partes[partes.length - 1]);
      let usuario = base, i = 1;
      while (usados.has(usuario)) { usuario = base + i; i++; }
      usados.add(usuario);

      doc += 1;
      const documento = String(doc);
      const correo = usuario + '@yermoyparres.edu.co';

      // Evitar duplicar si ya existe ese docente por nombre+materia
      const [ya] = await db.query(
        'SELECT idDocente FROM docente WHERE nombre = ? AND especialidad = ?',
        [nombre, materia]
      );
      if (ya.length > 0) { omitidos++; continue; }

      await db.query(
        `INSERT INTO docente (nombre, documento, especialidad, cursoPrincipal, correo, usuario, contrasena)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [nombre, documento, materia, curso, correo, usuario, hash]
      );
      creados++;
    }

    console.log(`\nDocentes creados: ${creados} | omitidos (ya existían): ${omitidos}`);
    const [tot] = await db.query('SELECT COUNT(*) AS c FROM docente');
    console.log(`Total docentes en la BD: ${tot[0].c}`);
    console.log('Contraseña por defecto de todos: docente123');
    console.log('\nProceso completado.');
  } catch (err) {
    console.error('Error:', err.message);
  } finally {
    process.exit();
  }
}

ejecutar();
