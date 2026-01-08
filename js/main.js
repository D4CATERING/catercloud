// ========== CONFIGURACIÓN INICIAL ==========

// Variable global para comanda en edición
window.comandaEditando = null;

// Inicialización cuando se carga el documento
document.addEventListener('DOMContentLoaded', function() {
    // Cargar calendario
    if (typeof cargarCalendario === 'function') {
        cargarCalendario();
    }
    
    // Cargar eventos de ejemplo
    if (typeof cargarEventosEjemplo === 'function') {
        cargarEventosEjemplo();
    }
    
    // Configurar fecha mínima para el formulario
    const hoy = new Date().toISOString().split('T')[0];
    const fechaEventoInput = document.getElementById('fecha_evento');
    if (fechaEventoInput) {
        fechaEventoInput.min = hoy;
    }
    
    // Configurar multiplicadores
    const multiplicadorSaladas = document.getElementById('multiplicadorSaladas');
    const multiplicadorPostres = document.getElementById('multiplicadorPostres');
    
    if (multiplicadorSaladas) {
        multiplicadorSaladas.addEventListener('input', function() {
            if (typeof actualizarMultiplicador === 'function') {
                actualizarMultiplicador('saladas', this.value);
            }
        });
    }
    
    if (multiplicadorPostres) {
        multiplicadorPostres.addEventListener('input', function() {
            if (typeof actualizarMultiplicador === 'function') {
                actualizarMultiplicador('postres', this.value);
            }
        });
    }
    
    // Inicializar contador si no existe
    if (typeof inicializarContador === 'function') {
        inicializarContador();
    }
    
    // Configurar el envío del formulario
    const formulario = document.getElementById('comandaCocinaForm');
    if (formulario) {
        formulario.addEventListener('submit', manejarEnvioFormulario);
    }
    
    console.log('✅ CaterCloud inicializado correctamente');
});

// ========== MANEJO DEL ENVÍO DEL FORMULARIO ==========

/**
 * Maneja el envío del formulario de comanda
 * @param {Event} e - Evento de envío
 */
async function manejarEnvioFormulario(e) {
    e.preventDefault();
    
    if (!window.menuSeleccionado) {
        mostrarMensaje('❌ Por favor, selecciona un menú principal', 'error');
        return;
    }
    
    if ([2, 3].includes(parseInt(document.getElementById('categoria').value))) {
        const seleccionadasSaladas = window.referenciasSeleccionadas.saladas.length;
        if (seleccionadasSaladas < window.menuSeleccionado.items_salados_min) {
            mostrarMensaje(`❌ Debes seleccionar al menos ${window.menuSeleccionado.items_salados_min} referencias saladas`, 'error');
            return;
        }
    }
    
    const submitBtn = e.target.querySelector('button[type="submit"]');
    const originalText = submitBtn.innerHTML;
    submitBtn.innerHTML = '<div class="loader"></div>';
    submitBtn.disabled = true;
    
    const comandaData = {
        empresa: document.getElementById('empresa').value,
        responsable: document.getElementById('responsable').value,
        pax: parseInt(document.getElementById('pax').value),
        hora_salida: document.getElementById('hora_salida').value,
        fecha_evento: document.getElementById('fecha_evento').value,
        menu_principal: {
            id: document.getElementById('menu_id').value,
            ...window.menuSeleccionado
        },
        menus_adicionales: [...window.menusAdicionales],
        multiplicadores: window.multiplicadores,
        referencias: window.referenciasSeleccionadas,
        alergias: {
            sin_alergias: document.getElementById('sin_alergias').checked,
            gluten: document.getElementById('alergia_gluten').checked,
            lactosa: document.getElementById('alergia_lactosa').checked,
            frutos_secos: document.getElementById('alergia_frutos_secos').checked,
            marisco: document.getElementById('alergia_marisco').checked,
            vegano: document.getElementById('es_vegano').checked,
            vegetariano: document.getElementById('es_vegetariano').checked,
            notas: document.getElementById('alergias_notas').value
        }
    };
    
    try {
        let codigo;
        
        if (window.comandaEditando) {
            // Actualizar comanda existente
            const resultado = actualizarComandaEnHistorial(window.comandaEditando.codigo, comandaData);
            
            if (resultado) {
                mostrarMensaje(`✅ Comanda ${window.comandaEditando.codigo} actualizada exitosamente`, 'success');
                
                if (typeof agregarAlCalendario === 'function') {
                    agregarAlCalendario(comandaData);
                }
                
                setTimeout(() => {
                    if (typeof volverAlDashboard === 'function') {
                        volverAlDashboard();
                    }
                    window.comandaEditando = null;
                    submitBtn.textContent = '📋 Crear Comanda de Cocina';
                }, 2000);
            } else {
                mostrarMensaje('❌ Error al actualizar la comanda', 'error');
            }
        } else {
            // Crear nueva comanda
            codigo = guardarComandaEnHistorial(comandaData);
            mostrarMensaje(`✅ Comanda ${codigo} creada exitosamente`, 'success');
            
            if (typeof agregarAlCalendario === 'function') {
                agregarAlCalendario(comandaData);
            }
            
            setTimeout(() => {
                document.getElementById('comandaCocinaForm').reset();
                if (typeof volverAlDashboard === 'function') {
                    volverAlDashboard();
                }
            }, 2000);
        }
    } catch (error) {
        mostrarMensaje('❌ Error al guardar la comanda: ' + error.message, 'error');
    } finally {
        submitBtn.innerHTML = originalText;
        submitBtn.disabled = false;
    }
}

