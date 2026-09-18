// ========== VALIDACION DEL FORMULARIO DE COMANDA ==========
// Centraliza reglas visuales y de negocio previas al guardado.

// ========== VALIDACIONES EN TIEMPO REAL ==========

function formatearFechaEventoConDia(fecha) {
    if (!fecha) return '';
    try {
        const [year, month, day] = String(fecha).split('T')[0].split('-').map(Number);
        if (!year || !month || !day) return fecha;
        const date = new Date(year, month - 1, day);
        return date.toLocaleDateString('es-ES', {
            weekday: 'long',
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
        });
    } catch (error) {
        return fecha;
    }
}

window.formatearFechaEventoConDia = formatearFechaEventoConDia;

function actualizarDiaFechaEvento() {
    const input = document.getElementById('fecha_evento');
    const label = document.getElementById('fechaEventoDia');
    if (!input || !label) return;
    label.textContent = input.value ? formatearFechaEventoConDia(input.value) : '';
}

window.actualizarDiaFechaEvento = actualizarDiaFechaEvento;

function configurarSeleccionAutomaticaDeCeros() {
    if (window._seleccionAutomaticaCerosConfigurada) return;
    window._seleccionAutomaticaCerosConfigurada = true;

    const scopeSelector = [
        '#comandaCocinaForm',
        '#modalMenus',
        '#logisticaForm'
    ].join(',');

    const debeSeleccionarCero = (input) => {
        if (!input || input.type !== 'number') return false;
        if (!input.closest(scopeSelector)) return false;
        const valor = String(input.value || '').replace(',', '.').trim();
        return valor !== '' && Number(valor) === 0;
    };

    const seleccionarSiEsCero = (event) => {
        const input = event.target;
        if (!debeSeleccionarCero(input)) return;
        setTimeout(() => input.select(), 0);
    };

    document.addEventListener('focusin', seleccionarSiEsCero);
    document.addEventListener('click', seleccionarSiEsCero);
}

function configurarValidacionesEnTiempoReal() {
    // Validar empresa (mínimo 2 caracteres)
    const empresaInput = document.getElementById('empresa');
    if (empresaInput) {
        empresaInput.addEventListener('blur', validarEmpresa);
        empresaInput.addEventListener('input', function() {
            limpiarErrorCampo(this);
        });
    }
    
    // Validar responsable (mínimo 2 caracteres)
    const responsableInput = document.getElementById('responsable');
    if (responsableInput) {
        responsableInput.addEventListener('blur', validarResponsable);
        responsableInput.addEventListener('input', function() {
            limpiarErrorCampo(this);
        });
    }
    
    // Validar PAX (entre 1 y 1000)
    const paxInput = document.getElementById('pax');
    if (paxInput) {
        paxInput.addEventListener('blur', validarPax);
        paxInput.addEventListener('input', function() {
            limpiarErrorCampo(this);
            if (typeof window.recalcularCantidadesPorPax === 'function') window.recalcularCantidadesPorPax();
        });
    }
    
    // Validar fecha del evento (no puede ser anterior a hoy)
    const fechaEventoInput = document.getElementById('fecha_evento');
    if (fechaEventoInput) {
        fechaEventoInput.addEventListener('change', validarFechaEvento);
        fechaEventoInput.addEventListener('change', actualizarDiaFechaEvento);
        fechaEventoInput.addEventListener('input', actualizarDiaFechaEvento);
        actualizarDiaFechaEvento();
    }
    
    // Validar hora de salida (formato correcto)
    const horaSalidaInput = document.getElementById('hora_salida');
    if (horaSalidaInput) {
        horaSalidaInput.addEventListener('change', validarHoraSalida);
    }

    // Mostrar/ocultar sección logística inline según categoría
    const categoriaSelect = document.getElementById('categoria');
    if (categoriaSelect) {
        categoriaSelect.addEventListener('change', function() {
            toggleLogisticaInline(parseInt(this.value));
        });
    }

    configurarIntolerancias();
}

/**
 * Gestiona el material al cambiar categoría.
 * logisticaInlineSection siempre visible.
 * Solo se limpia el material para Servicios (3) que usa flujo separado.
 */
