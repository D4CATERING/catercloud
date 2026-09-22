const fs = require('fs');
const path = require('path');
const vm = require('vm');

const root = path.resolve(__dirname, '..');
const source = fs.readFileSync(path.join(root, 'js', 'routes-module.js'), 'utf8');
const sandbox = { window: {} };
vm.createContext(sandbox);
vm.runInContext(source, sandbox, { filename: 'routes-module.js' });

const planner = sandbox.window.CaterCloudRoutes;
if (!planner) {
    throw new Error('No se pudo cargar window.CaterCloudRoutes.');
}

function assertEqual(actual, expected, label) {
    if (actual !== expected) {
        throw new Error(`${label}: esperado ${expected}, recibido ${actual}`);
    }
    console.log(`OK ${label}: ${actual}`);
}

function parseHoraRutaEnMinutos(hora) {
    return planner.parseHoraRutaEnMinutos(hora);
}

function crearParadasPedidoRuta(item, routeId) {
    return [{
        route_id: routeId,
        stop_type: 'delivery',
        planned_departure: item.salida,
        planned_arrival: item.entrega,
        deadline_time: item.entrega,
        service_duration_minutes: item.duracion || 45,
        address_street: item.calle || 'Paseo de la Castellana',
        postal_code: item.cp || '28046'
    }];
}

function getRouteStops(route) {
    return (route.stops || []).slice();
}

function getDriverRuta(route) {
    return route.driver || {};
}

function getJornadaRutaEnMinutos(route) {
    const driver = getDriverRuta(route);
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
    return [...getRouteStops(route), ...paradasExtra].every(stop => {
        const hora = getHoraReferenciaParadaRuta(stop);
        const finParada = hora === null ? null : hora + Number(stop.service_duration_minutes || 0);
        return hora === null || (hora >= inicio && finParada <= fin);
    });
}

function calcularDuracionRutaConParadas(route, paradasExtra = []) {
    const stops = [...getRouteStops(route), ...paradasExtra];
    const traslado = 15;
    const servicio = stops.reduce((acc, stop) => acc + Number(stop.service_duration_minutes || 0), 0);
    return servicio + (stops.length * traslado);
}

function getCapacidadRuta(route) {
    const { inicio, fin } = getJornadaRutaEnMinutos(route);
    return Math.max(0, fin - inicio);
}

function getMetricasJornadaRuta(route, paradasExtra = []) {
    const { inicio, fin } = getJornadaRutaEnMinutos(route);
    const horasFin = [...getRouteStops(route), ...paradasExtra]
        .map(stop => {
            const hora = getHoraReferenciaParadaRuta(stop);
            return hora === null ? null : hora + Number(stop.service_duration_minutes || 0);
        })
        .filter(hora => hora !== null);
    const finEstimado = horasFin.length ? Math.max(...horasFin) : inicio;
    return {
        inicio,
        fin,
        capacidad: Math.max(0, fin - inicio),
        finEstimado,
        holguraFinal: Math.max(0, fin - finEstimado)
    };
}

function puedeRutaRecibirParadas(route, paradasExtra) {
    const capacidad = getCapacidadRuta(route);
    return paradasDentroJornadaRuta(route, paradasExtra)
        && (!capacidad || calcularDuracionRutaConParadas(route, paradasExtra) <= capacidad);
}

function getDeps(fecha = '2026-09-23') {
    return {
        getZonaRutaPedido: item => item.zona || `cp:${String(item.cp || '28046').slice(0, 3)}`,
        getBloqueHoraRutaPedido: item => Math.floor((parseHoraRutaEnMinutos(item.salida || item.entrega || '12:00') ?? 720) / 30),
        getFechaRutasLogistica: () => fecha,
        getRouteStops,
        parseHoraRutaEnMinutos,
        calcularDuracionRutaConParadas,
        getCapacidadRuta,
        crearParadasPedidoRuta,
        puedeRutaRecibirParadas,
        getParadasPlanificadasRuta: (route, extrasPorRuta) => [
            ...getRouteStops(route),
            ...(extrasPorRuta.get(String(route.id)) || [])
        ],
        getHoraObjetivoRutaPedido: item => parseHoraRutaEnMinutos(item.salida || item.entrega || '12:00') ?? 720,
        normalizarDriverRuta: driver => ({
            ...driver,
            work_start: driver.work_start || '08:00',
            work_end: driver.work_end || '18:00'
        }),
        getDriverRuta,
        getJornadaRutaEnMinutos,
        getMetricasJornadaRuta,
        getConductoresOperativosRutas: () => [],
        contarRutasConParadas: routes => routes.filter(route => route.stops?.length).length,
        getVehiclesCount: () => 3
    };
}

function run() {
    const deps = getDeps();
    const drivers = [
        { id: 'short', name: 'Corto 8-12', work_start: '08:00', work_end: '12:00' },
        { id: 'mid', name: 'Medio 7-15', work_start: '07:00', work_end: '15:00' },
        { id: 'late', name: 'Tarde 10-18', work_start: '10:00', work_end: '18:00' }
    ];

    const pedidoManana = { salida: '09:00', entrega: '10:00', duracion: 60, zona: 'cp:280' };
    const paradasManana = crearParadasPedidoRuta(pedidoManana, '__nueva_ruta__');
    const candidatoManana = drivers
        .map(driver => ({
            driver,
            score: planner.puntuarConductorParaRutaNueva(driver, paradasManana, deps.getHoraObjetivoRutaPedido(pedidoManana), '08:00', deps)
        }))
        .filter(item => item.score !== null)
        .sort((a, b) => a.score - b.score)[0];
    assertEqual(candidatoManana.driver.id, 'short', 'pedido 09:00 prioriza jornada corta compatible');

    const pedidoTarde = { salida: '14:30', entrega: '15:30', duracion: 45, zona: 'cp:280' };
    const paradasTarde = crearParadasPedidoRuta(pedidoTarde, '__nueva_ruta__');
    const candidatoTarde = drivers
        .map(driver => ({
            driver,
            score: planner.puntuarConductorParaRutaNueva(driver, paradasTarde, deps.getHoraObjetivoRutaPedido(pedidoTarde), '08:00', deps)
        }))
        .filter(item => item.score !== null)
        .sort((a, b) => a.score - b.score)[0];
    assertEqual(candidatoTarde.driver.id, 'late', 'pedido 14:30 evita jornadas que no llegan');

    const routes = [
        { id: 'short-route', starts_at: '08:00', driver: drivers[0], stops: [] },
        { id: 'mid-route', starts_at: '07:00', driver: drivers[1], stops: [] },
        { id: 'late-route', starts_at: '10:00', driver: drivers[2], stops: [] }
    ];
    const rutaVacia = planner.seleccionarRutaVaciaCompatibleParaPedido(
        pedidoManana,
        routes,
        new Map(routes.map(route => [route.id, []])),
        '2026-09-23',
        deps
    );
    assertEqual(rutaVacia.id, 'short-route', 'ruta vacia usa ventana mas restrictiva compatible');

    console.log('OK diagnostico de planning automatico completado.');
}

run();
