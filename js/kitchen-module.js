// ========== KITCHEN MODULE: helpers de produccion ==========

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