function toggleLogisticaInline(categoriaId) {
    // Limpiar zumos de desayuno al cambiar a otra categoría
    if (categoriaId !== 1 && window.materialLogistica?.bebidas) {
        window.materialLogistica.bebidas = window.materialLogistica.bebidas.filter(i => !i._zumoId);
    }

    const matContainer = document.getElementById('materialLogisticaInline');

    if (categoriaId === 3) {
        // Servicios: ocultar solo el material, la sección de datos siempre visible
        if (matContainer) matContainer.style.display = 'none';
        if (typeof window.limpiarMaterialLogistica === 'function') {
            window.limpiarMaterialLogistica();
        }
    }
    // Para el resto: el material lo mostrará comanda-form.js al seleccionar menú
}

/**
 * Limpia los campos de la sección logística inline
 */
function limpiarCamposLogisticaInline() {
    const ids = [
        'log_inline_hora_entrega', 'log_inline_hora_evento',
        'log_inline_fecha_recogida', 'log_inline_hora_recogida',
        'log_inline_nombre_contacto', 'log_inline_telefono_contacto',
        'log_inline_montaje', 'log_inline_duracion_evento', 'log_inline_cantidad_camareros',
        'log_inline_calle', 'log_inline_numero', 'log_inline_codigo_postal', 'log_inline_notas'
    ];
    ids.forEach(id => {
        const el = document.getElementById(id);
        if (el) { el.value = ''; el.style.borderColor = '#cbd5e1'; }
        const err = document.getElementById(id + '_err');
        if (err) err.textContent = '';
    });
}

function minutosHoraLogistica(valor) {
    if (!valor || !/^\d{2}:\d{2}$/.test(valor)) return null;
    const [horas, minutos] = valor.split(':').map(Number);
    return (horas * 60) + minutos;
}

function componerDireccionLogistica(calle, numero) {
    return [calle, numero].map(v => (v || '').trim()).filter(Boolean).join(', ');
}

window.componerDireccionLogistica = componerDireccionLogistica;

function separarDireccionLogistica(direccion) {
    const limpia = (direccion || '').trim();
    if (!limpia) return { calle: '', numero: '' };

    const partes = limpia.split(',').map(p => p.trim()).filter(Boolean);
    if (partes.length >= 2) {
        return {
            calle: partes.shift(),
            numero: partes.join(', ')
        };
    }

    const match = limpia.match(/^(.*?\D)\s+(\d+\s?.*)$/);
    if (match) {
        return {
            calle: match[1].trim(),
            numero: match[2].trim()
        };
    }

    return { calle: limpia, numero: '' };
}

window.separarDireccionLogistica = separarDireccionLogistica;

function validarHorariosLogistica(prefix, horaSalidaValor) {
    const entrega = document.getElementById(`${prefix}_hora_entrega`);
    const evento = document.getElementById(`${prefix}_hora_evento`);
    const salidaMin = minutosHoraLogistica(horaSalidaValor);
    const entregaMin = minutosHoraLogistica(entrega?.value || '');
    const eventoMin = minutosHoraLogistica(evento?.value || '');
    let valido = true;

    if (entrega && salidaMin !== null && entregaMin !== null && entregaMin < salidaMin) {
        entrega.style.borderColor = '#dc2626';
        const err = document.getElementById(`${prefix}_hora_entrega_err`);
        if (err) err.textContent = 'La hora de entrega no puede ser inferior a la hora de salida';
        valido = false;
    }

    if (evento && eventoMin !== null) {
        const menorQueSalida = salidaMin !== null && eventoMin < salidaMin;
        const menorQueEntrega = entregaMin !== null && eventoMin < entregaMin;
        if (menorQueSalida || menorQueEntrega) {
            evento.style.borderColor = '#dc2626';
            const err = document.getElementById(`${prefix}_hora_evento_err`);
            if (err) err.textContent = 'La hora del evento no puede ser menor que salida o entrega';
            valido = false;
        }
    }

    return valido;
}

/**
 * Valida los campos de logística inline (solo si la sección está visible)
 */
