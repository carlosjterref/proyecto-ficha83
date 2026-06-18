/* =============================================
   ADMIN.JS
   Panel de administración: gestión de noticias
   Usado por: dashboard-admin.html
   Requiere: api.js (cargado antes que este archivo)
   ============================================= */

let admin = null;

document.addEventListener('DOMContentLoaded', () => {
    admin = exigirSesion('admin', 'login-admin.html');
    if (!admin) return;

    document.getElementById('nombre-admin').textContent = admin.nombre;
    document.getElementById('avatar-admin').textContent = iniciales(admin.nombre);

    cargarNoticias();
    cargarCirculares();
});

/* ---------- NAVEGACIÓN ENTRE SECCIONES ---------- */

function mostrarSeccion(id, link) {
    document.querySelectorAll('.seccion').forEach(s => s.classList.remove('active'));
    document.getElementById('sec-' + id).classList.add('active');

    document.querySelectorAll('.sidebar .nav-link').forEach(a => a.classList.remove('active'));
    if (link) link.classList.add('active');

    // Mostrar el botón "Nueva ..." correspondiente y el título
    const esNoticias = (id === 'noticias');
    document.getElementById('btn-nueva-noticia').style.display  = esNoticias ? '' : 'none';
    document.getElementById('btn-nueva-circular').style.display = esNoticias ? 'none' : '';
    document.getElementById('titulo-seccion').innerHTML = esNoticias
        ? '<i class="bi bi-newspaper me-2"></i>Gestión de Noticias'
        : '<i class="bi bi-file-earmark-text me-2"></i>Gestión de Circulares';

    return false;
}

function iniciales(nombre) {
    return nombre.trim().split(/\s+/).slice(0, 2).map(p => p[0].toUpperCase()).join('');
}

/* ---------- LISTAR NOTICIAS ---------- */

async function cargarNoticias() {
    const cont = document.getElementById('lista-noticias');
    try {
        const noticias = await apiFetch('/noticias');

        if (noticias.length === 0) {
            cont.innerHTML = '<p class="text-muted">Aún no hay noticias. Crea la primera con "Nueva noticia".</p>';
            return;
        }

        cont.innerHTML = noticias.map(n => `
            <div class="card shadow-sm border-0 mb-3">
                <div class="card-body">
                    <div class="d-flex justify-content-between align-items-start">
                        <div>
                            <span class="badge" style="background:var(--verde)">${escaparHtml(n.categoria)}</span>
                            <h5 class="fw-bold mt-2 mb-1">${escaparHtml(n.titulo)}</h5>
                            <small class="text-muted">
                                <i class="bi bi-person me-1"></i>${escaparHtml(n.autor)} ·
                                <i class="bi bi-clock me-1"></i>${formatearFechaMsg(n.fechaPublicacion)}
                            </small>
                        </div>
                        <div class="d-flex gap-2">
                            <button class="btn btn-sm btn-outline-secondary" onclick='editarNoticia(${n.idNoticia})' title="Editar">
                                <i class="bi bi-pencil"></i>
                            </button>
                            <button class="btn btn-sm btn-outline-danger" onclick="eliminarNoticia(${n.idNoticia})" title="Eliminar">
                                <i class="bi bi-trash"></i>
                            </button>
                        </div>
                    </div>
                    <p class="mt-2 mb-0 text-muted" style="font-size:0.9rem;">${escaparHtml(n.contenido).slice(0, 160)}${n.contenido.length > 160 ? '…' : ''}</p>
                    ${n.mediaUrl ? `<small class="text-primary"><i class="bi bi-${n.tipoMedia === 'video' ? 'play-circle' : 'image'} me-1"></i>${n.tipoMedia}</small>` : ''}
                </div>
            </div>
        `).join('');

        // Guardamos las noticias en memoria para editarlas sin volver a pedirlas
        _noticiasCache = {};
        noticias.forEach(n => _noticiasCache[n.idNoticia] = n);
    } catch (err) {
        cont.innerHTML = `<p class="text-danger">${err.message}</p>`;
    }
}

let _noticiasCache = {};

/* ---------- CREAR / EDITAR ---------- */

