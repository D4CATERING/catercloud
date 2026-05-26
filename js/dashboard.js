// ========== NAVEGACIÓN PRINCIPAL ==========

/**
 * Muestra el formulario de comanda de cocina
 */
function mostrarComandaCocina() {
    document.getElementById('dashboard').style.display = 'none';
    document.getElementById('comandaForm').style.display = 'block';

    const hoy = new Date().toISOString().split('T')[0];
    document.getElementById('fecha_evento').value = hoy;
    
    // Limpiar formulario si no estamos editando
    if (!window.comandaEditando) {
        document.getElementById('comandaCocinaForm').reset();
        window.menuSeleccionado = null;
        window.menusAdicionales = [];
        window.referenciasSeleccionadas = { gris: [], rojo: [], postres: [] };
        window.multiplicadores = { saladas: 1, postres: 1 };
        window.pax = 0;
        // Limpiar grids visuales, paginación e items
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
        // Limpiar selección visual de menús
        document.querySelectorAll('.menu-option.selected').forEach(el => el.classList.remove('selected'));
        // Limpiar zumos de logística
        if (window.materialLogistica?.bebidas) {
            window.materialLogistica.bebidas = window.materialLogistica.bebidas.filter(i => !i._zumoId);
        }
        if (typeof actualizarListaMenusAdicionales === 'function') {
            actualizarListaMenusAdicionales();
        }
    }
}

/**
 * Muestra el módulo de logística
 */
function mostrarLogistica() {
    if (typeof mostrarMensaje === 'function') {
        mostrarMensaje('🚚 Módulo de Logística - En desarrollo. Próximamente disponible', 'info');
    } else {
        alert('🚚 Módulo de Logística - En desarrollo\nPróximamente disponible');
    }
}

/**
 * Muestra el historial de comandas
 */
function mostrarHistorial() {
    document.getElementById('dashboard').style.display = 'none';
    document.getElementById('historialPage').style.display = 'block';
    
    if (typeof cargarHistorial === 'function') {
        cargarHistorial();
    }
}

/**
 * Vuelve al dashboard principal
 */
function volverAlDashboard() {
    document.getElementById('dashboard').style.display = 'block';
    document.getElementById('comandaForm').style.display = 'none';
    document.getElementById('historialPage').style.display = 'none';
    document.getElementById('detalleComanda').style.display = 'none';
    const clientesPanel = document.getElementById('clientesPanel');
    if (clientesPanel) clientesPanel.style.display = 'none';

    window.comandaEditando = null;
    window.menuSeleccionado = null;
    window.referenciasSeleccionadas = { gris: [], rojo: [], postres: [] };
    window.pax = 0;

    // Limpiar formulario
    const form = document.getElementById('comandaCocinaForm');
    if (form) form.reset();

    // Limpiar selector de categoría y menús
    const catSelect = document.getElementById('categoria');
    if (catSelect) catSelect.value = '';
    const menusContainer = document.getElementById('menusContainer');
    if (menusContainer) menusContainer.innerHTML = '';

    // Limpiar secciones DIY
    const diyDesayunosSection = document.getElementById('diyDesayunosSection');
    if (diyDesayunosSection) diyDesayunosSection.remove();
    const diyFoodboxSection = document.getElementById('diyFoodboxSection');
    if (diyFoodboxSection) diyFoodboxSection.remove();

    // Limpiar estado de BandejasState
    if (window.BandejasState) {
        ['diy_dulces','diy_salados','diy_termos',
         'diy_fb_saladas','diy_fb_postres'].forEach(k => {
            if (window.BandejasState[k]) {
                window.BandejasState[k].items = [];
                window.BandejasState[k].selected = [];
            }
        });
    }

    // Limpiar material de logística
    if (typeof window.limpiarMaterialLogistica === 'function') {
        window.limpiarMaterialLogistica();
    }
    const matInline = document.getElementById('materialLogisticaInline');
    if (matInline) {
        matInline.style.display = 'none';
        matInline.innerHTML = '';
    }
    const logisticaSection = document.getElementById('logisticaInlineSection');
    if (logisticaSection) logisticaSection.style.display = 'none';

    // Limpiar secciones de referencias y multiplicadores
    const multiplicadorSection = document.getElementById('multiplicadorSection');
    if (multiplicadorSection) multiplicadorSection.style.display = 'none';
    const referenciasSection = document.getElementById('referenciasSection');
    if (referenciasSection) referenciasSection.style.display = 'none';

    // Limpiar zumos de logística
    if (window.materialLogistica?.bebidas) {
        window.materialLogistica.bebidas = window.materialLogistica.bebidas.filter(i => !i._zumoId);
    }

    // Limpiar campos de logística inline
    if (typeof limpiarCamposLogisticaInline === 'function') limpiarCamposLogisticaInline();

    // Limpiar resumen lateral
    if (typeof window.resetearMenusAcumulados === 'function') window.resetearMenusAcumulados();

    if (typeof cargarCalendario === 'function') {
        cargarCalendario();
    }
}

/**
 * Vuelve al historial desde el detalle
 */
function volverAlHistorial() {
    document.getElementById('historialPage').style.display = 'block';
    document.getElementById('detalleComanda').style.display = 'none';
    
    if (typeof cargarHistorial === 'function') {
        cargarHistorial();
    }
}

/**
 * Inicializa el material de logística inline cuando se selecciona categoría
 * Se llama desde comanda-form.js o referencias.js al cargar menús
 */
function inicializarMaterialLogisticaInline(categoriaId) {
    const container = document.getElementById('materialLogisticaInline');
    const seccionLog = document.getElementById('logisticaInlineSection');
    
    if (!container) return;
    
    // Solo mostrar si la sección de logística inline está visible
    if (seccionLog && seccionLog.style.display !== 'none') {
        container.style.display = 'block';
        
        // Inicializar tabla
        if (typeof window.inicializarMaterialLogistica === 'function') {
            window.inicializarMaterialLogistica('materialLogisticaInline');
        }
        
        // Autocompletar según categoría
        if (typeof window.autocompletarMaterialPorCategoria === 'function' && categoriaId) {
            window.autocompletarMaterialPorCategoria(categoriaId, 'materialLogisticaInline');
        }
    } else {
        container.style.display = 'none';
    }
}

/**
 * Inicializa el material para la página separada de logística (Cocteles)
 */
function inicializarMaterialLogisticaPage(categoriaId) {
    const container = document.getElementById('materialLogisticaPage');
    if (!container) return;
    
    // Inicializar tabla
    if (typeof window.inicializarMaterialLogistica === 'function') {
        window.inicializarMaterialLogistica('materialLogisticaPage');
    }
    
    // Autocompletar según categoría (cat 3 = servicios)
    if (typeof window.autocompletarMaterialPorCategoria === 'function' && categoriaId) {
        window.autocompletarMaterialPorCategoria(categoriaId, 'materialLogisticaPage');
    }
}
