/* =============================================
   DOCENTES.JS
   Lógica del dashboard del portal docente (datos reales vía API)
   Usado por: dashboard-docente.html
   Requiere: api.js (cargado antes que este archivo)
   ============================================= */

let docente       = null;  // datos del docente logueado
let misCursos     = [];     // materias asignadas al docente
let misEstudiantes = [];    // alumnos de los cursos del docente (sin duplicados)

// ── Inicialización ──
document.addEventListener('DOMContentLoaded', async () => {
    // Protege la página: si no hay sesión de docente, redirige al login
    docente = exigirSesion('docente', 'login-docente.html');
    if (!docente) return;

    // Mostrar nombre e iniciales del docente
    document.getElementById('nombre-docente').textContent = docente.nombre;
    document.getElementById('avatar-iniciales').textContent = iniciales(docente.nombre);

    await cargarCursos();
    await cargarEstudiantes();
    cargarMensajesDoc();
});

// Genera iniciales a partir del nombre (ej: "Carlos Pérez" -> "CP")
function iniciales(nombre) {
    return nombre.trim().split(/\s+/).slice(0, 2).map(p => p[0].toUpperCase()).join('');
}

/* ---------- MIS CURSOS ---------- */

async function cargarCursos() {
    try {
        // El endpoint devuelve todas las materias; filtramos las del docente logueado
        const todas = await apiFetch('/materias');
        misCursos = todas.filter(m => m.idDocente === docente.id);

        renderCursos();
        llenarSelectCursos();

        // Actualiza la tarjeta "Cursos asignados"
        document.getElementById('stat-cursos').textContent = misCursos.length;
    } catch (err) {
        console.error('Error al cargar cursos:', err.message);
    }
}

// Dibuja las tarjetas de cursos en la sección "Mis cursos"
function renderCursos() {
    const cont = document.querySelector('#sec-cursos .panel-body .row');
    if (!cont) return;

    if (misCursos.length === 0) {
        cont.innerHTML = '<p class="text-muted">No tiene cursos asignados.</p>';
        return;
    }

    cont.innerHTML = misCursos.map(c => `
        <div class="col-md-6" onclick="irANotas(${c.idMateria})">
            <div class="curso-card">
                <div class="d-flex justify-content-between align-items-start">
                    <div>
                        <div class="curso-nombre"><i class="bi bi-journal-text me-2"></i>${c.nombre}</div>
                        <div class="curso-info">Grado ${c.grado}</div>
                    </div>
                    <span class="curso-badge">Ver notas</span>
                </div>
            </div>
        </div>
    `).join('');
}

// Llena el <select> de cursos en la sección "Ingresar notas"
function llenarSelectCursos() {
    const sel = document.getElementById('sel-curso');
    if (misCursos.length === 0) {
        sel.innerHTML = '<option value="">Sin cursos asignados</option>';
        return;
    }
    sel.innerHTML = misCursos
        .map(c => `<option value="${c.idMateria}">${c.nombre} — Grado ${c.grado}</option>`)
        .join('');
}

/* ---------- INGRESAR NOTAS ---------- */

// Carga los alumnos de la materia seleccionada y los pinta en la tabla
async function cargarAlumnos() {
    const idMateria = document.getElementById('sel-curso').value;
    const periodo   = document.getElementById('sel-periodo').value;
    const tbody     = document.getElementById('tbody-estudiantes');

    if (!idMateria) {
        tbody.innerHTML = '<tr><td colspan="6" class="text-center text-muted">Seleccione un curso.</td></tr>';
        return;
    }

    tbody.innerHTML = '<tr><td colspan="6" class="text-center text-muted">Cargando alumnos...</td></tr>';

    try {
        const alumnos = await apiFetch(`/materias/${idMateria}/alumnos?periodo=${encodeURIComponent(periodo)}`);

        if (alumnos.length === 0) {
            tbody.innerHTML = '<tr><td colspan="6" class="text-center text-muted">No hay alumnos inscritos en esta materia.</td></tr>';
            return;
        }

        tbody.innerHTML = alumnos.map((a, i) => {
            const notaPrev = a.calificacion !== null && a.calificacion !== undefined
                ? Number(a.calificacion).toFixed(1) : '—';
            const cls = a.calificacion >= 6 ? 'nota-alta' : (a.calificacion !== null ? 'nota-baja' : '');
            const estado = a.idNota
                ? '<span class="badge" style="background:#e8f5eb;color:var(--verde);font-size:0.75rem;">Registrada</span>'
                : '<span class="badge" style="background:#fff3e0;color:#e65100;font-size:0.75rem;">Pendiente</span>';

            return `<tr data-idalumno="${a.idAlumno}" data-idnota="${a.idNota || ''}">
                <td>${i + 1}</td>
                <td><strong>${a.nombre} ${a.apellido}</strong></td>
                <td style="color:#888">${a.documento || '—'}</td>
                <td><span class="${cls}">${notaPrev}</span></td>
                <td><input type="number" class="nota-input" min="1" max="10" step="0.1" placeholder="—" id="nota-${a.idAlumno}"></td>
                <td>${estado}</td>
            </tr>`;
        }).join('');
    } catch (err) {
        tbody.innerHTML = `<tr><td colspan="6" class="text-center text-danger">${err.message}</td></tr>`;
    }
}

