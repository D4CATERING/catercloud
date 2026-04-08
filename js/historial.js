// ========== HISTORIAL DE COMANDA ==========

/**
 * Carga y muestra el historial de comandas
 */
function cargarHistorial() {
    const historial = JSON.parse(localStorage.getItem('historialComandas') || '[]');
    const container = document.getElementById('comandasList');

    if (historial.length === 0) {
        container.innerHTML = '<p style="color: #94a3b8; text-align: center; font-size: 0.9rem; padding: 40px;">No hay comandas en el historial</p>';
        return;
    }

    // Ordenar por fecha de creación descendente
    historial.sort((a, b) => new Date(b.fecha_creacion) - new Date(a.fecha_creacion));

    let html = '';

    historial.forEach(comanda => {
        const fechaCreacion = new Date(comanda.fecha_creacion);
        const fechaEvento = new Date(comanda.fecha_evento);

        html += `
        <div class="comanda-item" onclick="verDetalleComanda('${comanda.codigo}')">
            <div class="comanda-header">
                <div class="comanda-codigo">${comanda.codigo}</div>
                <div class="comanda-fecha">${fechaCreacion.toLocaleDateString('es-ES', {
                    day: '2-digit',
                    month: '2-digit',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                })}</div>
            </div>
            <div class="comanda-empresa">${comanda.empresa}</div>
            <div class="comanda-info">Responsable: ${comanda.responsable}</div>
            <div class="comanda-info">${comanda.pax} PAX - Evento: ${fechaEvento.toLocaleDateString('es-ES')}</div>
            <div class="comanda-info">Menú principal: ${comanda.menu_principal?.nombre || 'No especificado'}</div>
            <div class="comanda-estado estado-${comanda.estado}">
                ${comanda.estado.charAt(0).toUpperCase() + comanda.estado.slice(1)}
            </div>

        </div>
        `;
    });

    container.innerHTML = html;
}

/**
 * Filtra las comandas según criterios
 */
function filtrarComandas() {
    const historial = JSON.parse(localStorage.getItem('historialComandas') || '[]');
    const filtro = document.getElementById('filtroBusqueda').value.toLowerCase();
    const filtroFecha = document.getElementById('filtroFecha').value;
    const filtroEstado = document.getElementById('filtroEstado').value;

    const comandasFiltradas = historial.filter(comanda => {
        // Filtro de búsqueda
        const coincideBusqueda = !filtro ||
            comanda.empresa.toLowerCase().includes(filtro) ||
            comanda.codigo.toLowerCase().includes(filtro) ||
            comanda.responsable.toLowerCase().includes(filtro);

        // Filtro de fecha
        const coincideFecha = !filtroFecha ||
            comanda.fecha_evento.split('T')[0] === filtroFecha;

        // Filtro de estado
        const coincideEstado = !filtroEstado ||
            comanda.estado === filtroEstado;

        return coincideBusqueda && coincideFecha && coincideEstado;
    });

    // Ordenar por fecha de creación descendente
    comandasFiltradas.sort((a, b) => new Date(b.fecha_creacion) - new Date(a.fecha_creacion));

    const container = document.getElementById('comandasList');

    if (comandasFiltradas.length === 0) {
        container.innerHTML = '<p style="color: #94a3b8; text-align: center; font-size: 0.9rem; padding: 40px;">No se encontraron comandas con los filtros seleccionados</p>';
        return;
    }

    let html = '';

    comandasFiltradas.forEach(comanda => {
        const fechaCreacion = new Date(comanda.fecha_creacion);
        const fechaEvento = new Date(comanda.fecha_evento);

        html += `
        <div class="comanda-item" onclick="verDetalleComanda('${comanda.codigo}')">
            <div class="comanda-header">
                <div class="comanda-codigo">${comanda.codigo}</div>
                <div class="comanda-fecha">${fechaCreacion.toLocaleDateString('es-ES', {
                    day: '2-digit',
                    month: '2-digit',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                })}</div>
            </div>
            <div class="comanda-empresa">${comanda.empresa}</div>
            <div class="comanda-info">Responsable: ${comanda.responsable}</div>
            <div class="comanda-info">${comanda.pax} PAX - Evento: ${fechaEvento.toLocaleDateString('es-ES')}</div>
            <div class="comanda-info">Menú principal: ${comanda.menu_principal?.nombre || 'No especificado'}</div>
            <div class="comanda-estado estado-${comanda.estado}">
                ${comanda.estado.charAt(0).toUpperCase() + comanda.estado.slice(1)}
            </div>

        </div>
        `;
    });

    container.innerHTML = html;
}

