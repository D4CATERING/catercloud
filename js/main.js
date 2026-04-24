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
}

/**
 * Muestra u oculta la sección de logística inline.
 * Visible para: Desayuno (1), Foodbox/Comida (2), Foodbox Lunch (4), Bandejas (5)
 * Oculta para:  Servicios/Cocteles (3) — esos usan el flujo de página separada
 */
function toggleLogisticaInline(categoriaId) {
    const seccion = document.getElementById('logisticaInlineSection');
    if (!seccion) return;
    const mostrar = [1, 2, 4, 5].includes(categoriaId);
    seccion.style.display = mostrar ? 'block' : 'none';

    if (mostrar) {
        // Limpiar zumos de desayuno al cambiar a otra categoría
        if (categoriaId !== 1 && window.materialLogistica?.bebidas) {
            window.materialLogistica.bebidas = window.materialLogistica.bebidas.filter(i => !i._zumoId);
        }
        // La inicialización del material la gestiona comanda-form.js al seleccionar menú.
        // Aquí solo mostramos el contenedor si ya existe el material.
        const matContainer = document.getElementById('materialLogisticaInline');
        if (matContainer && matContainer.innerHTML.trim()) {
            matContainer.style.display = 'block';
        }
    } else {
        // Limpiar todo al ocultar
        limpiarCamposLogisticaInline();
        const matContainer = document.getElementById('materialLogisticaInline');
        if (matContainer) matContainer.style.display = 'none';
        if (typeof window.limpiarMaterialLogistica === 'function') {
            window.limpiarMaterialLogistica();
        }
    }
}

/**
 * Limpia los campos de la sección logística inline
 */
function limpiarCamposLogisticaInline() {
    const ids = [
        'log_inline_hora_entrega', 'log_inline_hora_evento',
        'log_inline_nombre_contacto', 'log_inline_telefono_contacto',
        'log_inline_direccion', 'log_inline_codigo_postal', 'log_inline_notas'
    ];
    ids.forEach(id => {
        const el = document.getElementById(id);
        if (el) { el.value = ''; el.style.borderColor = '#cbd5e1'; }
        const err = document.getElementById(id + '_err');
        if (err) err.textContent = '';
    });
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
        { id: 'log_inline_direccion',          label: 'Dirección' },
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

    return valido;
}

/**
 * Recoge los datos de logística inline del formulario
 */
function obtenerDatosLogisticaInline() {
    const seccion = document.getElementById('logisticaInlineSection');
    if (!seccion || seccion.style.display === 'none') return null;
    return {
        hora_entrega:      document.getElementById('log_inline_hora_entrega')?.value || '',
        hora_evento:       document.getElementById('log_inline_hora_evento')?.value || '',
        nombre_contacto:   document.getElementById('log_inline_nombre_contacto')?.value.trim() || '',
        telefono_contacto: document.getElementById('log_inline_telefono_contacto')?.value.trim() || '',
        direccion:         document.getElementById('log_inline_direccion')?.value.trim() || '',
        codigo_postal:     document.getElementById('log_inline_codigo_postal')?.value.trim() || '',
        notas_logistica:   document.getElementById('log_inline_notas')?.value.trim() || ''
    };
}


