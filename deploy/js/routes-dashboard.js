// ========== ROUTES DASHBOARD: UI, datos y acciones de rutas ==========

window.rutasLogisticaState = window.rutasLogisticaState || {
    vehicles: [],
    drivers: [],
    allDrivers: [],
    routes: [],
    loading: false,
    editingRouteId: null
};

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
    return window.CaterCloudRoutes.parseHoraRutaEnMinutos(hora);
}

function formatearMinutosRuta(total) {
    return window.CaterCloudRoutes.formatearMinutosRuta(total);
}

function formatearDuracionRuta(minutos) {
    return window.CaterCloudRoutes.formatearDuracionRuta(minutos);
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
    return window.CaterCloudRoutes.normalizarEstadoParadaRuta(status);
}

function getLabelEstadoParadaRuta(status) {
    return window.CaterCloudRoutes.getLabelEstadoParadaRuta(status);
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

function getVehiculoParadaRuta(stop, route) {
    const vehicleId = stop.vehicle_id || route.vehicle_id || route.vehicle?.id || route.route_vehicles?.id || '';
    return (window.rutasLogisticaState.vehicles || []).find(vehicle => String(vehicle.id) === String(vehicleId))
        || route.vehicle
        || route.route_vehicles
        || {};
}

function getContactoParadaRuta(stop) {
    const match = String(stop.notes || '').match(/contacto:([^|]+)/);
    return match?.[1]?.trim() || '';
}

function renderSelectorVehiculoParadaRuta(stop, route) {
    const selectedId = stop.vehicle_id || route.vehicle_id || route.vehicle?.id || route.route_vehicles?.id || '';
    return `
        <label class="routes-stop-vehicle">
            <span>Furgoneta</span>
            <select
                id="rutaStopVehicle_${stop.id}"
                class="routes-mini-select"
                ${puedeEditarLogistica() ? '' : 'disabled'}
                onchange="actualizarVehiculoParadaRuta('${stop.id}')"
            >
                ${renderOptionsVehiculosRuta(selectedId)}
            </select>
        </label>
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
                    <div class="routes-route-title">
                        <strong>${escapeLogisticaHtml(route.name || vehicle.plate || 'Ruta')}</strong>
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
                        const vehiculoParada = getVehiculoParadaRuta(stop, route);
                        const contacto = getContactoParadaRuta(stop);
                        return `
                        <div class="routes-stop-row routes-stop-row--${estadoParada}">
                            <span class="routes-stop-order">${Number(stop.stop_order || 0)}</span>
                            <div class="routes-stop-info">
                                <strong>${stop.stop_type === 'pickup' ? 'Recogida' : 'Entrega'} · ${escapeLogisticaHtml(stop.company_name || 'Sin empresa')}${contacto ? ` · ${escapeLogisticaHtml(contacto)}` : ''}</strong>
                                <small>${escapeLogisticaHtml(stop.address_street || '')} ${escapeLogisticaHtml(stop.address_number || '')} · ${escapeLogisticaHtml(stop.postal_code || '')}</small>
                                <div class="routes-stop-time-line">
                                    <small>${escapeLogisticaHtml(getResumenHoraStopRuta(stop, tiempo))}</small>
                                    <span class="routes-stop-status routes-stop-status--${estadoParada}">${getLabelEstadoParadaRuta(estadoParada)}</span>
                                </div>
                            </div>
                            <div class="routes-stop-controls">
                                <div class="routes-stop-top-controls">
                                    <div class="routes-stop-vehicle-wrap">
                                        ${renderSelectorVehiculoParadaRuta(stop, route)}
                                    </div>
                                    <label class="routes-stop-duration">
                                        <span>Duracion parada</span>
                                        <span class="routes-stop-duration-input">
                                            <input type="number" id="rutaStopDuration_${stop.id}" min="0" step="5" value="${escapeLogisticaHtml(getDuracionParadaRuta(stop))}">
                                            <span>min</span>
                                        </span>
                                    </label>
                                </div>
                                <div class="routes-stop-bottom-controls">
                                    <small>${escapeLogisticaHtml(vehiculoParada.plate || vehiculoParada.name || '')}</small>
                                    <div class="routes-stop-actions">
                                        <button type="button" ${estadoParada === 'in_route' || estadoParada === 'delivered' || !puedeEditarLogistica() ? 'disabled' : ''} onclick="actualizarEstadoParadaRuta('${stop.id}', 'in_route')">En ruta</button>
                                        <button type="button" ${estadoParada === 'delivered' || !puedeEditarLogistica() ? 'disabled' : ''} onclick="actualizarEstadoParadaRuta('${stop.id}', 'delivered')">Entregado</button>
                                        <button type="button" ${puedeEditarLogistica() ? '' : 'disabled'} onclick="guardarDuracionParadaRuta('${stop.id}')">Guardar</button>
                                        <button type="button" ${puedeEditarLogistica() ? '' : 'disabled'} onclick="eliminarParadaRutaLogistica('${stop.id}')">×</button>
                                    </div>
                                </div>
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

function formatearHoraPrincipalPlanningCompartido(hora) {
    const match = String(hora || '').match(/^(\d{1,2}):(\d{2})/);
    if (!match) return hora || '--:--';
    return `${match[1].padStart(2, '0')}:${match[2]}`;
}

function crearTextoPlanningRutasWhatsApp() {
    const fecha = getFechaRutasLogistica();
    const paradas = (window.rutasLogisticaState.routes || []).flatMap(route => {
        const driver = route.driver || route.route_drivers || {};
        const conductor = driver.name || 'Sin conductor';
        return getRouteStops(route).map(stop => ({
            stop,
            conductor,
            horaOrden: getHoraCompartirStopRuta(stop) || route.starts_at || ''
        }));
    }).sort((a, b) => {
        const hora = String(a.horaOrden).localeCompare(String(b.horaOrden));
        if (hora !== 0) return hora;
        return String(a.stop.company_name || '').localeCompare(String(b.stop.company_name || ''));
    });

    if (!paradas.length) return '';

    const lineas = [
        'Logistica Decuatro Catering',
        formatearFechaPlanningWhatsApp(fecha),
        ''
    ];

    let bloqueActual = '';
    paradas.forEach(({ stop, conductor }) => {
        const hora = formatearHoraPrincipalPlanningCompartido(getHoraCompartirStopRuta(stop));
        if (bloqueActual && bloqueActual !== hora) lineas.push('');
        bloqueActual = hora;

        const entrega = stop.planned_arrival || stop.deadline_time || '';
        const tipo = stop.stop_type === 'pickup' ? 'Recogida' : 'Entrega';
        const empresa = stop.company_name || 'Sin empresa';
        const contacto = getContactoParadaRuta(stop);
        const entregaTexto = stop.stop_type === 'delivery' && entrega && entrega !== hora ? ` (${entrega})` : '';
        const contactoTexto = contacto ? ` - ${contacto}` : '';
        lineas.push(`${hora} ${tipo} ${empresa}${contactoTexto}${entregaTexto} @${conductor}`);
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

    const route = (window.rutasLogisticaState.routes || []).find(item => String(item.id) === String(routeId));
    const vehicleId = route?.vehicle_id || route?.vehicle?.id || route?.route_vehicles?.id || null;
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

async function actualizarVehiculoParadaRuta(stopId) {
    if (window.AppPermissions && !AppPermissions.requireLogistics('Tu usuario no tiene permiso para editar rutas.')) return;
    if (!window.supabaseClient) {
        mostrarMensajeRutasLogistica('Supabase no esta disponible.', 'error');
        return;
    }

    const vehicleId = document.getElementById(`rutaStopVehicle_${stopId}`)?.value || null;
    if (!vehicleId) {
        mostrarMensajeRutasLogistica('Selecciona una furgoneta valida para el pedido.', 'error');
        return;
    }

    const vehiculo = (window.rutasLogisticaState.vehicles || []).find(v => String(v.id) === String(vehicleId));
    if (!vehiculo) {
        mostrarMensajeRutasLogistica('La furgoneta seleccionada ya no esta disponible. Recarga rutas e intenta de nuevo.', 'error');
        return;
    }

    try {
        const { error } = await window.supabaseClient
            .from('route_stops')
            .update({ vehicle_id: vehicleId, updated_at: getTimestampOperativoDashboard() })
            .eq('id', stopId);
        if (error) throw error;
        mostrarMensajeRutasLogistica('Furgoneta actualizada para este pedido.', 'success');
        await cargarModuloRutasLogistica();
    } catch (error) {
        console.error('Error actualizando furgoneta de parada:', error);
        mostrarMensajeRutasLogistica(`No se pudo actualizar la furgoneta: ${error.message || error}`, 'error');
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
        updated_at: getTimestampOperativoDashboard()
    };

    if (estado === 'in_route') {
        patch.actual_departure = getTimestampOperativoDashboard();
    }
    if (estado === 'delivered') {
        patch.actual_arrival = getTimestampOperativoDashboard();
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

    const vehicleId = document.getElementById('rutaVehiculoSelect')?.value
        || window.rutasLogisticaState.vehicles?.[0]?.id
        || null;
    const driverId = document.getElementById('rutaConductorSelect')?.value
        || window.rutasLogisticaState.drivers?.[0]?.id
        || null;
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

function getHoraReferenciaParadaRuta(stop) {
    return parseHoraRutaEnMinutos(
        stop.stop_type === 'delivery'
            ? (stop.planned_departure || stop.planned_arrival || stop.deadline_time || '')
            : (stop.planned_arrival || stop.deadline_time || '')
    );
}

function paradasDentroJornadaRuta(route, paradasExtra = []) {
    const { inicio, fin } = getJornadaRutaEnMinutos(route);
    if (fin <= inicio) return true;

    return [...getRouteStops(route), ...paradasExtra].every(stop => {
        const hora = getHoraReferenciaParadaRuta(stop);
        if (hora === null) return true;
        const finParada = hora + getDuracionParadaRuta(stop);
        return hora >= inicio && finParada <= fin;
    });
}

function calcularDuracionRutaConParadas(route, paradasExtra = []) {
    const stops = [...getRouteStops(route), ...paradasExtra];
    const traslado = getTiempoTrasladoRutas();
    const servicio = stops.reduce((acc, stop) => acc + getDuracionParadaRuta(stop), 0);
    return servicio + (stops.length * traslado);
}

function getMetricasJornadaRuta(route, paradasExtra = []) {
    const { inicio, fin } = getJornadaRutaEnMinutos(route);
    const stops = [...getRouteStops(route), ...paradasExtra];
    const horasFin = stops
        .map(stop => {
            const hora = getHoraReferenciaParadaRuta(stop);
            return hora === null ? null : hora + getDuracionParadaRuta(stop);
        })
        .filter(hora => hora !== null);
    const finEstimado = horasFin.length ? Math.max(...horasFin) : inicio;
    const capacidad = Math.max(0, fin - inicio);
    return {
        inicio,
        fin,
        capacidad,
        finEstimado,
        holguraFinal: Math.max(0, fin - finEstimado)
    };
}

function puedeRutaRecibirParadas(route, paradasExtra) {
    const capacidad = getCapacidadRuta(route);
    if (!paradasDentroJornadaRuta(route, paradasExtra)) return false;
    if (!capacidad) return true;
    return calcularDuracionRutaConParadas(route, paradasExtra) <= capacidad;
}

function getRutasPlannerDeps() {
    return {
        getZonaRutaPedido,
        getBloqueHoraRutaPedido,
        getFechaRutasLogistica,
        getRouteStops,
        parseHoraRutaEnMinutos,
        calcularDuracionRutaConParadas,
        getCapacidadRuta,
        crearParadasPedidoRuta,
        puedeRutaRecibirParadas,
        getParadasPlanificadasRuta,
        getHoraObjetivoRutaPedido,
        normalizarDriverRuta,
        getDriverRuta,
        getJornadaRutaEnMinutos,
        getMetricasJornadaRuta,
        getConductoresOperativosRutas,
        contarRutasConParadas,
        getVehiclesCount: () => (window.rutasLogisticaState.vehicles || []).length
    };
}

function seleccionarMejorRutaParaPedido(item, routes, extrasPorRuta) {
    return window.CaterCloudRoutes.seleccionarMejorRutaParaPedido(item, routes, extrasPorRuta, getRutasPlannerDeps());
}

function seleccionarRutaVaciaCompatibleParaPedido(item, routes, extrasPorRuta, fecha = getFechaRutasLogistica()) {
    return window.CaterCloudRoutes.seleccionarRutaVaciaCompatibleParaPedido(item, routes, extrasPorRuta, fecha, getRutasPlannerDeps());
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

function getMaxRutasAutomaticasLogistica(vehicles, drivers, totalPedidos) {
    return Math.min(
        (vehicles || []).length,
        (drivers || []).length,
        Number(totalPedidos || 0)
    );
}

function debeCrearRutaAutomaticaAntesDeReusar(routes, extrasPorRuta, vehiculosDisponibles, conductoresDisponibles, maxRutasAutomaticas) {
    if (!vehiculosDisponibles.length || !conductoresDisponibles.length) return false;
    return contarRutasConParadas(routes, extrasPorRuta) < maxRutasAutomaticas;
}

function debeAbrirRutaNuevaParaPedido(item, route, routes, extrasPorRuta, vehiculosDisponibles, conductoresDisponibles, totalPedidos, fecha) {
    return window.CaterCloudRoutes.debeAbrirRutaNuevaParaPedido(
        item,
        route,
        routes,
        extrasPorRuta,
        vehiculosDisponibles,
        conductoresDisponibles,
        totalPedidos,
        fecha,
        getRutasPlannerDeps()
    );
}

function getVehicleIdRuta(route) {
    return route?.vehicle_id || route?.vehicle?.id || route?.route_vehicles?.id || null;
}

function crearParadasPedidoRuta(item, routeId, stopOrderBase = 0, fecha = getFechaRutasLogistica(), vehicleId = null) {
    const paradas = [];
    const entregaOrder = stopOrderBase + 1;
    if (getFechaLogisticaItem(item) === fecha) {
        paradas.push(crearPayloadParadaRutaLogistica(item, routeId, 'delivery', entregaOrder, vehicleId));
    }

    if (getFechaRecogidaRutaItem(item) === fecha && getHoraRecogidaClienteRutaItem(item)) {
        paradas.push(crearPayloadParadaRutaLogistica(item, routeId, 'pickup', stopOrderBase + paradas.length + 1, vehicleId));
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
        return {
            driver,
            index,
            score: window.CaterCloudRoutes.puntuarConductorParaRutaNueva(
                driver,
                paradasPrueba,
                horaObjetivo,
                startsAt,
                getRutasPlannerDeps()
            )
        };
    }).filter(Boolean).sort((a, b) => a.score - b.score);

    if (!candidatos.length) return null;

    const elegido = candidatos[0];
    const [driver] = conductoresDisponibles.splice(elegido.index, 1);
    const vehicle = vehiculosDisponibles.shift();
    return crearRutaAutomaticaLogistica(fecha, vehicle, driver, startsAt);
}

function crearPayloadParadaRutaLogistica(item, routeId, tipo, stopOrder, vehicleId = null) {
    const codigo = getCodigoRutaPedido(item);
    const log = item.logistica || item.logistica_inline || {};
    const direccion = getDireccionRutaPedido(item);
    const horaEntrega = getHoraEntregaItem(item) || '';
    const horaSalida = getHoraSalidaItem(item) || '';
    const horaRecogida = getHoraRecogidaClienteRutaItem(item);

    return {
        route_id: routeId,
        order_id: null,
        vehicle_id: vehicleId,
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
        const maxRutasAutomaticas = getMaxRutasAutomaticasLogistica(vehicles, drivers, pedidosOrdenados.length);

        for (const item of pedidosOrdenados) {
            let route = seleccionarRutaVaciaCompatibleParaPedido(item, routes, extrasPorRuta, fecha);
            let nuevasParadas = route
                ? crearParadasPedidoRuta(item, route.id, stopOrders.get(String(route.id)) || 0, fecha, getVehicleIdRuta(route))
                : crearParadasPedidoRuta(item, '__nueva_ruta__', 0);
            if (!nuevasParadas.length) continue;

            if (!route && debeCrearRutaAutomaticaAntesDeReusar(
                routes,
                extrasPorRuta,
                vehiculosDisponibles,
                conductoresDisponibles,
                maxRutasAutomaticas
            )) {
                route = await crearRutaAutomaticaCompatibleLogistica(fecha, vehiculosDisponibles, conductoresDisponibles, nuevasParadas, startsAt);
                if (route) {
                    routes.push(route);
                    stopOrders.set(String(route.id), 0);
                    extrasPorRuta.set(String(route.id), []);
                    nuevasParadas = crearParadasPedidoRuta(item, route.id, 0, fecha, getVehicleIdRuta(route));
                }
            }

            if (!route) {
                route = seleccionarMejorRutaParaPedido(item, routes, extrasPorRuta);
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
                nuevasParadas = route
                    ? crearParadasPedidoRuta(item, route.id, stopOrders.get(String(route.id)) || 0, fecha, getVehicleIdRuta(route))
                    : nuevasParadas;
            }

            if (!route) {
                route = await crearRutaAutomaticaCompatibleLogistica(fecha, vehiculosDisponibles, conductoresDisponibles, nuevasParadas, startsAt);
                if (!route) {
                    pedidosNoAsignados.push(item);
                    continue;
                }
                routes.push(route);
                stopOrders.set(String(route.id), 0);
                extrasPorRuta.set(String(route.id), []);
                nuevasParadas = crearParadasPedidoRuta(item, route.id, 0, fecha, getVehicleIdRuta(route));
            }

            const routeKey = String(route.id);
            nuevasParadas.forEach(parada => {
                const order = (stopOrders.get(routeKey) || 0) + 1;
                parada.route_id = route.id;
                parada.stop_order = order;
                parada.vehicle_id = parada.vehicle_id || getVehicleIdRuta(route);
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

    try {
        const select = document.getElementById(`rutaDestino_${codigo}`);
        const routeId = select?.value || null;
        const route = routeId
            ? (window.rutasLogisticaState.routes || []).find(r => String(r.id) === String(routeId))
            : null;
        if (!route) {
            mostrarMensajeRutasLogistica('Selecciona una ruta creada para añadir la parada.', 'error');
            return;
        }

        const stopOrder = getRouteStops(route).length + 1;
        const payload = crearPayloadParadaRutaLogistica(item, routeId, tipo, stopOrder, getVehicleIdRuta(route));
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