function validarRecogidaOpcionalLogistica(prefix) {
    const fecha = document.getElementById(`${prefix}_fecha_recogida`);
    const hora = document.getElementById(`${prefix}_hora_recogida`);
    if (!fecha || !hora) return true;

    const fechaErr = document.getElementById(`${prefix}_fecha_recogida_err`);
    const horaErr = document.getElementById(`${prefix}_hora_recogida_err`);
    const fechaValue = fecha.value.trim();
    const horaValue = hora.value.trim();
    const valido = (!fechaValue && !horaValue) || (fechaValue && horaValue);

    fecha.style.borderColor = valido ? '#cbd5e1' : '#dc2626';
    hora.style.borderColor = valido ? '#cbd5e1' : '#dc2626';
    if (fechaErr) fechaErr.textContent = !valido && !fechaValue ? 'Fecha requerida' : '';
    if (horaErr) horaErr.textContent = !valido && !horaValue ? 'Hora requerida' : '';
    return valido;
}

function validarLogisticaInline() {
    const categoriaId = parseInt(document.getElementById('categoria')?.value || 0);
    const menusAcumulados = typeof window.obtenerMenusAcumulados === 'function'
        ? window.obtenerMenusAcumulados()
        : [];
    const required = window.CaterCloudLogisticsDelivery?.requiresInlineDelivery({
        categoriaId,
        catPrincipal: window.menuSeleccionado?._cat || window.menuSeleccionado?.categoriaId || categoriaId,
        menuPrincipal: window.menuSeleccionado,
        menusAcumulados,
        serviciosMode: window.serviciosMode
    });

    if (required) {
        const seccion = document.getElementById('logisticaInlineSection');
        const notas = document.getElementById('logisticaInlineNotasSection');
        if (seccion) seccion.style.display = '';
        if (notas) notas.style.display = '';
    }

    return window.CaterCloudLogisticsDelivery?.validateDom('log_inline', {
        required,
        horaSalida: document.getElementById('hora_salida')?.value || ''
    }) ?? true;
}

/**
 * Recoge los datos de logística inline del formulario
 */
function obtenerDatosLogisticaInline() {
    const categoriaId = parseInt(document.getElementById('categoria')?.value || 0);
    const menusAcumulados = typeof window.obtenerMenusAcumulados === 'function'
        ? window.obtenerMenusAcumulados()
        : [];
    const required = window.CaterCloudLogisticsDelivery?.requiresInlineDelivery({
        categoriaId,
        catPrincipal: window.menuSeleccionado?._cat || window.menuSeleccionado?.categoriaId || categoriaId,
        menuPrincipal: window.menuSeleccionado,
        menusAcumulados,
        serviciosMode: window.serviciosMode
    });
    const data = window.CaterCloudLogisticsDelivery?.readFromDom('log_inline') || {};
    if (!required && !window.CaterCloudLogisticsDelivery?.hasAnyDeliveryData(data)) return null;
    return data;
}


// ========== FUNCIONES DE VALIDACIÓN INDIVIDUALES ==========

// ========== FUNCIONES DE VALIDACION INDIVIDUALES ==========

function validarEmpresa() {
    const input = document.getElementById('empresa');
    if (!input) return true;
    
    const value = input.value.trim();
    
    if (value.length < 2) {
        mostrarErrorCampo(input, 'El nombre de la empresa debe tener al menos 2 caracteres');
        return false;
    }
    
    if (!/^[a-zA-Z0-9áéíóúÁÉÍÓÚñÑ\s\-&.,]+$/.test(value)) {
        mostrarErrorCampo(input, 'Solo se permiten letras, números y espacios');
        return false;
    }
    
    limpiarErrorCampo(input);
    return true;
}

function validarResponsable() {
    const input = document.getElementById('responsable');
    if (!input) return true;
    
    const value = input.value.trim();
    
    if (value.length < 2) {
        mostrarErrorCampo(input, 'El nombre del responsable debe tener al menos 2 caracteres');
        return false;
    }
    
    limpiarErrorCampo(input);
    return true;
}

function validarPax() {
    const input = document.getElementById('pax');
    if (!input) return true;
    
    const value = parseInt(input.value);
    
    if (isNaN(value) || value < 1) {
        mostrarErrorCampo(input, 'El número de PAX debe ser mayor a 0');
        return false;
    }
    
    if (value > 1000) {
        mostrarErrorCampo(input, 'El número de PAX no puede exceder 1000');
        return false;
    }
    
    limpiarErrorCampo(input);
    return true;
}

