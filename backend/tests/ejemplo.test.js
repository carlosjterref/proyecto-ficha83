/* =============================================
   Prueba de ejemplo para verificar que Jest funciona.
   Ejecuta con:  npm test
   ============================================= */

const bcrypt = require('bcryptjs');

describe('Verificación de la instalación de Jest', () => {

  test('una suma básica funciona (prueba unitaria simple)', () => {
    expect(2 + 2).toBe(4);
  });

  test('bcrypt encripta y verifica una contraseña correctamente', async () => {
    const clave = 'docente123';
    const hash = await bcrypt.hash(clave, 10);

    // El hash no debe ser igual al texto plano
    expect(hash).not.toBe(clave);

    // La comparación con la clave correcta debe dar verdadero
    expect(await bcrypt.compare(clave, hash)).toBe(true);

    // La comparación con una clave incorrecta debe dar falso
    expect(await bcrypt.compare('claveerronea', hash)).toBe(false);
  });

});
