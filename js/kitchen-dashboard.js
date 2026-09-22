// ========== KITCHEN DASHBOARD: UI y acciones operativas de cocina ==========

function getHistorialCocinaModulo() {
    return window.CaterCloudStorage.leerHistorialComandasLocal();
}

function guardarHistorialCocinaModulo(historial) {
    window.CaterCloudStorage.guardarHistorialComandasLocal(historial || []);
}

function getFechaCocinaItem(item) {
    return String(item?.fecha_evento || item?.fecha_creacion || '').split('T')[0];
}

function getEventoCocinaPorIndiceOCodigo(index, codigo = '') {
    const listas = [
        window.cocinaEventosActivos || [],
        getEventosCocinaActivos()
    ];
    const codigoBuscado = String(codigo || '');
    if (codigoBuscado) {
        for (const lista of listas) {
            const encontrado = (lista || []).find(item => String(getCodigoOperativo(item)) === codigoBuscado);
            if (encontrado) return encontrado;
        }
    }
    return (window.cocinaEventosActivos || getEventosCocinaActivos())[index];
}

function getEventosCocinaActivos() {
    return getHistorialCocinaModulo()
        .map((item, index) => ({
            ...item,
            _cocinaIndex: index,
            kitchen_status: getEstadoCocinaOperativo(item),
            kitchen_assigned_to: item.kitchen_assigned_to || '',
            kitchen_items_state: item.kitchen_items_state || {},
            kitchen_items_updates: item.kitchen_items_updates || {},
            kitchen_produced_items: Number(item.kitchen_produced_items || 0)
        }))
        .filter(item => {
            if (item.tipo_registro === 'logistica') return false;
            if (['anulada', 'eliminada'].includes(item.estado) || ['anulada', 'eliminada'].includes(item.estado_pedido)) return false;
            return getMenusCocinaComanda(item).length > 0;
        })
        .sort((a, b) => {
            return compararEventosPorSalidaAscendente(a, b, getFechaCocinaItem);
        });
}

window.verificarCocinaCaterCloud = async function verificarCocinaCaterCloud() {
    if (typeof window.cargarHistorialRemotoSupabase === 'function') {
        await window.cargarHistorialRemotoSupabase({ render: false });
    }
    const historial = getHistorialCocinaModulo();
    const eventos = getEventosCocinaActivos();
    const inputFecha = document.getElementById('cocinaFiltroFecha')?.value || '';
    const fechaFiltro = inputFecha || getFechaLocalHoyDashboard();
    const periodo = inputFecha ? 'dia' : (window.cocinaFiltroPeriodo || 'hoy');
    const visiblesFecha = eventos.filter(item => getFechaCocinaItem(item) === fechaFiltro);
    const visiblesTodo = filtrarEventosPorPeriodoDashboard(eventos, getFechaCocinaItem, 'cocinaFiltroFecha', 'todo');
    const visiblesPeriodoActual = filtrarEventosPorPeriodoDashboard(eventos, getFechaCocinaItem, 'cocinaFiltroFecha', periodo);
    const sinMenuProduccion = historial.filter(item => {
        if (item.tipo_registro === 'logistica') return false;
        if (['anulada', 'eliminada'].includes(item.estado) || ['anulada', 'eliminada'].includes(item.estado_pedido)) return false;
        return getMenusCocinaComanda(item).length === 0;
    });

    return {
        usuario: getUsuarioActualEmailDashboard() || null,
        lecturaSupabase: window._ultimoHistorialRemotoOk || null,
        errorSupabase: window._ultimoHistorialRemotoError || null,
        filtroPeriodoCocina: periodo,
        filtroFechaCocina: fechaFiltro,
        historialLocalTotal: historial.length,
        comandasCocinaActivas: eventos.length,
        visiblesEnFecha: visiblesFecha.length,
        visiblesEnTodo: visiblesTodo.length,
        visiblesPeriodoActual: visiblesPeriodoActual.length,
        codigosDuplicadosSupabase: window._ultimoHistorialRemotoOk?.codigosDuplicados || [],
        sinMenuProduccion: sinMenuProduccion.length,
        ultimasComandas: eventos.slice(0, 8).map(item => ({
            codigo: item.codigo || item.codigo_comanda || '',
            empresa: item.empresa || item.company_name || '',
            fecha_evento: item.fecha_evento || '',
            hora_salida: item.hora_salida || '',
            menus: getResumenMenusConPax(item),
            estado: item.estado || item.estado_cocina || item.kitchen_status || ''
        }))
    };
};

