// ============================================================
// MATERIAL DE LOGÍSTICA - Versión con Subitems
// Soporta items con opciones desplegables (ej: Refrescos)
// ============================================================

(function() {
    'use strict';

    // ──────────────────────────────────────────────────────────
    // ESTADO GLOBAL
    // ──────────────────────────────────────────────────────────
    window.materialLogistica = {
        bebidas: [],
        menaje: [],
        extras: [],
        catalogoCompleto: null,
        isAdmin: false
    };

    // ──────────────────────────────────────────────────────────
    // CARGA INICIAL
    // ──────────────────────────────────────────────────────────
    async function verificarSiEsAdmin() {
        if (!window.supabaseClient || !window.currentUser?.id) {
            window.materialLogistica.isAdmin = false;
            return false;
        }

        try {
            const { data, error } = await window.supabaseClient
                .rpc('is_admin', { user_uuid: window.currentUser.id });
            
            if (error) throw error;
            window.materialLogistica.isAdmin = !!data;
            return !!data;
        } catch (err) {
            console.warn('Error verificando rol admin:', err);
            window.materialLogistica.isAdmin = false;
            return false;
        }
    }

    // ──────────────────────────────────────────────────────────
    // CARGAR CATÁLOGO CON JERARQUÍA
    // ──────────────────────────────────────────────────────────
    async function cargarCatalogo() {
        if (!window.supabaseClient) {
            console.warn('Supabase no disponible');
            return [];
        }

        try {
            // Cargar todos los items activos (padres e hijos)
            const { data, error } = await window.supabaseClient
                .from('logistics_materials')
                .select('*')
                .eq('activo', true)
                .order('orden', { ascending: true });

            if (error) throw error;

            // Organizar en estructura jerárquica
            const itemsMap = new Map();
            const padres = [];

            data.forEach(item => {
                const unidadComanda = item.unidad_comanda || item.unidad || 'ud';
                const unidadComandaNormalizada = String(unidadComanda).trim().toLowerCase();
                const requiereUnidadInventarioBase = ['paq', 'paquete', 'pack', 'barca'].includes(unidadComandaNormalizada);

                itemsMap.set(item.id, {
                    ...item,
                    unidad: unidadComanda,
                    unidad_comanda: unidadComanda,
                    source_table: 'logistics_materials',
                    unidad_inventario: item.unidad_inventario || (requiereUnidadInventarioBase ? 'ud' : unidadComanda) || 'ud',
                    presentacion: item.presentacion || item.descripcion || '',
                    contenido_por_unidad: item.contenido_por_unidad || null,
                    cantidad_base: Number(item.cantidad_base || 0),
                    cantidad_por_pax: Number(item.cantidad_por_pax || 0),
                    redondeo_a: Number(item.redondeo_a || 1),
                    auto_calcular: !!item.auto_calcular,
                    stock_total: item.stock_total || 0,
                    conversion_a_stock: Number(item.conversion_a_stock || item.contenido_por_unidad || 1),
                    subitems: []
                });
            });

            data.forEach(item => {
                if (item.parent_id) {
                    const padre = itemsMap.get(item.parent_id);
                    if (padre) padre.subitems.push(itemsMap.get(item.id));
                } else {
                    padres.push(itemsMap.get(item.id));
                }
            });

            padres.forEach(item => {
                if (item.subitems.length > 0) item.tiene_subitems = true;
            });

            window.materialLogistica.catalogoCompleto = padres;
            return padres;
        } catch (err) {
            console.error('Error cargando catálogo:', err);
            return [];
        }
    }

    async function cargarCatalogoServiciosLogistica() {
        if (!window.supabaseClient) return null;

        const catalogoUnificado = obtenerCatalogoServiciosDesdeLogisticsMaterials();
        if (catalogoUnificado.length) return catalogoUnificado;

        try {
            const { data, error } = await window.supabaseClient
                .from('service_logistics_materials')
                .select('*')
                .eq('activo', true)
                .order('orden', { ascending: true });

            if (error) throw error;
            if (!Array.isArray(data) || !data.length) return null;

            return data.map(item => ({
                id: item.id,
                item_id: item.id,
                nombre: item.nombre,
                tipo: item.tipo === 'material' ? 'extras' : item.tipo,
                subcategoria: item.subcategoria || '',
                unidad: item.unidad_comanda || item.unidad || 'uds',
                unidad_inventario: item.unidad_inventario || item.unidad || 'uds',
                presentacion: item.presentacion || '',
                contenido_por_unidad: item.contenido_por_unidad || null,
                cantidad_por_pax: Number(item.cantidad_por_pax || 0),
                cantidad_base: Number(item.cantidad_base || 0),
                redondeo_a: Number(item.redondeo_a || 1),
                auto_calcular: !!item.auto_calcular,
                stock_total: item.stock_total || 0,
                source_table: 'service_logistics_materials',
                conversion_a_stock: Number(item.conversion_a_stock || item.contenido_por_unidad || 1),
                cantidad: 0,
                checked: false,
                tiene_subitems: false,
                subitems: [],
                subitems_selected: []
            }));
        } catch (err) {
            console.warn('Catalogo exclusivo de servicios no disponible, usando logistica general:', err);
            return null;
        }
    }

    function normalizarTipoLogisticaUnificada(tipo) {
        return tipo === 'material' ? 'extras' : tipo;
    }

    function recorrerCatalogoLogistica(items, resultado = []) {
        (items || []).forEach(item => {
            resultado.push(item);
            if (Array.isArray(item.subitems) && item.subitems.length) {
                recorrerCatalogoLogistica(item.subitems, resultado);
            }
        });
        return resultado;
    }

    function esMaterialDeServicios(item) {
        const contexto = normalizarTextoMaterial(item?.contexto_logistica || item?.contexto || '');
        return item?.aplica_servicios === true ||
            contexto === 'servicios' ||
            contexto === 'ambos' ||
            item?.auto_calcular_servicios === true ||
            Number(item?.cantidad_por_pax_servicios || 0) > 0 ||
            Number(item?.cantidad_base_servicios || 0) > 0;
    }

    function obtenerCatalogoServiciosDesdeLogisticsMaterials() {
        const catalogo = recorrerCatalogoLogistica(window.materialLogistica?.catalogoCompleto || []);
        return catalogo
            .filter(item => {
                if (!item || item.parent_id) return false;
                if (!['bebidas', 'menaje', 'extras', 'material'].includes(String(item.tipo || ''))) return false;
                return esMaterialDeServicios(item);
            })
            .map(item => {
                const unidadServicio = item.unidad_comanda_servicio || item.unidad_comanda || item.unidad || 'ud';
                const cantidadPorPax = item.cantidad_por_pax_servicios ?? item.cantidad_por_pax;
                const cantidadBase = item.cantidad_base_servicios ?? item.cantidad_base;
                const redondeo = item.redondeo_servicios ?? item.redondeo_a;
                const autoCalcular = item.auto_calcular_servicios ?? item.auto_calcular;
                const conversionServicio = item.conversion_servicios ||
                    item.conversion_a_stock ||
                    item.contenido_por_unidad ||
                    1;

                return {
                    ...item,
                    id: item.id,
                    item_id: item.id,
                    tipo: normalizarTipoLogisticaUnificada(item.tipo),
                    unidad: unidadServicio,
                    unidad_comanda: unidadServicio,
                    unidad_inventario: item.unidad_inventario || unidadServicio || 'ud',
                    presentacion: item.presentacion_servicio || item.presentacion || '',
                    contenido_por_unidad: item.contenido_por_unidad || null,
                    cantidad_por_pax: Number(cantidadPorPax || 0),
                    cantidad_base: Number(cantidadBase || 0),
                    redondeo_a: Number(redondeo || 1),
                    auto_calcular: !!autoCalcular,
                    stock_total: item.stock_total || 0,
                    source_table: 'logistics_materials',
                    conversion_a_stock: Number(conversionServicio || 1),
                    cantidad: 0,
                    checked: false,
                    tiene_subitems: false,
                    subitems: [],
                    subitems_selected: []
                };
            })
            .sort((a, b) => Number(a.orden_servicios || a.orden || 0) - Number(b.orden_servicios || b.orden || 0));
    }

    function obtenerPaxLogistica() {
        const paxLogistica = parseInt(document.getElementById('log_pax')?.textContent || 0);
        const paxFormulario = parseInt(document.getElementById('pax')?.value || 0);
        return paxLogistica || window.pax || paxFormulario || 0;
    }

    function calcularCantidadServicio(item, pax) {
        if (!item?.auto_calcular) return Number(item.cantidad || 0);

        const base = Number(item.cantidad_base || 0);
        const porPax = Number(item.cantidad_por_pax || 0);
        const redondeo = Math.max(0.01, Number(item.redondeo_a || 1));
        const calculado = base + (pax * porPax);

        if (calculado <= 0) return 0;
        const redondeado = Math.ceil(calculado / redondeo) * redondeo;
        return Math.round(redondeado * 100) / 100;
    }

    // ──────────────────────────────────────────────────────────
    // CARGAR CONFIGURACIÓN POR MENÚ
    // ──────────────────────────────────────────────────────────
    async function cargarMaterialPorMenu(menuTipo) {
        if (!window.supabaseClient) return [];

        try {
            const { data, error } = await window.supabaseClient
                .from('menu_materials')
                .select(`
                    material_id,
                    cantidad_base,
                    logistics_materials (*)
                `)
                .eq('menu_tipo', menuTipo);

            if (error) throw error;
            return data || [];
        } catch (err) {
            console.error('Error cargando material por menú:', err);
            return [];
        }
    }

    // ──────────────────────────────────────────────────────────
    // API PÚBLICA
    // ──────────────────────────────────────────────────────────

    /**
     * Inicializa la tabla de material
     */
    window.inicializarMaterialLogistica = async function(containerId) {
        const container = document.getElementById(containerId);
        if (!container) {
            console.warn(`No se encontró el contenedor ${containerId}`);
            return;
        }

        await verificarSiEsAdmin();
        await cargarCatalogo();

        container.innerHTML = `
            <div class="dc-material-section">
                <div class="dc-material-header">
                    <div class="dc-material-heading">
                        <span class="dc-material-header-icon">📦</span>
                        <div>
                            <span class="dc-material-title">Material necesario</span>
                            <span class="dc-material-subtitle">Revisa cantidades y elementos antes de guardar</span>
                        </div>
                    </div>
                    ${window.materialLogistica.isAdmin ? 
                        '<button type="button" onclick="abrirAdminMaterial()" class="btn-material-admin"><i class="ti ti-settings"></i> Gestionar</button>' 
                        : ''}
                </div>
                <div class="dc-material-grid">
                    <div class="dc-material-col dc-material-col--bebidas">
                        <div class="dc-material-col-header">
                            <span>🍷</span>
                            <div>
                                <span>Bebidas</span>
                                <small>Agua, zumos y refrescos</small>
                            </div>
                        </div>
                        <div id="${containerId}_bebidas" class="dc-material-list"></div>
                    </div>
                    <div class="dc-material-col dc-material-col--menaje">
                        <div class="dc-material-col-header">
                            <span>🍽️</span>
                            <div>
                                <span>Menaje</span>
                                <small>Piezas y servicio</small>
                            </div>
                        </div>
                        <div id="${containerId}_menaje" class="dc-material-list"></div>
                    </div>
                    <div class="dc-material-col dc-material-col--extras">
                        <div class="dc-material-col-header">
                            <span>✨</span>
                            <div>
                                <span>Extras</span>
                                <small>Apoyos y adicionales</small>
                            </div>
                        </div>
                        <div id="${containerId}_extras" class="dc-material-list"></div>
                    </div>
                </div>
            </div>
        `;

        renderizarMaterial(containerId);
    };

    /**
     * Autocompleta según categoría
     */
    // IDs de ítems incluidos en el precio según tipo de menú
    const MATERIAL_DESAYUNOS_IDS = {
        vasosZumo: '3a6e55f0-64ab-4c74-a19f-bdb4c85a31d8',
        kitCafeDesechable: '548b2e15-1315-4673-ad3d-e5cd8102e816',
        kitCafeLoza: 'c4ffea2a-e6bb-4bb4-87e8-0929f73b67fc',
        servilletas: 'a045fca2-d788-491d-a521-f731bc744e54'
    };

    const INCLUIDOS_POR_MENU = {
        desayunos: [
            '548b2e15-1315-4673-ad3d-e5cd8102e816', // Kit desechable para café
            'a045fca2-d788-491d-a521-f731bc744e54', // Servilletas
        ],
    };

    function normalizarTextoMaterial(valor) {
        return String(valor || '')
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .toLowerCase();
    }

    function esKitCafeDesechable(item) {
        const nombre = normalizarTextoMaterial(item?.nombre);
        return String(item?.id) === MATERIAL_DESAYUNOS_IDS.kitCafeDesechable ||
            (nombre.includes('kit') && nombre.includes('desechable') && nombre.includes('cafe'));
    }

    function esKitCafeLoza(item) {
        const nombre = normalizarTextoMaterial(item?.nombre);
        return String(item?.id) === MATERIAL_DESAYUNOS_IDS.kitCafeLoza ||
            (nombre.includes('kit') && (nombre.includes('loza') || nombre.includes('vajilla')) && nombre.includes('cafe'));
    }

    function esVasoDesechableZumo(item) {
        const nombre = normalizarTextoMaterial(item?.nombre);
        return String(item?.id) === MATERIAL_DESAYUNOS_IDS.vasosZumo ||
            (nombre.includes('vaso') && nombre.includes('desechable') && nombre.includes('zumo'));
    }

    function esServilleta(item) {
        const nombre = normalizarTextoMaterial(item?.nombre);
        return String(item?.id) === MATERIAL_DESAYUNOS_IDS.servilletas ||
            nombre.includes('servilleta');
    }

    function esCopasVino(item) {
        const nombre = normalizarTextoMaterial(item?.nombre);
        return nombre.includes('copa') && nombre.includes('vino');
    }

    function esMaterialIncluidoMenu(item, menuTipo, esLoza, incluidosIds) {
        if (incluidosIds.includes(item.id)) return true;
        if (menuTipo !== 'desayunos') return false;
        if (esServilleta(item)) return true;
        if (esLoza) return esKitCafeLoza(item) || esCopasVino(item);
        return esKitCafeDesechable(item) || esVasoDesechableZumo(item);
    }

    function obtenerIncluidosPorMenu(menuTipo, esLoza) {
        const incluidos = [...(INCLUIDOS_POR_MENU[menuTipo] || [])];

        if (menuTipo === 'desayunos') {
            const kitDesechableIndex = incluidos.indexOf(MATERIAL_DESAYUNOS_IDS.kitCafeDesechable);
            if (kitDesechableIndex >= 0) incluidos.splice(kitDesechableIndex, 1);
            if (!esLoza) incluidos.push(MATERIAL_DESAYUNOS_IDS.vasosZumo);
            incluidos.push(esLoza ? MATERIAL_DESAYUNOS_IDS.kitCafeLoza : MATERIAL_DESAYUNOS_IDS.kitCafeDesechable);
        }

        return incluidos;
    }

    window.autocompletarMaterialPorCategoria = async function(categoriaId, containerId) {
        const mapeo = {
            1: 'desayunos',
            2: 'foodbox',
            3: 'servicios',
            4: 'lunch',
            5: 'foodbox',
            6: 'foodbox'
        };

        const menuTipo = mapeo[categoriaId];
        if (!menuTipo) return;

        const materialMenu = await cargarMaterialPorMenu(menuTipo);
        const pax = obtenerPaxLogistica();
        const catalogoServicios = menuTipo === 'servicios'
            ? await cargarCatalogoServiciosLogistica()
            : null;

        const materialIds = new Set(materialMenu.map(m => m.material_id));
        const catalogo = catalogoServicios || window.materialLogistica.catalogoCompleto || [];
        const tipoMenaje = document.getElementById('tipo_menaje')?.value || 'desechable';
        const esLoza = tipoMenaje === 'loza';
        const incluidosIds = obtenerIncluidosPorMenu(menuTipo, esLoza);

        ['bebidas', 'menaje', 'extras'].forEach(tipo => {
            const inyectados = (window.materialLogistica[tipo] || [])
                .filter(i => i._zumoId || i._menaje_desayuno || i._extras_desayuno);

            window.materialLogistica[tipo] = [
                ...inyectados,
                ...catalogo
                    .filter(item => {
                        if (item.tipo !== tipo) return false;
                        if (item.solo_loza && !esLoza) return false;
                        if (item.solo_desechable && esLoza) return false;
                        if (menuTipo === 'desayunos' && esLoza && esKitCafeDesechable(item)) return false;
                        if (menuTipo === 'desayunos' && !esLoza && esKitCafeLoza(item)) return false;
                        if (item.parent_id) return false;
                        return true;
                    })
                    .map(item => {
                        const incluido = esMaterialIncluidoMenu(item, menuTipo, esLoza, incluidosIds);
                        const asociado = materialIds.has(item.id);
                        const cantidadServicio = catalogoServicios ? calcularCantidadServicio(item, pax) : 0;
                        const checkedServicio = catalogoServicios ? cantidadServicio > 0 : false;
                        return {
                            ...item,
                            cantidad: catalogoServicios ? cantidadServicio : (incluido ? pax : 0),
                            checked: catalogoServicios ? checkedServicio : incluido,
                            incluido_en: incluido ? [menuTipo] : (item.incluido_en || []),
                            asociado_menu: asociado,
                            subitems_expanded: false,
                            subitems_selected: []
                        };
                    })
            ];
        });

        renderizarMaterial(containerId);
    };

    window.actualizarCantidadesMaterialIncluido = function(containerId = 'materialLogisticaInline') {
        const pax = parseInt(document.getElementById('pax')?.value) || 0;
        window.pax = pax;

        (window.materialLogistica?.bebidas || []).forEach(item => {
            if (item._zumoId) {
                const ref = window.referenciasDesayuno?.[item._zumoId];
                const cantidadPorPax = Number(ref?.cantidadPorPax ?? item.cantidadPorPax ?? 0);
                const cantidad = cantidadPorPax > 0 ? Math.ceil(pax * cantidadPorPax) : (ref?.cantidad ?? item.cantidad ?? 0);
                item.cantidad = cantidad;
                if (ref) ref.cantidad = cantidad;
                return;
            }

            const esAguaWelcome = window.menuSeleccionado?.id === 17 && /agua/i.test(item.nombre || '');
            if (item.checked && esAguaWelcome) item.cantidad = pax;
        });

        (window.materialLogistica?.menaje || []).forEach(item => {
            if (item.checked && (item.incluido_en || []).length) {
                item.cantidad = pax;
            }
        });

        renderizarMaterial(containerId);
    };

    /**
     * Obtiene material seleccionado
     */
    window.obtenerMaterialSeleccionado = function() {
        const resultado = {
            bebidas: [],
            menaje: [],
            extras: []
        };

        ['bebidas', 'menaje', 'extras'].forEach(tipo => {
            window.materialLogistica[tipo].forEach(item => {
                const tieneSubitemsSeleccionados = item.tiene_subitems && (item.subitems_selected || []).length > 0;
                if (item.checked || tieneSubitemsSeleccionados) {
                    if (item.tiene_subitems && item.subitems_selected.length > 0) {
                        // Agregar solo los subitems seleccionados
                        resultado[tipo].push(...item.subitems_selected);
                    } else if (!item.tiene_subitems) {
                        // Item simple sin hijos
                        resultado[tipo].push({
                            id: item.id,
                            item_id: item.item_id,
                            nombre: item.nombre,
                            descripcion: formatearDetalleDinamicoMaterial(item) ||
                                (esBebidaServicioSinDescripcion(item) ? '' : item.descripcion || item.presentacion || ''),
                            cantidad: item.cantidad,
                            unidad: obtenerUnidadPedidoMaterial(item),
                            source_table: item.source_table || 'logistics_materials',
                            unidad_inventario: obtenerUnidadStockMaterial(item),
                            conversion_a_stock: obtenerConversionMaterial(item)
                        });
                    }
                }
            });
        });

        return resultado;
    };

    /**
     * Limpia el material
     */
    window.limpiarMaterialLogistica = function() {
        window.materialLogistica = {
            bebidas: [],
            menaje: [],
            extras: [],
            catalogoCompleto: window.materialLogistica.catalogoCompleto,
            isAdmin: window.materialLogistica.isAdmin
        };
    };

    // ──────────────────────────────────────────────────────────
    // RENDERIZADO
    // ──────────────────────────────────────────────────────────
    function renderizarMaterial(containerId) {
        if (containerId === 'materialLogisticaPage') {
            renderizarMaterialLogisticaBuilder(containerId);
            return;
        }

        ['bebidas', 'menaje', 'extras'].forEach(tipo => {
            const lista = document.getElementById(`${containerId}_${tipo}`);
            if (!lista) return;

            const items = window.materialLogistica[tipo];

            if (items.length === 0) {
                lista.innerHTML = '<p class="dc-material-empty">Sin elementos</p>';
                return;
            }

            lista.innerHTML = items.map(item => {
                if (item.tiene_subitems) {
                    return renderizarItemConSubitems(item, tipo, containerId);
                } else {
                    return renderizarItemSimple(item, tipo, containerId);
                }
            }).join('');
        });
    }

    function renderizarItemSimple(item, tipo, containerId) {
        const descripcion = item.descripcion || item.presentacion || '';
        const precio = [
            descripcion ? `<span class="dc-material-precio">${descripcion}</span>` : '',
            item.precio > 0
                ? `<span class="dc-material-precio">${parseFloat(item.precio).toFixed(2).replace('.',',')} € / ${item.unidad}</span>`
                : item.incluido_en?.length
                    ? `<span class="dc-material-incluido">incluido</span>`
                    : descripcion
                        ? ''
                        : `<span class="dc-material-precio dc-material-precio--sin-precio">—</span>`
        ].join('');

        const cantidad = Number(item.cantidad || 0);
        const activo = item.checked || cantidad > 0;
        const cantidadHtml = activo
            ? renderizarCantidadConUnidad(cantidad, item.unidad, `onchange="updateMaterialCantidad('${tipo}', '${item.id}', this.value, '${containerId}')"`)
            : `<button type="button" class="dc-material-btn" onclick="toggleMaterialItemNew('${tipo}', '${item.id}', '${containerId}')"><i class="ti ti-plus"></i></button>`;

        return `
            <div class="dc-material-item ${activo ? 'dc-material-item--active' : ''}">
                <div class="dc-material-item-info">
                    <span class="dc-material-nombre">${item.nombre}</span>
                    ${precio}
                </div>
                <div class="dc-material-item-right">
                    ${cantidadHtml}
                </div>
            </div>
        `;
    }

    function renderizarItemConSubitems(item, tipo, containerId) {
        const descripcion = item.descripcion || item.presentacion || '';
        const precio = [
            descripcion ? `<span class="dc-material-precio">${descripcion}</span>` : '',
            item.precio > 0
                ? `<span class="dc-material-precio">${parseFloat(item.precio).toFixed(2).replace('.',',')} € / ${item.unidad}</span>`
                : item.incluido_en?.length
                    ? `<span class="dc-material-incluido">incluido</span>`
                    : ''
        ].join('');

        const subitemsSeleccionados = item.subitems_selected || [];
        const activo = item.checked || subitemsSeleccionados.length > 0;
        const detalleSubitems = subitemsSeleccionados.map(formatearResumenMaterial).join(', ');
        const cantidadTotal = subitemsSeleccionados.reduce((total, s) => total + Number(s.cantidad || 0), 0);
        const unidadResumen = subitemsSeleccionados[0]?.unidad || item.unidad || 'uds';
        const botonHtml = subitemsSeleccionados.length
            ? renderizarCantidadConUnidad(cantidadTotal, unidadResumen, 'readonly title="Total seleccionado"')
            : `<button type="button" class="dc-material-btn" onclick="event.stopPropagation(); abrirModalMaterialSubitems('${tipo}', '${item.id}', '${containerId}')">+</button>`;

        return `
            <div class="dc-material-item-expandable">
                <div class="dc-material-item dc-material-item--clickable ${activo ? 'dc-material-item--active' : ''}"
                     onclick="abrirModalMaterialSubitems('${tipo}', '${item.id}', '${containerId}')">
                    <div class="dc-material-item-info">
                        <span class="dc-material-nombre">${item.nombre}</span>
                        ${detalleSubitems
                            ? `<span class="dc-material-precio">${detalleSubitems}</span>`
                            : precio}
                    </div>
                    <div class="dc-material-item-right">
                        ${botonHtml}
                    </div>
                </div>
            </div>
        `;
    }

    function isSubitemSelected(parentItem, subitemId) {
        return (parentItem.subitems_selected || []).some(s => String(s.id) === String(subitemId));
    }

    function getSubitemCantidad(parentItem, subitemId) {
        const selected = (parentItem.subitems_selected || []).find(s => String(s.id) === String(subitemId));
        return selected ? selected.cantidad : 0;
    }

    function formatearCantidadMaterial(cantidad) {
        const numero = Number(cantidad || 0);
        return Number.isInteger(numero) ? String(numero) : String(numero).replace('.', ',');
    }

    function parseCantidadMaterial(valor) {
        const normalizado = String(valor ?? '').replace(',', '.');
        const numero = Number(normalizado);
        return Number.isFinite(numero) ? numero : 0;
    }

    function limpiarCapacidadDelNombreMaterial(nombre) {
        return String(nombre || '').replace(/\s+-\s+\d+(?:[.,]\d+)?\s*(?:uds?|unidades?)\s*$/i, '');
    }

    function normalizarTextoLogistica(valor) {
        return String(valor || '')
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .toLowerCase()
            .trim();
    }

    function esBebidaServicioSinDescripcion(item) {
        const nombre = normalizarTextoLogistica(item?.nombre);
        const tipo = normalizarTextoLogistica(item?.tipo);
        const subcategoria = normalizarTextoLogistica(item?.subcategoria);
        const esBebida = tipo === 'bebidas' || subcategoria === 'vinos';
        return esBebida && [
            'vino blanco',
            'vino tinto',
            'cava',
            'tinto de verano'
        ].includes(nombre);
    }

    function obtenerNumeroPositivo(valor) {
        const numero = Number(valor || 0);
        return Number.isFinite(numero) && numero > 1 ? numero : 0;
    }

    function extraerPresentacionMaterial(item) {
        const texto = String(item?.presentacion || item?.descripcion || '').trim();
        const match = texto.match(/^([A-Za-zÁÉÍÓÚÜÑáéíóúüñ]+)\s+(\d+(?:[.,]\d+)?)\s+(.+)$/);
        if (!match) return null;
        return {
            unidadPedido: match[1].toLowerCase(),
            conversion: Number(match[2].replace(',', '.')) || 0,
            unidadStock: match[3].trim().toLowerCase()
        };
    }

    function obtenerConversionMaterial(item) {
        return obtenerNumeroPositivo(item?.conversion_a_stock) ||
            obtenerNumeroPositivo(item?.contenido_por_unidad) ||
            extraerPresentacionMaterial(item)?.conversion ||
            1;
    }

    function obtenerUnidadPedidoMaterial(item) {
        const unidadBase = String(item?.unidad || item?.unidad_comanda || '').trim();
        if (unidadBase && !['ud', 'uds'].includes(unidadBase.toLowerCase())) return unidadBase;

        const presentacion = extraerPresentacionMaterial(item);
        if (presentacion?.unidadPedido) return presentacion.unidadPedido;
        return unidadBase || 'ud';
    }

    function obtenerUnidadStockMaterial(item) {
        const presentacion = extraerPresentacionMaterial(item);
        if (presentacion?.unidadStock) return presentacion.unidadStock;
        return item?.unidad_inventario || 'uds';
    }

    function formatearResumenMaterial(item) {
        const cantidad = Number(item.cantidad || 0);
        const conversion = obtenerConversionMaterial(item);

        if (conversion > 1) {
            const totalStock = cantidad * conversion;
            const nombre = limpiarCapacidadDelNombreMaterial(item.nombre || item.id);
            const unidadStock = obtenerUnidadStockMaterial(item);
            return `${nombre} - ${formatearCantidadMaterial(totalStock)} ${unidadStock}`;
        }

        const unidad = item.unidad || 'uds';
        return `${item.nombre || item.id} - ${formatearCantidadMaterial(cantidad)} ${unidad}`;
    }

    function formatearDetalleDinamicoMaterial(item, cantidadBase) {
        if (esBebidaServicioSinDescripcion(item)) return '';

        const conversion = obtenerConversionMaterial(item);
        if (conversion > 1) {
            const cantidad = Number(cantidadBase ?? item?.cantidad ?? 0);
            const cantidadParaMostrar = cantidad > 0 ? cantidad : 1;
            const totalStock = cantidadParaMostrar * conversion;
            const unidadPedido = obtenerUnidadPedidoMaterial(item);
            const unidadStock = obtenerUnidadStockMaterial(item);
            return `${unidadPedido} ${formatearCantidadMaterial(totalStock)} ${unidadStock}`;
        }

        return '';
    }

    function renderizarCantidadConUnidad(cantidad, unidad, attrs = '') {
        return `
            <div class="dc-material-qty">
                <input type="number" class="dc-material-cantidad" value="${cantidad || 0}" min="0" step="0.5" ${attrs}>
                <span class="dc-material-unit">${unidad || 'uds'}</span>
            </div>
        `;
    }

    // ──────────────────────────────────────────────────────────
    // INTERACCIONES
    // ──────────────────────────────────────────────────────────
    function getMetaMaterial(tipo) {
        const meta = {
            bebidas: { label: 'Bebidas', hint: 'Agua, zumos y refrescos' },
            menaje: { label: 'Menaje', hint: 'Piezas y servicio' },
            extras: { label: 'Material', hint: 'Apoyos y adicionales' }
        };
        return meta[tipo] || { label: tipo, hint: '' };
    }

    function getItemsSeleccionados(tipo) {
        return (window.materialLogistica[tipo] || []).filter(item =>
            item.checked || (item.subitems_selected || []).length
        );
    }

    function renderizarMaterialLogisticaBuilder(containerId) {
        const container = document.getElementById(containerId);
        if (!container) return;

        const totalSeleccionados = ['bebidas', 'menaje', 'extras']
            .reduce((total, tipo) => total + getItemsSeleccionados(tipo).length, 0);

        container.innerHTML = `
            <div class="logistics-builder">
                <div class="logistics-builder-actions">
                    ${['bebidas', 'menaje', 'extras'].map(tipo => {
                        const meta = getMetaMaterial(tipo);
                        const count = getItemsSeleccionados(tipo).length;
                        return `
                            <button type="button" class="logistics-builder-btn" onclick="abrirSelectorMaterialLogistica('${tipo}', '${containerId}')">
                                <strong>${meta.label}</strong>
                                <span>${count} seleccionados</span>
                            </button>
                        `;
                    }).join('')}
                </div>
                <div class="logistics-builder-selected">
                    <div class="logistics-builder-selected-header">
                        <h4>Material seleccionado</h4>
                        <span>${totalSeleccionados} items</span>
                    </div>
                    <div id="${containerId}_selected" class="logistics-builder-list"></div>
                </div>
                <div id="${containerId}_selectorModal" class="modal logistics-selector-modal">
                    <div class="modal-content logistics-selector-content">
                        <button type="button" class="logistics-article-close" onclick="cancelarSelectorMaterialLogistica('${containerId}')">×</button>
                        <h2 id="${containerId}_selectorTitle">Seleccionar material</h2>
                        <div id="${containerId}_selectorBody" class="logistics-selector-body"></div>
                        <div class="logistics-selector-footer">
                            <button type="button" class="btn-secondary" onclick="cancelarSelectorMaterialLogistica('${containerId}')">Cancelar</button>
                            <button type="button" class="btn-primary" onclick="confirmarSelectorMaterialLogistica('${containerId}')">Confirmar</button>
                        </div>
                    </div>
                </div>
            </div>
        `;

        renderizarSeleccionadosLogistica(containerId);
    }

    function renderizarMaterialLogisticaBuilder(containerId) {
        const container = document.getElementById(containerId);
        if (!container) return;

        container.innerHTML = `
            <div class="logistics-builder logistics-builder--inline">
                ${['bebidas', 'menaje', 'extras'].map(tipo => renderizarCajaCategoriaLogistica(tipo, containerId)).join('')}
            </div>
        `;
    }

    function renderizarCajaCategoriaLogistica(tipo, containerId) {
        const meta = getMetaMaterial(tipo);
        const items = window.materialLogistica[tipo] || [];
        const seleccionados = getItemsSeleccionados(tipo);

        return `
            <section class="logistics-builder-category">
                <div class="logistics-builder-category-header">
                    <div>
                        <h4>${meta.label}</h4>
                        <span>${meta.hint}</span>
                    </div>
                    <strong>${seleccionados.length}</strong>
                </div>
                <div class="logistics-builder-category-body">
                    <div class="logistics-builder-picker">
                        ${items.length
                            ? items.map(item => renderizarOpcionMaterialServicio(item, tipo, containerId)).join('')
                            : '<p class="dc-material-empty">No hay items disponibles.</p>'}
                    </div>
                </div>
            </section>
        `;
    }

    function renderizarOpcionMaterialServicio(item, tipo, containerId) {
        const tieneSubitems = !!item.tiene_subitems;
        const subitemsSeleccionados = item.subitems_selected || [];
        const activo = item.checked || Number(item.cantidad || 0) > 0 || subitemsSeleccionados.length > 0;
        const unidadPedido = obtenerUnidadPedidoMaterial(item);
        const detalle = formatearDetalleDinamicoMaterial(item);

        if (tieneSubitems) {
            return `
                <div class="logistics-builder-pick ${activo ? 'is-selected' : ''}">
                    <button type="button" class="logistics-builder-pick-main logistics-builder-pick-main--button"
                        onclick="abrirModalMaterialSubitems('${tipo}', '${item.id}', '${containerId}')">
                        <span>${item.nombre}</span>
                        <strong>${subitemsSeleccionados.length ? subitemsSeleccionados.length + ' seleccionados' : '+'}</strong>
                    </button>
                    <small>${subitemsSeleccionados.length ? 'Revisa cantidades seleccionadas' : (detalle || 'Seleccionar opciones')}</small>
                    ${subitemsSeleccionados.length ? `
                        <div class="logistics-builder-subselected">
                            ${subitemsSeleccionados.map(subitem => `
                                <div class="logistics-builder-subselected-row">
                                    <span>${subitem.nombre}</span>
                                    ${renderizarCantidadConUnidad(subitem.cantidad || 0, subitem.unidad, `onchange="updateSubitemCantidad('${tipo}', '${item.id}', '${subitem.id}', this.value, '${containerId}')"`) }
                                    <button type="button" title="Quitar"
                                        onclick="toggleSubitem('${tipo}', '${item.id}', '${subitem.id}', false, '${containerId}'); renderizarMaterial('${containerId}')">&times;</button>
                                </div>
                            `).join('')}
                        </div>
                    ` : ''}
                </div>
            `;
        }

        return `
            <div class="logistics-builder-pick ${activo ? 'is-selected' : ''}">
                <label class="logistics-builder-pick-main">
                    <input type="checkbox" ${activo ? 'checked' : ''}
                        onchange="toggleMaterialItemBuilder('${tipo}', '${item.id}', this.checked, '${containerId}')">
                    <span>${item.nombre}</span>
                </label>
                ${detalle ? `<small>${detalle}</small>` : ''}
                <div class="logistics-builder-qty">
                    <input type="number" min="0" step="0.5" value="${item.cantidad || 0}"
                        onchange="updateMaterialCantidadServicio('${tipo}', '${item.id}', this.value, '${containerId}')">
                    <span>${unidadPedido}</span>
                </div>
            </div>
        `;
    }

    function renderizarSeleccionadosLogistica(containerId) {
        const lista = document.getElementById(`${containerId}_selected`);
        if (!lista) return;

        const html = ['bebidas', 'menaje', 'extras'].map(tipo => {
            const items = getItemsSeleccionados(tipo);
            if (!items.length) return '';
            const meta = getMetaMaterial(tipo);
            return `
                <section class="logistics-builder-group">
                    <h5>${meta.label}</h5>
                    ${items.map(item => renderizarSeleccionadoLogistica(item, tipo, containerId)).join('')}
                </section>
            `;
        }).join('');

        lista.innerHTML = html || '<p class="dc-material-empty">Aun no has seleccionado material.</p>';
    }

    function renderizarSeleccionadoLogistica(item, tipo, containerId) {
        if (item.tiene_subitems && item.subitems_selected?.length) {
            return item.subitems_selected.map(subitem => `
                <div class="logistics-builder-selected-item">
                    <span>${subitem.nombre}</span>
                    <input type="number" min="0" step="0.5" value="${subitem.cantidad || 0}" onchange="updateSubitemCantidad('${tipo}', '${item.id}', '${subitem.id}', this.value, '${containerId}')">
                    <small>${subitem.unidad || 'uds'}</small>
                    <button type="button" onclick="toggleSubitem('${tipo}', '${item.id}', '${subitem.id}', false, '${containerId}'); renderizarMaterial('${containerId}')">Quitar</button>
                </div>
            `).join('');
        }

        return `
            <div class="logistics-builder-selected-item">
                <span>${item.nombre}</span>
                <input type="number" min="0" step="0.5" value="${item.cantidad || 0}" onchange="updateMaterialCantidad('${tipo}', '${item.id}', this.value)">
                <small>${item.unidad || 'uds'}</small>
                <button type="button" onclick="toggleMaterialItemBuilder('${tipo}', '${item.id}', false, '${containerId}')">Quitar</button>
            </div>
        `;
    }

    function renderizarOpcionesSelector(tipo, containerId) {
        const body = document.getElementById(`${containerId}_selectorBody`);
        const title = document.getElementById(`${containerId}_selectorTitle`);
        if (!body || !title) return;

        const meta = getMetaMaterial(tipo);
        const items = window.materialLogistica[tipo] || [];
        title.textContent = `Seleccionar ${meta.label}`;

        body.innerHTML = items.length ? items.map(item => {
            const activo = item.checked || (item.subitems_selected || []).length;
            const detalle = item.tiene_subitems && item.subitems_selected?.length
                ? item.subitems_selected
                    .map(formatearResumenMaterial)
                    .join(', ')
                : (item.unidad || '');
            return `
                <button type="button" class="logistics-selector-option ${activo ? 'is-selected' : ''}"
                    onclick="${item.tiene_subitems
                        ? `abrirModalMaterialSubitems('${tipo}', '${item.id}', '${containerId}')`
                        : `toggleMaterialItemBuilder('${tipo}', '${item.id}', ${!activo}, '${containerId}')`}">
                    <span>${item.nombre}</span>
                    <small>${detalle || 'Seleccionar'}</small>
                </button>
            `;
        }).join('') : '<p class="dc-material-empty">Sin elementos.</p>';
    }

    window.toggleMaterialItem = function(tipo, itemId, checked) {
        const item = window.materialLogistica[tipo].find(i => i.id == itemId);
        if (!item) return;
        item.checked = checked;
        if (!checked) {
            item.cantidad = 0;
            return;
        }
        if (!item.cantidad || item.cantidad === 0) {
            item.cantidad = item.incluido_en?.length ? obtenerPaxLogistica() : 1;
        }
    };

    window.toggleMaterialItemNew = function(tipo, itemId, containerId) {
        const item = window.materialLogistica[tipo].find(i => i.id == itemId);
        if (!item) return;
        item.checked = !item.checked;
        if (!item.checked) {
            item.cantidad = 0;
        } else if (!item.cantidad || item.cantidad === 0) {
            item.cantidad = item.incluido_en?.length ? obtenerPaxLogistica() : 1;
        }
        const cId = containerId || 'materialLogisticaInline';
        renderizarMaterial(cId);
    };

    function clonarEstadoMaterialLogistica() {
        return JSON.parse(JSON.stringify({
            bebidas: window.materialLogistica.bebidas || [],
            menaje: window.materialLogistica.menaje || [],
            extras: window.materialLogistica.extras || []
        }));
    }

    function restaurarEstadoMaterialLogistica(snapshot) {
        if (!snapshot) return;
        window.materialLogistica.bebidas = snapshot.bebidas || [];
        window.materialLogistica.menaje = snapshot.menaje || [];
        window.materialLogistica.extras = snapshot.extras || [];
    }

    window.abrirSelectorMaterialLogistica = function(tipo, containerId = 'materialLogisticaPage') {
        const modal = document.getElementById(`${containerId}_selectorModal`);
        if (!modal) return;
        modal.dataset.tipo = tipo;
        modal._materialSnapshot = clonarEstadoMaterialLogistica();
        renderizarOpcionesSelector(tipo, containerId);
        modal.style.display = 'flex';
    };

    window.confirmarSelectorMaterialLogistica = function(containerId = 'materialLogisticaPage') {
        const modal = document.getElementById(`${containerId}_selectorModal`);
        if (modal) {
            modal._materialSnapshot = null;
            modal.style.display = 'none';
        }
        renderizarMaterial(containerId);
    };

    window.cancelarSelectorMaterialLogistica = function(containerId = 'materialLogisticaPage') {
        const modal = document.getElementById(`${containerId}_selectorModal`);
        if (modal) {
            restaurarEstadoMaterialLogistica(modal._materialSnapshot);
            modal._materialSnapshot = null;
            modal.style.display = 'none';
        }
        renderizarMaterial(containerId);
    };

    window.cerrarSelectorMaterialLogistica = window.confirmarSelectorMaterialLogistica;

    window.toggleMaterialItemBuilder = function(tipo, itemId, checked, containerId = 'materialLogisticaPage') {
        const item = window.materialLogistica[tipo].find(i => i.id == itemId);
        if (!item) return;
        item.checked = checked;
        if (!checked) {
            item.cantidad = 0;
            item.subitems_selected = [];
        } else if (!item.cantidad || item.cantidad === 0) {
            const sugerida = calcularCantidadServicio(item, obtenerPaxLogistica());
            item.cantidad = sugerida > 0 ? sugerida : 1;
        } else if (tipo === 'menaje' && (!item.cantidad || item.cantidad === 0)) {
            const pax = parseInt(document.getElementById('log_pax')?.textContent || document.getElementById('pax')?.value || 0);
            if (pax > 0) item.cantidad = pax;
        }

        renderizarMaterial(containerId);
    };

    window.toggleMaterialItemExpandable = function(tipo, itemId, checked, containerId) {
        const item = window.materialLogistica[tipo].find(i => i.id === itemId);
        if (item) {
            item.checked = checked;
            if (checked && !item.subitems_expanded) {
                item.subitems_expanded = true;
                renderizarMaterial(containerId);
            }
        }
    };

    window.toggleSubitems = function(tipo, parentId, containerId) {
        const item = window.materialLogistica[tipo].find(i => i.id === parentId);
        if (item) {
            item.subitems_expanded = !item.subitems_expanded;
            renderizarMaterial(containerId);
        }
    };

    window.toggleSubitem = function(tipo, parentId, subitemId, checked, containerId) {
        const parent = window.materialLogistica[tipo].find(i => String(i.id) === String(parentId));
        if (!parent) return;

        const subitem = (parent.subitems || []).find(s => String(s.id) === String(subitemId));
        if (!subitem) return;

        if (checked) {
            if (!(parent.subitems_selected || []).some(s => String(s.id) === String(subitemId))) {
                if (!parent.subitems_selected) parent.subitems_selected = [];
                parent.subitems_selected.push({
                    id: subitem.id,
                    item_id: subitem.item_id,
                    nombre: subitem.nombre,
                    cantidad: 1,
                    unidad: subitem.unidad,
                    descripcion: subitem.descripcion || subitem.presentacion || '',
                    source_table: subitem.source_table || 'logistics_materials',
                    unidad_inventario: subitem.unidad_inventario || subitem.unidad || 'ud',
                    conversion_a_stock: Number(subitem.conversion_a_stock || subitem.contenido_por_unidad || 1)
                });
            }
        } else {
            parent.subitems_selected = (parent.subitems_selected || []).filter(s => String(s.id) !== String(subitemId));
        }

        parent.checked = (parent.subitems_selected || []).length > 0;

        if (containerId === 'materialLogisticaPage') {
            renderizarSeleccionadosLogistica(containerId);
            const modal = document.getElementById(`${containerId}_selectorModal`);
            const tipoActivo = modal?.dataset.tipo || tipo;
            renderizarOpcionesSelector(tipoActivo, containerId);
        }
    };

    window.updateMaterialCantidad = function(tipo, itemId, cantidad, containerId) {
        const item = window.materialLogistica[tipo].find(i => String(i.id) === String(itemId));
        if (!item) return;
        const valor = parseCantidadMaterial(cantidad);
        item.cantidad = valor > 0 ? valor : 0;
        item.checked = item.cantidad > 0;
        if (containerId) renderizarMaterial(containerId);
    };

    window.updateMaterialCantidadServicio = function(tipo, itemId, cantidad, containerId = 'materialLogisticaPage') {
        const item = window.materialLogistica[tipo].find(i => i.id === itemId);
        if (!item) return;

        const valor = parseCantidadMaterial(cantidad);
        item.cantidad = valor;
        item.checked = valor > 0;
        item.unidad = obtenerUnidadPedidoMaterial(item);
        item.unidad_inventario = obtenerUnidadStockMaterial(item);
        item.conversion_a_stock = obtenerConversionMaterial(item);
        item.descripcion = formatearDetalleDinamicoMaterial(item);
        renderizarMaterial(containerId);
    };

    window.updateSubitemCantidad = function(tipo, parentId, subitemId, cantidad, containerId) {
        const parent = window.materialLogistica[tipo].find(i => String(i.id) === String(parentId));
        if (!parent) return;

        const selected = (parent.subitems_selected || []).find(s => String(s.id) === String(subitemId));
        if (selected) {
            selected.cantidad = parseCantidadMaterial(cantidad);
        }
        parent.checked = (parent.subitems_selected || []).length > 0;

        if (containerId === 'materialLogisticaPage') {
            renderizarSeleccionadosLogistica(containerId);
        }
    };

    // ──────────────────────────────────────────────────────────
    // HELPERS
    // ──────────────────────────────────────────────────────────
    function calcularCantidadSugerida(itemId, pax = 0, cantidadBase = 1) {
        // Por defecto devolver 0, solo calcular si viene cantidadBase > 0
        if (cantidadBase === 0 || pax === 0) return 0;
        
        if (itemId.startsWith('beb_')) {
            return Math.ceil(pax * 1.2);
        }
        if (itemId.startsWith('men_')) {
            return pax;
        }
        if (itemId.startsWith('ext_')) {
            return Math.ceil(pax / 20) || 1;
        }
        return cantidadBase;
    }

    // ── Modal subitems ───────────────────────────────────
    window.abrirModalMaterialSubitems = function(tipo, itemId, containerId) {
        const item = window.materialLogistica[tipo]?.find(i => i.id === itemId);
        if (!item || !item.subitems?.length) return;

        const modal = document.getElementById('modalMaterialSubitems');
        const titulo = document.getElementById('modalMaterialSubitemsTitle');
        const opciones = document.getElementById('modalMaterialSubitemsOpciones');
        if (!modal) return;

        modal.dataset.tipo = tipo;
        modal.dataset.itemId = itemId;
        modal.dataset.containerId = containerId || '';
        modal._subitemsSnapshot = JSON.parse(JSON.stringify(item));
        titulo.textContent = item.nombre;
        opciones.innerHTML = item.subitems.map(subitem => {
            const seleccionado = isSubitemSelected(item, subitem.id);
            const cantidad = getSubitemCantidad(item, subitem.id);
            return `
                <div class="dc-material-modal-option ${seleccionado ? 'dc-material-modal-option--active' : ''}">
                    <span class="dc-material-nombre">${subitem.nombre}</span>
                    <div class="dc-material-modal-actions">
                        ${seleccionado ? `<input type="number" class="dc-material-cantidad" value="${cantidad}" min="0" step="0.5"
                            onchange="updateSubitemCantidad('${tipo}','${itemId}','${subitem.id}',this.value,'${containerId}')">` : ''}
                        <button type="button"
                                class="${seleccionado ? 'dc-material-btn dc-material-btn--active' : 'dc-material-btn'}"
                                onclick="toggleSubitem('${tipo}','${itemId}','${subitem.id}',${!seleccionado},'${containerId}'); setTimeout(()=>abrirModalMaterialSubitems('${tipo}','${itemId}','${containerId}'),50);">
                            ${seleccionado ? '&check;' : '+'}
                        </button>
                    </div>
                </div>
            `;
        }).join('');

        modal.style.display = 'flex';
    };

    window.confirmarModalMaterialSubitems = function() {
        const modal = document.getElementById('modalMaterialSubitems');
        if (modal) {
            const containerId = modal.dataset.containerId;
            modal._subitemsSnapshot = null;
            modal.style.display = 'none';
            if (containerId) renderizarMaterial(containerId);
        }
    };

    window.cancelarModalMaterialSubitems = function() {
        const modal = document.getElementById('modalMaterialSubitems');
        if (!modal) return;

        const tipo = modal.dataset.tipo;
        const itemId = modal.dataset.itemId;
        const containerId = modal.dataset.containerId;
        const snapshot = modal._subitemsSnapshot;
        const lista = window.materialLogistica[tipo] || [];
        const index = lista.findIndex(i => i.id === itemId);

        if (snapshot && index >= 0) {
            lista[index] = JSON.parse(JSON.stringify(snapshot));
        }

        modal._subitemsSnapshot = null;
        modal.style.display = 'none';

        if (containerId) renderizarMaterial(containerId);
    };

    window.cerrarModalMaterialSubitems = window.confirmarModalMaterialSubitems;

    window.renderizarMaterialLogisticaActual = renderizarMaterial;

    document.addEventListener('click', function(e) {
        const modal = document.getElementById('modalMaterialSubitems');
        if (modal && e.target === modal) cancelarModalMaterialSubitems();
    });

})();
