document.addEventListener('DOMContentLoaded', () => {
    
    // 1. Seleccionamos los elementos del HTML
    const menuLinks = document.querySelectorAll('.sidebar .nav-link');
    const topBarTitle = document.querySelector('.top-bar h2');
    const contenedorCentral = document.querySelector('main section');

    // 2. Guardamos las tarjetas originales de la "Bandeja de Entrada"
    const contenidoBandejaEntrada = contenedorCentral.innerHTML;

    // 3. Recorremos los botones del menú
    menuLinks.forEach(link => {
        if (link.getAttribute('href') === '#') {
            
            link.addEventListener('click', (e) => {
                e.preventDefault();

                // Cambios visuales de los botones activos
                menuLinks.forEach(item => item.classList.remove('active'));
                link.classList.add('active');

                const textoSeccion = link.textContent.trim();
                const claseIcono = link.querySelector('i').className;
                topBarTitle.innerHTML = `<i class="${claseIcono} me-2"></i>${textoSeccion}`;

                // === CONTROL DE CONTENIDO DINÁMICO ===
                
                if (textoSeccion === 'Bandeja de Entrada') {
                    // Restaurar mensajes recibidos
                    contenedorCentral.innerHTML = contenidoBandejaEntrada;

                } else if (textoSeccion === 'Configuración') {
                    // NUEVO: Renderizar opciones típicas de configuración usando componentes de Bootstrap
                    contenedorCentral.innerHTML = `
                        <div class="row g-4" style="max-width: 800px; margin: 0 auto;">
                            <div class="col-12">
                                <div class="card shadow-sm border-0 p-4">
                                    <h5 class="card-title border-bottom pb-2 mb-3"><i class="bi bi-shield-lock me-2 text-primary"></i>Seguridad de la Cuenta</h5>
                                    <form id="formPassword">
                                        <div class="mb-3">
                                            <label class="form-label">Contraseña Actual</label>
                                            <input type="password" class="form-control" required>
                                        </div>
                                        <div class="mb-3">
                                            <label class="form-label">Nueva Contraseña</label>
                                            <input type="password" class="form-control" required>
                                        </div>
                                        <button type="submit" class="btn btn-sm btn-primary" style="background-color: #18a10b;">Actualizar Contraseña</button>
                                    </form>
                                </div>
                            </div>

                            <div class="col-12">
                                <div class="card shadow-sm border-0 p-4">
                                    <h5 class="card-title border-bottom pb-2 mb-3"><i class="bi bi-bell-sliders me-2 text-primary"></i>Preferencias del Portal</h5>
                                    
                                    <div class="form-check form-switch mb-3">
                                        <input class="form-check-input" type="checkbox" id="notifEmail" checked style="background-color: #198754; border-color: #198754;">
                                        <label class="form-check-input-label" for="notifEmail">Recibir alertas de nuevos mensajes en mi correo electrónico</label>
                                    </div>
                                    
                                    <div class="form-check form-switch mb-4">
                                        <input class="form-check-input" type="checkbox" id="notifNotas" checked style="background-color: #198754; border-color: #198754;">
                                        <label class="form-check-input-label" for="notifNotas">Notificarme inmediatamente cuando se publiquen calificaciones</label>
                                    </div>

                                    <div class="mb-3">
                                        <label class="form-label fw-semibold">Idioma del sistema</label>
                                        <select class="form-select form-select-sm" style="max-width: 200px;">
                                            <option value="es" selected>Español (Latinoamérica)</option>
                                            <option value="en">English</option>
                                        </select>
                                    </div>
                                    
                                    <div class="text-end">
                                        <button id="btnCancelarPref" class="btn btn-sm btn-secondary">Cancelar</button>
                                        <button id="btnGuardarPref" class="btn btn-sm btn-success">Guardar Preferencias</button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    `;

                    // Añadir lógica de eventos dentro de configuración para simular que funcionan
                    document.getElementById('formPassword').addEventListener('submit', (e) => {
                        e.preventDefault();
                        alert('¡Contraseña actualizada con éxito!');
                        e.target.reset();
                    });

                    document.getElementById('btnGuardarPref').addEventListener('click', () => {
                        alert('Preferencias guardadas correctamente.');
                    });

                } else {
                    // Contenido para las demás secciones vacías ("Enviados", "Comunicados")
                    contenedorCentral.innerHTML = `
                        <div class="text-center py-5 text-muted" style="margin-top: 4rem;">
                            <i class="${claseIcono} display-1 mb-3 d-block text-secondary" style="opacity: 0.5;"></i>
                            <h3>${textoSeccion}</h3>
                            <p class="lead">No hay elementos o actividades registradas en esta sección actualmente.</p>
                        </div>
                    `;
                }

                document.getElementById('btnCancelarPref').addEventListener('click', () => {
                    // 1. Restaurar las tarjetas originales de la Bandeja de Entrada en el contenedor central
                    contenedorCentral.innerHTML = contenidoBandejaEntrada;

                    // 2. Actualizar el título de la barra superior
                    topBarTitle.innerHTML = `<i class="bi bi-envelope me-2"></i>Bandeja de Entrada`;

                    // 3. Actualizar visualmente el menú lateral (quitar active a Configuración y ponérselo a Bandeja)
                    menuLinks.forEach(item => item.classList.remove('active'));
                    
                    // Buscamos el enlace de la Bandeja de Entrada para activarlo
                    const enlaceBandeja = Array.from(menuLinks).find(item => item.textContent.trim() === 'Bandeja de Entrada');
                    if (enlaceBandeja) {
                        enlaceBandeja.classList.add('active');
                    }
                });
            });
        }
    });
});