/* =============================================
   PRUEBAS DE LA API — Jest + Supertest
   Casos de prueba sobre el backend del Colegio Yermo y Parres.
   Ejecutar con:  npm test
   ============================================= */

// Clave solo para las pruebas si el entorno no define una (no se usa fuera de Jest)
process.env.JWT_SECRET = process.env.JWT_SECRET || 'clave-solo-para-pruebas';

const request = require('supertest');
const bcrypt  = require('bcryptjs');
const jwt     = require('jsonwebtoken');
const app     = require('../server');

// Token firmado con la clave del entorno para un usuario de prueba
const tokenDe = (rol, id = 1) => 'Bearer ' + jwt.sign({ id, usuario: 'prueba', rol }, process.env.JWT_SECRET);

/* ---------------------------------------------------------------
   CASO 1 — Seguridad: cifrado y verificación de contraseñas (bcrypt)
   Componente: módulo de seguridad (bcrypt), usado en el login.
--------------------------------------------------------------- */
describe('Caso 1 - Cifrado de contraseñas (bcrypt)', () => {

  test('la contraseña se cifra y no queda en texto plano', async () => {
    const clave = 'docente123';
    const hash  = await bcrypt.hash(clave, 10);
    expect(hash).not.toBe(clave);          // no debe ser igual al original
    expect(hash.length).toBeGreaterThan(50); // un hash bcrypt es largo
  });

  test('verifica correctamente la contraseña correcta y rechaza la incorrecta', async () => {
    const hash = await bcrypt.hash('docente123', 10);
    expect(await bcrypt.compare('docente123', hash)).toBe(true);   // correcta
    expect(await bcrypt.compare('otraClave', hash)).toBe(false);   // incorrecta
  });
});

/* ---------------------------------------------------------------
   CASO 2 — API: endpoint de estado (/api/health)
   Componente: API REST (verifica que el servidor responde).
--------------------------------------------------------------- */
describe('Caso 2 - Endpoint de estado de la API', () => {

  test('GET /api/health responde 200 con el mensaje de estado', async () => {
    const res = await request(app).get('/api/health');
    expect(res.status).toBe(200);
    expect(res.body.mensaje).toBe('API Colegio Yermo y Parres activa.');
  });
});

/* ---------------------------------------------------------------
   CASO 3 — Seguridad de la API: validación y control de acceso
   Componente: middleware de autenticación y validación del login.
--------------------------------------------------------------- */
describe('Caso 3 - Control de acceso y validación de la API', () => {

  test('el login sin datos devuelve 400 (validación de campos)', async () => {
    const res = await request(app).post('/api/auth/login').send({});
    expect(res.status).toBe(400);
    expect(res.body.mensaje).toMatch(/obligatorios/i);
  });

  test('una ruta protegida sin token devuelve 401', async () => {
    const res = await request(app).get('/api/alumnos');
    expect(res.status).toBe(401);
    expect(res.body.mensaje).toMatch(/token/i);
  });

  test('crear una noticia sin token devuelve 401 (recurso protegido)', async () => {
    const res = await request(app).post('/api/noticias').send({ titulo: 'x', contenido: 'y' });
    expect(res.status).toBe(401);
  });
});

/* ---------------------------------------------------------------
   CASO 4 — Cabeceras de seguridad HTTP (helmet)
--------------------------------------------------------------- */
describe('Caso 4 - Cabeceras de seguridad', () => {

  test('las respuestas incluyen cabeceras de protección y ocultan el framework', async () => {
    const res = await request(app).get('/api/health');
    expect(res.headers['x-content-type-options']).toBe('nosniff');
    expect(res.headers['x-frame-options']).toBeDefined();
    expect(res.headers['x-powered-by']).toBeUndefined();
  });
});

