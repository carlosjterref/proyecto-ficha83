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

/* ---------- CAMBIO DE CONTRASEÑA (compartido) ---------- */

// Cambia la contraseña del usuario autenticado
async function cambiarContrasena(actual, nueva) {
  return apiFetch('/auth/password', {
    method: 'PUT',
    body: JSON.stringify({ actual, nueva }),
  });
}

/* ---------- COMUNICADOS / NOTICIAS (compartido) ---------- */

// Carga las noticias públicas y las muestra como comunicados en un contenedor
async function cargarComunicadosEn(contId) {
  const cont = document.getElementById(contId);
  if (!cont) return;
  try {
    const noticias = await apiFetch('/noticias');

    if (noticias.length === 0) {
      cont.innerHTML = '<p class="text-muted">No hay comunicados por el momento.</p>';
      return;
    }

    cont.innerHTML = noticias.map(n => `
      <div class="message-card p-3 mb-3 shadow-sm">
        <div class="d-flex justify-content-between align-items-start mb-1">
          <span class="sender-name"><i class="bi bi-megaphone me-1"></i>${escaparHtml(n.categoria)}</span>
          <span class="msg-date"><i class="bi bi-clock me-1"></i>${formatearFechaMsg(n.fechaPublicacion)}</span>
        </div>
        <p class="msg-subject mb-1 fw-bold">${escaparHtml(n.titulo)}</p>
        <p class="mb-0" style="white-space:pre-wrap;">${escaparHtml(n.contenido)}</p>
        <small class="text-muted">Publicado por ${escaparHtml(n.autor)}</small>
      </div>
    `).join('');
  } catch (err) {
    cont.innerHTML = `<p class="text-danger">${err.message}</p>`;
  }
}

/* ---------- BANDEJA DE MENSAJES (compartida entre portales) ---------- */

// Escapa caracteres HTML para evitar inyección desde el contenido del mensaje
function escaparHtml(texto) {
  const div = document.createElement('div');
  div.textContent = texto == null ? '' : String(texto);
  return div.innerHTML;
}

// Convierte un datetime de MySQL a texto legible en español
function formatearFechaMsg(fecha) {
  const d = new Date(fecha);
  if (isNaN(d)) return fecha;
  return d.toLocaleDateString('es-CO', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit'
  });
}

// Caché de los mensajes cargados, indexados por idMensaje
let _mensajesCache = {};
let _mensajeActual = null; // mensaje abierto en el pop-up (para responder)

// Carga los mensajes recibidos y los pinta como tarjetas (abren un pop-up al clic)
async function cargarMensajesEn(contId) {
  const cont = document.getElementById(contId);
  if (!cont) return;
  try {
    const mensajes = await apiFetch('/comunicaciones/recibidos');
    _mensajesCache = {};

    if (mensajes.length === 0) {
      cont.innerHTML = '<p class="text-muted">No tiene mensajes en su bandeja.</p>';
      return mensajes;
    }

    cont.innerHTML = mensajes.map(m => {
      _mensajesCache[m.idMensaje] = m; // guardamos el mensaje completo
      return `
      <div class="message-card p-3 mb-3 shadow-sm" data-id="${m.idMensaje}" data-leida="${m.leida}" onclick="abrirMensaje(${m.idMensaje})">
        <div class="d-flex justify-content-between align-items-start mb-1">
          <div class="d-flex align-items-center gap-2">
            <span class="punto-no-leido"${m.leida ? ' style="display:none;"' : ''}><span class="unread-dot"></span></span>
            <span class="sender-name">${escaparHtml(m.emisorTipo)}</span>
          </div>
          <span class="msg-date"><i class="bi bi-clock me-1"></i>${formatearFechaMsg(m.fechaHora)}</span>
        </div>
        ${m.tipo ? `<p class="msg-subject mb-1">${escaparHtml(m.tipo)}</p>` : ''}
        <p class="msg-cuerpo mb-0">${escaparHtml(m.contenido)}</p>
        <small class="toggle-hint"><i class="bi bi-box-arrow-up-right"></i> Abrir mensaje</small>
      </div>`;
    }).join('');

    return mensajes;
  } catch (err) {
    cont.innerHTML = `<p class="text-danger">${err.message}</p>`;
    return [];
  }
}