// Muestra u oculta el campo de URL según el tipo de multimedia elegido
function toggleMediaUrl() {
    const tipo = document.getElementById('not-tipomedia').value;
    document.getElementById('campo-mediaurl').style.display = (tipo === 'ninguno') ? 'none' : 'block';
}

// Abre el modal vacío para una noticia nueva
function nuevaNoticia() {
    document.getElementById('modalNoticiaTitulo').innerHTML = '<i class="bi bi-pencil-square me-2"></i>Nueva noticia';
    document.getElementById('not-id').value = '';
    document.getElementById('not-titulo').value = '';
    document.getElementById('not-categoria').value = 'Noticia';
    document.getElementById('not-tipomedia').value = 'ninguno';
    document.getElementById('not-mediaurl').value = '';
    document.getElementById('not-contenido').value = '';
    toggleMediaUrl();
    bootstrap.Modal.getOrCreateInstance(document.getElementById('modalNoticia')).show();
}

// Abre el modal con los datos de una noticia existente
function editarNoticia(id) {
    const n = _noticiasCache[id];
    if (!n) return;
    document.getElementById('modalNoticiaTitulo').innerHTML = '<i class="bi bi-pencil-square me-2"></i>Editar noticia';
    document.getElementById('not-id').value = n.idNoticia;
    document.getElementById('not-titulo').value = n.titulo;
    document.getElementById('not-categoria').value = n.categoria;
    document.getElementById('not-tipomedia').value = n.tipoMedia;
    document.getElementById('not-mediaurl').value = n.mediaUrl || '';
    document.getElementById('not-contenido').value = n.contenido;
    toggleMediaUrl();
    bootstrap.Modal.getOrCreateInstance(document.getElementById('modalNoticia')).show();
}

// Crea (POST) o actualiza (PUT) según haya o no un id
async function guardarNoticia() {
    const id        = document.getElementById('not-id').value;
    const titulo    = document.getElementById('not-titulo').value.trim();
    const contenido = document.getElementById('not-contenido').value.trim();
    const categoria = document.getElementById('not-categoria').value;
    const tipoMedia = document.getElementById('not-tipomedia').value;
    const mediaUrl  = document.getElementById('not-mediaurl').value.trim();

    if (!titulo || !contenido) { mostrarToast('El título y el contenido son obligatorios.'); return; }

    const datos = { titulo, contenido, categoria, tipoMedia, mediaUrl: mediaUrl || null };

    try {
        if (id) {
            await apiFetch(`/noticias/${id}`, { method: 'PUT', body: JSON.stringify(datos) });
            mostrarToast('Noticia actualizada ✓');
        } else {
            await apiFetch('/noticias', { method: 'POST', body: JSON.stringify(datos) });
            mostrarToast('Noticia publicada ✓');
        }
        bootstrap.Modal.getInstance(document.getElementById('modalNoticia'))?.hide();
        cargarNoticias();
    } catch (err) {
        mostrarToast('Error: ' + err.message);
    }
}

// Elimina una noticia (con confirmación)
async function eliminarNoticia(id) {
    if (!confirm('¿Seguro que desea eliminar esta noticia?')) return;
    try {
        await apiFetch(`/noticias/${id}`, { method: 'DELETE' });
        mostrarToast('Noticia eliminada ✓');
        cargarNoticias();
    } catch (err) {
        mostrarToast('Error: ' + err.message);
    }
}

/* ============================================================
   CIRCULARES / DOCUMENTACIÓN
   ============================================================ */

let _circularesCache = {};

