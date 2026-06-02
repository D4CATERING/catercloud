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
                itemsMap.set(item.id, { ...item, subitems: [] });
            });

            data.forEach(item => {
                if (item.parent_id) {
                    const padre = itemsMap.get(item.parent_id);
                    if (padre) padre.subitems.push(itemsMap.get(item.id));
                } else {
                    padres.push(itemsMap.get(item.id));
                }
            });

            window.materialLogistica.catalogoCompleto = padres;
            return padres;
        } catch (err) {
            console.error('Error cargando catálogo:', err);
            return [];
        }
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
        const pax = window.pax || parseInt(document.getElementById('pax')?.value) || 0;

        if (materialMenu.length > 0) {
            const materialIds = materialMenu.map(m => m.material_id);
            const catalogo = window.materialLogistica.catalogoCompleto || [];

            ['bebidas', 'menaje', 'extras'].forEach(tipo => {
                const inyectados = (window.materialLogistica[tipo] || []).filter(i => i._zumoId || i._menaje_desayuno || i._extras_desayuno);

                window.materialLogistica[tipo] = [
                    ...inyectados,
                    ...catalogo
                        .filter(item => item.tipo === tipo && materialIds.includes(item.id))
                        .map(item => {
                            const incluido = incluidosIds.includes(item.id);
                            return {
                                ...item,
                                cantidad: incluido ? pax : 0,
                                checked: incluido,
                                incluido_en: incluido ? [menuTipo] : (item.incluido_en || []),
                                subitems_expanded: false,
                                subitems_selected: []
                            };
                        })
                ];
            });
        }

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
                            unidad: item.unidad
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
                    unidad: subitem.unidad
                });
            }
        } else {
            parent.subitems_selected = parent.subitems_selected.filter(s => s.id !== subitemId);
        }
    };

    window.updateMaterialCantidad = function(tipo, itemId, cantidad) {
        const item = window.materialLogistica[tipo].find(i => i.id === itemId);
        if (item) item.cantidad = parseInt(cantidad) || 0;
    };

    window.updateSubitemCantidad = function(tipo, parentId, subitemId, cantidad, containerId) {
        const parent = window.materialLogistica[tipo].find(i => i.id === parentId);
        if (!parent) return;

        const selected = parent.subitems_selected.find(s => s.id === subitemId);
        if (selected) {
            selected.cantidad = parseInt(cantidad) || 0;
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

    document.addEventListener('click', function(e) {
        const modal = document.getElementById('modalMaterialSubitems');
        if (modal && e.target === modal) modal.style.display = 'none';
    });

})();
