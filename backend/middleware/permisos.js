/* =============================================
   PERMISOS.JS
   Reglas de acceso a los datos (quién puede ver o escribir a quién).
   Las consultas son de solo lectura; las rutas deciden qué responder.
   ============================================= */
const db = require('../config/db');

const TIPO_POR_ROL = { docente: 'Docente', alumno: 'Alumno', acudiente: 'PadreAcudiente' };
const TIPOS_RECEPTOR = ['Docente', 'Alumno', 'PadreAcudiente'];
const MAX_RECEPTORES = 500;
const MAX_CONTENIDO  = 5000;

// Convierte un valor en entero positivo (o null si no lo es)
function aEntero(valor) {
  const n = Number(valor);
  return Number.isInteger(n) && n > 0 ? n : null;
}

// ¿El usuario autenticado puede consultar los datos (y las notas) de este alumno?
//   alumno    -> solo los propios
//   acudiente -> solo los del estudiante a su cargo
//   docente   -> cualquier alumno (es personal de la institución)
async function puedeVerAlumno(usuario, idAlumno) {
  if (usuario.rol === 'docente') return true;
  if (usuario.rol === 'alumno') return usuario.id === idAlumno;
  if (usuario.rol === 'acudiente') {
    const [filas] = await db.query(
      'SELECT 1 FROM padreacudiente WHERE idPadre = ? AND idAlumno = ? LIMIT 1',
      [usuario.id, idAlumno]
    );
    return filas.length > 0;
  }
  return false;
}

// ¿Puede el usuario autenticado consultar los datos de este acudiente?
//   acudiente -> solo los propios; docente -> cualquiera (personal de la institución)
function puedeVerAcudiente(usuario, idPadre) {
  return usuario.rol === 'docente' || (usuario.rol === 'acudiente' && usuario.id === idPadre);
}

// Relación de un docente con un curso: 'propia' | 'ajena' | 'no-existe'.
// Los datos de un curso (lista de alumnos, notas) solo los maneja el docente que lo dicta.
async function relacionConMateria(idDocente, idMateria) {
  const [filas] = await db.query('SELECT idDocente FROM materia WHERE idMateria = ? LIMIT 1', [idMateria]);
  if (filas.length === 0) return 'no-existe';
  return filas[0].idDocente === idDocente ? 'propia' : 'ajena';
}

// Lo mismo, pero a partir de una nota: ¿es de un curso que dicta este docente?
async function relacionConNota(idDocente, idNota) {
  const [filas] = await db.query(
    `SELECT m.idDocente FROM nota n INNER JOIN materia m ON m.idMateria = n.idMateria
     WHERE n.idNota = ? LIMIT 1`, [idNota]);
  if (filas.length === 0) return 'no-existe';
  return filas[0].idDocente === idDocente ? 'propia' : 'ajena';
}

// ¿Está este alumno inscrito en este curso?
async function alumnoEnMateria(idAlumno, idMateria) {
  const [filas] = await db.query(
    'SELECT 1 FROM materia_alumno WHERE idAlumno = ? AND idMateria = ? LIMIT 1', [idAlumno, idMateria]);
  return filas.length > 0;
}

// Responde 404/403 según la relación con el curso; devuelve true si ya respondió.
function rechazarSiNoEsPropia(res, relacion, recurso = 'Recurso') {
  if (relacion === 'no-existe') { res.status(404).json({ mensaje: `${recurso} no encontrado.` }); return true; }
  if (relacion === 'ajena')     { res.status(403).json({ mensaje: 'No tienes permiso para esta acción.' }); return true; }
  return false;
}

// Valida el cuerpo de un mensaje nuevo y que el emisor pueda escribir a esos destinatarios.
// Devuelve { ok: true, receptores } o { ok: false, status, mensaje }.
//   alumno / acudiente -> solo a docentes que existan
//   docente            -> solo a alumnos de sus cursos y a los acudientes de esos alumnos
//   admin              -> no tiene mensajería
async function validarMensaje(usuario, { contenido, receptores }) {
  const falla = (status, mensaje) => ({ ok: false, status, mensaje });

  if (!TIPO_POR_ROL[usuario.rol]) return falla(403, 'No tienes permiso para esta acción.');

  if (typeof contenido !== 'string' || !contenido.trim() || !Array.isArray(receptores) || receptores.length === 0) {
    return falla(400, 'Faltan campos obligatorios.');
  }
  if (contenido.length > MAX_CONTENIDO) {
    return falla(400, `El mensaje es demasiado largo (máximo ${MAX_CONTENIDO} caracteres).`);
  }
  if (receptores.length > MAX_RECEPTORES) {
    return falla(400, `Demasiados destinatarios (máximo ${MAX_RECEPTORES}).`);
  }

  // Normaliza y quita repetidos
  const vistos = new Set(); const lista = [];
  for (const r of receptores) {
    const id = aEntero(r && r.idReceptor);
    if (!id || !TIPOS_RECEPTOR.includes(r.receptorTipo)) return falla(400, 'Destinatario no válido.');
    const clave = r.receptorTipo + ':' + id;
    if (!vistos.has(clave)) { vistos.add(clave); lista.push({ idReceptor: id, receptorTipo: r.receptorTipo }); }
  }

  const prohibido = () => falla(403, 'No puede enviar mensajes a uno o más de esos destinatarios.');

  if (usuario.rol === 'docente') {
    const [alumnos] = await db.query(
      `SELECT DISTINCT ma.idAlumno
       FROM materia_alumno ma INNER JOIN materia m ON m.idMateria = ma.idMateria
       WHERE m.idDocente = ?`, [usuario.id]);
    const [padres] = await db.query(
      `SELECT DISTINCT p.idPadre
       FROM padreacudiente p
       INNER JOIN materia_alumno ma ON ma.idAlumno = p.idAlumno
       INNER JOIN materia m ON m.idMateria = ma.idMateria
       WHERE m.idDocente = ?`, [usuario.id]);
    const permitidos = {
      Alumno: new Set(alumnos.map(a => a.idAlumno)),
      PadreAcudiente: new Set(padres.map(p => p.idPadre)),
      Docente: new Set(),
    };
    if (!lista.every(r => permitidos[r.receptorTipo].has(r.idReceptor))) return prohibido();
  } else {
    // alumno o acudiente: solo docentes registrados
    if (!lista.every(r => r.receptorTipo === 'Docente')) return prohibido();
    const ids = lista.map(r => r.idReceptor);
    const [docentes] = await db.query('SELECT idDocente FROM docente WHERE idDocente IN (?)', [ids]);
    if (docentes.length !== ids.length) return prohibido();
  }

  return { ok: true, receptores: lista };
}

// ¿Este usuario es destinatario del mensaje? (para poder marcarlo como leído)
async function esDestinatario(usuario, idMensaje) {
  const tipo = TIPO_POR_ROL[usuario.rol];
  if (!tipo) return false;
  const [filas] = await db.query(
    'SELECT 1 FROM comunicacion_receptor WHERE idMensaje = ? AND idReceptor = ? AND receptorTipo = ? LIMIT 1',
    [idMensaje, usuario.id, tipo]
  );
  return filas.length > 0;
}

module.exports = {
  TIPO_POR_ROL, aEntero,
  puedeVerAlumno, puedeVerNotasDeAlumno: puedeVerAlumno, puedeVerAcudiente,
  relacionConMateria, relacionConNota, alumnoEnMateria, rechazarSiNoEsPropia,
  validarMensaje, esDestinatario,
};
