/* =============================================
   API.JS — Helper central de comunicación con el backend
   Se incluye en todas las páginas que necesiten hablar con la API.
   ============================================= */

// URL base del backend (Express corriendo en el puerto 3000)
const API_URL = 'http://localhost:3000/api';

/* ---------- Manejo del token y la sesión ---------- */

// Guarda el token y los datos del usuario tras un login exitoso
function guardarSesion(token, usuario) {
  sessionStorage.setItem('token', token);
  sessionStorage.setItem('usuario', JSON.stringify(usuario));
}

// Devuelve el token guardado (o null si no hay sesión)
function obtenerToken() {
  return sessionStorage.getItem('token');
}

// Devuelve el objeto del usuario logueado (o null)
function obtenerUsuario() {
  const data = sessionStorage.getItem('usuario');
  return data ? JSON.parse(data) : null;
}

// Borra la sesión (logout)
function cerrarSesion(redirigirA = 'index.html') {
  sessionStorage.removeItem('token');
  sessionStorage.removeItem('usuario');
  window.location.href = redirigirA;
}

/* ---------- Petición genérica a la API ---------- */

// Realiza una petición fetch agregando automáticamente el token JWT
async function apiFetch(endpoint, opciones = {}) {
  const headers = {
    'Content-Type': 'application/json',
    ...opciones.headers,
  };

  // Si hay token guardado, lo añadimos al header Authorization
  const token = obtenerToken();
  if (token) {
    headers['Authorization'] = 'Bearer ' + token;
  }

  const respuesta = await fetch(API_URL + endpoint, { ...opciones, headers });
  const datos = await respuesta.json().catch(() => ({}));

  if (!respuesta.ok) {
    // Lanza un error con el mensaje que envió el backend
    throw new Error(datos.mensaje || 'Error en la petición.');
  }

  return datos;
}

/* ---------- Login ---------- */

// Envía credenciales al backend. rol: 'alumno' | 'docente' | 'acudiente'
async function login(usuario, contrasena, rol) {
  const datos = await apiFetch('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ usuario, contrasena, rol }),
  });

  guardarSesion(datos.token, datos.usuario);
  return datos;
}

// Protege una página: si no hay sesión del rol esperado, redirige al login
function exigirSesion(rolEsperado, loginUrl) {
  const usuario = obtenerUsuario();
  if (!usuario || (rolEsperado && usuario.rol !== rolEsperado)) {
    window.location.href = loginUrl;
    return null;
  }
  return usuario;
}