function guardarEventoCocinaActivo(evento) {
    if (!evento) return;
    const historial = getHistorialCocinaModulo();
    const index = evento._cocinaIndex;
    if (!historial[index]) return;

    historial[index] = {
        ...historial[index],
        kitchen_status: normalizarEstadoCocina(evento.kitchen_status),
        estado_cocina: normalizarEstadoCocina(evento.kitchen_status),
        kitchen_assigned_to: evento.kitchen_assigned_to || '',
        kitchen_items_state: evento.kitchen_items_state || {},
        kitchen_items_updates: evento.kitchen_items_updates || {},
        kitchen_produced_items: getProducidosCocina(evento),
        kitchen_action_log: evento.kitchen_action_log || [],
        kitchen_revision_notice: Object.prototype.hasOwnProperty.call(evento, 'kitchen_revision_notice') ? evento.kitchen_revision_notice : (historial[index].kitchen_revision_notice || null),
        operational_revision_log: evento.operational_revision_log || historial[index].operational_revision_log || [],
        kitchen_completed_confirmed_at: evento.kitchen_completed_confirmed_at || null,
        kitchen_completed_confirmed_by: evento.kitchen_completed_confirmed_by || ''
    };

    if (evento.kitchen_ready_at) historial[index].kitchen_ready_at = evento.kitchen_ready_at;
    if (evento.kitchen_ready_by) historial[index].kitchen_ready_by = evento.kitchen_ready_by;
    historial[index].fecha_modificacion = evento.fecha_modificacion || getTimestampOperativoDashboard();
    guardarHistorialCocinaModulo(historial);
    sincronizarAccionesOperativasSupabase(historial[index].codigo || historial[index].codigo_comanda, {
        kitchen_status: historial[index].kitchen_status,
        estado_cocina: historial[index].estado_cocina,
        kitchen_assigned_to: historial[index].kitchen_assigned_to || '',
        kitchen_items_state: historial[index].kitchen_items_state || {},
        kitchen_items_updates: historial[index].kitchen_items_updates || {},
        kitchen_produced_items: historial[index].kitchen_produced_items || 0,
        kitchen_action_log: historial[index].kitchen_action_log || [],
        kitchen_revision_notice: historial[index].kitchen_revision_notice || null,
        operational_revision_log: historial[index].operational_revision_log || [],
        kitchen_completed_confirmed_at: historial[index].kitchen_completed_confirmed_at || null,
        kitchen_completed_confirmed_by: historial[index].kitchen_completed_confirmed_by || '',
        kitchen_ready_at: historial[index].kitchen_ready_at || null,
        kitchen_ready_by: historial[index].kitchen_ready_by || ''
    });
}

function actualizarKpisCocina(eventos) {
    const counts = { sin_producir: 0, en_produccion: 0, listo: 0 };
    (eventos || []).forEach(item => {
        const estado = getEstadoCocinaOperativo(item);
        if (counts[estado] !== undefined) counts[estado]++;
    });

    const setText = (id, value) => {
        const el = document.getElementById(id);
        if (el) el.textContent = String(value);
    };

    setText('cocinaKpiPendientes', counts.sin_producir);
    setText('cocinaKpiProceso', counts.en_produccion);
    setText('cocinaKpiListas', counts.listo);
}