// ========== FUNCIONES DE VALIDACIÓN INDIVIDUALES ==========

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
        validarPax(),
        validarFechaEvento(),
        validarHoraSalida()
    ];
    
    // Verificar que todas las validaciones pasaron
    const todasValidas = validacionesIndividuales.every(v => v === true);
    
    // Validar menú principal seleccionado
    if (!window.menuSeleccionado) {
        mostrarMensaje('❌ Por favor, selecciona un menú principal', 'error');
        
        // Resaltar la sección de menús
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
    
    // Obtener el botón de submit con verificación
    const submitBtn = e.target.querySelector('button[type="submit"]');
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
    
    // Validaciones específicas por categoría
    if (categoriaId == 2 || categoriaId == 3) { // FOODBOX/COMIDA o SERVICIOS
        const seleccionadasSaladas = window.referenciasSeleccionadas ? 
            window.referenciasSeleccionadas.saladas.length : 0;
        
        if (seleccionadasSaladas < window.menuSeleccionado.items_salados_min) {
            mostrarMensaje(`❌ Debes seleccionar al menos ${window.menuSeleccionado.items_salados_min} referencias saladas`, 'error');
            submitBtn.innerHTML = originalText;
            return;
        }
    }
    
// Validación para Foodbox Lunch (MEJORADA)
if (categoriaId == 4) { // FOODBOX LUNCH
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
    
    // Preparar datos de la comanda
    const comandaData = {
        empresa: document.getElementById('empresa').value,
        responsable: document.getElementById('responsable').value,
        pax: parseInt(document.getElementById('pax').value),
        hora_salida: document.getElementById('hora_salida').value,
        fecha_evento: document.getElementById('fecha_evento').value,
        menu_principal: {
            id: document.getElementById('menu_id').value,
            ...window.menuSeleccionado
        },
        
        // ===== INCLUIR REFERENCIAS DE DESAYUNO COMPLETAS =====
        ...(categoriaId == 1 && window.referenciasDesayuno ? {
            referencias_desayuno: window.referenciasDesayuno
        } : {}),
        
        // ===== INCLUIR FOODBOX LUNCH SI APLICA =====
        ...(categoriaId == 4 && typeof obtenerDatosFoodboxLunch === 'function' ? {
            foodbox_lunch: obtenerDatosFoodboxLunch()
        } : {}),
        
        // Multiplicadores solo para Foodbox/Comida
        ...([2, 3].includes(categoriaId) ? {
            multiplicadores: window.multiplicadores || { saladas: 1, postres: 1 }
        } : { multiplicadores: null }),
        
        // Referencias solo para Foodbox/Comida
        ...([2, 3].includes(categoriaId) ? {
            referencias: window.referenciasSeleccionadas || { saladas: [], postres: [] }
        } : { referencias: null }),
        
        // Notas (si tienes el textarea de notas)
        ...(document.getElementById('alergias_notas') ? {
            alergias: {
                notas: document.getElementById('alergias_notas').value
            }
        } : {}),

        // Tipo de menaje seleccionado
        tipo_menaje: document.getElementById('tipo_menaje')?.value || null,

        // Logística inline (Desayuno / Foodbox / Lunch / Bandejas)
        logistica: obtenerDatosLogisticaInline(),
        
        // Material de logística (si está seleccionado)
        material_logistica: typeof obtenerMaterialSeleccionado === 'function' ? 
            obtenerMaterialSeleccionado() : null,
        
        fecha_creacion: new Date().toISOString(),
        estado: 'creada',
        version: '1.0'
    };
    
    try {
        let codigo;
        
        if (window.comandaEditando) {
            // Actualizar comanda existente
            const resultado = actualizarComandaEnHistorial(window.comandaEditando.codigo, comandaData);
            
            if (resultado) {
                mostrarMensaje(`✅ Comanda ${window.comandaEditando.codigo} actualizada exitosamente`, 'success');
                
                if (typeof agregarAlCalendario === 'function') {
                    agregarAlCalendario(comandaData);
                }
                
                // Volver al dashboard después de actualizar
                setTimeout(() => {
                    if (typeof volverAlDashboard === 'function') {
                        volverAlDashboard();
                    }
                    window.comandaEditando = null;
                }, 2000);
                
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

let _materialCompleto;
if (typeof obtenerMaterialSeleccionado === 'function') {
    const _seleccionado = obtenerMaterialSeleccionado();
    _materialCompleto = {
        bebidas: _seleccionado.bebidas || [],
        menaje:  _seleccionado.menaje  || [],
        extras:  _seleccionado.extras  || []
    };
} else {
    const _domBebidas = _leerContainerTipo('bebidas', []);
    const _domMenaje  = _leerContainerTipo('menaje',  []);
    const _domExtras  = _leerContainerTipo('extras',  []);
    _materialCompleto = { bebidas: _domBebidas, menaje: _domMenaje, extras: _domExtras };
}

// Enriquecer comandaData con material y tipo_menaje antes de guardar
comandaData.material_logistica = _materialCompleto;
// tipo_menaje ya se añadió arriba, pero por si acaso:
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

if (categoriaId === 3) {
    // Cocteles/Celebraciones → página separada de logística
    setTimeout(() => {
        mostrarModalConfirmacionLogistica();
    }, 1000);
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
    const datosBase = {
        empresa:      document.getElementById('empresa')?.value || '',
        responsable:  document.getElementById('responsable')?.value || '',
        pax:          parseInt(document.getElementById('pax')?.value) || 0,
        hora_salida:  document.getElementById('hora_salida')?.value || '',
        fecha_evento: document.getElementById('fecha_evento')?.value || '',
        notas:        document.getElementById('alergias_notas')?.value || ''
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
function guardarComandaLogisticaEnHistorial(datosLogistica) {
    try {
        // Obtener historial actual
        let historial = JSON.parse(localStorage.getItem('historialComandasLogistica')) || [];
        
        // Generar código único con año de 2 dígitos
        const fecha = new Date();
        const año = fecha.getFullYear().toString().slice(-2); // 2 últimos dígitos
        const codigo = `LOG-${año}${(fecha.getMonth() + 1).toString().padStart(2, '0')}${fecha.getDate().toString().padStart(2, '0')}-${(historial.length + 1).toString().padStart(3, '0')}`;
        
        // Crear objeto de comanda de logística
        const comandaLogistica = {
            codigo: codigo,
            ...datosLogistica,
            fecha_modificacion: new Date().toISOString()
        };
        
        // Agregar al historial
        historial.unshift(comandaLogistica);
        
        // Guardar en localStorage
        localStorage.setItem('historialComandasLogistica', JSON.stringify(historial));
        
        console.log(`Comanda de logística ${codigo} guardada en historial`);
        return codigo;
        
    } catch (error) {
        console.error('Error al guardar comanda de logística:', error);
        throw error;
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

    // Ocultar y limpiar sección de logística inline
    const logInline = document.getElementById('logisticaInlineSection');
    if (logInline) logInline.style.display = 'none';
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

    // Actualizar todos los selectores de termo visibles
    document.querySelectorAll('.select-termo').forEach(select => {
        select.value = tipoTermo;
        const refId = select.closest('[data-id]')?.dataset.id;
        if (refId && typeof actualizarTipoTermo === 'function') {
            actualizarTipoTermo(refId, tipoTermo);
        }
    });

    // Relanzar material para aplicar filtros solo_loza / solo_desechable
    const categoriaId = parseInt(document.getElementById('categoria')?.value);
    if (categoriaId && window.menuSeleccionado) {
        if (typeof window.autocompletarMaterialPorCategoria === 'function') {
            window.autocompletarMaterialPorCategoria(categoriaId, 'materialLogisticaInline');
        }
    }
};
