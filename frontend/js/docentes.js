/* =============================================
   DOCENTES.JS
   Lógica del dashboard del portal docente
   Usado por: dashboard-docente.html
   ============================================= */

// ── Datos demo ──
const estudiantes = [
    { nombre: "Alejandro Ramírez", doc: "1023001" },
    { nombre: "Valeria Moreno",    doc: "1023002" },
    { nombre: "Santiago Gómez",    doc: "1023003" },
    { nombre: "Isabella Torres",   doc: "1023004" },
    { nombre: "Sebastián Ruiz",    doc: "1023005" },
    { nombre: "Camila Vargas",     doc: "1023006" },
    { nombre: "Daniel Herrera",    doc: "1023007" },
    { nombre: "Laura Castillo",    doc: "1023008" },
];

const notasPrev = [4.2, 3.8, 2.9, 4.5, 3.1, 4.0, 2.5, 3.7];

// ── Inicialización ──
document.addEventListener('DOMContentLoaded', () => {
    // Recuperar datos del docente desde sessionStorage
    const correo = sessionStorage.getItem('docente-correo');

    if (!correo) {
        // Si no hay sesión activa, redirigir al login
        window.location.href = 'login-docente.html';
        return;
    }

    const nombre = correo.split('@')[0];
    const iniciales = nombre.substring(0, 2).toUpperCase();
    const nombreFormateado = 'Prof. ' + nombre.charAt(0).toUpperCase() + nombre.slice(1);

    document.getElementById('nombre-docente').textContent = nombreFormateado;
    document.getElementById('avatar-iniciales').textContent = iniciales;

    renderTabla();
});

// ── Tabla de estudiantes ──
function renderTabla() {
    const tbody = document.getElementById('tbody-estudiantes');
    tbody.innerHTML = estudiantes.map((e, i) => {
        const np  = notasPrev[i];
        const cls = np >= 4 ? 'nota-alta' : np >= 3 ? 'nota-media' : 'nota-baja';
        return `<tr>
            <td>${i + 1}</td>
            <td><strong>${e.nombre}</strong></td>
            <td style="color:#888">${e.doc}</td>
            <td><span class="${cls}">${np.toFixed(1)}</span></td>
            <td><input type="number" class="nota-input" min="1" max="5" step="0.1" placeholder="—" id="nota-${i}"></td>
            <td><span class="badge" style="background:#e8f5eb;color:var(--verde);font-size:0.75rem;">Pendiente</span></td>
        </tr>`;
    }).join('');
}

// ── Cerrar sesión ──
function cerrarSesion() {
    sessionStorage.removeItem('docente-correo');
    window.location.href = 'login-docente.html';
}

// ── Navegación entre secciones ──
function mostrarSeccion(id, enlace) {
    document.querySelectorAll('.dash-section').forEach(s => s.classList.remove('active'));
    document.querySelectorAll('.sidebar .nav-link').forEach(l => l.classList.remove('active'));

    document.getElementById('sec-' + id).classList.add('active');

    // Si se pasa el elemento que disparó el click, marcarlo como activo
    if (enlace) {
        enlace.classList.add('active');
    }

    const titulos = {
        resumen:  'Resumen',
        cursos:   'Mis cursos',
        notas:    'Ingresar notas',
        mensajes: 'Mensajes'
    };
    document.getElementById('titulo-seccion').textContent = titulos[id] || id;
}

// ── Ir directamente a notas desde un curso ──
function irANotas(materia, grado) {
    document.querySelectorAll('.dash-section').forEach(s => s.classList.remove('active'));
    document.querySelectorAll('.sidebar .nav-link').forEach(l => l.classList.remove('active'));

    document.getElementById('sec-notas').classList.add('active');
    document.querySelectorAll('.sidebar .nav-link')[2].classList.add('active');

    document.getElementById('titulo-seccion').textContent = 'Ingresar notas';
    document.getElementById('titulo-notas').textContent = `Notas — ${materia} ${grado}`;

    renderTabla();
}

// ── Guardar notas ──
function guardarNotas() {
    let completas = true;
    estudiantes.forEach((_, i) => {
        const v = document.getElementById('nota-' + i).value;
        if (!v) completas = false;
    });

    if (!completas) {
        mostrarToast('Complete todas las notas antes de guardar');
        return;
    }
    mostrarToast('Notas guardadas correctamente ✓');
}

// ── Toast de notificación ──
function mostrarToast(msg) {
    const t = document.getElementById('toast');
    document.getElementById('toast-msg').textContent = msg;
    t.classList.add('show');
    setTimeout(() => t.classList.remove('show'), 3000);
}