function renderizarComandasCocina() {
    const cont = document.getElementById('cocinaComandasList');
    if (!cont) return;
    const canEdit = puedeEditarCocina();

    const eventos = getEventosCocinaActivos();
    const fechaFiltro = document.getElementById('cocinaFiltroFecha')?.value || '';
    const periodo = fechaFiltro ? 'dia' : (window.cocinaFiltroPeriodo || 'hoy');
    const eventosFiltrados = filtrarEventosPorPeriodoDashboard(eventos, getFechaCocinaItem, 'cocinaFiltroFecha', periodo);

    window.cocinaEventosActivos = eventosFiltrados;
    actualizarKpisCocina(eventosFiltrados);
    actualizarBotonesPeriodoDashboard('cocina', periodo);
    refrescarAlertasOperativasGlobales();

    if (!eventos.length) {
        cont.innerHTML = '<div class="logistics-empty">Aun no hay comandas activas en cocina.</div>';
        return;
    }

    if (!eventosFiltrados.length) {
        cont.innerHTML = '<div class="logistics-empty">No hay comandas de cocina para el dia seleccionado.</div>';
        return;
    }

    cont.innerHTML = eventosFiltrados.slice(0, 40).map((item, index) => {
        const codigoArg = getCodigoOperativoJsArg(item);
        const menus = getMenusCocinaComanda(item);
        const totalItems = getTotalItemsProduccionCocina(item);
        const producidos = Math.min(getProducidosCocina(item), totalItems);
        const estado = getEstadoCocinaOperativo(item);
        const estadoClase = getClaseEstadoCocina(estado);
        const progreso = totalItems ? Math.min(100, Math.round((producidos / totalItems) * 100)) : 0;
        const responsable = item.kitchen_assigned_to || '';
        const fecha = item.fecha_evento || item.fecha_creacion || '';
        const horaSalida = getHoraSalidaItem(item);
        const menuResumen = getResumenMenusConPax(item);
        const tieneAlertaSalida = pedidoTieneAlertaSalida(item, estado);
        const alertaSalida = tieneAlertaSalida ? getAlertaSalidaHtml(item, estado) : '';
        const confirmado = pedidoOperativoConfirmado(item);
        const puedeOperar = canEdit && confirmado;

        return `
            <article class="logistics-event-card kitchen-event-card ${tieneAlertaSalida ? 'logistics-event-card--urgent' : ''}" onclick="abrirProduccionCocina(${index}, ${codigoArg})">
                <div class="logistics-event-main">
                    <div>
                        <div class="logistics-event-title-row">
                            <strong>${escapeLogisticaHtml(item.codigo || item.codigo_comanda || 'Sin codigo')}</strong>
                            <span>${escapeLogisticaHtml(fecha || 'Sin fecha')}</span>
                            ${getConfirmacionOperativaHtml(item)}
                            <span class="logistics-status-pill logistics-status-pill--${estadoClase}">${getLabelEstadoCocina(estado)}</span>
                        </div>
                        <div class="logistics-event-detail-row">
                            <span>${escapeLogisticaHtml(item.empresa || item.company_name || 'Sin empresa')} · ${menuResumen}</span>
                            <span class="logistics-event-quick-meta">
                                <b>Salida ${escapeLogisticaHtml(horaSalida || '-')}</b>
                                <span>${totalItems} items</span>
                            </span>
                        </div>
                    </div>
                </div>

                ${alertaSalida}

                <div class="logistics-progress-row">
                    <span>${producidos} producidos</span>
                    <div class="logistics-progress-bar ${progreso >= 100 ? 'is-complete' : ''}"><span style="width:${progreso}%"></span></div>
                    <span>${progreso}%</span>
                </div>

                <div class="logistics-event-controls">
                    <label>
                        Responsable
                        <input type="text" value="${escapeLogisticaHtml(responsable)}" placeholder="Asignar persona"
                            ${puedeOperar ? '' : 'disabled'}
                            onclick="event.stopPropagation()"
                            onchange="actualizarResponsableCocina(${index}, this.value, ${codigoArg})">
                    </label>
                    <label>
                        Estado
                        <select ${puedeOperar ? '' : 'disabled'} onclick="event.stopPropagation()" onchange="actualizarEstadoCocina(${index}, this.value, ${codigoArg})">
                            <option value="sin_producir" ${estado === 'sin_producir' ? 'selected' : ''}>Sin producir</option>
                            <option value="en_produccion" ${estado === 'en_produccion' ? 'selected' : ''}>En produccion</option>
                            <option value="listo" ${estado === 'listo' ? 'selected' : ''}>Listo para salida</option>
                        </select>
                    </label>
                    <button type="button" class="btn-secondary" onclick="event.stopPropagation(); abrirProduccionCocina(${index}, ${codigoArg})">Produccion</button>
                </div>
            </article>
        `;
    }).join('');
}