// Crea (una sola vez) el modal de mensaje y lo añade al <body>
function asegurarModalMensaje() {
  if (document.getElementById('modalVerMensaje')) return;
  const html = `
  <div class="modal fade" id="modalVerMensaje" tabindex="-1" aria-hidden="true">
    <div class="modal-dialog modal-dialog-centered">
      <div class="modal-content">
        <div class="modal-header" style="background:var(--verde);color:#fff;">
          <h5 class="modal-title" id="mvm-titulo"><i class="bi bi-envelope-open me-2"></i>Mensaje</h5>
          <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal" aria-label="Cerrar"></button>
        </div>
        <div class="modal-body">
          <div class="d-flex justify-content-between align-items-center mb-2">
            <span class="fw-bold" id="mvm-remitente"></span>
            <span class="text-muted small" id="mvm-fecha"></span>
          </div>
          <p id="mvm-contenido" style="white-space:pre-wrap;"></p>

          <!-- Área de respuesta (oculta hasta pulsar Responder) -->
          <div id="mvm-respuesta-area" class="mt-3" style="display:none;">
            <hr>
            <label class="form-label fw-bold" style="font-size:0.85rem;">Tu respuesta</label>
            <textarea class="form-control" id="mvm-respuesta" rows="3" placeholder="Escriba su respuesta..."></textarea>
          </div>
        </div>
        <div class="modal-footer">
          <button type="button" class="btn btn-secondary btn-sm" data-bs-dismiss="modal">Cerrar</button>
          <button type="button" class="btn btn-sm fw-bold" style="background:var(--verde);color:#fff;" id="mvm-btn-responder" onclick="responderMensaje()">
            <i class="bi bi-reply me-1"></i> Responder
          </button>
        </div>
      </div>
    </div>
  </div>`;
  document.body.insertAdjacentHTML('beforeend', html);
}

// Abre el pop-up con el mensaje y lo marca como leído la primera vez
function abrirMensaje(id) {
  const m = _mensajesCache[id];
  if (!m) return;
  _mensajeActual = m;

  asegurarModalMensaje();

  document.getElementById('mvm-titulo').innerHTML =
    `<i class="bi bi-envelope-open me-2"></i>${escaparHtml(m.tipo || 'Mensaje')}`;
  document.getElementById('mvm-remitente').textContent = m.emisorTipo;
  document.getElementById('mvm-fecha').textContent = formatearFechaMsg(m.fechaHora);
  document.getElementById('mvm-contenido').textContent = m.contenido;

  // Reiniciar el área de respuesta cada vez que se abre un mensaje
  document.getElementById('mvm-respuesta-area').style.display = 'none';
  document.getElementById('mvm-respuesta').value = '';

  // Mostrar el modal de Bootstrap
  bootstrap.Modal.getOrCreateInstance(document.getElementById('modalVerMensaje')).show();

  // Marcar como leído si aún no lo estaba
  const card = document.querySelector(`.message-card[data-id="${id}"]`);
  if (card && card.dataset.leida === '0') {
    apiFetch(`/comunicaciones/${id}/leer`, { method: 'PATCH' }).catch(() => {});
    card.dataset.leida = '1';
    m.leida = 1;
    const punto = card.querySelector('.punto-no-leido');
    if (punto) punto.style.display = 'none';
  }
}

// Responde al remitente del mensaje abierto.
// Primer clic muestra el área de texto; segundo clic (con texto) envía.
async function responderMensaje() {
  const area = document.getElementById('mvm-respuesta-area');
  const texto = document.getElementById('mvm-respuesta').value.trim();

  // Si el área aún está oculta, la mostramos y esperamos a que escriba
  if (area.style.display === 'none') {
    area.style.display = 'block';
    document.getElementById('mvm-respuesta').focus();
    return;
  }

  if (!texto) { alert('Escriba una respuesta antes de enviar.'); return; }
  if (!_mensajeActual) return;

  try {
    // El destinatario es el emisor original del mensaje
    await apiFetch('/comunicaciones', {
      method: 'POST',
      body: JSON.stringify({
        contenido: texto,
        tipo: 'Re: ' + (_mensajeActual.tipo || 'Mensaje'),
        receptores: [{ idReceptor: _mensajeActual.idEmisor, receptorTipo: _mensajeActual.emisorTipo }],
      }),
    });
    alert('Respuesta enviada correctamente.');
    bootstrap.Modal.getInstance(document.getElementById('modalVerMensaje'))?.hide();
  } catch (err) {
    alert('Error al enviar la respuesta: ' + err.message);
  }
}
