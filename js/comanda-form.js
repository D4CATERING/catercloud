// ========== VARIABLES GLOBALES DEL FORMULARIO ==========

// Usar window para asegurar que sean globales y accesibles desde todos los archivos
if (!window.menuSeleccionado) window.menuSeleccionado = null;
if (!window.menusAdicionales) window.menusAdicionales = [];
if (!window.multiplicadores) window.multiplicadores = { saladas: 1, postres: 1 };
if (!window.pax) window.pax = 0;
if (!window.referenciasSeleccionadas) window.referenciasSeleccionadas = { gris: [], rojo: [], postres: [] };
if (!window.referenciasDesayuno) window.referenciasDesayuno = null;

function asegurarLogisticaInlineVisible() {
    const logisticaSection = document.getElementById('logisticaInlineSection');
    const notasSection = document.getElementById('logisticaInlineNotasSection');
    if (logisticaSection) logisticaSection.style.display = 'block';
    if (notasSection) notasSection.style.display = 'block';
}

// ========== NUEVO: AÑADIR VARIABLE FOODBOX ==========
if (!window.seleccionesFoodbox) {
    window.seleccionesFoodbox = {
        ensaladas: [], // Array de objetos: {id, nombre, cantidad}
        sandwiches: [], // Array de objetos: {id, nombre, cantidad}
        postres: [], // Array de objetos: {id, nombre, cantidad}
        totalPAX: 0
    };
}

// ========== FUNCIONES PARA ACTUALIZAR CANTIDADES ==========

/**
 * Actualiza las cantidades basadas en el PAX
 */
function actualizarCantidades() {
    const pax = parseInt(document.getElementById('pax').value) || 0;
    window.pax = pax;
    
    // Actualizar valores en la interfaz
    document.querySelectorAll('#paxValue, #paxValue2').forEach(span => {
        span.textContent = pax;
    });
    
    // Actualizar cálculos de multiplicadores
    if (window.multiplicadores) {
        const multSaladas = window.multiplicadores.saladas || 1;
        const multPostres = window.multiplicadores.postres || 1;
        
        const totalSaladas = Math.ceil(pax * multSaladas);
        const totalPostres = Math.ceil(pax * multPostres);
        
        document.getElementById('totalSaladasValue').textContent = totalSaladas;
        document.getElementById('totalPostresValue').textContent = totalPostres;
        
        document.getElementById('multSaladasValue').textContent = multSaladas;
        document.getElementById('multPostresValue').textContent = multPostres;
    }
    
    // Actualizar referencias seleccionadas
    actualizarCantidadesReferencias();
    actualizarCantidadesDesayuno();
    
}

/**
 * Actualiza las cantidades de las referencias seleccionadas
 */
function actualizarCantidadesReferencias() {
    const pax = window.pax || 0;

    if (!window.referenciasSeleccionadas) return;

    const catalogos = {
        gris: typeof CATALOGO_GRIS !== 'undefined' ? CATALOGO_GRIS : [],
        rojo: typeof CATALOGO_ROJO !== 'undefined' ? CATALOGO_ROJO : [],
        postres: typeof CATALOGO_POSTRES !== 'undefined' ? CATALOGO_POSTRES : []
    };

    ['gris', 'rojo', 'postres'].forEach(tipo => {
        const catalogo = catalogos[tipo] || [];
        const seleccionadas = window.referenciasSeleccionadas[tipo] || [];

        seleccionadas.forEach(sel => {
            const ref = catalogo.find(r => String(r.id) === String(sel.id));
            if (!ref || typeof calcularCantidad !== 'function') return;
            sel.cantidad = calcularCantidad(ref, pax);
        });

        if (typeof renderReferenciasPagina === 'function') {
            renderReferenciasPagina(tipo);
            return;
        }

        document.querySelectorAll(`.referencia-option.selected[data-tipo="${tipo}"]`).forEach(card => {
            const sel = seleccionadas.find(r => String(r.id) === String(card.dataset.id));
            const input = card.querySelector('.cantidad-input');
            if (sel && input) input.value = sel.cantidad;
        });
    });
}