function abrirProduccionCocina(index, codigo = '') {
    const item = getEventoCocinaPorIndiceOCodigo(index, codigo);
    const modal = document.getElementById('cocinaProduccionModal');
    const content = document.getElementById('cocinaProduccionContent');
    if (!item || !modal || !content) return;
    const canEdit = puedeEditarCocina() && pedidoOperativoConfirmado(item);
    const codigoArg = getCodigoOperativoJsArg(item);

    const grupos = getProduccionCocinaDetalle(item);
    const totalItems = getTotalItemsProduccionCocina(item);
    const producidos = getProducidosCocina(item);
    const estado = getEstadoCocinaOperativo(item);
    const confirmacionHtml = getConfirmacionCompletadoHtml(
        'cocina',
        index,
        item.kitchen_completed_confirmed_at,
        totalItems,
        producidos,
        codigoArg
    );

    content.innerHTML = `
        <div class="logistics-prep-header">
            <div>
                <h2>${escapeLogisticaHtml(item.empresa || item.codigo || 'Cocina')}</h2>
                <p>${escapeLogisticaHtml(item.codigo || item.codigo_comanda || '')} · ${item.pax || 0} pax · ${escapeLogisticaHtml(item.fecha_evento || 'Sin fecha')} · Salida ${escapeLogisticaHtml(item.hora_salida || '-')}</p>
            </div>
        </div>

        <div class="logistics-prep-state">
            <label>Estado general:</label>
            <select ${canEdit ? '' : 'disabled'} onchange="actualizarEstadoCocina(${index}, this.value, ${codigoArg}); abrirProduccionCocina(${index}, ${codigoArg});">
                <option value="sin_producir" ${estado === 'sin_producir' ? 'selected' : ''}>Sin producir</option>
                <option value="en_produccion" ${estado === 'en_produccion' ? 'selected' : ''}>En produccion</option>
                <option value="listo" ${estado === 'listo' ? 'selected' : ''}>Listo para salida</option>
            </select>
        </div>

        ${getConfirmacionOperativaHtml(item, 'banner')}

        <div class="logistics-progress-row kitchen-prep-progress">
            <span>${producidos} producidos</span>
            <div class="logistics-progress-bar ${totalItems && producidos >= totalItems ? 'is-complete' : ''}"><span style="width:${totalItems ? Math.round((producidos / totalItems) * 100) : 0}%"></span></div>
            <span>${totalItems} items</span>
        </div>

        ${renderRevisionOperativaNotice(item, 'cocina')}

        ${canEdit ? confirmacionHtml : ''}

        ${renderizarIntoleranciasCocinaHtml(item)}

        ${grupos.map(grupo => renderizarGrupoProduccionCocina(index, grupo, item.kitchen_items_state || {}, canEdit, codigoArg)).join('') || '<div class="logistics-empty">Esta comanda no tiene items de cocina para producir.</div>'}

        ${renderActividadOperativaHtml(item, 'cocina')}

        <div class="logistics-prep-actions">
            <button type="button" class="btn-secondary" onclick="cerrarProduccionCocina()">Cerrar</button>
            ${canEdit ? `<button type="button" class="btn-primary" onclick="guardarCambiosProduccionCocina(${index}, ${codigoArg})">Guardar cambios</button>` : ''}
        </div>
    `;

    modal.style.display = 'block';
}

