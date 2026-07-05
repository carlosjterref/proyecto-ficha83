/* =============================================
   ACUDIENTES.JS
   Portal del acudiente (datos reales vía API)
   Usado por: Portal-acudiente.html
   Requiere: api.js (cargado antes que este archivo)
   ============================================= */

let acudiente = null; // datos del acudiente logueado (token)
let hijo      = null;  // datos del alumno asociado

document.addEventListener('DOMContentLoaded', async () => {
    // Protege la página: si no hay sesión de acudiente, redirige al login
    acudiente = exigirSesion('acudiente', 'login-acudientes.html');
    if (!acudiente) return;

    // Mostrar nombre e iniciales reales
    document.getElementById('nombre-acu').textContent = acudiente.nombre;
    document.getElementById('bienvenida-acu').textContent = acudiente.nombre;
    document.getElementById('avatar-acu').textContent = iniciales(acudiente.nombre);

    // Obtener el hijo/a asociado al acudiente
    try {
        const info = await apiFetch(`/acudientes/${acudiente.id}`);
        hijo = {
            id: info.idAlumno,
            nombre: `${info.nombreAlumno} ${info.apellidoAlumno}`,
        };
        const titulo = document.getElementById('titulo-notas');
        if (titulo) titulo.textContent = `Notas de ${hijo.nombre}`;
    } catch (err) {
        console.error('No se pudo obtener el estudiante asociado:', err.message);
    }

    cargarMensajes();
    cargarNotas();
    cargarComunicadosEn('lista-comunicados'); // función compartida de api.js
    configurarFormularioMensaje();
});

// Cambia la contraseña del acudiente (usa el endpoint compartido)
async function guardarPassword(event) {
    event.preventDefault();
    const actual    = document.getElementById('pass-actual').value;
    const nueva      = document.getElementById('pass-nueva').value;
    const confirmar = document.getElementById('pass-confirmar').value;

    if (nueva !== confirmar) { alert('La nueva contraseña y su confirmación no coinciden.'); return; }

    try {
        const r = await cambiarContrasena(actual, nueva);
        alert(r.mensaje);
        document.getElementById('form-password').reset();
    } catch (err) {
        alert(err.message);
    }
}

function iniciales(nombre) {
    return nombre.trim().split(/\s+/).slice(0, 2).map(p => p[0].toUpperCase()).join('');
}

/* ---------- MENSAJES RECIBIDOS ---------- */

// Usa la función compartida de api.js (tarjetas expandibles + marcar leído)
function cargarMensajes() {
    cargarMensajesEn('lista-mensajes');
}

/* ---------- NOTAS DEL HIJO/A ---------- */

async function cargarNotas() {
    const cont = document.getElementById('tabla-notas');
    if (!hijo) {
        cont.innerHTML = '<p class="text-muted">No hay un estudiante asociado a esta cuenta.</p>';
        return;
    }
    try {
        const notas = await apiFetch(`/notas/alumno/${hijo.id}`);

        if (notas.length === 0) {
            cont.innerHTML = '<p class="text-muted">El estudiante aún no tiene notas registradas.</p>';
            return;
        }

        const filas = notas.map(n => {
            const aprobado = n.calificacion >= 6;
            const color = aprobado ? 'var(--verde)' : '#c0392b';
            return `<tr>
                <td>${n.materia}</td>
                <td>${n.periodo}</td>
                <td>${n.docente}</td>
                <td><strong style="color:${color}">${Number(n.calificacion).toFixed(1)}</strong></td>
            </tr>`;
        }).join('');

        cont.innerHTML = `
            <div class="table-responsive">
                <table class="table table-hover align-middle bg-white shadow-sm rounded">
                    <thead style="background:var(--verde);color:white;">
                        <tr>
                            <th>Materia</th>
                            <th>Período</th>
                            <th>Docente</th>
                            <th>Nota</th>
                        </tr>
                    </thead>
                    <tbody>${filas}</tbody>
                </table>
            </div>
            <small class="text-muted">Escala: 1.0 — 10.0 | Aprobación: 6.0</small>
        `;
    } catch (err) {
        cont.innerHTML = `<p class="text-danger">${err.message}</p>`;
    }
}

/* ---------- ENVIAR MENSAJE A LOS DOCENTES DEL HIJO/A ---------- */

function configurarFormularioMensaje() {
    const form = document.getElementById('formNuevoMensaje');
    if (!form) return;

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const asunto   = document.getElementById('asunto').value.trim();
        const mensaje  = document.getElementById('mensaje').value.trim();

        if (!hijo) { alert('No hay un estudiante asociado para identificar destinatarios.'); return; }

        try {
            // Buscar los docentes que dictan materias del grado del hijo/a
            const alumnoInfo = await apiFetch(`/alumnos/${hijo.id}`);
            const materias   = await apiFetch('/materias');
            const docentesIds = [...new Set(
                materias.filter(m => m.grado === alumnoInfo.grado).map(m => m.idDocente)
            )];

            if (docentesIds.length === 0) {
                alert('No se encontraron docentes asignados al grado del estudiante.');
                return;
            }

            const receptores = docentesIds.map(id => ({ idReceptor: id, receptorTipo: 'Docente' }));

            await apiFetch('/comunicaciones', {
                method: 'POST',
                body: JSON.stringify({ contenido: mensaje, tipo: asunto, receptores }),
            });

            alert('Mensaje enviado correctamente a los docentes del estudiante.');
            form.reset();
            // Cierra el modal de Bootstrap
            bootstrap.Modal.getInstance(document.getElementById('modalNuevoMensaje'))?.hide();
        } catch (err) {
            alert('Error al enviar el mensaje: ' + err.message);
        }
    });
}

/* ---------- UTILIDADES ---------- */

function formatearFecha(fecha) {
    const d = new Date(fecha);
    if (isNaN(d)) return fecha;
    return d.toLocaleDateString('es-CO', {
        day: '2-digit', month: 'short', year: 'numeric',
        hour: '2-digit', minute: '2-digit'
    });
}

/* ---------- NAVEGACIÓN ENTRE SECCIONES ---------- */

function mostrarSeccion(id, link) {
    document.querySelectorAll('.seccion').forEach(s => s.classList.remove('active'));
    document.getElementById('sec-' + id).classList.add('active');

    document.querySelectorAll('.sidebar .nav-link').forEach(a => a.classList.remove('active'));
    if (link) link.classList.add('active');

    const titulos = {
        bandeja: 'Bandeja de Entrada',
        notas: 'Notas del Estudiante',
        comunicados: 'Comunicados Generales',
        configuracion: 'Configuración'
    };
    document.querySelector('.top-bar h2').innerHTML =
        '<i class="bi bi-envelope me-2"></i>' + (titulos[id] || id);

    return false;
}
