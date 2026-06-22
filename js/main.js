// ========== CONFIGURACIÓN INICIAL ==========

// Variable global para comanda en edición
window.comandaEditando = null;

// Inicialización cuando se carga el documento
document.addEventListener('DOMContentLoaded', function() {
    
    // Cargar calendario
    if (typeof cargarCalendario === 'function') {
        cargarCalendario();
    }
    
    // Cargar eventos de ejemplo
    if (typeof cargarEventosEjemplo === 'function') {
        cargarEventosEjemplo();
    }
    
    // Configurar fecha mínima para el formulario
    const hoy = new Date().toISOString().split('T')[0];
    const fechaEventoInput = document.getElementById('fecha_evento');
    if (fechaEventoInput) {
        fechaEventoInput.min = hoy;
    }
    
    // Configurar multiplicadores
    const multiplicadorSaladas = document.getElementById('multiplicadorSaladas');
    const multiplicadorPostres = document.getElementById('multiplicadorPostres');
    
    if (multiplicadorSaladas) {
        multiplicadorSaladas.addEventListener('input', function() {
            if (typeof actualizarMultiplicador === 'function') {
                actualizarMultiplicador('saladas', this.value);
            }
        });
    }
    
    if (multiplicadorPostres) {
        multiplicadorPostres.addEventListener('input', function() {
            if (typeof actualizarMultiplicador === 'function') {
                actualizarMultiplicador('postres', this.value);
            }
        });
    }
    
    // Inicializar contador si no existe
    if (typeof inicializarContador === 'function') {
        inicializarContador();
    }
    
    // Configurar el envío del formulario
    const formulario = document.getElementById('comandaCocinaForm');
    if (formulario) {
        formulario.addEventListener('submit', manejarEnvioFormulario);
    }
    
    // Configurar validaciones en tiempo real
    configurarValidacionesEnTiempoReal();
    
    // Inicializar preferencias de usuario
    if (typeof inicializarPreferencias === 'function') {
        inicializarPreferencias();
    }
    
    console.log('✅ CaterCloud inicializado correctamente');
});