/**
 * Muestra el detalle de una comanda
 */
function verDetalleComanda(codigo) {
    const comanda = obtenerComandaDelHistorial(codigo);
    if (!comanda) { alert('Comanda no encontrada'); return; }
    document.getElementById('historialPage').style.display = 'none';
    document.getElementById('detalleComanda').style.display = 'block';
    _renderDetalleComanda(comanda);
}

// Construye el HTML del detalle completo de un menú
function _renderMenuDetalle(comanda, pax) {
    let html = '';

    function fila(nombre, cantidad, unidad, esTitulo) {
        return `<div class="detalle-menu-row">
            <span class="detalle-menu-nombre${esTitulo ? ' es-titulo' : ''}">${nombre}</span>
            <span class="detalle-menu-cantidad">${cantidad ? cantidad + ' ' + (unidad||'') : ''}</span>
        </div>`;
    }

    // Desayuno
    if (comanda.referencias_desayuno && Object.keys(comanda.referencias_desayuno).length) {
        Object.values(comanda.referencias_desayuno).forEach(ref => {
            if (!ref || !ref.cantidad || ref.cantidad === 0) return;
            let extra = '';
            if (ref.tipo === 'bolleria' && ref.opcionesSeleccionadas?.length)
                extra = ' (' + ref.opcionesSeleccionadas.join(', ') + ')';
            if (ref.tipo === 'sandwich' && ref.sabor) extra = ' — ' + ref.sabor;
            if ((ref.tipo === 'sandwich_multiple') && ref.sandwiches?.length)
                extra = ': ' + ref.sandwiches.filter(s=>s.sabor).map(s=>`${s.sabor} ×${s.cantidad||''}`).join(', ');
            // Etiqueta acero/desechable en termos y leches
            if ((ref.tipo === 'termo' || ref.tipo === 'leche_especial') && ref.tipoTermo) {
                extra += ' <span class="detalle-termo-tag">' + ref.tipoTermo.toUpperCase() + '</span>';
            }
            html += fila(ref.nombre + extra, ref.cantidad, ref.unidad || 'uds', false);
        });
    }

    // Foodbox Lunch
    if (comanda.foodbox_lunch) {
        const fl = comanda.foodbox_lunch;
        if (fl.ensalada_principal) html += fila('🥗 ' + (fl.ensalada_principal.nombre || fl.ensalada_principal), '', '', false);
        if (fl.sandwich_principal) html += fila('🥪 ' + (fl.sandwich_principal.nombre || fl.sandwich_principal), '', '', false);
        if (fl.postre_principal)   html += fila('🍰 ' + (fl.postre_principal.nombre   || fl.postre_principal),   '', '', false);
        if (fl.adicionales?.length) {
            fl.adicionales.forEach(a => {
                html += fila('➕ ' + (a.nombre || a.opcionId || ''), a.cantidad, '', false);
            });
        }
    }

    // Foodbox/Comida — referencias saladas y postres
    if (comanda.referencias) {
        const saladas = comanda.referencias.saladas || [];
        const postres = comanda.referencias.postres || [];
        const mul = comanda.multiplicadores;
        if (saladas.length) {
            const mulLabel = mul?.saladas ? ` ×${mul.saladas}` : '';
            html += fila('Saladas' + mulLabel, '', '', true);
            saladas.forEach(r => html += fila(r.nombre || r.id, r.cantidad, r.unidad || 'uds', false));
        }
        if (postres.length) {
            const mulLabel = mul?.postres ? ` ×${mul.postres}` : '';
            html += fila('Postres' + mulLabel, '', '', true);
            postres.forEach(r => html += fila(r.nombre || r.id, r.cantidad, r.unidad || 'uds', false));
        }
    }

    if (!html) {
        html = `<span class="detalle-menu-nombre" style="color:#94a3b8;">Sin detalle disponible</span>`;
    }
    return html;
}

