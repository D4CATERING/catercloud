// ========== NAVEGACIÓN PRINCIPAL ==========

/**
 * Muestra el formulario de comanda de cocina
 */
function mostrarComandaCocina() {
    if (window.AppPermissions && !AppPermissions.requireWrite('Tu usuario solo puede consultar. No puede crear comandas.')) {
        return;
    }

    window.serviciosMode = false;
    const title = document.getElementById('comandaFormTitle');
    const subtitle = document.getElementById('comandaFormSubtitle');
    const categoriaGroup = document.getElementById('categoriaMenuGroup');
    const serviciosGroup = document.getElementById('serviciosCategoriaGroup');
    const comandaFormEl = document.getElementById('comandaForm');
    const notasLogisticaInline = document.getElementById('logisticaInlineNotasSection');
    if (title) title.textContent = 'Nueva Comanda';
    if (subtitle) subtitle.textContent = 'Completa los datos del pedido de catering';
    if (categoriaGroup) categoriaGroup.style.display = '';
    if (serviciosGroup) serviciosGroup.style.display = 'none';
    if (comandaFormEl) comandaFormEl.classList.remove('servicios-mode');
    if (notasLogisticaInline) notasLogisticaInline.style.display = '';

    const logisticaForm = document.getElementById('logisticaForm');
    if (logisticaForm) logisticaForm.style.display = 'none';
    const logisticaPage = document.getElementById('logisticaPage');
    if (logisticaPage) logisticaPage.style.display = 'none';
    document.getElementById('dashboard').style.display = 'none';
    document.getElementById('comandaForm').style.display = 'block';
    const historialPage = document.getElementById('historialPage');
    const expedientePedido = document.getElementById('expedientePedido');
    const detalleComanda = document.getElementById('detalleComanda');
    if (historialPage) historialPage.style.display = 'none';
    if (expedientePedido) {
        expedientePedido.hidden = true;
        expedientePedido.style.display = 'none';
    }
    if (detalleComanda) detalleComanda.style.display = 'none';

    // Limpiar formulario si no estamos editando
    if (!window.comandaEditando) {
        if (typeof limpiarFormularioComanda === 'function') {
            limpiarFormularioComanda();
        } else {
            document.getElementById('comandaCocinaForm').reset();
        }
        if (typeof limpiarBuscadorClientes === 'function') {
            limpiarBuscadorClientes();
        }
        if (typeof rellenarResponsableConUsuarioActual === 'function') {
            rellenarResponsableConUsuarioActual(true);
        }
        window.menuSeleccionado = null;
        window.menusAdicionales = [];
        window.referenciasSeleccionadas = { gris: [], rojo: [], postres: [] };
        window.multiplicadores = { saladas: 1, postres: 1 };
        window.pax = 0;
        // Limpiar grids visuales, paginación e items
        if (window.referenciasPaginacion) {
            ['gris', 'rojo', 'postres'].forEach(tipo => {
                if (window.referenciasPaginacion[tipo]) {
                    window.referenciasPaginacion[tipo].page = 1;
                    window.referenciasPaginacion[tipo].query = '';
                    window.referenciasPaginacion[tipo].items = [];
                }
                const containerId = tipo === 'gris' ? 'referenciasGrisGrid'
                                  : tipo === 'rojo' ? 'referenciasRojoGrid'
                                  : 'referenciasPostresGrid';
                const grid = document.getElementById(containerId);
                if (grid) grid.innerHTML = '';
            });
        }
        // Limpiar buscadores
        ['referenciasGrisGrid__search','referenciasRojoGrid__search','referenciasPostresGrid__search'].forEach(id => {
            const el = document.getElementById(id);
            if (el) el.value = '';
        });
        // Limpiar selección visual de menús
        document.querySelectorAll('.menu-option.selected').forEach(el => el.classList.remove('selected'));
        // Limpiar zumos de logística
        if (window.materialLogistica?.bebidas) {
            window.materialLogistica.bebidas = window.materialLogistica.bebidas.filter(i => !i._zumoId);
        }
        if (typeof actualizarListaMenusAdicionales === 'function') {
            actualizarListaMenusAdicionales();
        }
    }

    const hoy = new Date().toISOString().split('T')[0];
    document.getElementById('fecha_evento').value = hoy;
}

/**
 * Muestra el apartado independiente de Servicios.
 * Reutiliza el formulario de cocina, pero carga directamente los menus de servicios.
 */
async function mostrarServicios() {
    if (window.AppPermissions && !AppPermissions.requireWrite('Tu usuario solo puede consultar. No puede crear servicios.')) {
        return;
    }

    window.serviciosMode = true;
    mostrarComandaCocina();
    window.serviciosMode = true;

    const title = document.getElementById('comandaFormTitle');
    const subtitle = document.getElementById('comandaFormSubtitle');
    const categoriaGroup = document.getElementById('categoriaMenuGroup');
    const serviciosGroup = document.getElementById('serviciosCategoriaGroup');
    const categoria = document.getElementById('categoria');
    const comandaFormEl = document.getElementById('comandaForm');
    const logisticaInline = document.getElementById('logisticaInlineSection');
    const materialInline = document.getElementById('materialLogisticaInline');
    const notasLogisticaInline = document.getElementById('logisticaInlineNotasSection');
    const serviciosCategoria = document.getElementById('serviciosCategoria');

    if (title) title.textContent = 'Servicios';
    if (subtitle) subtitle.textContent = 'Selecciona el servicio y completa la comanda de cocina';
    if (categoriaGroup) categoriaGroup.style.display = 'none';
    if (serviciosGroup) serviciosGroup.style.display = '';
    if (serviciosCategoria) serviciosCategoria.value = '';
    if (comandaFormEl) comandaFormEl.classList.add('servicios-mode');
    if (categoria) {
        if (!categoria.querySelector('option[value="3"]')) {
            const serviciosOption = document.createElement('option');
            serviciosOption.value = '3';
            serviciosOption.textContent = 'Servicios';
            serviciosOption.hidden = true;
            categoria.appendChild(serviciosOption);
        }
        categoria.value = '3';
    }
    if (logisticaInline) logisticaInline.style.display = 'none';
    if (notasLogisticaInline) notasLogisticaInline.style.display = 'none';
    if (materialInline) {
        materialInline.style.display = 'none';
        materialInline.innerHTML = '';
    }

    if (typeof cargarMenus === 'function') {
        await cargarMenus();
    }
    if (typeof setNavActive === 'function') setNavActive('nav-servicios');
}

