// ========== HISTORIAL DE COMANDA ==========

function leerHistorialComandasHistorial() {
    return window.CaterCloudStorage.leerHistorialComandasLocal();
}

function guardarHistorialComandasHistorial(historial) {
    window.CaterCloudStorage.guardarHistorialComandasLocal(historial || []);
}

function leerHistorialLogisticaHistorial() {
    return window.CaterCloudStorage.leerHistorialLogisticaLocal();
}

function guardarHistorialLogisticaHistorial(historial) {
    window.CaterCloudStorage.guardarHistorialLogisticaLocal(historial || []);
}

function getEstadoPedidoLabel(estado) {
    const labels = {
        creada: 'Creada',
        proceso: 'En proceso',
        completada: 'Completada',
        negociacion: 'En negociacion',
        por_confirmar: 'Por confirmar',
        confirmado: 'Confirmado',
        eliminada: 'Eliminada',
        anulada: 'Anulado'
    };

    return labels[estado] || (estado ? estado.charAt(0).toUpperCase() + estado.slice(1) : '-');
}

function getEstadoConfirmacionPedido(comanda = {}) {
    const estado = String(comanda.estado_confirmacion || comanda.confirmation_status || '').trim();
    if (estado === 'confirmado' || estado === 'por_confirmar' || estado === 'anulada') return estado;
    if (comanda.estado === 'confirmado' || comanda.estado === 'por_confirmar' || comanda.estado === 'anulada') return comanda.estado;
    return 'confirmado';
}

function tieneEstadoConfirmacionPedido(comanda = {}) {
    const estado = String(comanda.estado_confirmacion || comanda.confirmation_status || '').trim();
    return estado === 'confirmado' || estado === 'por_confirmar' || estado === 'anulada';
}

function getEstadoVisiblePedido(comanda = {}) {
    const estadoBase = comanda.estado || comanda.estado_pedido || 'creada';
    if (comanda.tipo_registro === 'solicitud') return estadoBase;
    if (estadoBase === 'anulada' || estadoBase === 'eliminada') return estadoBase;
    if (!tieneEstadoConfirmacionPedido(comanda)) return estadoBase;
    return getEstadoConfirmacionPedido(comanda);
}

function textoSeguro(valor) {
    return String(valor ?? '').replace(/[&<>"']/g, (char) => ({
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#39;'
    }[char]));
}

function renderDatosEntregaLogistica(datos = {}) {
    const direccionCompleta = datos.direccion || [datos.calle, datos.numero].filter(Boolean).join(', ');
    const direccionPartes = typeof window.separarDireccionLogistica === 'function'
        ? window.separarDireccionLogistica(direccionCompleta)
        : { calle: '', numero: '' };
    const calle = datos.calle || direccionPartes.calle || direccionCompleta;
    const numero = datos.numero || direccionPartes.numero || '';
    const campo = (label, valor, extraClass = '') => {
        if (!valor) return '';
        return `<div class="detalle-logistica-entrega-field ${extraClass}">
            <div class="detalle-field-label">${label}</div>
            <div class="detalle-field-value">${textoSeguro(valor)}</div>
        </div>`;
    };

    const campos = [
        campo('Contacto', datos.nombre_contacto, 'detalle-logistica-contacto'),
        campo('Telefono', datos.telefono_contacto, 'detalle-logistica-telefono'),
        campo('Duracion evento', datos.duracion_evento, 'detalle-logistica-duracion'),
        campo('Cantidad camareros', datos.cantidad_camareros, 'detalle-logistica-camareros'),
        campo('Hora Entrega', datos.hora_entrega, 'detalle-logistica-hora detalle-logistica-hora-entrega'),
        campo('Calle', calle, 'detalle-logistica-calle'),
        campo('Numero / Portal', numero, 'detalle-logistica-numero'),
        campo('Cod. Postal', datos.codigo_postal, 'detalle-logistica-cp'),
        campo('Montaje', datos.montaje, 'detalle-logistica-montaje'),
        campo('Hora Evento', datos.hora_evento, 'detalle-logistica-hora detalle-logistica-hora-evento')
    ].join('');

    if (!campos) return '';

    return `<div class="detalle-logistica-entrega-grid">
        ${campos}
    </div>`;
}

function getDatosEntregaLogisticaComanda(comanda = {}) {
    const salida = {};
    const fuentes = [
        comanda.logistica_inline,
        comanda.logistica,
        comanda.datos_entrega,
        comanda.delivery_data,
        comanda.delivery,
        comanda.entrega,
        comanda.logistica?.datos_entrega,
        comanda.logistica?.delivery_data,
        comanda.logistica?.entrega
    ];

    fuentes.forEach(fuente => {
        if (!fuente || typeof fuente !== 'object' || Array.isArray(fuente)) return;
        Object.entries(fuente).forEach(([key, value]) => {
            if (value === undefined || value === null) return;
            if (typeof value === 'object') return;
            if (String(value).trim() === '') return;
            salida[key] = value;
        });
    });

    const direccionCompleta = comanda.direccion_entrega || comanda.direccion || '';
    if (!salida.direccion && direccionCompleta) salida.direccion = direccionCompleta;
    if (!salida.calle && comanda.calle) salida.calle = comanda.calle;
    if (!salida.numero && (comanda.numero || comanda.portal)) salida.numero = comanda.numero || comanda.portal;
    if (!salida.codigo_postal && (comanda.codigo_postal || comanda.cp)) salida.codigo_postal = comanda.codigo_postal || comanda.cp;
    if (!salida.nombre_contacto && (comanda.nombre_contacto || comanda.contacto)) salida.nombre_contacto = comanda.nombre_contacto || comanda.contacto;
    if (!salida.telefono_contacto && (comanda.telefono_contacto || comanda.telefono)) salida.telefono_contacto = comanda.telefono_contacto || comanda.telefono;
    return salida;
}

function getClaseIconoIntolerancia(nombre = '') {
    const limpio = String(nombre || '').toLowerCase();
    if (limpio.includes('gluten')) return 'gluten';
    if (limpio.includes('lactosa')) return 'lactosa';
    if (limpio.includes('frutos')) return 'frutos';
    if (limpio.includes('huevo')) return 'huevo';
    if (limpio.includes('marisco')) return 'marisco';
    if (limpio.includes('vegetariano')) return 'vegetariano';
    if (limpio.includes('vegano')) return 'vegano';
    return 'otro';
}

function getNombreIntoleranciaDisplay(nombre = '') {
    const texto = String(nombre || '').trim();
    if (!texto) return '';
    return /^foodbox\b/i.test(texto) ? texto.replace(/^foodbox\b/i, 'FOODBOX') : `FOODBOX ${texto}`;
}

function getIconoIntoleranciaSrc(nombre = '') {
    const icono = getClaseIconoIntolerancia(nombre);
    const archivos = {
        gluten: 'gluten.svg',
        lactosa: 'lacteos.svg',
        frutos: 'frutos-cascara.svg',
        huevo: 'huevo.svg',
        marisco: 'crustaceos.svg',
        vegetariano: 'vegetariano.svg',
        vegano: 'vegano.svg',
        otro: 'otro.svg'
    };
    return `assets/icons/allergens/${archivos[icono] || archivos.otro}`;
}

function cargarHistorial() {
    const historial = leerHistorialComandasHistorial();
    const container = document.getElementById('comandasListHistorial') || document.getElementById('comandasList');

    const historialVisible = historial.filter(comanda => comanda.estado !== 'eliminada' && comanda.estado_pedido !== 'eliminada');

    if (historialVisible.length === 0) {
        container.innerHTML = '<p style="color: #94a3b8; text-align: center; font-size: 0.9rem; padding: 40px;">No hay comandas en el historial</p>';
        return;
    }

    historialVisible.sort((a, b) => new Date(b.fecha_creacion) - new Date(a.fecha_creacion));
    container.innerHTML = historialVisible.map(renderHistorialItem).join('');
}

function filtrarComandas() {
    const historial = leerHistorialComandasHistorial();
    const busqEl = document.getElementById('filtroBusquedaH') || document.getElementById('filtroBusqueda');
    const filtro = busqEl ? busqEl.value.toLowerCase() : '';
    const filtroFecha = document.getElementById('filtroFecha').value;
    const filtroEstado = document.getElementById('filtroEstado').value;

    const comandasFiltradas = historial.filter(comanda => {
        if (comanda.estado === 'eliminada' || comanda.estado_pedido === 'eliminada') return false;
        const empresa = (comanda.empresa || '').toLowerCase();
        const codigo = (comanda.codigo || '').toLowerCase();
        const responsable = (comanda.responsable || '').toLowerCase();

        const coincideBusqueda = !filtro ||
            empresa.includes(filtro) ||
            codigo.includes(filtro) ||
            responsable.includes(filtro);

        const coincideFecha = !filtroFecha ||
            (comanda.fecha_evento || '').split('T')[0] === filtroFecha;

        const coincideEstado = !filtroEstado ||
            comanda.estado === filtroEstado;

        return coincideBusqueda && coincideFecha && coincideEstado;
    });

    comandasFiltradas.sort((a, b) => new Date(b.fecha_creacion) - new Date(a.fecha_creacion));

    const container = document.getElementById('comandasListHistorial') || document.getElementById('comandasList');

    if (comandasFiltradas.length === 0) {
        container.innerHTML = '<p style="color: #94a3b8; text-align: center; font-size: 0.9rem; padding: 40px;">No se encontraron comandas con los filtros seleccionados</p>';
        return;
    }

    container.innerHTML = comandasFiltradas.map(renderHistorialItem).join('');
}

function renderHistorialItem(comanda) {
    const fechaCreacion = new Date(comanda.fecha_creacion);
    const fechaEvento = new Date(comanda.fecha_evento);
    const menuNombre = comanda.menu_principal?.nombre || comanda.menu_categoria_nombre || 'No especificado';
    const estado = getEstadoVisiblePedido(comanda);

    return `
        <div class="comanda-item" onclick="verExpedientePedido('${comanda.codigo}')">
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
            <div class="comanda-empresa">${comanda.empresa || 'Solicitud sin empresa'}</div>
            <div class="comanda-info">Responsable: ${comanda.responsable || 'Pendiente'}</div>
            <div class="comanda-info">${comanda.pax || comanda.pax_total || 0} PAX - Evento: ${fechaEvento.toLocaleDateString('es-ES')}</div>
            <div class="comanda-info">Menu principal: ${menuNombre}</div>
            <div class="comanda-estado estado-${estado}">
                ${getEstadoPedidoLabel(estado)}
            </div>
        </div>`;
}

function verDetalleComanda(codigo) {
    const comanda = obtenerComandaDelHistorial(codigo);
    if (!comanda) { alert('Comanda no encontrada'); return; }

    const dashboard = document.getElementById('dashboard');
    const comandaForm = document.getElementById('comandaForm');
    const historialPage = document.getElementById('historialPage');
    const detalleComanda = document.getElementById('detalleComanda');
    const expedientePedido = document.getElementById('expedientePedido');
    const cocinaPage = document.getElementById('cocinaPage');

    if (dashboard) dashboard.style.display = 'none';
    if (comandaForm) comandaForm.style.display = 'none';
    if (historialPage) historialPage.style.display = 'none';
    if (expedientePedido) expedientePedido.style.display = 'none';
    if (cocinaPage) cocinaPage.style.display = 'none';
    if (detalleComanda) detalleComanda.style.display = 'block';

    _renderDetalleComanda(comanda);
}

function verExpedientePedido(codigo) {
    const comanda = obtenerComandaDelHistorial(codigo);
    if (!comanda) { alert('Pedido no encontrado'); return; }

    const dashboard = document.getElementById('dashboard');
    const comandaForm = document.getElementById('comandaForm');
    const historialPage = document.getElementById('historialPage');
    const detalleComanda = document.getElementById('detalleComanda');
    const expedientePedido = document.getElementById('expedientePedido');
    const cocinaPage = document.getElementById('cocinaPage');

    if (dashboard) dashboard.style.display = 'none';
    if (comandaForm) comandaForm.style.display = 'none';
    if (historialPage) historialPage.style.display = 'none';
    if (detalleComanda) detalleComanda.style.display = 'none';
    if (cocinaPage) cocinaPage.style.display = 'none';
    if (expedientePedido) {
        expedientePedido.hidden = false;
        expedientePedido.style.display = 'block';
    }

    _renderExpedientePedido(comanda);
}