// Guarda (crea o actualiza) las notas escritas en la tabla
async function guardarNotas() {
    const idMateria = document.getElementById('sel-curso').value;
    const periodo   = document.getElementById('sel-periodo').value;
    if (!idMateria) { mostrarToast('Seleccione un curso primero.'); return; }

    const filas = document.querySelectorAll('#tbody-estudiantes tr[data-idalumno]');
    let guardadas = 0;

    for (const fila of filas) {
        const idAlumno = fila.dataset.idalumno;
        const idNota   = fila.dataset.idnota;
        const valor    = document.getElementById('nota-' + idAlumno).value;

        if (!valor) continue; // se omiten las filas sin nota escrita

        try {
            if (idNota) {
                // Ya existe nota -> actualizar
                await apiFetch(`/notas/${idNota}`, {
                    method: 'PUT',
                    body: JSON.stringify({ calificacion: parseFloat(valor), periodo }),
                });
            } else {
                // No existe -> crear
                await apiFetch('/notas', {
                    method: 'POST',
                    body: JSON.stringify({
                        calificacion: parseFloat(valor),
                        periodo,
                        idAlumno: parseInt(idAlumno),
                        idMateria: parseInt(idMateria),
                        idDocente: docente.id,
                    }),
                });
            }
            guardadas++;
        } catch (err) {
            mostrarToast('Error: ' + err.message);
            return;
        }
    }

    if (guardadas === 0) {
        mostrarToast('No escribió ninguna nota.');
    } else {
        mostrarToast(`${guardadas} nota(s) guardada(s) correctamente ✓`);
        cargarAlumnos(); // recarga para reflejar los cambios
    }
}

/* ---------- MENSAJES ---------- */

// Carga los mensajes recibidos (función compartida de api.js) y actualiza
// el badge del menú, la tarjeta del resumen y el panel de mensajes recientes.
async function cargarMensajesDoc() {
    const mensajes = await cargarMensajesEn('lista-mensajes');
    const noLeidos = mensajes.filter(m => m.leida === 0).length;

    // Insignia del menú lateral (junto a "Mensajes")
    const badge = document.querySelector('.sidebar-menu .nav-link .badge');
    if (badge) {
        badge.textContent = noLeidos;
        badge.style.display = noLeidos > 0 ? '' : 'none';
    }

    // Tarjeta "Mensajes nuevos" del Resumen
    const statMsg = document.getElementById('stat-mensajes');
    if (statMsg) statMsg.textContent = noLeidos;

    // Panel "Mensajes recientes" (los 4 más recientes)
    renderPanelMensajes(mensajes.slice(0, 4));
}

// Pinta los mensajes recientes en el Resumen (clic abre el pop-up compartido)
function renderPanelMensajes(mensajes) {
    const cont = document.getElementById('panel-mensajes-recientes');
    if (!cont) return;

    if (mensajes.length === 0) {
        cont.innerHTML = '<p class="text-muted mb-0">No tiene mensajes.</p>';
        return;
    }

    cont.innerHTML = `<ul class="list-unstyled mb-0" style="font-size:0.88rem;">` +
        mensajes.map(m => `
            <li class="d-flex gap-2 align-items-start mb-3" style="cursor:pointer;" onclick="abrirMensaje(${m.idMensaje})">
                <i class="bi ${m.leida ? 'bi-envelope-open text-muted' : 'bi-envelope-fill'} mt-1" style="${m.leida ? '' : 'color:var(--verde)'}"></i>
                <div>
                    <strong>${m.emisorTipo}</strong>${m.tipo ? ' — ' + m.tipo : ''}<br>
                    <small class="text-muted">${formatearFechaMsg(m.fechaHora)}</small>
                </div>
            </li>`).join('') +
        `</ul>`;
}

// Reúne los alumnos de todos los cursos del docente (sin duplicados),
// llena el <select> de mensajes y calcula las estadísticas del Resumen.
async function cargarEstudiantes() {
    const mapa = new Map();
    let totalPendientes = 0;          // pares alumno-curso sin ninguna nota
    const resumenCursos = [];          // datos por curso para el panel

    for (const curso of misCursos) {
        try {
            const alumnos = await apiFetch(`/materias/${curso.idMateria}/alumnos`);

            // Un alumno puede venir repetido si tiene varias notas; deduplicamos por curso
            const enCurso   = new Set();
            const conNota   = new Set();
            alumnos.forEach(a => {
                mapa.set(a.idAlumno, a);
                enCurso.add(a.idAlumno);
                if (a.idNota) conNota.add(a.idAlumno);
            });

            const pendientes = enCurso.size - conNota.size;
            totalPendientes += pendientes;
            resumenCursos.push({ nombre: curso.nombre, grado: curso.grado, estudiantes: enCurso.size, pendientes });
        } catch (err) {
            console.error('Error al cargar alumnos del curso', curso.idMateria, err.message);
        }
    }
    misEstudiantes = [...mapa.values()];

    // Llenar el <select> de destinatarios del modal de mensajes
    const sel = document.getElementById('msg-destinatario');
    if (sel) {
        sel.innerHTML = '<option value="todos">Todos mis estudiantes</option>' +
            misEstudiantes.map(a =>
                `<option value="${a.idAlumno}">${a.nombre} ${a.apellido}</option>`
            ).join('');
    }

    // Tarjetas del Resumen
    document.getElementById('stat-estudiantes').textContent = misEstudiantes.length;
    document.getElementById('stat-pendientes').textContent = totalPendientes;

    // Panel "Resumen de cursos"
    renderPanelCursos(resumenCursos);
}