/**
 * Muestra el módulo de logística
 */
function mostrarLogistica() {
    document.getElementById('dashboard').style.display = 'none';
    document.getElementById('comandaForm').style.display = 'none';
    const logisticaForm = document.getElementById('logisticaForm');
    if (logisticaForm) logisticaForm.style.display = 'none';
    document.getElementById('historialPage').style.display = 'none';
    const expedientePedido = document.getElementById('expedientePedido');
    if (expedientePedido) expedientePedido.style.display = 'none';
    document.getElementById('detalleComanda').style.display = 'none';
    const clientesPanel = document.getElementById('clientesPanel');
    if (clientesPanel) clientesPanel.style.display = 'none';

    const logisticaPage = document.getElementById('logisticaPage');
    if (logisticaPage) logisticaPage.style.display = 'block';

    if (typeof setNavActive === 'function') setNavActive('nav-logistica');
    cargarModuloLogistica();
}

async function cargarModuloLogistica() {
    renderizarComandasLogistica();
    await renderizarInventarioLogistica();
}

function cambiarTabLogistica(tab) {
    const eventosPanel = document.getElementById('logisticaEventosPanel');
    const inventarioPanel = document.getElementById('logisticaInventarioPanel');
    const tabEventos = document.getElementById('logTabEventos');
    const tabInventario = document.getElementById('logTabInventario');

    if (eventosPanel) eventosPanel.style.display = tab === 'eventos' ? '' : 'none';
    if (inventarioPanel) inventarioPanel.style.display = tab === 'inventario' ? '' : 'none';
    if (tabEventos) tabEventos.classList.toggle('active', tab === 'eventos');
    if (tabInventario) tabInventario.classList.toggle('active', tab === 'inventario');
}

function getHistorialLogistica() {
    return JSON.parse(localStorage.getItem('historialComandasLogistica') || '[]');
}

function guardarHistorialLogistica(historial) {
    localStorage.setItem('historialComandasLogistica', JSON.stringify(historial || []));
}

function getHistorialCocinaLogistica() {
    return JSON.parse(localStorage.getItem('historialComandas') || '[]');
}

function guardarHistorialCocinaLogistica(historial) {
    localStorage.setItem('historialComandas', JSON.stringify(historial || []));
}

function getFechaLogisticaItem(item) {
    return String(item?.fecha_evento || item?.fecha_creacion || '').split('T')[0];
}

function materialLogisticaTieneItems(material) {
    return ['bebidas', 'menaje', 'extras'].some(tipo => Array.isArray(material?.[tipo]) && material[tipo].length);
}

function getEventosLogisticaActivos() {
    const historialLogistica = getHistorialLogistica();
    const codigosConLogistica = getCodigosLogistica(historialLogistica);
    const eventos = historialLogistica.map((item, index) => ({
        ...item,
        _logisticaSource: 'logistica',
        _logisticaIndex: index
    }));

    getHistorialCocinaLogistica().forEach((item, index) => {
        const codigo = item.codigo || item.codigo_comanda || item.id;
        if (!codigo || codigosConLogistica.has(codigo)) return;
        if (!materialLogisticaTieneItems(item.material_logistica)) return;

        eventos.push({
            ...item,
            codigo_cocina: codigo,
            material_logistica: item.material_logistica,
            logistics_status: item.logistics_status || item.estado_logistica || 'sin_preparar',
            logistics_assigned_to: item.logistics_assigned_to || '',
            logistics_prepared_items: item.logistics_prepared_items || 0,
            _logisticaSource: 'cocina',
            _logisticaIndex: index
        });
    });

    return eventos.sort((a, b) => {
        const fechaA = getFechaLogisticaItem(a);
        const fechaB = getFechaLogisticaItem(b);
        if (fechaA !== fechaB) return fechaA.localeCompare(fechaB);
        return String(a.hora_salida || '').localeCompare(String(b.hora_salida || ''));
    });
}

