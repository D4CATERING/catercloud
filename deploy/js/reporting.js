// ========== REPORTING: consumos normalizados para analisis ==========

(function initCaterCloudReporting() {
    const AREA_LABELS = {
        cocina: 'Cocina',
        logistica: 'Logistica'
    };

    function normalizarTexto(valor) {
        return String(valor || '').trim();
    }

    function normalizarClaveReporte(valor) {
        return normalizarTexto(valor)
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .toLowerCase()
            .replace(/[^\p{L}\p{N}]+/gu, ' ')
            .replace(/\s+/g, ' ')
            .trim();
    }

    function normalizarNombreItemReporte(valor) {
        const limpio = normalizarTexto(valor).replace(/\s+/g, ' ');
        const clave = normalizarClaveReporte(limpio);
        if (!limpio) {
            return {
                nombre: 'Sin nombre',
                clave: 'sin nombre'
            };
        }

        const reemplazos = new Map([
            ['pollo kentucky', 'Pollo kentucky'],
            ['pollo kentucky con salsa bbq', 'Pollo kentucky con salsa BBQ']
        ]);

        return {
            nombre: reemplazos.get(clave) || limpio,
            clave
        };
    }

    function numero(valor) {
        const n = Number(String(valor ?? '').replace(',', '.'));
        return Number.isFinite(n) ? n : 0;
    }

    function getCodigoPedido(item = {}) {
        return item.codigo || item.codigo_comanda || item.codigo_cocina || item.codigo_original || item.id || '';
    }

    function getPaxPedido(item = {}) {
        return Number(item.pax_total || item.pax || 0) || 0;
    }

    function getMenusPedido(order = {}) {
        const hayAdicionales = Array.isArray(order.menus_adicionales) && order.menus_adicionales.length > 0;
        const principal = order.menu_principal
            ? {
                ...order.menu_principal,
                referencias_desayuno: order.menu_principal.referencias_desayuno || order.referencias_desayuno,
                referencias: order.menu_principal.referencias || order.referencias,
                referencias_extras: order.menu_principal.referencias_extras || order.referencias_extras || [],
                foodbox_lunch: order.menu_principal.foodbox_lunch || order.foodbox_lunch,
                bandejas: order.menu_principal.bandejas || order.bandejas,
                pax: order.menu_principal.pax || (hayAdicionales ? 0 : getPaxPedido(order))
            }
            : null;

        return [
            principal,
            ...(order.menus_adicionales || [])
        ].filter(Boolean);
    }

    function getMenuNombre(menu = {}, order = {}) {
        return menu.nombre || menu.name || order.menu_nombre || order.menu_principal?.nombre || 'Sin menu';
    }

    function getMenuCategoria(menu = {}) {
        return menu.servicio_categoria || menu.categoria || menu.tipo || menu._cat || menu.categoriaId || '';
    }

    function crearFilaBase(order, area, menu = {}, menuIndex = 0) {
        return {
            codigo: getCodigoPedido(order),
            fecha_evento: order.fecha_evento || '',
            fecha_creacion: order.fecha_creacion || order.created_at || '',
            empresa: order.empresa || order.company_name || order.empresa_nombre || '',
            responsable: order.responsable || order.responsable_nombre || '',
            pax_total: getPaxPedido(order),
            area,
            area_label: AREA_LABELS[area] || area,
            menu_index: menuIndex + 1,
            menu_id: menu.id || menu.menu_id || '',
            menu_nombre: getMenuNombre(menu, order),
            menu_categoria: getMenuCategoria(menu),
            menu_pax: Number(menu.pax || 0) || getPaxPedido(order)
        };
    }

    function crearFilaItem(order, area, menu, menuIndex, item = {}, extra = {}) {
        const cantidad = numero(item.cantidad);
        if (cantidad <= 0) return null;
        const nombreOriginal = normalizarTexto(item.nombre || item.name || item.id || 'Sin nombre');
        const nombreReporte = normalizarNombreItemReporte(nombreOriginal);
        return {
            ...crearFilaBase(order, area, menu, menuIndex),
            item_area: area,
            item_tipo: extra.item_tipo || '',
            item_grupo: item.grupo || extra.item_grupo || '',
            item_nombre: nombreReporte.nombre,
            item_nombre_original: nombreOriginal,
            item_nombre_key: nombreReporte.clave,
            item_parent: extra.item_parent || '',
            cantidad,
            unidad: item.unidad_comanda || item.unidad || extra.unidad || 'uds',
            fuente: extra.fuente || '',
            preparado: Boolean(item.preparado || extra.preparado),
            raw_key: item.key || item.id || ''
        };
    }

    function construirFilasCocina(order = {}) {
        const rows = [];
        const getDetalle = window.CaterCloudKitchenProduction?.getProduccionCocinaDetalle;
        if (typeof getDetalle !== 'function') return rows;

        getDetalle(order).forEach((grupo) => {
            const menu = grupo.menu || {};
            const menuIndex = Number(grupo.menuIndex || 0);
            (grupo.items || []).forEach(item => {
                const row = crearFilaItem(order, 'cocina', menu, menuIndex, item, {
                    item_tipo: 'produccion',
                    item_grupo: item.grupo || 'Cocina',
                    fuente: 'produccion_cocina'
                });
                if (row) rows.push(row);
            });
        });
        return rows;
    }

    function unidadVisibleLogistica(item = {}) {
        return item.unidad_comanda || item.unidad || 'uds';
    }

    function extraerMaterialLogistica(material = {}) {
        const rows = [];
        ['bebidas', 'menaje', 'extras'].forEach(tipo => {
            (material?.[tipo] || []).forEach(item => {
                if (item.checked === false) return;
                const subs = item.subitems_selected || [];
                const esMantelTablero = /mantel\s*(tablero)?/i.test(item.nombre || '');

                if (esMantelTablero && subs.length) {
                    subs.forEach(sub => {
                        const subNombre = normalizarTexto(sub.nombre);
                        rows.push({
                            ...sub,
                            nombre: /desechable/i.test(subNombre) ? 'Mantel Desechable' : `Mantel de ${subNombre}`,
                            unidad: unidadVisibleLogistica(sub),
                            grupo: tipo,
                            parent: item.nombre || ''
                        });
                    });
                    return;
                }

                rows.push({
                    ...item,
                    unidad: unidadVisibleLogistica(item),
                    grupo: tipo
                });

                subs.forEach(sub => {
                    rows.push({
                        ...sub,
                        unidad: unidadVisibleLogistica(sub),
                        grupo: tipo,
                        parent: item.nombre || ''
                    });
                });
            });
        });
        return rows;
    }

    function getMaterialPedido(item = {}) {
        return item.material_logistica
            || item.logistica?.material_logistica
            || item.logistica_inline?.material_logistica
            || {};
    }

    function construirFilasLogisticaParaPedido(order = {}) {
        const rows = [];
        const menus = getMenusPedido(order);
        const menu = menus[0] || order.menu_principal || {};
        extraerMaterialLogistica(getMaterialPedido(order)).forEach(item => {
            const row = crearFilaItem(order, 'logistica', menu, 0, item, {
                item_tipo: item.grupo || 'material',
                item_grupo: item.grupo || 'material',
                item_parent: item.parent || '',
                fuente: 'material_logistica'
            });
            if (row) rows.push(row);
        });
        return rows;
    }

    function getPedidosReporting() {
        const storage = window.CaterCloudStorage || {};
        const comandas = typeof storage.leerHistorialComandasLocal === 'function'
            ? storage.leerHistorialComandasLocal()
            : [];
        const logisticas = typeof storage.leerHistorialLogisticaLocal === 'function'
            ? storage.leerHistorialLogisticaLocal()
            : [];

        return {
            comandas: comandas.filter(item => !['anulada', 'eliminada'].includes(item.estado || item.estado_pedido)),
            logisticas: logisticas.filter(item => !['anulada', 'eliminada'].includes(item.estado || item.estado_pedido))
        };
    }

    function construirFilasReporting() {
        const { comandas, logisticas } = getPedidosReporting();
        const rows = [];

        comandas.forEach(order => {
            rows.push(...construirFilasCocina(order));
        });

        const codigosLogisticaExplicita = new Set(logisticas.map(getCodigoPedido).filter(Boolean).map(String));
        logisticas.forEach(order => rows.push(...construirFilasLogisticaParaPedido(order)));
        comandas
            .filter(order => !codigosLogisticaExplicita.has(String(getCodigoPedido(order))))
            .forEach(order => rows.push(...construirFilasLogisticaParaPedido(order)));

        return rows;
    }

    function filtrarFilas(rows, filtros = {}) {
        const area = filtros.area || 'todas';
        const desde = filtros.desde || '';
        const hasta = filtros.hasta || '';
        const texto = normalizarTexto(filtros.texto).toLowerCase();

        return (rows || []).filter(row => {
            if (area !== 'todas' && row.area !== area) return false;
            if (desde && row.fecha_evento && row.fecha_evento < desde) return false;
            if (hasta && row.fecha_evento && row.fecha_evento > hasta) return false;
            if (texto) {
                const hayTexto = [
                    row.codigo, row.empresa, row.menu_nombre, row.item_grupo,
                    row.item_nombre, row.item_nombre_original, row.unidad
                ].join(' ').toLowerCase().includes(texto);
                if (!hayTexto) return false;
            }
            return true;
        });
    }

    function resumirPorItem(rows) {
        const mapa = new Map();
        (rows || []).forEach(row => {
            const key = [
                row.area,
                row.menu_nombre,
                row.item_grupo,
                row.item_nombre_key || normalizarClaveReporte(row.item_nombre),
                row.unidad
            ].join('|');
            const actual = mapa.get(key) || {
                area: row.area,
                area_label: row.area_label,
                menu_nombre: row.menu_nombre,
                item_grupo: row.item_grupo,
                item_nombre: row.item_nombre,
                item_nombre_key: row.item_nombre_key || normalizarClaveReporte(row.item_nombre),
                unidad: row.unidad,
                cantidad_total: 0,
                pedidos: new Set(),
                pax_total: 0
            };
            actual.cantidad_total += numero(row.cantidad);
            if (row.codigo) actual.pedidos.add(row.codigo);
            actual.pax_total += numero(row.menu_pax || row.pax_total);
            mapa.set(key, actual);
        });

        return Array.from(mapa.values())
            .map(row => ({
                ...row,
                pedidos: row.pedidos.size,
                cantidad_total: Math.round(row.cantidad_total * 100) / 100,
                pax_total: Math.round(row.pax_total * 100) / 100
            }))
            .sort((a, b) => b.cantidad_total - a.cantidad_total);
    }

    function agruparCantidad(rows, getKey, getLabel, limite = 8) {
        const mapa = new Map();
        (rows || []).forEach(row => {
            const key = getKey(row);
            if (!key) return;
            const actual = mapa.get(key) || {
                key,
                label: getLabel(row),
                cantidad: 0,
                pedidos: new Set(),
                unidades: new Map()
            };
            actual.cantidad += numero(row.cantidad);
            if (row.codigo) actual.pedidos.add(row.codigo);
            const unidad = normalizarTexto(row.unidad || '');
            if (unidad) actual.unidades.set(unidad, (actual.unidades.get(unidad) || 0) + numero(row.cantidad));
            mapa.set(key, actual);
        });

        return Array.from(mapa.values())
            .map(item => ({
                ...item,
                cantidad: Math.round(item.cantidad * 100) / 100,
                pedidos: item.pedidos.size,
                unidad: getUnidadDominante(item.unidades)
            }))
            .filter(item => item.cantidad > 0)
            .sort((a, b) => b.cantidad - a.cantidad)
            .slice(0, limite);
    }

    function agruparPedidos(rows, getKey, getLabel, limite = 8, ordenarPorFecha = false) {
        const mapa = new Map();
        (rows || []).forEach(row => {
            const key = getKey(row);
            if (!key) return;
            const actual = mapa.get(key) || {
                key,
                label: getLabel(row),
                cantidad: 0,
                pedidos: new Set()
            };
            if (row.codigo) actual.pedidos.add(row.codigo);
            mapa.set(key, actual);
        });

        const items = Array.from(mapa.values())
            .map(item => ({
                ...item,
                cantidad: item.pedidos.size,
                pedidos: item.pedidos.size,
                unidad: 'comandas'
            }))
            .filter(item => item.cantidad > 0);

        return (ordenarPorFecha
            ? items.sort((a, b) => String(a.key).localeCompare(String(b.key))).slice(-limite)
            : items.sort((a, b) => b.cantidad - a.cantidad).slice(0, limite)
        );
    }

    function parseFechaReporteDate(fecha) {
        if (!fecha) return null;
        const [year, month, day] = String(fecha).split('T')[0].split('-').map(Number);
        if (!year || !month || !day) return null;
        const parsed = new Date(year, month - 1, day);
        return Number.isNaN(parsed.getTime()) ? null : parsed;
    }

    function getSemanaIsoReporte(fecha) {
        const date = parseFechaReporteDate(fecha);
        if (!date) return null;
        const utc = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
        const day = utc.getUTCDay() || 7;
        utc.setUTCDate(utc.getUTCDate() + 4 - day);
        const yearStart = new Date(Date.UTC(utc.getUTCFullYear(), 0, 1));
        const week = Math.ceil((((utc - yearStart) / 86400000) + 1) / 7);
        return {
            key: `${utc.getUTCFullYear()}-W${String(week).padStart(2, '0')}`,
            label: `Sem ${String(week).padStart(2, '0')}`,
            context: String(utc.getUTCFullYear())
        };
    }

    function getMesReporte(fecha) {
        const date = parseFechaReporteDate(fecha);
        if (!date) return null;
        const mes = String(date.getMonth() + 1).padStart(2, '0');
        return {
            key: `${date.getFullYear()}-${mes}`,
            label: `${mes}/${date.getFullYear()}`
        };
    }

    function agruparPedidosPorPeriodo(rows, getPeriodo, limite = 8) {
        const mapa = new Map();
        (rows || []).forEach(row => {
            const periodo = getPeriodo(row.fecha_evento);
            if (!periodo) return;
            const actual = mapa.get(periodo.key) || {
                key: periodo.key,
                label: periodo.label,
                context: periodo.context || '',
                cantidad: 0,
                pedidos: new Set(),
                unidad: 'comandas'
            };
            if (row.codigo) actual.pedidos.add(row.codigo);
            mapa.set(periodo.key, actual);
        });

        return Array.from(mapa.values())
            .map(item => ({
                ...item,
                cantidad: item.pedidos.size,
                pedidos: item.pedidos.size
            }))
            .filter(item => item.cantidad > 0)
            .sort((a, b) => String(a.key).localeCompare(String(b.key)))
            .slice(-limite);
    }

    function getPedidosParaEstados(filtros = {}) {
        const storage = window.CaterCloudStorage || {};
        const comandas = typeof storage.leerHistorialComandasLocal === 'function'
            ? storage.leerHistorialComandasLocal()
            : [];
        const logisticas = typeof storage.leerHistorialLogisticaLocal === 'function'
            ? storage.leerHistorialLogisticaLocal()
            : [];
        const mapa = new Map();

        [...comandas, ...logisticas].forEach(order => {
            const codigo = getCodigoPedido(order);
            if (!codigo) return;
            if (filtros.desde && order.fecha_evento && order.fecha_evento < filtros.desde) return;
            if (filtros.hasta && order.fecha_evento && order.fecha_evento > filtros.hasta) return;
            if (filtros.texto) {
                const texto = normalizarTexto(filtros.texto).toLowerCase();
                const hayTexto = [
                    codigo,
                    order.empresa,
                    order.menu_nombre,
                    order.menu_principal?.nombre,
                    order.responsable
                ].join(' ').toLowerCase().includes(texto);
                if (!hayTexto) return;
            }
            mapa.set(String(codigo), order);
        });

        return Array.from(mapa.values());
    }

    function resumirEstadosPedidos(filtros = {}) {
        const mapa = new Map();
        getPedidosParaEstados(filtros).forEach(order => {
            const estado = getEstadoVisibleReporte(order);
            const actual = mapa.get(estado) || {
                key: estado,
                label: getEstadoPedidoLabelReporte(estado),
                cantidad: 0,
                pedidos: 0
            };
            actual.cantidad += 1;
            actual.pedidos += 1;
            mapa.set(estado, actual);
        });

        return Array.from(mapa.values()).sort((a, b) => b.cantidad - a.cantidad);
    }

    function getEstadoVisibleReporte(order = {}) {
        return order.estado_confirmacion
            || order.confirmation_status
            || order.estado
            || order.estado_pedido
            || 'creada';
    }

    function getEstadoPedidoLabelReporte(estado) {
        const labels = {
            creada: 'Creada',
            proceso: 'En proceso',
            completada: 'Completada',
            negociacion: 'En negociacion',
            por_confirmar: 'Por confirmar',
            confirmado: 'Confirmado',
            anulada: 'Anulada',
            eliminada: 'Eliminada'
        };
        return labels[estado] || estado || 'Sin estado';
    }

    function unidadGrafico(item) {
        return item.unidad ? ` ${item.unidad}` : '';
    }

    function getUnidadDominante(unidades) {
        const entradas = Array.from(unidades || []);
        if (!entradas.length) return '';
        if (entradas.length === 1) return entradas[0][0];
        const ordenadas = entradas.sort((a, b) => b[1] - a[1]);
        return `${ordenadas[0][0]} + otras`;
    }

    function formatCantidadGrafico(value) {
        const n = numero(value);
        return Number.isInteger(n) ? String(n) : String(Math.round(n * 100) / 100).replace('.', ',');
    }

    function getChartValueText(item, options = {}) {
        const unidad = options.unidad ? options.unidad(item) : unidadGrafico(item);
        const unidadTexto = String(unidad || '').trim();
        return `${formatCantidadGrafico(item.cantidad)}${unidadTexto ? ` ${unidadTexto}` : ''}`;
    }

    function getSvgChartColor(index) {
        const colores = ['#4e79a7', '#f28e2b', '#59a14f', '#e15759', '#76b7b2', '#edc948', '#b07aa1', '#9c755f'];
        return colores[index % colores.length];
    }

    function jsArgReporting(value) {
        return `'${encodeURIComponent(String(value ?? ''))}'`;
    }

    function renderHorizontalBarChart(id, items, options = {}) {
        const el = document.getElementById(id);
        if (!el) return;
        const max = Math.max(...(items || []).map(item => numero(item.cantidad)), 0);
        if (!items?.length || max <= 0) {
            el.innerHTML = '<div class="report-chart-empty">Sin datos para los filtros seleccionados.</div>';
            return;
        }

        const width = 640;
        const rowHeight = 34;
        const top = 20;
        const bottom = 24;
        const left = 180;
        const right = 90;
        const height = top + bottom + items.length * rowHeight;
        const chartWidth = width - left - right;
        const rowsHtml = items.map((item, index) => {
            const y = top + index * rowHeight;
            const value = numero(item.cantidad);
            const barWidth = Math.max(3, (value / max) * chartWidth);
            const label = escapeHtmlReporting(item.label);
            const shortLabel = label.length > 28 ? `${label.slice(0, 27)}…` : label;
            const valueText = escapeHtmlReporting(getChartValueText(item, options));
            const clickAttr = options.clickable === false
                ? ''
                : ` tabindex="0" role="button" onclick="filtrarReporteDesdeGrafico(${jsArgReporting(item.label)})" onkeydown="if(event.key==='Enter'||event.key===' '){event.preventDefault();filtrarReporteDesdeGrafico(${jsArgReporting(item.label)});}"`
            return `
                <g class="report-svg-hbar-group"${clickAttr}>
                    <title>${label}: ${valueText}</title>
                    <text class="report-svg-hbar-label" x="${left - 10}" y="${y + 19}" text-anchor="end">${shortLabel}</text>
                    <rect class="report-svg-hbar-bg" x="${left}" y="${y + 5}" width="${chartWidth}" height="18" rx="5"></rect>
                    <rect class="report-svg-hbar" x="${left}" y="${y + 5}" width="${barWidth}" height="18" rx="5" fill="${getSvgChartColor(index)}"></rect>
                    <text class="report-svg-hbar-value" x="${left + barWidth + 8}" y="${y + 19}">${valueText}</text>
                </g>
            `;
        }).join('');

        el.innerHTML = `
            <div class="report-svg-wrap report-svg-wrap--scroll">
                <svg class="report-svg-chart report-svg-chart--horizontal" viewBox="0 0 ${width} ${height}" role="img" aria-label="${escapeHtmlReporting(options.aria || 'Grafico de barras horizontales')}">
                    <line class="report-svg-axis-line" x1="${left}" y1="${top - 6}" x2="${left}" y2="${height - bottom + 4}"></line>
                    ${rowsHtml}
                </svg>
            </div>
        `;
    }

    function renderColumnChart(id, items, options = {}) {
        const el = document.getElementById(id);
        if (!el) return;
        const max = Math.max(...(items || []).map(item => numero(item.cantidad)), 0);
        if (!items?.length || max <= 0) {
            el.innerHTML = '<div class="report-chart-empty">Sin datos para los filtros seleccionados.</div>';
            return;
        }

        const width = 640;
        const height = 260;
        const left = 44;
        const right = 18;
        const top = 24;
        const bottom = 58;
        const chartWidth = width - left - right;
        const chartHeight = height - top - bottom;
        const barGap = 12;
        const barWidth = Math.max(18, (chartWidth - (items.length - 1) * barGap) / items.length);
        const ticks = [0, 0.5, 1].map(ratio => ({
            y: top + chartHeight - chartHeight * ratio,
            value: max * ratio
        }));

        const bars = items.map((item, index) => {
            const value = numero(item.cantidad);
            const barHeight = Math.max(2, (value / max) * chartHeight);
            const x = left + index * (barWidth + barGap);
            const y = top + chartHeight - barHeight;
            const label = escapeHtmlReporting(item.label);
            const shortLabel = label.length > 15 ? `${label.slice(0, 14)}…` : label;
            const valueText = escapeHtmlReporting(getChartValueText(item, options));
            return `
                <g class="report-svg-bar-group">
                    <title>${label}: ${valueText}</title>
                    <rect class="report-svg-bar" x="${x}" y="${y}" width="${barWidth}" height="${barHeight}" rx="5" fill="${getSvgChartColor(index)}"></rect>
                    <text class="report-svg-value" x="${x + barWidth / 2}" y="${Math.max(12, y - 7)}" text-anchor="middle">${valueText}</text>
                    <text class="report-svg-label" x="${x + barWidth / 2}" y="${height - 28}" text-anchor="middle">${shortLabel}</text>
                </g>
            `;
        }).join('');

        const grid = ticks.map(tick => `
            <line class="report-svg-grid" x1="${left}" y1="${tick.y}" x2="${width - right}" y2="${tick.y}"></line>
            <text class="report-svg-axis" x="${left - 8}" y="${tick.y + 4}" text-anchor="end">${formatCantidadGrafico(tick.value)}</text>
        `).join('');

        const contextos = Array.from(new Set((items || []).map(item => item.context).filter(Boolean)));
        const contextHtml = options.contextLabel || contextos.length
            ? `<div class="report-chart-context">${escapeHtmlReporting(options.contextLabel || (contextos.length === 1 ? `Año ${contextos[0]}` : `Años ${contextos.join(', ')}`))}</div>`
            : '';
        const legend = items.slice(0, 4).map((item, index) => `
            <span><i style="background:${getSvgChartColor(index)}"></i>${escapeHtmlReporting(item.label)}</span>
        `).join('');

        el.innerHTML = `
            <div class="report-svg-wrap">
                ${contextHtml}
                <svg class="report-svg-chart" viewBox="0 0 ${width} ${height}" role="img" aria-label="${escapeHtmlReporting(options.aria || 'Grafico de barras')}">
                    ${grid}
                    <line class="report-svg-axis-line" x1="${left}" y1="${top + chartHeight}" x2="${width - right}" y2="${top + chartHeight}"></line>
                    ${bars}
                </svg>
                <div class="report-chart-legend">${legend}</div>
            </div>
        `;
    }

    function renderLineChart(id, items, options = {}) {
        const el = document.getElementById(id);
        if (!el) return;
        const max = Math.max(...(items || []).map(item => numero(item.cantidad)), 0);
        if (!items?.length || max <= 0) {
            el.innerHTML = '<div class="report-chart-empty">Sin datos para los filtros seleccionados.</div>';
            return;
        }

        const width = 640;
        const height = 260;
        const left = 44;
        const right = 24;
        const top = 24;
        const bottom = 52;
        const chartWidth = width - left - right;
        const chartHeight = height - top - bottom;
        const step = items.length > 1 ? chartWidth / (items.length - 1) : chartWidth;
        const points = items.map((item, index) => {
            const x = items.length > 1 ? left + index * step : left + chartWidth / 2;
            const y = top + chartHeight - (numero(item.cantidad) / max) * chartHeight;
            return { item, x, y };
        });
        const path = points.map((point, index) => `${index ? 'L' : 'M'} ${point.x} ${point.y}`).join(' ');
        const areaPath = `${path} L ${points[points.length - 1].x} ${top + chartHeight} L ${points[0].x} ${top + chartHeight} Z`;
        const ticks = [0, 0.5, 1].map(ratio => ({
            y: top + chartHeight - chartHeight * ratio,
            value: max * ratio
        }));
        const grid = ticks.map(tick => `
            <line class="report-svg-grid" x1="${left}" y1="${tick.y}" x2="${width - right}" y2="${tick.y}"></line>
            <text class="report-svg-axis" x="${left - 8}" y="${tick.y + 4}" text-anchor="end">${formatCantidadGrafico(tick.value)}</text>
        `).join('');
        const markers = points.map((point, index) => {
            const label = escapeHtmlReporting(point.item.label);
            const valueText = escapeHtmlReporting(getChartValueText(point.item, options));
            const shortLabel = label.length > 12 ? `${label.slice(0, 11)}…` : label;
            const showLabel = points.length <= 8 || index % Math.ceil(points.length / 6) === 0;
            return `
                <g>
                    <title>${label}: ${valueText}</title>
                    <circle class="report-svg-dot" cx="${point.x}" cy="${point.y}" r="5"></circle>
                    <text class="report-svg-value" x="${point.x}" y="${Math.max(12, point.y - 10)}" text-anchor="middle">${valueText}</text>
                    ${showLabel ? `<text class="report-svg-label" x="${point.x}" y="${height - 26}" text-anchor="middle">${shortLabel}</text>` : ''}
                </g>
            `;
        }).join('');

        el.innerHTML = `
            <div class="report-svg-wrap">
                <svg class="report-svg-chart" viewBox="0 0 ${width} ${height}" role="img" aria-label="${escapeHtmlReporting(options.aria || 'Grafico de linea')}">
                    ${grid}
                    <path class="report-svg-area" d="${areaPath}"></path>
                    <path class="report-svg-line" d="${path}"></path>
                    ${markers}
                    <line class="report-svg-axis-line" x1="${left}" y1="${top + chartHeight}" x2="${width - right}" y2="${top + chartHeight}"></line>
                </svg>
            </div>
        `;
    }

    function renderGraficosReportes(rows, resumen, filtros) {
        renderHorizontalBarChart('reportChartProduccion', agruparCantidad(
            rows.filter(row => row.area === 'cocina'),
            row => `${row.item_nombre_key || row.item_nombre}|${row.unidad}`,
            row => row.item_nombre,
            80
        ), { aria: 'Produccion por item' });

        renderHorizontalBarChart('reportChartLogistica', agruparCantidad(
            rows.filter(row => row.area === 'logistica'),
            row => `${row.item_grupo}|${row.item_nombre_key || row.item_nombre}|${row.unidad}`,
            row => `${row.item_grupo || 'Logistica'} · ${row.item_nombre}`,
            120
        ), { aria: 'Consumo de logistica' });

        renderHorizontalBarChart('reportChartMenus', agruparPedidos(
            rows,
            row => row.menu_nombre,
            row => row.menu_nombre,
            80
        ), {
            showPedidos: false,
            unidad: () => 'comandas'
        });

        renderLineChart('reportChartFechas', agruparPedidos(
            rows,
            row => row.fecha_evento || 'Sin fecha',
            row => row.fecha_evento ? formatFechaReporte(row.fecha_evento) : 'Sin fecha',
            10,
            true
        ), {
            showPedidos: false,
            unidad: () => 'comandas'
        });

        renderColumnChart('reportChartEstados', agruparPedidosPorPeriodo(rows, getSemanaIsoReporte, 8), {
            showPedidos: false,
            unidad: () => 'comandas',
            aria: 'Comandas por semana'
        });

        renderColumnChart('reportChartTopItems', agruparPedidosPorPeriodo(rows, getMesReporte, 8), {
            showPedidos: false,
            unidad: () => 'comandas',
            aria: 'Comandas por mes'
        });
    }

    function csvEscape(value) {
        const text = String(value ?? '');
        return /[",\n;]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
    }

    function rowsToCsv(rows, headers) {
        return [
            headers.join(';'),
            ...(rows || []).map(row => headers.map(key => csvEscape(row[key])).join(';'))
        ].join('\n');
    }

    function descargarCsv(nombre, rows, headers) {
        const csv = rowsToCsv(rows, headers);
        const blob = new Blob([`\uFEFF${csv}`], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = nombre;
        document.body.appendChild(a);
        a.click();
        a.remove();
        URL.revokeObjectURL(url);
    }

    function formatFechaReporte(fecha) {
        if (!fecha) return '';
        const [year, month, day] = String(fecha).split('-');
        return year && month && day ? `${day}/${month}/${year}` : fecha;
    }

    function getFiltrosUi() {
        return {
            area: document.getElementById('reportArea')?.value || 'todas',
            desde: document.getElementById('reportDesde')?.value || '',
            hasta: document.getElementById('reportHasta')?.value || '',
            texto: document.getElementById('reportBuscar')?.value || ''
        };
    }

    function renderReportes() {
        const filtros = getFiltrosUi();
        const rows = filtrarFilas(construirFilasReporting(), filtros);
        const resumen = resumirPorItem(rows);
        window._reportingRowsActuales = rows;
        window._reportingResumenActual = resumen;

        const totalCantidad = rows.reduce((acc, row) => acc + numero(row.cantidad), 0);
        const pedidos = new Set(rows.map(row => row.codigo).filter(Boolean)).size;
        const items = new Set(rows.map(row => `${row.area}|${row.item_nombre_key || row.item_nombre}|${row.unidad}`).filter(Boolean)).size;

        const set = (id, value) => {
            const el = document.getElementById(id);
            if (el) el.textContent = value;
        };
        set('reportKpiPedidos', pedidos);
        set('reportKpiItems', items);
        set('reportKpiCantidad', Math.round(totalCantidad * 100) / 100);
        renderGraficosReportes(rows, resumen, filtros);

        const body = document.getElementById('reportResumenBody');
        if (!body) return;
        body.innerHTML = resumen.slice(0, 120).map(row => `
            <tr class="reporting-table-row--clickable"
                data-report-area="${escapeHtmlReporting(row.area)}"
                data-report-menu="${escapeHtmlReporting(row.menu_nombre)}"
                data-report-grupo="${escapeHtmlReporting(row.item_grupo)}"
                data-report-item="${escapeHtmlReporting(row.item_nombre_key)}"
                data-report-unidad="${escapeHtmlReporting(row.unidad)}">
                <td>${escapeHtmlReporting(row.area_label)}</td>
                <td>${escapeHtmlReporting(row.menu_nombre)}</td>
                <td>${escapeHtmlReporting(row.item_grupo)}</td>
                <td>${escapeHtmlReporting(row.item_nombre)}</td>
                <td class="report-num">${escapeHtmlReporting(row.cantidad_total)}</td>
                <td>${escapeHtmlReporting(row.unidad)}</td>
                <td class="report-num">${escapeHtmlReporting(row.pedidos)}</td>
            </tr>
        `).join('') || '<tr><td colspan="7" class="report-empty">Sin datos para los filtros seleccionados.</td></tr>';

        body.querySelectorAll('.reporting-table-row--clickable').forEach(tr => {
            tr.addEventListener('click', () => {
                const filtro = tr.dataset;
                const detalle = rows.filter(row =>
                    row.area === filtro.reportArea
                    && row.menu_nombre === filtro.reportMenu
                    && row.item_grupo === filtro.reportGrupo
                    && (row.item_nombre_key || normalizarClaveReporte(row.item_nombre)) === filtro.reportItem
                    && row.unidad === filtro.reportUnidad
                );
                renderDetalleReporte(detalle, `Detalle filtrado: ${tr.cells[3]?.textContent || ''}`);
            });
        });

        renderDetalleReporte(rows, 'Origen exacto de cada cantidad');
    }

    function filtrarReporteDesdeGrafico(value) {
        const texto = decodeURIComponent(String(value || '')).replace(/^Cocina · |^Logistica · /, '').trim();
        const input = document.getElementById('reportBuscar');
        if (!input || !texto) return;
        input.value = texto;
        renderReportes();
    }

    function renderDetalleReporte(rows, hint = 'Origen exacto de cada cantidad') {
        const body = document.getElementById('reportDetalleBody');
        const hintEl = document.getElementById('reportDetalleHint');
        if (hintEl) {
            const total = (rows || []).length;
            hintEl.textContent = total > 120
                ? `${hint} · mostrando 120 de ${total} líneas`
                : `${hint} · ${total} líneas`;
        }
        if (!body) return;

        body.innerHTML = (rows || []).slice(0, 120).map(row => `
            <tr>
                <td><strong>${escapeHtmlReporting(row.codigo)}</strong></td>
                <td>${escapeHtmlReporting(formatFechaReporte(row.fecha_evento))}</td>
                <td>${escapeHtmlReporting(row.empresa)}</td>
                <td>${escapeHtmlReporting(row.menu_nombre)}</td>
                <td>${escapeHtmlReporting(row.item_grupo)}</td>
                <td>
                    ${escapeHtmlReporting(row.item_nombre_original || row.item_nombre)}
                    ${row.item_nombre_original && row.item_nombre_original !== row.item_nombre
                        ? `<small class="reporting-detail-muted">Agrupado como: ${escapeHtmlReporting(row.item_nombre)}</small>`
                        : ''}
                </td>
                <td class="report-num">${escapeHtmlReporting(row.cantidad)}</td>
                <td>${escapeHtmlReporting(row.unidad)}</td>
            </tr>
        `).join('') || '<tr><td colspan="8" class="report-empty">Sin detalle para los filtros seleccionados.</td></tr>';
    }

    function escapeHtmlReporting(value) {
        return String(value ?? '').replace(/[&<>"']/g, char => ({
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            '"': '&quot;',
            "'": '&#39;'
        }[char]));
    }

    async function mostrarReportes() {
        if (typeof window.liberarCodigoComandaPendienteSinEsperar === 'function') {
            window.liberarCodigoComandaPendienteSinEsperar('mostrar_reportes');
        }
        if (typeof window.cargarHistorialRemotoSupabase === 'function') {
            await window.cargarHistorialRemotoSupabase({ render: false });
        }

        [
            'dashboard', 'comandaForm', 'historialPage', 'detalleComanda',
            'logisticaForm', 'logisticaPage', 'cocinaPage', 'clientesPanel'
        ].forEach(id => {
            const el = document.getElementById(id);
            if (el) el.style.display = 'none';
        });
        const expediente = document.getElementById('expedientePedido');
        if (expediente) {
            expediente.hidden = true;
            expediente.style.display = 'none';
        }
        const page = document.getElementById('reportingPage');
        if (page) page.style.display = 'block';
        if (typeof setNavActive === 'function') setNavActive('nav-reportes');
        renderReportes();
    }

    function exportarDetalleCsv() {
        descargarCsv('catercloud-reporting-detalle.csv', window._reportingRowsActuales || [], [
            'codigo', 'fecha_evento', 'empresa', 'area', 'menu_nombre', 'menu_categoria',
            'menu_pax', 'item_grupo', 'item_nombre_original', 'item_nombre', 'item_parent', 'cantidad', 'unidad', 'fuente'
        ]);
    }

    function exportarResumenCsv() {
        descargarCsv('catercloud-reporting-resumen.csv', window._reportingResumenActual || [], [
            'area', 'menu_nombre', 'item_grupo', 'item_nombre', 'cantidad_total', 'unidad', 'pedidos', 'pax_total'
        ]);
    }

    window.CaterCloudReporting = {
        construirFilasReporting,
        filtrarFilas,
        resumirPorItem,
        renderReportes,
        filtrarReporteDesdeGrafico,
        exportarDetalleCsv,
        exportarResumenCsv
    };
    window.mostrarReportes = mostrarReportes;
    window.renderReportes = renderReportes;
    window.filtrarReporteDesdeGrafico = filtrarReporteDesdeGrafico;
    window.exportarReportingDetalleCsv = exportarDetalleCsv;
    window.exportarReportingResumenCsv = exportarResumenCsv;
})();
