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
        const rows = filtrarFilas(construirFilasReporting(), getFiltrosUi());
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
        exportarDetalleCsv,
        exportarResumenCsv
    };
    window.mostrarReportes = mostrarReportes;
    window.renderReportes = renderReportes;
    window.exportarReportingDetalleCsv = exportarDetalleCsv;
    window.exportarReportingResumenCsv = exportarResumenCsv;
})();