// ========== VALIDACIONES EN TIEMPO REAL ==========

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
            if (typeof actualizarCantidades === 'function') {
                actualizarCantidades();
            }
            if (typeof window.actualizarCantidadesMaterialIncluido === 'function') {
                window.actualizarCantidadesMaterialIncluido('materialLogisticaInline');
            }
        });
    }
    
    // Validar fecha del evento (no puede ser anterior a hoy)
    const fechaEventoInput = document.getElementById('fecha_evento');
    if (fechaEventoInput) {
        fechaEventoInput.addEventListener('change', validarFechaEvento);
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
        'log_inline_nombre_contacto', 'log_inline_telefono_contacto',
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
function validarLogisticaInline() {
    const seccion = document.getElementById('logisticaInlineSection');
    if (!seccion || seccion.style.display === 'none') return true;

    let valido = true;
    const requeridos = [
        { id: 'log_inline_hora_entrega',      label: 'Hora de entrega' },
        { id: 'log_inline_hora_evento',        label: 'Hora del evento' },
        { id: 'log_inline_nombre_contacto',    label: 'Nombre de contacto' },
        { id: 'log_inline_telefono_contacto',  label: 'Teléfono de contacto' },
        { id: 'log_inline_calle',              label: 'Calle' },
        { id: 'log_inline_numero',             label: 'Número / portal' },
        { id: 'log_inline_codigo_postal',      label: 'Código postal' }
    ];

    requeridos.forEach(({ id, label }) => {
        const input = document.getElementById(id);
        const errEl = document.getElementById(id + '_err');
        if (!input) return;
        if (!input.value.trim()) {
            input.style.borderColor = '#dc2626';
            if (errEl) errEl.textContent = `${label} es obligatorio`;
            valido = false;
        } else {
            input.style.borderColor = '#cbd5e1';
            if (errEl) errEl.textContent = '';
        }
    });

    // Validar formato teléfono
    const tel = document.getElementById('log_inline_telefono_contacto');
    if (tel && tel.value.trim() && !/^[0-9\s\+\-]{6,20}$/.test(tel.value.trim())) {
        tel.style.borderColor = '#dc2626';
        const errEl = document.getElementById('log_inline_telefono_contacto_err');
        if (errEl) errEl.textContent = 'Formato de teléfono no válido';
        valido = false;
    }

    if (!validarHorariosLogistica('log_inline', document.getElementById('hora_salida')?.value || '')) {
        valido = false;
    }

    return valido;
}

/**
 * Recoge los datos de logística inline del formulario
 */
function obtenerDatosLogisticaInline() {
    const seccion = document.getElementById('logisticaInlineSection');
    if (!seccion || seccion.style.display === 'none') return null;
    const calle = document.getElementById('log_inline_calle')?.value.trim() || '';
    const numero = document.getElementById('log_inline_numero')?.value.trim() || '';
    return {
        hora_entrega:      document.getElementById('log_inline_hora_entrega')?.value || '',
        hora_evento:       document.getElementById('log_inline_hora_evento')?.value || '',
        nombre_contacto:   document.getElementById('log_inline_nombre_contacto')?.value.trim() || '',
        telefono_contacto: document.getElementById('log_inline_telefono_contacto')?.value.trim() || '',
        calle,
        numero,
        direccion:         componerDireccionLogistica(calle, numero),
        codigo_postal:     document.getElementById('log_inline_codigo_postal')?.value.trim() || '',
        notas_logistica:   document.getElementById('log_inline_notas')?.value.trim() || ''
    };
}


// ========== FUNCIONES DE VALIDACIÓN INDIVIDUALES ==========

const INTOLERANCIAS_CONFIG = [
    { id: 'int_gluten', qty: 'int_gluten_pax', nombre: 'Sin gluten' },
    { id: 'int_lactosa', qty: 'int_lactosa_pax', nombre: 'Sin lactosa' },
    { id: 'int_frutos_secos', qty: 'int_frutos_secos_pax', nombre: 'Sin frutos secos' },
    { id: 'int_huevo', qty: 'int_huevo_pax', nombre: 'Sin huevo' },
    { id: 'int_marisco', qty: 'int_marisco_pax', nombre: 'Sin marisco' },
    { id: 'int_vegetariano', qty: 'int_vegetariano_pax', nombre: 'Vegetariano' },
    { id: 'int_vegano', qty: 'int_vegano_pax', nombre: 'Vegano' },
    { id: 'int_otro', qty: 'int_otro_pax', nombre: 'Otro' }
];

function configurarIntolerancias() {
    INTOLERANCIAS_CONFIG.forEach(({ id, qty }) => {
        const check = document.getElementById(id);
        const cantidad = document.getElementById(qty);
        if (!check || !cantidad) return;

        check.addEventListener('change', () => {
            if (!check.checked) cantidad.value = '';
            if (check.checked && !cantidad.value) cantidad.value = '1';
        });

        cantidad.addEventListener('input', () => {
            const valor = Number(cantidad.value || 0);
            check.checked = valor > 0 || check.checked;
            if (valor <= 0 && cantidad.value !== '') check.checked = false;
        });
    });
}

function obtenerDatosIntolerancias() {
    const items = INTOLERANCIAS_CONFIG.map(({ id, qty, nombre }) => {
        const check = document.getElementById(id);
        const cantidad = document.getElementById(qty);
        const pax = Number(cantidad?.value || 0);
        const activo = !!check?.checked || pax > 0;
        if (!activo) return null;

        return {
            nombre,
            pax: pax > 0 ? pax : null
        };
    }).filter(Boolean);

    const notas = document.getElementById('intolerancias_notas')?.value.trim() || '';
    return {
        items,
        notas
    };
}

function rellenarIntolerancias(datos = {}) {
    const items = Array.isArray(datos.items) ? datos.items : [];
    INTOLERANCIAS_CONFIG.forEach(({ id, qty, nombre }) => {
        const check = document.getElementById(id);
        const cantidad = document.getElementById(qty);
        const item = items.find(i => i.nombre === nombre);
        if (check) check.checked = !!item;
        if (cantidad) cantidad.value = item?.pax || '';
    });

    const notas = document.getElementById('intolerancias_notas');
    if (notas) notas.value = datos.notas || '';
}

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

// ========== MANEJO DEL ENVÍO DEL FORMULARIO ==========

/**
 * Maneja el envío del formulario de comanda
 * MODIFICADO: Incluye referencias de desayuno
 */
async function manejarEnvioFormulario(e) {
    e.preventDefault();

    if (window.AppPermissions && !AppPermissions.requireWrite('Tu usuario solo puede consultar. No puede guardar comandas.')) {
        return;
    }
    
    // Obtener el botón de submit con verificación
    // Botón puede estar dentro del form o en el panel lateral del resumen
    const submitBtn = e.target.querySelector('button[type="submit"]')
                   || document.querySelector('.btn-guardar-comanda')
                   || document.getElementById('btnGuardarComanda');
    if (!submitBtn) {
        mostrarMensaje('❌ Error: No se encontró el botón de envío', 'error');
        return;
    }
    
    const originalText = submitBtn.innerHTML;
    
    // Validaciones completas del formulario
    if (!validarFormularioCompleto()) {
        submitBtn.innerHTML = originalText;
        return;
    }
    
    const categoriaId = parseInt(document.getElementById('categoria').value);
    const menusParaValidar = typeof window.obtenerMenusAcumulados === 'function'
        ? window.obtenerMenusAcumulados() : [];
    const hayMenusAgregados = menusParaValidar.length > 0;
    const editandoConMenusGuardados = !!window.comandaEditando && hayMenusAgregados;
    
    // Validaciones específicas por categoría
    if (!hayMenusAgregados && !editandoConMenusGuardados && (categoriaId == 2 || categoriaId == 3) && window.menuSeleccionado) { // FOODBOX/COMIDA o SERVICIOS
        const seleccionadasSaladas = [
            ...(window.referenciasSeleccionadas?.saladas || []),
            ...(window.referenciasSeleccionadas?.gris || []),
            ...(window.referenciasSeleccionadas?.rojo || [])
        ].length;
        
        if (seleccionadasSaladas < window.menuSeleccionado.items_salados_min) {
            mostrarMensaje(`❌ Debes seleccionar al menos ${window.menuSeleccionado.items_salados_min} referencias saladas`, 'error');
            submitBtn.innerHTML = originalText;
            return;
        }
    }
    
// Validación para Foodbox Lunch (MEJORADA)
if (!hayMenusAgregados && !editandoConMenusGuardados && categoriaId == 4) { // FOODBOX LUNCH
    // Usar la nueva función de validación mejorada
    if (typeof validarFoodboxLunchMejorado === 'function') {
        if (!validarFoodboxLunchMejorado()) {
            mostrarMensaje('❌ Por favor, corrige la distribución del Foodbox Lunch', 'error');
            submitBtn.innerHTML = originalText;
            submitBtn.disabled = false;
            return;
        }
    }
}    
    // Deshabilitar botón y mostrar loader
    submitBtn.innerHTML = '<div class="loader"></div>';
    submitBtn.disabled = true;
    
    // ── Recoger menús acumulados ──────────────────────────────────────────────
    const _menusAcumulados = typeof window.obtenerMenusAcumulados === 'function'
        ? window.obtenerMenusAcumulados() : [];

    if (window.comandaEditando && window.referenciasDesayuno && _menusAcumulados.length) {
        const _categoriaActual = Number(window.menuSeleccionado?._cat || window.menuSeleccionado?.categoriaId || document.getElementById('categoria')?.value || 0);
        if (_categoriaActual === 1) {
            const _menuIdActual = document.getElementById('menu_id')?.value || window.menuSeleccionado?.id || '';
            const _idxDesayuno = _menusAcumulados.findIndex(menu =>
                Number(menu.categoriaId || menu._cat || 0) === 1 &&
                (!_menuIdActual || String(menu.id || '') === String(_menuIdActual))
            );
            const _idx = _idxDesayuno >= 0
                ? _idxDesayuno
                : _menusAcumulados.findIndex(menu => Number(menu.categoriaId || menu._cat || 0) === 1);
            if (_idx >= 0) {
                const _clone = (value) => {
                    try { return JSON.parse(JSON.stringify(value || null)); }
                    catch (error) { return value; }
                };
                _menusAcumulados[_idx] = {
                    ..._menusAcumulados[_idx],
                    referencias_desayuno: _clone(window.referenciasDesayuno),
                    pax: parseInt(document.getElementById('pax')?.value) || _menusAcumulados[_idx].pax || 0,
                    tipo_menaje: document.getElementById('tipo_menaje')?.value || _menusAcumulados[_idx].tipo_menaje || null
                };
            }
        }
    }

    const _menuPrincipalBase = _menusAcumulados[0] || { id: document.getElementById('menu_id').value, ...window.menuSeleccionado };
    const _menuPrincipal  = {
        ..._menuPrincipalBase,
        pax: _menuPrincipalBase.pax || parseInt(document.getElementById('pax')?.value) || 0
    };
    const _menusAdicionales = _menusAcumulados.slice(1);
    const _catPrincipal   = _menuPrincipal.categoriaId || categoriaId;
    const _paxTotal       = _menusAcumulados.reduce((s, m) => s + (m.pax || 0), 0)
                            || parseInt(document.getElementById('pax').value) || 0;

    // ── Preparar datos de la comanda ─────────────────────────────────────────
    const usuarioActualNombre = typeof obtenerNombreUsuarioActual === 'function'
        ? obtenerNombreUsuarioActual()
        : (window.currentUser?.email || '');
    const responsableFormulario = document.getElementById('responsable').value || usuarioActualNombre;

    const comandaData = {
        empresa:      document.getElementById('empresa').value,
        responsable:  responsableFormulario,
        creado_por_nombre: usuarioActualNombre,
        creado_por_email: window.currentUser?.email || '',
        creado_por_id: window.currentUser?.id || null,
        pax:          _paxTotal,
        hora_salida:  document.getElementById('hora_salida').value,
        fecha_evento: document.getElementById('fecha_evento').value,
        menu_principal:    _menuPrincipal,
        menus_adicionales: _menusAdicionales,

        // Referencias según categoría del menú principal
        ...(_catPrincipal == 1 && (_menuPrincipal.referencias_desayuno || window.referenciasDesayuno) ? {
            referencias_desayuno: _menuPrincipal.referencias_desayuno || window.referenciasDesayuno
        } : {}),

        ...(_catPrincipal == 4 && (_menuPrincipal.foodbox_lunch || typeof obtenerDatosFoodboxLunch === 'function') ? {
            foodbox_lunch: _menuPrincipal.foodbox_lunch || obtenerDatosFoodboxLunch()
        } : {}),

        ...([2, 3].includes(_catPrincipal) ? {
            multiplicadores: _menuPrincipal.multiplicadores || window.multiplicadores || { saladas: 1, postres: 1 },
            referencias:     _menuPrincipal.referencias     || {
                saladas: [
                    ...(window.referenciasSeleccionadas?.gris  || []),
                    ...(window.referenciasSeleccionadas?.rojo  || [])
                ],
                postres: window.referenciasSeleccionadas?.postres || []
            }
        } : { multiplicadores: null, referencias: null }),

        // DIY Desayunos (cat 5)
        ...(_catPrincipal == 5 ? {
            bandejas: _menuPrincipal.bandejas || (typeof window.obtenerSeleccionesDIY === 'function'
                ? window.obtenerSeleccionesDIY(5)
                : {
                    termos:   [...(window.BandejasState?.diy_termos?.selected   || [])],
                    servicio: [...(window.BandejasState?.diy_servicio?.selected || [])],
                    dulces:   [...(window.BandejasState?.diy_dulces?.selected   || [])],
                    salados:  [...(window.BandejasState?.diy_salados?.selected  || [])],
                })
        } : {}),

        // DIY Foodbox (cat 6)
        ...(_catPrincipal == 6 ? {
            bandejas: _menuPrincipal.bandejas || (typeof window.obtenerSeleccionesDIY === 'function'
                ? window.obtenerSeleccionesDIY(6)
                : {
                    saladas:    [...(window.BandejasState?.diy_fb_saladas?.selected    || [])],
                    sandwiches: [...(window.BandejasState?.diy_fb_sandwiches?.selected || [])],
                    postres:    [...(window.BandejasState?.diy_fb_postres?.selected    || [])],
                })
        } : {}),

        // Notas e intolerancias de cocina
        ...(document.getElementById('alergias_notas') ? {
            alergias: {
                notas: document.getElementById('alergias_notas').value,
                intolerancias: obtenerDatosIntolerancias()
            }
        } : {}),

        tipo_menaje: document.getElementById('tipo_menaje')?.value || null,
        logistica:   obtenerDatosLogisticaInline(),

        // Material acumulado de todos los menús
        material_logistica: window._materialAcumulado && (
            window._materialAcumulado.bebidas?.length ||
            window._materialAcumulado.menaje?.length  ||
            window._materialAcumulado.extras?.length
        )   ? window._materialAcumulado
            : (typeof obtenerMaterialSeleccionado === 'function' ? obtenerMaterialSeleccionado() : null),

        fecha_creacion: new Date().toISOString(),
        estado: 'creada',
        version: '1.0'
    };
    comandaData.logistica_inline = comandaData.logistica;
    
    try {
        let codigo;
        
        if (window.comandaEditando) {
            const codigoEditando = window.comandaEditando.codigo;
            comandaData.fecha_creacion = window.comandaEditando.fecha_creacion || comandaData.fecha_creacion;
            comandaData.creado_por_id = window.comandaEditando.creado_por_id || comandaData.creado_por_id;
            comandaData.creado_por_nombre = window.comandaEditando.creado_por_nombre || comandaData.creado_por_nombre;
            comandaData.creado_por_email = window.comandaEditando.creado_por_email || comandaData.creado_por_email;
            comandaData.adjuntos = window.comandaEditando.adjuntos || comandaData.adjuntos || [];
            comandaData.documentos = window.comandaEditando.documentos || comandaData.documentos || {};
            comandaData.codigo = codigoEditando;

            // Actualizar comanda existente
            const resultado = await actualizarComandaEnHistorial(codigoEditando, comandaData);
            
            if (resultado) {
                mostrarMensaje(`✅ Comanda ${window.comandaEditando.codigo} actualizada exitosamente`, 'success');
                
                if (typeof agregarAlCalendario === 'function') {
                    agregarAlCalendario(comandaData);
                }
                
                // Volver al dashboard después de actualizar
                setTimeout(() => {
                    const form = document.getElementById('comandaForm');
                    const dashboard = document.getElementById('dashboard');
                    const detalle = document.getElementById('detalleComanda');
                    const historial = document.getElementById('historialPage');
                    const expediente = document.getElementById('expedientePedido');

                    if (form) form.style.display = 'none';
                    if (dashboard) dashboard.style.display = 'none';
                    if (historial) historial.style.display = 'none';
                    if (expediente) expediente.style.display = 'none';
                    if (detalle) detalle.style.display = 'block';

                    if (typeof _renderDetalleComanda === 'function') {
                        _renderDetalleComanda(comandaData);
                    }

                    window.comandaEditando = null;
                    if (typeof limpiarFormularioComanda === 'function') {
                        limpiarFormularioComanda();
                    }
                }, 500);
                
            } else {
                mostrarMensaje('❌ Error al actualizar la comanda', 'error');
            }
            
        } else {
// Leer material del DOM ANTES de guardar para incluirlo en el payload
// ── Capturar TODO el material del DOM en el momento del guardado ────────────
// Función universal: lee cualquier label.dc-material-item del selector dado
function _leerLabels(selector) {
    const items = [];
    document.querySelectorAll(selector).forEach(label => {
        const chk = label.querySelector('input[type="checkbox"]');
        if (!chk || !chk.checked) return;
        const nombreEl = label.querySelector('.dc-material-nombre');
        const cantEl   = label.querySelector('input[type="number"]');
        const undEl    = label.querySelector('.dc-material-unidad');
        const nombre   = (nombreEl?.firstChild?.textContent || nombreEl?.textContent || '').trim();
        if (!nombre) return;
        const cant = Number(cantEl?.value ?? 0);
        // Solo omitir si HAY input de cantidad y es 0
        if (cantEl && cant === 0) return;
        items.push({ nombre, cantidad: cant, unidad: (undEl?.textContent || 'uds').trim(), checked: true, subitems_selected: [] });
    });
    return items;
}

// Para extras expandibles: lee el wrapper y sus subitems
function _leerExtrasExpandibles(atributo) {
    const items = [];
    document.querySelectorAll('[' + atributo + ']').forEach(wrap => {
        const label = wrap.matches('label.dc-material-item') ? wrap : wrap.querySelector('label.dc-material-item');
        if (!label) return;
        const chk = label.querySelector('input[type="checkbox"]');
        if (!chk?.checked) return;
        const nombreEl = label.querySelector('.dc-material-nombre');
        const cantEl   = label.querySelector('input[type="number"]');
        const undEl    = label.querySelector('.dc-material-unidad');
        const nombre   = (nombreEl?.firstChild?.textContent || nombreEl?.textContent || '').trim();
        if (!nombre) return;
        const cant = Number(cantEl?.value ?? 0);
        if (cantEl && cant === 0) return;
        const subitems = [];
        wrap.querySelectorAll('.dc-material-subitem').forEach(sub => {
            const sChk = sub.querySelector('input[type="checkbox"]');
            if (!sChk?.checked) return;
            const sNom = sub.querySelector('.dc-material-nombre')?.textContent?.trim() || '';
            const sCnt = Number(sub.querySelector('input[type="number"]')?.value ?? 0);
            const sUnd = sub.querySelector('.dc-material-unidad')?.textContent?.trim() || 'uds';
            if (sNom) subitems.push({ nombre: sNom, cantidad: sCnt, unidad: sUnd });
        });
        items.push({ nombre, cantidad: cant, unidad: (undEl?.textContent || 'uds').trim(), checked: true, subitems_selected: subitems });
    });
    return items;
}

// ── Capturar todo el material en el momento del guardado ────────────────────
// Lee TODOS los labels del contenedor de un tipo dado (bebidas/menaje/extras)
// excluyendo los que tienen atributos de inyectados (se leen por separado)
function _leerContainerTipo(tipo, excluirAtributos) {
    const cont = document.getElementById('materialLogisticaInline_' + tipo);
    if (!cont) return [];
    const paxDefault = parseInt(document.getElementById('pax')?.value || window.pax || 0);
    const items = [];
    cont.querySelectorAll('label.dc-material-item').forEach(label => {
        for (const attr of excluirAtributos) {
            if (label.hasAttribute(attr)) return;
        }
        const chk = label.querySelector('input[type="checkbox"]');
        if (!chk || !chk.checked) return;
        const nom    = label.querySelector('.dc-material-nombre');
        const cantEl = label.querySelector('.dc-material-cantidad, input[type="number"]');
        const undEl  = label.querySelector('.dc-material-unidad');
        const nombre = (nom?.firstChild?.textContent || nom?.textContent || '').trim();
        if (!nombre) return;
        const cantRaw = cantEl ? Number(cantEl.value) : 0;
        // Menaje: si cantidad 0, usar PAX como fallback
        // Bebidas/extras: si cantidad 0, excluir (el usuario debe indicar cantidad)
        if (tipo === 'menaje') {
            const cant = cantRaw > 0 ? cantRaw : paxDefault;
            items.push({ nombre, cantidad: cant, unidad: (undEl?.textContent || 'uds').trim(), checked: true, subitems_selected: [] });
        } else {
            if (cantRaw <= 0) return; // bebidas/extras sin cantidad no se incluyen
            items.push({ nombre, cantidad: cantRaw, unidad: (undEl?.textContent || 'uds').trim(), checked: true, subitems_selected: [] });
        }
    });
    return items;
}

// ── Leer material SOLO del DOM (fuente de verdad es lo que el usuario ve/marca) ──
// Bebidas y extras: solo los marcados con checkbox
// Menaje: los marcados (el usuario puede desmarcar los pre-chequeados)
const _domBebidas = _leerContainerTipo('bebidas', []);
const _domMenaje  = _leerContainerTipo('menaje',  []);
const _domExtras  = _leerContainerTipo('extras',  []);

// Usar el material acumulado de todos los menús añadidos
// (capturado por anadirMenuAComanda en window._materialAcumulado)
const _materialCompleto = (
    window._materialAcumulado &&
    (window._materialAcumulado.bebidas?.length ||
     window._materialAcumulado.menaje?.length  ||
     window._materialAcumulado.extras?.length)
)   ? window._materialAcumulado
    : (typeof obtenerMaterialSeleccionado === 'function' ? obtenerMaterialSeleccionado() : { bebidas: [], menaje: [], extras: [] });
const _materialNormalizado = typeof window.normalizarMaterialLogistica === 'function'
    ? window.normalizarMaterialLogistica(_materialCompleto)
    : _materialCompleto;

// Enriquecer comandaData con material y tipo_menaje antes de guardar
comandaData.material_logistica = _materialNormalizado;
if (!comandaData.tipo_menaje) {
    comandaData.tipo_menaje = document.getElementById('tipo_menaje')?.value || null;
}

// Crear nueva comanda
codigo = await guardarComandaEnHistorial(comandaData);

// DEBUG: Verificar el código generado
console.log('Código generado:', codigo);
console.log('Año en código:', codigo.substring(2, 4));

mostrarMensaje(`✅ Comanda ${codigo} creada exitosamente`, 'success');

// GUARDAR EMPRESA FRECUENTE (si existe la función)
if (typeof guardarEmpresaFrecuente === 'function') {
    guardarEmpresaFrecuente(
        document.getElementById('empresa').value,
        document.getElementById('responsable').value
    );
}

if (typeof agregarAlCalendario === 'function') {
    agregarAlCalendario(comandaData);
}

// Guardar código e ID globalmente para pasarlos al formulario de logística
window.ultimoCodigoCocina = codigo;
window.ultimoOrdenId      = null;
window.ultimaComandaCocinaData = {
    codigo,
    empresa: comandaData.empresa || '',
    responsable: comandaData.responsable || '',
    pax: Number(comandaData.pax || 0),
    hora_salida: comandaData.hora_salida || '',
    fecha_evento: comandaData.fecha_evento || '',
    notas: comandaData.alergias?.notas || ''
};

const requiereLogisticaSeparada = _menusAcumulados.some(menu =>
    Number(menu.categoriaOriginalId || menu.categoriaId) === 3 ||
    Boolean(menu.servicio_categoria)
) || Number(categoriaId) === 3 || Number(_catPrincipal) === 3;

if (requiereLogisticaSeparada) {
    // Cocteles/Celebraciones → página separada de logística
    setTimeout(() => {
        mostrarModalConfirmacionLogistica();
    }, 600);
} else {
    // Resto de categorías → guardar logística inline en Supabase si hay datos
    const datosLogInline = obtenerDatosLogisticaInline();
    if (datosLogInline && typeof guardarLogisticaInlineEnSupabase === 'function') {
        guardarLogisticaInlineEnSupabase(codigo, comandaData, datosLogInline);
    }

    // El material ya fue capturado en comandaData.material_logistica antes de guardar
    const payloadParaDetalle = {
        ...comandaData,
        codigo,
        logistica_inline: comandaData.logistica  // datos del formulario (dirección, contacto, etc.)
        // material_logistica ya viene en comandaData
    };

    // 1. Ocultar formulario y mostrar detalle ANTES de limpiar
    document.getElementById('comandaForm').style.display = 'none';
    document.getElementById('dashboard').style.display = 'none';
    const detalleEl = document.getElementById('detalleComanda');
    if (detalleEl) detalleEl.style.display = 'block';

    // 2. Renderizar con datos completos
    if (typeof _renderDetalleComanda === 'function') {
        _renderDetalleComanda(payloadParaDetalle);
    }

    // 3. Limpiar formulario DESPUÉS (ya no afecta al detalle)
    limpiarFormularioComanda();
}
        }

        
    } catch (error) {
        mostrarMensaje('❌ Error al guardar la comanda: ' + error.message, 'error');
        console.error('Error en manejarEnvioFormulario:', error);
        
    } finally {
        // Restaurar botón solo si no es edición
        if (!window.comandaEditando) {
            submitBtn.innerHTML = originalText;
            submitBtn.disabled = false;
        }
    }
}

// ========== FUNCIONES PARA MODAL DE LOGÍSTICA ==========

/**
 * Muestra el modal de confirmación para crear comanda de logística
 */
function mostrarModalConfirmacionLogistica() {
    const modal = document.getElementById('modalConfirmacionLogistica');
    if (modal) {
        modal.style.display = 'flex';
        // La categoría 3 ya fue validada antes de llamar esta función.
        // No se usa preferencia guardada: siempre se pregunta al usuario.
    }
}

/**
 * Cierra el modal de confirmación
 */
function cerrarModalConfirmacion() {
    const modal = document.getElementById('modalConfirmacionLogistica');
    if (modal) {
        modal.style.display = 'none';
    }
    
    // Limpiar formulario y volver al dashboard
    limpiarFormularioComanda();
    
    setTimeout(() => {
        if (typeof volverAlDashboard === 'function') {
            volverAlDashboard();
        }
    }, 300);
}

/**
 * Abre el formulario de logística con los datos heredados de la comanda de cocina.
 * Se llama cuando el usuario confirma "Sí" en el modal de logística.
 */
function crearComandaLogistica() {
    const recordar = document.getElementById('recordarPreferencia')?.checked;
    if (recordar) {
        localStorage.setItem('crearLogisticaAutomaticamente', 'true');
    }

    // Cerrar el modal de confirmación
    const modal = document.getElementById('modalConfirmacionLogistica');
    if (modal) modal.style.display = 'none';

    // Capturar datos base de la comanda de cocina recién creada
    const comandaBase = window.ultimaComandaCocinaData || {};
    const datosBase = {
        empresa:      comandaBase.empresa || document.getElementById('empresa')?.value || '',
        responsable:  comandaBase.responsable || document.getElementById('responsable')?.value || '',
        pax:          Number(comandaBase.pax || document.getElementById('pax')?.value || 0),
        hora_salida:  comandaBase.hora_salida || document.getElementById('hora_salida')?.value || '',
        fecha_evento: comandaBase.fecha_evento || document.getElementById('fecha_evento')?.value || '',
        notas:        comandaBase.notas || document.getElementById('alergias_notas')?.value || ''
    };

    // El código de cocina está guardado en window.ultimoCodigoCocina
    const codigoCocina = window.ultimoCodigoCocina || '';
    const ordenId      = window.ultimoOrdenId      || null;

    // Abrir formulario de logística (definido en logistics.js)
    if (typeof abrirFormularioLogistica === 'function') {
        abrirFormularioLogistica(codigoCocina, ordenId, datosBase);
    } else {
        console.error('❌ logistics.js no está cargado');
    }
}

/**
 * Guarda una comanda de logística en el historial
 * MODIFICADO: Año de 2 dígitos
 * @param {Object} datosLogistica - Datos de la comanda de logística
 * @returns {string} Código de la comanda
 */
async function abrirFormularioLogistica(codigoCocina, ordenId, datosBase = {}) {
    window._logisticaBase = {
        codigoCocina,
        ordenId,
        ...datosBase
    };
    window.pax = Number(datosBase.pax || window.pax || document.getElementById('pax')?.value || 0);

    const comandaForm = document.getElementById('comandaForm');
    const dashboard = document.getElementById('dashboard');
    const detalle = document.getElementById('detalleComanda');
    const historial = document.getElementById('historialPage');
    const expediente = document.getElementById('expedientePedido');
    const logisticaForm = document.getElementById('logisticaForm');

    if (comandaForm) comandaForm.style.display = 'none';
    if (dashboard) dashboard.style.display = 'none';
    if (detalle) detalle.style.display = 'none';
    if (historial) historial.style.display = 'none';
    if (expediente) expediente.style.display = 'none';
    if (logisticaForm) logisticaForm.style.display = 'block';

    const setText = (id, value) => {
        const el = document.getElementById(id);
        if (el) el.textContent = value || '—';
    };
    const setValue = (id, value) => {
        const el = document.getElementById(id);
        if (el && value) el.value = value;
    };

    setText('log_codigo_cocina', codigoCocina);
    setText('log_empresa', datosBase.empresa);
    setText('log_responsable', datosBase.responsable);
    setText('log_pax', datosBase.pax ? String(datosBase.pax) : '0');
    setText('log_fecha_evento', datosBase.fecha_evento);
    setText('log_hora_salida', datosBase.hora_salida);

    setValue('log_nombre_contacto', document.getElementById('log_inline_nombre_contacto')?.value || '');
    setValue('log_telefono_contacto', document.getElementById('log_inline_telefono_contacto')?.value || '');
    setValue('log_calle', document.getElementById('log_inline_calle')?.value || '');
    setValue('log_numero', document.getElementById('log_inline_numero')?.value || '');
    setValue('log_codigo_postal', document.getElementById('log_inline_codigo_postal')?.value || '');
    setValue('log_hora_entrega', document.getElementById('log_inline_hora_entrega')?.value || '');
    setValue('log_hora_evento', document.getElementById('log_inline_hora_evento')?.value || '');
    setValue('log_page_notas', document.getElementById('log_inline_notas')?.value || '');

    const materialPage = document.getElementById('materialLogisticaPage');
    if (materialPage) materialPage.style.display = 'block';
    if (typeof inicializarMaterialLogistica === 'function') {
        await inicializarMaterialLogistica('materialLogisticaPage');
        if (typeof autocompletarMaterialPorCategoria === 'function') {
            await autocompletarMaterialPorCategoria(3, 'materialLogisticaPage');
        }
    }

    if (typeof setNavActive === 'function') setNavActive('nav-servicios');
}

function volverDesdeCancelLogistica() {
    const logisticaForm = document.getElementById('logisticaForm');
    if (logisticaForm) logisticaForm.style.display = 'none';
    if (typeof volverAlDashboard === 'function') {
        volverAlDashboard();
    }
}

function validarComandaLogisticaPage() {
    let valido = true;
    const requeridos = [
        { id: 'log_nombre_contacto', label: 'Nombre de contacto' },
        { id: 'log_telefono_contacto', label: 'Telefono de contacto' },
        { id: 'log_hora_entrega', label: 'Hora de entrega' },
        { id: 'log_hora_evento', label: 'Hora del evento' },
        { id: 'log_calle', label: 'Calle' },
        { id: 'log_numero', label: 'Número / portal' },
        { id: 'log_codigo_postal', label: 'Codigo postal' }
    ];

    requeridos.forEach(({ id, label }) => {
        const input = document.getElementById(id);
        const errEl = document.getElementById(id + '_err');
        if (!input) return;

        if (!input.value.trim()) {
            input.style.borderColor = '#dc2626';
            if (errEl) errEl.textContent = `${label} es obligatorio`;
            valido = false;
        } else {
            input.style.borderColor = '#cbd5e1';
            if (errEl) errEl.textContent = '';
        }
    });

    const tel = document.getElementById('log_telefono_contacto');
    if (tel && tel.value.trim() && !/^[0-9\s\+\-]{6,20}$/.test(tel.value.trim())) {
        tel.style.borderColor = '#dc2626';
        const errEl = document.getElementById('log_telefono_contacto_err');
        if (errEl) errEl.textContent = 'Formato de telefono no valido';
        valido = false;
    }

    const salida = window._logisticaBase?.hora_salida ||
        document.getElementById('log_hora_salida')?.textContent ||
        document.getElementById('hora_salida')?.value ||
        '';

    if (!validarHorariosLogistica('log', salida)) {
        valido = false;
    }

    return valido;
}

function guardarComandaLogistica() {
    if (!validarComandaLogisticaPage()) return;

    const base = window._logisticaBase || {};
    const calle = document.getElementById('log_calle')?.value.trim() || '';
    const numero = document.getElementById('log_numero')?.value.trim() || '';
    const datosLogistica = {
        tipo_registro: 'logistica',
        codigo_original: base.codigoLogistica || window._logisticaEditando?.codigo || '',
        codigo_cocina: base.codigoCocina || '',
        orden_id: base.ordenId || null,
        empresa: base.empresa || '',
        responsable: base.responsable || '',
        pax: base.pax || 0,
        fecha_evento: base.fecha_evento || '',
        hora_salida: base.hora_salida || '',
        logistica: {
            nombre_contacto: document.getElementById('log_nombre_contacto')?.value.trim() || '',
            telefono_contacto: document.getElementById('log_telefono_contacto')?.value.trim() || '',
            hora_entrega: document.getElementById('log_hora_entrega')?.value || '',
            hora_evento: document.getElementById('log_hora_evento')?.value || '',
            calle,
            numero,
            direccion: componerDireccionLogistica(calle, numero),
            codigo_postal: document.getElementById('log_codigo_postal')?.value.trim() || '',
            notas_logistica: document.getElementById('log_page_notas')?.value.trim() || ''
        },
        material_logistica: typeof obtenerMaterialSeleccionado === 'function'
            ? obtenerMaterialSeleccionado()
            : null,
        logistics_status: 'sin_preparar',
        logistics_assigned_to: '',
        logistics_prepared_items: 0,
        fecha_creacion: new Date().toISOString(),
        estado: 'sin_preparar'
    };

    try {
        const codigo = guardarComandaLogisticaEnHistorial(datosLogistica);
        if (typeof mostrarMensaje === 'function') {
            mostrarMensaje(`Comanda de logística ${codigo} creada`, 'success');
        }
        if (typeof cargarCalendario === 'function') {
            cargarCalendario();
        }
        window._logisticaEditando = null;
        volverDesdeCancelLogistica();
    } catch (error) {
        if (typeof mostrarMensaje === 'function') {
            mostrarMensaje('Error al guardar logística: ' + error.message, 'error');
        }
        console.error('Error al guardar logística:', error);
    }
}

function guardarComandaLogisticaEnHistorial(datosLogistica) {
    try {
        let historial = JSON.parse(localStorage.getItem('historialComandasLogistica')) || [];

        const fecha = new Date();
        const year = fecha.getFullYear().toString().slice(-2);
        const codigo = datosLogistica.codigo_original || datosLogistica.codigo_cocina
            || `LOG-${year}${(fecha.getMonth() + 1).toString().padStart(2, '0')}${fecha.getDate().toString().padStart(2, '0')}-${(historial.length + 1).toString().padStart(3, '0')}`;
        const existente = historial.find(item => item.codigo === datosLogistica.codigo_original);

        const comandaLogistica = {
            codigo,
            ...datosLogistica,
            fecha_creacion: existente?.fecha_creacion || datosLogistica.fecha_creacion,
            fecha_modificacion: new Date().toISOString()
        };

        const indexExistente = historial.findIndex(item => item.codigo === codigo || item.codigo === datosLogistica.codigo_original);
        if (indexExistente >= 0) {
            historial[indexExistente] = comandaLogistica;
        } else {
            historial.unshift(comandaLogistica);
        }

        localStorage.setItem('historialComandasLogistica', JSON.stringify(historial));
        vincularComandaLogisticaEnHistorialPrincipal(comandaLogistica);

        console.log(`Comanda de logistica ${codigo} guardada en historial`);
        return codigo;

    } catch (error) {
        console.error('Error al guardar comanda de logistica:', error);
        throw error;
    }
}
function vincularComandaLogisticaEnHistorialPrincipal(comandaLogistica) {
    const codigoPedido = comandaLogistica.codigo_cocina || comandaLogistica.codigo;
    if (!codigoPedido) return;

    try {
        const historialPrincipal = JSON.parse(localStorage.getItem('historialComandas') || '[]');
        const index = historialPrincipal.findIndex(item => item.codigo === codigoPedido);
        if (index === -1) return;

        const comanda = historialPrincipal[index];
        const documentos = {
            ...(comanda.documentos || {}),
            logistica: {
                tipo: 'logistica',
                nombre: 'Comanda Logistica',
                codigo: comandaLogistica.codigo,
                fecha_creacion: comandaLogistica.fecha_creacion || new Date().toISOString()
            }
        };

        historialPrincipal[index] = {
            ...comanda,
            documentos,
            logistica_creada: true,
            fecha_modificacion: new Date().toISOString()
        };

        localStorage.setItem('historialComandas', JSON.stringify(historialPrincipal));
    } catch (error) {
        console.warn('No se pudo vincular la comanda de logistica al expediente:', error);
    }
}

/**
 * Limpia el formulario de comanda
 */
function limpiarFormularioComanda() {
    const formulario = document.getElementById('comandaCocinaForm');
    if (formulario) {
        formulario.reset();
    }
    
    // Limpiar variables globales
    window.menuSeleccionado = null;
    window.menusAdicionales = [];
    window.multiplicadores = { saladas: 1, postres: 1 };
    window.referenciasSeleccionadas = { saladas: [], postres: [] };
    window.referenciasDesayuno = {};

    // Resetear menús acumulados y material acumulado
    if (typeof window.resetearMenusAcumulados === 'function') {
        window.resetearMenusAcumulados();
    }
    
    // CORRECCIÓN: Limpiar selecciones de Foodbox Lunch correctamente
    if (window.seleccionesFoodbox) {
        window.seleccionesFoodbox.ensalada_principal = null;
        window.seleccionesFoodbox.sandwich_principal = null;
        window.seleccionesFoodbox.postre_principal = null;
        window.seleccionesFoodbox.adicionales = [];
    }
    
    // Limpiar errores de validación
    document.querySelectorAll('.error-message').forEach(el => {
        el.style.display = 'none';
    });
    
    document.querySelectorAll('input, select, textarea').forEach(input => {
        input.style.borderColor = '#cbd5e1';
        input.style.backgroundColor = '';
    });
    
    // Ocultar secciones dinámicas - AÑADIR 'foodboxLunchSection'
    const seccionesOcultar = [
        'multiplicadorSection',
        'referenciasSection',
        'desayunoReferencesSection',
        'foodboxLunchSection',  // ¡AÑADIR ESTA!
        'menusAdicionalesList',
        'menusAnadidosList'
    ];
    
    seccionesOcultar.forEach(id => {
        const elemento = document.getElementById(id);
        if (elemento) {
            elemento.style.display = 'none';
        }
    });
    
    // Limpiar contenedores - AÑADIR LOS DE FOODBOX
    const contenedoresLimpiar = [
        'menusContainer',
        'referenciasSaladasGrid',
        'referenciasPostresGrid',
        'referenciasDesayunoGrid',
        'foodboxPrincipalGrid',      // ¡AÑADIR ESTOS!
        'foodboxPostresGrid',
        'foodboxAdicionalesContainer'
    ];
    
    contenedoresLimpiar.forEach(id => {
        const elemento = document.getElementById(id);
        if (elemento) {
            elemento.innerHTML = '';
        }
    });
    
    // Restablecer valores por defecto
    document.getElementById('categoria').value = '';
    document.getElementById('menu_id').value = '';

    // Volver a poner el nombre del responsable tras el reset
    const responsableInput = document.getElementById('responsable');
    if (responsableInput && typeof obtenerNombreUsuarioActual === 'function') {
        responsableInput.value = obtenerNombreUsuarioActual();
    }

    // Limpiar campos de logística (sección siempre visible)
    if (typeof limpiarCamposLogisticaInline === 'function') limpiarCamposLogisticaInline();

    // Limpiar material de logística: estado interno y DOM
    if (typeof window.limpiarMaterialLogistica === 'function') {
        window.limpiarMaterialLogistica();
    }
    const matInline = document.getElementById('materialLogisticaInline');
    if (matInline) {
        matInline.style.display = 'none';
        matInline.innerHTML = '';
    }
}

// ========== FUNCIONES UTILITARIAS ==========

/**
 * Muestra un mensaje en la interfaz
 * @param {string} texto - Texto del mensaje
 * @param {string} tipo - 'success' o 'error'
 */
function mostrarMensaje(texto, tipo) {
    const div = document.getElementById('message');
    if (!div) return;
    
    div.textContent = texto;
    div.className = `message message-${tipo}`;
    div.style.display = 'block';
    
    // Ocultar después de 5 segundos
    setTimeout(() => {
        div.className = 'message';
        div.style.display = 'none';
    }, 5000);
}

function updateLoginUI() {
  const logged = !!window.currentUser;
  const btnLogin = document.getElementById("btnLogin");
  const btnLogout = document.getElementById("btnLogout");
  if (!btnLogin || !btnLogout) return;

  btnLogin.style.display = logged ? "none" : "inline-block";
  btnLogout.style.display = logged ? "inline-block" : "none";
}

document.getElementById("btnLogin")?.addEventListener("click", async () => {
  const email = document.getElementById("loginEmail")?.value;
  const pass = document.getElementById("loginPass")?.value;
  const msg = document.getElementById("loginMsg");

  try {
    await Auth.signIn(email, pass);
    if (msg) msg.textContent = "Sesión iniciada ✅";
  } catch (error) {
    if (msg) msg.textContent = "Error: " + (error?.message || error);
    console.error(error);
  }
});

document.getElementById("btnLogout")?.addEventListener("click", async () => {
  const msg = document.getElementById("loginMsg");
  try {
    await Auth.signOut();
    if (msg) msg.textContent = "Sesión cerrada ✅";
  } catch (error) {
    if (msg) msg.textContent = "Error: " + (error?.message || error);
  }
});

document.addEventListener("user:changed", updateLoginUI);
document.addEventListener("DOMContentLoaded", updateLoginUI);


function actualizarHeaderUsuario() {
  const el = document.getElementById("dcUserName");
  if (!el || !window.currentUser) return;

  const name = window.currentUser.user_metadata?.full_name 
               || window.currentUser.email 
               || "";

  el.textContent = name;
}

document.addEventListener("user:changed", actualizarHeaderUsuario);
document.addEventListener("DOMContentLoaded", actualizarHeaderUsuario);

document.getElementById("btnLogout")?.addEventListener("click", async () => {
  await Auth.signOut();
  window.location.href = "login.html";
});


// ============================================================
// FUNCIÓN GLOBAL: Actualizar tipo de menaje (termos)
// ============================================================
window.actualizarTipoMenajeGlobal = function() {
    const tipoMenaje = document.getElementById('tipo_menaje')?.value;
    if (!tipoMenaje) return;

    const tipoTermo = tipoMenaje === 'loza' ? 'acero' : 'desechable';

    // 1. Actualizar todos los selectores de termo visibles en el formulario actual
    document.querySelectorAll('.select-termo').forEach(select => {
        select.value = tipoTermo;

        const onchangeAttr = select.getAttribute('onchange') || '';
        const match = onchangeAttr.match(/actualizarTipoTermo\('([^']+)'/);
        const refId = match ? match[1] : select.closest('[data-id]')?.dataset.id;

        if (refId && typeof actualizarTipoTermo === 'function') {
            actualizarTipoTermo(refId, tipoTermo);
        }
    });

    // 2. Propagar el tipo_menaje a todos los menús ya acumulados
    if (window.MenusAdicionalesState?.menusAdicionales) {
        window.MenusAdicionalesState.menusAdicionales.forEach(m => {
            m.tipo_menaje = tipoMenaje;
        });
    }

    // 3. Relanzar material para aplicar filtros solo_loza / solo_desechable
    const categoriaId = window.menuSeleccionado?._cat
        || parseInt(document.getElementById('categoria')?.value);
    if (categoriaId && typeof window.autocompletarMaterialPorCategoria === 'function') {
        window.autocompletarMaterialPorCategoria(categoriaId, 'materialLogisticaInline');
    }
};
