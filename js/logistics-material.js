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
                <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:10px;">
                    <h4 class="dc-material-title">📦 Material Necesario</h4>
                    ${window.materialLogistica.isAdmin ? 
                        '<button type="button" onclick="abrirAdminMaterial()" class="btn-material-admin">⚙️ Gestionar</button>' 
                        : ''}
                </div>
                <div class="dc-material-grid">
                    <div class="dc-material-col">
                        <h5>🥤 Bebidas</h5>
                        <div id="${containerId}_bebidas" class="dc-material-list"></div>
                    </div>
                    <div class="dc-material-col">
                        <h5>🍽️ Menaje</h5>
                        <div id="${containerId}_menaje" class="dc-material-list"></div>
                    </div>
                    <div class="dc-material-col">
                        <h5>✨ Extras</h5>
                        <div id="${containerId}_extras" class="dc-material-list"></div>
                    </div>
                </div>
            </div>
        `;

            // Re-añadir zumos preservados
            _zumosActuales.forEach(zumo => {
                if (!window.materialLogistica.bebidas.some(i => i._zumoId === zumo._zumoId)) {
                    window.materialLogistica.bebidas.push(zumo);
                }
            });
        }

        renderizarMaterial(containerId);
    };

    /**
     * Autocompleta según categoría
     */
    window.autocompletarMaterialPorCategoria = async function(categoriaId, containerId) {
        const mapeo = {
            1: 'desayunos',
            2: 'foodbox',
            3: 'servicios',
            4: 'lunch',
            5: 'bandejas'
        };

        const menuTipo = mapeo[categoriaId];
        if (!menuTipo) return;

        const materialMenu = await cargarMaterialPorMenu(menuTipo);
        const pax = window.pax || 0;

        if (materialMenu.length > 0) {
            const materialIds = materialMenu.map(m => m.material_id);
            const catalogo = window.materialLogistica.catalogoCompleto || [];

            const tipoMenaje = document.getElementById('tipo_menaje')?.value || 'desechable';
            const esLoza = tipoMenaje === 'loza';

            // Preservar zumos (añadidos por desayunos.js, no vienen de Supabase)
            const _zumosActuales = (window.materialLogistica.bebidas || []).filter(i => i._zumoId);

            ['bebidas', 'menaje', 'extras'].forEach(tipo => {
                window.materialLogistica[tipo] = catalogo
                    .filter(item => {
                        if (item.tipo !== tipo) return false;
                        if (!materialIds.includes(item.id)) return false;
                        if (item.solo_loza && !esLoza) return false;
                        if (item.solo_desechable && esLoza) return false;
                        if (item.parent_id) return false;
                        return true;
                    })
                    .map(item => ({
                        ...item,
                        cantidad: tipo === 'menaje' && (window.pax || 0) > 0 ? (window.pax || 0) : 0,
                        checked: tipo === 'menaje',
                        subitems_expanded: false,
                        subitems_selected: []
                    }));
            });
        }

            // Re-añadir zumos preservados
            _zumosActuales.forEach(zumo => {
                if (!window.materialLogistica.bebidas.some(i => i._zumoId === zumo._zumoId)) {
                    window.materialLogistica.bebidas.push(zumo);
                }
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
                        const subitemsValidos = item.subitems_selected.filter(s => (s.cantidad || 0) >= 0);
                        resultado[tipo].push(...subitemsValidos);
                    } else if (item.tiene_subitems && item.subitems_selected.length === 0) {
                        resultado[tipo].push({
                            id: item.id, item_id: item.item_id,
                            nombre: item.nombre, cantidad: item.cantidad || 0, unidad: item.unidad
                        });
                    } else if (!item.tiene_subitems) {
                        resultado[tipo].push({
                            id: item.id, item_id: item.item_id,
                            nombre: item.nombre, cantidad: item.cantidad || 0, unidad: item.unidad
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

            // Guardar items inyectados por desayunos.js (zumo/agua y menaje)
            // para no perderlos al re-renderizar el material de logistica
            const itemsDesayuno = Array.from(lista.querySelectorAll('[data-zumo-id], [data-menaje-desayuno], [data-extras-desayuno], [data-menaje-foodbox], [data-extras-foodbox]'));

            const items = window.materialLogistica[tipo];

            if (items.length === 0 && itemsDesayuno.length === 0) {
                lista.innerHTML = '<p class="dc-material-empty">Sin elementos</p>';
                return;
            }

            // Renderizar solo los items propios de logistica
            lista.innerHTML = items.map(item => {
                if (item.tiene_subitems) {
                    return renderizarItemConSubitems(item, tipo, containerId);
                } else {
                    return renderizarItemSimple(item, tipo);
                }
            }).join('');

            // Re-insertar items de desayunos (desayunos.js los limpia al cambiar de menú)
            itemsDesayuno.forEach(item => {
                lista.appendChild(item);
            });
        });
    }

    function renderizarItemSimple(item, tipo) {
        return `
            <label class="dc-material-item">
                <input type="checkbox" 
                       ${item.checked ? 'checked' : ''}
                       onchange="toggleMaterialItem('${tipo}', '${item.id}', this.checked)">
                <span class="dc-material-nombre">${item.nombre}</span>
                <input type="number" 
                       class="dc-material-cantidad" 
                       value="${item.cantidad !== undefined ? item.cantidad : 0}"
                       min="0"
                       onchange="updateMaterialCantidad('${tipo}', '${item.id}', this.value)">
                <span class="dc-material-unidad">${item.unidad}</span>
            </label>
        `;
    }

    function renderizarItemConSubitems(item, tipo, containerId) {
        const isExpanded = item.subitems_expanded;
        return `
            <div class="dc-material-item-expandable">
                <label class="dc-material-item">
                    <input type="checkbox" 
                           ${item.checked ? 'checked' : ''}
                           onchange="toggleMaterialItemExpandable('${tipo}', '${item.id}', this.checked, '${containerId}')">
                    <span class="dc-material-nombre">${item.nombre}</span>
                    <button type="button" class="dc-material-expand-btn" 
                            onclick="toggleSubitems('${tipo}', '${item.id}', '${containerId}')">
                        ${isExpanded ? '▼' : '▶'}
                    </button>
                </label>
                <div class="dc-material-subitems" style="display: ${isExpanded ? 'block' : 'none'}">
                    ${(item.subitems || []).map(subitem => `
                        <label class="dc-material-subitem">
                            <input type="checkbox" 
                                   ${isSubitemSelected(item, subitem.id) ? 'checked' : ''}
                                   onchange="toggleSubitem('${tipo}', '${item.id}', '${subitem.id}', this.checked, '${containerId}')">
                            <span class="dc-material-nombre">${subitem.nombre}</span>
                            <input type="number" 
                                   class="dc-material-cantidad" 
                                   value="${getSubitemCantidad(item, subitem.id)}"
                                   min="0"
                                   onchange="updateSubitemCantidad('${tipo}', '${item.id}', '${subitem.id}', this.value, '${containerId}')">
                            <span class="dc-material-unidad">${subitem.unidad}</span>
                        </label>
                    `).join('')}
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

        const label = document.querySelector(
            `#materialLogisticaInline_${tipo} input[onchange*="${itemId}"]`
        )?.closest('label');
        const cantInput = label ? label.querySelector('.dc-material-cantidad, input[type="number"]') : null;

        if (!checked) {
            // Al desmarcar: poner cantidad en 0 visualmente
            item.cantidad = 0;
            if (cantInput) cantInput.value = 0;
        }
        // Al marcar bebidas/extras: NO autorellenar, el usuario pone la cantidad manualmente
        // El menaje se gestiona con checked:true desde autocompletarMaterialPorCategoria
    };

    window.toggleMaterialItemExpandable = function(tipo, itemId, checked, containerId) {
        const item = window.materialLogistica[tipo].find(i => i.id === itemId);
        if (item) {
            item.checked = checked;
            if (!checked) {
                item.subitems_selected = [];
                item.subitems_expanded = false;
            } else if (!item.subitems_expanded) {
                item.subitems_expanded = true;
            }
            renderizarMaterial(containerId);
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
                // Subitems de extras arrancan en 0 — el usuario pone la cantidad
                parent.subitems_selected.push({
                    id: subitem.id,
                    item_id: subitem.item_id,
                    nombre: subitem.nombre,
                    cantidad: 0,
                    unidad: subitem.unidad
                });
            }
        } else {
            parent.subitems_selected = parent.subitems_selected.filter(s => s.id !== subitemId);
        }
            // Re-añadir zumos preservados
            _zumosActuales.forEach(zumo => {
                if (!window.materialLogistica.bebidas.some(i => i._zumoId === zumo._zumoId)) {
                    window.materialLogistica.bebidas.push(zumo);
                }
            });
        }

        renderizarMaterial(containerId);
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

    window.renderizarMaterial = renderizarMaterial;

})();