/* ---------------------------------------------------------------
   CASO 5 — Límite de intentos fallidos de inicio de sesión
--------------------------------------------------------------- */
describe('Caso 5 - Límite de intentos de inicio de sesión', () => {
  const intento = (usuario) => request(app).post('/api/auth/login').send({ usuario, contrasena: '', rol: 'docente' });

  test('tras 8 intentos fallidos de una misma cuenta, el siguiente se bloquea (429)', async () => {
    for (let i = 0; i < 8; i++) expect((await intento('cuenta-limite')).status).toBe(400);
    const bloqueado = await intento('cuenta-limite');
    expect(bloqueado.status).toBe(429);
    expect(bloqueado.body.mensaje).toMatch(/demasiados intentos/i);
  });

  test('el bloqueo de una cuenta no afecta a otra cuenta de la misma conexión', async () => {
    expect((await intento('otra-cuenta')).status).toBe(400);
  });
});

/* ---------------------------------------------------------------
   CASO 6 — Control de acceso a notas y mensajes (no requiere base de datos)
--------------------------------------------------------------- */
describe('Caso 6 - Control de acceso a notas y mensajería', () => {

  test('un alumno no puede consultar las notas de otro alumno (403)', async () => {
    const res = await request(app).get('/api/notas/alumno/2').set('Authorization', tokenDe('alumno', 1));
    expect(res.status).toBe(403);
  });

  test('el administrador no puede consultar notas de alumnos (403)', async () => {
    const res = await request(app).get('/api/notas/alumno/1').set('Authorization', tokenDe('admin', 1));
    expect(res.status).toBe(403);
  });

  test('un identificador de alumno no numérico devuelve 400', async () => {
    const res = await request(app).get('/api/notas/alumno/abc').set('Authorization', tokenDe('alumno', 1));
    expect(res.status).toBe(400);
  });

  test('un alumno no puede enviar mensajes a otro alumno (403)', async () => {
    const res = await request(app).post('/api/comunicaciones').set('Authorization', tokenDe('alumno', 1))
      .send({ contenido: 'hola', receptores: [{ idReceptor: 2, receptorTipo: 'Alumno' }] });
    expect(res.status).toBe(403);
  });

  test('un acudiente no puede enviar mensajes a un acudiente (403)', async () => {
    const res = await request(app).post('/api/comunicaciones').set('Authorization', tokenDe('acudiente', 1))
      .send({ contenido: 'hola', receptores: [{ idReceptor: 3, receptorTipo: 'PadreAcudiente' }] });
    expect(res.status).toBe(403);
  });

  test('el administrador no tiene mensajería (403)', async () => {
    const res = await request(app).post('/api/comunicaciones').set('Authorization', tokenDe('admin', 1))
      .send({ contenido: 'hola', receptores: [{ idReceptor: 1, receptorTipo: 'Docente' }] });
    expect(res.status).toBe(403);
  });

  test('un mensaje con destinatarios mal formados devuelve 400', async () => {
    const res = await request(app).post('/api/comunicaciones').set('Authorization', tokenDe('alumno', 1))
      .send({ contenido: 'hola', receptores: [{ idReceptor: 'x', receptorTipo: 'Docente' }] });
    expect(res.status).toBe(400);
  });

  test('un identificador de mensaje no numérico devuelve 400 al marcar como leído', async () => {
    const res = await request(app).patch('/api/comunicaciones/abc/leer').set('Authorization', tokenDe('alumno', 1));
    expect(res.status).toBe(400);
  });
});

/* ---------------------------------------------------------------
   CASO 7 — Datos personales por identificador (no requiere base de datos)
--------------------------------------------------------------- */
describe('Caso 7 - Acceso a datos de alumnos, acudientes, docentes y cursos', () => {
  const get = (ruta, rol, id = 1) => request(app).get(ruta).set('Authorization', tokenDe(rol, id));

  test('un alumno no puede ver los datos de otro alumno (403)', async () => {
    expect((await get('/api/alumnos/2', 'alumno', 1)).status).toBe(403);
  });

  test('un identificador de alumno no numérico devuelve 400', async () => {
    expect((await get('/api/alumnos/abc', 'alumno', 1)).status).toBe(400);
  });

  test('un alumno no puede ver los datos de un acudiente (403)', async () => {
    expect((await get('/api/acudientes/5', 'alumno', 1)).status).toBe(403);
  });

  test('un acudiente no puede ver los datos de otro acudiente (403)', async () => {
    expect((await get('/api/acudientes/2', 'acudiente', 1)).status).toBe(403);
  });

  test('alumnos y acudientes no pueden consultar la lista ni el detalle de docentes (403)', async () => {
    expect((await get('/api/docentes', 'alumno')).status).toBe(403);
    expect((await get('/api/docentes/1', 'acudiente')).status).toBe(403);
  });

  test('el directorio público del plantel sigue sin exigir sesión', async () => {
    const res = await request(app).get('/api/docentes/plantel');
    expect(res.status).not.toBe(401);
    expect(res.status).not.toBe(403);
  });

  test('alumnos y acudientes no pueden ver la lista de un curso con documentos y notas (403)', async () => {
    expect((await get('/api/materias/1/alumnos', 'alumno')).status).toBe(403);
    expect((await get('/api/materias/1/alumnos', 'acudiente')).status).toBe(403);
  });

  test('un identificador de curso no numérico devuelve 400 al docente', async () => {
    expect((await get('/api/materias/abc/alumnos', 'docente', 7)).status).toBe(400);
    expect((await get('/api/notas/materia/abc', 'docente', 7)).status).toBe(400);
  });
});