function _renderExpedientePedido(comanda) {
    const cont = document.getElementById('expedientePedidoContent');
    if (!cont) return;

    const fechaEvento = comanda.fecha_evento
        ? new Date(comanda.fecha_evento).toLocaleDateString('es-ES')
        : 'Sin fecha';
    const estado = comanda.estado || 'creada';
    const estadoLabel = getEstadoPedidoLabel(estado);
    const esSolicitud = comanda.tipo_registro === 'solicitud';
    const puedeCrearComanda = estado !== 'anulada';
    const puedeEditar = !window.AppPermissions || AppPermissions.canWrite();
    const archivosHtml = _renderArchivosSolicitud(comanda);
    const tieneLogistica = !!comanda.documentos?.logistica || _pedidoTieneComandaLogistica(comanda.codigo);
    const esComandaServicios = typeof _esComandaServicios === 'function' && _esComandaServicios(comanda);
    const tieneLogisticaSeparada = tieneLogistica && esComandaServicios;
    const puedeCrearLogistica = (!window.AppPermissions || AppPermissions.canCreateServiceLogistics()) &&
        !tieneLogistica &&
        esComandaServicios &&
        !esSolicitud &&
        estado !== 'anulada';
    const estadoConfirmacion = getEstadoConfirmacionPedido(comanda);
    const puedeConfirmarSolicitud = puedeEditar && esSolicitud && estado !== 'confirmado' && estado !== 'anulada';
    const puedeConfirmarComanda = puedeEditar && !esSolicitud && estadoConfirmacion === 'por_confirmar' && estado !== 'anulada';
    const puedeAnularPedido = puedeEditar && estado !== 'anulada';
    const estadoVisibleHeader = esSolicitud || !tieneEstadoConfirmacionPedido(comanda) ? estado : estadoConfirmacion;
    const notasPedido = comanda.notas_pedido || comanda.anotaciones_pedido || '';
    const accionesCarpetaHtml = puedeEditar ? `<div class="expediente-folder-actions">
                <button type="button" class="expediente-icon-btn expediente-icon-btn--edit" title="Editar carpeta" aria-label="Editar carpeta" onclick="mostrarEditorCarpetaExpediente('${comanda.codigo}')">
                    <span class="expediente-icon-symbol" aria-hidden="true">✎</span>
                </button>
                <button type="button" class="expediente-icon-btn expediente-icon-btn--delete" title="Eliminar carpeta" aria-label="Eliminar carpeta" onclick="eliminarCarpetaDesdeExpediente('${comanda.codigo}')">
                    <span class="expediente-icon-symbol" aria-hidden="true">×</span>
                </button>
            </div>` : '';
    const editorCarpetaHtml = puedeEditar ? _renderEditorCarpetaExpediente(comanda) : '';
    const accionesEstadoHtml = (puedeConfirmarSolicitud || puedeConfirmarComanda || puedeAnularPedido)
        ? `<div class="expediente-status-actions">
                    ${puedeConfirmarSolicitud ? `<button class="expediente-status-btn estado-confirmado" onclick="actualizarEstadoPedidoDesdeExpediente('${comanda.codigo}', 'confirmado')">Confirmar</button>` : ''}
                    ${puedeConfirmarComanda ? `<button class="expediente-status-btn estado-confirmado" onclick="actualizarEstadoConfirmacionComandaDesdeExpediente('${comanda.codigo}', 'confirmado')">Confirmar comanda</button>` : ''}
                    ${puedeAnularPedido ? `<button class="expediente-status-btn estado-anulada" onclick="actualizarEstadoPedidoDesdeExpediente('${comanda.codigo}', 'anulada')">Anular</button>` : ''}
                </div>`
        : '';
    const tituloExpediente = esSolicitud ? 'Solicitud por confirmar' : (comanda.codigo || 'Sin codigo');

    cont.innerHTML = `
        <div class="expediente-header">
            <div>
                <div class="expediente-label">Expediente de pedido</div>
                <h2>${tituloExpediente}</h2>
                <p>${comanda.empresa || 'Empresa pendiente'} - ${fechaEvento}</p>
            </div>
            <div class="expediente-header-side">
                ${accionesCarpetaHtml}
                <div class="comanda-estado estado-${estadoVisibleHeader}">
                    ${getEstadoPedidoLabel(estadoVisibleHeader)}
                </div>
            </div>
        </div>

        ${editorCarpetaHtml}

        <div class="expediente-grid">
            <section class="expediente-section">
                <h3>Datos del pedido</h3>
                <div class="expediente-fields">
                    <div><span>Empresa</span><strong>${comanda.empresa || '-'}</strong></div>
                    <div><span>Responsable</span><strong>${comanda.responsable || '-'}</strong></div>
                    <div><span>PAX</span><strong>${comanda.pax || comanda.pax_total || '-'}</strong></div>
                    <div><span>Hora salida</span><strong>${comanda.hora_salida || '-'}</strong></div>
                    <div><span>Menu</span><strong>${comanda.menu_principal?.nombre || comanda.menu_categoria_nombre || (esSolicitud ? 'Pendiente de definir' : '-')}</strong></div>
                    <div><span>Creado por</span><strong>${comanda.creado_por_nombre || comanda.responsable || '-'}</strong></div>
                    <div><span>Editado por</span><strong>${comanda.editado_por_nombre || comanda.editado_por || '-'}</strong></div>
                </div>
            </section>

            <section class="expediente-section">
                <h3>Operaciones</h3>
                <p class="expediente-muted">${esSolicitud ? 'Actualiza el estado de la solicitud o crea la comanda cuando se confirme.' : 'La comanda ya esta creada y se puede consultar.'}</p>
                ${accionesEstadoHtml}
                <div class="expediente-actions">
                    ${esSolicitud
                        ? (puedeCrearComanda && puedeEditar ? `<button class="btn-submit" onclick="convertirSolicitudEnComanda('${comanda.codigo}')">Crear comanda</button>` : '')
                        : `<button class="btn-submit" onclick="abrirComandaDesdeExpediente('${comanda.codigo}')">Abrir comanda</button>
                           ${tieneLogisticaSeparada ? `<button class="btn-submit" onclick="abrirComandaLogisticaDesdeExpediente('${comanda.codigo}')">Abrir comanda Logistica</button>` : ''}
                           ${puedeCrearLogistica ? `<button class="btn-submit" onclick="crearComandaLogisticaDesdeExpediente('${comanda.codigo}')">Crear comanda Logistica</button>` : ''}`}
                </div>
            </section>

            <section class="expediente-section expediente-section-wide">
                <h3>Anotaciones del pedido</h3>
                <textarea id="expedienteNotasPedido" class="expediente-notes-input"
                    ${puedeEditar ? '' : 'readonly'}
                    placeholder="Escribe aqui observaciones internas, seguimiento de cambios, llamadas o acuerdos con el cliente...">${textoSeguro(notasPedido)}</textarea>
                ${puedeEditar ? `<div class="expediente-notes-actions">
                    <button type="button" onclick="guardarAnotacionesPedido('${comanda.codigo}')">Guardar anotaciones</button>
                </div>` : ''}
            </section>

            <section class="expediente-section expediente-section-wide">
                <h3>Archivos</h3>
                ${archivosHtml}
            </section>
        </div>`;
}

function _renderEditorCarpetaExpediente(comanda) {
    const opcionesMenu = typeof getOpcionesMenuSolicitud === 'function'
        ? getOpcionesMenuSolicitud()
        : [];
    const menuActual = String(comanda.menu_categoria || comanda.menu_principal?.id || '');
    const opcionesHtml = opcionesMenu.map(menu => {
        const selected = String(menu.id) === menuActual ? 'selected' : '';
        return `<option value="${textoSeguro(menu.id)}" ${selected}>${textoSeguro(menu.nombre)}</option>`;
    }).join('');
    const fecha = (comanda.fecha_evento || '').split('T')[0];

    return `
        <section id="expedienteEditorCarpeta" class="expediente-section expediente-section-wide expediente-folder-editor" style="display:none;">
            <h3>Editar carpeta</h3>
            <div class="expediente-editor-grid">
                <label>
                    <span>Empresa</span>
                    <input type="text" id="expEditEmpresa" value="${textoSeguro(comanda.empresa || '')}">
                </label>
                <label>
                    <span>Fecha evento</span>
                    <input type="date" id="expEditFecha" value="${textoSeguro(fecha)}">
                </label>
                <label>
                    <span>Hora salida</span>
                    <input type="time" id="expEditHoraSalida" value="${textoSeguro(comanda.hora_salida || '')}">
                </label>
                <label>
                    <span>Menu</span>
                    <select id="expEditMenu">
                        <option value="">Selecciona menu</option>
                        ${opcionesHtml}
                    </select>
                </label>
                <label>
                    <span>PAX</span>
                    <input type="number" id="expEditPax" min="0" value="${Number(comanda.pax || comanda.pax_total || 0)}">
                </label>
            </div>
            <div class="expediente-editor-actions">
                <button type="button" class="btn-secondary" onclick="ocultarEditorCarpetaExpediente()">Cancelar</button>
                <button type="button" class="btn-submit" onclick="guardarEditorCarpetaExpediente('${comanda.codigo}')">Guardar cambios</button>
            </div>
        </section>`;
}

function mostrarEditorCarpetaExpediente(codigo) {
    const editor = document.getElementById('expedienteEditorCarpeta');
    if (!editor) return;
    editor.style.display = editor.style.display === 'none' ? 'block' : 'none';
    if (editor.style.display !== 'none') {
        document.getElementById('expEditEmpresa')?.focus();
    }
}

function ocultarEditorCarpetaExpediente() {
    const editor = document.getElementById('expedienteEditorCarpeta');
    if (editor) editor.style.display = 'none';
}

async function guardarEditorCarpetaExpediente(codigo) {
    if (window.AppPermissions && !AppPermissions.requireWrite('Tu usuario solo puede consultar. No puede editar carpetas.')) {
        return;
    }

    const empresa = (document.getElementById('expEditEmpresa')?.value || '').trim();
    const fechaEvento = document.getElementById('expEditFecha')?.value || '';
    const horaSalida = document.getElementById('expEditHoraSalida')?.value || '';
    const menuSelect = document.getElementById('expEditMenu');
    const menuId = menuSelect?.value || '';
    const menuNombre = menuSelect?.selectedOptions?.[0]?.textContent || '';
    const pax = Number(document.getElementById('expEditPax')?.value || 0) || 0;

    if (!empresa) {
        alert('Indica la empresa de la carpeta.');
        document.getElementById('expEditEmpresa')?.focus();
        return;
    }

    const ok = await actualizarComandaEnHistorial(codigo, {
        empresa,
        fecha_evento: fechaEvento,
        hora_salida: horaSalida,
        pax,
        pax_total: pax,
        menu_categoria: menuId,
        menu_categoria_nombre: menuNombre || 'Pendiente',
        menu_principal: menuId ? { id: menuId, nombre: menuNombre } : null
    });

    if (!ok) {
        alert('No se pudo actualizar la carpeta.');
        return;
    }

    if (typeof cargarCalendario === 'function') cargarCalendario();
    verExpedientePedido(codigo);
}

async function eliminarCarpetaDesdeExpediente(codigo) {
    if (window.AppPermissions && !AppPermissions.requireWrite('Tu usuario solo puede consultar. No puede eliminar carpetas.')) {
        return;
    }

    const pedido = typeof obtenerComandaDelHistorial === 'function' ? obtenerComandaDelHistorial(codigo) : null;
    if (!pedido) {
        alert('No se encontro la carpeta.');
        return;
    }

    if (!confirm(`Eliminar la carpeta ${codigo}? Esta accion no se puede deshacer.`)) return;

    if (typeof eliminarComandaDelHistorial === 'function') {
        eliminarComandaDelHistorial(codigo);
    }

    const historialLogistica = leerHistorialLogisticaHistorial();
    const filtradoLogistica = historialLogistica.filter(item =>
        (item.codigo_cocina || item.codigo_original || item.codigo) !== codigo
    );
    guardarHistorialLogisticaHistorial(filtradoLogistica);

    if (window.supabaseClient) {
        try {
            await window.marcarComandaEliminadaEnSupabase?.(codigo, pedido);
        } catch (error) {
            console.warn('No se pudo eliminar la carpeta en Supabase:', error);
            alert('La carpeta se elimino localmente, pero no se pudo sincronizar la eliminacion con Supabase. Revisa permisos.');
        }
    }

    const expedientePedido = document.getElementById('expedientePedido');
    if (expedientePedido) {
        expedientePedido.hidden = true;
        expedientePedido.style.display = 'none';
    }
    if (typeof cargarCalendario === 'function') cargarCalendario();
    if (typeof volverAlDashboard === 'function') volverAlDashboard();
}

async function guardarAnotacionesPedido(codigo) {
    if (window.AppPermissions && !AppPermissions.requireWrite('Tu usuario solo puede consultar. No puede editar anotaciones.')) {
        return;
    }

    const notas = document.getElementById('expedienteNotasPedido')?.value || '';
    const ok = await actualizarComandaEnHistorial(codigo, {
        notas_pedido: notas,
        anotaciones_pedido: notas
    });

    if (!ok) {
        alert('No se pudieron guardar las anotaciones.');
        return;
    }

    verExpedientePedido(codigo);
}

function _pedidoTieneComandaLogistica(codigo) {
    const historialLogistica = leerHistorialLogisticaHistorial();
    if (historialLogistica.some(item => (item.codigo_cocina || item.codigo_original || item.codigo) === codigo)) return true;
    const pedido = typeof obtenerComandaDelHistorial === 'function' ? obtenerComandaDelHistorial(codigo) : null;
    return Boolean(pedido?.tiene_comanda_logistica || pedido?.documentos?.logistica || pedido?.logistica_creada || pedido?.logistica_inline || pedido?.material_logistica);
}

function _obtenerComandaLogisticaPorCodigo(codigo) {
    const historialLogistica = leerHistorialLogisticaHistorial();
    const index = historialLogistica.findIndex(item => (item.codigo_cocina || item.codigo_original || item.codigo) === codigo || item.codigo === codigo);
    const pedido = typeof obtenerComandaDelHistorial === 'function' ? obtenerComandaDelHistorial(codigo) : null;
    if (index >= 0) {
        const item = historialLogistica[index];
        const logPedido = getDatosEntregaLogisticaComanda(pedido || {});
        const logItem = getDatosEntregaLogisticaComanda(item || {});
        const materialPedido = pedido?.material_logistica || logPedido.material_logistica || {};
        return {
            item: {
                ...(pedido || {}),
                ...item,
                logistica: {
                    ...logPedido,
                    ...logItem
                },
                logistica_inline: {
                    ...logPedido,
                    ...logItem
                },
                material_logistica: item.material_logistica || materialPedido || {}
            },
            index,
            historial: historialLogistica
        };
    }

    if (!pedido) return null;

    const logistica = pedido.logistica_inline || pedido.logistica || {};
    const material = pedido.material_logistica || logistica.material_logistica || {};
    const tieneDatosLogistica = Boolean(
        pedido.tiene_comanda_logistica ||
        pedido.documentos?.logistica ||
        pedido.logistica_creada ||
        Object.values(logistica || {}).some(Boolean) ||
        ['bebidas', 'menaje', 'extras'].some(tipo => Array.isArray(material?.[tipo]) && material[tipo].length)
    );

    if (!tieneDatosLogistica) return null;

    return {
        item: {
            ...pedido,
            tipo_registro: 'logistica',
            codigo: pedido.documentos?.logistica?.codigo || pedido.codigo || codigo,
            codigo_cocina: pedido.codigo || codigo,
            codigo_original: pedido.documentos?.logistica?.codigo || pedido.codigo || codigo,
            logistica,
            material_logistica: material,
            estado: pedido.logistics_status || pedido.estado_logistica || pedido.estado || 'sin_preparar'
        },
        index: -1,
        historial: historialLogistica,
        embebida: true
    };
}

function _tieneDatosEntregaLogistica(comanda = {}) {
    const li = getDatosEntregaLogisticaComanda(comanda);
    return Boolean(
        li.nombre_contacto || li.telefono_contacto || li.montaje || li.duracion_evento ||
        li.cantidad_camareros || li.direccion || li.calle || li.numero || li.codigo_postal ||
        li.hora_entrega || li.hora_evento || li.notas_logistica
    );
}

function _normalizarMaterialLogisticaVista(material) {
    if (!material) return { bebidas: [], menaje: [], extras: [] };
    if (typeof material === 'string') {
        try {
            material = JSON.parse(material);
        } catch (_) {
            material = {};
        }
    }
    if (material.material_logistica) return _normalizarMaterialLogisticaVista(material.material_logistica);
    if (material.materialLogistica) return _normalizarMaterialLogisticaVista(material.materialLogistica);

    const base = {
        bebidas: Array.isArray(material.bebidas) ? material.bebidas : [],
        menaje: Array.isArray(material.menaje) ? material.menaje : [],
        extras: [
            ...(Array.isArray(material.extras) ? material.extras : []),
            ...(Array.isArray(material.otros) ? material.otros : []),
            ...(Array.isArray(material.material) ? material.material : [])
        ]
    };

    return typeof window.normalizarMaterialLogistica === 'function'
        ? window.normalizarMaterialLogistica(base)
        : base;
}

function _tieneMaterialLogisticaVista(material = {}) {
    const normalizado = _normalizarMaterialLogisticaVista(material);
    return ['bebidas', 'menaje', 'extras'].some(tipo => Array.isArray(normalizado?.[tipo]) && normalizado[tipo].length);
}