// ========== FUNCIONES UTILITARIAS ==========

/**
 * Muestra un mensaje en la interfaz
 * @param {string} texto - Texto del mensaje
 * @param {string} tipo - 'success' o 'error'
 */
function mostrarMensaje(texto, tipo) {
    const div = document.getElementById('message');
    if (!div) return;
    
    div.textContent = texto;
    div.className = `message message-${tipo}`;
    
    setTimeout(() => {
        div.className = 'message';
    }, 5000);
}

// ========== EXPOSICIÓN DE FUNCIONES AL ÁMBITO GLOBAL ==========

// Hacer funciones disponibles globalmente si no lo están
if (typeof window.cargarMenus === 'undefined') {
    window.cargarMenus = cargarMenus;
}

if (typeof window.seleccionarMenu === 'undefined') {
    window.seleccionarMenu = seleccionarMenu;
}

if (typeof window.actualizarMultiplicador === 'undefined') {
    window.actualizarMultiplicador = actualizarMultiplicador;
}

if (typeof window.actualizarCantidades === 'undefined') {
    window.actualizarCantidades = actualizarCantidades;
}

if (typeof window.cargarReferencias === 'undefined') {
    window.cargarReferencias = cargarReferencias;
}

if (typeof window.seleccionarReferenciaPrincipal === 'undefined') {
    window.seleccionarReferenciaPrincipal = seleccionarReferenciaPrincipal;
}

if (typeof window.mostrarModalMenus === 'undefined') {
    window.mostrarModalMenus = mostrarModalMenus;
}

if (typeof window.cerrarModalMenus === 'undefined') {
    window.cerrarModalMenus = cerrarModalMenus;
}

if (typeof window.cargarMenusModal === 'undefined') {
    window.cargarMenusModal = cargarMenusModal;
}

if (typeof window.seleccionarMenuAdicional === 'undefined') {
    window.seleccionarMenuAdicional = seleccionarMenuAdicional;
}

if (typeof window.agregarMenuAdicional === 'undefined') {
    window.agregarMenuAdicional = agregarMenuAdicional;
}

if (typeof window.eliminarMenuAdicional === 'undefined') {
    window.eliminarMenuAdicional = eliminarMenuAdicional;
}

if (typeof window.actualizarListaMenusAdicionales === 'undefined') {
    window.actualizarListaMenusAdicionales = actualizarListaMenusAdicionales;
}

if (typeof window.actualizarPaxMenuAdicional === 'undefined') {
    window.actualizarPaxMenuAdicional = actualizarPaxMenuAdicional;
}

if (typeof window.cargarHistorial === 'undefined') {
    window.cargarHistorial = cargarHistorial;
}

if (typeof window.filtrarComandas === 'undefined') {
    window.filtrarComandas = filtrarComandas;
}

if (typeof window.verDetalleComanda === 'undefined') {
    window.verDetalleComanda = verDetalleComanda;
}

if (typeof window.editarComanda === 'undefined') {
    window.editarComanda = editarComanda;
}

if (typeof window.imprimirComanda === 'undefined') {
    window.imprimirComanda = imprimirComanda;
}

if (typeof window.eliminarComanda === 'undefined') {
    window.eliminarComanda = eliminarComanda;
}