/**
 * Función placeholder para actualizar cantidades de desayuno
 */
function actualizarCantidadesDesayuno() {
    const esWelcomeServicio = window.serviciosMode &&
        window.menuSeleccionado?.servicio_categoria === 'welcome';

    if (!window.menuSeleccionado ||
        (parseInt(document.getElementById('categoria')?.value) !== 1 && !esWelcomeServicio) ||
        !window.referenciasDesayuno) {
        return;
    }

    const pax = window.pax || parseInt(document.getElementById('pax')?.value) || 0;
    const container = document.getElementById('referenciasDesayunoGrid');
    if (!container) return;

    container.querySelectorAll('.dc-item-bubble').forEach(item => {
        const refId = item.dataset.id;
        const tipo = item.dataset.tipo;
        const refData = window.referenciasDesayuno[refId];
        const input = item.querySelector('.dc-input-qty, .cantidad-input-compact');

        if (!refData || !input || tipo === 'leche_especial') return;

        const baseCantidad = parseFloat(input.dataset.base || refData.cantidadPorPax) || 0;
        let nuevaCantidad = 0;

        if (tipo === 'termo') {
            nuevaCantidad = refId.includes('_cafe')
                ? Math.ceil(pax / 10)
                : Math.ceil(pax / 20);
        } else {
            nuevaCantidad = Math.ceil(pax * baseCantidad);
        }

        input.value = nuevaCantidad;
        refData.cantidad = nuevaCantidad;

        const sandwiches = refData.sandwiches || [];
        if ((tipo === 'sandwich_multiple' || (tipo === 'sandwich_o_pulguita' && refData.modo !== 'pulguita')) && sandwiches.length) {
            const sandwichesConSabor = sandwiches.filter(s => s.sabor);
            if (sandwichesConSabor.length > 0) {
                const base = Math.floor(nuevaCantidad / sandwichesConSabor.length);
                const resto = nuevaCantidad % sandwichesConSabor.length;
                sandwichesConSabor.forEach((s, index) => {
                    s.cantidad = base + (index < resto ? 1 : 0);
                });
            }
        }
    });

    actualizarCantidadesLogisticaIncluidaDesayuno(pax);
}

function actualizarCantidadesLogisticaIncluidaDesayuno(pax) {
    if (!window.materialLogistica) return;

    (window.materialLogistica.bebidas || []).forEach(item => {
        if (!item._zumoId) return;
        const ref = window.referenciasDesayuno?.[item._zumoId];
        const cantidadPorPax = Number(ref?.cantidadPorPax ?? item.cantidadPorPax ?? 0);
        const cantidad = cantidadPorPax > 0 ? Math.ceil(pax * cantidadPorPax) : (ref?.cantidad ?? item.cantidad ?? 0);
        item.cantidad = cantidad;
        if (ref) ref.cantidad = cantidad;
    });

    (window.materialLogistica.menaje || []).forEach(item => {
        const incluidoEnDesayuno = item.checked && (
            item._menaje_desayuno ||
            item.incluido_en?.includes?.('desayunos')
        );

        if (incluidoEnDesayuno) item.cantidad = pax;
    });

    document.querySelectorAll('[data-zumo-id], [data-menaje-desayuno]').forEach(el => {
        const input = el.querySelector('.dc-material-cantidad, input[type="number"]');
        if (!input) return;

        if (el.hasAttribute('data-zumo-id')) {
            const ref = window.referenciasDesayuno?.[el.getAttribute('data-zumo-id')];
            const item = (window.materialLogistica.bebidas || []).find(b => b._zumoId === el.getAttribute('data-zumo-id'));
            input.value = item?.cantidad ?? ref?.cantidad ?? input.value;
        } else {
            input.value = pax;
        }
    });

    if (typeof window.renderizarMaterial === 'function') {
        window.renderizarMaterial('materialLogisticaInline');
    }
}

/**
 * Actualiza el multiplicador y recalcula cantidades
 */
