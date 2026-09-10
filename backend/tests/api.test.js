/* =============================================
   PRUEBAS DE LA API — Jest + Supertest
   Casos de prueba sobre el backend del Colegio Yermo y Parres.
   Ejecutar con:  npm test
   ============================================= */

const request = require('supertest');
const bcrypt  = require('bcryptjs');
const app     = require('../server');

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