function validarFechaEvento() {
    const input = document.getElementById('fecha_evento');
    if (!input) return true;
    
    const value = new Date(input.value);
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);
    
    if (!input.value) {
        mostrarErrorCampo(input, 'Selecciona una fecha para el evento');
        return false;
    }
    
    if (value < hoy) {
        mostrarErrorCampo(input, 'La fecha del evento no puede ser anterior a hoy');
        return false;
    }
    
    // No permitir fechas más allá de 1 año
    const maxFecha = new Date();
    maxFecha.setFullYear(maxFecha.getFullYear() + 1);
    
    if (value > maxFecha) {
        mostrarErrorCampo(input, 'La fecha no puede ser mayor a un año desde hoy');
        return false;
    }
    
    limpiarErrorCampo(input);
    return true;
}

function validarHoraSalida() {
    const input = document.getElementById('hora_salida');
    if (!input) return true;
    
    if (!input.value) {
        mostrarErrorCampo(input, 'Selecciona una hora de salida');
        return false;
    }
    
    const hora = parseInt(input.value.split(':')[0]);
    if (hora < 5 || hora > 23) {
        mostrarErrorCampo(input, 'La hora de salida debe estar entre las 5:00 y 23:00');
        return false;
    }
    
    limpiarErrorCampo(input);
    return true;
}

// ========== VALIDACIÓN COMPLETA DEL FORMULARIO ==========

function validarFormularioCompleto() {
    const validacionesIndividuales = [
        validarEmpresa(),
        validarResponsable(),
        // PAX se gestiona por menú individual — no se valida globalmente
        validarFechaEvento(),
        validarHoraSalida()
    ];
    
    const todasValidas = validacionesIndividuales.every(v => v === true);
    
    // Verificar que hay al menos un menú acumulado
    const menusAcumulados = typeof window.obtenerMenusAcumulados === 'function'
        ? window.obtenerMenusAcumulados() : [];

    if (menusAcumulados.length === 0) {
        mostrarMensaje('❌ Por favor, añade al menos un menú a la comanda', 'error');
        const menusContainer = document.getElementById('menusContainer');
        if (menusContainer) {
            menusContainer.style.border = '2px solid #dc2626';
            menusContainer.style.borderRadius = '8px';
            menusContainer.style.padding = '10px';
            setTimeout(() => {
                menusContainer.style.border = '';
                menusContainer.style.padding = '';
            }, 3000);
        }
        return false;
    }
    
    if (!todasValidas) {
        mostrarMensaje('❌ Por favor, corrige los errores en el formulario', 'error');
        return false;
    }

    // Validar logística inline si está visible
    if (!validarLogisticaInline()) {
        mostrarMensaje('❌ Por favor, completa los datos de logística', 'error');
        return false;
    }
    
    return true;
}

// ========== FUNCIONES AUXILIARES PARA MOSTRAR ERRORES ==========

function mostrarErrorCampo(input, mensaje) {
    // Estilizar el input con error
    input.style.borderColor = '#dc2626';
    input.style.backgroundColor = '#fef2f2';
    
    // Crear o actualizar mensaje de error
    let errorElement = input.nextElementSibling;
    if (!errorElement || !errorElement.classList.contains('error-message')) {
        errorElement = document.createElement('div');
        errorElement.className = 'error-message';
        errorElement.style.cssText = `
            color: #dc2626;
            font-size: 0.8rem;
            margin-top: 4px;
            margin-bottom: 8px;
        `;
        input.parentNode.insertBefore(errorElement, input.nextSibling);
    }
    
    errorElement.textContent = mensaje;
    errorElement.style.display = 'block';
}

function limpiarErrorCampo(input) {
    // Restaurar estilos del input
    input.style.borderColor = '#cbd5e1';
    input.style.backgroundColor = '';
    
    // Ocultar mensaje de error si existe
    const errorElement = input.nextElementSibling;
    if (errorElement && errorElement.classList.contains('error-message')) {
        errorElement.style.display = 'none';
    }
}
