// ========== NAVEGACIÓN PRINCIPAL ==========

function getFechaLocalHoyDashboard() {
    const hoy = new Date();
    const yyyy = hoy.getFullYear();
    const mm = String(hoy.getMonth() + 1).padStart(2, '0');
    const dd = String(hoy.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
}

function getTimestampOperativoDashboard() {
    return new Date().toISOString();
}

function getUsuarioActualDashboard() {
    return window.currentUser || {};
}

function getUsuarioActualEmailDashboard() {
    return getUsuarioActualDashboard().email || '';
}

function getUsuarioActualIdDashboard() {
    return getUsuarioActualDashboard().id || null;
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
    return window.CaterCloudStorage.leerHistorialComandasLocal();
}

function guardarHistorialCocinaModulo(historial) {
    window.CaterCloudStorage.guardarHistorialComandasLocal(historial || []);
}

async function sincronizarAccionesOperativasSupabase(codigo, patch) {
    try {
        return await window.CaterCloudStorage.sincronizarAccionesOperativasSupabase(codigo, patch, {
            editado_por_nombre: getOperativeActorName()
        });
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
        at: getTimestampOperativoDashboard(),
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

    item.inventory_deducted_at = getTimestampOperativoDashboard();
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
    return String(getUsuarioActualIdDashboard() || getUsuarioActualEmailDashboard() || 'usuario-local')
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

function crearPayloadCambioOperativoGestionado(action) {
    return JSON.stringify({
        action,
        by: getUsuarioActualEmailDashboard() || null,
        at: getTimestampOperativoDashboard()
    });
}

function marcarCambioOperativoGestionado(key, action = 'dismissed') {
    if (!key) return;
    try {
        const payload = crearPayloadCambioOperativoGestionado(action);
        localStorage.setItem(getStorageKeyCambioOperativoGlobal(key), payload);
        localStorage.setItem(getStorageKeyCambioOperativo(key), payload);
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

function crearTarjetaCambioOperativoHtml({ key, areaVista, index, claseTipo = '', kicker, titulo, subtitulo, detalle, accion }) {
    const clase = claseTipo ? ` operational-change-overlay--${claseTipo}` : '';
    return {
        clase,
        html: `
        <article class="operational-change-card" role="dialog" aria-live="assertive" aria-label="Comanda modificada">
            <button type="button" class="operational-change-close" aria-label="Cerrar aviso"
                onclick="descartarCambioOperativoDesdeTarjeta('${key}')">×</button>
            <button type="button" class="operational-change-body"
                onclick="abrirCambioOperativoDesdeTarjeta('${areaVista}', ${index}, '${key}')">
                <span class="operational-change-kicker">${escapeLogisticaHtml(kicker)}</span>
                <strong>${escapeLogisticaHtml(titulo)}</strong>
                <span>${escapeLogisticaHtml(subtitulo)}</span>
                <small>${escapeLogisticaHtml(detalle)}</small>
                <em>${escapeLogisticaHtml(accion)}</em>
            </button>
        </article>
    `
    };
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
    overlay.innerHTML = crearTarjetaCambioOperativoHtml({
        key: cambio.key,
        areaVista,
        index: cambio.index,
        kicker: `Cambio para ${tituloArea}`,
        titulo: `Comanda modificada · ${cambio.codigo || 'Sin codigo'}`,
        subtitulo: `${cambio.empresa} · afecta ${cambio.label}`,
        detalle,
        accion
    }).html;
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
    const tarjeta = crearTarjetaCambioOperativoHtml({
        key: cambio.key,
        areaVista: cambio.areaVista,
        index: cambio.index,
        claseTipo: cambio.tipo,
        kicker: tituloTipo,
        titulo: cambio.codigo || 'Sin codigo',
        subtitulo: `${cambio.empresa} · aviso para ${tituloArea}`,
        detalle,
        accion
    });
    overlay.id = 'operationalChangeOverlay';
    overlay.className = `operational-change-overlay${tarjeta.clase}`;
    overlay.dataset.key = cambio.key;
    overlay.innerHTML = tarjeta.html;
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
        usuario: getUsuarioActualEmailDashboard() || null,
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

// El modulo de rutas vive en js/routes-dashboard.js

function getHistorialLogistica() {
    return window.CaterCloudStorage.leerHistorialLogisticaLocal();
}

function guardarHistorialLogistica(historial) {
    window.CaterCloudStorage.guardarHistorialLogisticaLocal(historial || []);
}

function getHistorialCocinaLogistica() {
    return window.CaterCloudStorage.leerHistorialComandasLocal();
}

function guardarHistorialCocinaLogistica(historial) {
    window.CaterCloudStorage.guardarHistorialComandasLocal(historial || []);
}

// Helpers de fecha/logistica de rutas viven en js/routes-dashboard.js

function getMinutosHastaSalida(item) {
    const fecha = String(item?.fecha_evento || '').split('T')[0];
    const hora = String(item?.hora_salida || '').trim();
    if (!fecha || !hora) return null;

    const salida = new Date(`${fecha}T${hora}`);
    if (Number.isNaN(salida.getTime())) return null;

    return Math.ceil((salida.getTime() - Date.now()) / 60000);
}

function getAlertaSalidaData(item, estado) {
    if (estado === 'listo') return null;
    const minutos = getMinutosHastaSalida(item);
    if (minutos === null || minutos > 15) return null;

    const texto = minutos < 0
        ? `Salida vencida hace ${Math.abs(minutos)} min`
        : minutos === 0
            ? 'Salida ahora'
            : `Salida en ${minutos} min`;

    return { minutos, texto };
}

function pedidoTieneAlertaSalida(item, estado) {
    return Boolean(getAlertaSalidaData(item, estado));
}

function getAlertaSalidaHtml(item, estado) {
    const alerta = getAlertaSalidaData(item, estado);
    if (!alerta) return '';

    return `
        <div class="logistics-departure-alert" role="status" aria-live="polite">
            <span>!</span>
            <strong>${escapeLogisticaHtml(alerta.texto)}</strong>
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
        historial[index].fecha_modificacion = evento.fecha_modificacion || getTimestampOperativoDashboard();
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
    historial[index].fecha_modificacion = evento.fecha_modificacion || getTimestampOperativoDashboard();
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

function getTotalMaterialLogistica(item = {}) {
    const material = item.material_logistica || {};
    return ['bebidas', 'menaje', 'extras'].reduce((acc, tipo) => acc + ((material[tipo] || []).length), 0);
}

function getPreparadosLogistica(item = {}) {
    const preparadosMarcados = getMaterialLogisticaPlano(item.material_logistica || {}).filter(mat => mat.preparado).length;
    return Math.max(preparadosMarcados, Number(item.logistics_prepared_items || 0) || 0);
}

function getEstadoLogisticaOperativo(item = {}) {
    const total = getTotalMaterialLogistica(item);
    const preparados = Math.min(getPreparadosLogistica(item), total);
    const estadoOperativo = normalizarEstadoLogistica(item.logistics_status || item.estado);

    if (!total) return estadoOperativo;
    if (preparados >= total) return 'listo';
    if (preparados > 0 && estadoOperativo === 'sin_preparar') return 'en_preparacion';
    if (estadoOperativo === 'listo') return preparados > 0 ? 'en_preparacion' : 'sin_preparar';
    return estadoOperativo;
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
        const totalMaterial = getTotalMaterialLogistica(item);
        const preparados = Math.min(getPreparadosLogistica(item), totalMaterial);
        const estado = getEstadoLogisticaOperativo(item);
        const responsable = item.logistics_assigned_to || '';
        const progreso = totalMaterial ? Math.min(100, Math.round((preparados / totalMaterial) * 100)) : 0;
        const horaSalida = getHoraSalidaItem(item);
        const horaEntrega = getHoraEntregaItem(item);
        const menuResumen = getResumenMenusConPax(item);
        const origen = item._logisticaSource === 'cocina' ? 'Material de menú' : 'Comanda logística';

        const tieneAlertaSalida = pedidoTieneAlertaSalida(item, estado);
        const alertaSalida = tieneAlertaSalida ? getAlertaSalidaHtml(item, estado) : '';
        const confirmado = pedidoOperativoConfirmado(item);
        const puedeOperar = canEdit && confirmado;

        return `
            <article class="logistics-event-card ${tieneAlertaSalida ? 'logistics-event-card--urgent' : ''}" onclick="abrirPreparacionLogistica(${index}, ${codigoArg})">
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

    const ahora = getTimestampOperativoDashboard();
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
        item.logistics_ready_at = getTimestampOperativoDashboard();
        item.logistics_ready_by = getOperativeActorName();
    }
    if (!checked || preparados < total) {
        item.logistics_completed_confirmed_at = null;
        item.logistics_completed_confirmed_by = '';
    }
    item.fecha_modificacion = getTimestampOperativoDashboard();
    guardarEventoLogisticaActivo(item);
    abrirPreparacionLogistica(index, codigo);
}

function actualizarResponsableLogistica(index, value, codigo = '') {
    if (!requireEditarLogistica()) return;
    codigo = leerJsArgSeguro(codigo);
    const item = getEventoLogisticaPorIndiceOCodigo(index, codigo);
    if (!item) return;
    item.logistics_assigned_to = value.trim();
    item.fecha_modificacion = getTimestampOperativoDashboard();
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
    item.fecha_modificacion = getTimestampOperativoDashboard();
    if (value === 'listo') {
        item.logistics_ready_at = getTimestampOperativoDashboard();
        item.logistics_ready_by = getOperativeActorName();
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
        item.logistics_ready_at = getTimestampOperativoDashboard();
        item.logistics_ready_by = getOperativeActorName();
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

    item.fecha_modificacion = getTimestampOperativoDashboard();
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