function renderizarGrupoProduccionCocina(index, grupo, state, canEdit = true, codigoArg = "''") {
    const gruposPorTipo = grupo.items.reduce((acc, item) => {
        if (!acc[item.grupo]) acc[item.grupo] = [];
        acc[item.grupo].push(item);
        return acc;
    }, {});

    return `
        <section class="logistics-prep-group kitchen-prep-group">
            <h3>${escapeLogisticaHtml(grupo.menu.nombre || 'Menu')} · ${grupo.menu.pax || 0} pax</h3>
            ${Object.entries(gruposPorTipo).map(([titulo, items]) => `
                <div class="kitchen-prep-subgroup">
                    <strong>${escapeLogisticaHtml(titulo)}</strong>
                    <div class="logistics-prep-list">
                        ${items.map(item => renderizarItemProduccionCocina(index, item, !!state[item.key], canEdit, codigoArg)).join('')}
                    </div>
                </div>
            `).join('')}
        </section>
    `;
}

function renderizarItemProduccionCocina(index, item, producido, canEdit = true, codigoArg = "''") {
    const evento = getEventoCocinaPorIndiceOCodigo(index, leerJsArgSeguro(codigoArg)) || {};
    const update = evento.kitchen_items_updates?.[item.key];
    const keyArg = getJsArg(item.key);
    const updateHtml = update
        ? `<small class="operative-quantity-change">${
            update.tipo === 'nuevo'
                ? 'Nuevo item'
                : `Antes: ${update.cantidad_before || 0} ${update.unidad || item.unidad || ''} | Ahora: ${update.cantidad_after || 0} ${update.unidad || item.unidad || ''}`
        }</small>`
        : '';
    const updateButton = update && update.tipo !== 'nuevo' && canEdit
        ? `<button type="button" class="operative-update-btn" onclick="event.preventDefault(); event.stopPropagation(); actualizarItemCocina(${index}, ${keyArg}, ${codigoArg})">Actualizar</button>`
        : '';
    return `
        <label class="logistics-prep-item kitchen-prep-item">
            <input type="checkbox" ${producido ? 'checked' : ''}
                ${canEdit ? '' : 'disabled'}
                onchange="toggleItemProduccionCocina(${index}, ${keyArg}, this.checked, ${codigoArg})">
            <span class="logistics-prep-check">${producido ? '✓' : ''}</span>
            <span class="logistics-prep-name">
                <strong>${item.iconClass ? `<span class="kitchen-intolerance-icon kitchen-intolerance-icon--${item.iconClass}"></span>` : ''}${escapeLogisticaHtml(getNombreIntoleranciaCocinaDisplay(item.nombre))}</strong>
                <small>${item.cantidad ? `${escapeLogisticaHtml(item.cantidad)} ${escapeLogisticaHtml(item.unidad || 'uds')}` : escapeLogisticaHtml(item.unidad || 'uds')}</small>
                ${updateHtml}
            </span>
            ${updateButton}
            <span class="logistics-status-pill logistics-status-pill--${producido ? 'listo' : 'sin_preparar'}">${producido ? 'Producido' : 'Pendiente'}</span>
        </label>
    `;
}

function cerrarProduccionCocina() {
    const modal = document.getElementById('cocinaProduccionModal');
    if (modal) modal.style.display = 'none';
}

