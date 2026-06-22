// ========== HISTORIAL DE COMANDA ==========

function getEstadoPedidoLabel(estado) {
    const labels = {
        creada: 'Creada',
        proceso: 'En proceso',
        completada: 'Completada',
        negociacion: 'En negociacion',
        por_confirmar: 'Por confirmar',
        confirmado: 'Confirmado',
        anulada: 'Anulado'
    };

    return labels[estado] || (estado ? estado.charAt(0).toUpperCase() + estado.slice(1) : '-');
}

function cargarHistorial() {
    const historial = JSON.parse(localStorage.getItem('historialComandas') || '[]');
    const container = document.getElementById('comandasListHistorial') || document.getElementById('comandasList');

    if (historial.length === 0) {
        container.innerHTML = '<p style="color: #94a3b8; text-align: center; font-size: 0.9rem; padding: 40px;">No hay comandas en el historial</p>';
        return;
    }

    historial.sort((a, b) => new Date(b.fecha_creacion) - new Date(a.fecha_creacion));
    container.innerHTML = historial.map(renderHistorialItem).join('');
}

function filtrarComandas() {
    const historial = JSON.parse(localStorage.getItem('historialComandas') || '[]');
    const busqEl = document.getElementById('filtroBusquedaH') || document.getElementById('filtroBusqueda');
    const filtro = busqEl ? busqEl.value.toLowerCase() : '';
    const filtroFecha = document.getElementById('filtroFecha').value;
    const filtroEstado = document.getElementById('filtroEstado').value;

    const comandasFiltradas = historial.filter(comanda => {
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
    const estado = comanda.estado || 'creada';

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

    if (dashboard) dashboard.style.display = 'none';
    if (comandaForm) comandaForm.style.display = 'none';
    if (historialPage) historialPage.style.display = 'none';
    if (expedientePedido) expedientePedido.style.display = 'none';
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

    if (dashboard) dashboard.style.display = 'none';
    if (comandaForm) comandaForm.style.display = 'none';
    if (historialPage) historialPage.style.display = 'none';
    if (detalleComanda) detalleComanda.style.display = 'none';
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
    const puedeConfirmarSolicitud = puedeEditar && esSolicitud && estado !== 'confirmado' && estado !== 'anulada';
    const puedeAnularPedido = puedeEditar && estado !== 'anulada';
    const accionesEstadoHtml = (puedeConfirmarSolicitud || puedeAnularPedido)
        ? `<div class="expediente-status-actions">
                    ${puedeConfirmarSolicitud ? `<button class="expediente-status-btn estado-confirmado" onclick="actualizarEstadoPedidoDesdeExpediente('${comanda.codigo}', 'confirmado')">Confirmar</button>` : ''}
                    ${puedeAnularPedido ? `<button class="expediente-status-btn estado-anulada" onclick="actualizarEstadoPedidoDesdeExpediente('${comanda.codigo}', 'anulada')">Anular</button>` : ''}
                </div>`
        : '';

    cont.innerHTML = `
        <div class="expediente-header">
            <div>
                <div class="expediente-label">Expediente de pedido</div>
                <h2>${comanda.codigo || 'Sin codigo'}</h2>
                <p>${comanda.empresa || 'Empresa pendiente'} - ${fechaEvento}</p>
            </div>
            <div class="comanda-estado estado-${estado}">${estadoLabel}</div>
        </div>

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
                           ${tieneLogistica ? `<button class="btn-submit" onclick="abrirComandaLogisticaDesdeExpediente('${comanda.codigo}')">Abrir comanda Logistica</button>` : ''}`}
                </div>
            </section>

            <section class="expediente-section expediente-section-wide">
                <h3>Archivos</h3>
                ${archivosHtml}
            </section>
        </div>`;
}

function _pedidoTieneComandaLogistica(codigo) {
    const historialLogistica = JSON.parse(localStorage.getItem('historialComandasLogistica') || '[]');
    return historialLogistica.some(item => (item.codigo_cocina || item.codigo) === codigo);
}

function _obtenerComandaLogisticaPorCodigo(codigo) {
    const historialLogistica = JSON.parse(localStorage.getItem('historialComandasLogistica') || '[]');
    const index = historialLogistica.findIndex(item => (item.codigo_cocina || item.codigo) === codigo || item.codigo === codigo);
    return index >= 0 ? { item: historialLogistica[index], index, historial: historialLogistica } : null;
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

function abrirComandaLogisticaDesdeExpediente(codigo) {
    const resultado = _obtenerComandaLogisticaPorCodigo(codigo);

    if (!resultado) {
        alert('No se encontro la comanda de logistica para este pedido.');
        return;
    }

    verDetalleComandaLogistica(resultado.item);
}

function convertirSolicitudEnComanda(codigo) {
    if (window.AppPermissions && !AppPermissions.requireWrite('Tu usuario solo puede consultar. No puede crear comandas.')) {
        return;
    }

    const solicitud = obtenerComandaDelHistorial(codigo);
    if (!solicitud) { alert('Solicitud no encontrada'); return; }
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
    if (typeof mostrarComandaCocina === 'function') mostrarComandaCocina();

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

    function fila(nombre, cantidad, unidad, esTitulo) {
        return `<div class="detalle-menu-row">
            <span class="detalle-menu-nombre${esTitulo ? ' es-titulo' : ''}">${nombre}</span>
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

        refs.filter(r => r.tipo !== 'termo' && r.tipo !== 'leche_especial').forEach(ref => {
            let extra = '';
            const refKey = ref.id || ref._refKey || '';

            if (ref.tipo === 'bolleria' && ref.opcionesSeleccionadas?.length) {
                const cantidades = distribuirCantidadPorOpciones(ref.cantidad || pax, ref.opcionesSeleccionadas.length);
                html += fila('Bollería:', '', '', true);
                ref.opcionesSeleccionadas.forEach((opcion, index) => {
                    html += fila(opcion, cantidades[index], ref.unidad || 'uds', false);
                });
                return;
            }

            if (ref.tipo === 'sandwich' && ref.sabor) {
                if (refKey === 'premium_cookie' || refKey === 'premium_fruta') {
                    if (refKey === 'premium_fruta') {
                        html += '<div class="detalle-menu-row detalle-menu-row--spacer"></div>';
                    }
                    html += fila(ref.sabor, ref.cantidad, ref.unidad || 'uds', false);
                    return;
                }
                const tituloSimple = /sandwich|s[aá]ndwich/i.test(`${ref.id || ''} ${ref.nombre || ''}`)
                    ? 'Sándwich:'
                    : `${ref.nombre}:`;
                html += fila(tituloSimple, '', '', true);
                html += fila(ref.sabor, ref.cantidad, ref.unidad || 'uds', false);
                return;
            }

            if (ref.tipo === 'sandwich_fijo') {
                if (!tituloSandwichFijoRenderizado) {
                    html += fila('Sándwich:', '', '', true);
                    tituloSandwichFijoRenderizado = true;
                }
                html += fila(ref.sabor || ref.nombre, ref.cantidad, ref.unidad || 'uds', false);
                return;
            }

            if (ref.tipo === 'sandwich_multiple' && ref.sandwiches?.length) {
                const sandwiches = ref.sandwiches.filter(s => s.sabor);
                const cantidades = distribuirCantidadPorOpciones(ref.cantidad || pax, sandwiches.length);
                html += fila('Mini sandwich:', '', '', true);
                sandwiches.forEach((s, index) => {
                    html += fila(s.sabor, cantidades[index], ref.unidad || 'uds', false);
                });
                return;
            }

            if (ref.tipo === 'sandwich_o_pulguita' && ref.modo !== 'pulguita' && ref.sandwiches?.length) {
                const sandwiches = ref.sandwiches.filter(s => s.sabor);
                const cantidades = distribuirCantidadPorOpciones(ref.cantidad || pax, sandwiches.length);
                html += fila('Mini sandwich:', '', '', true);
                sandwiches.forEach((s, index) => {
                    html += fila(s.sabor, cantidades[index], ref.unidad || 'uds', false);
                });
                return;
            }

            if (refKey === 'classic_fruta' || refKey === 'healthy_fruta' || refKey === 'veggie_fruta') {
                html += '<div class="detalle-menu-row detalle-menu-row--spacer"></div>';
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
                    html += fila('🥗 ' + (e.nombre || e.id), e.cantidad || '', 'uds', false);
                }
            });

            sandwiches.forEach(s => {
                if ((s.cantidad || 1) > 0) {
                    html += fila('🥪 ' + (s.nombre || s.id), s.cantidad || '', 'uds', false);
                }
            });

            postres.forEach(p => {
                if ((p.cantidad || 1) > 0) {
                    html += fila('🍰 ' + (p.nombre || p.id), p.cantidad || '', 'uds', false);
                }
            });
        } else {
            if (fl.ensalada_principal) html += fila('🥗 ' + (fl.ensalada_principal.nombre || fl.ensalada_principal), '', '', false);
            if (fl.sandwich_principal) html += fila('🥪 ' + (fl.sandwich_principal.nombre || fl.sandwich_principal), '', '', false);
            if (fl.postre_principal) html += fila('🍰 ' + (fl.postre_principal.nombre || fl.postre_principal), '', '', false);

            if (fl.adicionales?.length) {
                fl.adicionales.forEach(a => {
                    html += fila('➕ ' + (a.nombre || a.opcionId || ''), a.cantidad, '', false);
                });
            }
        }
    }

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
            html += fila(g.icono + ' ' + g.label, '', '', true);
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
    const todosMenusDetalle = [comanda, ...(comanda.menus_adicionales || [])];
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
        <div class="detalle-menu-row">
            <span class="detalle-menu-nombre" style="font-weight:600;">☕ Total termos: ${partes}${tag}</span>
        </div>
    </div>`;
}

function _renderDetalleComanda(comanda) {
    window.detalleDocumentoActivo = { tipo: 'cocina', codigo: comanda.codigo };
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
        const fe = comanda.fecha_evento ? new Date(comanda.fecha_evento + 'T00:00:00') : null;
        el('detalleFechaEvento').textContent = fe ? fe.toLocaleDateString('es-ES') : '—';
    }

    if (el('detalleHoraSalida')) el('detalleHoraSalida').textContent = comanda.hora_salida || '—';

    const nombreMenu = comanda.menu_principal?.nombre || 'Menú';
    const tipoMenaje = comanda.tipo_menaje;

    const labelMenaje = tipoMenaje === 'loza'
        ? 'LOZA'
        : tipoMenaje === 'desechable'
            ? 'DESECHABLE'
            : (tipoMenaje ? String(tipoMenaje).toUpperCase() : '');

    const menusDetalle = [];

    menusDetalle.push({
        ...(comanda.menu_principal || {}),
        nombre: nombreMenu,
        pax: comanda.menu_principal?.pax || (!(comanda.menus_adicionales || []).length ? comanda.pax : ''),
        menu_principal: comanda.menu_principal || { nombre: nombreMenu },
        referencias_desayuno: comanda.menu_principal?.referencias_desayuno || comanda.referencias_desayuno || null,
        referencias: comanda.menu_principal?.referencias || comanda.referencias || null,
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
            foodbox_lunch: m.foodbox_lunch || null,
            bandejas: m.bandejas || null,
            multiplicadores: m.multiplicadores || null
        });
    });

    if (el('detalleMenuTitulo')) {
        const titulo = menusDetalle.length > 1 ? 'Menús de la comanda' : nombreMenu;
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

            el('detalleMenuPrincipal').innerHTML = `<div class="detalle-menus-grid">${cardsHtml}</div>${totalTermosHtml}`;
        } else {
            const unico = menusDetalle[0] || comanda;
            el('detalleMenuPrincipal').innerHTML = _renderMenuDetalle(unico, unico.pax || comanda.pax) + totalTermosHtml;
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
                        <span>${textoSeguro(item.nombre)}</span>
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

    const secEntrega = el('detalleDatosLogisticaSection');
    const contEntrega = el('detalleDatosLogisticaContent');

    if (secEntrega && contEntrega) {
        const logInline = comanda.logistica_inline ||
            (comanda.logistica && !Array.isArray(comanda.logistica.bebidas) &&
            (comanda.logistica.nombre_contacto || comanda.logistica.direccion)
                ? comanda.logistica
                : null);

        const campos = [
            { label: 'Contacto', valor: logInline?.nombre_contacto },
            { label: 'Teléfono', valor: logInline?.telefono_contacto },
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

            contEntrega.innerHTML = `<table style="width:100%; border-collapse:collapse; padding: 0 14px; display:block;">
                <tr>
                    ${li?.nombre_contacto ? `<td style="padding:1px 8px 2px; vertical-align:top; width:22%;"><div class="detalle-field-label">Contacto</div><div class="detalle-field-value" style="word-break:break-word;">${li.nombre_contacto}</div></td>` : ''}
                    ${li?.telefono_contacto ? `<td style="padding:1px 8px 2px; vertical-align:top; width:14%;"><div class="detalle-field-label">Teléfono</div><div class="detalle-field-value">${li.telefono_contacto}</div></td>` : ''}
                    ${tieneDireccion ? `<td style="padding:1px 8px 2px; vertical-align:top;"><div class="detalle-field-label">Dirección</div><div class="detalle-field-value" style="word-break:break-word;">${tieneDireccion}</div></td>` : ''}
                    ${tieneCP ? `<td style="padding:1px 8px 2px; vertical-align:top; width:90px; white-space:nowrap;"><div class="detalle-field-label">Cód. Postal</div><div class="detalle-field-value">${tieneCP}</div></td>` : ''}
                    ${li?.hora_entrega ? `<td style="padding:1px 8px 2px; vertical-align:top; width:10%;"><div class="detalle-field-label">Hora Entrega</div><div class="detalle-field-value">${li.hora_entrega}</div></td>` : ''}
                    ${li?.hora_evento ? `<td style="padding:1px 8px 2px; vertical-align:top; width:10%;"><div class="detalle-field-label">Hora Evento</div><div class="detalle-field-value">${li.hora_evento}</div></td>` : ''}
                </tr>
            </table>`;
        } else {
            secEntrega.style.display = 'none';
        }
    }

    const secLog = el('detalleLogisticaSection');
    const contLog = el('detalleLogisticaContent');

    if (secLog && contLog) {
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
                ${renderColMaterial('🥤', 'Bebidas', logNormalizado.bebidas)}
                ${renderColMaterial('🍽️', 'Menaje', logNormalizado.menaje)}
                ${renderColMaterial('✨', 'Extras', logNormalizado.extras)}
            </div>`;
        } else {
            secLog.style.display = 'none';
        }
    }

    const secNotasLogistica = el('detalleNotasLogisticaSection');
    const divNotasLogistica = el('detalleNotasLogistica');
    const notasLogistica = (comanda.logistica_inline || comanda.logistica || {}).notas_logistica || '';

    if (secNotasLogistica && divNotasLogistica) {
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
        const fe = comanda.fecha_evento ? new Date(comanda.fecha_evento + 'T00:00:00') : null;
        el('detalleFechaEvento').textContent = fe ? fe.toLocaleDateString('es-ES') : '—';
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
    const li = comanda.logistica || {};
    if (secEntrega && contEntrega) {
        const tieneDatos = li.nombre_contacto || li.telefono_contacto || li.direccion || li.codigo_postal || li.hora_entrega || li.hora_evento;
        if (tieneDatos) {
            secEntrega.style.display = '';
            contEntrega.innerHTML = `<table style="width:100%; border-collapse:collapse; padding: 0 14px; display:block;">
                <tr>
                    ${li.nombre_contacto ? `<td style="padding:1px 8px 2px; vertical-align:top;"><div class="detalle-field-label">Contacto</div><div class="detalle-field-value">${textoSeguro(li.nombre_contacto)}</div></td>` : ''}
                    ${li.telefono_contacto ? `<td style="padding:1px 8px 2px; vertical-align:top;"><div class="detalle-field-label">Telefono</div><div class="detalle-field-value">${textoSeguro(li.telefono_contacto)}</div></td>` : ''}
                    ${li.direccion ? `<td style="padding:1px 8px 2px; vertical-align:top;"><div class="detalle-field-label">Direccion</div><div class="detalle-field-value">${textoSeguro(li.direccion)}</div></td>` : ''}
                    ${li.codigo_postal ? `<td style="padding:1px 8px 2px; vertical-align:top;"><div class="detalle-field-label">Cod. Postal</div><div class="detalle-field-value">${textoSeguro(li.codigo_postal)}</div></td>` : ''}
                    ${li.hora_entrega ? `<td style="padding:1px 8px 2px; vertical-align:top;"><div class="detalle-field-label">Hora Entrega</div><div class="detalle-field-value">${textoSeguro(li.hora_entrega)}</div></td>` : ''}
                    ${li.hora_evento ? `<td style="padding:1px 8px 2px; vertical-align:top;"><div class="detalle-field-label">Hora Evento</div><div class="detalle-field-value">${textoSeguro(li.hora_evento)}</div></td>` : ''}
                </tr>
            </table>`;
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

        const html = categorias.map(cat => {
            const items = (material[cat.key] || []).filter(item => item.checked !== false && Number(item.cantidad || 0) > 0);
            if (!items.length) return '';
            return `<div class="dc-material-col">
                <h5>${cat.icono} ${cat.titulo}</h5>
                <div class="dc-material-list">
                    ${items.map(item => `<div class="dc-material-item">
                        <span class="dc-material-nombre">${textoSeguro(item.nombre)}</span>
                        <span class="dc-material-cantidad">${textoSeguro(item.cantidad || 0)}</span>
                        <span class="dc-material-unidad">${textoSeguro(item.unidad || 'uds')}</span>
                    </div>`).join('')}
                </div>
            </div>`;
        }).join('');

        if (html) {
            secLog.style.display = '';
            contLog.innerHTML = `<div class="dc-material-grid">${html}</div>`;
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
        return JSON.parse(JSON.stringify(valor || null));
    } catch (error) {
        return valor;
    }
}

function _inferirCategoriaMenuEdicion(menu) {
    if (menu?.categoriaId) return Number(menu.categoriaId);
    if (menu?._cat) return Number(menu._cat);
    const texto = String(menu?.categoria || '').toLowerCase();
    if (texto.includes('desayuno')) return 1;
    if (texto.includes('foodbox lunch')) return 4;
    if (texto.includes('bandeja') || texto.includes('diy')) return 5;
    if (texto.includes('foodbox') || texto.includes('comida')) return 2;
    return Number(document.getElementById('categoria')?.value) || 0;
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
        material: _clonarValorComanda(menu?.material || null)
    };

    if (esPrincipal) {
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

function _hidratarReferenciasDesayunoEdicion(menu) {
    if (!menu?.referencias_desayuno || !window.referenciasDesayuno) return;

    const guardadas = _clonarValorComanda(menu.referencias_desayuno) || {};
    Object.entries(guardadas).forEach(([refId, refGuardada]) => {
        const refActual = window.referenciasDesayuno[refId] || {};
        window.referenciasDesayuno[refId] = {
            ...refActual,
            ...refGuardada,
            opcionesDisponibles: refGuardada.opcionesDisponibles || refActual.opcionesDisponibles || [],
            pulguitasDisponibles: refGuardada.pulguitasDisponibles || refActual.pulguitasDisponibles || []
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

async function _activarPrimerMenuEdicion(menu) {
    if (!menu) return;

    const categoriaId = Number(menu.categoriaId || menu._cat || 0);
    const categoriaSelect = document.getElementById('categoria');
    if (!categoriaSelect) return;

    categoriaSelect.value = String(categoriaId === 6 ? 5 : categoriaId);
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

    if (categoriaId === 1) {
        _hidratarReferenciasDesayunoEdicion(menu);
    }
}

async function cargarComandaEnFormularioEdicion(comanda) {
    _rellenarCampoEdicion('empresa', comanda.empresa || '');
    _rellenarCampoEdicion('responsable', comanda.responsable || '');
    _rellenarCampoEdicion('pax', comanda.pax || '');
    _rellenarCampoEdicion('hora_salida', comanda.hora_salida || '');
    _rellenarCampoEdicion('fecha_evento', (comanda.fecha_evento || '').split('T')[0]);
    _rellenarCampoEdicion('tipo_menaje', comanda.tipo_menaje || '');
    _rellenarCampoEdicion('alergias_notas', comanda.alergias?.notas || '');
    if (typeof rellenarIntolerancias === 'function') {
        rellenarIntolerancias(comanda.alergias?.intolerancias || {});
    }

    const logistica = comanda.logistica_inline || comanda.logistica || {};
    _rellenarCampoEdicion('log_inline_hora_entrega', logistica.hora_entrega || '');
    _rellenarCampoEdicion('log_inline_hora_evento', logistica.hora_evento || '');
    _rellenarCampoEdicion('log_inline_nombre_contacto', logistica.nombre_contacto || '');
    _rellenarCampoEdicion('log_inline_telefono_contacto', logistica.telefono_contacto || '');
    const direccionInline = typeof window.separarDireccionLogistica === 'function'
        ? window.separarDireccionLogistica(logistica.direccion || '')
        : { calle: logistica.direccion || '', numero: '' };
    _rellenarCampoEdicion('log_inline_calle', logistica.calle || direccionInline.calle || '');
    _rellenarCampoEdicion('log_inline_numero', logistica.numero || direccionInline.numero || '');
    _rellenarCampoEdicion('log_inline_codigo_postal', logistica.codigo_postal || '');
    _rellenarCampoEdicion('log_inline_notas', logistica.notas_logistica || '');

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

    window.MenusAdicionalesState = window.MenusAdicionalesState || { menusAdicionales: [] };
    window.MenusAdicionalesState.menusAdicionales = menus;
    window.menusAdicionales = menus;
    window._materialAcumulado = _clonarValorComanda(comanda.material_logistica) || { bebidas: [], menaje: [], extras: [] };

    if (!window._materialAcumulado.bebidas?.length && !window._materialAcumulado.menaje?.length && !window._materialAcumulado.extras?.length) {
        window._materialAcumulado = menus.reduce((acc, menu) => _sumarMaterialParaEdicion(acc, menu.material), { bebidas: [], menaje: [], extras: [] });
    }

    const paxTotal = menus.reduce((total, menu) => total + (Number(menu.pax) || 0), 0);
    const paxTotalEl = document.getElementById('paxTotalValor');
    if (paxTotalEl) paxTotalEl.textContent = paxTotal;
    const paxWrap = document.getElementById('paxTotalWrap');
    if (paxWrap) paxWrap.style.display = menus.length ? 'block' : 'none';

    if (typeof actualizarResumenLateral === 'function') actualizarResumenLateral();

    try {
        await _activarPrimerMenuEdicion(menus[0]);
    } catch (error) {
        console.warn('No se pudo activar el menu al editar:', error);
    }

    window.MenusAdicionalesState.menusAdicionales = menus;
    window.menusAdicionales = menus;
    if (typeof actualizarResumenLateral === 'function') actualizarResumenLateral();
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

    await cargarComandaEnFormularioEdicion(window.comandaEditando);

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

function eliminarComanda() {
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
        eliminarComandaDelHistorial(codigo);
        alert(`Comanda ${codigo} eliminada correctamente`);

        if (typeof volverAlHistorial === 'function') {
            volverAlHistorial();
        }
    }
}

async function editarComandaLogistica() {
    if (window.AppPermissions && !AppPermissions.requireWrite('Tu usuario solo puede consultar. No puede editar comandas.')) {
        return;
    }

    const codigo = window.detalleDocumentoActivo?.codigoCocina || '';
    const resultado = _obtenerComandaLogisticaPorCodigo(codigo);
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
        fecha_evento: item.fecha_evento || ''
    });

    const log = item.logistica || {};
    _rellenarCampoEdicion('log_nombre_contacto', log.nombre_contacto || '');
    _rellenarCampoEdicion('log_telefono_contacto', log.telefono_contacto || '');
    _rellenarCampoEdicion('log_hora_entrega', log.hora_entrega || '');
    _rellenarCampoEdicion('log_hora_evento', log.hora_evento || '');
    const direccionLogistica = typeof window.separarDireccionLogistica === 'function'
        ? window.separarDireccionLogistica(log.direccion || '')
        : { calle: log.direccion || '', numero: '' };
    _rellenarCampoEdicion('log_calle', log.calle || direccionLogistica.calle || '');
    _rellenarCampoEdicion('log_numero', log.numero || direccionLogistica.numero || '');
    _rellenarCampoEdicion('log_codigo_postal', log.codigo_postal || '');
    _rellenarCampoEdicion('log_page_notas', log.notas_logistica || '');

    if (window.materialLogistica && item.material_logistica) {
        ['bebidas', 'menaje', 'extras'].forEach(tipo => {
            const actuales = window.materialLogistica[tipo] || [];
            const guardados = item.material_logistica[tipo] || [];
            window.materialLogistica[tipo] = actuales.map(actual => {
                const guardado = guardados.find(mat => String(mat.id || mat.item_id || mat.nombre) === String(actual.id || actual.item_id || actual.nombre)
                    || String(mat.nombre || '') === String(actual.nombre || ''));
                return guardado
                    ? { ...actual, ...guardado, checked: true, cantidad: Number(guardado.cantidad || 0) }
                    : { ...actual, checked: false, cantidad: 0 };
            });
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
    localStorage.setItem('historialComandasLogistica', JSON.stringify(historial));

    const historialPrincipal = JSON.parse(localStorage.getItem('historialComandas') || '[]');
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
        localStorage.setItem('historialComandas', JSON.stringify(historialPrincipal));
    }

    if (typeof cargarCalendario === 'function') cargarCalendario();
    alert('Comanda de logistica eliminada correctamente.');
    verExpedientePedido(codigo);
}

async function verDetalleComandaPorCodigo(codigo) {
    let comanda = null;

    if (window.supabaseClient && window.currentUser?.id) {
        try {
            const { data, error } = await window.supabaseClient
                .from('orders')
                .select('payload')
                .eq('codigo', codigo)
                .limit(1);

            if (!error && data && data.length > 0) {
                comanda = data[0].payload;
            }
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