function _renderDetalleComanda(comanda) {

    // ── Encabezado ─────────────────────────────────────────
    const el = (id) => document.getElementById(id);

    if (el('detalleCodigo'))     el('detalleCodigo').textContent     = comanda.codigo || '';
    if (el('detalleFecha'))      el('detalleFecha').textContent      = comanda.fecha_creacion
        ? 'Creada el ' + new Date(comanda.fecha_creacion).toLocaleDateString('es-ES') : '';

    // ── Información básica ──────────────────────────────────
    if (el('detalleEmpresa'))     el('detalleEmpresa').textContent     = comanda.empresa     || '—';
    if (el('detalleResponsable')) el('detalleResponsable').textContent = comanda.responsable || '—';
    if (el('detallePax'))         el('detallePax').textContent         = comanda.pax         || '0';
    if (el('detalleFechaEvento')) {
        const fe = comanda.fecha_evento ? new Date(comanda.fecha_evento + 'T00:00:00') : null;
        el('detalleFechaEvento').textContent = fe ? fe.toLocaleDateString('es-ES') : '—';
    }
    if (el('detalleHoraSalida'))  el('detalleHoraSalida').textContent  = comanda.hora_salida || '—';

    // ── Menú principal — título en cabecera, tipo menaje + detalle en cuerpo ─
    const nombreMenu = comanda.menu_principal?.nombre || 'Menú';
    if (el('detalleMenuTitulo'))    el('detalleMenuTitulo').textContent = nombreMenu;

    // Tipo menaje → dentro del banner del título de menú
    const tipoMenaje = comanda.tipo_menaje;
    if (el('detalleMenuTitulo') && tipoMenaje) {
        const label = tipoMenaje === 'loza' ? 'LOZA' : tipoMenaje === 'desechable' ? 'DESECHABLE' : tipoMenaje.toUpperCase();
        // Añadir span al mismo h3 del banner (flex: 1 empuja el span a la derecha)
        el('detalleMenuTitulo').innerHTML = nombreMenu + `<span class="detalle-menaje-inline">${label}</span>`;
    }
    if (el('detalleMenuPrincipal')) {
        el('detalleMenuPrincipal').innerHTML = _renderMenuDetalle(comanda, comanda.pax);
    }

    // ── Menús adicionales ───────────────────────────────────
    const secAdi = el('detalleMenusAdicionalesSection');
    const contAdi = el('detalleMenusAdicionales');
    if (comanda.menus_adicionales?.length > 0) {
        if (secAdi) secAdi.style.display = '';
        if (contAdi) {
            contAdi.innerHTML = comanda.menus_adicionales.map(m =>
                `<div class="detalle-menu-row">
                    <span class="detalle-menu-nombre es-titulo">+ ${m.nombre || ''}</span>
                    <span class="detalle-menu-cantidad">${m.pax_adicional || m.pax || ''} pax</span>
                </div>`
            ).join('');
        }
    } else {
        if (secAdi) secAdi.style.display = 'none';
    }

    // ── Referencias Foodbox/Comida — ocultar (ya en _renderMenuDetalle) ─
    const secRef = el('detalleReferenciasSection');
    if (secRef) secRef.style.display = 'none';

    // ── Multiplicadores — ocultar (ya en el menú) ──────────
    const secMul = el('detalleMultiplicadoresSection');
    if (secMul) secMul.style.display = 'none';

    // ── Notas adicionales ───────────────────────────────────
    const secNotas = el('detalleNotasSection');
    const divNotas = el('detalleNotas');
    const notasTexto = comanda.alergias?.notas || '';
    if (notasTexto) {
        if (secNotas) secNotas.style.display = '';
        if (divNotas) divNotas.textContent = notasTexto;
    } else {
        if (secNotas) secNotas.style.display = 'none';
    }

    // ── Datos de entrega (logística inline) ──────────────────
    const secEntrega  = el('detalleDatosLogisticaSection');
    const contEntrega = el('detalleDatosLogisticaContent');
    if (secEntrega && contEntrega) {
        // Los datos de entrega vienen de comanda.logistica cuando tiene campos de formulario
        // (no arrays de bebidas/menaje), o de comanda.logistica_inline
        const logInline = comanda.logistica_inline ||
            (comanda.logistica && !Array.isArray(comanda.logistica.bebidas) &&
             (comanda.logistica.nombre_contacto || comanda.logistica.direccion)
                ? comanda.logistica : null);

        const campos = [
            { label: 'Contacto',      valor: logInline?.nombre_contacto },
            { label: 'Teléfono',      valor: logInline?.telefono_contacto },
            { label: 'Hora Entrega',  valor: logInline?.hora_entrega },
            { label: 'Hora Evento',   valor: logInline?.hora_evento },
            { label: 'Dirección',     valor: logInline?.direccion },
            { label: 'Cód. Postal',   valor: logInline?.codigo_postal },
            { label: 'Notas',         valor: logInline?.notas_logistica },
        ].filter(c => c.valor);

        if (campos.length) {
            secEntrega.style.display = '';
            const li = logInline;

            // Fila 1: datos de contacto y horarios
            const fila1 = [
                { label: 'Contacto',     valor: li?.nombre_contacto },
                { label: 'Telefono',     valor: li?.telefono_contacto },
                { label: 'Hora Entrega', valor: li?.hora_entrega },
                { label: 'Hora Evento',  valor: li?.hora_evento },
            ].filter(c => c.valor);

            // Fila 2: direccion full-width + CP
            const tieneDireccion = li?.direccion;
            const tieneCP = li?.codigo_postal;
            const tieneNotas = li?.notas_logistica;

            // Fila 1 — Contacto, Teléfono, Hora Entrega, Hora Evento  (tabla para control de anchos)
            let html = `<table style="width:100%; border-collapse:collapse; padding: 6px 14px 0; display:block;">
                <tr>`;
            fila1.forEach(c => {
                html += `<td style="padding: 4px 8px 6px; vertical-align:top; width:25%;">
                    <div class="detalle-field-label">${c.label}</div>
                    <div class="detalle-field-value" style="word-break:break-word;">${c.valor}</div>
                </td>`;
            });
            html += `</tr></table>`;

            // Fila 2 — Dirección (ancha) + Cód. Postal
            if (tieneDireccion || tieneCP) {
                html += `<table style="width:100%; border-collapse:collapse; padding: 0 14px 6px; display:block; border-top:1px solid #f1f5f9;">
                    <tr>`;
                if (tieneDireccion) {
                    html += `<td style="padding: 4px 8px 4px; vertical-align:top;">
                        <div class="detalle-field-label">Dirección</div>
                        <div class="detalle-field-value" style="word-break:break-word;">${tieneDireccion}</div>
                    </td>`;
                }
                if (tieneCP) {
                    html += `<td style="padding: 4px 8px 4px; vertical-align:top; width:110px; white-space:nowrap;">
                        <div class="detalle-field-label">Cód. Postal</div>
                        <div class="detalle-field-value">${tieneCP}</div>
                    </td>`;
                }
                html += `</tr></table>`;
            }

            contEntrega.innerHTML = html;
        } else {
            secEntrega.style.display = 'none';
        }
    }

    // ── Logística y material ─────────────────────────────────
    const secLog  = el('detalleLogisticaSection');
    const contLog = el('detalleLogisticaContent');
    if (secLog && contLog) {
        // material_logistica = guardado en Supabase con todo el material
        // logistica = puede venir en memoria desde main.js con el material
        const log = comanda.material_logistica ||
                    (comanda.logistica?.bebidas ? comanda.logistica : null);
        const tieneItems = log && (
            (log.bebidas || []).some(i => i.checked !== false) ||
            (log.menaje  || []).some(i => i.checked !== false) ||
            (log.extras  || []).some(i => i.checked !== false)
        );

        if (tieneItems) {
            secLog.style.display = '';

            function renderColMaterial(icono, titulo, items) {
                if (!items?.length) return '';
                const filtrados = items.filter(it => it.checked !== false && (it.cantidad ?? 0) > 0);
                if (!filtrados.length) return '';
                let h = `<div class="dc-material-col">
                    <h5>${icono} ${titulo}</h5>
                    <div class="dc-material-list">`;
                filtrados.forEach(it => {
                    h += `<div class="dc-material-item">
                        <span class="dc-material-nombre">${it.nombre}</span>
                        <span class="dc-material-cantidad">${it.cantidad ?? 0}</span>
                        <span class="dc-material-unidad">${it.unidad || 'uds'}</span>
                    </div>`;
                    (it.subitems_selected || []).forEach(sub => {
                        h += `<div class="dc-material-item" style="padding-left:10px; opacity:0.85;">
                            <span class="dc-material-nombre" style="font-size:0.72rem; color:#64748b;">↳ ${sub.nombre}</span>
                            <span class="dc-material-cantidad" style="font-size:0.72rem;">${sub.cantidad ?? 0}</span>
                            <span class="dc-material-unidad" style="font-size:0.72rem;">${sub.unidad || 'uds'}</span>
                        </div>`;
                    });
                });
                h += `</div></div>`;
                return h;
            }

            contLog.innerHTML = `<div class="dc-material-grid">
                ${renderColMaterial('🥤', 'Bebidas', log.bebidas)}
                ${renderColMaterial('🍽️', 'Menaje',  log.menaje)}
                ${renderColMaterial('✨', 'Extras',  log.extras)}
            </div>`;
        } else {
            secLog.style.display = 'none';
        }
    }

    // ── Campos de sistema (estado, versión, fechas) ─────────
    if (el('detalleEstado')) el('detalleEstado').textContent =
        comanda.estado ? comanda.estado.charAt(0).toUpperCase() + comanda.estado.slice(1) : '—';
    if (el('detalleVersion')) el('detalleVersion').textContent = `v${comanda.version || '1'}`;
    if (el('detalleFechaCreacion') && comanda.fecha_creacion) {
        el('detalleFechaCreacion').textContent = new Date(comanda.fecha_creacion)
            .toLocaleDateString('es-ES', { day:'2-digit', month:'2-digit', year:'numeric', hour:'2-digit', minute:'2-digit' });
    }
    if (el('detalleFechaModificacion')) {
        el('detalleFechaModificacion').textContent = comanda.fecha_modificacion
            ? new Date(comanda.fecha_modificacion).toLocaleDateString('es-ES', { day:'2-digit', month:'2-digit', year:'numeric', hour:'2-digit', minute:'2-digit' })
            : 'No modificada';
    }
}

