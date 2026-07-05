/* =============================================
   REGISTRO.JS
   Registro público de estudiante + acudiente
   Usado por: registro.html
   Requiere: api.js
   ============================================= */

document.getElementById('form-registro').addEventListener('submit', async (event) => {
    event.preventDefault();

    // Recolectar los datos del formulario
    const datos = {
        estudiante: {
            nombre:     document.getElementById('est-nombre').value.trim(),
            apellido:   document.getElementById('est-apellido').value.trim(),
            documento:  document.getElementById('est-documento').value.trim(),
            grado:      parseInt(document.getElementById('est-grado').value, 10),
            correo:     document.getElementById('est-correo').value.trim() || null,
            usuario:    document.getElementById('est-usuario').value.trim(),
            contrasena: document.getElementById('est-contrasena').value,
        },
        acudiente: {
            nombre:     document.getElementById('acu-nombre').value.trim(),
            documento:  document.getElementById('acu-documento').value.trim(),
            parentesco: document.getElementById('acu-parentesco').value,
            correo:     document.getElementById('acu-correo').value.trim() || null,
            usuario:    document.getElementById('acu-usuario').value.trim(),
            contrasena: document.getElementById('acu-contrasena').value,
        }
    };

    // Validación simple: el usuario del estudiante y del acudiente no pueden ser iguales
    if (datos.estudiante.usuario === datos.acudiente.usuario) {
        alert('El usuario del estudiante y el del acudiente deben ser diferentes.');
        return;
    }

    try {
        const r = await apiFetch('/inscripciones', {
            method: 'POST',
            body: JSON.stringify(datos),
        });
        alert('¡' + r.mensaje + '\n\nYa pueden iniciar sesión con sus usuarios en los portales de Alumnos y Acudientes.');
        window.location.href = 'index.html';
    } catch (err) {
        alert('No se pudo completar el registro: ' + err.message);
    }
});