/* ---------------------------------------------------------------
   CASO 8 — Registro de notas: validación y permisos (no requiere base de datos)
--------------------------------------------------------------- */
describe('Caso 8 - Escritura de notas', () => {
  const docente = () => tokenDe('docente', 7);

  test('una calificación que no es un número devuelve 400', async () => {
    const res = await request(app).post('/api/notas').set('Authorization', docente())
      .send({ calificacion: 'abc', periodo: 'Período 1', idAlumno: 1, idMateria: 1 });
    expect(res.status).toBe(400);
  });

  test('una nota sin materia devuelve 400', async () => {
    const res = await request(app).post('/api/notas').set('Authorization', docente())
      .send({ calificacion: 7, periodo: 'Período 1', idAlumno: 1 });
    expect(res.status).toBe(400);
  });

  test('actualizar una nota sin datos devuelve 400 y con identificador no numérico también', async () => {
    expect((await request(app).put('/api/notas/1').set('Authorization', docente()).send({})).status).toBe(400);
    expect((await request(app).put('/api/notas/abc').set('Authorization', docente()).send({ calificacion: 7, periodo: 'Período 1' })).status).toBe(400);
    expect((await request(app).delete('/api/notas/abc').set('Authorization', docente())).status).toBe(400);
  });

  test('un alumno no puede modificar ni borrar notas (403)', async () => {
    const alumno = tokenDe('alumno', 1);
    expect((await request(app).put('/api/notas/1').set('Authorization', alumno).send({ calificacion: 10, periodo: 'Período 1' })).status).toBe(403);
    expect((await request(app).delete('/api/notas/1').set('Authorization', alumno)).status).toBe(403);
  });
});