// Pinta el panel con un resumen de cada curso (estudiantes y notas pendientes)
function renderPanelCursos(resumen) {
    const cont = document.getElementById('panel-cursos');
    if (!cont) return;

    if (resumen.length === 0) {
        cont.innerHTML = '<p class="text-muted mb-0">No tiene cursos asignados.</p>';
        return;
    }

    cont.innerHTML = `<ul class="list-unstyled mb-0" style="font-size:0.88rem;">` +
        resumen.map(c => `
            <li class="d-flex justify-content-between align-items-center mb-3 pb-2" style="border-bottom:1px solid #f0f0f0">
                <div><strong>${c.nombre}</strong> — Grado ${c.grado}<br>
                    <small class="text-muted">${c.estudiantes} estudiante(s)</small></div>
                <span class="badge" style="background:${c.pendientes > 0 ? '#fdecea' : '#e8f5eb'};color:${c.pendientes > 0 ? '#c0392b' : 'var(--verde)'}">
                    ${c.pendientes > 0 ? c.pendientes + ' pendiente(s)' : 'Al día'}
                </span>
            </li>`).join('') +
        `</ul>`;
}

// Envía un mensaje nuevo a un estudiante o a todos los estudiantes del docente
async function enviarMensajeDocente() {
    const destino  = document.getElementById('msg-destinatario').value;
    const asunto   = document.getElementById('msg-asunto').value.trim();
    const contenido = document.getElementById('msg-contenido').value.trim();

    if (!contenido) { mostrarToast('Escriba el contenido del mensaje.'); return; }

    // Construir la lista de receptores
    let receptores;
    if (destino === 'todos') {
        if (misEstudiantes.length === 0) { mostrarToast('No tiene estudiantes a quien enviar.'); return; }
        receptores = misEstudiantes.map(a => ({ idReceptor: a.idAlumno, receptorTipo: 'Alumno' }));
    } else {
        receptores = [{ idReceptor: parseInt(destino), receptorTipo: 'Alumno' }];
    }

    try {
        await apiFetch('/comunicaciones', {
            method: 'POST',
            body: JSON.stringify({ contenido, tipo: asunto || null, receptores }),
        });
        mostrarToast('Mensaje enviado correctamente ✓');

        // Limpiar y cerrar el modal
        document.getElementById('msg-asunto').value = '';
        document.getElementById('msg-contenido').value = '';
        bootstrap.Modal.getInstance(document.getElementById('modalMensaje'))?.hide();
    } catch (err) {
        mostrarToast('Error: ' + err.message);
    }
}

/* ---------- NAVEGACIÓN ---------- */

function mostrarSeccion(id, enlace) {
    document.querySelectorAll('.dash-section').forEach(s => s.classList.remove('active'));
    document.querySelectorAll('.sidebar .nav-link').forEach(l => l.classList.remove('active'));

    document.getElementById('sec-' + id).classList.add('active');
    if (enlace) enlace.classList.add('active');

    const titulos = {
        resumen:  'Resumen',
        cursos:   'Mis cursos',
        notas:    'Ingresar notas',
        mensajes: 'Mensajes'
    };
    document.getElementById('titulo-seccion').textContent = titulos[id] || id;
}

// Ir directamente a la sección de notas con un curso preseleccionado
function irANotas(idMateria) {
    document.querySelectorAll('.dash-section').forEach(s => s.classList.remove('active'));
    document.querySelectorAll('.sidebar .nav-link').forEach(l => l.classList.remove('active'));

    document.getElementById('sec-notas').classList.add('active');
    document.querySelectorAll('.sidebar .nav-link')[2].classList.add('active');
    document.getElementById('titulo-seccion').textContent = 'Ingresar notas';

    if (idMateria) document.getElementById('sel-curso').value = idMateria;
    cargarAlumnos();
}

/* ---------- UTILIDADES ---------- */

// Toast de notificación (definido en components.css / dashboard)
function mostrarToast(msg) {
    const t = document.getElementById('toast');
    document.getElementById('toast-msg').textContent = msg;
    t.classList.add('show');
    setTimeout(() => t.classList.remove('show'), 3000);
}
