// ========== VARIABLES GLOBALES DEL FORMULARIO ==========

// Usar window para asegurar que sean globales y accesibles desde todos los archivos
if (!window.menuSeleccionado) window.menuSeleccionado = null;
if (!window.menusAdicionales) window.menusAdicionales = [];
if (!window.multiplicadores) window.multiplicadores = { saladas: 1, postres: 1 };
if (!window.pax) window.pax = 0;
if (!window.referenciasSeleccionadas) window.referenciasSeleccionadas = { gris: [], rojo: [], postres: [] };
if (!window.referenciasDesayuno) window.referenciasDesayuno = null;

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
    
}

/**
 * Actualiza las cantidades de las referencias seleccionadas
 */
function actualizarCantidadesReferencias() {
    const pax = window.pax || 0;
    
    // Actualizar cantidad en referencias saladas
    document.querySelectorAll('.referencia-option.selected').forEach(ref => {
        const cantidadInput = ref.querySelector('.cantidad-input');
        if (cantidadInput) {
            const tipo = ref.closest('#referenciasSaladasGrid') ? 'saladas' : 'postres';
            const multiplicador = window.multiplicadores ? window.multiplicadores[tipo] || 1 : 1;
            const cantidad = Math.ceil(pax * multiplicador);
            cantidadInput.value = cantidad;
            
            // Actualizar en el objeto global si existe
            if (window.referenciasSeleccionadas && window.referenciasSeleccionadas[tipo]) {
                const refId = ref.dataset.id;
                const refIndex = window.referenciasSeleccionadas[tipo].findIndex(r => r.id === refId);
                if (refIndex !== -1) {
                    window.referenciasSeleccionadas[tipo][refIndex].cantidad = cantidad;
                }
            }
        }
    });
}

/**
 * Función placeholder para actualizar cantidades de desayuno
 */
function actualizarCantidadesDesayuno() {
    const pax = window.pax || 0;
    console.log('actualizarCantidadesDesayuno llamada con PAX:', pax);
    // Implementar cuando tengas la lógica de desayunos
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
    window.menuSeleccionado = null;
    window.referenciasSeleccionadas = { gris: [], rojo: [], postres: [] };

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
            { id: 16, nombre: 'BANDEJAS PREPARADAS', descripcion: 'Seleccion de Bandejas' }
        ];
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

    // Obtener categoría
    const categoriaId = parseInt(document.getElementById('categoria').value);


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
            'coctel decuatro': { saladas: 8, postres: 2 },
            'alucinancia':     { saladas: 10, postres: 2 },
            'atractividad':    { saladas: 14, postres: 3 }
        };

        const _menuKey = _norm(window.menuSeleccionado?.nombre);
        const _rule = (categoriaId === 3) ? _serviciosRules[_menuKey] : null;

        // Si hay regla, forzamos min/max para que todo (UI + validaciones) sea coherente
        if (_rule) {
            window.menuSeleccionado.items_salados_min = _rule.saladas;
            window.menuSeleccionado.items_salados_max = _rule.saladas;
            window.menuSeleccionado.items_postres_min = _rule.postres;
            window.menuSeleccionado.items_postres_max = _rule.postres;
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

    
// ===== BANDEJAS PREPARADAS =====
if (categoriaId === 5) {
    document.getElementById('multiplicadorSection').style.display = 'none';
    document.getElementById('referenciasSection').style.display = 'none';

    const desayunoSection = document.getElementById('desayunoReferencesSection');
    if (desayunoSection) desayunoSection.style.display = 'none';

    const foodboxLunchSection2 = document.getElementById('foodboxLunchSection');
    if (foodboxLunchSection2) foodboxLunchSection2.style.display = 'none';

    // ✅ Aquí es donde se llama
    if (typeof cargarBandejasPreparadas === 'function') {
        cargarBandejasPreparadas();
    } else {
        console.error('No existe cargarBandejasPreparadas(). Revisa que bandejas-preparadas.js esté cargando bien.');
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

    const bandejasSection = document.getElementById('bandejasPreparadasSection');
    if (bandejasSection) bandejasSection.style.display = 'none';

    window.referenciasSeleccionadas = { saladas: [], postres: [] };
    window.referenciasDesayuno = {};
    if (window.BandejasState) {
        window.BandejasState.saladas.selected = [];
        window.BandejasState.dulces.selected = [];
    }

    // Limpiar items de zumo/agua y menaje inyectados por desayunos
    document.querySelectorAll('[data-zumo-id], [data-menaje-desayuno], [data-extras-desayuno], [data-menaje-foodbox], [data-extras-foodbox]').forEach(el => el.remove());

    // Limpiar zumos del estado de logística
    if (window.materialLogistica && window.materialLogistica.bebidas) {
        window.materialLogistica.bebidas = window.materialLogistica.bebidas.filter(i => !i._zumoId);
    }
}
