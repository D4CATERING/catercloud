// ========== ROUTES MODULE: planificacion automatica ==========

(function initCaterCloudRoutesModule() {
    function seleccionarMejorRutaParaPedido(item, routes, extrasPorRuta, deps) {
        const zona = deps.getZonaRutaPedido(item);
        const bloque = deps.getBloqueHoraRutaPedido(item);
        const fecha = deps.getFechaRutasLogistica();
        const candidatos = routes.map(route => {
            const extras = extrasPorRuta.get(String(route.id)) || [];
            const paradas = [...deps.getRouteStops(route), ...extras];
            const zonasRuta = paradas.map(stop => {
                const pseudoItem = {
                    logistica: {
                        calle: stop.address_street,
                        numero: stop.address_number,
                        codigo_postal: stop.postal_code
                    }
                };
                return deps.getZonaRutaPedido(pseudoItem);
            });
            const bloquesRuta = paradas
                .map(stop => deps.parseHoraRutaEnMinutos(stop.planned_arrival || stop.deadline_time || ''))
                .filter(min => min !== null)
                .map(min => Math.floor(min / 30));
            const cercaniaZona = zonasRuta.includes(zona) ? 0 : 2;
            const cercaniaHora = bloquesRuta.length
                ? Math.min(...bloquesRuta.map(b => Math.abs(b - bloque)))
                : 1;
            const carga = deps.calcularDuracionRutaConParadas(route, extras);
            const capacidad = deps.getCapacidadRuta(route) || 480;
            const presionCarga = (paradas.length * 180) + ((carga / Math.max(capacidad, 1)) * 240);
            return { route, score: (cercaniaZona * 80) + (cercaniaHora * 10) + presionCarga };
        }).sort((a, b) => a.score - b.score);

        return candidatos.find(candidato => {
            const extras = extrasPorRuta.get(String(candidato.route.id)) || [];
            const nuevasParadas = deps.crearParadasPedidoRuta(item, candidato.route.id, 0, fecha);
            return deps.puedeRutaRecibirParadas(candidato.route, [...extras, ...nuevasParadas]);
        })?.route || null;
    }

    function seleccionarRutaVaciaCompatibleParaPedido(item, routes, extrasPorRuta, fecha, deps) {
        const horaObjetivo = deps.getHoraObjetivoRutaPedido(item);
        const candidatos = (routes || []).map(route => {
            if (deps.getParadasPlanificadasRuta(route, extrasPorRuta).length) return null;

            const nuevasParadas = deps.crearParadasPedidoRuta(item, route.id, 0, fecha);
            if (!nuevasParadas.length || !deps.puedeRutaRecibirParadas(route, nuevasParadas)) return null;

            const driver = deps.normalizarDriverRuta(deps.getDriverRuta(route));
            const inicio = deps.parseHoraRutaEnMinutos(driver.work_start || route.starts_at || '08:00') ?? 480;
            return {
                route,
                score: Math.abs(inicio - horaObjetivo)
            };
        }).filter(Boolean).sort((a, b) => a.score - b.score);

        return candidatos[0]?.route || null;
    }

    function existeConductorDisponibleCompatibleRuta(item, conductoresDisponibles, fecha, deps) {
        if (!conductoresDisponibles.length) return false;
        const paradasPrueba = deps.crearParadasPedidoRuta(item, '__nueva_ruta__', 0, fecha);
        if (!paradasPrueba.length) return false;

        return conductoresDisponibles.some(driver => {
            const rutaPrueba = {
                id: '__nueva_ruta__',
                starts_at: driver.work_start || '08:00',
                driver,
                stops: []
            };
            return deps.puedeRutaRecibirParadas(rutaPrueba, paradasPrueba);
        });
    }

    function debeAbrirRutaNuevaParaPedido(item, route, routes, extrasPorRuta, vehiculosDisponibles, conductoresDisponibles, totalPedidos, fecha, deps) {
        if (!route || !vehiculosDisponibles.length || !conductoresDisponibles.length) return false;
        if (!deps.getParadasPlanificadasRuta(route, extrasPorRuta).length) return false;

        const maxRutasUtiles = Math.min(
            deps.getVehiclesCount(),
            deps.getConductoresOperativosRutas(fecha).length,
            totalPedidos
        );
        const rutasConParadas = deps.contarRutasConParadas(routes, extrasPorRuta);
        if (rutasConParadas >= maxRutasUtiles) return false;

        return existeConductorDisponibleCompatibleRuta(item, conductoresDisponibles, fecha, deps);
    }

    window.CaterCloudRoutes = Object.assign(window.CaterCloudRoutes || {}, {
        seleccionarMejorRutaParaPedido,
        seleccionarRutaVaciaCompatibleParaPedido,
        debeAbrirRutaNuevaParaPedido
    });
})();
