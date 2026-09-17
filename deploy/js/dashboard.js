// ========== NAVEGACIÓN PRINCIPAL ==========

function getFechaLocalHoyDashboard() {
    const hoy = new Date();
    const yyyy = hoy.getFullYear();
    const mm = String(hoy.getMonth() + 1).padStart(2, '0');
    const dd = String(hoy.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
}

function sumarDiasFechaLocalDashboard(fechaIso, dias) {
    const [yyyy, mm, dd] = String(fechaIso || '').split('-').map(Number);
    const fecha = new Date(yyyy, (mm || 1) - 1, dd || 1);
    fecha.setDate(fecha.getDate() + Number(dias || 0));
    const y = fecha.getFullYear();
    const m = String(fecha.getMonth() + 1).padStart(2, '0');
    const d = String(fecha.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
}

window.cocinaFiltroPeriodo = window.cocinaFiltroPeriodo || 'hoy';
window.logisticaFiltroPeriodo = window.logisticaFiltroPeriodo || 'hoy';
window.rutasLogisticaState = window.rutasLogisticaState || {
    vehicles: [],
    drivers: [],
    allDrivers: [],
    routes: [],
    loading: false,
    editingRouteId: null
};

function aplicarFiltroHoySiExiste(inputId) {
    const input = document.getElementById(inputId);
    if (input) input.value = getFechaLocalHoyDashboard();
    if (inputId === 'cocinaFiltroFecha') window.cocinaFiltroPeriodo = 'hoy';
    if (inputId === 'logisticaFiltroFecha') window.logisticaFiltroPeriodo = 'hoy';
}

function getSemanaLocalDashboard() {
    const hoy = new Date();
    const dia = hoy.getDay() || 7;
    const inicio = new Date(hoy);
    inicio.setDate(hoy.getDate() - dia + 1);
    const fin = new Date(inicio);
    fin.setDate(inicio.getDate() + 6);
    const toIso = fecha => {
        const yyyy = fecha.getFullYear();
        const mm = String(fecha.getMonth() + 1).padStart(2, '0');
        const dd = String(fecha.getDate()).padStart(2, '0');
        return `${yyyy}-${mm}-${dd}`;
    };
    return { inicio: toIso(inicio), fin: toIso(fin) };
}

function filtrarEventosPorPeriodoDashboard(eventos, getFechaItem, inputId, periodo) {
    if (periodo === 'todo') {
        return eventos || [];
    }
    if (periodo === 'semana') {
        const { inicio, fin } = getSemanaLocalDashboard();
        return (eventos || []).filter(item => {
            const fecha = getFechaItem(item);
            return fecha >= inicio && fecha <= fin;
        });
    }
    const fechaFiltro = document.getElementById(inputId)?.value || '';
    if (fechaFiltro) {
        return (eventos || []).filter(item => getFechaItem(item) === fechaFiltro);
    }
    const hoy = getFechaLocalHoyDashboard();
    return (eventos || []).filter(item => getFechaItem(item) === hoy);
}

function actualizarBotonesPeriodoDashboard(prefix, periodo) {
    ['Hoy', 'Semana', 'Todo'].forEach(nombre => {
        const btn = document.getElementById(`${prefix}Filtro${nombre}Btn`);
        if (btn) btn.classList.toggle('active', nombre.toLowerCase() === periodo);
    });
}

function puedeEditarCocina() {
    return !window.AppPermissions || AppPermissions.canEditKitchen();
}

function puedeEditarLogistica() {
    return !window.AppPermissions || AppPermissions.canEditLogistics();
}

function requireEditarCocina() {
    return !window.AppPermissions || AppPermissions.requireKitchen();
}

function requireEditarLogistica() {
    return !window.AppPermissions || AppPermissions.requireLogistics();
}

function mostrarCodigoComandaAsignado(codigo, estado = '') {
    const preview = document.getElementById('codigoComandaPreview');
    const value = document.getElementById('codigoComandaAsignado');
    if (!preview || !value) return;
    preview.style.display = '';
    value.textContent = codigo || estado || 'Asignando...';
}

window.mostrarCodigoComandaAsignado = mostrarCodigoComandaAsignado;

async function prepararCodigoNuevaComanda() {
    if (window.comandaEditando) {
        mostrarCodigoComandaAsignado(window.comandaEditando.codigo || window.comandaEditando.codigo_comanda || '');
        return;
    }
    mostrarCodigoComandaAsignado('', 'Asignando...');
    if (typeof window.reservarCodigoComanda !== 'function') {
        mostrarCodigoComandaAsignado('', 'Pendiente');
        return;
    }
    const codigo = await window.reservarCodigoComanda();
    mostrarCodigoComandaAsignado(codigo);
}

/**
 * Muestra el formulario de comanda de cocina
 */
async function mostrarComandaCocina(options = {}) {
    if (!window.comandaEditando && window.AppPermissions && !AppPermissions.requireCreateOrders('Tu usuario no tiene permiso para crear comandas.')) {
        return;
    }

    if (!window.comandaEditando && typeof window.liberarCodigoComandaPendiente === 'function') {
        await window.liberarCodigoComandaPendiente('abrir_nueva_comanda');
    }

    window.serviciosMode = false;
    const title = document.getElementById('comandaFormTitle');
    const subtitle = document.getElementById('comandaFormSubtitle');
    const categoriaGroup = document.getElementById('categoriaMenuGroup');
    const serviciosGroup = document.getElementById('serviciosCategoriaGroup');
    const tipoMenajeGroup = document.getElementById('tipoMenajeGroup');
    const comandaFormEl = document.getElementById('comandaForm');
    const notasLogisticaInline = document.getElementById('logisticaInlineNotasSection');
    if (title) title.textContent = 'Nueva Comanda';
    if (subtitle) subtitle.textContent = 'Completa los datos del pedido de catering';
    if (categoriaGroup) categoriaGroup.style.display = '';
    if (serviciosGroup) serviciosGroup.style.display = 'none';
    if (tipoMenajeGroup) tipoMenajeGroup.style.display = '';
    if (comandaFormEl) comandaFormEl.classList.remove('servicios-mode');
    if (notasLogisticaInline) notasLogisticaInline.style.display = '';

    const logisticaForm = document.getElementById('logisticaForm');
    if (logisticaForm) logisticaForm.style.display = 'none';
    const logisticaPage = document.getElementById('logisticaPage');
    if (logisticaPage) logisticaPage.style.display = 'none';
    const cocinaPage = document.getElementById('cocinaPage');
    if (cocinaPage) cocinaPage.style.display = 'none';
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
            limpiarFormularioComanda({ liberarReserva: false });
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
    const fechaInicial = options.fechaEvento || options.fecha_evento || hoy;
    document.getElementById('fecha_evento').value = fechaInicial;
    if (typeof window.actualizarDiaFechaEvento === 'function') {
        window.actualizarDiaFechaEvento();
    }
    prepararCodigoNuevaComanda();
}

/**
 * Abre el formulario principal con la categoria Servicios seleccionada.
 */
async function mostrarServicios(options = {}) {
    if (window.AppPermissions && !AppPermissions.requireCreateOrders('Tu usuario no tiene permiso para crear servicios.')) {
        return;
    }

    window.serviciosMode = true;
    await mostrarComandaCocina(options);
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
    const tipoMenajeGroup = document.getElementById('tipoMenajeGroup');
    const tipoMenaje = document.getElementById('tipo_menaje');

    if (title) title.textContent = 'Nueva Comanda';
    if (subtitle) subtitle.textContent = 'Completa los datos del pedido de catering';
    if (categoriaGroup) categoriaGroup.style.display = '';
    if (serviciosGroup) serviciosGroup.style.display = '';
    if (tipoMenajeGroup) tipoMenajeGroup.style.display = 'none';
    if (serviciosCategoria) serviciosCategoria.value = '';
    if (tipoMenaje) tipoMenaje.value = 'loza';
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
    if (typeof setNavActive === 'function') setNavActive('nav-comanda');
}

/**
 * Muestra el módulo de logística
 */
async function mostrarLogistica() {
    if (typeof window.liberarCodigoComandaPendienteSinEsperar === 'function') {
        window.liberarCodigoComandaPendienteSinEsperar('mostrar_logistica');
    }

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
    const cocinaPage = document.getElementById('cocinaPage');
    if (cocinaPage) cocinaPage.style.display = 'none';

    if (typeof setNavActive === 'function') setNavActive('nav-logistica');
    aplicarFiltroHoySiExiste('logisticaFiltroFecha');
    await cargarModuloLogistica();
}

async function cargarModuloLogistica() {
    if (typeof window.cargarHistorialRemotoSupabase === 'function') {
        await window.cargarHistorialRemotoSupabase({ render: false });
    }
    renderizarComandasLogistica();
    await renderizarInventarioLogistica();
    const rutasPanel = document.getElementById('logisticaRutasPanel');
    if (rutasPanel && rutasPanel.style.display !== 'none') {
        await cargarModuloRutasLogistica();
    }
}

async function mostrarCocina() {
    if (typeof window.liberarCodigoComandaPendienteSinEsperar === 'function') {
        window.liberarCodigoComandaPendienteSinEsperar('mostrar_cocina');
    }

    document.getElementById('dashboard').style.display = 'none';
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

    const cocinaPage = document.getElementById('cocinaPage');
    if (cocinaPage) cocinaPage.style.display = 'block';

    if (typeof setNavActive === 'function') setNavActive('nav-cocina');
    aplicarFiltroHoySiExiste('cocinaFiltroFecha');
    if (typeof window.cargarHistorialRemotoSupabase === 'function') {
        await window.cargarHistorialRemotoSupabase({ render: false });
    }
    renderizarComandasCocina();
}

async function refrescarAlertasOperativas() {
    const cocinaPage = document.getElementById('cocinaPage');
    const logisticaPage = document.getElementById('logisticaPage');

    if (!document.hidden && typeof window.cargarHistorialRemotoSupabase === 'function') {
        await window.cargarHistorialRemotoSupabase({ render: false });
    }

    if (cocinaPage && cocinaPage.style.display !== 'none') {
        renderizarComandasCocina();
    }

    if (logisticaPage && logisticaPage.style.display !== 'none') {
        renderizarComandasLogistica();
    }

    refrescarAlertasOperativasGlobales();
}

if (window._alertasOperativasTimer) {
    clearInterval(window._alertasOperativasTimer);
}
window._alertasOperativasTimer = setInterval(refrescarAlertasOperativas, 3000);

if (!window._alertasOperativasRealtimeBound) {
    window._alertasOperativasRealtimeBound = true;
    prepararSonidoAlertasOperativas();
    window.addEventListener('focus', refrescarAlertasOperativas);
    document.addEventListener('visibilitychange', () => {
        if (!document.hidden) refrescarAlertasOperativas();
    });
}

function getHistorialCocinaModulo() {
    return window.CaterCloudStorage?.leerHistorialComandasLocal?.()
        || JSON.parse(localStorage.getItem('historialComandas') || '[]');
}

function guardarHistorialCocinaModulo(historial) {
    if (window.CaterCloudStorage?.guardarHistorialComandasLocal) {
        window.CaterCloudStorage.guardarHistorialComandasLocal(historial || []);
        return;
    }
    localStorage.setItem('historialComandas', JSON.stringify(historial || []));
}

async function sincronizarAccionesOperativasSupabase(codigo, patch) {
    if (!codigo || !window.supabaseClient || !window.currentUser?.id) return false;

    try {
        const { data, error: selectError } = await window.supabaseClient
            .from('orders')
            .select('payload')
            .eq('codigo', codigo)
            .maybeSingle();

        if (selectError || !data) {
            throw selectError || new Error(`No se encontro la comanda ${codigo} en Supabase.`);
        }

        const payloadActual = data.payload || {};
        const payload = {
            ...payloadActual,
            ...patch,
            fecha_modificacion: new Date().toISOString(),
            editado_por_id: window.currentUser.id,
            editado_por_nombre: getOperativeActorName(),
            editado_por_email: window.currentUser.email || ''
        };

        const { error: updateError } = await window.supabaseClient
            .from('orders')
            .update({
                payload,
                updated_by: window.currentUser.id,
                updated_at: new Date().toISOString()
            })
            .eq('codigo', codigo);

        if (updateError) throw updateError;
        return true;
    } catch (error) {
        console.warn('No se pudo sincronizar la actividad operativa con Supabase:', error);
        if (typeof mostrarMensaje === 'function') {
            mostrarMensaje('El cambio quedó en este navegador, pero no se pudo compartir con otros usuarios. Revisa permisos o conexión.', 'warning');
        }
        return false;
    }
}

function getFechaCocinaItem(item) {
    return String(item?.fecha_evento || item?.fecha_creacion || '').split('T')[0];
}

function getHoraEntregaItem(item) {
    return item?.logistica_inline?.hora_entrega ||
        item?.logistica?.hora_entrega ||
        item?.hora_entrega ||
        '';
}

function getHoraSalidaItem(item) {
    return item?.hora_salida ||
        item?.salida ||
        item?.logistica_inline?.hora_salida ||
        item?.logistica?.hora_salida ||
        '';
}

function compararEventosPorSalidaAscendente(a, b, getFechaItem) {
    const fechaA = getFechaItem(a);
    const fechaB = getFechaItem(b);
    if (fechaA !== fechaB) return String(fechaA || '').localeCompare(String(fechaB || ''));

    const minutosA = parseHoraRutaEnMinutos(getHoraSalidaItem(a));
    const minutosB = parseHoraRutaEnMinutos(getHoraSalidaItem(b));
    const ordenA = minutosA === null ? Number.MAX_SAFE_INTEGER : minutosA;
    const ordenB = minutosB === null ? Number.MAX_SAFE_INTEGER : minutosB;
    if (ordenA !== ordenB) return ordenA - ordenB;

    return String(a?.codigo || a?.codigo_comanda || a?.codigo_cocina || '')
        .localeCompare(String(b?.codigo || b?.codigo_comanda || b?.codigo_cocina || ''));
}

function normalizarEstadoCocina(estado) {
    if (estado === 'proceso') return 'en_produccion';
    if (estado === 'completada' || estado === 'listo') return 'listo';
    if (estado === 'creada' || estado === 'sin_preparar') return 'sin_producir';
    return estado || 'sin_producir';
}

function getEstadoCocinaOperativo(item = {}) {
    let estadoOperativo = 'sin_producir';
    if (item.kitchen_status || item.estado_cocina) {
        estadoOperativo = normalizarEstadoCocina(item.kitchen_status || item.estado_cocina);
    } else {
        const estado = String(item.estado || '').trim();
        if (estado === 'proceso' || estado === 'en_produccion' || estado === 'completada') {
            estadoOperativo = normalizarEstadoCocina(estado);
        }
    }

    const total = getTotalItemsProduccionCocina(item);
    if (!total) return estadoOperativo;

    const producidos = Math.min(getProducidosCocina(item), total);
    if (producidos >= total) return 'listo';
    if (producidos > 0 && estadoOperativo === 'sin_producir') return 'en_produccion';
    if (estadoOperativo === 'listo') return producidos > 0 ? 'en_produccion' : 'sin_producir';
    return estadoOperativo;
}

function getLabelEstadoCocina(estado) {
    const labels = {
        sin_producir: 'Sin producir',
        en_produccion: 'En produccion',
        listo: 'Listo para salida'
    };
    return labels[normalizarEstadoCocina(estado)] || 'Sin producir';
}

function getClaseEstadoCocina(estado) {
    const normalizado = normalizarEstadoCocina(estado);
    if (normalizado === 'en_produccion') return 'en_preparacion';
    if (normalizado === 'listo') return 'listo';
    return 'sin_preparar';
}

function getEstadoConfirmacionOperativa(item = {}) {
    const estado = String(
        item.estado_confirmacion ||
        item.confirmation_status ||
        item.estado_pedido ||
        ''
    ).trim();
    if (estado === 'confirmado' || estado === 'por_confirmar' || estado === 'anulada') return estado;
    if (item.estado === 'confirmado' || item.estado === 'por_confirmar' || item.estado === 'anulada') return item.estado;
    return 'confirmado';
}

function pedidoOperativoConfirmado(item = {}) {
    return getEstadoConfirmacionOperativa(item) === 'confirmado';
}

function getConfirmacionOperativaHtml(item = {}, modo = 'pill') {
    const estado = getEstadoConfirmacionOperativa(item);
    const label = estado === 'confirmado'
        ? 'Confirmada'
        : estado === 'anulada'
            ? 'Anulada'
            : 'Por confirmar';
    if (modo === 'banner' && estado !== 'confirmado') {
        return `<div class="operative-confirmation-banner operative-confirmation-banner--${estado}">
            ${estado === 'anulada'
                ? 'Esta comanda esta anulada. No debe prepararse.'
                : 'Esta comanda aun esta por confirmar. No iniciar produccion ni logistica hasta confirmacion.'}
        </div>`;
    }
    return `<span class="operative-confirmation-pill operative-confirmation-pill--${estado}">${label}</span>`;
}

function getMenusCocinaComanda(item) {
    const menus = [];
    const principal = item.menu_principal || item.menu || null;
    if (principal && typeof principal === 'object') {
        menus.push({
            nombre: principal.nombre || item.menu_nombre || 'Menu',
            pax: principal.pax || item.pax || 0
        });
    } else if (principal || item.menu_nombre || item.menu_categoria_nombre) {
        menus.push({
            nombre: principal || item.menu_nombre || item.menu_categoria_nombre || 'Menu',
            pax: item.pax || 0
        });
    }

    (item.menus_adicionales || []).forEach(menu => {
        menus.push({
            nombre: menu.nombre || menu.menu_principal?.nombre || 'Menu adicional',
            pax: menu.pax || menu.menu_principal?.pax || 0
        });
    });

    return menus.filter(menu => menu.nombre);
}

function getResumenMenusConPax(item) {
    return getMenusCocinaComanda(item)
        .map(menu => `${escapeLogisticaHtml(menu.nombre)} (${menu.pax || 0} pax)`)
        .join(', ');
}

function distribuirCantidadCocina(total, partes) {
    const cantidadTotal = Math.max(0, Number(total) || 0);
    const cantidadPartes = Math.max(1, Number(partes) || 1);
    const base = Math.floor(cantidadTotal / cantidadPartes);
    const resto = cantidadTotal % cantidadPartes;
    return Array.from({ length: cantidadPartes }, (_, index) => base + (index < resto ? 1 : 0));
}

function normalizarMenuProduccion(menu, comanda, esPrincipal) {
    const item = menu && typeof menu === 'object' ? { ...menu } : {};
    item.nombre = item.nombre || item.menu_principal?.nombre || (esPrincipal ? comanda.menu_nombre : '') || comanda.menu_categoria_nombre || 'Menu';
    item.pax = Number(item.pax || item.menu_principal?.pax || (esPrincipal ? comanda.pax : 0) || 0);
    item.categoriaId = item.categoriaId || item.categoria_id || item._cat || (esPrincipal ? (comanda.categoria_id || comanda.categoriaId || comanda.categoria) : null);
    item.referencias_desayuno = item.referencias_desayuno || (esPrincipal ? comanda.referencias_desayuno : null);
    item.referencias = item.referencias || (esPrincipal ? comanda.referencias : null);
    item.foodbox_lunch = item.foodbox_lunch || (esPrincipal ? comanda.foodbox_lunch : null);
    item.bandejas = item.bandejas || (esPrincipal ? comanda.bandejas : null);
    item.multiplicadores = item.multiplicadores || (esPrincipal ? comanda.multiplicadores : null);
    return item;
}

function getMenusProduccionCocina(comanda) {
    const menus = [];
    if (comanda.menu_principal) {
        menus.push(normalizarMenuProduccion(comanda.menu_principal, comanda, true));
    } else if (comanda.menu || comanda.menu_nombre || comanda.menu_categoria_nombre) {
        menus.push(normalizarMenuProduccion({}, comanda, true));
    }

    (comanda.menus_adicionales || []).forEach(menu => {
        menus.push(normalizarMenuProduccion(menu, comanda, false));
    });

    return menus.filter(menu => menu.nombre);
}

function crearItemProduccion(menuIndex, grupo, nombre, cantidad, unidad, orden) {
    const limpio = String(nombre || '').trim();
    if (!limpio) return null;
    const qty = Number(cantidad || 0);
    const baseKey = `${menuIndex}:${grupo}:${orden}:${limpio}`.toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '');
    return {
        key: baseKey || `${menuIndex}-${grupo}-${orden}`,
        grupo,
        nombre: limpio,
        cantidad: qty,
        unidad: unidad || 'uds'
    };
}

function agregarItemProduccion(lista, menuIndex, grupo, nombre, cantidad, unidad) {
    const item = crearItemProduccion(menuIndex, grupo, nombre, cantidad, unidad, lista.length + 1);
    if (item && (item.cantidad > 0 || cantidad === '' || cantidad === null || cantidad === undefined)) {
        lista.push(item);
    }
}

function getItemsProduccionMenu(menu, menuIndex) {
    const items = [];
    const pax = Number(menu.pax || 0);

    if (menu.referencias_desayuno && Object.keys(menu.referencias_desayuno).length) {
        const refs = Object.entries(menu.referencias_desayuno)
            .map(([key, ref], index) => ({ key, ref, index }))
            .filter(item => item.ref && item.ref.cantidad > 0)
            .map(item => ({ ...item.ref, _refKey: item.key }));

        refs.forEach(ref => {
            const refKey = ref.id || ref._refKey || '';

            if (ref.tipo === 'termo' || ref.tipo === 'leche_especial') {
                const tipoTermo = ref.tipoTermo ? ` (${ref.tipoTermo})` : '';
                agregarItemProduccion(items, menuIndex, 'Termos y bebidas', `${ref.nombre || ref.sabor || refKey}${tipoTermo}`, ref.cantidad, ref.unidad || 'termo');
                return;
            }

            if (ref.tipo === 'bolleria' && ref.opcionesSeleccionadas?.length) {
                const cantidades = distribuirCantidadCocina(ref.cantidad || pax, ref.opcionesSeleccionadas.length);
                ref.opcionesSeleccionadas.forEach((opcion, index) => {
                    agregarItemProduccion(items, menuIndex, 'Bolleria', opcion, cantidades[index], ref.unidad || 'uds');
                });
                return;
            }

            if (ref.tipo === 'sandwich_multiple' && ref.sandwiches?.length) {
                const sandwiches = ref.sandwiches.filter(s => s.sabor);
                const cantidades = distribuirCantidadCocina(ref.cantidad || pax, sandwiches.length);
                sandwiches.forEach((s, index) => {
                    agregarItemProduccion(items, menuIndex, 'Mini sandwich', s.sabor, cantidades[index], ref.unidad || 'uds');
                });
                return;
            }

            if (ref.tipo === 'sandwich_o_pulguita' && ref.modo !== 'pulguita' && ref.sandwiches?.length) {
                const sandwiches = ref.sandwiches.filter(s => s.sabor);
                const cantidades = distribuirCantidadCocina(ref.cantidad || pax, sandwiches.length);
                sandwiches.forEach((s, index) => {
                    agregarItemProduccion(items, menuIndex, 'Mini sandwich', s.sabor, cantidades[index], ref.unidad || 'uds');
                });
                return;
            }

            if (ref.tipo === 'sandwich' && ref.sabor) {
                agregarItemProduccion(items, menuIndex, 'Sandwich', ref.sabor, ref.cantidad, ref.unidad || 'uds');
                return;
            }

            if (ref.tipo === 'sandwich_fijo') {
                agregarItemProduccion(items, menuIndex, 'Sandwich', ref.sabor || ref.nombre, ref.cantidad, ref.unidad || 'uds');
                return;
            }

            agregarItemProduccion(items, menuIndex, 'Menu', ref.sabor || ref.nombre, ref.cantidad, ref.unidad || 'uds');
        });
    }

    if (menu.foodbox_lunch) {
        const fl = menu.foodbox_lunch;
        (fl.ensaladas || fl.selecciones?.ensaladas || []).forEach(e => agregarItemProduccion(items, menuIndex, 'Ensaladas', e.nombre || e.id, e.cantidad || 1, 'uds'));
        (fl.sandwiches || fl.selecciones?.sandwiches || []).forEach(s => agregarItemProduccion(items, menuIndex, 'Sandwiches', s.nombre || s.id, s.cantidad || 1, 'uds'));
        (fl.postres || fl.selecciones?.postres || []).forEach(p => agregarItemProduccion(items, menuIndex, 'Postres', p.nombre || p.id, p.cantidad || 1, 'uds'));
    }

    if (menu.referencias) {
        (menu.referencias.saladas || []).forEach(ref => agregarItemProduccion(items, menuIndex, ref.fuera_carta ? 'Fuera de carta' : 'Saladas', ref.nombre || ref.id, ref.cantidad, ref.unidad || 'uds'));
        (menu.referencias.postres || []).forEach(ref => agregarItemProduccion(items, menuIndex, ref.fuera_carta ? 'Fuera de carta - postres' : 'Postres', ref.nombre || ref.id, ref.cantidad, ref.unidad || 'uds'));
    }

    if (Array.isArray(menu.referencias_extras)) {
        menu.referencias_extras.forEach(ref => {
            const grupo = ref.grupo === 'postre' || ref.tipo === 'postres' ? 'Postres' : 'Saladas';
            agregarItemProduccion(items, menuIndex, grupo, ref.nombre || ref.id, ref.cantidad, ref.unidad || 'uds');
        });
    }

    if (menu.bandejas) {
        const grupos = [
            { label: 'Termos y bebidas', items: menu.bandejas.termos || [] },
            { label: 'Servicio', items: menu.bandejas.servicio || [] },
            { label: 'Dulces y bolleria', items: menu.bandejas.dulces || [] },
            { label: 'Salados y bebidas', items: menu.bandejas.salados || [] },
            { label: 'Saladas', items: menu.bandejas.saladas || [] },
            { label: 'Sandwiches', items: menu.bandejas.sandwiches || [] },
            { label: 'Postres', items: menu.bandejas.postres || [] }
        ];

        grupos.forEach(grupo => {
            grupo.items.forEach(it => {
                const variantes = it.variantes?.length
                    ? ` (${it.variantes.map(v => v.nombre || v).join(', ')})`
                    : '';
                agregarItemProduccion(items, menuIndex, grupo.label, `${it.nombre || ''}${variantes}`, it.cantidad || 1, it.unidad || 'uds');
            });
        });
    }

    return items;
}

function getItemsIntoleranciasProduccionCocina(comanda) {
    const intolerancias = comanda?.alergias?.intolerancias || {};
    const items = Array.isArray(intolerancias.items) ? intolerancias.items : [];
    return items.map((item, index) => {
        const nombre = String(item.nombre || '').trim();
        if (!nombre) return null;
        const iconClass = getClaseIconoIntoleranciaCocina(nombre);
        const keyBase = `intolerancia:${index}:${nombre}`.toLowerCase()
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/^-|-$/g, '');
        return {
            key: keyBase || `intolerancia-${index}`,
            grupo: 'Intolerancias / restricciones',
            nombre,
            cantidad: item.pax || '',
            unidad: item.pax ? 'pax' : 'informado',
            iconClass
        };
    }).filter(Boolean);
}