function guardarEventoLogisticaActivo(evento) {
    if (!evento) return;

    if (evento._logisticaSource === 'cocina') {
        const historial = getHistorialCocinaLogistica();
        const index = evento._logisticaIndex;
        if (!historial[index]) return;
        historial[index].material_logistica = evento.material_logistica;
        historial[index].logistics_status = evento.logistics_status;
        historial[index].estado_logistica = evento.logistics_status;
        historial[index].logistics_assigned_to = evento.logistics_assigned_to || '';
        historial[index].logistics_prepared_items = evento.logistics_prepared_items || 0;
        if (evento.logistics_ready_at) historial[index].logistics_ready_at = evento.logistics_ready_at;
        if (evento.logistics_ready_by) historial[index].logistics_ready_by = evento.logistics_ready_by;
        guardarHistorialCocinaLogistica(historial);
        return;
    }

    const historial = getHistorialLogistica();
    const index = evento._logisticaIndex;
    if (!historial[index]) return;
    historial[index] = {
        ...historial[index],
        material_logistica: evento.material_logistica,
        logistics_status: evento.logistics_status,
        estado: evento.logistics_status,
        logistics_assigned_to: evento.logistics_assigned_to || '',
        logistics_prepared_items: evento.logistics_prepared_items || 0,
        logistics_ready_at: evento.logistics_ready_at || historial[index].logistics_ready_at,
        logistics_ready_by: evento.logistics_ready_by || historial[index].logistics_ready_by
    };
    guardarHistorialLogistica(historial);
}

function normalizarEstadoLogistica(estado) {
    if (estado === 'proceso') return 'en_preparacion';
    if (estado === 'completada') return 'listo';
    if (estado === 'creada') return 'sin_preparar';
    return estado || 'sin_preparar';
}

function getLabelEstadoLogistica(estado) {
    const labels = {
        sin_preparar: 'Sin preparar',
        en_preparacion: 'En preparación',
        listo: 'Listo para evento'
    };
    return labels[normalizarEstadoLogistica(estado)] || 'Sin preparar';
}

function getCategoriasMaterialLogistica() {
    return [
        { key: 'menaje', label: 'Menaje', icon: '▧' },
        { key: 'bebidas', label: 'Bebidas', icon: '◌' },
        { key: 'extras', label: 'Material', icon: '▤' }
    ];
}

