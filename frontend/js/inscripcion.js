    let pasoActual = 1;
    const totalPasos = 5;

    function irPaso(n) {
        document.getElementById('paso-' + pasoActual).classList.remove('active');
        document.getElementById('step-ind-' + pasoActual).classList.remove('active');
        document.getElementById('step-ind-' + pasoActual).classList.add('done');

        pasoActual = n;

        document.getElementById('paso-' + pasoActual).classList.add('active');
        document.getElementById('step-ind-' + pasoActual).classList.add('active');
        document.getElementById('step-ind-' + pasoActual).classList.remove('done');

        // Marcar anteriores como done
        for (let i = 1; i < n; i++) {
            document.getElementById('step-ind-' + i).classList.add('done');
            document.getElementById('step-ind-' + i).classList.remove('active');
        }
        // Limpiar siguientes
        for (let i = n + 1; i <= totalPasos; i++) {
            document.getElementById('step-ind-' + i).classList.remove('done', 'active');
        }

        window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    function mostrarNombre(input, id) {
        const el = document.getElementById(id);
        el.textContent = input.files[0] ? '✓ ' + input.files[0].name : '';
    }

    function enviarFormulario() {
        const terminos = document.getElementById('terminos').checked;
        if (!terminos) {
            alert('Debe aceptar la política de tratamiento de datos para continuar.');
            return;
        }
        // Ocultar todos los pasos
        for (let i = 1; i <= totalPasos; i++) {
            const sec = document.getElementById('paso-' + i);
            if (sec) sec.classList.remove('active');
        }
        // Marcar todos como done
        for (let i = 1; i <= totalPasos; i++) {
            document.getElementById('step-ind-' + i).classList.add('done');
            document.getElementById('step-ind-' + i).classList.remove('active');
        }
        document.getElementById('exito').classList.add('active');
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    // Mostrar/ocultar detalle ruta
    document.querySelectorAll('input[name="ruta"]').forEach(r => {
        r.addEventListener('change', function() {
            document.getElementById('ruta-detalle').style.display =
                this.value === 'si' ? 'block' : 'none';
        });
    });