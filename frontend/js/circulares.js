/* =============================================
   CIRCULARES.JS
   Vista pública de circulares / documentación
   Usado por: circulares.html
   Requiere: api.js
   ============================================= */

document.addEventListener('DOMContentLoaded', cargarCirculares);

async function cargarCirculares() {
    const cont = document.getElementById('lista-circulares');
    if (!cont) return;

    try {
        const circulares = await apiFetch('/circulares');

        if (circulares.length === 0) {
            cont.innerHTML = '<p class="text-muted text-center">Por el momento no hay circulares publicadas.</p>';
            return;
        }

        cont.innerHTML = circulares.map(c => {
            const fecha = new Date(c.fechaPublicacion).toLocaleDateString('es-CO', {
                day: '2-digit', month: 'long', year: 'numeric'
            });
            return `
                <div class="col-lg-8">
                    <div class="card shadow-sm border-0">
                        <div class="card-body d-flex justify-content-between align-items-center gap-3">
                            <div>
                                <h5 class="fw-bold mb-1">
                                    <i class="bi bi-file-earmark-pdf me-2 text-danger"></i>${esc(c.titulo)}
                                </h5>
                                ${c.descripcion ? `<p class="text-muted mb-1" style="font-size:0.9rem;">${esc(c.descripcion)}</p>` : ''}
                                <small class="text-muted"><i class="bi bi-clock me-1"></i>${fecha}</small>
                            </div>
                            <a class="btn btn-sm fw-bold text-white flex-shrink-0" style="background:var(--verde)"
                               href="${esc(c.archivoUrl)}" target="_blank" rel="noopener">
                                <i class="bi bi-download me-1"></i>Ver / Descargar
                            </a>
                        </div>
                    </div>
                </div>`;
        }).join('');
    } catch (err) {
        cont.innerHTML = '<p class="text-danger text-center">No se pudieron cargar las circulares.</p>';
        console.error(err);
    }
}

// Escapa HTML básico
function esc(t) {
    const d = document.createElement('div');
    d.textContent = t == null ? '' : String(t);
    return d.innerHTML;
}
