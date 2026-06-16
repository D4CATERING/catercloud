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
                itemsMap.set(item.id, {
                    ...item,
                    source_table: 'logistics_materials',
                    unidad_inventario: item.unidad_inventario || item.unidad || 'ud',
                    conversion_a_stock: Number(item.conversion_a_stock || 1),
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

    function obtenerPaxLogistica() {
        const paxLogistica = parseInt(document.getElementById('log_pax')?.textContent || 0);
        const paxFormulario = parseInt(document.getElementById('pax')?.value || 0);
        return paxLogistica || window.pax || paxFormulario || 0;
    }

    function calcularCantidadServicio(item, pax) {
        if (!item?.auto_calcular) return Number(item.cantidad || 0);

        const base = Number(item.cantidad_base || 0);
        const porPax = Number(item.cantidad_por_pax || 0);
        const redondeo = Math.max(1, Number(item.redondeo_a || 1));
        const calculado = base + (pax * porPax);

        if (calculado <= 0) return 0;
        return Math.ceil(calculado / redondeo) * redondeo;
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
    const INCLUIDOS_POR_MENU = {
        desayunos: [
            '3a6e55f0-64ab-4c74-a19f-bdb4c85a31d8', // Vasos para zumo
            '548b2e15-1315-4673-ad3d-e5cd8102e816', // Kit desechable para café
            'a045fca2-d788-491d-a521-f731bc744e54', // Servilletas
        ],
    };

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
        const incluidosIds = INCLUIDOS_POR_MENU[menuTipo] || [];
        const pax = obtenerPaxLogistica();
        const catalogoServicios = menuTipo === 'servicios'
            ? await cargarCatalogoServiciosLogistica()
            : null;

        const materialIds = new Set(materialMenu.map(m => m.material_id));
        const catalogo = catalogoServicios || window.materialLogistica.catalogoCompleto || [];
        const tipoMenaje = document.getElementById('tipo_menaje')?.value || 'desechable';
        const esLoza = tipoMenaje === 'loza';

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
                        if (item.parent_id) return false;
                        return true;
                    })
                    .map(item => {
                        const incluido = incluidosIds.includes(item.id);
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
                if (item.checked) {
                    if (item.tiene_subitems && item.subitems_selected.length > 0) {
                        // Agregar solo los subitems seleccionados
                        resultado[tipo].push(...item.subitems_selected);
                    } else if (!item.tiene_subitems) {
                        // Item simple sin hijos
                        resultado[tipo].push({
                            id: item.id,
                            item_id: item.item_id,
                            nombre: item.nombre,
                            cantidad: item.cantidad,
                            unidad: item.unidad,
                            source_table: item.source_table || 'logistics_materials',
                            unidad_inventario: item.unidad_inventario || item.unidad || 'ud',
                            conversion_a_stock: Number(item.conversion_a_stock || item.contenido_por_unidad || 1)
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
                    return renderizarItemSimple(item, tipo);
                }
            }).join('');
        });
    }

    function renderizarItemSimple(item, tipo) {
        const precio = item.precio > 0
            ? `<span class="dc-material-precio">${parseFloat(item.precio).toFixed(2).replace('.',',')} € / ${item.unidad}</span>`
            : item.incluido_en?.length
                ? `<span class="dc-material-incluido">incluido</span>`
                : `<span class="dc-material-precio dc-material-precio--sin-precio">—</span>`;

        const btnClass = item.checked ? 'dc-material-btn dc-material-btn--active' : 'dc-material-btn';
        const btnIcon  = item.checked ? 'ti-check' : 'ti-plus';

        return `
            <div class="dc-material-item ${item.checked ? 'dc-material-item--active' : ''}">
                <div class="dc-material-item-info">
                    <span class="dc-material-nombre">${item.nombre}</span>
                    ${precio}
                </div>
                <div class="dc-material-item-right">
                    ${item.checked ? `<input type="number" class="dc-material-cantidad" value="${item.cantidad || 0}" min="0" onchange="updateMaterialCantidad('${tipo}', '${item.id}', this.value)">` : ''}
                    <button type="button" class="${btnClass}" onclick="toggleMaterialItemNew('${tipo}', '${item.id}', '${item.containerId || ''}')">
                        <i class="ti ${btnIcon}"></i>
                    </button>
                </div>
            </div>
        `;
    }

    function renderizarItemConSubitems(item, tipo, containerId) {
        const precio = item.precio > 0
            ? `<span class="dc-material-precio">${parseFloat(item.precio).toFixed(2).replace('.',',')} € / ${item.unidad}</span>`
            : item.incluido_en?.length
                ? `<span class="dc-material-incluido">incluido</span>`
                : '';

        const btnClass = item.checked ? 'dc-material-btn dc-material-btn--active' : 'dc-material-btn';
        const btnIcon  = item.checked ? '✓' : '+';
        const subitemsSeleccionados = (item.subitems_selected || []).map(s => s.nombre || s.id).join(', ');

        return `
            <div class="dc-material-item-expandable">
                <div class="dc-material-item dc-material-item--clickable ${item.checked ? 'dc-material-item--active' : ''}"
                     onclick="abrirModalMaterialSubitems('${tipo}', '${item.id}', '${containerId}')">
                    <div class="dc-material-item-info">
                        <span class="dc-material-nombre">${item.nombre}</span>
                        ${subitemsSeleccionados
                            ? `<span class="dc-material-precio">${subitemsSeleccionados}</span>`
                            : precio}
                    </div>
                    <div class="dc-material-item-right">
                        <button type="button" class="${btnClass}"
                                onclick="event.stopPropagation(); toggleMaterialItemNew('${tipo}', '${item.id}', '${containerId}')">
                            ${btnIcon}
                        </button>
                    </div>
                </div>
            </div>
        `;
    }

    function isSubitemSelected(parentItem, subitemId) {
        return parentItem.subitems_selected.some(s => s.id === subitemId);
    }

    function getSubitemCantidad(parentItem, subitemId) {
        const selected = parentItem.subitems_selected.find(s => s.id === subitemId);
        return selected ? selected.cantidad : 0;
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
                        <button type="button" class="logistics-article-close" onclick="cerrarSelectorMaterialLogistica('${containerId}')">×</button>
                        <h2 id="${containerId}_selectorTitle">Seleccionar material</h2>
                        <div id="${containerId}_selectorBody" class="logistics-selector-body"></div>
                        <div class="logistics-selector-footer">
                            <button type="button" class="btn-primary" onclick="cerrarSelectorMaterialLogistica('${containerId}')">Aplicar seleccion</button>
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
        const activo = item.checked || Number(item.cantidad || 0) > 0;
        const detalle = [
            item.presentacion,
            item.subcategoria
        ].filter(Boolean).join(' - ');

        return `
            <div class="logistics-builder-pick ${activo ? 'is-selected' : ''}">
                <label class="logistics-builder-pick-main">
                    <input type="checkbox" ${activo ? 'checked' : ''}
                        onchange="toggleMaterialItemBuilder('${tipo}', '${item.id}', this.checked, '${containerId}')">
                    <span>${item.nombre}</span>
                </label>
                <small>${detalle || 'Agregar a la comanda'}</small>
                <div class="logistics-builder-qty">
                    <input type="number" min="0" value="${item.cantidad || 0}"
                        onchange="updateMaterialCantidadServicio('${tipo}', '${item.id}', this.value, '${containerId}')">
                    <span>${item.unidad || 'uds'}</span>
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
                    <input type="number" min="0" value="${subitem.cantidad || 0}" onchange="updateSubitemCantidad('${tipo}', '${item.id}', '${subitem.id}', this.value, '${containerId}')">
                    <small>${subitem.unidad || 'uds'}</small>
                    <button type="button" onclick="toggleSubitem('${tipo}', '${item.id}', '${subitem.id}', false, '${containerId}'); renderizarMaterial('${containerId}')">Quitar</button>
                </div>
            `).join('');
        }

        return `
            <div class="logistics-builder-selected-item">
                <span>${item.nombre}</span>
                <input type="number" min="0" value="${item.cantidad || 0}" onchange="updateMaterialCantidad('${tipo}', '${item.id}', this.value)">
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
                ? item.subitems_selected.map(s => s.nombre).join(', ')
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
        if (checked && tipo === 'menaje' && (!item.cantidad || item.cantidad === 0)) {
            const pax = parseInt(document.getElementById('pax')?.value || 0);
            if (pax > 0) {
                item.cantidad = pax;
                const label = document.querySelector(
                    `#materialLogisticaInline_${tipo} input[onchange*="${itemId}"]`
                )?.closest('label');
                if (label) {
                    const cantInput = label.querySelector('.dc-material-cantidad, input[type="number"]');
                    if (cantInput) cantInput.value = pax;
                }
            }
        }
    };

    window.toggleMaterialItemNew = function(tipo, itemId, containerId) {
        const item = window.materialLogistica[tipo].find(i => i.id == itemId);
        if (!item) return;
        item.checked = !item.checked;
        if (item.checked && tipo === 'menaje' && (!item.cantidad || item.cantidad === 0)) {
            const pax = parseInt(document.getElementById('pax')?.value || 0);
            if (pax > 0) item.cantidad = pax;
        }
        const cId = containerId || 'materialLogisticaInline';
        renderizarMaterial(cId);
    };

    window.abrirSelectorMaterialLogistica = function(tipo, containerId = 'materialLogisticaPage') {
        const modal = document.getElementById(`${containerId}_selectorModal`);
        if (!modal) return;
        modal.dataset.tipo = tipo;
        renderizarOpcionesSelector(tipo, containerId);
        modal.style.display = 'flex';
    };

    window.cerrarSelectorMaterialLogistica = function(containerId = 'materialLogisticaPage') {
        const modal = document.getElementById(`${containerId}_selectorModal`);
        if (modal) modal.style.display = 'none';
        renderizarMaterial(containerId);
    };

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
        const parent = window.materialLogistica[tipo].find(i => i.id === parentId);
        if (!parent) return;

        const subitem = parent.subitems.find(s => s.id === subitemId);
        if (!subitem) return;

        if (checked) {
            if (!parent.subitems_selected.some(s => s.id === subitemId)) {
                parent.subitems_selected.push({
                    id: subitem.id,
                    item_id: subitem.item_id,
                    nombre: subitem.nombre,
                    cantidad: calcularCantidadSugerida(subitem.item_id, window.pax || 0, 1),
                    unidad: subitem.unidad,
                    source_table: subitem.source_table || 'logistics_materials',
                    unidad_inventario: subitem.unidad_inventario || subitem.unidad || 'ud',
                    conversion_a_stock: Number(subitem.conversion_a_stock || subitem.contenido_por_unidad || 1)
                });
            }
        } else {
            parent.subitems_selected = parent.subitems_selected.filter(s => s.id !== subitemId);
        }

        if (containerId === 'materialLogisticaPage') {
            renderizarSeleccionadosLogistica(containerId);
            const modal = document.getElementById(`${containerId}_selectorModal`);
            const tipoActivo = modal?.dataset.tipo || tipo;
            renderizarOpcionesSelector(tipoActivo, containerId);
        }
    };

    window.updateMaterialCantidad = function(tipo, itemId, cantidad) {
        const item = window.materialLogistica[tipo].find(i => i.id === itemId);
        if (item) item.cantidad = parseInt(cantidad) || 0;
    };

    window.updateMaterialCantidadServicio = function(tipo, itemId, cantidad, containerId = 'materialLogisticaPage') {
        const item = window.materialLogistica[tipo].find(i => i.id === itemId);
        if (!item) return;

        const valor = parseFloat(cantidad) || 0;
        item.cantidad = valor;
        item.checked = valor > 0;
        renderizarMaterial(containerId);
    };

    window.updateSubitemCantidad = function(tipo, parentId, subitemId, cantidad, containerId) {
        const parent = window.materialLogistica[tipo].find(i => i.id === parentId);
        if (!parent) return;

        const selected = parent.subitems_selected.find(s => s.id === subitemId);
        if (selected) {
            selected.cantidad = parseInt(cantidad) || 0;
        }

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

        titulo.textContent = item.nombre;
        opciones.innerHTML = item.subitems.map(subitem => {
            const seleccionado = isSubitemSelected(item, subitem.id);
            const cantidad = getSubitemCantidad(item, subitem.id);
            return `
                <div class="dc-material-modal-option ${seleccionado ? 'dc-material-modal-option--active' : ''}">
                    <span class="dc-material-nombre">${subitem.nombre}</span>
                    <div class="dc-material-modal-actions">
                        ${seleccionado ? `<input type="number" class="dc-material-cantidad" value="${cantidad}" min="0"
                            onchange="updateSubitemCantidad('${tipo}','${itemId}','${subitem.id}',this.value,'${containerId}')">` : ''}
                        <button type="button"
                                class="${seleccionado ? 'dc-material-btn dc-material-btn--active' : 'dc-material-btn'}"
                                onclick="toggleSubitem('${tipo}','${itemId}','${subitem.id}',${!seleccionado},'${containerId}'); setTimeout(()=>abrirModalMaterialSubitems('${tipo}','${itemId}','${containerId}'),50);">
                            ${seleccionado ? '✓' : '+'}
                        </button>
                    </div>
                </div>
            `;
        }).join('');

        modal.style.display = 'flex';
    };

    window.cerrarModalMaterialSubitems = function() {
        const modal = document.getElementById('modalMaterialSubitems');
        if (modal) modal.style.display = 'none';
    };

    window.renderizarMaterialLogisticaActual = renderizarMaterial;

    document.addEventListener('click', function(e) {
        const modal = document.getElementById('modalMaterialSubitems');
        if (modal && e.target === modal) modal.style.display = 'none';
    });

})();