function escapeLogisticaHtml(value) {
    return String(value ?? '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

function leerNumeroInventarioLogistica(value) {
    const normalizado = String(value ?? '0').replace(',', '.').trim();
    const numero = Number(normalizado);
    return Number.isFinite(numero) ? numero : 0;
}

function tipoInventarioDesdeDb(tipo) {
    return tipo === 'material' ? 'extras' : tipo;
}

function tipoInventarioParaDb(tipo) {
    return tipo === 'extras' ? 'material' : tipo;
}

function normalizarItemInventarioServicios(item) {
    return {
        ...item,
        tipo: tipoInventarioDesdeDb(item.tipo),
        unidad: item.unidad_comanda || item.unidad || 'ud',
        unidad_stock: item.unidad_inventario || item.unidad_comanda || item.unidad || 'ud',
        tabla_origen: 'service_logistics_materials'
    };
}

function getMaterialLogisticaPlano(material) {
    const resultado = [];
    ['menaje', 'bebidas', 'extras'].forEach(tipo => {
        (material?.[tipo] || []).forEach(item => {
            resultado.push({ ...item, tipo });
        });
    });
    return resultado;
}

function getCodigosLogistica(historial) {
    return new Set((historial || []).map(item => item.codigo_cocina || item.codigo).filter(Boolean));
}

function getComandasServicioSinLogistica(historialLogistica) {
    const codigosLogistica = getCodigosLogistica(historialLogistica);
    const historialCocina = JSON.parse(localStorage.getItem('historialComandas') || '[]');

    return historialCocina.filter(item => {
        const codigo = item.codigo || item.codigo_comanda || item.id;
        const categoria = item.categoria_id || item.categoriaId || item.categoria;
        const menu = item.menu_principal || item.menu || item.menu_nombre || '';
        const esServicio = Number(categoria) === 3
            || item.servicio_categoria
            || /brindis|networking|afterwork|decuatro|alucinancia|atractividad|coctel/i.test(menu);
        return esServicio && codigo && !codigosLogistica.has(codigo);
    });
}

function actualizarKpisLogistica(historial) {
    const counts = { sin_preparar: 0, en_preparacion: 0, listo: 0 };
    (historial || []).forEach(item => {
        const estado = normalizarEstadoLogistica(item.logistics_status || item.estado);
        if (counts[estado] !== undefined) counts[estado]++;
    });

    const setText = (id, value) => {
        const el = document.getElementById(id);
        if (el) el.textContent = String(value);
    };

    setText('logisticaKpiPendientes', counts.sin_preparar);
    setText('logisticaKpiProceso', counts.en_preparacion);
    setText('logisticaKpiListas', counts.listo);
}

function renderizarAlertasLogistica(historial) {
    const box = document.getElementById('logisticaMissingBox');
    const title = document.getElementById('logisticaMissingTitle');
    const list = document.getElementById('logisticaMissingList');
    if (!box || !title || !list) return;

    const fechaFiltro = document.getElementById('logisticaFiltroFecha')?.value || '';
    const faltantes = getComandasServicioSinLogistica(historial)
        .filter(item => !fechaFiltro || getFechaLogisticaItem(item) === fechaFiltro);
    if (!faltantes.length) {
        box.style.display = 'none';
        list.innerHTML = '';
        return;
    }

    box.style.display = '';
    title.textContent = `${faltantes.length} comandas sin hoja de logística`;
    list.innerHTML = faltantes.slice(0, 8).map(item => {
        const codigo = item.codigo || item.codigo_comanda || item.id || '';
        const empresa = item.empresa || item.company_name || 'Sin empresa';
        const menu = item.menu_nombre || item.menu_principal || item.menu || 'Servicio';
        return `<button type="button" class="logistics-missing-chip" onclick="mostrarHistorial()">+ ${empresa} — ${menu}</button>`;
    }).join('');

}

function renderizarComandasLogistica() {
    const cont = document.getElementById('logisticaComandasList');
    if (!cont) return;

    const historialLogistica = getHistorialLogistica();
    const eventos = getEventosLogisticaActivos();
    const fechaFiltro = document.getElementById('logisticaFiltroFecha')?.value || '';
    const eventosFiltrados = fechaFiltro
        ? eventos.filter(item => getFechaLogisticaItem(item) === fechaFiltro)
        : eventos;

    window.logisticaEventosActivos = eventosFiltrados;
    actualizarKpisLogistica(eventos);
    renderizarAlertasLogistica(historialLogistica);

    if (!eventos.length) {
        cont.innerHTML = '<div class="logistics-empty">Aún no hay eventos activos en logística.</div>';
        return;
    }

    if (!eventosFiltrados.length) {
        cont.innerHTML = '<div class="logistics-empty">No hay eventos de logística para el día seleccionado.</div>';
        return;
    }

    cont.innerHTML = eventosFiltrados.slice(0, 30).map((item, index) => {
        const fecha = item.fecha_evento || item.fecha_creacion || '';
        const material = item.material_logistica || {};
        const totalMaterial = ['bebidas', 'menaje', 'extras'].reduce((acc, tipo) => acc + ((material[tipo] || []).length), 0);
        const preparados = Number(item.logistics_prepared_items || 0);
        const estado = normalizarEstadoLogistica(item.logistics_status || item.estado);
        const responsable = item.logistics_assigned_to || '';
        const progreso = totalMaterial ? Math.min(100, Math.round((preparados / totalMaterial) * 100)) : 0;
        const origen = item._logisticaSource === 'cocina' ? 'Material de menú' : 'Comanda logística';

        return `
            <article class="logistics-event-card" onclick="abrirPreparacionLogistica(${index})">
                <div class="logistics-event-main">
                    <div>
                        <strong>${item.codigo_cocina || item.codigo || 'Sin código'}</strong>
                        <span>${item.empresa || 'Sin empresa'} · ${origen}</span>
                    </div>
                    <span class="logistics-status-pill logistics-status-pill--${estado}">${getLabelEstadoLogistica(estado)}</span>
                </div>

                <div class="logistics-event-meta">
                    <span>📅 ${fecha || 'Sin fecha'}</span>
                    <span>${item.pax || 0} pax</span>
                    <span>${totalMaterial} artículos</span>
                </div>

                <div class="logistics-progress-row">
                    <span>${preparados} preparados</span>
                    <div class="logistics-progress-bar"><span style="width:${progreso}%"></span></div>
                    <span>${progreso}%</span>
                </div>

                <div class="logistics-event-controls">
                    <label>
                        Responsable
                        <input type="text" value="${responsable}" placeholder="Asignar persona"
                            onclick="event.stopPropagation()"
                            onchange="actualizarResponsableLogistica(${index}, this.value)">
                    </label>
                    <label>
                        Estado
                        <select onclick="event.stopPropagation()" onchange="actualizarEstadoLogistica(${index}, this.value)">
                            <option value="sin_preparar" ${estado === 'sin_preparar' ? 'selected' : ''}>Sin preparar</option>
                            <option value="en_preparacion" ${estado === 'en_preparacion' ? 'selected' : ''}>En preparación</option>
                            <option value="listo" ${estado === 'listo' ? 'selected' : ''}>Listo para evento</option>
                        </select>
                    </label>
                    <label>
                        Preparados
                        <input type="number" min="0" max="${totalMaterial || 0}" value="${preparados}"
                            onclick="event.stopPropagation()"
                            onchange="actualizarPreparadosLogistica(${index}, this.value)">
                    </label>
                </div>
            </article>
        `;
    }).join('');

}

function filtrarLogisticaHoy() {
    const input = document.getElementById('logisticaFiltroFecha');
    if (input) input.value = new Date().toISOString().split('T')[0];
    renderizarComandasLogistica();
}

function limpiarFiltroFechaLogistica() {
    const input = document.getElementById('logisticaFiltroFecha');
    if (input) input.value = '';
    renderizarComandasLogistica();
}

function abrirModalArticuloLogistica(id = '') {
    const modal = document.getElementById('logisticaArticuloModal');
    const form = document.getElementById('logisticaArticuloForm');
    if (!modal || !form) return;

    const item = id ? (window.logisticaInventarioItems || []).find(mat => String(mat.id) === String(id)) : null;
    document.getElementById('logisticaArticuloTitulo').textContent = item ? 'Editar articulo' : 'Nuevo articulo';
    document.getElementById('logisticaArticuloId').value = item?.id || '';
    document.getElementById('logisticaArticuloNombre').value = item?.nombre || '';
    document.getElementById('logisticaArticuloTipo').value = item?.tipo || 'menaje';
    document.getElementById('logisticaArticuloStock').value = Number(item?.stock_total ?? item?.stock ?? 0);
    document.getElementById('logisticaArticuloSubcategoria').value = item?.subcategoria || item?.descripcion || '';
    document.getElementById('logisticaArticuloUnidad').value = item?.unidad || 'ud';

    modal.style.display = 'block';
    setTimeout(() => document.getElementById('logisticaArticuloNombre')?.focus(), 50);
}

function cerrarModalArticuloLogistica() {
    const modal = document.getElementById('logisticaArticuloModal');
    const form = document.getElementById('logisticaArticuloForm');
    if (modal) modal.style.display = 'none';
    if (form) form.reset();
    const idInput = document.getElementById('logisticaArticuloId');
    if (idInput) idInput.value = '';
}

async function guardarArticuloInventarioLogistica(event) {
    event.preventDefault();
    if (!window.supabaseClient) {
        alert('No se pudo conectar con Supabase para guardar el articulo.');
        return;
    }

    const id = document.getElementById('logisticaArticuloId')?.value || '';
    const nombre = document.getElementById('logisticaArticuloNombre')?.value.trim();
    const tipoUi = document.getElementById('logisticaArticuloTipo')?.value || 'menaje';
    const tipo = tipoInventarioParaDb(tipoUi);
    const stockTotal = leerNumeroInventarioLogistica(document.getElementById('logisticaArticuloStock')?.value);
    const subcategoria = document.getElementById('logisticaArticuloSubcategoria')?.value.trim() || '';
    const unidad = document.getElementById('logisticaArticuloUnidad')?.value.trim() || 'ud';

    if (!nombre) {
        alert('Indica el nombre del articulo.');
        return;
    }

    const items = window.logisticaInventarioItems || [];
    const payload = {
        nombre,
        tipo,
        unidad_comanda: unidad,
        unidad_inventario: unidad,
        conversion_a_stock: 1,
        subcategoria,
        stock_total: stockTotal,
        activo: true
    };

    if (!id) {
        const maxOrden = items.reduce((max, item) => Math.max(max, Number(item.orden || 0)), 0);
        payload.orden = maxOrden + 10;
    } else {
        const actual = items.find(item => String(item.id) === String(id));
        if (actual) {
            payload.contenido_por_unidad = actual.contenido_por_unidad ?? null;
            payload.conversion_a_stock = Number(actual.conversion_a_stock || 1);
            payload.unidad_inventario = actual.unidad_stock || actual.unidad_inventario || unidad;
        }
    }

    try {
        const query = id
            ? window.supabaseClient.from('service_logistics_materials').update(payload).eq('id', id).select('*').maybeSingle()
            : window.supabaseClient.from('service_logistics_materials').insert(payload).select('*').maybeSingle();
        const { data, error } = await query;
        if (error) throw error;
        if (!data) {
            throw new Error('Supabase no devolvio el articulo actualizado. Revisa permisos de edicion para service_logistics_materials.');
        }

        const itemNormalizado = normalizarItemInventarioServicios(data);
        cerrarModalArticuloLogistica();
        window.logisticaInventarioItems = id
            ? (window.logisticaInventarioItems || []).map(item => String(item.id) === String(id) ? itemNormalizado : item)
            : [...(window.logisticaInventarioItems || []), itemNormalizado];
        const filtroActivo = document.querySelector('.logistics-filter-chip.active')?.dataset.filter || 'todos';
        pintarInventarioLogistica(filtroActivo);
    } catch (error) {
        console.error('Error guardando articulo de logistica:', error);
        const msg = String(error?.message || '');
        if (/stock_total|subcategoria/i.test(msg)) {
            alert('Faltan columnas de inventario en Supabase. Ejecuta el SQL de actualizacion y vuelve a guardar.');
        } else if (/no devolvio|permisos|permission|policy|row-level|rls/i.test(msg)) {
            alert('No se pudo actualizar el articulo. Revisa los permisos de edicion de service_logistics_materials en Supabase.');
        } else {
            alert('No se pudo guardar el articulo. Revisa permisos o politicas de Supabase.');
        }
    }
}

async function eliminarArticuloInventarioLogistica(id) {
    if (!window.supabaseClient) {
        alert('No se pudo conectar con Supabase para eliminar el articulo.');
        return;
    }

    const item = (window.logisticaInventarioItems || []).find(mat => String(mat.id) === String(id));
    const nombre = item?.nombre || 'este articulo';
    if (!window.confirm(`Eliminar ${nombre} del inventario?`)) return;

    try {
        const { error } = await window.supabaseClient
            .from('service_logistics_materials')
            .update({ activo: false })
            .eq('id', id);
        if (error) throw error;
        await renderizarInventarioLogistica();
    } catch (error) {
        console.error('Error eliminando articulo de logistica:', error);
        alert('No se pudo eliminar el articulo. Revisa permisos o politicas de Supabase.');
    }
}

function abrirPreparacionLogistica(index) {
    const item = (window.logisticaEventosActivos || getEventosLogisticaActivos())[index];
    const modal = document.getElementById('logisticaPreparacionModal');
    const content = document.getElementById('logisticaPreparacionContent');
    if (!item || !modal || !content) return;

    const estado = normalizarEstadoLogistica(item.logistics_status || item.estado);
    const material = item.material_logistica || {};

    content.innerHTML = `
        <div class="logistics-prep-header">
            <div>
                <h2>${item.empresa || item.codigo_cocina || item.codigo || 'Servicio'}</h2>
                <p>${item.codigo_cocina || item.codigo || ''} · ${item.pax || 0} pax · ${item.fecha_evento || 'Sin fecha'}</p>
            </div>
        </div>

        <div class="logistics-prep-state">
            <label>Estado general:</label>
            <select onchange="actualizarEstadoLogistica(${index}, this.value); abrirPreparacionLogistica(${index});">
                <option value="sin_preparar" ${estado === 'sin_preparar' ? 'selected' : ''}>Sin preparar</option>
                <option value="en_preparacion" ${estado === 'en_preparacion' ? 'selected' : ''}>En preparación</option>
                <option value="listo" ${estado === 'listo' ? 'selected' : ''}>Listo para evento</option>
            </select>
        </div>

        ${getCategoriasMaterialLogistica().map(cat => {
            const items = material[cat.key] || [];
            if (!items.length) return '';
            return `
                <section class="logistics-prep-group">
                    <h3>${cat.label.toUpperCase()}</h3>
                    <div class="logistics-prep-list">
                        ${items.map((mat, matIndex) => renderizarItemPreparacionLogistica(index, cat.key, mat, matIndex)).join('')}
                    </div>
                </section>
            `;
        }).join('')}

        <div class="logistics-prep-actions">
            <button type="button" class="btn-secondary" onclick="cerrarPreparacionLogistica()">Cerrar</button>
            <button type="button" class="btn-primary" onclick="cerrarPreparacionLogistica()">Guardar cambios</button>
        </div>
    `;

    modal.style.display = 'block';
}

function renderizarItemPreparacionLogistica(index, tipo, item, matIndex) {
    const preparado = !!item.preparado;
    return `
        <label class="logistics-prep-item">
            <input type="checkbox" ${preparado ? 'checked' : ''}
                onchange="togglePreparadoLogistica(${index}, '${tipo}', ${matIndex}, this.checked)">
            <span class="logistics-prep-check">${preparado ? '✓' : ''}</span>
            <span class="logistics-prep-name">
                <strong>${item.nombre || 'Material'}</strong>
                <small>${item.cantidad || 0} ${item.unidad || ''}</small>
            </span>
            <span class="logistics-prep-pill ${preparado ? 'is-ready' : ''}">${preparado ? 'Preparado' : 'Pendiente'}</span>
        </label>
    `;
}

function cerrarPreparacionLogistica() {
    const modal = document.getElementById('logisticaPreparacionModal');
    if (modal) modal.style.display = 'none';
    renderizarComandasLogistica();
}

function togglePreparadoLogistica(index, tipo, matIndex, checked) {
    const item = (window.logisticaEventosActivos || getEventosLogisticaActivos())[index];
    if (!item?.material_logistica?.[tipo]?.[matIndex]) return;

    item.material_logistica[tipo][matIndex].preparado = checked;
    const total = getMaterialLogisticaPlano(item.material_logistica).length;
    const preparados = getMaterialLogisticaPlano(item.material_logistica).filter(mat => mat.preparado).length;
    item.logistics_prepared_items = preparados;
    if (preparados > 0 && normalizarEstadoLogistica(item.logistics_status || item.estado) === 'sin_preparar') {
        item.logistics_status = 'en_preparacion';
        item.estado = 'en_preparacion';
    }
    if (total > 0 && preparados === total) {
        item.logistics_status = 'listo';
        item.estado = 'listo';
        item.logistics_ready_at = new Date().toISOString();
        item.logistics_ready_by = window.currentUser?.user_metadata?.full_name || window.currentUser?.email || '';
    }
    item.fecha_modificacion = new Date().toISOString();
    guardarEventoLogisticaActivo(item);
    abrirPreparacionLogistica(index);
}

function actualizarResponsableLogistica(index, value) {
    const item = (window.logisticaEventosActivos || getEventosLogisticaActivos())[index];
    if (!item) return;
    item.logistics_assigned_to = value.trim();
    item.fecha_modificacion = new Date().toISOString();
    guardarEventoLogisticaActivo(item);
    renderizarComandasLogistica();
}

function actualizarEstadoLogistica(index, value) {
    const item = (window.logisticaEventosActivos || getEventosLogisticaActivos())[index];
    if (!item) return;
    item.logistics_status = value;
    item.estado = value;
    item.fecha_modificacion = new Date().toISOString();
    if (value === 'listo') {
        item.logistics_ready_at = new Date().toISOString();
        item.logistics_ready_by = window.currentUser?.user_metadata?.full_name || window.currentUser?.email || '';
    }
    guardarEventoLogisticaActivo(item);
    renderizarComandasLogistica();
}

function actualizarPreparadosLogistica(index, value) {
    const item = (window.logisticaEventosActivos || getEventosLogisticaActivos())[index];
    if (!item) return;
    const material = item.material_logistica || {};
    const totalMaterial = ['bebidas', 'menaje', 'extras'].reduce((acc, tipo) => acc + ((material[tipo] || []).length), 0);
    item.logistics_prepared_items = Math.max(0, Math.min(Number(value) || 0, totalMaterial || 0));
    item.fecha_modificacion = new Date().toISOString();
    guardarEventoLogisticaActivo(item);
    renderizarComandasLogistica();
}

async function renderizarInventarioLogistica() {
    const cont = document.getElementById('logisticaInventarioList');
    if (!cont) return;

    if (!window.supabaseClient) {
        cont.innerHTML = '<div class="logistics-empty">No se pudo conectar con Supabase para cargar el inventario.</div>';
        return;
    }

    cont.innerHTML = '<div class="logistics-empty">Cargando inventario...</div>';

    try {
        const { data, error } = await window.supabaseClient
            .from('service_logistics_materials')
            .select('*')
            .eq('activo', true)
            .order('orden', { ascending: true });

        if (error) throw error;

        const items = (data || []).map(normalizarItemInventarioServicios);
        window.logisticaInventarioItems = items;
        pintarInventarioLogistica('todos');
    } catch (error) {
        console.error('Error cargando inventario de logística:', error);
        cont.innerHTML = '<div class="logistics-empty">No se pudo cargar el inventario.</div>';
    }
}

function filtrarInventarioLogistica(tipo) {
    document.querySelectorAll('.logistics-filter-chip').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.filter === tipo);
    });
    pintarInventarioLogistica(tipo);
}

