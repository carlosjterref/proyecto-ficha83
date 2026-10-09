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
