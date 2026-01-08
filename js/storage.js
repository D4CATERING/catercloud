// ========== STORAGE (LOCALSTORAGE) ==========

/**
 * Guarda una comanda en el historial
 * @param {Object} comandaData - Datos de la comanda
 * @returns {string} Código generado
 */
function guardarComandaEnHistorial(comandaData) {
    const historial = JSON.parse(localStorage.getItem('historialComandas') || '[]');
    const codigo = generarCodigoComanda();
    
    const comandaCompleta = {
        ...comandaData,
        codigo: codigo,
        fecha_creacion: new Date().toISOString(),
        fecha_modificacion: new Date().toISOString(),
        estado: 'creada',
        version: 1
    };
    
    historial.push(comandaCompleta);
    localStorage.setItem('historialComandas', JSON.stringify(historial));
    
    return codigo;
}

/**
 * Actualiza una comanda existente
 * @param {string} codigo - Código de la comanda
 * @param {Object} nuevosDatos - Nuevos datos
 * @returns {boolean} True si se actualizó correctamente
 */
function actualizarComandaEnHistorial(codigo, nuevosDatos) {
    const historial = JSON.parse(localStorage.getItem('historialComandas') || '[]');
    const index = historial.findIndex(c => c.codigo === codigo);
    
    if (index !== -1) {
        historial[index] = {
            ...historial[index],
            ...nuevosDatos,
            fecha_modificacion: new Date().toISOString(),
            version: historial[index].version + 1
        };
        
        localStorage.setItem('historialComandas', JSON.stringify(historial));
        return true;
    }
    
    return false;
}

/**
 * Obtiene una comanda del historial
 * @param {string} codigo - Código de la comanda
 * @returns {Object|null} Comanda o null
 */
function obtenerComandaDelHistorial(codigo) {
    const historial = JSON.parse(localStorage.getItem('historialComandas') || '[]');
    return historial.find(c => c.codigo === codigo);
}

/**
 * Elimina una comanda del historial
 * @param {string} codigo - Código de la comanda
 */
function eliminarComandaDelHistorial(codigo) {
    const historial = JSON.parse(localStorage.getItem('historialComandas') || '[]');
    const nuevoHistorial = historial.filter(c => c.codigo !== codigo);
    localStorage.setItem('historialComandas', JSON.stringify(nuevoHistorial));
}

/**
 * Obtiene todo el historial de comandas
 * @returns {Array} Lista de comandas
 */
function obtenerHistorialCompleto() {
    return JSON.parse(localStorage.getItem('historialComandas') || '[]');
}

/**
 * Genera un código único para la comanda
 * @returns {string} Código generado
 */
function generarCodigoComanda() {
    const año = new Date().getFullYear();
    const lastCounter = localStorage.getItem('contadorComandas');
    const lastYear = localStorage.getItem('ultimoAñoComandas');
    
    let contador;
    
    if (lastYear === año.toString()) {
        contador = parseInt(lastCounter) + 1;
    } else {
        contador = 1;
    }
    
    localStorage.setItem('contadorComandas', contador.toString());
    localStorage.setItem('ultimoAñoComandas', año.toString());
    
    return `D4${año}${contador.toString().padStart(4, '0')}`;
}

/**
 * Inicializa el contador si no existe
 */
function inicializarContador() {
    if (!localStorage.getItem('contadorComandas')) {
        localStorage.setItem('contadorComandas', '0');
    }
}

/**
 * Guarda eventos en el calendario
 * @param {Object} eventos - Eventos del calendario
 */
function guardarEventosCalendario(eventos) {
    localStorage.setItem('calendarioEventos', JSON.stringify(eventos));
}

/**
 * Carga eventos del calendario
 * @returns {Object} Eventos del calendario
 */
function cargarEventosCalendario() {
    return JSON.parse(localStorage.getItem('calendarioEventos') || '{}');
}