function pintarInventarioLogistica(filtro = 'todos') {
    const cont = document.getElementById('logisticaInventarioList');
    if (!cont) return;
    const items = (window.logisticaInventarioItems || []).filter(item => !item.parent_id);
    const categorias = getCategoriasMaterialLogistica().filter(cat => filtro === 'todos' || cat.key === filtro);

    cont.innerHTML = categorias.map(cat => {
        const list = items.filter(item => item.tipo === cat.key);
        return `
            <section class="logistics-inventory-group">
                <h3><span>${cat.icon}</span> ${cat.label} <small>(${list.length})</small></h3>
                <div class="logistics-inventory-cards">
                    ${list.length ? list.map(item => `
                        <article class="logistics-inventory-card" data-logistica-id="${item.id}">
                            <div>
                                <strong>${escapeLogisticaHtml(item.nombre)}</strong>
                                <span>${escapeLogisticaHtml(item.presentacion || item.descripcion || item.categoria || item.unidad || 'Inventario')}</span>
                                <small><b>${Number(item.stock_total ?? item.stock ?? 0)}</b> ${escapeLogisticaHtml(item.unidad_stock || item.unidad || 'ud')} en stock</small>
                            </div>
                            <div class="logistics-inventory-actions">
                                <button type="button" class="inventory-action-btn inventory-action-btn--edit" title="Editar" aria-label="Editar"></button>
                                <button type="button" class="inventory-action-btn inventory-action-btn--delete" title="Eliminar" aria-label="Eliminar"></button>
                            </div>
                        </article>
                    `).join('') : '<div class="logistics-empty logistics-empty--small">Sin elementos</div>'}
                </div>
            </section>
        `;
    }).join('');

    cont.querySelectorAll('.logistics-inventory-actions button[title="Editar"]').forEach(btn => {
        btn.addEventListener('click', event => {
            event.stopPropagation();
            const id = event.currentTarget.closest('.logistics-inventory-card')?.dataset.logisticaId;
            if (id) abrirModalArticuloLogistica(id);
        });
    });

    cont.querySelectorAll('.logistics-inventory-actions button[title="Eliminar"]').forEach(btn => {
        btn.addEventListener('click', event => {
            event.stopPropagation();
            const id = event.currentTarget.closest('.logistics-inventory-card')?.dataset.logisticaId;
            if (id) eliminarArticuloInventarioLogistica(id);
        });
    });
}

