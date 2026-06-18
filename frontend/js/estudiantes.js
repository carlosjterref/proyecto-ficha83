function mostrarSeccion(id, link) {
    // Ocultar todas las secciones
    document.querySelectorAll('.seccion').forEach(s => s.classList.remove('active'));

    // Mostrar la sección seleccionada
    document.getElementById('sec-' + id).classList.add('active');

    // Actualizar nav-link activo
    document.querySelectorAll('.nav-link').forEach(a => a.classList.remove('active'));
    link.classList.add('active');

    // Actualizar título del header
    const titulos = {
        bandeja: 'Bandeja de Entrada',
        enviados: 'Enviados',
        comunicados: 'Comunicados Generales',
        configuracion: 'Configuración',
        notas: 'Mis Notas'
    };
    document.querySelector('.top-bar h2').innerHTML =
        '<i class="bi bi-envelope me-2"></i>' + titulos[id];

    return false;
}