function _normalizarComandaLogisticaRemota(row, codigoBuscado) {
    const payload = row?.payload && typeof row.payload === 'object' ? row.payload : {};
    const logistica = getDatosEntregaLogisticaComanda(payload);
    const material = _normalizarMaterialLogisticaVista(
        payload.material_logistica ||
        payload.materialLogistica ||
        payload.logistica?.material_logistica ||
        payload.logistica_inline?.material_logistica ||
        {}
    );

    if (!_tieneDatosEntregaLogistica({ logistica }) && !_tieneMaterialLogisticaVista(material)) {
        return null;
    }

    const codigoBase = payload.codigo || row?.codigo || codigoBuscado || '';
    return {
        ...payload,
        orden_id: payload.orden_id || row?.id || null,
        supabase_order_id: payload.supabase_order_id || row?.id || null,
        tipo_registro: 'logistica',
        codigo: payload.documentos?.logistica?.codigo || codigoBase,
        codigo_cocina: codigoBase,
        codigo_original: payload.documentos?.logistica?.codigo || codigoBase,
        empresa: payload.empresa || payload.empresa_nombre || payload.company_name || row?.company_name || '',
        responsable: payload.responsable || payload.responsable_nombre || row?.responsable_name || '',
        pax: payload.pax || payload.pax_total || row?.pax_total || 0,
        pax_total: payload.pax_total || payload.pax || row?.pax_total || 0,
        fecha_creacion: payload.fecha_creacion || row?.created_at || '',
        fecha_modificacion: payload.fecha_modificacion || row?.updated_at || row?.created_at || '',
        fecha_evento: payload.fecha_evento || row?.fecha_evento || '',
        hora_salida: payload.hora_salida || row?.hora_salida || '',
        logistica,
        logistica_inline: logistica,
        material_logistica: material,
        tiene_comanda_logistica: true,
        logistica_creada: true,
        logistics_status: payload.logistics_status || payload.estado_logistica || payload.estado || row?.estado || 'sin_preparar',
        estado: payload.logistics_status || payload.estado_logistica || payload.estado || row?.estado || 'sin_preparar'
    };
}

async function _obtenerComandaLogisticaRemotaPorCodigo(codigo) {
    if (!codigo || !window.supabaseClient || !window.currentUser?.id) return null;

    try {
        const row = await window.CaterCloudStorage.obtenerOrdenSupabasePorCodigo(codigo);
        return row ? _normalizarComandaLogisticaRemota(row, codigo) : null;
    } catch (error) {
        console.warn('No se pudo consultar la comanda logistica en Supabase:', error);
        return null;
    }
}

function _guardarComandaLogisticaHidratadaLocal(codigo, item) {
    if (!codigo || !item) return;

    const historial = leerHistorialComandasHistorial();
    const idxPedido = historial.findIndex(pedido => (pedido.codigo || pedido.codigo_cocina || pedido.codigo_original) === codigo);
    if (idxPedido >= 0) {
        const previo = historial[idxPedido] || {};
        historial[idxPedido] = {
            ...previo,
            logistica: {
                ...(previo.logistica || {}),
                ...(item.logistica || {})
            },
            logistica_inline: {
                ...(previo.logistica_inline || {}),
                ...(item.logistica_inline || item.logistica || {})
            },
            material_logistica: item.material_logistica || previo.material_logistica || {},
            tiene_comanda_logistica: true,
            logistica_creada: true,
            documentos: {
                ...(previo.documentos || {}),
                ...(item.documentos || {})
            },
            fecha_modificacion: item.fecha_modificacion || previo.fecha_modificacion
        };
        guardarHistorialComandasHistorial(historial);
    }

    const historialLogistica = leerHistorialLogisticaHistorial();
    const idxLogistica = historialLogistica.findIndex(log =>
        (log.codigo_cocina || log.codigo_original || log.codigo) === codigo || log.codigo === item.codigo
    );
    if (idxLogistica >= 0) {
        historialLogistica[idxLogistica] = {
            ...historialLogistica[idxLogistica],
            ...item,
            logistica: {
                ...(historialLogistica[idxLogistica].logistica || {}),
                ...(item.logistica || {})
            },
            logistica_inline: {
                ...(historialLogistica[idxLogistica].logistica_inline || {}),
                ...(item.logistica_inline || item.logistica || {})
            }
        };
    } else {
        historialLogistica.unshift(item);
    }
    guardarHistorialLogisticaHistorial(historialLogistica);
}

function _renderArchivosSolicitud(comanda) {
    const adjuntos = comanda.adjuntos || [];
    const documentos = comanda.documentos || {};
    const puedeEditar = !window.AppPermissions || AppPermissions.canWrite();
    const documentosHtml = documentos.logistica
        ? `<div class="expediente-file expediente-file-documento">
                <span>${documentos.logistica.nombre || 'Comanda Logistica'}</span>
                <div class="expediente-file-actions">
                    <button type="button" class="expediente-file-link" onclick="abrirComandaLogisticaDesdeExpediente('${comanda.codigo}')">Abrir</button>
                </div>
            </div>`
        : '';
    const adjuntosHtml = adjuntos.length
        ? adjuntos.map((a, index) => `
            <div class="expediente-file">
                <span>${a.nombre || `Archivo ${index + 1}`}</span>
                <div class="expediente-file-actions">
                    ${a.tipo === 'link' && a.url
                        ? `<a href="${a.url}" target="_blank">Abrir</a>`
                        : (a.path
                            ? `<button type="button" class="expediente-file-link" onclick="abrirDocumentoPrivado('${a.path}')">Abrir</button>`
                            : `<em>Guardado</em>`)}
                    ${puedeEditar ? `<button type="button" class="expediente-file-delete" onclick="eliminarAdjuntoSolicitud('${comanda.codigo}', ${index})">Eliminar</button>` : ''}
                </div>
            </div>
        `).join('')
        : (!documentosHtml ? '<p class="expediente-muted">Aun no hay archivos cargados para esta solicitud.</p>' : '');

    const uploadHtml = puedeEditar ? `<div class="expediente-upload"
            ondragover="event.preventDefault(); this.classList.add('is-dragging')"
            ondragleave="this.classList.remove('is-dragging')"
            ondrop="soltarArchivoSolicitud(event, '${comanda.codigo}')">
            <input type="file" id="archivoSolicitudInput" multiple
                onchange="cargarArchivosSolicitud('${comanda.codigo}', this.files)">
            <div class="expediente-upload-title">Cargar archivo</div>
            <div class="expediente-upload-text">Arrastra archivos aqui o selecciona desde tu ordenador.</div>
            <div class="expediente-upload-actions">
                <button type="button" onclick="document.getElementById('archivoSolicitudInput').click()">Seleccionar archivo</button>
            </div>
        </div>
        <div class="expediente-link-upload">
            <input type="url" id="archivoSolicitudUrl" placeholder="Pegar enlace de Drive, Dropbox, email u otra ubicacion">
            <button type="button" onclick="guardarEnlaceSolicitud('${comanda.codigo}')">Guardar enlace</button>
        </div>` : '';

    return `${uploadHtml}
        <div class="expediente-files expediente-files-adjuntos">
            ${documentosHtml}
            ${adjuntosHtml}
        </div>`;
}

function abrirComandaDesdeExpediente(codigo) {
    const expedientePedido = document.getElementById('expedientePedido');
    if (expedientePedido) {
        expedientePedido.hidden = true;
        expedientePedido.style.display = 'none';
    }
    verDetalleComanda(codigo);
}

async function abrirComandaLogisticaDesdeExpediente(codigo) {
    let resultado = _obtenerComandaLogisticaPorCodigo(codigo);

    if (!resultado || !_tieneDatosEntregaLogistica(resultado.item)) {
        const remota = await _obtenerComandaLogisticaRemotaPorCodigo(codigo);
        if (remota) {
            _guardarComandaLogisticaHidratadaLocal(codigo, remota);
            resultado = {
                item: remota,
                index: -1,
                historial: leerHistorialLogisticaHistorial(),
                hidratada: true
            };
        }
    }

    if (!resultado) {
        alert('No se encontro la comanda de logistica para este pedido.');
        return;
    }

    verDetalleComandaLogistica(resultado.item);
}

async function crearComandaLogisticaDesdeExpediente(codigo) {
    const comanda = obtenerComandaDelHistorial(codigo);
    if (!comanda) {
        alert('Comanda no encontrada.');
        return;
    }

    const esComandaServicios = typeof _esComandaServicios === 'function' && _esComandaServicios(comanda);
    if (!esComandaServicios) {
        alert('La comanda de logistica solo se puede crear desde la carpeta para comandas de servicios.');
        return;
    }

    if (window.AppPermissions && !AppPermissions.requireServiceLogisticsCreate('Tu usuario no tiene permiso para crear comandas de logistica de servicios.')) {
        return;
    }

    const expedientePedido = document.getElementById('expedientePedido');
    const expedienteContent = document.getElementById('expedientePedidoContent');
    const historialPage = document.getElementById('historialPage');
    const detalleComanda = document.getElementById('detalleComanda');

    if (expedientePedido) {
        expedientePedido.hidden = true;
        expedientePedido.style.display = 'none';
    }
    if (expedienteContent) expedienteContent.innerHTML = '';
    if (historialPage) historialPage.style.display = 'none';
    if (detalleComanda) detalleComanda.style.display = 'none';

    const codigoCocina = comanda.codigo || comanda.codigo_comanda || codigo;
    const datosBase = {
        empresa: comanda.empresa || comanda.company_name || '',
        responsable: comanda.responsable || comanda.responsable_name || '',
        pax: Number(comanda.pax || comanda.pax_total || comanda.menu_principal?.pax || 0),
        hora_salida: comanda.hora_salida || '',
        fecha_evento: comanda.fecha_evento || '',
        notas: comanda.notas || '',
        menu_principal: comanda.menu_principal || null,
        menus_adicionales: comanda.menus_adicionales || [],
        menu_nombre: comanda.menu_principal?.nombre || comanda.menu_nombre || comanda.menu_categoria_nombre || '',
        logistica_inline: comanda.logistica_inline || comanda.logistica || null
    };

    window.ultimoCodigoCocina = codigoCocina;
    window.ultimoOrdenId = comanda.orden_id || null;
    window.ultimaComandaCocinaData = comanda;
    window._logisticaEditando = null;

    if (typeof abrirFormularioLogistica !== 'function') {
        alert('No se pudo abrir el formulario de logistica.');
        return;
    }

    await abrirFormularioLogistica(codigoCocina, window.ultimoOrdenId, datosBase);
}

async function convertirSolicitudEnComanda(codigo) {
    if (window.AppPermissions && !AppPermissions.requireCreateOrders('Tu usuario no tiene permiso para crear comandas.')) {
        return;
    }

    const solicitud = obtenerComandaDelHistorial(codigo);
    if (!solicitud) { alert('Solicitud no encontrada'); return; }
    window.solicitudConvirtiendo = {
        ...solicitud,
        codigo_solicitud: solicitud.codigo || codigo,
        orden_id: solicitud.orden_id || solicitud.supabase_order_id || null,
        supabase_order_id: solicitud.supabase_order_id || solicitud.orden_id || null
    };
    const expedientePedido = document.getElementById('expedientePedido');
    const expedienteContent = document.getElementById('expedientePedidoContent');
    const historialPage = document.getElementById('historialPage');
    const detalleComanda = document.getElementById('detalleComanda');
    if (expedientePedido) {
        expedientePedido.hidden = true;
        expedientePedido.style.display = 'none';
    }
    if (expedienteContent) expedienteContent.innerHTML = '';
    if (historialPage) historialPage.style.display = 'none';
    if (detalleComanda) detalleComanda.style.display = 'none';

    window.comandaEditando = null;
    window.serviciosMode = false;
    if (typeof mostrarComandaCocina === 'function') {
        await mostrarComandaCocina({
            fechaEvento: (solicitud.fecha_evento || '').split('T')[0],
            fecha_evento: (solicitud.fecha_evento || '').split('T')[0]
        });
    }

    if (expedientePedido) {
        expedientePedido.hidden = true;
        expedientePedido.style.display = 'none';
    }
    if (expedienteContent) expedienteContent.innerHTML = '';

    const empresa = document.getElementById('empresa');
    const responsable = document.getElementById('responsable');
    const pax = document.getElementById('pax');
    const fecha = document.getElementById('fecha_evento');

    if (empresa) empresa.value = solicitud.empresa || '';
    if (responsable) responsable.value = typeof obtenerNombreUsuarioActual === 'function'
        ? obtenerNombreUsuarioActual()
        : (solicitud.responsable || '');
    if (pax) pax.value = solicitud.pax || '';
    if (fecha) fecha.value = (solicitud.fecha_evento || '').split('T')[0];
    if (typeof window.actualizarDiaFechaEvento === 'function') {
        window.actualizarDiaFechaEvento();
    }
}

async function anularPedidoDesdeExpediente(codigo) {
    if (window.AppPermissions && !AppPermissions.requireWrite('Tu usuario solo puede consultar. No puede anular pedidos.')) {
        return;
    }

    if (!confirm('Quieres marcar este pedido como anulado?')) return;
    const ok = await actualizarComandaEnHistorial(codigo, { estado: 'anulada' });
    if (ok) verExpedientePedido(codigo);
}

async function actualizarEstadoPedidoDesdeExpediente(codigo, estado) {
    if (window.AppPermissions && !AppPermissions.requireWrite('Tu usuario solo puede consultar. No puede cambiar estados.')) {
        return;
    }

    const ok = await actualizarComandaEnHistorial(codigo, { estado });
    if (!ok) {
        alert('No se pudo actualizar el estado del pedido.');
        return;
    }

    if (typeof cargarCalendario === 'function') cargarCalendario();
    verExpedientePedido(codigo);
}

async function actualizarEstadoConfirmacionComandaDesdeExpediente(codigo, estadoConfirmacion) {
    if (window.AppPermissions && !AppPermissions.requireWrite('Tu usuario solo puede consultar. No puede cambiar estados.')) {
        return;
    }

    const ok = await actualizarComandaEnHistorial(codigo, {
        estado_confirmacion: estadoConfirmacion,
        confirmation_status: estadoConfirmacion
    });
    if (!ok) {
        alert('No se pudo actualizar la confirmacion de la comanda.');
        return;
    }

    if (typeof cargarCalendario === 'function') cargarCalendario();
    if (typeof renderizarComandasCocina === 'function') renderizarComandasCocina();
    if (typeof renderizarComandasLogistica === 'function') renderizarComandasLogistica();
    verExpedientePedido(codigo);
}

function soltarArchivoSolicitud(event, codigo) {
    event.preventDefault();
    event.currentTarget.classList.remove('is-dragging');
    cargarArchivosSolicitud(codigo, event.dataTransfer.files);
}

async function cargarArchivosSolicitud(codigo, files) {
    if (window.AppPermissions && !AppPermissions.requireWrite('Tu usuario solo puede consultar. No puede cargar archivos.')) {
        return;
    }

    const lista = Array.from(files || []);
    if (!lista.length) return;

    for (const file of lista) {
        await guardarAdjuntoSolicitud(codigo, {
            tipo: 'archivo',
            nombre: file.name,
            archivo: file,
            mime_type: file.type || 'application/octet-stream',
            size: file.size || 0
        });
    }

    verExpedientePedido(codigo);
}

