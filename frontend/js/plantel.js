/* =============================================
   PLANTEL.JS
   Vista pública del plantel docente, agrupado por materia
   Usado por: plantel.html
   Requiere: api.js
   ============================================= */

document.addEventListener('DOMContentLoaded', cargarPlantel);

// Escapa HTML básico
function esc(t) {
    const d = document.createElement('div');
    d.textContent = t == null ? '' : String(t);
    return d.innerHTML;
}

// Genera iniciales para el avatar (ej. "Ana María Rodríguez" -> "AR")
function iniciales(nombre) {
    const p = nombre.trim().split(/\s+/);
    return (p[0][0] + p[p.length - 1][0]).toUpperCase();
}

async function cargarPlantel() {
    const cont = document.getElementById('cont-plantel');
    try {
        const docentes = await apiFetch('/docentes/plantel');

        if (docentes.length === 0) {
            cont.innerHTML = '<p class="text-muted text-center">Aún no hay docentes registrados.</p>';
            return;
        }

        // Agrupar por materia (especialidad)
        const grupos = {};
        docentes.forEach(d => {
            (grupos[d.especialidad] = grupos[d.especialidad] || []).push(d);
        });

        // Ordenar las materias alfabéticamente
        const materias = Object.keys(grupos).sort((a, b) => a.localeCompare(b));

        cont.innerHTML = materias.map(materia => `
            <div class="mb-4">
                <h4 class="fw-bold mb-3" style="color:var(--verde);border-bottom:2px solid var(--verde);padding-bottom:6px;">
                    <i class="bi bi-mortarboard me-2"></i>${esc(materia)}
                </h4>
                <div class="row g-3">
                    ${grupos[materia].map(d => `
                        <div class="col-lg-4 col-md-6">
                            <div class="d-flex align-items-center gap-3 p-3 shadow-sm rounded bg-white h-100">
                                <div class="d-flex align-items-center justify-content-center flex-shrink-0"
                                     style="width:48px;height:48px;border-radius:50%;background:var(--verde);color:#fff;font-weight:bold;">
                                    ${iniciales(d.nombre)}
                                </div>
                                <div>
                                    <div class="fw-bold" style="line-height:1.2;">${esc(d.nombre)}</div>
                                    <small class="text-muted"><i class="bi bi-people me-1"></i>Curso: ${esc(d.cursoPrincipal)}</small>
                                </div>
                            </div>
                        </div>
                    `).join('')}
                </div>
            </div>
        `).join('');
    } catch (err) {
        cont.innerHTML = '<p class="text-danger text-center">No se pudo cargar el plantel docente.</p>';
        console.error(err);
    }
}