function actualizarItemCocina(index, key, codigo = '') {
    if (!requireEditarCocina()) return;
    key = leerJsArgSeguro(key);
    codigo = leerJsArgSeguro(codigo);
    const item = getEventoCocinaPorIndiceOCodigo(index, codigo);
    if (!item?.kitchen_items_updates?.[key]) return;
    const update = item.kitchen_items_updates[key];
    delete item.kitchen_items_updates[key];
    registrarAccionOperativa(
        item,
        'cocina',
        'Actualizacion revisada',
        update.tipo === 'nuevo'
            ? `${update.nombre || key}: nuevo item revisado`
            : `${update.nombre || key}: ${update.cantidad_before || 0} -> ${update.cantidad_after || 0} ${update.unidad || ''}`.trim()
    );
    guardarEventoCocinaActivo(item);
    renderizarComandasCocina();
    abrirProduccionCocina(index, codigo);
}

function toggleItemProduccionCocina(index, key, checked, codigo = '') {
    if (!requireEditarCocina()) return;
    key = leerJsArgSeguro(key);
    codigo = leerJsArgSeguro(codigo);
    const item = getEventoCocinaPorIndiceOCodigo(index, codigo);
    if (!item) return;

    item.kitchen_items_state = item.kitchen_items_state || {};
    item.kitchen_items_state[key] = !!checked;
    const updatePendiente = item.kitchen_items_updates?.[key];
    if (checked && updatePendiente?.tipo === 'nuevo') {
        delete item.kitchen_items_updates[key];
    }
    const produccionItem = getProduccionCocinaDetalle(item)
        .flatMap(grupo => grupo.items)
        .find(detalle => detalle.key === key);
    registrarAccionOperativa(
        item,
        'cocina',
        checked && updatePendiente?.tipo === 'nuevo' ? 'Item nuevo producido' : (checked ? 'Item producido' : 'Item desmarcado'),
        produccionItem?.nombre || key
    );

    const total = getTotalItemsProduccionCocina(item);
    const producidos = getProducidosCocina(item);
    item.kitchen_produced_items = producidos;
    if (total > 0 && producidos >= total) item.kitchen_status = 'listo';
    else if (producidos > 0) item.kitchen_status = 'en_produccion';
    else item.kitchen_status = 'sin_producir';
    if (!checked || producidos < total) {
        item.kitchen_completed_confirmed_at = null;
        item.kitchen_completed_confirmed_by = '';
    }

    guardarEventoCocinaActivo(item);
    renderizarComandasCocina();
    abrirProduccionCocina(index, codigo);
}

function guardarCambiosProduccionCocina(index, codigo = '') {
    if (!requireEditarCocina()) return;
    codigo = leerJsArgSeguro(codigo);
    const item = getEventoCocinaPorIndiceOCodigo(index, codigo);
    if (!item) return;
    item.kitchen_items_state = item.kitchen_items_state || {};

    const total = getTotalItemsProduccionCocina(item);
    const producidos = getProducidosCocina(item);
    item.kitchen_produced_items = producidos;

    if (total > 0 && producidos >= total) {
        item.kitchen_status = 'listo';
        item.kitchen_ready_at = getTimestampOperativoDashboard();
        item.kitchen_ready_by = item.kitchen_assigned_to || '';
    } else if (producidos > 0) {
        item.kitchen_status = 'en_produccion';
    } else {
        item.kitchen_status = 'sin_producir';
    }

    guardarEventoCocinaActivo(item);
    renderizarComandasCocina();
    cerrarProduccionCocina();
}

function confirmarCompletadoCocina(index, codigo = '') {
    if (!requireEditarCocina()) return;
    codigo = leerJsArgSeguro(codigo);
    const item = getEventoCocinaPorIndiceOCodigo(index, codigo);
    if (!item) return;

    const total = getTotalItemsProduccionCocina(item);
    const producidos = getProducidosCocina(item);
    if (!total || producidos < total) {
        alert('Para confirmar, todos los items deben estar producidos.');
        return;
    }

    const ahora = getTimestampOperativoDashboard();
    item.kitchen_status = 'listo';
    item.estado_cocina = 'listo';
    item.kitchen_produced_items = producidos;
    item.kitchen_completed_confirmed_at = ahora;
    item.kitchen_completed_confirmed_by = getOperativeActorName();
    item.kitchen_ready_at = ahora;
    item.kitchen_ready_by = getOperativeActorName();
    item.kitchen_revision_notice = null;
    registrarAccionOperativa(item, 'cocina', 'Completado confirmado', `${producidos}/${total} items`);
    guardarEventoCocinaActivo(item);
    renderizarComandasCocina();
    abrirProduccionCocina(index, codigo);
}