/* ---------------------------------------------------------------
   CASO 9 — Datos que llegan del navegador: login, registro público y enlaces
--------------------------------------------------------------- */
describe('Caso 9 - Validación de datos de entrada', () => {
  const estudiante = { nombre: 'Ana', apellido: 'Prueba', documento: '123', grado: 6, usuario: 'anaprueba', contrasena: 'clave123' };
  const acudiente  = { nombre: 'Luz Prueba', documento: '456', parentesco: 'Madre', usuario: 'luzprueba', contrasena: 'clave456' };
  const registrar = (cambios = {}) => request(app).post('/api/inscripciones')
    .send({ estudiante: { ...estudiante, ...(cambios.estudiante || {}) }, acudiente: { ...acudiente, ...(cambios.acudiente || {}) } });

  test('el login rechaza datos que no son texto (400)', async () => {
    const res = await request(app).post('/api/auth/login').send({ usuario: { a: 1 }, contrasena: 'x', rol: 'docente' });
    expect(res.status).toBe(400);
  });

  test('el registro público rechaza contraseñas demasiado cortas o demasiado largas (400)', async () => {
    expect((await registrar({ estudiante: { contrasena: '123' } })).status).toBe(400);
    expect((await registrar({ acudiente: { contrasena: 'a'.repeat(73) } })).status).toBe(400);
  });

  test('el registro público rechaza grado, correo y textos no válidos (400)', async () => {
    expect((await registrar({ estudiante: { grado: 'abc' } })).status).toBe(400);
    expect((await registrar({ estudiante: { correo: 'no-es-un-correo' } })).status).toBe(400);
    expect((await registrar({ acudiente: { nombre: 'x'.repeat(101) } })).status).toBe(400);
    expect((await registrar({ estudiante: { usuario: 'ab' } })).status).toBe(400);
  });

  test('las noticias rechazan enlaces que no sean http o https (400)', async () => {
    const admin = tokenDe('admin', 1);
    const base = { titulo: 'T', contenido: 'C', tipoMedia: 'imagen' };
    expect((await request(app).post('/api/noticias').set('Authorization', admin).send({ ...base, mediaUrl: 'javascript:alert(1)' })).status).toBe(400);
    expect((await request(app).post('/api/noticias').set('Authorization', admin).send({ ...base, tipoMedia: 'otro' })).status).toBe(400);
    expect((await request(app).put('/api/noticias/1').set('Authorization', admin).send({ ...base, mediaUrl: 'data:text/html,x' })).status).toBe(400);
  });

  test('las circulares rechazan enlaces que no sean http o https (400)', async () => {
    const admin = tokenDe('admin', 1);
    expect((await request(app).post('/api/circulares').set('Authorization', admin).send({ titulo: 'C', archivoUrl: 'javascript:alert(1)' })).status).toBe(400);
    expect((await request(app).put('/api/circulares/1').set('Authorization', admin).send({ titulo: 'C', archivoUrl: 'ftp://x/y' })).status).toBe(400);
  });

  test('el registro público rechaza marcado HTML en nombres y datos de identidad (400)', async () => {
    const xss = '<img src=x onerror=alert(1)>';
    for (const cambios of [
      { estudiante: { nombre: xss } }, { estudiante: { apellido: xss } }, { estudiante: { usuario: 'a<b>c' } },
      { acudiente: { nombre: xss } }, { acudiente: { parentesco: xss } },
    ]) {
      const res = await registrar(cambios);
      expect(res.status).toBe(400);
      expect(res.body.mensaje).toMatch(/caracteres/i);
    }
  });

  test('un docente no puede guardar marcado HTML en alumnos, docentes, acudientes ni materias (400)', async () => {
    const docente = tokenDe('docente', 7), xss = '<script>alert(1)</script>';
    const envia = (metodo, ruta, cuerpo) => request(app)[metodo](ruta).set('Authorization', docente).send(cuerpo);
    expect((await envia('post', '/api/alumnos', { nombre: xss, apellido: 'A', grado: 6, usuario: 'u', contrasena: 'clave' })).status).toBe(400);
    expect((await envia('put', '/api/alumnos/1', { nombre: 'Ana', apellido: xss })).status).toBe(400);
    expect((await envia('post', '/api/docentes', { nombre: xss, usuario: 'u', contrasena: 'clave' })).status).toBe(400);
    expect((await envia('put', '/api/docentes/1', { nombre: 'Luis', especialidad: xss })).status).toBe(400);
    expect((await envia('post', '/api/acudientes', { nombre: xss, documento: '1', usuario: 'u', contrasena: 'clave', idAlumno: 1 })).status).toBe(400);
    expect((await envia('put', '/api/acudientes/1', { nombre: 'Luz', parentesco: xss })).status).toBe(400);
    expect((await envia('post', '/api/materias', { nombre: xss, grado: 6, idDocente: 7 })).status).toBe(400);
    expect((await envia('put', '/api/materias/1', { nombre: xss })).status).toBe(400);
  });
});

/* ---------------------------------------------------------------
   CASO 10 — Límite de registros públicos por conexión (debe ir al final)
--------------------------------------------------------------- */
describe('Caso 10 - Límite de registros públicos', () => {

  test('tras muchos registros desde la misma conexión, el servidor responde 429', async () => {
    let bloqueado = null;
    for (let i = 0; i < 70 && !bloqueado; i++) {
      const res = await request(app).post('/api/inscripciones').send({});
      if (res.status === 429) bloqueado = res;
    }
    expect(bloqueado).not.toBeNull();
    expect(bloqueado.body.mensaje).toMatch(/demasiados registros/i);
  });
});