/**
 * Muestra el historial de comandas
 */
function mostrarHistorial() {
    const dashboard = document.getElementById('dashboard');
    const comandaForm = document.getElementById('comandaForm');
    const historialPage = document.getElementById('historialPage');
    const detalleComanda = document.getElementById('detalleComanda');
    const logisticaForm = document.getElementById('logisticaForm');
    const logisticaPage = document.getElementById('logisticaPage');
    const expedientePedido = document.getElementById('expedientePedido');
    const clientesPanel = document.getElementById('clientesPanel');

    if (dashboard) dashboard.style.display = 'none';
    if (comandaForm) comandaForm.style.display = 'none';
    if (detalleComanda) detalleComanda.style.display = 'none';
    if (logisticaForm) logisticaForm.style.display = 'none';
    if (logisticaPage) logisticaPage.style.display = 'none';
    if (expedientePedido) {
        expedientePedido.hidden = true;
        expedientePedido.style.display = 'none';
    }
    if (clientesPanel) clientesPanel.style.display = 'none';
    if (historialPage) historialPage.style.display = 'block';

    if (typeof setNavActive === 'function') setNavActive('nav-historial');
    
    if (typeof cargarHistorial === 'function') {
        cargarHistorial();
    }
}

/**
 * Vuelve al dashboard principal
 */