function filtrarCocinaHoy() {
    window.cocinaFiltroPeriodo = 'hoy';
    const input = document.getElementById('cocinaFiltroFecha');
    if (input) input.value = getFechaLocalHoyDashboard();
    renderizarComandasCocina();
}

function filtrarCocinaSemana() {
    window.cocinaFiltroPeriodo = 'semana';
    const input = document.getElementById('cocinaFiltroFecha');
    if (input) input.value = '';
    renderizarComandasCocina();
}

function limpiarFiltroFechaCocina() {
    window.cocinaFiltroPeriodo = 'todo';
    const input = document.getElementById('cocinaFiltroFecha');
    if (input) input.value = '';
    renderizarComandasCocina();
}

function actualizarResponsableCocina(index, value, codigo = '') {
    if (!requireEditarCocina()) return;
    codigo = leerJsArgSeguro(codigo);
    const item = getEventoCocinaPorIndiceOCodigo(index, codigo);
    if (!item) return;
    item.kitchen_assigned_to = value || '';
    guardarEventoCocinaActivo(item);
    renderizarComandasCocina();
}

function actualizarEstadoCocina(index, value, codigo = '') {
    if (!requireEditarCocina()) return;
    codigo = leerJsArgSeguro(codigo);
    const item = getEventoCocinaPorIndiceOCodigo(index, codigo);
    if (!item) return;
    item.kitchen_status = normalizarEstadoCocina(value);
    item.kitchen_items_state = item.kitchen_items_state || {};
    registrarAccionOperativa(item, 'cocina', 'Estado actualizado', getLabelEstadoCocina(item.kitchen_status));

    if (item.kitchen_status === 'listo') {
        getProduccionCocinaDetalle(item).forEach(grupo => {
            grupo.items.forEach(produccionItem => {
                item.kitchen_items_state[produccionItem.key] = true;
            });
        });
        item.kitchen_produced_items = getTotalItemsProduccionCocina(item);
        item.kitchen_ready_at = getTimestampOperativoDashboard();
        item.kitchen_ready_by = item.kitchen_assigned_to || '';
    } else if (item.kitchen_status === 'sin_producir') {
        item.kitchen_items_state = {};
        item.kitchen_produced_items = 0;
        item.kitchen_completed_confirmed_at = null;
        item.kitchen_completed_confirmed_by = '';
    } else {
        item.kitchen_produced_items = getProducidosCocina(item);
        item.kitchen_completed_confirmed_at = null;
        item.kitchen_completed_confirmed_by = '';
    }
    guardarEventoCocinaActivo(item);
    renderizarComandasCocina();
}

function actualizarProducidosCocina(index, value) {
    if (!requireEditarCocina()) return;
    const item = (window.cocinaEventosActivos || [])[index];
    if (!item) return;
    const total = getTotalItemsProduccionCocina(item);
    const producidos = Math.max(0, Math.min(Number(value) || 0, total));
    item.kitchen_items_state = {};
    let contador = 0;
    getProduccionCocinaDetalle(item).forEach(grupo => {
        grupo.items.forEach(produccionItem => {
            if (contador < producidos) item.kitchen_items_state[produccionItem.key] = true;
            contador += 1;
        });
    });
    item.kitchen_produced_items = getProducidosCocina(item);
    if (total > 0 && producidos >= total) item.kitchen_status = 'listo';
    else if (producidos > 0) item.kitchen_status = 'en_produccion';
    else item.kitchen_status = 'sin_producir';
    guardarEventoCocinaActivo(item);
    renderizarComandasCocina();
}