function actualizarMultiplicador(tipo, valor) {
    if (!window.multiplicadores) window.multiplicadores = { saladas: 1, postres: 1 };
    
    window.multiplicadores[tipo] = parseFloat(valor) || 1;
    
    // Actualizar visualización
    if (tipo === 'saladas') {
        document.getElementById('multSaladasValue').textContent = window.multiplicadores.saladas;
        const pax = window.pax || 0;
        document.getElementById('totalSaladasValue').textContent = Math.ceil(pax * window.multiplicadores.saladas);
    } else if (tipo === 'postres') {
        document.getElementById('multPostresValue').textContent = window.multiplicadores.postres;
        const pax = window.pax || 0;
        document.getElementById('totalPostresValue').textContent = Math.ceil(pax * window.multiplicadores.postres);
    }
    
    // Actualizar cantidades en referencias seleccionadas
    actualizarCantidadesReferencias();
}

// ========== CARGAR MENÚS PRINCIPALES ==========

/**
 * Carga los menús según la categoría seleccionada
 */
async function cargarMenus() {
    const categoriaId = document.getElementById('categoria').value;
    const container = document.getElementById('menusContainer');
    container.innerHTML = '';
    
    document.getElementById('multiplicadorSection').style.display = 'none';
    document.getElementById('referenciasSection').style.display = 'none';
    if (typeof limpiarSeccionesMenu === 'function') limpiarSeccionesMenu();
    window.menuSeleccionado = null;
    window.referenciasSeleccionadas = { gris: [], rojo: [], postres: [], saladas: [] };

    // PAX + botón: visible si hay categoría, oculto si se deselecciona
    const btnWrap = document.getElementById('btnAnadirMenuWrap');
    if (btnWrap) btnWrap.style.display = categoriaId ? 'flex' : 'none';
    // Limpiar paginación de referencias
    if (window.referenciasPaginacion) {
        ['gris', 'rojo', 'postres'].forEach(tipo => {
            if (window.referenciasPaginacion[tipo]) {
                window.referenciasPaginacion[tipo].page = 1;
                window.referenciasPaginacion[tipo].query = '';
                window.referenciasPaginacion[tipo].items = [];
            }
            const containerId = tipo === 'gris' ? 'referenciasGrisGrid'
                              : tipo === 'rojo' ? 'referenciasRojoGrid'
                              : 'referenciasPostresGrid';
            const grid = document.getElementById(containerId);
            if (grid) grid.innerHTML = '';
        });
    }
    // Limpiar buscadores
    ['referenciasGrisGrid__search','referenciasRojoGrid__search','referenciasPostresGrid__search'].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.value = '';
    });
    // Limpiar zumos de logística
    if (window.materialLogistica?.bebidas) {
        window.materialLogistica.bebidas = window.materialLogistica.bebidas.filter(i => !i._zumoId);
    }
    
    if (!categoriaId) return;
    
    let menus = [];
    
    if (categoriaId == 1) {
        menus = [
            { id: 17, nombre: 'WELCOME COFFEE & COFFEE BREAK', descripcion: 'Termo café + leche + 2 mini cookies o pastas de té + 1 mini bolleríía + agua mineral' },
            { id: 1, nombre: 'HEALTHY', descripcion: 'Termo café + leche + infusión + tostada aguacate y tomate + fruta + bolleríía + mini sándwich + zumo naranja' },
            { id: 2, nombre: 'CLASSIC', descripcion: 'Termo café + leche + infusión + 2 mini bollerías + 2 sándwiches + fruta preparada + zumo naranja' },
            { id: 3, nombre: 'PREMIUM', descripcion: 'Termo café + leche + infusión + cookie/muffin + bolleríía + 2 sándwiches ó 1 pulguita + fruta/yogur + smoothie' },
            { id: 4, nombre: 'VEGGIE', descripcion: 'Termo café + leche vegetal + infusión + cookie vegana + sándwich vegetal + sándwich aguacate-tomate + fruta + zumo naranja' }
        ];
    }
    else if (categoriaId == 2) {
        menus = [
            { id: 18, nombre: 'BASIC', descripcion: '5 ref. grises + 1 ref. roja', items_gris_max: 5, items_rojo_max: 1, items_postres_min: 0, items_postres_max: 0, mult_postres: 1 },
            { id: 5,  nombre: 'ECONÓMICO', descripcion: '5 ref. grises + 2 ref. rojas + 1 postre', items_gris_max: 5, items_rojo_max: 2, items_postres_min: 1, items_postres_max: 1, mult_postres: 1 },
            { id: 6,  nombre: 'MEDIO', descripcion: '6 ref. grises + 4 ref. rojas + 2 postres', items_gris_max: 6, items_rojo_max: 4, items_postres_min: 2, items_postres_max: 2, mult_postres: 1 },
            { id: 7,  nombre: 'MUYTOP', descripcion: '8 ref. grises + 7 ref. rojas + 3 postres', items_gris_max: 8, items_rojo_max: 7, items_postres_min: 3, items_postres_max: 3, mult_postres: 0.75 },
            { id: 8,  nombre: 'VEGGIE', descripcion: '6 ref. grises sin rojas', items_gris_max: 6, items_rojo_max: 0, items_postres_min: 0, items_postres_max: 0, mult_postres: 1 }
        ];
    }
    else if (categoriaId == 3) {
        menus = [
            { id: 9, nombre: 'AFTERWORK', descripcion: '6 items salados', items_salados_min: 6, items_salados_max: 6 },
            { id: 10, nombre: 'VINOESPAÑOL', descripcion: '7 items salados', items_salados_min: 7, items_salados_max: 7 },
            { id: 11, nombre: 'NETWORKING', descripcion: '6 items salados', items_salados_min: 6, items_salados_max: 6 },
            { id: 12, nombre: 'COCTEL DECUATRO', descripcion: '9 items salados', items_salados_min: 9, items_salados_max: 9 },
            { id: 13, nombre: 'ALUCINANCIA', descripcion: '12 items salados', items_salados_min: 12, items_salados_max: 12 },
            { id: 14, nombre: 'ATRACTIVIDAD', descripcion: '17 items salados', items_salados_min: 17, items_salados_max: 17 }
        ];
    }
    else if (categoriaId == 4) {
        menus = [
            {
                id: 15,
                nombre: 'FOODBOX LUNCH',
                descripcion: 'Elige una ensalada o un sándwich + postre + bebida',
                tipo: 'foodbox_lunch',
                items_salados_min: 0,
                items_salados_max: 0,
                items_postres_min: 0,
                items_postres_max: 0
            }
        ];
    }
    else if (categoriaId == 5) {
        menus = [
            { id: 16, nombre: 'DO IT YOURSELF DESAYUNOS', descripcion: 'Bandejas de desayuno para montar', _cat: 5 },
            { id: 17, nombre: 'DO IT YOURSELF FOODBOX',   descripcion: 'Bandejas foodbox para montar',    _cat: 6 }
        ];
    }
    
    if (categoriaId == 3 && window.serviciosMode) {
        const servicioTipo = document.getElementById('serviciosCategoria')?.value || '';
        if (!servicioTipo) {
            container.innerHTML = '';
            return;
        }
        if (servicioTipo === 'welcome') {
            menus = [
                {
                    id: 17,
                    nombre: 'WELCOME COFFEE & COFFEE BREAK',
                    descripcion: 'Termo café + leche + 2 mini cookies o pastas de té + 1 mini bollería + agua mineral',
                    servicio_categoria: 'welcome',
                    _cat: 1,
                    omitir_material_menu: true
                }
            ];
        } else if (servicioTipo === 'vino') {
            menus = [
                { id: 301, nombre: 'BRINDIS', descripcion: 'Vino Español · selección de 4 ítems', items_salados_min: 4, items_salados_max: 4, servicio_categoria: 'vino' },
                { id: 302, nombre: 'NETWORKING', descripcion: 'Vino Español · selección de 6 ítems', items_salados_min: 6, items_salados_max: 6, servicio_categoria: 'vino' },
                { id: 303, nombre: 'AFTERWORK', descripcion: 'Vino Español · selección de 8 ítems', items_salados_min: 8, items_salados_max: 8, servicio_categoria: 'vino' }
            ];
        } else {
            menus = [
                { id: 13, nombre: 'ALUCINANCIA', descripcion: '10 referencias saladas + 1 postre', items_salados_min: 10, items_salados_max: 10, items_postres_min: 1, items_postres_max: 1, mult_postres: 1, servicio_categoria: 'cocteles' },
                { id: 12, nombre: 'DECUATRO', descripcion: '12 referencias saladas + 2 postres · postres 0.75/pax', items_salados_min: 12, items_salados_max: 12, items_postres_min: 2, items_postres_max: 2, mult_postres: 0.75, servicio_categoria: 'cocteles' },
                { id: 14, nombre: 'ATRACTIVIDAD', descripcion: '14 referencias saladas + 3 postres · postres 0.5/pax', items_salados_min: 14, items_salados_max: 14, items_postres_min: 3, items_postres_max: 3, mult_postres: 0.5, servicio_categoria: 'cocteles' }
            ];
        }
    }

    mostrarMenusPrincipales(menus);
}