async function guardarEnlaceSolicitud(codigo) {
    if (window.AppPermissions && !AppPermissions.requireWrite('Tu usuario solo puede consultar. No puede cargar archivos.')) {
        return;
    }

    const input = document.getElementById('archivoSolicitudUrl');
    const url = (input?.value || '').trim();
    if (!url) return;

    await guardarAdjuntoSolicitud(codigo, {
        tipo: 'link',
        nombre: url,
        url
    });

    if (input) input.value = '';
    verExpedientePedido(codigo);
}

async function guardarAdjuntoSolicitud(codigo, adjunto) {
    const comanda = obtenerComandaDelHistorial(codigo);
    if (!comanda) {
        alert('Solicitud no encontrada.');
        return false;
    }

    const nuevoAdjunto = {
        tipo: adjunto.tipo,
        nombre: adjunto.nombre,
        url: adjunto.url || '',
        path: '',
        mime_type: adjunto.mime_type || '',
        size: adjunto.size || 0,
        created_at: new Date().toISOString()
    };

    if (adjunto.tipo === 'archivo' && adjunto.archivo && window.supabaseClient && window.currentUser?.id) {
        try {
            const safeName = adjunto.archivo.name.replace(/[^\w.\-]+/g, '_');
            const storagePath = `orders/${window.currentUser.id}/${codigo}/adjuntos/${Date.now()}-${safeName}`;
            const { error } = await window.supabaseClient.storage
                .from('comandas')
                .upload(storagePath, adjunto.archivo, {
                    contentType: adjunto.mime_type || 'application/octet-stream',
                    upsert: true
                });

            if (error) throw error;

            nuevoAdjunto.path = storagePath;
        } catch (error) {
            console.warn('No se pudo subir el archivo a Storage:', error);
        }
    }

    const adjuntos = [...(comanda.adjuntos || []), nuevoAdjunto];
    return actualizarComandaEnHistorial(codigo, { adjuntos });
}

async function eliminarAdjuntoSolicitud(codigo, index) {
    if (window.AppPermissions && !AppPermissions.requireWrite('Tu usuario solo puede consultar. No puede eliminar archivos.')) {
        return;
    }

    const comanda = obtenerComandaDelHistorial(codigo);
    if (!comanda) {
        alert('Pedido no encontrado.');
        return;
    }

    const adjuntos = [...(comanda.adjuntos || [])];
    const adjunto = adjuntos[index];
    if (!adjunto) return;

    if (!confirm(`Eliminar el archivo "${adjunto.nombre || 'Archivo'}"?`)) return;

    if (adjunto.path && window.supabaseClient) {
        try {
            const { error } = await window.supabaseClient.storage
                .from('comandas')
                .remove([adjunto.path]);

            if (error) throw error;
        } catch (error) {
            console.warn('No se pudo eliminar el archivo de Storage:', error);
            alert('No se pudo eliminar el archivo del almacenamiento. Revisa permisos de Storage.');
            return;
        }
    }

    adjuntos.splice(index, 1);
    const ok = await actualizarComandaEnHistorial(codigo, { adjuntos });
    if (!ok) {
        alert('No se pudo actualizar el expediente.');
        return;
    }

    verExpedientePedido(codigo);
}

async function abrirDocumentoPrivado(path) {
    if (!path || !window.supabaseClient) {
        alert('No se pudo abrir el archivo.');
        return;
    }

    try {
        const { data, error } = await window.supabaseClient.storage
            .from('comandas')
            .createSignedUrl(path, 15 * 60);

        if (error || !data?.signedUrl) throw error || new Error('Sin URL');
        window.open(data.signedUrl, '_blank', 'noopener,noreferrer');
    } catch (error) {
        console.warn('No se pudo crear enlace temporal:', error);
        alert('No se pudo abrir el archivo. Revisa permisos de Storage.');
    }
}

function _renderMenuDetalle(comanda, pax) {

    let html = '';
    const esServicio = Number(comanda?.categoriaId || comanda?._cat || 0) === 3 ||
        String(comanda?.categoria || '').toLowerCase().includes('servicio') ||
        Boolean(comanda?.servicio_categoria);

    function formatearNombreMenuDetalle(nombre) {
        return textoSeguro(nombre).replace(/\(([^)]+)\)/g, '<em class="detalle-menu-parentesis">($1)</em>');
    }

    function fila(nombre, cantidad, unidad, esTitulo) {
        return `<div class="detalle-menu-row">
            <span class="detalle-menu-nombre${esTitulo ? ' es-titulo' : ''}">${formatearNombreMenuDetalle(nombre)}</span>
            <span class="detalle-menu-cantidad">${cantidad ? cantidad + ' ' + (unidad || '') : ''}</span>
        </div>`;
    }

    function distribuirCantidadPorOpciones(total, opciones) {
        const cantidadTotal = Math.max(0, Number(total) || 0);
        const cantidadOpciones = Math.max(1, Number(opciones) || 1);
        const base = Math.floor(cantidadTotal / cantidadOpciones);
        const resto = cantidadTotal % cantidadOpciones;
        return Array.from({ length: cantidadOpciones }, (_, index) => base + (index < resto ? 1 : 0));
    }

    function grupoDesayuno(ref) {
        const key = ref?.id || ref?._refKey || '';
        const texto = `${key} ${ref?.tipo || ''} ${ref?.nombre || ''}`.toLowerCase();
        if (/fruta|smoothie|zumo/.test(texto)) return 'fruta';
        if (/sandwich|sándwich|pulguita|tostada/.test(texto)) return 'salado';
        if (/bolleria|bollería|cookie|dulce/.test(texto)) return 'dulce';
        return 'otro';
    }

    function esBebidaSoloLogistica(ref) {
        const texto = `${ref?.id || ref?._refKey || ''} ${ref?.tipo || ''} ${ref?.nombre || ''}`.toLowerCase();
        return ref?.tipo === 'zumo' || /\bzumo\b/.test(texto);
    }

    function separarGrupoDesayuno(grupo, state) {
        if (state.actual && state.actual !== grupo) {
            html += '<div class="detalle-menu-row detalle-menu-row--spacer"></div>';
        }
        state.actual = grupo;
    }

    if (comanda.referencias_desayuno && Object.keys(comanda.referencias_desayuno).length) {
        const ordenDesayuno = {
            healthy_bolleria: 10,
            healthy_sandwich: 20,
            healthy_tostada: 30,
            healthy_fruta: 40,
            classic_bolleria: 10,
            classic_sandwich: 20,
            classic_fruta: 30,
            premium_cookie: 10,
            premium_bolleria: 20,
            premium_sandwich_o_pulguita: 30,
            premium_fruta: 40,
            premium_smoothie: 50,
            veggie_cookie: 10,
            veggie_sandwich_vegetal: 20,
            veggie_sandwich_aguacate: 21,
            veggie_fruta: 30
        };
        const refs = Object.entries(comanda.referencias_desayuno)
            .map(([key, ref], index) => ({ key, ref, index }))
            .filter(item => item.ref && item.ref.cantidad > 0)
            .sort((a, b) => (ordenDesayuno[a.ref.id || a.key] ?? a.index + 100) - (ordenDesayuno[b.ref.id || b.key] ?? b.index + 100))
            .map(item => ({ ...item.ref, _refKey: item.key }));

        let tituloSandwichFijoRenderizado = false;
        const grupoState = { actual: '' };

        refs.filter(r => r.tipo !== 'termo' && r.tipo !== 'leche_especial' && !esBebidaSoloLogistica(r)).forEach(ref => {
            let extra = '';
            const refKey = ref.id || ref._refKey || '';
            separarGrupoDesayuno(grupoDesayuno(ref), grupoState);

            if (ref.tipo === 'bolleria' && ref.opcionesSeleccionadas?.length) {
                const cantidades = distribuirCantidadPorOpciones(ref.cantidad || pax, ref.opcionesSeleccionadas.length);
                ref.opcionesSeleccionadas.forEach((opcion, index) => {
                    html += fila(opcion, cantidades[index], ref.unidad || 'uds', false);
                });
                return;
            }

            if (ref.tipo === 'sandwich' && ref.sabor) {
                if (refKey === 'premium_cookie' || refKey === 'premium_fruta' || refKey === 'welcome_cookie') {
                    html += fila(ref.sabor, ref.cantidad, ref.unidad || 'uds', false);
                    return;
                }
                html += fila(ref.sabor, ref.cantidad, ref.unidad || 'uds', false);
                return;
            }

            if (ref.tipo === 'sandwich_fijo') {
                tituloSandwichFijoRenderizado = true;
                html += fila(ref.sabor || ref.nombre, ref.cantidad, ref.unidad || 'uds', false);
                return;
            }

            if (ref.tipo === 'sandwich_multiple' && ref.sandwiches?.length) {
                const sandwiches = ref.sandwiches.filter(s => s.sabor);
                const cantidades = distribuirCantidadPorOpciones(ref.cantidad || pax, sandwiches.length);
                sandwiches.forEach((s, index) => {
                    html += fila(s.sabor, cantidades[index], ref.unidad || 'uds', false);
                });
                return;
            }

            if (ref.tipo === 'sandwich_o_pulguita' && ref.modo !== 'pulguita' && ref.sandwiches?.length) {
                const sandwiches = ref.sandwiches.filter(s => s.sabor);
                const cantidades = distribuirCantidadPorOpciones(ref.cantidad || pax, sandwiches.length);
                sandwiches.forEach((s, index) => {
                    html += fila(s.sabor, cantidades[index], ref.unidad || 'uds', false);
                });
                return;
            }

            html += fila(ref.nombre + extra, ref.cantidad, ref.unidad || 'uds', false);
        });
    }

    if (comanda.foodbox_lunch) {
        const fl = comanda.foodbox_lunch;

        const ensaladas = fl.ensaladas || fl.selecciones?.ensaladas || [];
        const sandwiches = fl.sandwiches || fl.selecciones?.sandwiches || [];
        const postres = fl.postres || fl.selecciones?.postres || [];

        if (ensaladas.length || sandwiches.length || postres.length) {
            ensaladas.forEach(e => {
                if ((e.cantidad || 1) > 0) {
                    html += fila(e.nombre || e.id, e.cantidad || '', 'uds', false);
                }
            });

            sandwiches.forEach(s => {
                if ((s.cantidad || 1) > 0) {
                    html += fila(s.nombre || s.id, s.cantidad || '', 'uds', false);
                }
            });

            if (postres.length) html += fila('POSTRES', '', '', true);
            postres.forEach(p => {
                if ((p.cantidad || 1) > 0) {
                    html += fila(p.nombre || p.id, p.cantidad || '', 'uds', false);
                }
            });
        } else {
            if (fl.ensalada_principal) html += fila(fl.ensalada_principal.nombre || fl.ensalada_principal, '', '', false);
            if (fl.sandwich_principal) html += fila(fl.sandwich_principal.nombre || fl.sandwich_principal, '', '', false);
            if (fl.postre_principal) {
                html += fila('POSTRES', '', '', true);
                html += fila(fl.postre_principal.nombre || fl.postre_principal, '', '', false);
            }

            if (fl.adicionales?.length) {
                fl.adicionales.forEach(a => {
                    html += fila(a.nombre || a.opcionId || '', a.cantidad, '', false);
                });
            }
        }
    }

    if (comanda.referencias) {
        const saladas = comanda.referencias.saladas || [];
        const postres = comanda.referencias.postres || [];
        const mul = comanda.multiplicadores;
        const extras = Array.isArray(comanda.referencias_extras) ? comanda.referencias_extras : [];
        const extrasSaladas = extras.filter(r => r.grupo !== 'postre' && r.tipo !== 'postres');
        const extrasPostres = extras.filter(r => r.grupo === 'postre' || r.tipo === 'postres');

        const saladasCarta = saladas.filter(r => !r.fuera_carta);
        const saladasFueraCarta = saladas.filter(r => r.fuera_carta);
        const postresCarta = postres.filter(r => !r.fuera_carta);
        const postresFueraCarta = postres.filter(r => r.fuera_carta);

        if (saladasCarta.length) {
            saladasCarta.forEach(r => html += fila(r.nombre || r.id, r.cantidad, r.unidad || 'uds', false));
        }

        if (saladasFueraCarta.length) {
            saladasFueraCarta.forEach(r => html += fila(r.nombre || r.id, r.cantidad, r.unidad || 'uds', false));
        }

        if (extrasSaladas.length) {
            extrasSaladas.forEach(r => html += fila(r.nombre || r.id, r.cantidad, r.unidad || 'uds', false));
        }

        if (postresCarta.length || postresFueraCarta.length || extrasPostres.length) {
            html += fila('POSTRES', '', '', true);
            postresCarta.forEach(r => html += fila(r.nombre || r.id, r.cantidad, r.unidad || 'uds', false));
            postresFueraCarta.forEach(r => html += fila(r.nombre || r.id, r.cantidad, r.unidad || 'uds', false));
            extrasPostres.forEach(r => html += fila(r.nombre || r.id, r.cantidad, r.unidad || 'uds', false));
        }
    }

    // ── DIY Desayunos (cat 5) y Foodbox (cat 6) ──
    if (comanda.bandejas) {
        const b = comanda.bandejas;
        const grupos = [
            { icono: '☕', label: 'Termos y Bebidas',  items: b.termos     || [] },
            { icono: '🍽️', label: 'Servicio',          items: b.servicio   || [] },
            { icono: '🍰', label: 'Dulces y Bollería', items: b.dulces     || [] },
            { icono: '🥪', label: 'Salados y Bebidas', items: b.salados    || [] },
            { icono: '🥗', label: 'Saladas',           items: b.saladas    || [] },
            { icono: '🥪', label: 'Sándwiches',        items: b.sandwiches || [] },
            { icono: '🍰', label: 'Postres',           items: b.postres    || [] },
        ].filter(g => g.items.length > 0);

        grupos.forEach(g => {
            if (g.label.toLowerCase() === 'postres') html += fila('POSTRES', '', '', true);
            g.items.forEach(it => {
                const variantes = it.variantes?.length
                    ? ' (' + it.variantes.map(v => v.nombre || v).join(', ') + ')'
                    : '';
                html += fila(it.nombre + variantes, it.cantidad || 1, 'ud.', false);
            });
        });
    }

    if (!html) {
        html = `<span class="detalle-menu-nombre" style="color:#94a3b8;">Sin detalle disponible</span>`;
    }

    return html;
}