/**
 * Edita una comanda existente
 */
function editarComanda() {
    const codigo = document.getElementById('detalleCodigo').textContent;
    window.comandaEditando = obtenerComandaDelHistorial(codigo);

    if (!window.comandaEditando) {
        alert('Comanda no encontrada');
        return;
    }

    // Cargar datos básicos
    document.getElementById('empresa').value = window.comandaEditando.empresa || '';
    document.getElementById('responsable').value = window.comandaEditando.responsable || '';
    document.getElementById('pax').value = window.comandaEditando.pax || '';
    document.getElementById('hora_salida').value = window.comandaEditando.hora_salida || '';
    document.getElementById('fecha_evento').value = window.comandaEditando.fecha_evento || '';

    // Cargar notas si el campo existe
    const notasInput = document.getElementById('alergias_notas');
    if (notasInput && window.comandaEditando.alergias) {
        notasInput.value = window.comandaEditando.alergias.notas || '';
    }

    // Cambiar a la vista de formulario
    document.getElementById('detalleComanda').style.display = 'none';
    document.getElementById('comandaForm').style.display = 'block';
    document.getElementById('dashboard').style.display = 'none';

    // Cambiar texto del botón
    const submitBtn = document.querySelector('#comandaCocinaForm button[type="submit"]');
    if (submitBtn) {
        submitBtn.textContent = '💾 Guardar Cambios';
    }

    // NOTA: La carga de menús, referencias y multiplicadores 
    // debería manejarse automáticamente cuando el usuario
    // seleccione la categoría correspondiente
    console.log('Comanda cargada para edición:', window.comandaEditando.codigo);
}

