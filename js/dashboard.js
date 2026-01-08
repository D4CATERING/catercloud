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
        window.referenciasSeleccionadas = { saladas: [], postres: [] };
        window.multiplicadores = { saladas: 1, postres: 1 };
        if (typeof actualizarListaMenusAdicionales === 'function') {
            actualizarListaMenusAdicionales();
        }
    }
}

/**
 * Muestra el módulo de logística
 */
function mostrarLogistica() {
    alert('🚚 Módulo de Logística - En desarrollo\nPróximamente disponible');
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
    
    window.comandaEditando = null;
    
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