function _renderTotalTermosDetalle(comanda) {
    const todosMenusDetalle = [
        {
            ...(comanda.menu_principal || comanda),
            referencias_desayuno: comanda.menu_principal?.referencias_desayuno || comanda.referencias_desayuno || null
        },
        ...(comanda.menus_adicionales || []).map(m => ({
            ...m,
            referencias_desayuno: m.referencias_desayuno || null
        }))
    ];
    const termosTotales = {};

    todosMenusDetalle.forEach(m => {
        const refs = m.referencias_desayuno || {};

        Object.values(refs).forEach(r => {
            if (!r || (r.tipo !== 'termo' && r.tipo !== 'leche_especial') || !r.cantidad || r.cantidad <= 0) return;

            if (!termosTotales[r.nombre]) {
                termosTotales[r.nombre] = { ...r, cantidad: 0 };
            }

            termosTotales[r.nombre].cantidad += r.cantidad;
        });
    });

    const termosList = Object.values(termosTotales);
    if (!termosList.length) return '';

    const tipoTermo = termosList[0]?.tipoTermo || '';
    const tag = tipoTermo ? ` <span class="detalle-termo-tag">${tipoTermo.toUpperCase()}</span>` : '';

    const partes = termosList.map(r => {
        const nombreCorto = String(r.nombre || '')
            .replace(/^Termo de?\s*/i, '')
            .replace(/^Termo\s*/i, '');

        return `${nombreCorto} ×${r.cantidad}`;
    }).join('  ·  ');

    return `<div class="detalle-termos-total">
        <span class="detalle-termos-title">☕ Total termos:</span>
        <span class="detalle-termos-items">${partes}${tag}</span>
    </div>`;
}