/**
 * Muestra los menús en el contenedor
 */
function mostrarMenusPrincipales(menus) {
    const container = document.getElementById('menusContainer');
    
    if (menus.length === 0) {
        container.innerHTML = '<p style="color: #94a3b8; text-align: center; font-size: 0.9rem;">No hay menús disponibles</p>';
        return;
    }
    
    let html = '';
    
    menus.forEach(menu => {
        html += `
        <div class="menu-option" onclick="seleccionarMenu(${menu.id}, this)" data-menu='${JSON.stringify(menu)}'>
            <h4>${menu.nombre}</h4>
            <p>${menu.descripcion || 'Sin descripción'}</p>
            ${menu.items_salados_min > 0 ?
                `<p style="font-size: 0.75rem; color: #64748b; margin-top: 3px;">
                    📋 ${menu.items_salados_min}-${menu.items_salados_max} salados
                    ${menu.items_postres_min > 0 ? `, ${menu.items_postres_min}-${menu.items_postres_max} postres` : ''}
                </p>` : ''
            }
        </div>
        `;
    });
    
    container.innerHTML = html;
}

/**
 * Selecciona un menú principal
 */
async function seleccionarMenu(menuId, element) {
    // Limpiar secciones, bebidas y menaje del menú anterior
    document.querySelectorAll('[data-zumo-id], [data-menaje-desayuno], [data-extras-desayuno], [data-menaje-foodbox], [data-extras-foodbox]').forEach(el => el.remove());
    if (typeof limpiarSeccionesMenu === 'function') limpiarSeccionesMenu();

    // UI: selección
    document.querySelectorAll('.menu-option').forEach(opt => {
        opt.classList.remove('selected');
    });

    element.classList.add('selected');

    // Estado global
    window.menuSeleccionado = JSON.parse(element.dataset.menu);
    document.getElementById('menu_id').value = menuId;
    window.pax = parseInt(document.getElementById('pax').value) || 0;

    // Aplicar tipo de menaje ya seleccionado a los termos y material
    if (typeof window.actualizarTipoMenajeGlobal === 'function') {
        // Dos pasadas: una rápida para material y una más tarde cuando los termos ya están en DOM
        setTimeout(() => window.actualizarTipoMenajeGlobal(), 200);
        setTimeout(() => window.actualizarTipoMenajeGlobal(), 600);
    }

    // Obtener categoría — para DIY usar _cat del menu si existe
    const categoriaId = window.menuSeleccionado?._cat
        || parseInt(document.getElementById('categoria').value);

    asegurarLogisticaInlineVisible();


    // ===== DESAYUNOS =====
    if (categoriaId === 1) {
        // Ocultar secciones de Foodbox/Comida
        document.getElementById('multiplicadorSection').style.display = 'none';
        document.getElementById('referenciasSection').style.display = 'none';

        // Mostrar/crear sección de desayuno
        let desayunoSection = document.getElementById('desayunoReferencesSection');
        if (!desayunoSection) {
            const antesDeNotas = document.querySelector('#referenciasSection');

            if (antesDeNotas) {
                antesDeNotas.insertAdjacentHTML('afterend', `
                    <div class="form-section dc-section" id="desayunoReferencesSection" style="display: block;">
                        <div class="dc-section-header">
                            <h3>🥐 Referencias del Desayuno</h3>
                        </div>
                        <p style="font-size: 0.75rem; color: #64748b; margin-bottom: 15px;">Cantidades por persona. Puedes modificar si es necesario:</p>
                        <div id="referenciasDesayunoGrid" class="dc-items-grid"></div>
                    </div>
                `);
            }

            desayunoSection = document.getElementById('desayunoReferencesSection');
        } else {
            desayunoSection.style.display = 'block';
        }

        // Seleccionar desechable por defecto si no hay tipo de menaje elegido
        const selectMenaje = document.getElementById('tipo_menaje');
        if (selectMenaje && !selectMenaje.value) {
            selectMenaje.value = 'desechable';
        }

        if (!window.menuSeleccionado?.omitir_material_menu) {
            // Mostrar solo el material (logística siempre visible)
            const materialInline = document.getElementById('materialLogisticaInline');
            if (materialInline) materialInline.style.display = 'block';

            // Inicializar logística para desayunos (crea materialLogisticaInline_bebidas)
            if (typeof inicializarMaterialLogistica === 'function') {
                await inicializarMaterialLogistica('materialLogisticaInline');
                if (typeof autocompletarMaterialPorCategoria === 'function') {
                    await autocompletarMaterialPorCategoria(1, 'materialLogisticaInline');
                }
            }
        } else {
            const materialInline = document.getElementById('materialLogisticaInline');
            if (materialInline) {
                materialInline.style.display = 'none';
                materialInline.innerHTML = '';
            }
            if (typeof window.limpiarMaterialLogistica === 'function') window.limpiarMaterialLogistica();
        }

        // Cargar referencias del desayuno (zumo/agua se inyectan en _bebidas)
        if (typeof cargarReferenciasDesayuno === 'function') {
            cargarReferenciasDesayuno(window.menuSeleccionado);
        } else {
            console.error('No existe cargarReferenciasDesayuno(). Falta importar/definir el módulo de desayunos.');
        }

        return;
    }

    // ===== FOODBOX/COMIDA y SERVICIOS =====
    if (categoriaId === 2 || categoriaId === 3) {
        // Ocultar sección de desayunos si existe
        const desayunoSection = document.getElementById('desayunoReferencesSection');
        if (desayunoSection) {
            desayunoSection.style.display = 'none';
        }

        // Reglas específicas para SERVICIOS (cat 3)
        const _norm = (s) => (s || '').toString().trim().toLowerCase()
            .normalize('NFD').replace(/[\u0300-\u036f]/g, '');
        const _serviciosRules = {
            'decuatro':        { saladas: 12, postres: 2, multPostres: 0.75 },
            'coctel decuatro': { saladas: 12, postres: 2, multPostres: 0.75 },
            'alucinancia':     { saladas: 10, postres: 1, multPostres: 1 },
            'atractividad':    { saladas: 14, postres: 3, multPostres: 0.5 }
        };

        const _menuKey = _norm(window.menuSeleccionado?.nombre);
        const _rule = (categoriaId === 3) ? _serviciosRules[_menuKey] : null;

        // Si hay regla, forzamos min/max para que todo (UI + validaciones) sea coherente
        if (_rule) {
            window.menuSeleccionado.items_salados_min = _rule.saladas;
            window.menuSeleccionado.items_salados_max = _rule.saladas;
            window.menuSeleccionado.items_postres_min = _rule.postres;
            window.menuSeleccionado.items_postres_max = _rule.postres;
            window.menuSeleccionado.mult_postres = _rule.multPostres;
        }

        // Multiplicador desactivado para cat 2 y 3
        document.getElementById('multiplicadorSection').style.display = 'none';

        if (window.pax > 0) {
            if (typeof actualizarCantidades === 'function') {
                actualizarCantidades();
            }
        }

        document.getElementById('referenciasSection').style.display = 'block';

        if (typeof cargarReferencias === 'function') {
            await cargarReferencias();
        } else {
            console.error('No existe cargarReferencias(). Falta importar/definir el módulo de referencias.');
            return;
        }

        // Compatibilidad con campos de UI existentes
        const _grisMax = window.menuSeleccionado.items_gris_max || window.menuSeleccionado.items_salados_max || 0;
        const _rojoMax = window.menuSeleccionado.items_rojo_max || 0;
        document.getElementById('minSaladas').textContent = _grisMax;
        document.getElementById('maxSaladas').textContent = _grisMax;
        window.menuSeleccionado.items_salados_max = _grisMax;
        window.menuSeleccionado.items_salados_min = _grisMax;

        // Mostrar/ocultar sección de rojas
        const _rojasGroup = document.getElementById('referenciasRojasGroup');
        if (_rojasGroup) {
            _rojasGroup.style.display = (window.menuSeleccionado.items_rojo_max || 0) > 0 ? 'block' : 'none';
        }

        // Mostrar/ocultar sección de postres
        if ((window.menuSeleccionado.items_postres_min || 0) > 0) {
            document.getElementById('referenciasPostresGroup').style.display = 'block';
            document.getElementById('minPostres').textContent = window.menuSeleccionado.items_postres_min;
            document.getElementById('maxPostres').textContent = window.menuSeleccionado.items_postres_max;
        } else {
            document.getElementById('referenciasPostresGroup').style.display = 'none';
        }

        // Inicializar logística para Foodbox/Comida (2) y Servicios (3)
        // setTimeout para asegurar que el DOM esté listo antes de renderizar
        const _catId = categoriaId;
        if (!(categoriaId === 3 && window.serviciosMode)) {
        setTimeout(async () => {
            // Solo mostrar el material (logística siempre visible)
            const matInline = document.getElementById('materialLogisticaInline');
            if (matInline) matInline.style.display = 'block';
            if (typeof inicializarMaterialLogistica === 'function') {
                await inicializarMaterialLogistica('materialLogisticaInline');
                if (typeof autocompletarMaterialPorCategoria === 'function') {
                    await autocompletarMaterialPorCategoria(_catId, 'materialLogisticaInline');
                }
            }
        }, 100);
        }

        return;
    }

    
    // ===== FOODBOX LUNCH =====
    if (categoriaId === 4) {
        document.getElementById('multiplicadorSection').style.display = 'none';
        document.getElementById('referenciasSection').style.display = 'none';
        
        const desayunoSection = document.getElementById('desayunoReferencesSection');
        if (desayunoSection) desayunoSection.style.display = 'none';
        
        if (typeof cargarOpcionesFoodboxLunch === 'function') {
            cargarOpcionesFoodboxLunch();
            // La logística (logisticaInlineSection + materialLogisticaInline)
            // la muestra e inicializa foodbox-lunch.js en su propio setTimeout
        } else {
            console.error('No existe cargarOpcionesFoodboxLunch()');
        }

        return;
    }

    
// ===== DO IT YOURSELF DESAYUNOS (Cat 5) =====
if (categoriaId === 5) {
    document.getElementById('multiplicadorSection').style.display = 'none';
    document.getElementById('referenciasSection').style.display = 'none';
    const desayunoSection = document.getElementById('desayunoReferencesSection');
    if (desayunoSection) desayunoSection.style.display = 'none';
    const foodboxSection = document.getElementById('foodboxLunchSection');
    if (foodboxSection) foodboxSection.remove();
    const diyFoodboxSection = document.getElementById('diyFoodboxSection');
    if (diyFoodboxSection) diyFoodboxSection.remove();

    if (typeof cargarDIYDesayunos === 'function') {
        await cargarDIYDesayunos();
    } else {
        console.error('cargarDIYDesayunos() no encontrado. Revisa bandejas-preparadas.js');
    }

    // Mostrar logística inline igual que Foodbox/Comida
    const logSecDIY5 = document.getElementById('logisticaInlineSection');
    if (logSecDIY5) logSecDIY5.style.display = 'block';
    const matInlineDIY5 = document.getElementById('materialLogisticaInline');
    if (matInlineDIY5) matInlineDIY5.style.display = 'block';
    if (typeof inicializarMaterialLogistica === 'function') {
        await inicializarMaterialLogistica('materialLogisticaInline');
        if (typeof autocompletarMaterialPorCategoria === 'function') {
            await autocompletarMaterialPorCategoria(5, 'materialLogisticaInline');
        }
    }
    return;
}

// ===== DO IT YOURSELF FOODBOX (Cat 6) =====
if (categoriaId === 6) {
    document.getElementById('multiplicadorSection').style.display = 'none';
    document.getElementById('referenciasSection').style.display = 'none';
    const desayunoSection = document.getElementById('desayunoReferencesSection');
    if (desayunoSection) desayunoSection.style.display = 'none';
    const foodboxSection = document.getElementById('foodboxLunchSection');
    if (foodboxSection) foodboxSection.remove();
    const diyDesayunosSection = document.getElementById('diyDesayunosSection');
    if (diyDesayunosSection) diyDesayunosSection.remove();

    if (typeof cargarDIYFoodbox === 'function') {
        await cargarDIYFoodbox();
    } else {
        console.error('cargarDIYFoodbox() no encontrado. Revisa bandejas-preparadas.js');
    }

    // Mostrar logística inline igual que Foodbox/Comida
    const logSecDIY6 = document.getElementById('logisticaInlineSection');
    if (logSecDIY6) logSecDIY6.style.display = 'block';
    const matInlineDIY6 = document.getElementById('materialLogisticaInline');
    if (matInlineDIY6) matInlineDIY6.style.display = 'block';
    if (typeof inicializarMaterialLogistica === 'function') {
        await inicializarMaterialLogistica('materialLogisticaInline');
        if (typeof autocompletarMaterialPorCategoria === 'function') {
            await autocompletarMaterialPorCategoria(6, 'materialLogisticaInline');
        }
    }
    return;
}

    // ===== OTRAS (p.ej. Bandejas) =====
    document.getElementById('multiplicadorSection').style.display = 'none';
    document.getElementById('referenciasSection').style.display = 'none';

    const desayunoSection = document.getElementById('desayunoReferencesSection');
    if (desayunoSection) {
        desayunoSection.style.display = 'none';
    }

}

