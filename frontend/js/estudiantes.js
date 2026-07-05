/* =============================================
   ESTUDIANTES.JS
   Portal del estudiante (datos reales vía API)
   Usado por: Portal-estudiante.html
   Requiere: api.js (cargado antes que este archivo)
   ============================================= */

let alumno = null; // datos del alumno logueado

document.addEventListener('DOMContentLoaded', async () => {
    // Protege la página: si no hay sesión de alumno, redirige al login
    alumno = exigirSesion('alumno', 'login-estudiantes.html');
    if (!alumno) return;

    // Mostrar nombre e iniciales reales
    document.getElementById('nombre-est').textContent = alumno.nombre;
    document.getElementById('bienvenida-est').textContent = alumno.nombre;
    document.getElementById('avatar-est').textContent = iniciales(alumno.nombre);

    // Cargar datos iniciales
    cargarMensajes();
    cargarNotas();
    cargarComunicadosEn('lista-comunicados'); // función compartida de api.js
});

// Cambia la contraseña del estudiante (usa el endpoint compartido)
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

// Genera iniciales a partir del nombre (ej: "Paula Andrea" -> "PA")
function iniciales(nombre) {
    return nombre.trim().split(/\s+/).slice(0, 2).map(p => p[0].toUpperCase()).join('');
}

/* ---------- MENSAJES RECIBIDOS ---------- */

// Usa la función compartida de api.js (tarjetas expandibles + marcar leído)
function cargarMensajes() {
    cargarMensajesEn('lista-mensajes');
}

/* ---------- MIS NOTAS ---------- */

async function cargarNotas() {
    const cont = document.getElementById('tabla-notas');
    try {
        const notas = await apiFetch(`/notas/alumno/${alumno.id}`);

        if (notas.length === 0) {
            cont.innerHTML = '<p class="text-muted">Aún no tiene notas registradas.</p>';
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

/* ---------- UTILIDADES ---------- */

// Convierte un datetime de MySQL a texto legible
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

    document.querySelectorAll('.nav-link').forEach(a => a.classList.remove('active'));
    if (link) link.classList.add('active');

    const titulos = {
        bandeja: 'Bandeja de Entrada',
        comunicados: 'Comunicados Generales',
        configuracion: 'Configuración',
        notas: 'Mis Notas'
    };
    document.querySelector('.top-bar h2').innerHTML =
        '<i class="bi bi-envelope me-2"></i>' + (titulos[id] || id);

    return false;
}