function _renderDetalleComanda(comanda) {
    window.detalleDocumentoActivo = { tipo: 'cocina', codigo: comanda.codigo };
    const editButton = document.querySelector('.comanda-actions button[title="Editar"]');
    if (editButton && window.AppPermissions) {
        editButton.style.display = AppPermissions.canEditOrders() ? '' : 'none';
    }
    const el = (id) => document.getElementById(id);
    const textoSeguro = (valor) => String(valor ?? '').replace(/[&<>"']/g, (char) => ({
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#39;'
    })[char]);

    const menuSection = el('detalleMenuPrincipal')?.closest('.dc-section');
    if (menuSection) menuSection.style.display = '';

    if (el('detalleCodigo')) el('detalleCodigo').textContent = comanda.codigo || '';

    if (el('detalleFecha')) {
        el('detalleFecha').textContent = comanda.fecha_creacion
            ? 'Creada el ' + new Date(comanda.fecha_creacion).toLocaleDateString('es-ES')
            : '';
    }

    if (el('detalleEmpresa')) el('detalleEmpresa').textContent = comanda.empresa || '—';
    if (el('detalleResponsable')) el('detalleResponsable').textContent = comanda.responsable || '—';
    if (el('detallePax')) el('detallePax').textContent = comanda.pax || '0';

    if (el('detalleFechaEvento')) {
        el('detalleFechaEvento').textContent = comanda.fecha_evento
            ? (typeof window.formatearFechaEventoConDia === 'function'
                ? window.formatearFechaEventoConDia(comanda.fecha_evento)
                : comanda.fecha_evento)
            : '—';
    }

    if (el('detalleHoraSalida')) el('detalleHoraSalida').textContent = comanda.hora_salida || '—';

    const nombreMenu = comanda.menu_principal?.nombre || 'Menú';
    const tipoMenaje = comanda.tipo_menaje;

    const labelMenaje = tipoMenaje === 'loza'
        ? 'EMPLATADO GOURMET'
        : tipoMenaje === 'desechable'
            ? 'MENAJE DESECHABLE'
            : (tipoMenaje ? String(tipoMenaje).toUpperCase() : '');

    const menusDetalle = [];

    menusDetalle.push({
        ...(comanda.menu_principal || {}),
        nombre: nombreMenu,
        pax: comanda.menu_principal?.pax || (!(comanda.menus_adicionales || []).length ? comanda.pax : ''),
        menu_principal: comanda.menu_principal || { nombre: nombreMenu },
        referencias_desayuno: comanda.menu_principal?.referencias_desayuno || comanda.referencias_desayuno || null,
        referencias: comanda.menu_principal?.referencias || comanda.referencias || null,
        referencias_extras: comanda.menu_principal?.referencias_extras || comanda.referencias_extras || [],
        foodbox_lunch: comanda.menu_principal?.foodbox_lunch || comanda.foodbox_lunch || null,
        bandejas: comanda.menu_principal?.bandejas || comanda.bandejas || null,
        multiplicadores: comanda.menu_principal?.multiplicadores || comanda.multiplicadores || null
    });

    (comanda.menus_adicionales || []).forEach(m => {
        menusDetalle.push({
            ...m,
            nombre: m.nombre || m.menu_principal?.nombre || 'Menú adicional',
            pax: m.pax_adicional || m.pax || '',
            menu_principal: { nombre: m.nombre || m.menu_principal?.nombre || 'Menú adicional' },
            referencias_desayuno: m.referencias_desayuno || null,
            referencias: m.referencias || null,
            referencias_extras: m.referencias_extras || [],
            foodbox_lunch: m.foodbox_lunch || null,
            bandejas: m.bandejas || null,
            multiplicadores: m.multiplicadores || null
        });
    });

    if (el('detalleMenuTitulo')) {
        const titulo = menusDetalle.length > 1 ? 'Menús de la comanda' : 'Menú de la comanda';
        el('detalleMenuTitulo').innerHTML = titulo;
    }
    // Badge DESECHABLE/LOZA centrado debajo del header
    const menajeBadgeEl = el('detalleMenajeBadge');
    if (menajeBadgeEl) {
        if (labelMenaje) {
            menajeBadgeEl.textContent = labelMenaje;
            menajeBadgeEl.style.display = 'block';
        } else {
            menajeBadgeEl.style.display = 'none';
        }
    }

    if (el('detalleMenuPrincipal')) {
        const totalTermosHtml = _renderTotalTermosDetalle(comanda);

        if (menusDetalle.length > 1) {
            const cardsHtml = menusDetalle.map(menu => {
                const paxMenu = menu.pax || '';

                return `<div class="detalle-menu-card">
                    <div class="detalle-menu-row" style="margin-bottom:6px;">
                        <span class="detalle-menu-nombre es-titulo" style="font-weight:600;">${menu.nombre || 'Menú'}</span>
                        <span class="detalle-menu-cantidad">${paxMenu ? paxMenu + ' pax' : ''}</span>
                    </div>
                    ${_renderMenuDetalle(menu, paxMenu)}
                </div>`;
            }).join('');

            el('detalleMenuPrincipal').innerHTML = `<div class="detalle-menus-grid">${cardsHtml}${totalTermosHtml}</div>`;
        } else {
            const unico = menusDetalle[0] || comanda;
            const paxMenu = unico.pax || comanda.pax || '';
            const cardHtml = `<div class="detalle-menu-card">
                <div class="detalle-menu-row detalle-menu-row--heading">
                    <span class="detalle-menu-nombre es-titulo" style="font-weight:600;">${unico.nombre || nombreMenu || 'Menú'}</span>
                    <span class="detalle-menu-cantidad">${paxMenu ? paxMenu + ' pax' : ''}</span>
                </div>
                ${_renderMenuDetalle(unico, paxMenu)}
            </div>`;
            el('detalleMenuPrincipal').innerHTML = `<div class="detalle-menus-grid detalle-menus-grid--single">${cardHtml}${totalTermosHtml}</div>`;
        }
    }

    const secAdi = el('detalleMenusAdicionalesSection');
    const contAdi = el('detalleMenusAdicionales');

    if (secAdi) secAdi.style.display = 'none';
    if (contAdi) contAdi.innerHTML = '';

    const secRef = el('detalleReferenciasSection');
    if (secRef) secRef.style.display = 'none';

    const secMul = el('detalleMultiplicadoresSection');
    if (secMul) secMul.style.display = 'none';

    const secIntolerancias = el('detalleIntoleranciasSection');
    const divIntolerancias = el('detalleIntolerancias');
    const intolerancias = comanda.alergias?.intolerancias || {};
    const intoleranciasItems = Array.isArray(intolerancias.items) ? intolerancias.items : [];
    const intoleranciasNotas = intolerancias.notas || '';

    if (secIntolerancias && divIntolerancias) {
        if (intoleranciasItems.length || intoleranciasNotas) {
            secIntolerancias.style.display = '';
            const itemsHtml = intoleranciasItems.length
                ? `<div class="detalle-intolerancias-grid">${intoleranciasItems.map(item => `
                    <div class="detalle-intolerancia-item">
                        <span class="detalle-intolerancia-label">
                            <img class="detalle-intolerancia-img" src="${getIconoIntoleranciaSrc(item.nombre)}" alt="">
                            <span>${textoSeguro(getNombreIntoleranciaDisplay(item.nombre))}</span>
                        </span>
                        <span class="detalle-intolerancia-pax">${item.pax ? `${textoSeguro(item.pax)} pax` : 'Informado'}</span>
                    </div>
                `).join('')}</div>`
                : '';
            const notasHtml = intoleranciasNotas
                ? `<div class="detalle-intolerancias-notas">${textoSeguro(intoleranciasNotas)}</div>`
                : '';
            divIntolerancias.innerHTML = itemsHtml + notasHtml;
        } else {
            secIntolerancias.style.display = 'none';
            divIntolerancias.innerHTML = '';
        }
    }

    const secNotas = el('detalleNotasSection');
    const divNotas = el('detalleNotas');
    const notasTexto = comanda.alergias?.notas || '';

    if (notasTexto) {
        if (secNotas) secNotas.style.display = '';
        if (divNotas) divNotas.textContent = notasTexto;
    } else {
        if (secNotas) secNotas.style.display = 'none';
    }

    const ocultarLogisticaEnDetalleCocina = _esComandaServicios(comanda) && (
        Boolean(comanda.documentos?.logistica) ||
        Boolean(comanda.logistica_creada) ||
        Boolean(comanda.tiene_comanda_logistica)
    );

    const secEntrega = el('detalleDatosLogisticaSection');
    const contEntrega = el('detalleDatosLogisticaContent');

    if (secEntrega && contEntrega) {
        if (ocultarLogisticaEnDetalleCocina) {
            secEntrega.style.display = 'none';
            contEntrega.innerHTML = '';
        } else {
        const logInline = getDatosEntregaLogisticaComanda(comanda);

        const campos = [
            { label: 'Contacto', valor: logInline?.nombre_contacto },
            { label: 'Teléfono', valor: logInline?.telefono_contacto },
            { label: 'Montaje', valor: logInline?.montaje },
            { label: 'Hora Entrega', valor: logInline?.hora_entrega },
            { label: 'Hora Evento', valor: logInline?.hora_evento },
            { label: 'Dirección', valor: logInline?.direccion },
            { label: 'Cód. Postal', valor: logInline?.codigo_postal },
        ].filter(c => c.valor);

        if (campos.length) {
            secEntrega.style.display = '';
            const li = logInline;

            const tieneDireccion = li?.direccion;
            const tieneCP = li?.codigo_postal;

            contEntrega.innerHTML = renderDatosEntregaLogistica(li);
        } else {
            secEntrega.style.display = 'none';
        }
        }
    }

    const secLog = el('detalleLogisticaSection');
    const contLog = el('detalleLogisticaContent');

    if (secLog && contLog) {
        if (ocultarLogisticaEnDetalleCocina) {
            secLog.style.display = 'none';
            contLog.innerHTML = '';
        } else {
        const log = comanda.material_logistica ||
            (comanda.logistica?.bebidas ? comanda.logistica : null);
        const logNormalizado = typeof window.normalizarMaterialLogistica === 'function'
            ? window.normalizarMaterialLogistica(log)
            : log;

        const tieneItems = logNormalizado && (
            (logNormalizado.bebidas || []).some(i => i.checked !== false) ||
            (logNormalizado.menaje || []).some(i => i.checked !== false) ||
            (logNormalizado.extras || []).some(i => i.checked !== false)
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
                        <span class="dc-material-nombre">
                            ${textoSeguro(it.nombre)}
                            ${_descripcionMaterialVisibleDetalle(comanda, it) ? `<small class="dc-material-descripcion">${textoSeguro(_descripcionMaterialVisibleDetalle(comanda, it))}</small>` : ''}
                        </span>
                        <span class="dc-material-medida">${it.cantidad ?? 0} ${textoSeguro(_unidadVisibleMaterialLogistica(it))}</span>
                    </div>`;

                    (it.subitems_selected || []).forEach(sub => {
                        h += `<div class="dc-material-item" style="padding-left:10px; opacity:0.85;">
                            <span class="dc-material-nombre" style="font-size:0.72rem; color:#64748b;">
                                ↳ ${textoSeguro(sub.nombre)}
                                ${_descripcionMaterialVisibleDetalle(comanda, sub) ? `<small class="dc-material-descripcion">${textoSeguro(_descripcionMaterialVisibleDetalle(comanda, sub))}</small>` : ''}
                            </span>
                            <span class="dc-material-medida">${sub.cantidad ?? 0} ${textoSeguro(_unidadVisibleMaterialLogistica(sub))}</span>
                        </div>`;
                    });
                });

                h += `</div></div>`;
                return h;
            }

            const columnasMaterial = [
                renderColMaterial('🥤', 'Bebidas', logNormalizado.bebidas),
                renderColMaterial('🍽️', 'Menaje', logNormalizado.menaje),
                renderColMaterial('✨', 'Extras', logNormalizado.extras)
            ].filter(Boolean);

            contLog.innerHTML = `<div class="dc-material-grid dc-material-grid--cols-${columnasMaterial.length}">
                ${columnasMaterial.join('')}
            </div>`;
        } else {
            secLog.style.display = 'none';
        }
        }
    }

    const secNotasLogistica = el('detalleNotasLogisticaSection');
    const divNotasLogistica = el('detalleNotasLogistica');
    const notasLogistica = (comanda.logistica_inline || comanda.logistica || {}).notas_logistica || '';

    if (secNotasLogistica && divNotasLogistica) {
        if (ocultarLogisticaEnDetalleCocina) {
            secNotasLogistica.style.display = 'none';
            divNotasLogistica.innerHTML = '';
        } else
        if (notasLogistica) {
            secNotasLogistica.style.display = '';
            divNotasLogistica.innerHTML = `<div class="detalle-logistica-notas">${textoSeguro(notasLogistica)}</div>`;
        } else {
            secNotasLogistica.style.display = 'none';
            divNotasLogistica.innerHTML = '';
        }
    }

    if (el('detalleEstado')) {
        el('detalleEstado').textContent = comanda.estado
            ? comanda.estado.charAt(0).toUpperCase() + comanda.estado.slice(1)
            : '—';
    }

    if (el('detalleVersion')) {
        el('detalleVersion').textContent = `v${comanda.version || '1'}`;
    }

    if (el('detalleFechaCreacion') && comanda.fecha_creacion) {
        el('detalleFechaCreacion').textContent = new Date(comanda.fecha_creacion)
            .toLocaleDateString('es-ES', {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            });
    }

    if (el('detalleFechaModificacion')) {
        el('detalleFechaModificacion').textContent = comanda.fecha_modificacion
            ? new Date(comanda.fecha_modificacion).toLocaleDateString('es-ES', {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            })
            : 'No modificada';
    }
}

function verDetalleComandaLogistica(comandaLogistica) {
    const dashboard = document.getElementById('dashboard');
    const comandaForm = document.getElementById('comandaForm');
    const historialPage = document.getElementById('historialPage');
    const expedientePedido = document.getElementById('expedientePedido');
    const logisticaForm = document.getElementById('logisticaForm');
    const detalleComanda = document.getElementById('detalleComanda');

    if (dashboard) dashboard.style.display = 'none';
    if (comandaForm) comandaForm.style.display = 'none';
    if (historialPage) historialPage.style.display = 'none';
    if (expedientePedido) expedientePedido.style.display = 'none';
    if (logisticaForm) logisticaForm.style.display = 'none';
    if (detalleComanda) detalleComanda.style.display = 'block';

    _renderDetalleComandaLogistica(comandaLogistica);
}

function _renderDetalleComandaLogistica(comanda) {
    window.detalleDocumentoActivo = {
        tipo: 'logistica',
        codigo: comanda.codigo,
        codigoCocina: comanda.codigo_cocina || comanda.codigo
    };
    const editButton = document.querySelector('.comanda-actions button[title="Editar"]');
    if (editButton && window.AppPermissions) {
        editButton.style.display = AppPermissions.canEditLogistics() ? '' : 'none';
    }

    const el = (id) => document.getElementById(id);
    const textoSeguro = (valor) => String(valor ?? '').replace(/[&<>"']/g, (char) => ({
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#39;'
    })[char]);

    if (el('detalleCodigo')) el('detalleCodigo').textContent = `Comanda Logistica - ${comanda.codigo_cocina || comanda.codigo || ''}`;
    if (el('detalleFecha')) {
        el('detalleFecha').textContent = comanda.fecha_creacion
            ? 'Creada el ' + new Date(comanda.fecha_creacion).toLocaleDateString('es-ES')
            : '';
    }

    if (el('detalleEmpresa')) el('detalleEmpresa').textContent = comanda.empresa || '—';
    if (el('detalleResponsable')) el('detalleResponsable').textContent = comanda.responsable || '—';
    if (el('detallePax')) el('detallePax').textContent = comanda.pax || '0';
    if (el('detalleFechaEvento')) {
        el('detalleFechaEvento').textContent = comanda.fecha_evento
            ? (typeof window.formatearFechaEventoConDia === 'function'
                ? window.formatearFechaEventoConDia(comanda.fecha_evento)
                : comanda.fecha_evento)
            : '—';
    }
    if (el('detalleHoraSalida')) el('detalleHoraSalida').textContent = comanda.hora_salida || '—';

    const menuSection = el('detalleMenuPrincipal')?.closest('.dc-section');
    if (menuSection) menuSection.style.display = 'none';

    const menajeBadge = el('detalleMenajeBadge');
    if (menajeBadge) menajeBadge.style.display = 'none';

    const menuPrincipal = el('detalleMenuPrincipal');
    if (menuPrincipal) {
        menuPrincipal.innerHTML = '';
    }

    ['detalleMenusAdicionalesSection', 'detalleReferenciasSection', 'detalleMultiplicadoresSection',
     'detalleIntoleranciasSection', 'detalleNotasSection'].forEach(id => {
        const node = el(id);
        if (node) node.style.display = 'none';
    });

    const secEntrega = el('detalleDatosLogisticaSection');
    const contEntrega = el('detalleDatosLogisticaContent');
    const li = getDatosEntregaLogisticaComanda(comanda);
    if (secEntrega && contEntrega) {
        const tieneDatos = li.nombre_contacto || li.telefono_contacto || li.montaje || li.duracion_evento ||
            li.cantidad_camareros || li.direccion || li.codigo_postal || li.hora_entrega ||
            li.hora_evento || li.fecha_recogida || li.hora_recogida;
        const entregaHtml = renderDatosEntregaLogistica(li);
        if (tieneDatos && entregaHtml) {
            secEntrega.style.display = '';
            contEntrega.innerHTML = entregaHtml;
        } else {
            secEntrega.style.display = 'none';
            contEntrega.innerHTML = '';
        }
    }

    const secLog = el('detalleLogisticaSection');
    const contLog = el('detalleLogisticaContent');
    const material = comanda.material_logistica || {};
    if (secLog && contLog) {
        const categorias = [
            { key: 'bebidas', icono: '🥤', titulo: 'Bebidas' },
            { key: 'menaje', icono: '🍽️', titulo: 'Menaje' },
            { key: 'extras', icono: '✨', titulo: 'Material' }
        ];

        const columnasMaterial = categorias.map(cat => {
            const items = (material[cat.key] || []).filter(item => item.checked !== false && Number(item.cantidad || 0) > 0);
            if (!items.length) return '';
            return `<div class="dc-material-col">
                <h5>${cat.icono} ${cat.titulo}</h5>
                <div class="dc-material-list">
                    ${items.map(item => `<div class="dc-material-item">
                        <span class="dc-material-nombre">
                            ${textoSeguro(item.nombre)}
                            ${_descripcionMaterialVisibleDetalle(comanda, item) ? `<small class="dc-material-descripcion">${textoSeguro(_descripcionMaterialVisibleDetalle(comanda, item))}</small>` : ''}
                        </span>
                        <span class="dc-material-medida">${textoSeguro(item.cantidad || 0)} ${textoSeguro(_unidadVisibleMaterialLogistica(item))}</span>
                    </div>`).join('')}
                </div>
            </div>`;
        }).filter(Boolean);

        if (columnasMaterial.length) {
            secLog.style.display = '';
            contLog.innerHTML = `<div class="dc-material-grid dc-material-grid--cols-${columnasMaterial.length}">${columnasMaterial.join('')}</div>`;
        } else {
            secLog.style.display = 'none';
            contLog.innerHTML = '';
        }
    }

    const secNotas = el('detalleNotasLogisticaSection');
    const contNotas = el('detalleNotasLogistica');
    if (secNotas && contNotas) {
        if (li.notas_logistica) {
            secNotas.style.display = '';
            contNotas.innerHTML = `<div class="detalle-logistica-notas">${textoSeguro(li.notas_logistica)}</div>`;
        } else {
            secNotas.style.display = 'none';
            contNotas.innerHTML = '';
        }
    }
}

function _clonarValorComanda(valor) {
    try {
        if (typeof valor === 'string') {
            return JSON.parse(valor);
        }
        return JSON.parse(JSON.stringify(valor || null));
    } catch (error) {
        return valor;
    }
}

function _materialLogisticaTieneItems(material) {
    return ['bebidas', 'menaje', 'extras'].some(tipo =>
        (material?.[tipo] || []).some(item =>
            (item?._cantidad_manual_zero ||
                (item?.checked !== false &&
                    (Number(item?.cantidad || 0) > 0 || (item?.subitems_selected || []).length > 0)))
        )
    );
}

function _normalizarMaterialLogisticaEdicion(material) {
    let valor = _clonarValorComanda(material);
    if (typeof valor === 'string') {
        try {
            valor = JSON.parse(valor);
        } catch (_) {
            valor = {};
        }
    }
    if (valor?.material_logistica) valor = _normalizarMaterialLogisticaEdicion(valor.material_logistica);
    if (valor?.materialLogistica) valor = _normalizarMaterialLogisticaEdicion(valor.materialLogistica);
    const base = {
        bebidas: Array.isArray(valor?.bebidas) ? valor.bebidas : [],
        menaje: Array.isArray(valor?.menaje) ? valor.menaje : [],
        extras: [
            ...(Array.isArray(valor?.extras) ? valor.extras : []),
            ...(Array.isArray(valor?.otros) ? valor.otros : []),
            ...(Array.isArray(valor?.material) ? valor.material : [])
        ]
    };
    return typeof window.normalizarMaterialLogistica === 'function'
        ? window.normalizarMaterialLogistica(base)
        : base;
}

function _normalizarTextoUnidadMaterial(valor) {
    return String(valor || '')
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .toLowerCase()
        .replace(/\s+/g, ' ')
        .trim();
}

function _esZumoMaterialLogistica(item) {
    const nombre = _normalizarTextoUnidadMaterial(item?.nombre || item?.name);
    return Boolean(item?._zumoId) ||
        (nombre.includes('zumo') && (nombre.includes('naranja') || nombre.includes('natural')));
}

function _unidadVisibleMaterialLogistica(item) {
    if (_esZumoMaterialLogistica(item)) {
        return item?.unidad_comanda || item?.unidad || 'Lt';
    }
    return item?.unidad_comanda || item?.unidad || 'uds';
}

function _permiteDescripcionMaterialMenu(item) {
    const texto = _normalizarTextoUnidadMaterial([
        item?.nombre,
        item?.descripcion,
        item?.presentacion
    ].filter(Boolean).join(' '));
    return /\bkit\b/.test(texto) || texto.includes('cristal');
}

function _descripcionMaterialVisibleDetalle(comanda, item) {
    const descripcion = item?.descripcion || '';
    if (!descripcion) return '';
    const esServicio = typeof _esComandaServicios === 'function' && _esComandaServicios(comanda);
    const esLogisticaSeparada = comanda?.tipo_registro === 'logistica';
    if (esServicio || esLogisticaSeparada) return descripcion;
    return _permiteDescripcionMaterialMenu(item) ? descripcion : '';
}

function _extraerMaterialLogisticaEdicion(comanda, menus) {
    const candidatos = [
        comanda?.material_logistica,
        comanda?.materialLogistica,
        comanda?.logistica?.material_logistica,
        comanda?.logistica?.materialLogistica,
        comanda?.logistica_inline?.material_logistica,
        comanda?.logistica_inline?.materialLogistica,
        ...(menus || []).map(menu => menu?.material)
    ];

    for (const candidato of candidatos) {
        const material = _normalizarMaterialLogisticaEdicion(candidato);
        if (_materialLogisticaTieneItems(material)) return material;
    }

    return (menus || []).reduce(
        (acc, menu) => _sumarMaterialParaEdicion(acc, _normalizarMaterialLogisticaEdicion(menu?.material)),
        { bebidas: [], menaje: [], extras: [] }
    );
}

function _restaurarMaterialLogisticaEdicion(material) {
    const materialSeguro = _normalizarMaterialLogisticaEdicion(material);
    window._materialAcumulado = materialSeguro;
    if (window.materialLogistica) {
        window.materialLogistica = {
            bebidas: _clonarValorComanda(materialSeguro.bebidas) || [],
            menaje: _clonarValorComanda(materialSeguro.menaje) || [],
            extras: _clonarValorComanda(materialSeguro.extras) || [],
            catalogoCompleto: window.materialLogistica.catalogoCompleto,
            isAdmin: window.materialLogistica.isAdmin
        };
    }
    const materialInline = document.getElementById('materialLogisticaInline');
    if (materialInline) materialInline.style.display = _materialLogisticaTieneItems(materialSeguro) ? 'block' : 'none';
    if (typeof window.renderMaterialAcumuladoInline === 'function') {
        window.renderMaterialAcumuladoInline();
    } else if (typeof window.renderizarMaterialLogisticaActual === 'function') {
        window.renderizarMaterialLogisticaActual('materialLogisticaInline');
    }
}

function _limpiarFormularioMenuParaEdicionNueva() {
    const st = window.MenusAdicionalesState || {};
    st.indiceMenuEditando = -1;
    st.indiceMenuSeleccionadoResumen = -1;
    window._indiceMenuResumenEditando = -1;
    window._materialMenuResumenEditando = null;
    clearTimeout(window._restoreMaterialEdicionTimer);
    clearTimeout(window._restoreMaterialResumenTimer1);
    clearTimeout(window._restoreMaterialResumenTimer2);

    const categoria = document.getElementById('categoria');
    if (categoria) categoria.value = '';
    const menuSelect = document.getElementById('menu_id');
    if (menuSelect) menuSelect.innerHTML = '<option value="">Primero selecciona categoría</option>';
    const pax = document.getElementById('pax');
    if (pax) pax.value = '';

    window.menuSeleccionado = null;
    window.pax = 0;
    window.referenciasSeleccionadas = { gris: [], rojo: [], postres: [], saladas: [] };
    window.referenciasDesayuno = {};

    if (typeof limpiarSeccionesMenu === 'function') limpiarSeccionesMenu();
    if (window.materialLogistica) {
        window.materialLogistica = {
            bebidas: [],
            menaje: [],
            extras: [],
            catalogoCompleto: window.materialLogistica.catalogoCompleto,
            isAdmin: window.materialLogistica.isAdmin
        };
    }

    const materialInline = document.getElementById('materialLogisticaInline');
    if (materialInline) {
        materialInline.style.display = 'none';
        materialInline.innerHTML = '';
        delete materialInline.dataset.modoLogistica;
    }
    window.modoMaterialLogisticaInline = '';

    const btnWrap = document.getElementById('btnAnadirMenuWrap');
    if (btnWrap) btnWrap.style.display = 'none';
    const btn = document.getElementById('btnAnadirMenu');
    if (btn) btn.textContent = '+ Añadir menú';
}

function _programarRestauracionMaterialLogisticaEdicion(material) {
    clearTimeout(window._restoreMaterialEdicionTimer);
    window._restoreMaterialEdicionTimer = setTimeout(() => {
        if (window.MenusAdicionalesState?.indiceMenuEditando >= 0 || window._indiceMenuResumenEditando >= 0) return;
        _restaurarMaterialLogisticaEdicion(material);
    }, 450);
}

function _inferirCategoriaMenuEdicion(menu) {
    if (menu?.categoriaOriginalId) return Number(menu.categoriaOriginalId);
    if (menu?.categoriaId) return Number(menu.categoriaId);
    if (menu?._cat) return Number(menu._cat);
    if (menu?.referencias_desayuno) return 1;
    if (menu?.foodbox_lunch) return 4;
    if (menu?.bandejas) return 5;
    if (menu?.referencias) return 2;
    const texto = String(menu?.categoria || '').toLowerCase();
    if (texto.includes('servicio')) return 3;
    if (texto.includes('desayuno')) return 1;
    if (texto.includes('foodbox lunch')) return 4;
    if (texto.includes('bandeja') || texto.includes('diy')) return 5;
    if (texto.includes('foodbox') || texto.includes('comida')) return 2;
    return Number(document.getElementById('categoria')?.value) || 0;
}

function _inferirTipoServicioEdicion(menu) {
    if (menu?.servicio_categoria) return menu.servicio_categoria;
    const nombre = String(menu?.nombre || '').toLowerCase();
    if (nombre.includes('brindis') || nombre.includes('networking') || nombre.includes('afterwork')) return 'vino';
    if (nombre.includes('alucinancia') || nombre.includes('decuatro') || nombre.includes('atractividad')) return 'cocteles';
    return '';
}

function _esMenuServicios(menu) {
    const categoria = Number(menu?.categoriaOriginalId || menu?.categoriaId || menu?._cat || 0);
    if (categoria === 3) return true;
    if ([1, 2, 4, 5, 6].includes(categoria)) return false;
    if (menu?.referencias_desayuno || menu?.foodbox_lunch || menu?.bandejas || menu?.referencias) return false;
    return String(menu?.categoria || '').toLowerCase().includes('servicio') ||
        Boolean(menu?.servicio_categoria);
}

function _esComandaServicios(comanda) {
    const menus = [
        comanda?.menu_principal,
        ...(comanda?.menus_adicionales || [])
    ].filter(Boolean);

    return menus.some(menu => _esMenuServicios(_normalizarMenuEdicion(menu, comanda, menu === comanda?.menu_principal)));
}

function _normalizarMenuEdicion(menu, comanda, esPrincipal) {
    const categoriaId = _inferirCategoriaMenuEdicion(menu);
    const item = {
        ..._clonarValorComanda(menu),
        id: menu?.id || menu?.menu_id || '',
        nombre: menu?.nombre || menu?.menu_principal?.nombre || 'Menu',
        categoriaId,
        categoria: menu?.categoria || '',
        pax: Number(menu?.pax || menu?.pax_adicional || (esPrincipal ? comanda?.pax : 0)) || 0,
        tipo_menaje: menu?.tipo_menaje || comanda?.tipo_menaje || null,
        material: _normalizarMaterialLogisticaEdicion(menu?.material || menu?.material_logistica || menu?.materialLogistica || null)
    };

    if (esPrincipal) {
        if (!item.referencias_extras && comanda?.referencias_extras) {
            item.referencias_extras = _clonarValorComanda(comanda.referencias_extras);
        }
        if (!item.referencias_desayuno && comanda?.referencias_desayuno) {
            item.referencias_desayuno = _clonarValorComanda(comanda.referencias_desayuno);
        }
        if (!item.referencias && comanda?.referencias) {
            item.referencias = _clonarValorComanda(comanda.referencias);
        }
        if (!item.multiplicadores && comanda?.multiplicadores) {
            item.multiplicadores = _clonarValorComanda(comanda.multiplicadores);
        }
        if (!item.foodbox_lunch && comanda?.foodbox_lunch) {
            item.foodbox_lunch = _clonarValorComanda(comanda.foodbox_lunch);
        }
        if (!item.bandejas && comanda?.bandejas) {
            item.bandejas = _clonarValorComanda(comanda.bandejas);
        }
    }

    return item;
}

function _sumarMaterialParaEdicion(base, nuevo) {
    const result = {
        bebidas: [...(base?.bebidas || [])],
        menaje: [...(base?.menaje || [])],
        extras: [...(base?.extras || [])]
    };

    ['bebidas', 'menaje', 'extras'].forEach(tipo => {
        (nuevo?.[tipo] || []).forEach(item => {
            const nombre = item?.nombre || item?.id || '';
            const unidad = item?.unidad || '';
            const existente = result[tipo].find(i => (i.nombre || i.id || '') === nombre && (i.unidad || '') === unidad);
            if (existente) {
                existente.cantidad = (Number(existente.cantidad) || 0) + (Number(item.cantidad) || 0);
                existente.checked = existente.checked !== false || item.checked !== false;
            } else {
                result[tipo].push(_clonarValorComanda(item));
            }
        });
    });

    return result;
}

function _rellenarCampoEdicion(id, valor) {
    const el = document.getElementById(id);
    if (el) el.value = valor || '';
}

function _normalizarClaveMaterial(valor) {
    return String(valor ?? '').trim().toLowerCase();
}

function _materialGuardadoCoincide(guardado, item) {
    const clavesGuardado = [
        guardado.id,
        guardado.item_id,
        guardado.nombre
    ].map(_normalizarClaveMaterial).filter(Boolean);

    const clavesItem = [
        item.id,
        item.item_id,
        item.nombre
    ].map(_normalizarClaveMaterial).filter(Boolean);

    return clavesGuardado.some(clave => clavesItem.includes(clave));
}

function _rehidratarMaterialLogisticaGuardado(actual, guardados) {
    if (actual.tiene_subitems && Array.isArray(actual.subitems)) {
        const subitemsSeleccionados = [];

        actual.subitems.forEach(subitem => {
            const guardado = guardados.find(mat => _materialGuardadoCoincide(mat, subitem));
            if (!guardado) return;

            subitemsSeleccionados.push({
                ...subitem,
                ...guardado,
                id: subitem.id,
                item_id: subitem.item_id || guardado.item_id || guardado.id,
                nombre: guardado.nombre || subitem.nombre,
                cantidad: Number(guardado.cantidad || 0),
                unidad: guardado.unidad || subitem.unidad || 'uds',
                source_table: guardado.source_table || subitem.source_table || 'logistics_materials',
                unidad_inventario: guardado.unidad_inventario || subitem.unidad_inventario || subitem.unidad || 'ud',
                conversion_a_stock: Number(guardado.conversion_a_stock || subitem.conversion_a_stock || subitem.contenido_por_unidad || 1)
            });
        });

        return {
            ...actual,
            checked: subitemsSeleccionados.length > 0,
            cantidad: subitemsSeleccionados.reduce((total, subitem) => total + Number(subitem.cantidad || 0), 0),
            subitems_selected: subitemsSeleccionados
        };
    }

    const guardado = guardados.find(mat => _materialGuardadoCoincide(mat, actual));
    return guardado
        ? {
            ...actual,
            ...guardado,
            checked: guardado.checked !== false && Number(guardado.cantidad || 0) > 0,
            cantidad: Number(guardado.cantidad || 0),
            _cantidad_manual_zero: !!guardado._cantidad_manual_zero || Number(guardado.cantidad || 0) === 0
        }
        : { ...actual, checked: false, cantidad: 0, subitems_selected: [] };
}

function _materialEstaEnCatalogoLogistica(guardado, catalogo) {
    return catalogo.some(item => {
        if (_materialGuardadoCoincide(guardado, item)) return true;
        return (item.subitems || []).some(subitem => _materialGuardadoCoincide(guardado, subitem));
    });
}

function _rehidratarListaMaterialLogistica(actuales, guardados) {
    const rehidratados = actuales.map(actual => _rehidratarMaterialLogisticaGuardado(actual, guardados));
    const guardadosSinCatalogo = guardados
        .filter(guardado => !_materialEstaEnCatalogoLogistica(guardado, actuales))
        .map(guardado => {
            const esManual = guardado._manual_otro || guardado.source_table === 'manual';
            const id = guardado.id || guardado.item_id || `otro_guardado_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
            return {
            ...guardado,
            id,
            item_id: guardado.item_id || id,
            tipo: guardado.tipo || '',
            subcategoria: guardado.subcategoria || (esManual ? 'otros' : ''),
            source_table: guardado.source_table || (esManual ? 'manual' : ''),
            _manual_otro: esManual,
            checked: true,
            cantidad: Number(guardado.cantidad || 0),
            unidad: guardado.unidad_comanda || guardado.unidad || 'ud',
            unidad_comanda: guardado.unidad_comanda || guardado.unidad || 'ud',
            unidad_inventario: guardado.unidad_inventario || guardado.unidad || 'ud',
            conversion_a_stock: Number(guardado.conversion_a_stock || 1),
            subitems: [],
            subitems_selected: [],
            tiene_subitems: false
            };
        });

    return [...rehidratados, ...guardadosSinCatalogo];
}

