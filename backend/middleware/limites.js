/* =============================================
   LIMITES.JS
   Límite de intentos de inicio de sesión (contra adivinar contraseñas).
   Solo cuentan los intentos fallidos: un inicio de sesión correcto no suma.
   Dos límites encadenados:
     1) por cuenta y dirección IP: frena adivinar la clave de un usuario concreto
        sin bloquear a todo un salón que comparte la misma conexión;
     2) por dirección IP: frena probar muchos usuarios distintos desde un mismo lugar.
   ============================================= */
const rateLimit = require('express-rate-limit');
const { ipKeyGenerator } = require('express-rate-limit');

const VENTANA = 15 * 60 * 1000; // 15 minutos
const MENSAJE = { mensaje: 'Demasiados intentos fallidos. Espere unos 15 minutos antes de intentarlo de nuevo.' };

const base = {
  windowMs: VENTANA,
  skipSuccessfulRequests: true,   // los inicios de sesión correctos no cuentan
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: MENSAJE,
};

// Por cuenta (usuario + rol) y por IP
const limiteLoginPorCuenta = rateLimit({
  ...base,
  limit: 8,
  keyGenerator: (req) => {
    const usuario = String((req.body && req.body.usuario) || '').trim().toLowerCase().slice(0, 100);
    const rol = String((req.body && req.body.rol) || '');
    return `${ipKeyGenerator(req.ip)}|${rol}|${usuario}`;
  },
});

// Por IP (tope general, más alto)
const limiteLoginPorIp = rateLimit({
  ...base,
  limit: 100,
  keyGenerator: (req) => ipKeyGenerator(req.ip),
});

module.exports = { limiteLogin: [limiteLoginPorCuenta, limiteLoginPorIp] };