/**
 * Imprime la comanda actual
 */
function imprimirComanda() {
    window.print();
}

/**
 * Elimina una comanda
 */
function eliminarComanda() {
    const codigo = document.getElementById('detalleCodigo').textContent;

    if (confirm(`¿Estás seguro de que deseas eliminar la comanda ${codigo}? Esta acción no se puede deshacer.`)) {
        eliminarComandaDelHistorial(codigo);
        alert(`Comanda ${codigo} eliminada correctamente`);
        
        if (typeof volverAlHistorial === 'function') {
            volverAlHistorial();
        }
    }
}


/**
 * Busca la comanda en Supabase (datos frescos) o localStorage y muestra el detalle.
 * Usada al guardar una nueva comanda para abrirla inmediatamente.
 */
async function verDetalleComandaPorCodigo(codigo) {
    let comanda = null;

    // 1) Intentar desde Supabase (datos más frescos)
    if (window.supabaseClient && window.currentUser?.id) {
        try {
            const { data, error } = await window.supabaseClient
                .from('orders')
                .select('payload')
                .contains('payload', { codigo })
                .limit(1);
            if (!error && data && data.length > 0) {
                comanda = data[0].payload;
            }
        } catch(e) { /* fallback a local */ }
    }

    // 2) Fallback: localStorage
    if (!comanda) {
        comanda = obtenerComandaDelHistorial(codigo);
    }

    if (!comanda) {
        console.warn('Comanda no encontrada:', codigo);
        if (typeof volverAlDashboard === 'function') volverAlDashboard();
        return;
    }

    // Mostrar la sección de historial+detalle y ocultar el resto
    const historialPage = document.getElementById('historialPage');
    if (historialPage) historialPage.style.display = 'none';

    const detalleEl = document.getElementById('detalleComanda');
    if (detalleEl) detalleEl.style.display = 'block';

    // Reutilizar verDetalleComanda pasándole directamente el objeto
    _renderDetalleComanda(comanda);
}