function _hidratarReferenciasDesayunoEdicion(menu) {
    if (!menu?.referencias_desayuno || !window.referenciasDesayuno) return;

    const guardadas = _clonarValorComanda(menu.referencias_desayuno) || {};
    Object.entries(guardadas).forEach(([refId, refGuardada]) => {
        const refActual = window.referenciasDesayuno[refId] || {};
        window.referenciasDesayuno[refId] = {
            ...refActual,
            ...refGuardada,
            cantidad_manual: refGuardada.cantidad_manual !== false,
            _cantidad_guardada_edicion: true,
            opcionesDisponibles: refActual.opcionesDisponibles || refGuardada.opcionesDisponibles || [],
            pulguitasDisponibles: refActual.pulguitasDisponibles || refGuardada.pulguitasDisponibles || []
        };

        const bubble = Array.from(document.querySelectorAll('#referenciasDesayunoGrid .dc-item-bubble'))
            .find(node => node.dataset.id === refId);
        const input = bubble?.querySelector('.dc-input-qty, .cantidad-input-compact');
        if (input && window.referenciasDesayuno[refId].cantidad !== undefined) {
            input.value = window.referenciasDesayuno[refId].cantidad;
        }

        if (typeof actualizarTextoDropdownDesayuno === 'function') {
            actualizarTextoDropdownDesayuno(refId);
        }
    });
}

function _hidratarReferenciasServiciosEdicion(menu) {
    if (![2, 3].includes(Number(menu?.categoriaId || menu?._cat || 0)) || !menu?.referencias) return;

    const saladas = Array.isArray(menu.referencias.saladas) ? menu.referencias.saladas : [];
    const postres = Array.isArray(menu.referencias.postres) ? menu.referencias.postres : [];
    const extras = Array.isArray(menu.referencias_extras) ? _clonarValorComanda(menu.referencias_extras) : [];

    window.referenciasSeleccionadas = window.referenciasSeleccionadas || { gris: [], rojo: [], postres: [] };
    window.referenciasSeleccionadas.gris = saladas.map(ref => ({
        ..._clonarValorComanda(ref),
        id: String(ref.id),
        nombre: ref.nombre || '',
        cantidad: Number(ref.cantidad || 0) || 1,
        unidad: ref.unidad || 'uds',
        cantidad_manual: ref.cantidad_manual !== false,
        _cantidad_guardada_edicion: true
    }));
    window.referenciasSeleccionadas.rojo = [];
    window.referenciasSeleccionadas.postres = postres.map(ref => ({
        ..._clonarValorComanda(ref),
        id: String(ref.id),
        nombre: ref.nombre || '',
        cantidad: Number(ref.cantidad || 0) || 1,
        unidad: ref.unidad || 'uds',
        cantidad_manual: ref.cantidad_manual !== false,
        _cantidad_guardada_edicion: true
    }));
    window.referenciasExtras = extras.map(ref => ({
        ...ref,
        id: String(ref.id || `extra_carta_${Date.now()}_${Math.floor(Math.random() * 1000)}`),
        cantidad: Number(ref.cantidad || 0) || 1,
        unidad: ref.unidad || 'uds',
        tipo: ref.tipo || (ref.grupo === 'postre' ? 'postres' : 'saladas'),
        grupo: ref.grupo || (ref.tipo === 'postres' ? 'postre' : 'salado'),
        extra_carta: ref.extra_carta !== false,
        cantidad_manual: ref.cantidad_manual !== false,
        _cantidad_guardada_edicion: true
    }));

    if (typeof renderReferenciasPagina === 'function') {
        ['gris', 'rojo', 'postres'].forEach(tipo => {
            if (window.referenciasPaginacion?.[tipo]) renderReferenciasPagina(tipo);
        });
    }
    if (typeof renderReferenciasFueraCarta === 'function') renderReferenciasFueraCarta();
    if (typeof renderReferenciasExtras === 'function') renderReferenciasExtras();
    if (typeof actualizarContadoresSeleccion === 'function') actualizarContadoresSeleccion();
}

async function _activarPrimerMenuEdicion(menu) {
    if (!menu) return;

    const categoriaId = Number(menu.categoriaId || menu._cat || 0);
    const categoriaSelect = document.getElementById('categoria');
    if (!categoriaSelect) return;

    if (categoriaId === 3) {
        window.serviciosMode = true;
        document.getElementById('comandaForm')?.classList.add('servicios-mode');
        const categoriaGroup = document.getElementById('categoriaMenuGroup');
        const serviciosGroup = document.getElementById('serviciosCategoriaGroup');
        const tipoMenajeGroup = document.getElementById('tipoMenajeGroup');
        const serviciosCategoria = document.getElementById('serviciosCategoria');
        if (categoriaGroup) categoriaGroup.style.display = '';
        if (serviciosGroup) serviciosGroup.style.display = '';
        if (tipoMenajeGroup) tipoMenajeGroup.style.display = 'none';
        if (serviciosCategoria) serviciosCategoria.value = _inferirTipoServicioEdicion(menu);
        const title = document.getElementById('comandaFormTitle');
        const subtitle = document.getElementById('comandaFormSubtitle');
        if (title) title.textContent = 'Editar Comanda';
        if (subtitle) subtitle.textContent = 'Ajusta los datos del pedido de catering';
    }

    categoriaSelect.value = String(categoriaId === 6 ? 5 : categoriaId);
    window._editandoMenuDesdeResumen = true;
    try {
        if (typeof cargarMenus === 'function') {
            await cargarMenus();
        }

        const nodes = document.querySelectorAll('#menusContainer .menu-option');
        let nodeEncontrado = null;
        nodes.forEach(node => {
            if (nodeEncontrado) return;
            try {
                const data = JSON.parse(node.dataset.menu || '{}');
                const mismoId = menu.id && String(data.id) === String(menu.id);
                const mismoNombre = (data.nombre || '').trim().toLowerCase() === (menu.nombre || '').trim().toLowerCase();
                if (mismoId || mismoNombre) nodeEncontrado = node;
            } catch (error) {}
        });

        if (nodeEncontrado && typeof seleccionarMenu === 'function') {
            await seleccionarMenu(menu.id, nodeEncontrado);
        } else {
            window.menuSeleccionado = { ...menu, _cat: categoriaId };
            _rellenarCampoEdicion('menu_id', menu.id || '');
        }
    } finally {
        window._editandoMenuDesdeResumen = false;
    }

    if (categoriaId === 1) {
        _hidratarReferenciasDesayunoEdicion(menu);
    } else if ([2, 3].includes(categoriaId)) {
        _hidratarReferenciasServiciosEdicion(menu);
    }

}