function getProduccionCocinaDetalle(comanda) {
    const grupos = getMenusProduccionCocina(comanda).map((menu, index) => ({
        menu,
        menuIndex: index,
        items: getItemsProduccionMenu(menu, index)
    })).filter(grupo => grupo.items.length);

    const keysVistas = new Map();
    grupos.forEach(grupo => {
        grupo.items = grupo.items.map(item => {
            const baseKey = item.key || `${grupo.menuIndex}:${item.grupo}:${item.nombre}`;
            const repeticion = keysVistas.get(baseKey) || 0;
            keysVistas.set(baseKey, repeticion + 1);
            if (!repeticion) return item;
            return {
                ...item,
                key: `${baseKey}__${repeticion + 1}`,
                base_key: baseKey
            };
        });
    });

    return grupos;
}

function getTotalItemsProduccionCocina(comanda) {
    return getProduccionCocinaDetalle(comanda)
        .reduce((total, grupo) => total + grupo.items.length, 0);
}

function getProducidosCocina(comanda) {
    const state = comanda.kitchen_items_state || {};
    return getProduccionCocinaDetalle(comanda)
        .reduce((total, grupo) => total + grupo.items.filter(item => state[item.key]).length, 0);
}

function getClaseIconoIntoleranciaCocina(nombre = '') {
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

function getNombreIntoleranciaCocinaDisplay(nombre = '') {
    const texto = String(nombre || '').trim();
    if (!texto) return '';
    return /^foodbox\b/i.test(texto) ? texto.replace(/^foodbox\b/i, 'FOODBOX') : `FOODBOX ${texto}`;
}

function renderizarIntoleranciasCocinaHtml(comanda) {
    const intolerancias = comanda?.alergias?.intolerancias || {};
    const items = Array.isArray(intolerancias.items) ? intolerancias.items : [];
    const notas = intolerancias.notas || '';
    if (!items.length && !notas) return '';

    const itemsHtml = items.length
        ? `<div class="kitchen-intolerances-list">
            ${items.map(item => `
                <span class="kitchen-intolerance-chip">
                    ${escapeLogisticaHtml(getNombreIntoleranciaCocinaDisplay(item.nombre))}
                    ${item.pax ? ` · ${escapeLogisticaHtml(item.pax)} pax` : ''}
                </span>
            `).join('')}
        </div>`
        : '';

    const notasHtml = notas
        ? `<div class="kitchen-intolerances-notes">${escapeLogisticaHtml(notas)}</div>`
        : '';

    return `
        <div class="kitchen-intolerances-box">
            <strong>Intolerancias / restricciones</strong>
            ${itemsHtml}
            ${notasHtml}
        </div>
    `;
}

function getOperativeActorName() {
    return window.currentUser?.user_metadata?.full_name
        || window.currentUser?.email
        || 'Usuario local';
}

function formatearFechaHoraOperativa(value) {
    if (!value) return '';
    const fecha = new Date(value);
    if (Number.isNaN(fecha.getTime())) return '';
    return fecha.toLocaleString('es-ES', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}

function registrarAccionOperativa(item, area, accion, detalle = '') {
    if (!item) return;
    const key = area === 'logistica' ? 'logistics_action_log' : 'kitchen_action_log';
    const registro = {
        at: new Date().toISOString(),
        by: getOperativeActorName(),
        action: accion,
        detail: detalle
    };
    item[key] = [registro, ...(item[key] || [])].slice(0, 80);
    if (typeof window.registrarActividadApp === 'function') {
        window.registrarActividadApp('accion_operativa', {
            entityType: 'pedido',
            entityCode: item.codigo_cocina || item.codigo_original || item.codigo || item.codigo_comanda || null,
            area,
            details: {
                accion,
                detalle,
                fecha_evento: item.fecha_evento || null,
                empresa: item.empresa || item.company_name || ''
            }
        });
    }
}

function getCodigoPedidoLogistica(item) {
    return item?.codigo_cocina || item?.codigo_original || item?.codigo_comanda || item?.codigo || null;
}

function getCodigoComandaLogistica(item) {
    if (!item || item._logisticaSource === 'cocina') return null;
    return item.codigo || item.codigo_original || null;
}

async function descontarInventarioLogisticaSiHaceFalta(item) {
    if (!item || item.inventory_deducted_at) return true;
    if (!window.supabaseClient || !window.currentUser?.id) {
        throw new Error('No hay conexion activa con Supabase para descontar inventario.');
    }

    const materiales = getMaterialLogisticaPlano(item.material_logistica || {})
        .filter(mat => Number(mat.cantidad || 0) > 0)
        .filter(mat => mat.item_id || mat.material_id || mat.id);

    if (!materiales.length) return true;

    const orderCode = getCodigoPedidoLogistica(item);
    const logisticsCode = getCodigoComandaLogistica(item);

    for (const mat of materiales) {
        const materialId = mat.item_id || mat.material_id || mat.id;
        const { error } = await window.supabaseClient.rpc('register_logistics_inventory_movement', {
            p_order_code: orderCode,
            p_logistics_code: logisticsCode,
            p_source_table: mat.source_table || 'logistics_materials',
            p_material_id: materialId,
            p_material_name: mat.nombre || 'Material',
            p_movement_type: 'salida',
            p_quantity_order: Number(mat.cantidad || 0),
            p_unit_order: mat.unidad || mat.unidad_comanda || 'ud',
            p_conversion_to_stock: Number(mat.conversion_a_stock || mat.conversion_to_stock || mat.contenido_por_unidad || 1),
            p_unit_stock: mat.unidad_inventario || mat.unidad_stock || mat.unidad || 'ud',
            p_reason: 'Comanda logistica completada'
        });
        if (error) throw error;
    }

    item.inventory_deducted_at = new Date().toISOString();
    item.inventory_deducted_by = getOperativeActorName();
    return true;
}

function renderActividadOperativaHtml(item, area) {
    const key = area === 'logistica' ? 'logistics_action_log' : 'kitchen_action_log';
    const registros = item?.[key] || [];
    if (!registros.length) return '';

    return `
        <section class="operative-log">
            <h3>Actividad reciente</h3>
            <div class="operative-log-list">
                ${registros.slice(0, 6).map(reg => `
                    <div class="operative-log-item">
                        <strong>${escapeLogisticaHtml(reg.action || 'Accion')}</strong>
                        <span>${escapeLogisticaHtml(reg.detail || '')}</span>
                        <small>${escapeLogisticaHtml(reg.by || 'Usuario')} · ${escapeLogisticaHtml(formatearFechaHoraOperativa(reg.at))}</small>
                    </div>
                `).join('')}
            </div>
        </section>
    `;
}

function getConfirmacionCompletadoHtml(area, index, confirmadoAt, total, completos, codigoArg = "''") {
    if (!total || completos < total) return '';
    const label = area === 'logistica' ? 'Logistica completada' : 'Cocina completada';
    const onclick = area === 'logistica'
        ? `confirmarCompletadoLogistica(${index}, ${codigoArg})`
        : `confirmarCompletadoCocina(${index}, ${codigoArg})`;

    if (confirmadoAt) {
        return `
            <div class="operative-confirmation operative-confirmation--done">
                <strong>${label}</strong>
                <span>Confirmado el ${escapeLogisticaHtml(formatearFechaHoraOperativa(confirmadoAt))}</span>
            </div>
        `;
    }

    return `
        <div class="operative-confirmation">
            <span>Progreso al 100%. Confirma el cierre operativo.</span>
            <button type="button" onclick="${onclick}">Confirmar completado</button>
        </div>
    `;
}

function renderRevisionOperativaNotice(item, area) {
    const notice = area === 'logistica'
        ? item?.logistics_revision_notice
        : item?.kitchen_revision_notice;
    if (!notice) return '';
    const detalle = getResumenNoticeOperativa(notice);
    const pax = notice.pax_before !== undefined && notice.pax_after !== undefined && notice.pax_before !== notice.pax_after
        ? ` Pax ${notice.pax_before} -> ${notice.pax_after}.`
        : '';
    return `
        <div class="operative-revision-notice">
            <strong>Comanda actualizada</strong>
            <span>${escapeLogisticaHtml(detalle)}.${escapeLogisticaHtml(pax)} Revisa antes de confirmar el cierre.</span>
        </div>
    `;
}

function getCodigoOperativo(item) {
    return item?.codigo_cocina || item?.codigo_original || item?.codigo_comanda || item?.codigo || item?.id || '';
}

function getCodigoOperativoJsArg(item) {
    return getJsArg(getCodigoOperativo(item));
}

function getJsArg(value) {
    return `'${encodeURIComponent(String(value ?? ''))}'`;
}

function leerJsArgSeguro(value) {
    const limpio = String(value || '').replace(/^['"]|['"]$/g, '');
    try {
        return decodeURIComponent(limpio);
    } catch (error) {
        return limpio;
    }
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

function getEventoLogisticaPorIndiceOCodigo(index, codigo = '') {
    const listas = [
        window.logisticaEventosActivos || [],
        getEventosLogisticaActivos()
    ];
    const codigoBuscado = String(codigo || '');
    if (codigoBuscado) {
        for (const lista of listas) {
            const encontrado = (lista || []).find(item => String(getCodigoOperativo(item)) === codigoBuscado);
            if (encontrado) return encontrado;
        }
    }
    return (window.logisticaEventosActivos || getEventosLogisticaActivos())[index];
}

function hashCambioOperativo(value) {
    const texto = String(value || '');
    let hash = 0;
    for (let i = 0; i < texto.length; i++) {
        hash = ((hash << 5) - hash) + texto.charCodeAt(i);
        hash |= 0;
    }
    return Math.abs(hash).toString(36);
}

function getResumenNoticeOperativa(notice) {
    if (!notice) return 'Comanda actualizada';
    if (Array.isArray(notice.changes_detail) && notice.changes_detail.length) {
        return notice.changes_detail
            .slice(0, 4)
            .map(cambio => `${cambio.campo || 'Campo'}: ${cambio.antes || 'Vacio'} -> ${cambio.despues || 'Vacio'}`)
            .join(' · ');
    }
    if (Array.isArray(notice.changes) && notice.changes.length) {
        return notice.changes.join(', ');
    }
    return notice.message || 'Comanda actualizada';
}

function getEtiquetaTipoCambioOperativo(tipo, notice) {
    const cambios = Array.isArray(notice?.changes) ? notice.changes.join(' ').toLowerCase() : '';
    const detalle = Array.isArray(notice?.changes_detail)
        ? notice.changes_detail.map(c => `${c.grupo || ''} ${c.campo || ''}`).join(' ').toLowerCase()
        : '';
    if (/hora de salida|fecha del evento|empresa|responsable|pax/.test(detalle)) {
        return 'Cambio en datos del pedido';
    }
    if (tipo === 'logistica') {
        if (/material/.test(cambios)) return 'Cambio en material (Logistica)';
        return 'Cambio en datos de logistica';
    }
    if (/intolerancias|notas/.test(cambios)) return 'Cambio en cocina';
    return 'Cambio en menu (Cocina)';
}

function noticeAfectaMaterialLogistica(notice) {
    const cambios = Array.isArray(notice?.changes) ? notice.changes.join(' ').toLowerCase() : '';
    return /material de logistica|datos de entrega|datos generales|pax/.test(cambios);
}

function getKeyCambioOperativo(areaVista, item, tipo, notice) {
    const codigo = getCodigoOperativo(item) || 'sin-codigo';
    return [
        'catercloudOperationalChange',
        areaVista,
        tipo,
        codigo,
        hashCambioOperativo(JSON.stringify(notice || {}))
    ].join(':');
}

function getUsuarioKeyCambioOperativo() {
    return String(window.currentUser?.id || window.currentUser?.email || 'usuario-local')
        .replace(/[^a-z0-9@._-]/gi, '_');
}

function getStorageKeyCambioOperativo(key) {
    return `${key}:seen:${getUsuarioKeyCambioOperativo()}`;
}

function getStorageKeyCambioOperativoGlobal(key) {
    return `${key}:seen`;
}

function cambioOperativoYaGestionado(key) {
    if (!key) return false;
    try {
        return !!localStorage.getItem(getStorageKeyCambioOperativo(key)) ||
            !!localStorage.getItem(getStorageKeyCambioOperativoGlobal(key));
    } catch (_) {
        return false;
    }
}

function marcarCambioOperativoGestionado(key, action = 'dismissed') {
    if (!key) return;
    try {
        const payload = JSON.stringify({
            action,
            by: window.currentUser?.email || null,
            at: new Date().toISOString()
        });
        localStorage.setItem(getStorageKeyCambioOperativoGlobal(key), payload);
        localStorage.setItem(getStorageKeyCambioOperativo(key), JSON.stringify({
            action,
            by: window.currentUser?.email || null,
            at: new Date().toISOString()
        }));
    } catch (_) {
        sessionStorage.setItem(key, action);
    }
}

function esFechaAvisoOperativoInmediata(item) {
    const fecha = String(item?.fecha_evento || item?.fecha || item?.fecha_creacion || '').split('T')[0];
    if (!fecha) return false;
    const hoy = getFechaLocalHoyDashboard();
    const manana = sumarDiasFechaLocalDashboard(hoy, 1);
    return fecha === hoy || fecha === manana;
}

function getCambiosOperativosPendientes(areaVista, eventos) {
    if (window.AppPermissions) {
        if (areaVista === 'cocina' && !AppPermissions.canEditKitchen()) return [];
        if (areaVista === 'logistica' && !AppPermissions.canEditLogistics()) return [];
    }

    const cambios = [];
    (eventos || []).forEach((item, index) => {
        if (!esFechaAvisoOperativoInmediata(item)) return;

        const codigo = getCodigoOperativo(item);
        const empresa = item.empresa || item.company_name || 'Sin empresa';

        if (areaVista === 'cocina' && item.kitchen_revision_notice) {
            cambios.push({
                areaVista,
                tipo: 'cocina',
                index,
                codigo,
                empresa,
                label: 'Cocina',
                notice: item.kitchen_revision_notice,
                key: getKeyCambioOperativo(areaVista, item, 'cocina', item.kitchen_revision_notice)
            });
        }

        if (areaVista === 'logistica') {
            if (item.kitchen_revision_notice) {
                cambios.push({
                    areaVista,
                    tipo: 'cocina',
                    index,
                    codigo,
                    empresa,
                    label: 'Cocina',
                    notice: item.kitchen_revision_notice,
                    key: getKeyCambioOperativo(areaVista, item, 'cocina', item.kitchen_revision_notice)
                });
            }
            if (item.logistics_revision_notice) {
                const mismaRevisionCocina = item.kitchen_revision_notice
                    && JSON.stringify(item.kitchen_revision_notice) === JSON.stringify(item.logistics_revision_notice);
                if (!mismaRevisionCocina || noticeAfectaMaterialLogistica(item.logistics_revision_notice)) {
                    cambios.push({
                        areaVista,
                        tipo: 'logistica',
                        index,
                        codigo,
                        empresa,
                        label: 'Logistica',
                        notice: item.logistics_revision_notice,
                        key: getKeyCambioOperativo(areaVista, item, 'logistica', item.logistics_revision_notice)
                    });
                }
            }
        }
    });
    return cambios.filter(cambio => !cambioOperativoYaGestionado(cambio.key) && !sessionStorage.getItem(cambio.key));
}

function getAreasAvisoOperativoPorRol() {
    const role = window.AppPermissions?.role || 'viewer';
    if (role === 'admin') return ['cocina', 'logistica'];
    if (role === 'cocina') return ['cocina'];
    if (role === 'logistica') return ['logistica'];
    return [];
}

function getCambiosOperativosPendientesGlobales() {
    const areas = getAreasAvisoOperativoPorRol();
    if (!areas.length) return [];

    return areas.flatMap(areaVista => {
        const eventos = areaVista === 'cocina'
            ? getEventosCocinaActivos()
            : getEventosLogisticaActivos();
        return getCambiosOperativosPendientes(areaVista, eventos);
    }).sort((a, b) => {
        const fechaB = new Date(b.notice?.at || 0).getTime() || 0;
        const fechaA = new Date(a.notice?.at || 0).getTime() || 0;
        return fechaB - fechaA;
    });
}

function reproducirSonidoCambioOperativo(key) {
    if (!key || sessionStorage.getItem(`${key}:sound`)) return;
    const prefs = typeof cargarPreferencias === 'function' ? cargarPreferencias() : { notificaciones: true };
    if (prefs.notificaciones === false) return;

    try {
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        if (!AudioContext) return;
        const ctx = window._operationalAlertAudioCtx || new AudioContext();
        window._operationalAlertAudioCtx = ctx;

        const emitir = () => {
            const now = ctx.currentTime;
            const gain = ctx.createGain();
            gain.gain.setValueAtTime(0.0001, now);
            gain.gain.exponentialRampToValueAtTime(0.16, now + 0.02);
            gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.62);
            gain.connect(ctx.destination);

            [740, 980, 740].forEach((freq, i) => {
                const osc = ctx.createOscillator();
                osc.type = 'sine';
                osc.frequency.setValueAtTime(freq, now + (i * 0.14));
                osc.connect(gain);
                osc.start(now + (i * 0.14));
                osc.stop(now + 0.16 + (i * 0.14));
            });
            sessionStorage.setItem(`${key}:sound`, '1');
        };

        if (ctx.state === 'suspended') {
            ctx.resume().then(emitir).catch(() => {});
        } else {
            emitir();
        }
    } catch (error) {
        console.warn('No se pudo reproducir el sonido de alerta:', error);
    }
}

function prepararSonidoAlertasOperativas() {
    if (window._operationalAlertAudioPrepared) return;
    window._operationalAlertAudioPrepared = true;

    const activar = () => {
        try {
            const AudioContext = window.AudioContext || window.webkitAudioContext;
            if (!AudioContext) return;
            const ctx = window._operationalAlertAudioCtx || new AudioContext();
            window._operationalAlertAudioCtx = ctx;
            if (ctx.state === 'suspended') ctx.resume().catch(() => {});
        } catch (error) {
            console.warn('No se pudo preparar el audio de alertas:', error);
        }
    };

    ['pointerdown', 'keydown', 'touchstart'].forEach(evento => {
        window.addEventListener(evento, activar, { once: true, passive: true });
    });
}

function cerrarTarjetaCambioOperativo() {
    document.getElementById('operationalChangeOverlay')?.remove();
}

async function abrirCambioOperativoDesdeTarjeta(areaVista, index, key) {
    marcarCambioOperativoGestionado(key, 'opened');
    cerrarTarjetaCambioOperativo();
    const codigo = key ? String(key).split(':')[3] || '' : '';
    if (areaVista === 'cocina') {
        if (typeof mostrarCocina === 'function') await mostrarCocina();
        window.cocinaEventosActivos = getEventosCocinaActivos();
        abrirProduccionCocina(index, codigo);
        return;
    }
    if (typeof mostrarLogistica === 'function') await mostrarLogistica();
    window.logisticaEventosActivos = getEventosLogisticaActivos();
    abrirPreparacionLogistica(index, codigo);
}

function descartarCambioOperativoDesdeTarjeta(key) {
    marcarCambioOperativoGestionado(key, 'dismissed');
    cerrarTarjetaCambioOperativo();
}

function mostrarTarjetaCambioOperativo(areaVista, eventos) {
    const cambios = getCambiosOperativosPendientes(areaVista, eventos);
    if (!cambios.length) {
        cerrarTarjetaCambioOperativo();
        return;
    }

    const cambio = cambios[0];
    const detalle = getResumenNoticeOperativa(cambio.notice);
    const tituloArea = areaVista === 'cocina' ? 'Cocina' : 'Logistica';
    const accion = areaVista === 'cocina' ? 'Abrir comanda de trabajo' : 'Abrir preparacion';
    const existente = document.getElementById('operationalChangeOverlay');
    if (existente?.dataset.key === cambio.key) return;
    cerrarTarjetaCambioOperativo();

    const overlay = document.createElement('div');
    overlay.id = 'operationalChangeOverlay';
    overlay.className = 'operational-change-overlay';
    overlay.dataset.key = cambio.key;
    overlay.innerHTML = `
        <article class="operational-change-card" role="dialog" aria-live="assertive" aria-label="Comanda modificada">
            <button type="button" class="operational-change-close" aria-label="Cerrar aviso"
                onclick="descartarCambioOperativoDesdeTarjeta('${cambio.key}')">×</button>
            <button type="button" class="operational-change-body"
                onclick="abrirCambioOperativoDesdeTarjeta('${areaVista}', ${cambio.index}, '${cambio.key}')">
                <span class="operational-change-kicker">Cambio para ${escapeLogisticaHtml(tituloArea)}</span>
                <strong>Comanda modificada · ${escapeLogisticaHtml(cambio.codigo || 'Sin codigo')}</strong>
                <span>${escapeLogisticaHtml(cambio.empresa)} · afecta ${escapeLogisticaHtml(cambio.label)}</span>
                <small>${escapeLogisticaHtml(detalle)}</small>
                <em>${escapeLogisticaHtml(accion)}</em>
            </button>
        </article>
    `;
    document.body.appendChild(overlay);
}

function mostrarTarjetaCambioOperativoGlobal() {
    const cambios = getCambiosOperativosPendientesGlobales();
    if (!cambios.length) {
        cerrarTarjetaCambioOperativo();
        return;
    }

    const cambio = cambios[0];
    const detalle = getResumenNoticeOperativa(cambio.notice);
    const tituloTipo = getEtiquetaTipoCambioOperativo(cambio.tipo, cambio.notice);
    const tituloArea = cambio.areaVista === 'cocina' ? 'Cocina' : 'Logistica';
    const accion = cambio.areaVista === 'cocina' ? 'Abrir produccion' : 'Abrir preparacion';
    const existente = document.getElementById('operationalChangeOverlay');
    if (existente?.dataset.key === cambio.key) return;
    cerrarTarjetaCambioOperativo();

    const overlay = document.createElement('div');
    overlay.id = 'operationalChangeOverlay';
    overlay.className = `operational-change-overlay operational-change-overlay--${cambio.tipo}`;
    overlay.dataset.key = cambio.key;
    overlay.innerHTML = `
        <article class="operational-change-card" role="dialog" aria-live="assertive" aria-label="Comanda modificada">
            <button type="button" class="operational-change-close" aria-label="Cerrar aviso"
                onclick="descartarCambioOperativoDesdeTarjeta('${cambio.key}')">×</button>
            <button type="button" class="operational-change-body"
                onclick="abrirCambioOperativoDesdeTarjeta('${cambio.areaVista}', ${cambio.index}, '${cambio.key}')">
                <span class="operational-change-kicker">${escapeLogisticaHtml(tituloTipo)}</span>
                <strong>${escapeLogisticaHtml(cambio.codigo || 'Sin codigo')}</strong>
                <span>${escapeLogisticaHtml(cambio.empresa)} · aviso para ${escapeLogisticaHtml(tituloArea)}</span>
                <small>${escapeLogisticaHtml(detalle)}</small>
                <em>${escapeLogisticaHtml(accion)}</em>
            </button>
        </article>
    `;
    document.body.appendChild(overlay);
    reproducirSonidoCambioOperativo(cambio.key);
}

function refrescarAlertasOperativasGlobales() {
    if (document.hidden) return;
    mostrarTarjetaCambioOperativoGlobal();
}

window.refrescarAlertasOperativasGlobales = refrescarAlertasOperativasGlobales;

window.verificarNotificacionesOperativas = async function verificarNotificacionesOperativas() {
    if (typeof window.cargarHistorialRemotoSupabase === 'function') {
        await window.cargarHistorialRemotoSupabase({ render: false });
    }
    const areas = getAreasAvisoOperativoPorRol();
    const pendientes = getCambiosOperativosPendientesGlobales();
    return {
        usuario: window.currentUser?.email || null,
        rol: window.AppPermissions?.role || null,
        areas,
        pendientes: pendientes.length,
        avisos: pendientes.slice(0, 8).map(item => ({
            codigo: item.codigo,
            empresa: item.empresa,
            tipo: item.tipo,
            areaVista: item.areaVista,
            cambios: item.notice?.changes || [],
            fecha: item.notice?.at || null
        })),
        realtime: window._ordersRealtimeStatus || null,
        ultimaLectura: window._ultimoHistorialRemotoOk || null
    };
};

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
        usuario: window.currentUser?.email || null,
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
    historial[index].fecha_modificacion = evento.fecha_modificacion || new Date().toISOString();
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
        const alertaSalida = getAlertaSalidaHtml(item, estado);
        const confirmado = pedidoOperativoConfirmado(item);
        const puedeOperar = canEdit && confirmado;

        return `
            <article class="logistics-event-card kitchen-event-card ${alertaSalida ? 'logistics-event-card--urgent' : ''}" onclick="abrirProduccionCocina(${index}, ${codigoArg})">
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
        item.kitchen_ready_at = new Date().toISOString();
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

    const ahora = new Date().toISOString();
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
        item.kitchen_ready_at = new Date().toISOString();
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

function cambiarTabLogistica(tab) {
    const logisticaPage = document.getElementById('logisticaPage');
    const eventosPanel = document.getElementById('logisticaEventosPanel');
    const inventarioPanel = document.getElementById('logisticaInventarioPanel');
    const rutasPanel = document.getElementById('logisticaRutasPanel');
    const tabEventos = document.getElementById('logTabEventos');
    const tabInventario = document.getElementById('logTabInventario');
    const tabRutas = document.getElementById('logTabRutas');

    if (eventosPanel) eventosPanel.style.display = tab === 'eventos' ? '' : 'none';
    if (inventarioPanel) inventarioPanel.style.display = tab === 'inventario' ? '' : 'none';
    if (rutasPanel) rutasPanel.style.display = tab === 'rutas' ? '' : 'none';
    if (tabEventos) tabEventos.classList.toggle('active', tab === 'eventos');
    if (tabInventario) tabInventario.classList.toggle('active', tab === 'inventario');
    if (tabRutas) tabRutas.classList.toggle('active', tab === 'rutas');
    if (logisticaPage) {
        logisticaPage.classList.toggle('logistica-tab-compact', tab === 'inventario' || tab === 'rutas');
    }

    if (tab === 'rutas') {
        const fecha = document.getElementById('rutasFiltroFecha');
        if (fecha && !fecha.value) fecha.value = document.getElementById('logisticaFiltroFecha')?.value || getFechaLocalHoyDashboard();
        cargarModuloRutasLogistica();
    }
}

function getFechaRutasLogistica() {
    const input = document.getElementById('rutasFiltroFecha');
    if (input && input.value) return input.value;
    const fechaLogistica = document.getElementById('logisticaFiltroFecha')?.value;
    return fechaLogistica || getFechaLocalHoyDashboard();
}

function mostrarMensajeRutasLogistica(texto, tipo = 'info') {
    const box = document.getElementById('rutasMensaje');
    if (!box) return;
    box.textContent = texto || '';
    box.className = `routes-message routes-message--${tipo}`;
    box.style.display = texto ? '' : 'none';
}

function getCodigoRutaPedido(item) {
    return item?.codigo_cocina || item?.codigo || item?.codigo_comanda || item?.id || '';
}

function getDireccionRutaPedido(item) {
    const log = item?.logistica || item?.logistica_inline || {};
    const direccion = log.direccion || item?.direccion || '';
    return {
        street: log.calle || item?.calle || direccion,
        number: log.numero || item?.numero || '',
        postalCode: log.codigo_postal || item?.codigo_postal || '',
        city: log.ciudad || item?.ciudad || 'Madrid'
    };
}

function getDuracionServicioRuta(item) {
    const log = item?.logistica || item?.logistica_inline || {};
    const raw = String(log.duracion_evento || '').toLowerCase();
    const match = raw.match(/(\d+(?:[.,]\d+)?)/);
    const horas = match ? Number(match[1].replace(',', '.')) : 0;
    return Number.isFinite(horas) && horas > 0 ? Math.round(horas * 60) : 0;
}

function sumarMinutosHora(hora, minutos) {
    if (!hora || !minutos) return '';
    const [h, m] = String(hora).split(':').map(Number);
    if (!Number.isFinite(h) || !Number.isFinite(m)) return '';
    const base = new Date(2000, 0, 1, h, m);
    base.setMinutes(base.getMinutes() + minutos);
    return `${String(base.getHours()).padStart(2, '0')}:${String(base.getMinutes()).padStart(2, '0')}`;
}

function getHoraRecogidaSugerida(item) {
    const horaEvento = (item?.logistica || item?.logistica_inline || {}).hora_evento || '';
    const duracion = getDuracionServicioRuta(item);
    return duracion ? sumarMinutosHora(horaEvento, duracion) : '';
}

function parseHoraRutaEnMinutos(hora) {
    const [h, m] = String(hora || '').split(':').map(Number);
    if (!Number.isFinite(h) || !Number.isFinite(m)) return null;
    return h * 60 + m;
}

function formatearMinutosRuta(total) {
    if (!Number.isFinite(total)) return '-';
    const normalizado = ((Math.round(total) % 1440) + 1440) % 1440;
    const h = Math.floor(normalizado / 60);
    const m = normalizado % 60;
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

function formatearDuracionRuta(minutos) {
    const total = Math.max(0, Math.round(Number(minutos) || 0));
    const h = Math.floor(total / 60);
    const m = total % 60;
    if (!h) return `${m} min`;
    if (!m) return `${h} h`;
    return `${h} h ${m} min`;
}

function getTiempoTrasladoRutas() {
    const input = document.getElementById('rutaTiempoTraslado');
    const saved = Number(localStorage.getItem('catercloudRouteTravelMinutes') || 20);
    const value = Number(input?.value || saved || 20);
    return Number.isFinite(value) && value >= 0 ? value : 20;
}

function guardarTiempoTrasladoRutas() {
    const input = document.getElementById('rutaTiempoTraslado');
    const value = Number(input?.value || 20);
    localStorage.setItem('catercloudRouteTravelMinutes', String(Number.isFinite(value) && value >= 0 ? value : 20));
    renderizarRutasLogistica();
}

function aplicarTiempoTrasladoRutas() {
    const input = document.getElementById('rutaTiempoTraslado');
    if (input) input.value = String(getTiempoTrasladoRutas());
}

function getInicioRutaPorConductor(driverId = '') {
    const driver = (window.rutasLogisticaState.drivers || []).find(item => String(item.id) === String(driverId));
    return driver?.work_start || '08:00';
}

function esPedidoServicioRuta(item) {
    const categoria = item?.categoria_id || item?.categoriaId || item?.categoria;
    return Number(categoria) === 3
        || Boolean(item?.servicio_categoria)
        || /servicio|vino|coctel|c[oó]ctel/i.test(String(item?.menu_categoria_nombre || item?.menu_nombre || item?.tipo || ''));
}

function calcularTiempoParadaPedidoRuta(item, tipo) {
    const log = item?.logistica || item?.logistica_inline || {};
    const pax = Number(item?.pax || item?.total_pax || 0);
    const montaje = String(log.montaje || '').trim();
    const camareros = Number(log.cantidad_camareros || 0);
    const esServicio = esPedidoServicioRuta(item);

    if (tipo === 'pickup') {
        let minutos = esServicio ? 20 : 10;
        if (pax >= 80) minutos += 10;
        return minutos;
    }

    let minutos = esServicio ? 35 : 15;
    if (montaje) minutos = Math.max(minutos, 45);
    if (camareros > 0) minutos = Math.max(minutos, 45);
    if (pax >= 80) minutos += 15;
    if (pax >= 150) minutos += 15;
    return minutos;
}

function getDuracionParadaRuta(stop) {
    const minutos = Number(stop?.service_duration_minutes);
    return Number.isFinite(minutos) && minutos > 0 ? minutos : (stop?.stop_type === 'pickup' ? 10 : 15);
}

function normalizarEstadoParadaRuta(status) {
    const value = String(status || 'pending').toLowerCase();
    if (['in_route', 'en_ruta', 'ruta'].includes(value)) return 'in_route';
    if (['delivered', 'entregado', 'completed', 'completado'].includes(value)) return 'delivered';
    return 'pending';
}

function getLabelEstadoParadaRuta(status) {
    const estado = normalizarEstadoParadaRuta(status);
    if (estado === 'in_route') return 'En ruta';
    if (estado === 'delivered') return 'Entregado';
    return 'Pendiente';
}

function calcularTimelineRuta(route) {
    const stops = getRouteStops(route);
    const traslado = getTiempoTrasladoRutas();
    let cursor = parseHoraRutaEnMinutos(route.starts_at || '08:00');
    if (cursor === null) cursor = parseHoraRutaEnMinutos('08:00');

    let totalServicio = 0;
    let inicioRuta = null;
    const timeline = stops.map(stop => {
        const duracion = getDuracionParadaRuta(stop);
        const horaSalidaSede = parseHoraRutaEnMinutos(stop.planned_departure || '');
        const horaObjetivo = parseHoraRutaEnMinutos(stop.planned_arrival || stop.deadline_time || '');
        const llegada = stop.stop_type === 'delivery'
            ? (horaObjetivo ?? (horaSalidaSede !== null ? horaSalidaSede + traslado : cursor + traslado))
            : (horaObjetivo ?? cursor + traslado);
        const salidaSede = stop.stop_type === 'delivery'
            ? (horaSalidaSede ?? Math.max(cursor, llegada - traslado))
            : cursor;
        const salida = llegada + duracion;

        if (inicioRuta === null) inicioRuta = salidaSede;
        totalServicio += duracion;
        cursor = salida;
        return {
            stopId: stop.id,
            salidaSede,
            llegada,
            salida: cursor,
            duracion
        };
    });

    const finRuta = timeline.length ? timeline[timeline.length - 1].salida : null;
    return {
        timeline,
        totalTraslado: stops.length * traslado,
        totalServicio,
        totalRuta: inicioRuta !== null && finRuta !== null ? Math.max(0, finRuta - inicioRuta) : 0
    };
}

function getPrimeraSalidaRuta(route) {
    const stops = getRouteStops(route);
    const salidas = stops
        .map(stop => parseHoraRutaEnMinutos(stop.planned_departure || ''))
        .filter(min => min !== null)
        .sort((a, b) => a - b);
    return salidas.length ? formatearMinutosRuta(salidas[0]) : '';
}

function getResumenHoraStopRuta(stop, tiempo = {}) {
    const salida = stop.planned_departure || (tiempo.salidaSede !== undefined ? formatearMinutosRuta(tiempo.salidaSede) : '');
    const llegada = stop.planned_arrival || stop.deadline_time || (tiempo.llegada !== undefined ? formatearMinutosRuta(tiempo.llegada) : '');
    const fin = tiempo.salida !== undefined ? formatearMinutosRuta(tiempo.salida) : '';

    if (stop.stop_type === 'pickup') {
        return `Recogida ${llegada || '-'}${fin ? ` · Fin ${fin}` : ''}`;
    }

    return `Salida ${salida || '-'} · Entrega ${llegada || '-'}${fin ? ` · Fin ${fin}` : ''}`;
}

function getPedidosRutasDelDia() {
    const fecha = getFechaRutasLogistica();
    return getEventosLogisticaActivos()
        .filter(item => getTiposParadasRutaDia(item, fecha).length)
        .sort((a, b) => String(getHoraPrincipalRutaPedidoDia(a, fecha)).localeCompare(String(getHoraPrincipalRutaPedidoDia(b, fecha))));
}

function getRouteStops(route) {
    return (route.stops || route.route_stops || [])
        .slice()
        .sort((a, b) => Number(a.stop_order || 0) - Number(b.stop_order || 0));
}

function getStopsAsignadosPorCodigo() {
    const mapa = {};
    (window.rutasLogisticaState.routes || []).forEach(route => {
        getRouteStops(route).forEach(stop => {
            const codigo = stop.notes?.match(/codigo:([^|]+)/)?.[1]?.trim() || '';
            if (!codigo) return;
            if (!mapa[codigo]) mapa[codigo] = { delivery: false, pickup: false };
            if (stop.stop_type === 'delivery') mapa[codigo].delivery = true;
            if (stop.stop_type === 'pickup') mapa[codigo].pickup = true;
        });
    });
    return mapa;
}

function renderSelectRutaDestino(codigo) {
    const routes = window.rutasLogisticaState.routes || [];
    if (!routes.length) return '<span class="routes-no-route">Crea una ruta primero</span>';
    return `
        <select id="rutaDestino_${escapeLogisticaHtml(codigo)}" class="routes-mini-select">
            ${routes.map(route => {
                const vehiculo = route.vehicle?.plate || route.route_vehicles?.plate || 'Furgoneta';
                const conductor = route.driver?.name || route.route_drivers?.name || 'Conductor';
                return `<option value="${route.id}">${escapeLogisticaHtml(vehiculo)} · ${escapeLogisticaHtml(conductor)}</option>`;
            }).join('')}
        </select>
    `;
}

function actualizarKpisRutasLogistica(pedidos) {
    const routes = window.rutasLogisticaState.routes || [];
    const paradas = routes.reduce((acc, route) => acc + getRouteStops(route).length, 0);
    const asignados = getStopsAsignadosPorCodigo();
    const pendientes = (pedidos || []).filter(item => {
        const codigo = getCodigoRutaPedido(item);
        return getTiposParadasRutaDia(item).some(tipo => !asignados[codigo]?.[tipo]);
    }).length;
    const set = (id, value) => {
        const el = document.getElementById(id);
        if (el) el.textContent = String(value);
    };
    set('rutasKpiRutas', routes.length);
    set('rutasKpiParadas', paradas);
    set('rutasKpiPendientes', pendientes);
}

function esRegistroActivoRutasLogistica(item) {
    const active = item?.active;
    return active !== false && String(active ?? 'true').toLowerCase() !== 'false';
}

function getUnavailableDatesDriver(driver = {}) {
    const raw = driver.unavailable_dates || driver.fechas_no_operativo || [];
    if (Array.isArray(raw)) return raw.map(String);
    if (typeof raw === 'string') {
        try {
            const parsed = JSON.parse(raw);
            return Array.isArray(parsed) ? parsed.map(String) : [];
        } catch (_) {
            return raw.split(',').map(item => item.trim()).filter(Boolean);
        }
    }
    return [];
}

function esConductorOperativoFecha(driver = {}, fecha = getFechaRutasLogistica()) {
    return esRegistroActivoRutasLogistica(driver) && !getUnavailableDatesDriver(driver).includes(fecha);
}

function normalizarDriverRuta(driver = {}) {
    return {
        ...driver,
        work_start: driver.work_start || driver.jornada_inicio || '08:00',
        work_end: driver.work_end || driver.jornada_fin || '18:00',
        unavailable_dates: getUnavailableDatesDriver(driver)
    };
}

function getConductoresOperativosRutas(fecha = getFechaRutasLogistica()) {
    return (window.rutasLogisticaState.allDrivers || window.rutasLogisticaState.drivers || [])
        .filter(driver => esConductorOperativoFecha(driver, fecha));
}

async function consultarTablaBaseRutasLogistica(tabla, columnas, columnaOrden) {
    let query = window.supabaseClient.from(tabla).select(columnas);
    if (columnaOrden) query = query.order(columnaOrden, { ascending: true });
    const response = await query;

    if (!response.error) return response.data || [];

    console.warn(`No se pudo consultar ${tabla} con columnas definidas. Reintentando con select *.`, response.error);
    const fallback = await window.supabaseClient.from(tabla).select('*');
    if (fallback.error) throw fallback.error;
    return fallback.data || [];
}

async function cargarDatosBaseRutasLogistica() {
    if (!window.supabaseClient) throw new Error('Supabase no esta inicializado.');
    const [vehiclesData, driversData] = await Promise.all([
        consultarTablaBaseRutasLogistica('route_vehicles', 'id,name,plate,size,active,created_at', 'created_at'),
        consultarTablaBaseRutasLogistica('route_drivers', 'id,name,phone,active,work_start,work_end,unavailable_dates,created_at', 'name')
    ]);

    window.rutasLogisticaState.vehicles = vehiclesData.filter(esRegistroActivoRutasLogistica);
    window.rutasLogisticaState.allDrivers = driversData.map(normalizarDriverRuta);
    window.rutasLogisticaState.drivers = getConductoresOperativosRutas();
}

async function cargarRutasLogisticaDia() {
    if (!window.supabaseClient) throw new Error('Supabase no esta inicializado.');
    const fecha = getFechaRutasLogistica();
    const { data, error } = await window.supabaseClient
        .from('daily_routes')
        .select('*, vehicle:route_vehicles(*), driver:route_drivers(*), stops:route_stops(*)')
        .eq('route_date', fecha)
        .order('starts_at', { ascending: true });
    if (error) throw error;
    window.rutasLogisticaState.routes = data || [];
}

function renderizarSelectsRutasLogistica() {
    const vehiculoSelect = document.getElementById('rutaVehiculoSelect');
    const conductorSelect = document.getElementById('rutaConductorSelect');
    const vehicles = window.rutasLogisticaState.vehicles || [];
    const drivers = getConductoresOperativosRutas();
    window.rutasLogisticaState.drivers = drivers;

    if (vehiculoSelect) {
        vehiculoSelect.innerHTML = vehicles.length
            ? vehicles.map(v =>
                `<option value="${v.id}">${escapeLogisticaHtml(v.name)} ${escapeLogisticaHtml(v.plate)} - ${escapeLogisticaHtml(v.size)}</option>`
            ).join('')
            : '<option value="">Sin furgonetas activas</option>';
        vehiculoSelect.disabled = !vehicles.length;
    }

    if (conductorSelect) {
        conductorSelect.innerHTML = drivers.length
            ? drivers.map(d => `<option value="${d.id}">${escapeLogisticaHtml(d.name)}</option>`).join('')
            : '<option value="">Sin conductores activos</option>';
        conductorSelect.disabled = !drivers.length;
    }
}

function renderizarConductoresRutasLogistica() {
    const cont = document.getElementById('rutasConductoresList');
    if (!cont) return;

    const fecha = getFechaRutasLogistica();
    const drivers = window.rutasLogisticaState.allDrivers || [];
    if (!drivers.length) {
        cont.innerHTML = '<div class="routes-empty routes-empty--small">No hay conductores creados.</div>';
        return;
    }

    cont.innerHTML = drivers.map(driver => {
        const activo = esRegistroActivoRutasLogistica(driver);
        const noOperativo = getUnavailableDatesDriver(driver).includes(fecha);
        const operativo = activo && !noOperativo;
        return `
            <article class="routes-driver-card ${operativo ? '' : 'routes-driver-card--off'}">
                <div class="routes-driver-header">
                    <div>
                        <strong>${escapeLogisticaHtml(driver.name || 'Sin nombre')}</strong>
                        <span class="routes-driver-phone">${escapeLogisticaHtml(driver.phone || 'Sin telefono')}</span>
                    </div>
                    <span class="routes-driver-status ${operativo ? 'routes-driver-status--on' : 'routes-driver-status--off'}">${operativo ? 'Operativo' : 'No operativo'}</span>
                </div>
                <div class="routes-driver-fields">
                    <label>
                        Inicio
                        <input type="time" id="driverStart_${driver.id}" value="${escapeLogisticaHtml(driver.work_start || '08:00')}" onchange="actualizarJornadaConductorRuta('${driver.id}')">
                    </label>
                    <label>
                        Fin
                        <input type="time" id="driverEnd_${driver.id}" value="${escapeLogisticaHtml(driver.work_end || '18:00')}" onchange="actualizarJornadaConductorRuta('${driver.id}')">
                    </label>
                </div>
                <div class="routes-driver-toggles">
                    <label class="routes-driver-toggle ${noOperativo ? 'is-checked is-warning' : ''}">
                        <input type="checkbox" ${noOperativo ? 'checked' : ''} onchange="actualizarNoOperativoConductorRuta('${driver.id}', this.checked)">
                        <span class="routes-driver-switch" aria-hidden="true"></span>
                        <span>No operativo hoy</span>
                    </label>
                </div>
            </article>
        `;
    }).join('');
}

async function agregarConductorRutaLogistica() {
    if (window.AppPermissions && !AppPermissions.requireLogistics('Tu usuario no tiene permiso para crear conductores.')) return;
    if (!window.supabaseClient) {
        mostrarMensajeRutasLogistica('Supabase no esta disponible.', 'error');
        return;
    }

    const name = (prompt('Nombre del conductor') || '').trim();
    if (!name) return;
    const phone = (prompt('Telefono del conductor (opcional)') || '').trim();

    try {
        const { error } = await window.supabaseClient
            .from('route_drivers')
            .insert({
                name,
                phone: phone || null,
                active: true,
                work_start: '08:00',
                work_end: '18:00',
                unavailable_dates: []
            });
        if (error) throw error;
        mostrarMensajeRutasLogistica('Conductor añadido correctamente.', 'success');
        await cargarModuloRutasLogistica();
    } catch (error) {
        console.error('Error creando conductor:', error);
        mostrarMensajeRutasLogistica(`No se pudo crear el conductor: ${error.message || error}`, 'error');
    }
}

async function actualizarActivoConductorRuta(driverId, active) {
    if (window.AppPermissions && !AppPermissions.requireLogistics('Tu usuario no tiene permiso para editar conductores.')) return;
    if (!window.supabaseClient) return;
    try {
        const { error } = await window.supabaseClient
            .from('route_drivers')
            .update({ active: !!active })
            .eq('id', driverId);
        if (error) throw error;
        await cargarModuloRutasLogistica();
    } catch (error) {
        console.error('Error actualizando conductor:', error);
        mostrarMensajeRutasLogistica(`No se pudo actualizar el conductor: ${error.message || error}`, 'error');
    }
}

async function actualizarNoOperativoConductorRuta(driverId, noOperativo) {
    if (window.AppPermissions && !AppPermissions.requireLogistics('Tu usuario no tiene permiso para editar conductores.')) return;
    if (!window.supabaseClient) return;

    const fecha = getFechaRutasLogistica();
    const driver = (window.rutasLogisticaState.allDrivers || []).find(item => String(item.id) === String(driverId));
    if (!driver) return;

    const fechas = new Set(getUnavailableDatesDriver(driver));
    if (noOperativo) fechas.add(fecha);
    else fechas.delete(fecha);

    try {
        const { error } = await window.supabaseClient
            .from('route_drivers')
            .update({ unavailable_dates: Array.from(fechas).sort() })
            .eq('id', driverId);
        if (error) throw error;
        await cargarModuloRutasLogistica();
    } catch (error) {
        console.error('Error actualizando disponibilidad:', error);
        mostrarMensajeRutasLogistica(`No se pudo actualizar disponibilidad: ${error.message || error}`, 'error');
    }
}

async function actualizarJornadaConductorRuta(driverId) {
    if (window.AppPermissions && !AppPermissions.requireLogistics('Tu usuario no tiene permiso para editar conductores.')) return;
    if (!window.supabaseClient) return;

    const workStart = document.getElementById(`driverStart_${driverId}`)?.value || '08:00';
    const workEnd = document.getElementById(`driverEnd_${driverId}`)?.value || '18:00';
    if (parseHoraRutaEnMinutos(workStart) === null || parseHoraRutaEnMinutos(workEnd) === null) {
        mostrarMensajeRutasLogistica('La jornada debe tener horas validas.', 'error');
        return;
    }

    try {
        const { error } = await window.supabaseClient
            .from('route_drivers')
            .update({ work_start: workStart, work_end: workEnd })
            .eq('id', driverId);
        if (error) throw error;
        await cargarModuloRutasLogistica();
    } catch (error) {
        console.error('Error guardando jornada:', error);
        mostrarMensajeRutasLogistica(`No se pudo guardar la jornada: ${error.message || error}`, 'error');
    }
}

async function cargarModuloRutasLogistica() {
    const fechaInput = document.getElementById('rutasFiltroFecha');
    if (fechaInput && !fechaInput.value) fechaInput.value = getFechaLocalHoyDashboard();
    try {
        aplicarTiempoTrasladoRutas();
        mostrarMensajeRutasLogistica('');
        await cargarDatosBaseRutasLogistica();
        renderizarSelectsRutasLogistica();
        renderizarConductoresRutasLogistica();
        if (!window.rutasLogisticaState.vehicles.length || !window.rutasLogisticaState.drivers.length) {
            mostrarMensajeRutasLogistica('Supabase no devolvio furgonetas o conductores activos. Revisa permisos de lectura y que active no este en false.', 'error');
        }
        await cargarRutasLogisticaDia();
        renderizarRutasLogistica();
    } catch (error) {
        console.error('Error cargando rutas:', error);
        mostrarMensajeRutasLogistica(`No se pudo cargar rutas: ${error.message || error}`, 'error');
        renderizarSelectsRutasLogistica();
        renderizarConductoresRutasLogistica();
        renderizarRutasLogistica();
    }
}

function renderizarPedidosPendientesRutas(pedidos) {
    const cont = document.getElementById('rutasPedidosPendientes');
    if (!cont) return;
    if (!pedidos.length) {
        cont.innerHTML = '<div class="routes-empty">No hay pedidos de logistica para esta fecha.</div>';
        return;
    }

    const asignados = getStopsAsignadosPorCodigo();
    const fecha = getFechaRutasLogistica();
    cont.innerHTML = pedidos.map(item => {
        const codigo = getCodigoRutaPedido(item);
        const log = item.logistica || item.logistica_inline || {};
        const direccion = getDireccionRutaPedido(item);
        const entrega = getHoraEntregaItem(item) || '';
        const recogida = getHoraRecogidaClienteRutaItem(item);
        const fechaRecogida = getFechaRecogidaRutaItem(item);
        const tiposDia = getTiposParadasRutaDia(item, fecha);
        const mostrarEntrega = tiposDia.includes('delivery');
        const mostrarRecogida = tiposDia.includes('pickup');
        const estado = asignados[codigo] || {};
        return `
            <article class="routes-pending-card">
                <div class="routes-pending-main">
                    <strong>${escapeLogisticaHtml(item.empresa || item.company_name || 'Sin empresa')}</strong>
                    <span>${escapeLogisticaHtml(getResumenMenusConPax(item) || item.menu_nombre || 'Pedido')} · ${escapeLogisticaHtml(codigo)}</span>
                    <small>${escapeLogisticaHtml(direccion.street || '-')} ${escapeLogisticaHtml(direccion.number || '')} · ${escapeLogisticaHtml(direccion.postalCode || '')}</small>
                </div>
                <div class="routes-pending-times">
                    ${mostrarEntrega ? `<span>Salida ${escapeLogisticaHtml(getHoraSalidaItem(item) || '-')}</span>` : ''}
                    ${mostrarEntrega ? `<span>Entrega ${escapeLogisticaHtml(entrega || '-')}</span>` : ''}
                    ${mostrarRecogida ? `<span>Recogida ${escapeLogisticaHtml(recogida || '-')}</span>` : ''}
                    ${fechaRecogida && fechaRecogida !== fecha ? `<span>Recogida ${escapeLogisticaHtml(fechaRecogida)}</span>` : ''}
                </div>
                <div class="routes-pending-actions">
                    ${renderSelectRutaDestino(codigo)}
                    ${mostrarEntrega ? `
                        <button type="button" ${estado.delivery || !puedeEditarLogistica() ? 'disabled' : ''} onclick="agregarParadaRutaLogistica('${escapeLogisticaHtml(codigo)}', 'delivery')">
                            ${estado.delivery ? 'Entrega asignada' : '+ Entrega'}
                        </button>
                    ` : ''}
                    ${mostrarRecogida ? `
                        <button type="button" ${estado.pickup || !puedeEditarLogistica() ? 'disabled' : ''} onclick="agregarParadaRutaLogistica('${escapeLogisticaHtml(codigo)}', 'pickup')">
                            ${estado.pickup ? 'Recogida asignada' : '+ Recogida'}
                        </button>
                    ` : ''}
                </div>
            </article>
        `;
    }).join('');
}

function renderOptionsVehiculosRuta(selectedId) {
    return (window.rutasLogisticaState.vehicles || []).map(vehicle => `
        <option value="${vehicle.id}" ${String(vehicle.id) === String(selectedId) ? 'selected' : ''}>
            ${escapeLogisticaHtml(vehicle.name)} ${escapeLogisticaHtml(vehicle.plate)} - ${escapeLogisticaHtml(vehicle.size)}
        </option>
    `).join('');
}

function renderOptionsConductoresRuta(selectedId) {
    return (window.rutasLogisticaState.drivers || []).map(driver => `
        <option value="${driver.id}" ${String(driver.id) === String(selectedId) ? 'selected' : ''}>
            ${escapeLogisticaHtml(driver.name)}
        </option>
    `).join('');
}

function renderEditorRutaLogistica(route, vehicle, driver) {
    if (String(window.rutasLogisticaState.editingRouteId || '') !== String(route.id)) return '';
    return `
        <div class="routes-route-editor">
            <label>
                Furgoneta
                <select id="editRutaVehiculo_${route.id}">
                    ${renderOptionsVehiculosRuta(route.vehicle_id || vehicle.id)}
                </select>
            </label>
            <label>
                Conductor
                <select id="editRutaConductor_${route.id}">
                    ${renderOptionsConductoresRuta(route.driver_id || driver.id)}
                </select>
            </label>
            <label>
                Inicio ruta
                <input type="time" id="editRutaSalida_${route.id}" value="${escapeLogisticaHtml(route.starts_at || '08:00')}">
            </label>
            <div class="routes-route-editor-actions">
                <button type="button" onclick="guardarEdicionRutaLogistica('${route.id}')">Guardar</button>
                <button type="button" class="routes-icon-btn routes-icon-btn--muted" onclick="cancelarEdicionRutaLogistica()">Cancelar</button>
            </div>
        </div>
    `;
}

function renderizarPlanningRutas() {
    const cont = document.getElementById('rutasPlanningList');
    if (!cont) return;
    const routes = window.rutasLogisticaState.routes || [];
    if (!routes.length) {
        cont.innerHTML = '<div class="routes-empty">Aun no hay rutas creadas para este dia.</div>';
        return;
    }

    cont.innerHTML = routes.map(route => {
        const vehicle = route.vehicle || route.route_vehicles || {};
        const driver = route.driver || route.route_drivers || {};
        const stops = getRouteStops(route);
        const resumenTiempo = calcularTimelineRuta(route);
        const timelinePorStop = new Map(resumenTiempo.timeline.map(item => [String(item.stopId), item]));
        const primeraSalida = getPrimeraSalidaRuta(route);
        return `
            <article class="routes-route-card">
                <header>
                    <div>
                        <strong>${escapeLogisticaHtml(route.name || vehicle.plate || 'Ruta')}</strong>
                        <span>${escapeLogisticaHtml(vehicle.name || 'Furgoneta')} ${escapeLogisticaHtml(vehicle.plate || '')} · ${escapeLogisticaHtml(driver.name || 'Sin conductor')}</span>
                        <small class="routes-route-time-summary">
                            Total ${escapeLogisticaHtml(formatearDuracionRuta(resumenTiempo.totalRuta))}
                            · Servicio ${escapeLogisticaHtml(formatearDuracionRuta(resumenTiempo.totalServicio))}
                        </small>
                    </div>
                    <div class="routes-route-header-actions">
                        <small>${primeraSalida ? `Primera salida ${escapeLogisticaHtml(primeraSalida)}` : `Inicio ruta ${escapeLogisticaHtml(route.starts_at || '-')}`}</small>
                        <button type="button" class="routes-icon-btn" ${puedeEditarLogistica() ? '' : 'disabled'} title="Editar ruta" onclick="editarRutaLogistica('${route.id}')">✎</button>
                        <button type="button" class="routes-icon-btn routes-icon-btn--danger" ${puedeEditarLogistica() ? '' : 'disabled'} title="Eliminar ruta" onclick="eliminarRutaLogistica('${route.id}')">🗑</button>
                    </div>
                </header>
                ${renderEditorRutaLogistica(route, vehicle, driver)}
                <div class="routes-stops-list">
                    ${stops.length ? stops.map(stop => {
                        const tiempo = timelinePorStop.get(String(stop.id)) || {};
                        const estadoParada = normalizarEstadoParadaRuta(stop.status);
                        return `
                        <div class="routes-stop-row routes-stop-row--${estadoParada}">
                            <span class="routes-stop-order">${Number(stop.stop_order || 0)}</span>
                            <div>
                                <strong>${stop.stop_type === 'pickup' ? 'Recogida' : 'Entrega'} · ${escapeLogisticaHtml(stop.company_name || 'Sin empresa')}</strong>
                                <small>${escapeLogisticaHtml(stop.address_street || '')} ${escapeLogisticaHtml(stop.address_number || '')} · ${escapeLogisticaHtml(stop.postal_code || '')}</small>
                                <small>${escapeLogisticaHtml(getResumenHoraStopRuta(stop, tiempo))}</small>
                                <span class="routes-stop-status routes-stop-status--${estadoParada}">${getLabelEstadoParadaRuta(estadoParada)}</span>
                            </div>
                            <label class="routes-stop-duration">
                                <input type="number" id="rutaStopDuration_${stop.id}" min="0" step="5" value="${escapeLogisticaHtml(getDuracionParadaRuta(stop))}">
                                <span>min</span>
                            </label>
                            <div class="routes-stop-actions">
                                <button type="button" ${estadoParada === 'in_route' || estadoParada === 'delivered' || !puedeEditarLogistica() ? 'disabled' : ''} onclick="actualizarEstadoParadaRuta('${stop.id}', 'in_route')">En ruta</button>
                                <button type="button" ${estadoParada === 'delivered' || !puedeEditarLogistica() ? 'disabled' : ''} onclick="actualizarEstadoParadaRuta('${stop.id}', 'delivered')">Entregado</button>
                                <button type="button" ${puedeEditarLogistica() ? '' : 'disabled'} onclick="guardarDuracionParadaRuta('${stop.id}')">Guardar</button>
                                <button type="button" ${puedeEditarLogistica() ? '' : 'disabled'} onclick="eliminarParadaRutaLogistica('${stop.id}')">×</button>
                            </div>
                        </div>
                    `}).join('') : '<div class="routes-empty routes-empty--small">Sin paradas.</div>'}
                </div>
            </article>
        `;
    }).join('');
}

function renderizarRutasLogistica() {
    const pedidos = getPedidosRutasDelDia();
    actualizarKpisRutasLogistica(pedidos);
    renderizarPedidosPendientesRutas(pedidos);
    renderizarPlanningRutas();
}

function formatearFechaPlanningWhatsApp(fecha) {
    if (!fecha) return '';
    const [year, month, day] = String(fecha).split('-').map(Number);
    const date = new Date(year, (month || 1) - 1, day || 1);
    if (Number.isNaN(date.getTime())) return fecha;
    return date.toLocaleDateString('es-ES', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric'
    });
}

function getHoraCompartirStopRuta(stop) {
    return stop.stop_type === 'pickup'
        ? (stop.planned_arrival || stop.deadline_time || '')
        : (stop.planned_departure || stop.planned_arrival || stop.deadline_time || '');
}

function crearTextoPlanningRutasWhatsApp() {
    const fecha = getFechaRutasLogistica();
    const routes = (window.rutasLogisticaState.routes || [])
        .map(route => ({ route, stops: getRouteStops(route) }))
        .filter(item => item.stops.length)
        .sort((a, b) => {
            const horaA = getHoraCompartirStopRuta(a.stops[0]) || a.route.starts_at || '';
            const horaB = getHoraCompartirStopRuta(b.stops[0]) || b.route.starts_at || '';
            return String(horaA).localeCompare(String(horaB));
        });

    if (!routes.length) return '';

    const lineas = [
        'Logistica Decuatro Catering',
        formatearFechaPlanningWhatsApp(fecha),
        ''
    ];

    routes.forEach(({ route, stops }, routeIndex) => {
        const driver = route.driver || route.route_drivers || {};
        const vehicle = route.vehicle || route.route_vehicles || {};
        const conductor = driver.name || 'Sin conductor';
        const vehiculo = vehicle.plate || vehicle.name || 'Ruta';
        if (routes.length > 1) {
            lineas.push(`${routeIndex + 1}. ${vehiculo} - ${conductor}`);
        }

        stops
            .slice()
            .sort((a, b) => String(getHoraCompartirStopRuta(a)).localeCompare(String(getHoraCompartirStopRuta(b))))
            .forEach(stop => {
                const hora = getHoraCompartirStopRuta(stop) || '--:--';
                const entrega = stop.planned_arrival || stop.deadline_time || '';
                const tipo = stop.stop_type === 'pickup' ? 'Recogida' : 'Entrega';
                const empresa = stop.company_name || 'Sin empresa';
                const direccion = [stop.address_street, stop.address_number].filter(Boolean).join(' ').trim();
                const cp = stop.postal_code ? ` ${stop.postal_code}` : '';
                const entregaTexto = stop.stop_type === 'delivery' && entrega && entrega !== hora ? ` (${entrega})` : '';
                lineas.push(`${hora} ${tipo} ${empresa}${entregaTexto} @${conductor}`);
                if (direccion || cp) lineas.push(`   ${direccion}${cp}`.trimEnd());
            });

        if (routeIndex < routes.length - 1) lineas.push('');
    });

    return lineas.join('\n').trim();
}

async function copiarTextoPlanningRutas(texto) {
    if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(texto);
        return true;
    }

    const textarea = document.createElement('textarea');
    textarea.value = texto;
    textarea.setAttribute('readonly', '');
    textarea.style.position = 'fixed';
    textarea.style.left = '-9999px';
    document.body.appendChild(textarea);
    textarea.select();
    const ok = document.execCommand('copy');
    textarea.remove();
    return ok;
}

async function compartirPlanningRutasWhatsApp() {
    const texto = crearTextoPlanningRutasWhatsApp();
    if (!texto) {
        mostrarMensajeRutasLogistica('No hay rutas con paradas para compartir.', 'info');
        return;
    }

    try {
        await copiarTextoPlanningRutas(texto);
        mostrarMensajeRutasLogistica('Planning copiado. Abriendo WhatsApp para compartirlo.', 'success');
    } catch (error) {
        console.warn('No se pudo copiar el planning:', error);
        mostrarMensajeRutasLogistica('No se pudo copiar automaticamente, pero se abrira WhatsApp con el texto.', 'warning');
    }

    window.open(`https://web.whatsapp.com/send?text=${encodeURIComponent(texto)}`, '_blank', 'noopener');
}

function editarRutaLogistica(routeId) {
    window.rutasLogisticaState.editingRouteId = routeId;
    renderizarPlanningRutas();
}

function cancelarEdicionRutaLogistica() {
    window.rutasLogisticaState.editingRouteId = null;
    renderizarPlanningRutas();
}

async function guardarEdicionRutaLogistica(routeId) {
    if (window.AppPermissions && !AppPermissions.requireLogistics('Tu usuario no tiene permiso para editar rutas.')) return;
    if (!window.supabaseClient) {
        mostrarMensajeRutasLogistica('Supabase no esta disponible.', 'error');
        return;
    }

    const vehicleId = document.getElementById(`editRutaVehiculo_${routeId}`)?.value || null;
    const driverId = document.getElementById(`editRutaConductor_${routeId}`)?.value || null;
    const startsAt = document.getElementById(`editRutaSalida_${routeId}`)?.value || '08:00';
    if (!vehicleId || !driverId) {
        mostrarMensajeRutasLogistica('Selecciona furgoneta y conductor para guardar la ruta.', 'error');
        return;
    }

    const vehiculo = (window.rutasLogisticaState.vehicles || []).find(v => String(v.id) === String(vehicleId));
    const conductor = (window.rutasLogisticaState.drivers || []).find(d => String(d.id) === String(driverId));
    const payload = {
        vehicle_id: vehicleId,
        driver_id: driverId,
        starts_at: startsAt,
        name: `${vehiculo?.plate || vehiculo?.name || 'Ruta'} - ${conductor?.name || 'Conductor'}`
    };

    try {
        const { error } = await window.supabaseClient.from('daily_routes').update(payload).eq('id', routeId);
        if (error) throw error;
        window.rutasLogisticaState.editingRouteId = null;
        mostrarMensajeRutasLogistica('Ruta actualizada correctamente.', 'success');
        await cargarModuloRutasLogistica();
    } catch (error) {
        console.error('Error editando ruta:', error);
        mostrarMensajeRutasLogistica(`No se pudo editar la ruta: ${error.message || error}`, 'error');
    }
}

async function eliminarRutaLogistica(routeId) {
    if (window.AppPermissions && !AppPermissions.requireLogistics('Tu usuario no tiene permiso para eliminar rutas.')) return;
    if (!window.supabaseClient) {
        mostrarMensajeRutasLogistica('Supabase no esta disponible.', 'error');
        return;
    }
    if (!confirm('¿Eliminar esta ruta y sus paradas del planning?')) return;

    try {
        const { error: stopsError } = await window.supabaseClient.from('route_stops').delete().eq('route_id', routeId);
        if (stopsError) throw stopsError;
        const { error } = await window.supabaseClient.from('daily_routes').delete().eq('id', routeId);
        if (error) throw error;
        if (String(window.rutasLogisticaState.editingRouteId || '') === String(routeId)) {
            window.rutasLogisticaState.editingRouteId = null;
        }
        mostrarMensajeRutasLogistica('Ruta eliminada del planning.', 'success');
        await cargarModuloRutasLogistica();
    } catch (error) {
        console.error('Error eliminando ruta:', error);
        mostrarMensajeRutasLogistica(`No se pudo eliminar la ruta: ${error.message || error}`, 'error');
    }
}

async function limpiarPlanningRutasLogistica() {
    if (window.AppPermissions && !AppPermissions.requireLogistics('Tu usuario no tiene permiso para limpiar rutas.')) return;
    if (!window.supabaseClient) {
        mostrarMensajeRutasLogistica('Supabase no esta disponible.', 'error');
        return;
    }

    const fecha = getFechaRutasLogistica();
    const routes = window.rutasLogisticaState.routes || [];
    if (!routes.length) {
        mostrarMensajeRutasLogistica('No hay planning creado para limpiar en esta fecha.', 'info');
        return;
    }

    const confirmar = confirm(`Limpiar todo el planning del ${fecha}? Se eliminaran rutas y paradas, pero no se borraran comandas.`);
    if (!confirmar) return;

    try {
        const routeIds = routes.map(route => route.id).filter(Boolean);
        if (routeIds.length) {
            const { error: stopsError } = await window.supabaseClient
                .from('route_stops')
                .delete()
                .in('route_id', routeIds);
            if (stopsError) throw stopsError;
        }

        const { error } = await window.supabaseClient
            .from('daily_routes')
            .delete()
            .eq('route_date', fecha);
        if (error) throw error;

        window.rutasLogisticaState.routes = [];
        window.rutasLogisticaState.editingRouteId = null;
        mostrarMensajeRutasLogistica('Planning limpiado. Puedes generarlo nuevamente.', 'success');
        await cargarModuloRutasLogistica();
    } catch (error) {
        console.error('Error limpiando planning:', error);
        mostrarMensajeRutasLogistica(`No se pudo limpiar el planning: ${error.message || error}`, 'error');
    }
}

async function guardarDuracionParadaRuta(stopId) {
    if (window.AppPermissions && !AppPermissions.requireLogistics('Tu usuario no tiene permiso para editar rutas.')) return;
    if (!window.supabaseClient) {
        mostrarMensajeRutasLogistica('Supabase no esta disponible.', 'error');
        return;
    }

    const input = document.getElementById(`rutaStopDuration_${stopId}`);
    const minutos = Number(input?.value || 0);
    if (!Number.isFinite(minutos) || minutos < 0) {
        mostrarMensajeRutasLogistica('La duracion de la parada debe ser un numero valido.', 'error');
        return;
    }

    try {
        const { error } = await window.supabaseClient
            .from('route_stops')
            .update({ service_duration_minutes: Math.round(minutos) })
            .eq('id', stopId);
        if (error) throw error;
        mostrarMensajeRutasLogistica('Tiempo de parada actualizado.', 'success');
        await cargarModuloRutasLogistica();
    } catch (error) {
        console.error('Error actualizando duracion de parada:', error);
        mostrarMensajeRutasLogistica(`No se pudo actualizar la duracion: ${error.message || error}`, 'error');
    }
}

async function actualizarEstadoParadaRuta(stopId, status) {
    if (window.AppPermissions && !AppPermissions.requireLogistics('Tu usuario no tiene permiso para actualizar rutas.')) return;
    if (!window.supabaseClient) {
        mostrarMensajeRutasLogistica('Supabase no esta disponible.', 'error');
        return;
    }

    const estado = normalizarEstadoParadaRuta(status);
    const patch = {
        status: estado,
        updated_at: new Date().toISOString()
    };

    if (estado === 'in_route') {
        patch.actual_departure = new Date().toISOString();
    }
    if (estado === 'delivered') {
        patch.actual_arrival = new Date().toISOString();
    }

    try {
        const { error } = await window.supabaseClient
            .from('route_stops')
            .update(patch)
            .eq('id', stopId);
        if (error) throw error;
        mostrarMensajeRutasLogistica(`Pedido marcado como ${getLabelEstadoParadaRuta(estado).toLowerCase()}.`, 'success');
        await cargarModuloRutasLogistica();
    } catch (error) {
        console.error('Error actualizando estado de ruta:', error);
        mostrarMensajeRutasLogistica(`No se pudo actualizar el estado: ${error.message || error}`, 'error');
    }
}

async function crearRutaLogisticaDia() {
    if (window.AppPermissions && !AppPermissions.requireLogistics('Tu usuario no tiene permiso para crear rutas.')) return;
    if (!window.supabaseClient) {
        mostrarMensajeRutasLogistica('Supabase no esta disponible.', 'error');
        return;
    }

    const vehicleId = document.getElementById('rutaVehiculoSelect')?.value || null;
    const driverId = document.getElementById('rutaConductorSelect')?.value || null;
    const startsAt = getInicioRutaPorConductor(driverId);
    const fecha = getFechaRutasLogistica();
    if (!vehicleId || !driverId) {
        mostrarMensajeRutasLogistica('Selecciona furgoneta y conductor.', 'error');
        return;
    }

    try {
        const vehiculo = (window.rutasLogisticaState.vehicles || []).find(v => String(v.id) === String(vehicleId));
        const conductor = (window.rutasLogisticaState.drivers || []).find(d => String(d.id) === String(driverId));
        const payload = {
            route_date: fecha,
            vehicle_id: vehicleId,
            driver_id: driverId,
            starts_at: startsAt,
            status: 'planned',
            name: `${vehiculo?.plate || 'Ruta'} - ${conductor?.name || 'Conductor'}`,
            created_by: window.currentUser?.id || null
        };
        const { error } = await window.supabaseClient.from('daily_routes').insert(payload);
        if (error) throw error;
        mostrarMensajeRutasLogistica('Ruta creada correctamente.', 'success');
        await cargarModuloRutasLogistica();
    } catch (error) {
        console.error('Error creando ruta:', error);
        mostrarMensajeRutasLogistica(`No se pudo crear la ruta: ${error.message || error}`, 'error');
    }
}

function ordenarVehiculosRutasLogistica(vehicles) {
    const peso = { grande: 1, mediana: 2, pequeña: 3, pequena: 3 };
    return (vehicles || []).slice().sort((a, b) => {
        const pa = peso[String(a.size || '').toLowerCase()] || 9;
        const pb = peso[String(b.size || '').toLowerCase()] || 9;
        if (pa !== pb) return pa - pb;
        return String(a.plate || a.name || '').localeCompare(String(b.plate || b.name || ''));
    });
}

function getZonaRutaPedido(item) {
    const direccion = getDireccionRutaPedido(item);
    const postal = String(direccion.postalCode || '').replace(/\D/g, '');
    if (postal.length >= 3) return `cp:${postal.slice(0, 3)}`;
    const calle = String(direccion.street || '')
        .toLowerCase()
        .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9\s]/g, ' ')
        .trim()
        .split(/\s+/)
        .slice(0, 2)
        .join('-');
    return calle ? `calle:${calle}` : 'zona:sin-direccion';
}

function getHoraObjetivoRutaPedido(item) {
    return parseHoraRutaEnMinutos(getHoraPrincipalRutaPedidoDia(item) || '12:00') ?? 720;
}

function getBloqueHoraRutaPedido(item) {
    return Math.floor(getHoraObjetivoRutaPedido(item) / 30);
}

function getDriverRuta(route) {
    const driverId = route.driver_id || route.driver?.id || route.route_drivers?.id || '';
    return (window.rutasLogisticaState.allDrivers || []).find(driver => String(driver.id) === String(driverId))
        || route.driver
        || route.route_drivers
        || {};
}

function getCapacidadRuta(route) {
    const driver = normalizarDriverRuta(getDriverRuta(route));
    const inicio = parseHoraRutaEnMinutos(driver.work_start || route.starts_at || '08:00') ?? 480;
    const fin = parseHoraRutaEnMinutos(driver.work_end || '18:00') ?? 1080;
    return Math.max(0, fin - inicio);
}

function getJornadaRutaEnMinutos(route) {
    const driver = normalizarDriverRuta(getDriverRuta(route));
    const inicio = parseHoraRutaEnMinutos(driver.work_start || route.starts_at || '08:00') ?? 480;
    const fin = parseHoraRutaEnMinutos(driver.work_end || '18:00') ?? 1080;
    return { inicio, fin };
}

function paradasDentroJornadaRuta(route, paradasExtra = []) {
    const { inicio, fin } = getJornadaRutaEnMinutos(route);
    if (fin <= inicio) return true;

    return [...getRouteStops(route), ...paradasExtra].every(stop => {
        const hora = parseHoraRutaEnMinutos(
            stop.stop_type === 'delivery'
                ? (stop.planned_departure || stop.planned_arrival || stop.deadline_time || '')
                : (stop.planned_arrival || stop.deadline_time || '')
        );
        if (hora === null) return true;
        return hora >= inicio && hora <= fin;
    });
}

function calcularDuracionRutaConParadas(route, paradasExtra = []) {
    const stops = [...getRouteStops(route), ...paradasExtra];
    const traslado = getTiempoTrasladoRutas();
    const servicio = stops.reduce((acc, stop) => acc + getDuracionParadaRuta(stop), 0);
    return servicio + (stops.length * traslado);
}

function puedeRutaRecibirParadas(route, paradasExtra) {
    const capacidad = getCapacidadRuta(route);
    if (!paradasDentroJornadaRuta(route, paradasExtra)) return false;
    if (!capacidad) return true;
    return calcularDuracionRutaConParadas(route, paradasExtra) <= capacidad;
}

function seleccionarMejorRutaParaPedido(item, routes, extrasPorRuta) {
    const zona = getZonaRutaPedido(item);
    const bloque = getBloqueHoraRutaPedido(item);
    const fecha = getFechaRutasLogistica();
    const candidatos = routes.map(route => {
        const extras = extrasPorRuta.get(String(route.id)) || [];
        const paradas = [...getRouteStops(route), ...extras];
        const zonasRuta = paradas.map(stop => {
            const pseudoItem = {
                logistica: {
                    calle: stop.address_street,
                    numero: stop.address_number,
                    codigo_postal: stop.postal_code
                }
            };
            return getZonaRutaPedido(pseudoItem);
        });
        const bloquesRuta = paradas
            .map(stop => parseHoraRutaEnMinutos(stop.planned_arrival || stop.deadline_time || ''))
            .filter(min => min !== null)
            .map(min => Math.floor(min / 30));
        const cercaniaZona = zonasRuta.includes(zona) ? 0 : 2;
        const cercaniaHora = bloquesRuta.length
            ? Math.min(...bloquesRuta.map(b => Math.abs(b - bloque)))
            : 1;
        const carga = calcularDuracionRutaConParadas(route, extras);
        const capacidad = getCapacidadRuta(route) || 480;
        const presionCarga = (paradas.length * 180) + ((carga / Math.max(capacidad, 1)) * 240);
        return { route, score: (cercaniaZona * 80) + (cercaniaHora * 10) + presionCarga };
    }).sort((a, b) => a.score - b.score);

    return candidatos.find(candidato => {
        const extras = extrasPorRuta.get(String(candidato.route.id)) || [];
        const nuevasParadas = crearParadasPedidoRuta(item, candidato.route.id, 0, fecha);
        return puedeRutaRecibirParadas(candidato.route, [...extras, ...nuevasParadas]);
    })?.route || null;
}

function getParadasPlanificadasRuta(route, extrasPorRuta) {
    return [
        ...getRouteStops(route),
        ...(extrasPorRuta.get(String(route.id)) || [])
    ];
}

function rutaTieneAfinidadConPedido(item, route, extrasPorRuta) {
    const zonaPedido = getZonaRutaPedido(item);
    const horaPedido = getHoraObjetivoRutaPedido(item);
    const paradas = getParadasPlanificadasRuta(route, extrasPorRuta);
    if (!paradas.length) return false;

    return paradas.some(stop => {
        const pseudoItem = {
            logistica: {
                calle: stop.address_street,
                numero: stop.address_number,
                codigo_postal: stop.postal_code
            }
        };
        const mismaZona = getZonaRutaPedido(pseudoItem) === zonaPedido;
        const horaStop = parseHoraRutaEnMinutos(stop.planned_arrival || stop.deadline_time || '');
        const horaCercana = horaStop === null || Math.abs(horaStop - horaPedido) <= 90;
        return mismaZona && horaCercana;
    });
}

function contarRutasConParadas(routes, extrasPorRuta) {
    return routes.reduce((total, route) => (
        total + (getParadasPlanificadasRuta(route, extrasPorRuta).length ? 1 : 0)
    ), 0);
}

function existeConductorDisponibleCompatibleRuta(item, conductoresDisponibles, fecha) {
    if (!conductoresDisponibles.length) return false;
    const paradasPrueba = crearParadasPedidoRuta(item, '__nueva_ruta__', 0, fecha);
    if (!paradasPrueba.length) return false;

    return conductoresDisponibles.some(driver => {
        const rutaPrueba = {
            id: '__nueva_ruta__',
            starts_at: driver.work_start || '08:00',
            driver,
            stops: []
        };
        return puedeRutaRecibirParadas(rutaPrueba, paradasPrueba);
    });
}

function debeAbrirRutaNuevaParaPedido(item, route, routes, extrasPorRuta, vehiculosDisponibles, conductoresDisponibles, totalPedidos, fecha) {
    if (!route || !vehiculosDisponibles.length || !conductoresDisponibles.length) return false;
    if (!getParadasPlanificadasRuta(route, extrasPorRuta).length) return false;

    const maxRutasUtiles = Math.min(
        (window.rutasLogisticaState.vehicles || []).length,
        getConductoresOperativosRutas(fecha).length,
        totalPedidos
    );
    const rutasConParadas = contarRutasConParadas(routes, extrasPorRuta);
    if (rutasConParadas >= maxRutasUtiles) return false;

    const puedeAbrirRutaCompatible = existeConductorDisponibleCompatibleRuta(item, conductoresDisponibles, fecha);
    if (!puedeAbrirRutaCompatible) return false;

    return true;
}

function crearParadasPedidoRuta(item, routeId, stopOrderBase = 0, fecha = getFechaRutasLogistica()) {
    const paradas = [];
    const entregaOrder = stopOrderBase + 1;
    if (getFechaLogisticaItem(item) === fecha) {
        paradas.push(crearPayloadParadaRutaLogistica(item, routeId, 'delivery', entregaOrder));
    }

    if (getFechaRecogidaRutaItem(item) === fecha && getHoraRecogidaClienteRutaItem(item)) {
        paradas.push(crearPayloadParadaRutaLogistica(item, routeId, 'pickup', stopOrderBase + paradas.length + 1));
    }

    return paradas;
}

async function crearRutaAutomaticaLogistica(fecha, vehicle, driver, startsAt = '08:00') {
    const payload = {
        route_date: fecha,
        vehicle_id: vehicle.id,
        driver_id: driver.id,
        starts_at: driver.work_start || startsAt,
        status: 'planned',
        name: `${vehicle.plate || vehicle.name} - ${driver.name}`,
        created_by: window.currentUser?.id || null
    };

    const { data, error } = await window.supabaseClient
        .from('daily_routes')
        .insert(payload)
        .select('*')
        .single();
    if (error) throw error;

    return {
        ...(data || payload),
        vehicle,
        driver,
        stops: []
    };
}

async function crearRutaAutomaticaCompatibleLogistica(fecha, vehiculosDisponibles, conductoresDisponibles, paradasPrueba, startsAt = '08:00') {
    if (!vehiculosDisponibles.length || !conductoresDisponibles.length) return null;

    const horaObjetivo = paradasPrueba
        .map(stop => parseHoraRutaEnMinutos(stop.planned_departure || stop.planned_arrival || stop.deadline_time || ''))
        .filter(min => min !== null)
        .sort((a, b) => a - b)[0] ?? 720;

    const candidatos = conductoresDisponibles.map((driver, index) => {
        const rutaPrueba = {
            id: '__nueva_ruta__',
            starts_at: driver.work_start || startsAt,
            driver,
            stops: []
        };

        if (!puedeRutaRecibirParadas(rutaPrueba, paradasPrueba)) return null;

        const inicio = parseHoraRutaEnMinutos(driver.work_start || startsAt || '08:00') ?? 480;
        const fin = parseHoraRutaEnMinutos(driver.work_end || '18:00') ?? 1080;
        return {
            driver,
            index,
            score: Math.abs(inicio - horaObjetivo) + Math.max(0, horaObjetivo - fin) * 10
        };
    }).filter(Boolean).sort((a, b) => a.score - b.score);

    if (!candidatos.length) return null;

    const elegido = candidatos[0];
    const [driver] = conductoresDisponibles.splice(elegido.index, 1);
    const vehicle = vehiculosDisponibles.shift();
    return crearRutaAutomaticaLogistica(fecha, vehicle, driver, startsAt);
}

function crearPayloadParadaRutaLogistica(item, routeId, tipo, stopOrder) {
    const codigo = getCodigoRutaPedido(item);
    const log = item.logistica || item.logistica_inline || {};
    const direccion = getDireccionRutaPedido(item);
    const horaEntrega = getHoraEntregaItem(item) || '';
    const horaSalida = getHoraSalidaItem(item) || '';
    const horaRecogida = getHoraRecogidaClienteRutaItem(item);

    return {
        route_id: routeId,
        order_id: null,
        stop_type: tipo,
        stop_order: stopOrder,
        company_name: item.empresa || item.company_name || '',
        address_street: direccion.street || '',
        address_number: direccion.number || '',
        postal_code: direccion.postalCode || '',
        city: direccion.city || 'Madrid',
        planned_arrival: tipo === 'pickup' ? (horaRecogida || null) : (horaEntrega || null),
        planned_departure: tipo === 'delivery' ? (horaSalida || null) : null,
        service_duration_minutes: calcularTiempoParadaPedidoRuta(item, tipo),
        deadline_time: tipo === 'pickup' ? (horaRecogida || null) : (horaEntrega || null),
        status: 'pending',
        notes: `codigo:${codigo} | ${tipo === 'pickup' ? 'recogida' : 'entrega'} | contacto:${log.nombre_contacto || ''}`
    };
}

async function generarRutasLogisticaDia() {
    if (window.AppPermissions && !AppPermissions.requireLogistics('Tu usuario no tiene permiso para crear rutas.')) return;
    if (!window.supabaseClient) {
        mostrarMensajeRutasLogistica('Supabase no esta disponible.', 'error');
        return;
    }

    try {
        await cargarDatosBaseRutasLogistica();
        await cargarRutasLogisticaDia();

        const fecha = getFechaRutasLogistica();
        const vehicles = ordenarVehiculosRutasLogistica(window.rutasLogisticaState.vehicles || []);
        const drivers = getConductoresOperativosRutas(fecha);
        const startsAt = drivers[0]?.work_start || '08:00';
        let routes = window.rutasLogisticaState.routes || [];

        if (!vehicles.length || !drivers.length) {
            mostrarMensajeRutasLogistica('Faltan furgonetas o conductores operativos para esta fecha.', 'error');
            return;
        }

        const asignados = getStopsAsignadosPorCodigo();
        const pedidosPendientes = getPedidosRutasDelDia().filter(item => {
            const codigo = getCodigoRutaPedido(item);
            return codigo && getTiposParadasRutaDia(item, fecha).some(tipo => !asignados[codigo]?.[tipo]);
        });

        if (!pedidosPendientes.length) {
            mostrarMensajeRutasLogistica('No hay pedidos pendientes por asignar.', 'info');
            renderizarRutasLogistica();
            return;
        }

        routes = routes.filter(route => {
            const driver = getDriverRuta(route);
            return !driver?.id || esConductorOperativoFecha(driver, fecha);
        });

        const vehiculosYaUsados = new Set(routes.map(route => String(route.vehicle_id || route.vehicle?.id || route.route_vehicles?.id || '')).filter(Boolean));
        const conductoresYaUsados = new Set(routes.map(route => String(route.driver_id || route.driver?.id || route.route_drivers?.id || '')).filter(Boolean));
        const vehiculosDisponibles = vehicles.filter(vehicle => !vehiculosYaUsados.has(String(vehicle.id)));
        const conductoresDisponibles = drivers.filter(driver => !conductoresYaUsados.has(String(driver.id)));

        const stopOrders = new Map(routes.map(route => [String(route.id), getRouteStops(route).length]));
        const extrasPorRuta = new Map(routes.map(route => [String(route.id), []]));
        const stopsPayload = [];
        const pedidosNoAsignados = [];

        const pedidosOrdenados = pedidosPendientes
            .slice()
            .sort((a, b) => {
                const bloqueA = getBloqueHoraRutaPedido(a);
                const bloqueB = getBloqueHoraRutaPedido(b);
                if (bloqueA !== bloqueB) return bloqueA - bloqueB;
                return getZonaRutaPedido(a).localeCompare(getZonaRutaPedido(b));
            });

        for (const item of pedidosOrdenados) {
            let route = seleccionarMejorRutaParaPedido(item, routes, extrasPorRuta);
            if (debeAbrirRutaNuevaParaPedido(
                item,
                route,
                routes,
                extrasPorRuta,
                vehiculosDisponibles,
                conductoresDisponibles,
                pedidosOrdenados.length,
                fecha
            )) {
                route = null;
            }
            let nuevasParadas = route
                ? crearParadasPedidoRuta(item, route.id, stopOrders.get(String(route.id)) || 0)
                : crearParadasPedidoRuta(item, '__nueva_ruta__', 0);
            if (!nuevasParadas.length) continue;

            if (!route) {
                route = await crearRutaAutomaticaCompatibleLogistica(fecha, vehiculosDisponibles, conductoresDisponibles, nuevasParadas, startsAt);
                if (!route) {
                    pedidosNoAsignados.push(item);
                    continue;
                }
                routes.push(route);
                stopOrders.set(String(route.id), 0);
                extrasPorRuta.set(String(route.id), []);
                nuevasParadas = crearParadasPedidoRuta(item, route.id, 0);
            }

            const routeKey = String(route.id);
            nuevasParadas.forEach(parada => {
                const order = (stopOrders.get(routeKey) || 0) + 1;
                parada.route_id = route.id;
                parada.stop_order = order;
                stopOrders.set(routeKey, order);
                stopsPayload.push(parada);
                extrasPorRuta.get(routeKey)?.push(parada);
            });
        }

        if (!stopsPayload.length) {
            mostrarMensajeRutasLogistica('No se pudo asignar ningun pedido dentro de la jornada laboral de los conductores.', 'error');
            await cargarModuloRutasLogistica();
            return;
        }

        const { error: stopsError } = await window.supabaseClient.from('route_stops').insert(stopsPayload);
        if (stopsError) throw stopsError;

        const rutasUsadas = Array.from(new Set(stopsPayload.map(stop => stop.route_id))).length;
        const noAsignadosTexto = pedidosNoAsignados.length ? ` ${pedidosNoAsignados.length} pedido(s) quedaron sin asignar por jornada laboral.` : '';
        mostrarMensajeRutasLogistica(`Planning generado: ${rutasUsadas} rutas y ${pedidosPendientes.length - pedidosNoAsignados.length} pedidos asignados.${noAsignadosTexto}`, pedidosNoAsignados.length ? 'warning' : 'success');
        await cargarModuloRutasLogistica();
    } catch (error) {
        console.error('Error generando rutas:', error);
        mostrarMensajeRutasLogistica(`No se pudieron generar las rutas: ${error.message || error}`, 'error');
    }
}

async function agregarParadaRutaLogistica(codigo, tipo) {
    if (window.AppPermissions && !AppPermissions.requireLogistics('Tu usuario no tiene permiso para editar rutas.')) return;
    const select = document.getElementById(`rutaDestino_${codigo}`);
    const routeId = select?.value;
    if (!routeId) {
        mostrarMensajeRutasLogistica('Crea o selecciona una ruta antes de añadir paradas.', 'error');
        return;
    }
    const item = getPedidosRutasDelDia().find(pedido => String(getCodigoRutaPedido(pedido)) === String(codigo));
    if (!item) {
        mostrarMensajeRutasLogistica('No se encontro el pedido seleccionado.', 'error');
        return;
    }
    if (!getTiposParadasRutaDia(item).includes(tipo)) {
        mostrarMensajeRutasLogistica(tipo === 'pickup'
            ? 'La recogida de este pedido no corresponde a esta fecha o no tiene hora de recogida.'
            : 'La entrega de este pedido no corresponde a esta fecha.', 'error');
        return;
    }

    const route = (window.rutasLogisticaState.routes || []).find(r => String(r.id) === String(routeId));
    const stopOrder = getRouteStops(route).length + 1;
    const payload = crearPayloadParadaRutaLogistica(item, routeId, tipo, stopOrder);

    try {
        const { error } = await window.supabaseClient.from('route_stops').insert(payload);
        if (error) throw error;
        mostrarMensajeRutasLogistica('Parada añadida a la ruta.', 'success');
        await cargarModuloRutasLogistica();
    } catch (error) {
        console.error('Error agregando parada:', error);
        mostrarMensajeRutasLogistica(`No se pudo añadir la parada: ${error.message || error}`, 'error');
    }
}

async function eliminarParadaRutaLogistica(stopId) {
    if (window.AppPermissions && !AppPermissions.requireLogistics('Tu usuario no tiene permiso para editar rutas.')) return;
    if (!confirm('Eliminar esta parada de la ruta?')) return;
    try {
        const { error } = await window.supabaseClient.from('route_stops').delete().eq('id', stopId);
        if (error) throw error;
        mostrarMensajeRutasLogistica('Parada eliminada.', 'success');
        await cargarModuloRutasLogistica();
    } catch (error) {
        console.error('Error eliminando parada:', error);
        mostrarMensajeRutasLogistica(`No se pudo eliminar la parada: ${error.message || error}`, 'error');
    }
}

function getHistorialLogistica() {
    return window.CaterCloudStorage?.leerHistorialLogisticaLocal?.()
        || JSON.parse(localStorage.getItem('historialComandasLogistica') || '[]');
}

function guardarHistorialLogistica(historial) {
    if (window.CaterCloudStorage?.guardarHistorialLogisticaLocal) {
        window.CaterCloudStorage.guardarHistorialLogisticaLocal(historial || []);
        return;
    }
    localStorage.setItem('historialComandasLogistica', JSON.stringify(historial || []));
}

function getHistorialCocinaLogistica() {
    return window.CaterCloudStorage?.leerHistorialComandasLocal?.()
        || JSON.parse(localStorage.getItem('historialComandas') || '[]');
}

function guardarHistorialCocinaLogistica(historial) {
    if (window.CaterCloudStorage?.guardarHistorialComandasLocal) {
        window.CaterCloudStorage.guardarHistorialComandasLocal(historial || []);
        return;
    }
    localStorage.setItem('historialComandas', JSON.stringify(historial || []));
}

function getFechaLogisticaItem(item) {
    return String(item?.fecha_evento || item?.fecha_creacion || '').split('T')[0];
}

function getLogisticaRutaItem(item) {
    return item?.logistica || item?.logistica_inline || {};
}

function getFechaRecogidaRutaItem(item) {
    const log = getLogisticaRutaItem(item);
    return String(log.fecha_recogida || item?.fecha_recogida || '').split('T')[0];
}

function getHoraRecogidaClienteRutaItem(item) {
    const log = getLogisticaRutaItem(item);
    return log.hora_recogida || item?.hora_recogida || '';
}

function getTiposParadasRutaDia(item, fecha = getFechaRutasLogistica()) {
    const tipos = [];
    if (getFechaLogisticaItem(item) === fecha) tipos.push('delivery');
    if (getFechaRecogidaRutaItem(item) === fecha && getHoraRecogidaClienteRutaItem(item)) tipos.push('pickup');
    return tipos;
}

function getHoraPrincipalRutaPedidoDia(item, fecha = getFechaRutasLogistica()) {
    const tipos = getTiposParadasRutaDia(item, fecha);
    if (tipos.length === 1 && tipos[0] === 'pickup') return getHoraRecogidaClienteRutaItem(item) || '23:59';
    return getHoraSalidaItem(item) || getHoraEntregaItem(item) || getHoraRecogidaClienteRutaItem(item) || '23:59';
}

function getMinutosHastaSalida(item) {
    const fecha = String(item?.fecha_evento || '').split('T')[0];
    const hora = String(item?.hora_salida || '').trim();
    if (!fecha || !hora) return null;

    const salida = new Date(`${fecha}T${hora}`);
    if (Number.isNaN(salida.getTime())) return null;

    return Math.ceil((salida.getTime() - Date.now()) / 60000);
}

function getAlertaSalidaHtml(item, estado) {
    if (estado === 'listo') return '';

    const minutos = getMinutosHastaSalida(item);
    if (minutos === null || minutos > 15) return '';

    const texto = minutos < 0
        ? `Salida vencida hace ${Math.abs(minutos)} min`
        : minutos === 0
            ? 'Salida ahora'
            : `Salida en ${minutos} min`;

    return `
        <div class="logistics-departure-alert" role="status" aria-live="polite">
            <span>!</span>
            <strong>${escapeLogisticaHtml(texto)}</strong>
            <small>Pedido aun no marcado como listo</small>
        </div>
    `;
}

function esPedidoAnulado(item) {
    return item?.estado === 'anulada'
        || item?.estado_pedido === 'anulada'
        || item?.pedido_estado === 'anulada'
        || item?.estado === 'eliminada'
        || item?.estado_pedido === 'eliminada'
        || item?.pedido_estado === 'eliminada';
}

function materialLogisticaTieneItems(material) {
    return ['bebidas', 'menaje', 'extras'].some(tipo => Array.isArray(material?.[tipo]) && material[tipo].length);
}

function comandaTieneEntregaLogistica(item) {
    const log = item?.logistica || item?.logistica_inline || {};
    return Boolean(
        getHoraEntregaItem(item) ||
        getHoraSalidaItem(item) ||
        log.nombre_contacto ||
        log.telefono_contacto ||
        log.calle ||
        log.direccion ||
        log.codigo_postal
    );
}

function getEventosLogisticaActivos() {
    const historialLogistica = getHistorialLogistica();
    const historialCocina = getHistorialCocinaLogistica();
    const codigosConLogistica = getCodigosLogistica(historialLogistica);
    const eventos = historialLogistica.map((item, index) => {
        const codigoCocina = item.codigo_cocina || item.codigo_original || item.codigo;
        const comandaCocina = historialCocina.find(cocina => {
            const codigo = cocina.codigo || cocina.codigo_comanda || cocina.id;
            return codigo && String(codigo) === String(codigoCocina);
        });
        return {
            ...(comandaCocina || {}),
            ...item,
            menu_principal: item.menu_principal || comandaCocina?.menu_principal || null,
            menus_adicionales: item.menus_adicionales || comandaCocina?.menus_adicionales || [],
            menu_nombre: item.menu_nombre || comandaCocina?.menu_nombre || '',
            _logisticaSource: 'logistica',
            _logisticaIndex: index
        };
    }).filter(item => !esPedidoAnulado(item));

    historialCocina.forEach((item, index) => {
        const codigo = item.codigo || item.codigo_comanda || item.id;
        if (esPedidoAnulado(item)) return;
        if (!codigo || codigosConLogistica.has(codigo)) return;
        if (!materialLogisticaTieneItems(item.material_logistica) && !comandaTieneEntregaLogistica(item)) return;

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
        return compararEventosPorSalidaAscendente(a, b, getFechaLogisticaItem);
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
        historial[index].logistics_action_log = evento.logistics_action_log || [];
        historial[index].logistics_revision_notice = Object.prototype.hasOwnProperty.call(evento, 'logistics_revision_notice') ? evento.logistics_revision_notice : (historial[index].logistics_revision_notice || null);
        historial[index].operational_revision_log = evento.operational_revision_log || historial[index].operational_revision_log || [];
        historial[index].logistics_completed_confirmed_at = evento.logistics_completed_confirmed_at || null;
        historial[index].logistics_completed_confirmed_by = evento.logistics_completed_confirmed_by || '';
        historial[index].inventory_deducted_at = evento.inventory_deducted_at || historial[index].inventory_deducted_at || null;
        historial[index].inventory_deducted_by = evento.inventory_deducted_by || historial[index].inventory_deducted_by || '';
        if (evento.logistics_ready_at) historial[index].logistics_ready_at = evento.logistics_ready_at;
        if (evento.logistics_ready_by) historial[index].logistics_ready_by = evento.logistics_ready_by;
        historial[index].fecha_modificacion = evento.fecha_modificacion || new Date().toISOString();
        guardarHistorialCocinaLogistica(historial);
        sincronizarAccionesOperativasSupabase(historial[index].codigo || historial[index].codigo_comanda, {
            material_logistica: historial[index].material_logistica || {},
            logistics_status: historial[index].logistics_status || '',
            estado_logistica: historial[index].estado_logistica || '',
            logistics_assigned_to: historial[index].logistics_assigned_to || '',
            logistics_prepared_items: historial[index].logistics_prepared_items || 0,
            logistics_action_log: historial[index].logistics_action_log || [],
            logistics_revision_notice: historial[index].logistics_revision_notice || null,
            operational_revision_log: historial[index].operational_revision_log || [],
            logistics_completed_confirmed_at: historial[index].logistics_completed_confirmed_at || null,
            logistics_completed_confirmed_by: historial[index].logistics_completed_confirmed_by || '',
            inventory_deducted_at: historial[index].inventory_deducted_at || null,
            inventory_deducted_by: historial[index].inventory_deducted_by || '',
            logistics_ready_at: historial[index].logistics_ready_at || null,
            logistics_ready_by: historial[index].logistics_ready_by || ''
        });
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
        logistics_action_log: evento.logistics_action_log || [],
        logistics_revision_notice: Object.prototype.hasOwnProperty.call(evento, 'logistics_revision_notice') ? evento.logistics_revision_notice : (historial[index].logistics_revision_notice || null),
        operational_revision_log: evento.operational_revision_log || historial[index].operational_revision_log || [],
        logistics_completed_confirmed_at: evento.logistics_completed_confirmed_at || null,
        logistics_completed_confirmed_by: evento.logistics_completed_confirmed_by || '',
        inventory_deducted_at: evento.inventory_deducted_at || historial[index].inventory_deducted_at || null,
        inventory_deducted_by: evento.inventory_deducted_by || historial[index].inventory_deducted_by || '',
        logistics_ready_at: evento.logistics_ready_at || historial[index].logistics_ready_at,
        logistics_ready_by: evento.logistics_ready_by || historial[index].logistics_ready_by
    };
    historial[index].fecha_modificacion = evento.fecha_modificacion || new Date().toISOString();
    guardarHistorialLogistica(historial);
    sincronizarAccionesOperativasSupabase(historial[index].codigo_cocina || historial[index].codigo_original || historial[index].codigo, {
        material_logistica: historial[index].material_logistica || {},
        logistics_status: historial[index].logistics_status || historial[index].estado || '',
        estado_logistica: historial[index].logistics_status || historial[index].estado || '',
        logistics_assigned_to: historial[index].logistics_assigned_to || '',
        logistics_prepared_items: historial[index].logistics_prepared_items || 0,
        logistics_action_log: historial[index].logistics_action_log || [],
        logistics_revision_notice: historial[index].logistics_revision_notice || null,
        operational_revision_log: historial[index].operational_revision_log || [],
        logistics_completed_confirmed_at: historial[index].logistics_completed_confirmed_at || null,
        logistics_completed_confirmed_by: historial[index].logistics_completed_confirmed_by || '',
        inventory_deducted_at: historial[index].inventory_deducted_at || null,
        inventory_deducted_by: historial[index].inventory_deducted_by || '',
        logistics_ready_at: historial[index].logistics_ready_at || null,
        logistics_ready_by: historial[index].logistics_ready_by || ''
    });
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
    return tipo;
}

function normalizarItemInventarioServicios(item) {
    return {
        ...item,
        tipo: tipoInventarioDesdeDb(item.tipo),
        unidad: item.unidad_comanda || item.unidad || 'ud',
        unidad_stock: item.unidad_inventario || item.unidad_comanda || item.unidad || 'ud',
        tabla_origen: 'logistics_materials'
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
    const historialCocina = getHistorialCocinaLogistica();

    return historialCocina.filter(item => {
        if (esPedidoAnulado(item)) return false;
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
    const periodo = fechaFiltro ? 'dia' : (window.logisticaFiltroPeriodo || 'hoy');
    const faltantes = filtrarEventosPorPeriodoDashboard(
        getComandasServicioSinLogistica(historial),
        getFechaLogisticaItem,
        'logisticaFiltroFecha',
        periodo
    );
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
    const canEdit = puedeEditarLogistica();

    const historialLogistica = getHistorialLogistica();
    const eventos = getEventosLogisticaActivos();
    const fechaFiltro = document.getElementById('logisticaFiltroFecha')?.value || '';
    const periodo = fechaFiltro ? 'dia' : (window.logisticaFiltroPeriodo || 'hoy');
    const eventosFiltrados = filtrarEventosPorPeriodoDashboard(eventos, getFechaLogisticaItem, 'logisticaFiltroFecha', periodo);

    window.logisticaEventosActivos = eventosFiltrados;
    actualizarKpisLogistica(eventosFiltrados);
    actualizarBotonesPeriodoDashboard('logistica', periodo);
    renderizarAlertasLogistica(historialLogistica);
    refrescarAlertasOperativasGlobales();

    if (!eventos.length) {
        cont.innerHTML = '<div class="logistics-empty">Aún no hay eventos activos en logística.</div>';
        return;
    }

    if (!eventosFiltrados.length) {
        cont.innerHTML = '<div class="logistics-empty">No hay eventos de logística para el día seleccionado.</div>';
        return;
    }

    cont.innerHTML = eventosFiltrados.slice(0, 30).map((item, index) => {
        const codigoArg = getCodigoOperativoJsArg(item);
        const fecha = item.fecha_evento || item.fecha_creacion || '';
        const material = item.material_logistica || {};
        const totalMaterial = ['bebidas', 'menaje', 'extras'].reduce((acc, tipo) => acc + ((material[tipo] || []).length), 0);
        const preparados = Number(item.logistics_prepared_items || 0);
        const estado = normalizarEstadoLogistica(item.logistics_status || item.estado);
        const responsable = item.logistics_assigned_to || '';
        const progreso = totalMaterial ? Math.min(100, Math.round((preparados / totalMaterial) * 100)) : 0;
        const horaSalida = getHoraSalidaItem(item);
        const horaEntrega = getHoraEntregaItem(item);
        const menuResumen = getResumenMenusConPax(item);
        const origen = item._logisticaSource === 'cocina' ? 'Material de menú' : 'Comanda logística';

        const alertaSalida = getAlertaSalidaHtml(item, estado);
        const confirmado = pedidoOperativoConfirmado(item);
        const puedeOperar = canEdit && confirmado;

        return `
            <article class="logistics-event-card ${alertaSalida ? 'logistics-event-card--urgent' : ''}" onclick="abrirPreparacionLogistica(${index}, ${codigoArg})">
                <div class="logistics-event-main">
                    <div>
                        <div class="logistics-event-title-row">
                            <strong>${escapeLogisticaHtml(item.codigo_cocina || item.codigo || 'Sin codigo')}</strong>
                            <span>${escapeLogisticaHtml(fecha || 'Sin fecha')}</span>
                            ${getConfirmacionOperativaHtml(item)}
                            <span class="logistics-status-pill logistics-status-pill--${estado}">${getLabelEstadoLogistica(estado)}</span>
                        </div>
                        <div class="logistics-event-detail-row">
                            <span>${escapeLogisticaHtml(item.empresa || 'Sin empresa')} · ${escapeLogisticaHtml(menuResumen || origen)}</span>
                            <span class="logistics-event-quick-meta">
                                <b>Salida ${escapeLogisticaHtml(horaSalida || '-')}</b>
                                <span>Entrega ${escapeLogisticaHtml(horaEntrega || '-')}</span>
                                <span>${totalMaterial ? `${totalMaterial} articulos` : 'Solo entrega'}</span>
                            </span>
                        </div>
                    </div>
                </div>

                ${alertaSalida}

                ${totalMaterial ? `
                    <div class="logistics-progress-row">
                        <span>${preparados} preparados</span>
                        <div class="logistics-progress-bar ${progreso >= 100 ? 'is-complete' : ''}"><span style="width:${progreso}%"></span></div>
                        <span>${progreso}%</span>
                    </div>
                ` : ''}

                <div class="logistics-event-controls">
                    <label>
                        Responsable
                        <input type="text" value="${escapeLogisticaHtml(responsable)}" placeholder="Asignar persona"
                            ${puedeOperar ? '' : 'disabled'}
                            onpointerdown="event.stopPropagation()"
                            onmousedown="event.stopPropagation()"
                            onclick="event.stopPropagation()"
                            onfocus="event.stopPropagation()"
                            onkeydown="event.stopPropagation()"
                            oninput="event.stopPropagation()"
                            onblur="actualizarResponsableLogistica(${index}, this.value, ${codigoArg})"
                            onchange="actualizarResponsableLogistica(${index}, this.value, ${codigoArg})">
                    </label>
                    <label>
                        Estado
                        <select ${puedeOperar ? '' : 'disabled'} onclick="event.stopPropagation()" onchange="actualizarEstadoLogistica(${index}, this.value, ${codigoArg})">
                            <option value="sin_preparar" ${estado === 'sin_preparar' ? 'selected' : ''}>Sin preparar</option>
                            <option value="en_preparacion" ${estado === 'en_preparacion' ? 'selected' : ''}>En preparación</option>
                            <option value="listo" ${estado === 'listo' ? 'selected' : ''}>Listo para evento</option>
                        </select>
                    </label>
                    <label>
                        Preparados
                        <input type="number" min="0" max="${totalMaterial || 0}" value="${preparados}"
                            ${puedeOperar && totalMaterial ? '' : 'disabled'}
                            onclick="event.stopPropagation()"
                            onchange="actualizarPreparadosLogistica(${index}, this.value, ${codigoArg})">
                    </label>
                </div>
            </article>
        `;
    }).join('');

}

function filtrarLogisticaHoy() {
    window.logisticaFiltroPeriodo = 'hoy';
    const input = document.getElementById('logisticaFiltroFecha');
    if (input) input.value = getFechaLocalHoyDashboard();
    renderizarComandasLogistica();
}

function filtrarLogisticaSemana() {
    window.logisticaFiltroPeriodo = 'semana';
    const input = document.getElementById('logisticaFiltroFecha');
    if (input) input.value = '';
    renderizarComandasLogistica();
}

function limpiarFiltroFechaLogistica() {
    window.logisticaFiltroPeriodo = 'todo';
    const input = document.getElementById('logisticaFiltroFecha');
    if (input) input.value = '';
    renderizarComandasLogistica();
}

function abrirModalArticuloLogistica(id = '') {
    if (!requireEditarLogistica()) return;
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
    if (!requireEditarLogistica()) return;
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
        unidad,
        unidad_comanda: unidad,
        unidad_inventario: unidad,
        conversion_a_stock: 1,
        subcategoria,
        stock_total: stockTotal,
        contexto_logistica: 'ambos',
        aplica_menus: true,
        aplica_servicios: true,
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
            ? window.supabaseClient.from('logistics_materials').update(payload).eq('id', id).select('*').maybeSingle()
            : window.supabaseClient.from('logistics_materials').insert(payload).select('*').maybeSingle();
        const { data, error } = await query;
        if (error) throw error;
        if (!data) {
            throw new Error('Supabase no devolvio el articulo actualizado. Revisa permisos de edicion para logistics_materials.');
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
            alert('No se pudo actualizar el articulo. Revisa los permisos de edicion de logistics_materials en Supabase.');
        } else {
            alert('No se pudo guardar el articulo. Revisa permisos o politicas de Supabase.');
        }
    }
}

async function eliminarArticuloInventarioLogistica(id) {
    if (!requireEditarLogistica()) return;
    if (!window.supabaseClient) {
        alert('No se pudo conectar con Supabase para eliminar el articulo.');
        return;
    }

    const item = (window.logisticaInventarioItems || []).find(mat => String(mat.id) === String(id));
    const nombre = item?.nombre || 'este articulo';
    if (!window.confirm(`Eliminar ${nombre} del inventario?`)) return;

    try {
        const { error } = await window.supabaseClient
            .from('logistics_materials')
            .update({ activo: false })
            .eq('id', id);
        if (error) throw error;
        await renderizarInventarioLogistica();
    } catch (error) {
        console.error('Error eliminando articulo de logistica:', error);
        alert('No se pudo eliminar el articulo. Revisa permisos o politicas de Supabase.');
    }
}

function abrirPreparacionLogistica(index, codigo = '') {
    const item = getEventoLogisticaPorIndiceOCodigo(index, codigo);
    const modal = document.getElementById('logisticaPreparacionModal');
    const content = document.getElementById('logisticaPreparacionContent');
    if (!item || !modal || !content) return;
    const canEdit = puedeEditarLogistica() && pedidoOperativoConfirmado(item);
    const codigoArg = getCodigoOperativoJsArg(item);

    const estado = normalizarEstadoLogistica(item.logistics_status || item.estado);
    const material = item.material_logistica || {};
    const totalMaterial = getMaterialLogisticaPlano(material).length;
    const preparados = getMaterialLogisticaPlano(material).filter(mat => mat.preparado).length;
    const confirmacionHtml = getConfirmacionCompletadoHtml(
        'logistica',
        index,
        item.logistics_completed_confirmed_at,
        totalMaterial,
        preparados,
        codigoArg
    );

    content.innerHTML = `
        <div class="logistics-prep-header">
            <div>
                <h2>${item.empresa || item.codigo_cocina || item.codigo || 'Servicio'}</h2>
                <p>${item.codigo_cocina || item.codigo || ''} · ${item.pax || 0} pax · ${item.fecha_evento || 'Sin fecha'} · Salida ${item.hora_salida || '-'} · Entrega ${getHoraEntregaItem(item) || '-'}</p>
            </div>
        </div>

        <div class="logistics-prep-state">
            <label>Estado general:</label>
            <select ${canEdit ? '' : 'disabled'} onchange="actualizarEstadoLogistica(${index}, this.value, ${codigoArg}); abrirPreparacionLogistica(${index}, ${codigoArg});">
                <option value="sin_preparar" ${estado === 'sin_preparar' ? 'selected' : ''}>Sin preparar</option>
                <option value="en_preparacion" ${estado === 'en_preparacion' ? 'selected' : ''}>En preparación</option>
                <option value="listo" ${estado === 'listo' ? 'selected' : ''}>Listo para evento</option>
            </select>
        </div>

        ${getConfirmacionOperativaHtml(item, 'banner')}

        ${renderRevisionOperativaNotice(item, 'logistica')}

        ${canEdit ? confirmacionHtml : ''}

        ${getCategoriasMaterialLogistica().map(cat => {
            const items = material[cat.key] || [];
            if (!items.length) return '';
            return `
                <section class="logistics-prep-group">
                    <h3>${cat.label.toUpperCase()}</h3>
                    <div class="logistics-prep-list">
                        ${items.map((mat, matIndex) => renderizarItemPreparacionLogistica(index, cat.key, mat, matIndex, canEdit, codigoArg)).join('')}
                    </div>
                </section>
            `;
        }).join('')}

        ${renderActividadOperativaHtml(item, 'logistica')}

        <div class="logistics-prep-actions">
            <button type="button" class="btn-secondary" onclick="cerrarPreparacionLogistica()">Cerrar</button>
            ${canEdit ? `<button type="button" class="btn-primary" onclick="cerrarPreparacionLogistica()">Guardar cambios</button>` : ''}
        </div>
    `;

    modal.style.display = 'block';
}

function getKeyMaterialPreparacionLogistica(tipo, item) {
    return [
        tipo,
        item?.item_id || item?.material_id || item?.id || '',
        item?.source_table || '',
        item?.nombre || '',
        item?.unidad || item?.unidad_comanda || ''
    ].map(value => String(value || '').trim().toLowerCase())
        .filter(Boolean)
        .join('|');
}

function getMaterialPreparacionLogistica(item, tipo, matIndex, materialKey = '') {
    const lista = item?.material_logistica?.[tipo] || [];
    const index = Number(matIndex);
    const esperado = String(materialKey || '');
    const directo = Number.isInteger(index) ? lista[index] : null;
    if (directo && (!esperado || getKeyMaterialPreparacionLogistica(tipo, directo) === esperado)) {
        return directo;
    }
    if (!esperado) return null;
    return lista.find(material => getKeyMaterialPreparacionLogistica(tipo, material) === esperado) || null;
}

function renderizarItemPreparacionLogistica(index, tipo, item, matIndex, canEdit = true, codigoArg = "''") {
    const preparado = !!item.preparado;
    const cantidadActualizada = item.cantidad_actualizada && item.cantidad_anterior !== undefined;
    const materialNuevo = !!item.material_nuevo;
    const tipoArg = getJsArg(tipo);
    const materialKeyArg = getJsArg(getKeyMaterialPreparacionLogistica(tipo, item));
    const updateButton = cantidadActualizada && canEdit
        ? `<button type="button" class="operative-update-btn" onclick="event.preventDefault(); event.stopPropagation(); actualizarItemLogistica(${index}, ${tipoArg}, ${matIndex}, ${materialKeyArg}, ${codigoArg})">Actualizar</button>`
        : '';
    return `
        <label class="logistics-prep-item">
            <input type="checkbox" ${preparado ? 'checked' : ''}
                ${canEdit ? '' : 'disabled'}
                onchange="togglePreparadoLogistica(${index}, ${tipoArg}, ${matIndex}, ${materialKeyArg}, this.checked, ${codigoArg})">
            <span class="logistics-prep-check">${preparado ? '✓' : ''}</span>
            <span class="logistics-prep-name">
                <strong>${item.nombre || 'Material'}</strong>
                <small>${item.cantidad || 0} ${item.unidad || ''}</small>
                ${cantidadActualizada ? `<small class="operative-quantity-change">Antes: ${item.cantidad_anterior || 0} ${item.unidad || ''} | Ahora: ${item.cantidad || 0} ${item.unidad || ''}</small>` : ''}
                ${materialNuevo ? `<small class="operative-quantity-change">Nuevo item</small>` : ''}
            </span>
            ${updateButton}
            <span class="logistics-prep-pill ${preparado ? 'is-ready' : ''}">${preparado ? 'Preparado' : 'Pendiente'}</span>
        </label>
    `;
}

function cerrarPreparacionLogistica() {
    const modal = document.getElementById('logisticaPreparacionModal');
    if (modal) modal.style.display = 'none';
    renderizarComandasLogistica();
}

function actualizarItemLogistica(index, tipo, matIndex, materialKey = '', codigo = '') {
    if (!requireEditarLogistica()) return;
    tipo = leerJsArgSeguro(tipo);
    materialKey = leerJsArgSeguro(materialKey);
    codigo = leerJsArgSeguro(codigo);
    const item = getEventoLogisticaPorIndiceOCodigo(index, codigo);
    const material = getMaterialPreparacionLogistica(item, tipo, matIndex, materialKey);
    if (!item || !material) return;
    const anterior = material.cantidad_anterior;
    material.cantidad_actualizada = false;
    delete material.cantidad_anterior;
    registrarAccionOperativa(
        item,
        'logistica',
        'Actualizacion revisada',
        `${material.nombre || 'Material'}: ${anterior || 0} -> ${material.cantidad || 0} ${material.unidad || ''}`.trim()
    );
    guardarEventoLogisticaActivo(item);
    renderizarComandasLogistica();
    abrirPreparacionLogistica(index, codigo);
}

async function confirmarCompletadoLogistica(index, codigo = '') {
    if (!requireEditarLogistica()) return;
    codigo = leerJsArgSeguro(codigo);
    const item = getEventoLogisticaPorIndiceOCodigo(index, codigo);
    if (!item) return;

    const total = getMaterialLogisticaPlano(item.material_logistica || {}).length;
    const preparados = getMaterialLogisticaPlano(item.material_logistica || {}).filter(mat => mat.preparado).length;
    if (!total || preparados < total) {
        alert('Para confirmar, todo el material debe estar preparado.');
        return;
    }

    try {
        await descontarInventarioLogisticaSiHaceFalta(item);
    } catch (error) {
        console.error('No se pudo descontar inventario:', error);
        alert('No se pudo descontar inventario en Supabase. Revisa permisos o conexion antes de confirmar.');
        return;
    }

    const ahora = new Date().toISOString();
    item.logistics_status = 'listo';
    item.estado = 'listo';
    item.logistics_prepared_items = preparados;
    item.logistics_completed_confirmed_at = ahora;
    item.logistics_completed_confirmed_by = getOperativeActorName();
    item.logistics_ready_at = ahora;
    item.logistics_ready_by = getOperativeActorName();
    item.logistics_revision_notice = null;
    registrarAccionOperativa(item, 'logistica', 'Completado confirmado', `${preparados}/${total} materiales`);
    guardarEventoLogisticaActivo(item);
    renderizarComandasLogistica();
    abrirPreparacionLogistica(index, codigo);
}

function togglePreparadoLogistica(index, tipo, matIndex, materialKey = '', checked, codigo = '') {
    if (!requireEditarLogistica()) return;
    tipo = leerJsArgSeguro(tipo);
    materialKey = leerJsArgSeguro(materialKey);
    codigo = leerJsArgSeguro(codigo);
    const item = getEventoLogisticaPorIndiceOCodigo(index, codigo);
    const materialItem = getMaterialPreparacionLogistica(item, tipo, matIndex, materialKey);
    if (!item || !materialItem) return;

    const eraNuevo = !!materialItem.material_nuevo;
    materialItem.preparado = checked;
    if (checked && eraNuevo) {
        materialItem.material_nuevo = false;
    }
    registrarAccionOperativa(
        item,
        'logistica',
        checked && eraNuevo ? 'Material nuevo preparado' : (checked ? 'Material preparado' : 'Material desmarcado'),
        materialItem?.nombre || 'Material'
    );
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
    if (!checked || preparados < total) {
        item.logistics_completed_confirmed_at = null;
        item.logistics_completed_confirmed_by = '';
    }
    item.fecha_modificacion = new Date().toISOString();
    guardarEventoLogisticaActivo(item);
    abrirPreparacionLogistica(index, codigo);
}

function actualizarResponsableLogistica(index, value, codigo = '') {
    if (!requireEditarLogistica()) return;
    codigo = leerJsArgSeguro(codigo);
    const item = getEventoLogisticaPorIndiceOCodigo(index, codigo);
    if (!item) return;
    item.logistics_assigned_to = value.trim();
    item.fecha_modificacion = new Date().toISOString();
    guardarEventoLogisticaActivo(item);
    renderizarComandasLogistica();
}

function actualizarEstadoLogistica(index, value, codigo = '') {
    if (!requireEditarLogistica()) return;
    codigo = leerJsArgSeguro(codigo);
    const item = getEventoLogisticaPorIndiceOCodigo(index, codigo);
    if (!item) return;
    item.logistics_status = value;
    item.estado = value;
    registrarAccionOperativa(item, 'logistica', 'Estado actualizado', getLabelEstadoLogistica(value));
    item.fecha_modificacion = new Date().toISOString();
    if (value === 'listo') {
        item.logistics_ready_at = new Date().toISOString();
        item.logistics_ready_by = window.currentUser?.user_metadata?.full_name || window.currentUser?.email || '';
    } else {
        item.logistics_completed_confirmed_at = null;
        item.logistics_completed_confirmed_by = '';
    }
    guardarEventoLogisticaActivo(item);
    renderizarComandasLogistica();
}

function actualizarPreparadosLogistica(index, value, codigo = '') {
    if (!requireEditarLogistica()) return;
    codigo = leerJsArgSeguro(codigo);
    const item = getEventoLogisticaPorIndiceOCodigo(index, codigo);
    if (!item) return;
    const material = item.material_logistica || {};
    const totalMaterial = ['bebidas', 'menaje', 'extras'].reduce((acc, tipo) => acc + ((material[tipo] || []).length), 0);
    const preparados = Math.max(0, Math.min(Number(value) || 0, totalMaterial || 0));
    item.logistics_prepared_items = preparados;
    registrarAccionOperativa(item, 'logistica', 'Conteo preparado actualizado', `${preparados}/${totalMaterial || 0} materiales`);

    if (totalMaterial > 0 && preparados >= totalMaterial) {
        item.logistics_status = 'listo';
        item.estado = 'listo';
        item.logistics_ready_at = new Date().toISOString();
        item.logistics_ready_by = window.currentUser?.user_metadata?.full_name || window.currentUser?.email || '';
    } else if (preparados > 0) {
        item.logistics_status = 'en_preparacion';
        item.estado = 'en_preparacion';
        item.logistics_completed_confirmed_at = null;
        item.logistics_completed_confirmed_by = '';
    } else {
        item.logistics_status = 'sin_preparar';
        item.estado = 'sin_preparar';
        item.logistics_completed_confirmed_at = null;
        item.logistics_completed_confirmed_by = '';
    }

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
            .from('logistics_materials')
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
    const canEdit = puedeEditarLogistica();
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
                            ${canEdit ? `<div class="logistics-inventory-actions">
                                <button type="button" class="inventory-action-btn inventory-action-btn--edit" title="Editar" aria-label="Editar"></button>
                                <button type="button" class="inventory-action-btn inventory-action-btn--delete" title="Eliminar" aria-label="Eliminar"></button>
                            </div>` : ''}
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
    if (typeof window.liberarCodigoComandaPendienteSinEsperar === 'function') {
        window.liberarCodigoComandaPendienteSinEsperar('mostrar_historial');
    }

    const dashboard = document.getElementById('dashboard');
    const comandaForm = document.getElementById('comandaForm');
    const historialPage = document.getElementById('historialPage');
    const detalleComanda = document.getElementById('detalleComanda');
    const logisticaForm = document.getElementById('logisticaForm');
    const logisticaPage = document.getElementById('logisticaPage');
    const cocinaPage = document.getElementById('cocinaPage');
    const expedientePedido = document.getElementById('expedientePedido');
    const clientesPanel = document.getElementById('clientesPanel');

    if (dashboard) dashboard.style.display = 'none';
    if (comandaForm) comandaForm.style.display = 'none';
    if (detalleComanda) detalleComanda.style.display = 'none';
    if (logisticaForm) logisticaForm.style.display = 'none';
    if (logisticaPage) logisticaPage.style.display = 'none';
    if (cocinaPage) cocinaPage.style.display = 'none';
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
    if (typeof window.liberarCodigoComandaPendienteSinEsperar === 'function') {
        window.liberarCodigoComandaPendienteSinEsperar('volver_dashboard');
    }

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
    const cocinaPage = document.getElementById('cocinaPage');
    if (cocinaPage) cocinaPage.style.display = 'none';
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

    if (typeof window.limpiarSeleccionCalendario === 'function') {
        window.limpiarSeleccionCalendario();
    }

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