function volverAlDashboard() {
    window.serviciosMode = false;
    const categoriaGroup = document.getElementById('categoriaMenuGroup');
    const serviciosGroup = document.getElementById('serviciosCategoriaGroup');
    const title = document.getElementById('comandaFormTitle');
    const subtitle = document.getElementById('comandaFormSubtitle');
    if (categoriaGroup) categoriaGroup.style.display = '';
    if (serviciosGroup) serviciosGroup.style.display = 'none';
    const comandaFormEl = document.getElementById('comandaForm');
    if (comandaFormEl) comandaFormEl.classList.remove('servicios-mode');
    if (title) title.textContent = 'Nueva Comanda';
    if (subtitle) subtitle.textContent = 'Completa los datos del pedido de catering';

    document.getElementById('dashboard').style.display = 'block';
    document.getElementById('comandaForm').style.display = 'none';
    const logisticaForm = document.getElementById('logisticaForm');
    if (logisticaForm) logisticaForm.style.display = 'none';
    const logisticaPage = document.getElementById('logisticaPage');
    if (logisticaPage) logisticaPage.style.display = 'none';
    document.getElementById('historialPage').style.display = 'none';
    const expedientePedido = document.getElementById('expedientePedido');
    if (expedientePedido) expedientePedido.style.display = 'none';
    document.getElementById('detalleComanda').style.display = 'none';
    const clientesPanel = document.getElementById('clientesPanel');
    if (clientesPanel) clientesPanel.style.display = 'none';

    window.comandaEditando = null;
    window.menuSeleccionado = null;
    window.referenciasSeleccionadas = { gris: [], rojo: [], postres: [] };
    window.pax = 0;
    window.foodboxSelecciones = { ensaladas: [], sandwiches: [], postres: [] };

    // Limpiar paginación de referencias
    if (window.referenciasPaginacion) {
        ['gris', 'rojo', 'postres'].forEach(tipo => {
            if (window.referenciasPaginacion[tipo]) {
                window.referenciasPaginacion[tipo].page = 1;
                window.referenciasPaginacion[tipo].query = '';
                window.referenciasPaginacion[tipo].items = [];
            }
        });
    }

    // Limpiar formulario
    const form = document.getElementById('comandaCocinaForm');
    if (form) form.reset();
    if (typeof limpiarBuscadorClientes === 'function') {
        limpiarBuscadorClientes();
    }

    // Limpiar PAX explícitamente
    const paxInput = document.getElementById('pax');
    if (paxInput) paxInput.value = '';

    // Limpiar selector de categoría y menús
    const catSelect = document.getElementById('categoria');
    if (catSelect) catSelect.value = '';
    const menusContainer = document.getElementById('menusContainer');
    if (menusContainer) menusContainer.innerHTML = '';

    // Limpiar secciones DIY
    const diyDesayunosSection = document.getElementById('diyDesayunosSection');
    if (diyDesayunosSection) diyDesayunosSection.remove();
    const diyFoodboxSection = document.getElementById('diyFoodboxSection');
    if (diyFoodboxSection) diyFoodboxSection.remove();

    // Limpiar secciones dinámicas adicionales
    const desayunoSection = document.getElementById('desayunoReferencesSection');
    if (desayunoSection) desayunoSection.style.display = 'none';
    const foodboxLunchSection = document.getElementById('foodboxLunchSection');
    if (foodboxLunchSection) foodboxLunchSection.remove();

    // Limpiar grids de referencias
    ['referenciasGrisGrid','referenciasRojoGrid','referenciasPostresGrid'].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.innerHTML = '';
    });
    // Limpiar buscadores
    ['referenciasGrisGrid__search','referenciasRojoGrid__search','referenciasPostresGrid__search'].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.value = '';
    });
    // Limpiar selección visual de menús
    document.querySelectorAll('.menu-option.selected').forEach(el => el.classList.remove('selected'));

    // Limpiar estado de BandejasState
    if (window.BandejasState) {
        ['diy_dulces','diy_salados','diy_termos',
         'diy_fb_saladas','diy_fb_postres'].forEach(k => {
            if (window.BandejasState[k]) {
                window.BandejasState[k].items = [];
                window.BandejasState[k].selected = [];
            }
        });
    }

    // Limpiar material de logística
    if (typeof window.limpiarMaterialLogistica === 'function') {
        window.limpiarMaterialLogistica();
    }
    const matInline = document.getElementById('materialLogisticaInline');
    if (matInline) {
        matInline.style.display = 'none';
        matInline.innerHTML = '';
    }
    const logisticaSection = document.getElementById('logisticaInlineSection');
    if (logisticaSection) logisticaSection.style.display = 'none';

    // Limpiar secciones de referencias y multiplicadores
    const multiplicadorSection = document.getElementById('multiplicadorSection');
    if (multiplicadorSection) multiplicadorSection.style.display = 'none';
    const referenciasSection = document.getElementById('referenciasSection');
    if (referenciasSection) referenciasSection.style.display = 'none';

    // Limpiar zumos de logística
    if (window.materialLogistica?.bebidas) {
        window.materialLogistica.bebidas = window.materialLogistica.bebidas.filter(i => !i._zumoId);
    }

    // Limpiar campos de logística inline
    if (typeof limpiarCamposLogisticaInline === 'function') limpiarCamposLogisticaInline();

    // Limpiar resumen lateral
    if (typeof window.resetearMenusAcumulados === 'function') window.resetearMenusAcumulados();

    if (typeof cargarCalendario === 'function') {
        cargarCalendario();
    }
}