async function cargarComandaEnFormularioEdicion(comanda) {
    const comandaEsServicios = typeof _esComandaServicios === 'function' && _esComandaServicios(comanda);
    window._menusEliminadosEdicion = [];
    if (typeof window.mostrarCodigoComandaAsignado === 'function') {
        window.mostrarCodigoComandaAsignado(comanda.codigo || comanda.codigo_comanda || '');
    }
    _rellenarCampoEdicion('empresa', comanda.empresa || '');
    _rellenarCampoEdicion('responsable', comanda.responsable || '');
    _rellenarCampoEdicion('pax', comanda.pax || '');
    _rellenarCampoEdicion('hora_salida', comanda.hora_salida || '');
    _rellenarCampoEdicion('fecha_evento', (comanda.fecha_evento || '').split('T')[0]);
    if (typeof window.actualizarDiaFechaEvento === 'function') {
        window.actualizarDiaFechaEvento();
    }
    _rellenarCampoEdicion('tipo_menaje', comanda.tipo_menaje || '');
    _rellenarCampoEdicion('alergias_notas', comanda.alergias?.notas || '');
    if (typeof rellenarIntolerancias === 'function') {
        rellenarIntolerancias(comanda.alergias?.intolerancias || {});
    }

    const logistica = comandaEsServicios ? {} : (comanda.logistica_inline || comanda.logistica || {});
    if (comandaEsServicios) {
        if (typeof limpiarCamposLogisticaInline === 'function') limpiarCamposLogisticaInline();
        const logisticaSection = document.getElementById('logisticaInlineSection');
        const notasSection = document.getElementById('logisticaInlineNotasSection');
        const materialInline = document.getElementById('materialLogisticaInline');
        if (logisticaSection) logisticaSection.style.display = 'none';
        if (notasSection) notasSection.style.display = 'none';
        if (materialInline) {
            materialInline.style.display = 'none';
            materialInline.innerHTML = '';
        }
    } else {
        _rellenarCampoEdicion('log_inline_hora_entrega', logistica.hora_entrega || '');
        _rellenarCampoEdicion('log_inline_hora_evento', logistica.hora_evento || '');
        _rellenarCampoEdicion('log_inline_fecha_recogida', logistica.fecha_recogida || '');
        _rellenarCampoEdicion('log_inline_hora_recogida', logistica.hora_recogida || '');
        _rellenarCampoEdicion('log_inline_nombre_contacto', logistica.nombre_contacto || '');
        _rellenarCampoEdicion('log_inline_telefono_contacto', logistica.telefono_contacto || '');
        _rellenarCampoEdicion('log_inline_montaje', logistica.montaje || '');
        _rellenarCampoEdicion('log_inline_duracion_evento', logistica.duracion_evento || '');
        _rellenarCampoEdicion('log_inline_cantidad_camareros', logistica.cantidad_camareros || '');
        const direccionInline = typeof window.separarDireccionLogistica === 'function'
            ? window.separarDireccionLogistica(logistica.direccion || '')
            : { calle: logistica.direccion || '', numero: '' };
        _rellenarCampoEdicion('log_inline_calle', logistica.calle || direccionInline.calle || '');
        _rellenarCampoEdicion('log_inline_numero', logistica.numero || direccionInline.numero || '');
        _rellenarCampoEdicion('log_inline_codigo_postal', logistica.codigo_postal || '');
        _rellenarCampoEdicion('log_inline_notas', logistica.notas_logistica || '');
    }

    const menus = [];
    if (comanda.menu_principal) {
        menus.push(_normalizarMenuEdicion(comanda.menu_principal, comanda, true));
    }
    (comanda.menus_adicionales || []).forEach(menu => {
        menus.push(_normalizarMenuEdicion(menu, comanda, false));
    });

    if (!menus.length && comanda.menu_principal?.nombre) {
        menus.push(_normalizarMenuEdicion(comanda.menu_principal, comanda, true));
    }
    menus.forEach((menu, index) => {
        menu._edicion_uid = menu._edicion_uid || `edicion_${Date.now()}_${index}_${Math.floor(Math.random() * 1000)}`;
    });

    window.MenusAdicionalesState = window.MenusAdicionalesState || { menusAdicionales: [] };
    window.MenusAdicionalesState.menusAdicionales = menus;
    window.MenusAdicionalesState.indiceMenuEditando = -1;
    window.MenusAdicionalesState.indiceMenuSeleccionadoResumen = -1;
    window.menusAdicionales = menus;
    window._materialAcumulado = _extraerMaterialLogisticaEdicion(comanda, menus);

    const paxTotal = menus.reduce((total, menu) => total + (Number(menu.pax) || 0), 0);
    const paxTotalEl = document.getElementById('paxTotalValor');
    if (paxTotalEl) paxTotalEl.textContent = paxTotal;
    const paxWrap = document.getElementById('paxTotalWrap');
    if (paxWrap) paxWrap.style.display = menus.length ? 'block' : 'none';

    if (typeof actualizarResumenLateral === 'function') actualizarResumenLateral();

    window.MenusAdicionalesState.menusAdicionales = menus;
    window.MenusAdicionalesState.indiceMenuEditando = -1;
    window.MenusAdicionalesState.indiceMenuSeleccionadoResumen = -1;
    window.menusAdicionales = menus;
    _limpiarFormularioMenuParaEdicionNueva();
    window.MenusAdicionalesState.menusAdicionales = menus;
    window.MenusAdicionalesState.indiceMenuSeleccionadoResumen = menus.length ? 0 : -1;
    window.menusAdicionales = menus;
    if (typeof actualizarResumenLateral === 'function') actualizarResumenLateral();
    if (comandaEsServicios) {
        const logisticaSection = document.getElementById('logisticaInlineSection');
        const notasSection = document.getElementById('logisticaInlineNotasSection');
        const materialInline = document.getElementById('materialLogisticaInline');
        if (logisticaSection) logisticaSection.style.display = 'none';
        if (notasSection) notasSection.style.display = 'none';
        if (materialInline) {
            materialInline.style.display = 'none';
            materialInline.innerHTML = '';
        }
    }
}

async function editarComanda() {
    if (window.detalleDocumentoActivo?.tipo === 'logistica') {
        await editarComandaLogistica();
        return;
    }

    if (window.AppPermissions && !AppPermissions.requireWrite('Tu usuario solo puede consultar. No puede editar comandas.')) {
        return;
    }

    const codigo = document.getElementById('detalleCodigo').textContent;
    window.comandaEditando = obtenerComandaDelHistorial(codigo);

    if (!window.comandaEditando) {
        alert('Comanda no encontrada');
        return;
    }

    const comandaEsServicios = _esComandaServicios(window.comandaEditando);
    window.serviciosMode = comandaEsServicios;

    document.getElementById('detalleComanda').style.display = 'none';
    document.getElementById('comandaForm').style.display = 'block';
    document.getElementById('dashboard').style.display = 'none';
    const expedientePedido = document.getElementById('expedientePedido');
    const historialPage = document.getElementById('historialPage');
    if (expedientePedido) expedientePedido.style.display = 'none';
    if (historialPage) historialPage.style.display = 'none';

    const submitBtn = document.querySelector('#comandaCocinaForm button[type="submit"]');

    if (submitBtn) {
        submitBtn.textContent = '💾 Guardar Cambios';
    }

    if (!comandaEsServicios) {
        document.getElementById('comandaForm')?.classList.remove('servicios-mode');
        const categoriaGroup = document.getElementById('categoriaMenuGroup');
        const serviciosGroup = document.getElementById('serviciosCategoriaGroup');
        const tipoMenajeGroup = document.getElementById('tipoMenajeGroup');
        if (categoriaGroup) categoriaGroup.style.display = '';
        if (serviciosGroup) serviciosGroup.style.display = 'none';
        if (tipoMenajeGroup) tipoMenajeGroup.style.display = '';
    }

    window._cargandoComandaEnFormulario = true;
    try {
        await cargarComandaEnFormularioEdicion(window.comandaEditando);
    } finally {
        window._cargandoComandaEnFormulario = false;
    }

    console.log('Comanda cargada para edición:', window.comandaEditando.codigo);
}

function imprimirComanda() {
    const detalle = document.getElementById('detalleComanda');
    const expediente = document.getElementById('expedientePedido');

    if (detalle && detalle.style.display === 'none' && expediente && expediente.style.display !== 'none') {
        const codigo = window.detalleDocumentoActivo?.codigo || document.querySelector('#expedientePedidoContent h2')?.textContent || '';
        if (codigo && typeof abrirComandaDesdeExpediente === 'function') {
            abrirComandaDesdeExpediente(codigo.trim());
        }
    }

    setTimeout(() => {
        try {
            window.focus();
            window.print();
        } catch (error) {
            console.error('No se pudo abrir la impresion:', error);
            alert('No se pudo abrir la ventana de impresión. Intenta con Ctrl + P.');
        }
    }, 80);
}

async function eliminarComanda() {
    if (window.detalleDocumentoActivo?.tipo === 'logistica') {
        eliminarComandaLogistica();
        return;
    }

    if (window.AppPermissions && !AppPermissions.isAdmin()) {
        alert('Solo un administrador puede eliminar comandas.');
        return;
    }

    const codigo = document.getElementById('detalleCodigo').textContent;

    if (confirm(`¿Estás seguro de que deseas eliminar la comanda ${codigo}? Esta acción no se puede deshacer.`)) {
        const pedido = typeof obtenerComandaDelHistorial === 'function' ? obtenerComandaDelHistorial(codigo) : null;
        eliminarComandaDelHistorial(codigo);
        try {
            await window.marcarComandaEliminadaEnSupabase?.(codigo, pedido);
        } catch (error) {
            console.warn('No se pudo marcar la comanda como eliminada en Supabase:', error);
            alert('La comanda se oculto localmente, pero no se pudo sincronizar la eliminacion con Supabase. Revisa permisos.');
            return;
        }
        alert(`Comanda ${codigo} eliminada correctamente`);

        if (typeof volverAlHistorial === 'function') {
            volverAlHistorial();
        }
    }
}

async function editarComandaLogistica() {
    if (window.AppPermissions && !AppPermissions.requireLogistics('Tu usuario no tiene permiso para editar comandas de logistica.')) {
        return;
    }

    const codigo = window.detalleDocumentoActivo?.codigoCocina || '';
    let resultado = _obtenerComandaLogisticaPorCodigo(codigo);
    const remota = await _obtenerComandaLogisticaRemotaPorCodigo(codigo);
    if (remota && (_tieneDatosEntregaLogistica(remota) || _tieneMaterialLogisticaVista(remota.material_logistica))) {
        _guardarComandaLogisticaHidratadaLocal(codigo, remota);
        resultado = _obtenerComandaLogisticaPorCodigo(codigo) || {
            item: remota,
            index: -1,
            historial: leerHistorialLogisticaHistorial(),
            hidratada: true
        };
    }
    if (!resultado) {
        alert('Comanda de logistica no encontrada.');
        return;
    }

    const item = resultado.item;
    window._logisticaEditando = item;

    if (typeof abrirFormularioLogistica !== 'function') {
        alert('No se pudo abrir el formulario de logistica.');
        return;
    }

    await abrirFormularioLogistica(item.codigo_cocina || item.codigo, item.orden_id || null, {
        codigoLogistica: item.codigo,
        empresa: item.empresa || '',
        responsable: item.responsable || '',
        pax: item.pax || 0,
        hora_salida: item.hora_salida || '',
        fecha_evento: item.fecha_evento || '',
        logistica: item.logistica || item.logistica_inline || {},
        logistica_inline: item.logistica_inline || item.logistica || {},
        material_logistica: item.material_logistica || {}
    });

    const log = item.logistica || {};
    _rellenarCampoEdicion('log_nombre_contacto', log.nombre_contacto || '');
    _rellenarCampoEdicion('log_telefono_contacto', log.telefono_contacto || '');
    _rellenarCampoEdicion('log_montaje', log.montaje || '');
    _rellenarCampoEdicion('log_duracion_evento', log.duracion_evento || '');
    _rellenarCampoEdicion('log_cantidad_camareros', log.cantidad_camareros || '');
    _rellenarCampoEdicion('log_hora_entrega', log.hora_entrega || '');
    _rellenarCampoEdicion('log_hora_evento', log.hora_evento || '');
    _rellenarCampoEdicion('log_fecha_recogida', log.fecha_recogida || '');
    _rellenarCampoEdicion('log_hora_recogida', log.hora_recogida || '');
    const direccionLogistica = typeof window.separarDireccionLogistica === 'function'
        ? window.separarDireccionLogistica(log.direccion || '')
        : { calle: log.direccion || '', numero: '' };
    _rellenarCampoEdicion('log_calle', log.calle || direccionLogistica.calle || '');
    _rellenarCampoEdicion('log_numero', log.numero || direccionLogistica.numero || '');
    _rellenarCampoEdicion('log_codigo_postal', log.codigo_postal || '');
    _rellenarCampoEdicion('log_page_notas', log.notas_logistica || '');
    if (typeof window.actualizarSelectoresContactosCliente === 'function') {
        await window.actualizarSelectoresContactosCliente(item.empresa || '');
    }

    const materialLogisticaGuardado = _normalizarMaterialLogisticaVista(
        item.material_logistica ||
        item.materialLogistica ||
        item.logistica?.material_logistica ||
        item.logistica?.materialLogistica ||
        item.logistica_inline?.material_logistica ||
        item.logistica_inline?.materialLogistica ||
        {}
    );

    if (window.materialLogistica && _tieneMaterialLogisticaVista(materialLogisticaGuardado)) {
        ['bebidas', 'menaje', 'extras'].forEach(tipo => {
            const actuales = window.materialLogistica[tipo] || [];
            const guardados = materialLogisticaGuardado[tipo] || [];
            window.materialLogistica[tipo] = _rehidratarListaMaterialLogistica(actuales, guardados);
        });
        if (typeof window.renderizarMaterialLogisticaActual === 'function') {
            window.renderizarMaterialLogisticaActual('materialLogisticaPage');
        }
    }
}

function eliminarComandaLogistica() {
    if (window.AppPermissions && !AppPermissions.isAdmin()) {
        alert('Solo un administrador puede eliminar comandas.');
        return;
    }

    const codigo = window.detalleDocumentoActivo?.codigoCocina || '';
    const resultado = _obtenerComandaLogisticaPorCodigo(codigo);
    if (!resultado) {
        alert('Comanda de logistica no encontrada.');
        return;
    }

    if (!confirm(`Eliminar la comanda de logistica ${resultado.item.codigo || codigo}? Esta accion no se puede deshacer.`)) return;

    const historial = resultado.historial.filter((_, index) => index !== resultado.index);
    guardarHistorialLogisticaHistorial(historial);

    const historialPrincipal = leerHistorialComandasHistorial();
    const idx = historialPrincipal.findIndex(item => item.codigo === codigo);
    if (idx >= 0) {
        const documentos = { ...(historialPrincipal[idx].documentos || {}) };
        delete documentos.logistica;
        historialPrincipal[idx] = {
            ...historialPrincipal[idx],
            documentos,
            logistica_creada: false,
            fecha_modificacion: new Date().toISOString()
        };
        guardarHistorialComandasHistorial(historialPrincipal);
    }

    if (typeof cargarCalendario === 'function') cargarCalendario();
    alert('Comanda de logistica eliminada correctamente.');
    verExpedientePedido(codigo);
}

async function verDetalleComandaPorCodigo(codigo) {
    let comanda = null;

    if (window.supabaseClient && window.currentUser?.id) {
        try {
            const row = await window.CaterCloudStorage.obtenerOrdenSupabasePorCodigo(codigo, {
                select: 'payload',
                fallbackSelect: 'payload',
                searchPayload: false
            });
            if (row?.payload) comanda = row.payload;
        } catch (e) {
            // fallback a localStorage
        }
    }

    if (!comanda) {
        comanda = obtenerComandaDelHistorial(codigo);
    }

    if (!comanda) {
        console.warn('Comanda no encontrada:', codigo);
        if (typeof volverAlDashboard === 'function') volverAlDashboard();
        return;
    }

    const dashboard = document.getElementById('dashboard');
    const comandaForm = document.getElementById('comandaForm');
    const historialPage = document.getElementById('historialPage');
    const detalleEl = document.getElementById('detalleComanda');

    if (dashboard) dashboard.style.display = 'none';
    if (comandaForm) comandaForm.style.display = 'none';
    if (historialPage) historialPage.style.display = 'none';
    if (detalleEl) detalleEl.style.display = 'block';

    _renderDetalleComanda(comanda);
}