async function cargarCirculares() {
    const cont = document.getElementById('lista-circulares');
    try {
        const circulares = await apiFetch('/circulares');

        if (circulares.length === 0) {
            cont.innerHTML = '<p class="text-muted">Aún no hay circulares. Crea la primera con "Nueva circular".</p>';
            return;
        }

        cont.innerHTML = circulares.map(c => `
            <div class="card shadow-sm border-0 mb-3">
                <div class="card-body">
                    <div class="d-flex justify-content-between align-items-start">
                        <div>
                            <h5 class="fw-bold mb-1"><i class="bi bi-file-earmark-pdf me-2 text-danger"></i>${escaparHtml(c.titulo)}</h5>
                            <small class="text-muted">
                                <i class="bi bi-person me-1"></i>${escaparHtml(c.autor)} ·
                                <i class="bi bi-clock me-1"></i>${formatearFechaMsg(c.fechaPublicacion)}
                            </small>
                        </div>
                        <div class="d-flex gap-2">
                            <a class="btn btn-sm btn-outline-primary" href="${escaparHtml(c.archivoUrl)}" target="_blank" title="Abrir documento">
                                <i class="bi bi-box-arrow-up-right"></i>
                            </a>
                            <button class="btn btn-sm btn-outline-secondary" onclick="editarCircular(${c.idCircular})" title="Editar">
                                <i class="bi bi-pencil"></i>
                            </button>
                            <button class="btn btn-sm btn-outline-danger" onclick="eliminarCircular(${c.idCircular})" title="Eliminar">
                                <i class="bi bi-trash"></i>
                            </button>
                        </div>
                    </div>
                    ${c.descripcion ? `<p class="mt-2 mb-0 text-muted" style="font-size:0.9rem;">${escaparHtml(c.descripcion)}</p>` : ''}
                </div>
            </div>
        `).join('');

        _circularesCache = {};
        circulares.forEach(c => _circularesCache[c.idCircular] = c);
    } catch (err) {
        cont.innerHTML = `<p class="text-danger">${err.message}</p>`;
    }
}

function nuevaCircular() {
    document.getElementById('modalCircularTitulo').innerHTML = '<i class="bi bi-file-earmark-text me-2"></i>Nueva circular';
    document.getElementById('cir-id').value = '';
    document.getElementById('cir-titulo').value = '';
    document.getElementById('cir-archivourl').value = '';
    document.getElementById('cir-descripcion').value = '';
    bootstrap.Modal.getOrCreateInstance(document.getElementById('modalCircular')).show();
}

function editarCircular(id) {
    const c = _circularesCache[id];
    if (!c) return;
    document.getElementById('modalCircularTitulo').innerHTML = '<i class="bi bi-file-earmark-text me-2"></i>Editar circular';
    document.getElementById('cir-id').value = c.idCircular;
    document.getElementById('cir-titulo').value = c.titulo;
    document.getElementById('cir-archivourl').value = c.archivoUrl;
    document.getElementById('cir-descripcion').value = c.descripcion || '';
    bootstrap.Modal.getOrCreateInstance(document.getElementById('modalCircular')).show();
}

async function guardarCircular() {
    const id          = document.getElementById('cir-id').value;
    const titulo      = document.getElementById('cir-titulo').value.trim();
    const archivoUrl  = document.getElementById('cir-archivourl').value.trim();
    const descripcion = document.getElementById('cir-descripcion').value.trim();

    if (!titulo || !archivoUrl) { mostrarToast('El título y el enlace son obligatorios.'); return; }

    const datos = { titulo, archivoUrl, descripcion: descripcion || null };

    try {
        if (id) {
            await apiFetch(`/circulares/${id}`, { method: 'PUT', body: JSON.stringify(datos) });
            mostrarToast('Circular actualizada ✓');
        } else {
            await apiFetch('/circulares', { method: 'POST', body: JSON.stringify(datos) });
            mostrarToast('Circular publicada ✓');
        }
        bootstrap.Modal.getInstance(document.getElementById('modalCircular'))?.hide();
        cargarCirculares();
    } catch (err) {
        mostrarToast('Error: ' + err.message);
    }
}

async function eliminarCircular(id) {
    if (!confirm('¿Seguro que desea eliminar esta circular?')) return;
    try {
        await apiFetch(`/circulares/${id}`, { method: 'DELETE' });
        mostrarToast('Circular eliminada ✓');
        cargarCirculares();
    } catch (err) {
        mostrarToast('Error: ' + err.message);
    }
}

/* ---------- TOAST ---------- */

function mostrarToast(msg) {
    const t = document.getElementById('toast');
    document.getElementById('toast-msg').textContent = msg;
    t.classList.add('show');
    setTimeout(() => t.classList.remove('show'), 3000);
}