/**
 * Vuelve al historial desde el detalle
 */
function volverAlHistorial() {
    document.getElementById('historialPage').style.display = 'block';
    const expedientePedido = document.getElementById('expedientePedido');
    if (expedientePedido) expedientePedido.style.display = 'none';
    document.getElementById('detalleComanda').style.display = 'none';
    
    if (typeof cargarHistorial === 'function') {
        cargarHistorial();
    }
}

/**
 * Inicializa el material de logística inline cuando se selecciona categoría
 * Se llama desde comanda-form.js o referencias.js al cargar menús
 */
function inicializarMaterialLogisticaInline(categoriaId) {
    const container = document.getElementById('materialLogisticaInline');
    const seccionLog = document.getElementById('logisticaInlineSection');
    
    if (!container) return;
    
    // Solo mostrar si la sección de logística inline está visible
    if (seccionLog && seccionLog.style.display !== 'none') {
        container.style.display = 'block';
        
        // Inicializar tabla
        if (typeof window.inicializarMaterialLogistica === 'function') {
            window.inicializarMaterialLogistica('materialLogisticaInline');
        }
        
        // Autocompletar según categoría
        if (typeof window.autocompletarMaterialPorCategoria === 'function' && categoriaId) {
            window.autocompletarMaterialPorCategoria(categoriaId, 'materialLogisticaInline');
        }
    } else {
        container.style.display = 'none';
    }
}

/**
 * Inicializa el material para la página separada de logística (Cocteles)
 */
function inicializarMaterialLogisticaPage(categoriaId) {
    const container = document.getElementById('materialLogisticaPage');
    if (!container) return;
    
    // Inicializar tabla
    if (typeof window.inicializarMaterialLogistica === 'function') {
        window.inicializarMaterialLogistica('materialLogisticaPage');
    }
    
    // Autocompletar según categoría (cat 3 = servicios)
    if (typeof window.autocompletarMaterialPorCategoria === 'function' && categoriaId) {
        window.autocompletarMaterialPorCategoria(categoriaId, 'materialLogisticaPage');
    }
}