function limpiarSeccionesMenu() {
    const desayunoSection = document.getElementById('desayunoReferencesSection');
    if (desayunoSection) {
        desayunoSection.style.display = 'none';
        const grid = document.getElementById('referenciasDesayunoGrid');
        if (grid) grid.innerHTML = '';
    }

    const multiplicadorSection = document.getElementById('multiplicadorSection');
    if (multiplicadorSection) multiplicadorSection.style.display = 'none';

    const referenciasSection = document.getElementById('referenciasSection');
    if (referenciasSection) referenciasSection.style.display = 'none';

    const foodboxSection = document.getElementById('foodboxLunchSection');
    if (foodboxSection) foodboxSection.remove();

    const diyDesayunosSection = document.getElementById('diyDesayunosSection');
    if (diyDesayunosSection) diyDesayunosSection.remove();
    const diyFoodboxSection = document.getElementById('diyFoodboxSection');
    if (diyFoodboxSection) diyFoodboxSection.remove();

    window.referenciasSeleccionadas = { gris: [], rojo: [], postres: [], saladas: [] };
    window.referenciasDesayuno = {};
    if (window.BandejasState) {
        ['diy_dulces','diy_salados','diy_termos','diy_servicio',
         'diy_fb_saladas','diy_fb_postres'].forEach(k => {
            if (window.BandejasState[k]) window.BandejasState[k].selected = [];
        });
    }

    // Limpiar items de zumo/agua y menaje inyectados por desayunos
    document.querySelectorAll('[data-zumo-id], [data-menaje-desayuno], [data-extras-desayuno], [data-menaje-foodbox], [data-extras-foodbox]').forEach(el => el.remove());

    // Limpiar zumos del estado de logística
    if (window.materialLogistica && window.materialLogistica.bebidas) {
        window.materialLogistica.bebidas = window.materialLogistica.bebidas.filter(i => !i._zumoId);
    }
}
