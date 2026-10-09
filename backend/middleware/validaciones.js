/* =============================================
   VALIDACIONES.JS
   Funciones pequeñas para comprobar los datos que llegan del navegador.
   ============================================= */

// Texto recortado de 1 a `max` caracteres; devuelve null si no es válido.
function texto(valor, max, min = 1) {
  if (typeof valor !== 'string') return null;
  const t = valor.trim();
  return t.length >= min && t.length <= max ? t : null;
}

// Correo con formato básico (opcional: vacío o ausente devuelve '' y se interpreta como "sin correo").
function correo(valor, max = 150) {
  if (valor === undefined || valor === null || valor === '') return '';
  const t = texto(valor, max);
  return t && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(t) ? t : null;
}

// Entero dentro de un rango (acepta números o cadenas numéricas); null si no cumple.
function enteroEnRango(valor, min, max) {
  if (valor === '' || valor === null || typeof valor === 'boolean') return null;
  const n = Number(valor);
  return Number.isInteger(n) && n >= min && n <= max ? n : null;
}

// Dirección http o https (evita enlaces como "javascript:..."), de hasta `max` caracteres.
function urlHttp(valor, max = 500) {
  const t = texto(valor, max);
  if (!t) return null;
  try {
    const u = new URL(t);
    return u.protocol === 'http:' || u.protocol === 'https:' ? t : null;
  } catch { return null; }
}

// Número decimal finito (acepta números o cadenas numéricas); null si no lo es.
function numero(valor) {
  if (valor === '' || valor === null || valor === undefined || typeof valor === 'boolean') return null;
  const n = Number(valor);
  return Number.isFinite(n) ? n : null;
}

module.exports = { texto, correo, enteroEnRango, urlHttp, numero };
