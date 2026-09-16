// ========== GESTIÓN DE PREFERENCIAS DE USUARIO ==========

const PREFERENCIAS_KEY = 'catercloud_preferencias';
const PREFERENCIAS_DEFAULT = {
    tema: 'claro',
    notificaciones: true,
    crearLogisticaAutomaticamente: false,
    vistaCalendario: 'mes',
    itemsPorPagina: 10,
    recordarEmpresa: true,
    recordarResponsable: true,
    mostrarTutorial: true,
    idioma: 'es',
    formatoHora: '24h'
};

// Cargar preferencias
function cargarPreferencias() {
    try {
        const guardadas = localStorage.getItem(PREFERENCIAS_KEY);
        if (guardadas) {
            return { ...PREFERENCIAS_DEFAULT, ...JSON.parse(guardadas) };
        }
    } catch (error) {
        console.error('Error cargando preferencias:', error);
    }
    return PREFERENCIAS_DEFAULT;
}

// Guardar preferencias
function guardarPreferencias(preferencias) {
    try {
        localStorage.setItem(PREFERENCIAS_KEY, JSON.stringify(preferencias));
        return true;
    } catch (error) {
        console.error('Error guardando preferencias:', error);
        return false;
    }
}

// Actualizar una preferencia específica
function actualizarPreferencia(clave, valor) {
    const preferencias = cargarPreferencias();
    preferencias[clave] = valor;
    return guardarPreferencias(preferencias);
}

// Cargar preferencias de empresa/responsable frecuentes
function cargarPreferenciasEmpresa() {
    try {
        return JSON.parse(localStorage.getItem('empresas_frecuentes')) || [];
    } catch (error) {
        return [];
    }
}

// Guardar empresa frecuente
function guardarEmpresaFrecuente(empresa, responsable) {
    try {
        const empresas = cargarPreferenciasEmpresa();
        
        // Evitar duplicados
        const existe = empresas.find(e => 
            e.empresa === empresa && e.responsable === responsable
        );
        
        if (!existe) {
            empresas.push({
                empresa,
                responsable,
                fecha: new Date().toISOString(),
                veces_usado: 1
            });
            
            // Ordenar por frecuencia de uso
            empresas.sort((a, b) => b.veces_usado - a.veces_usado);
            
            // Mantener solo las 10 más frecuentes
            if (empresas.length > 10) {
                empresas.splice(10);
            }
            
            localStorage.setItem('empresas_frecuentes', JSON.stringify(empresas));
        } else {
            // Incrementar contador de uso
            existe.veces_usado++;
            localStorage.setItem('empresas_frecuentes', JSON.stringify(empresas));
        }
        
        return true;
    } catch (error) {
        console.error('Error guardando empresa frecuente:', error);
        return false;
    }
}

// Autocompletar formulario con empresa frecuente
function autocompletarConEmpresaFrecuente() {
    const empresaInput = document.getElementById('empresa');
    if (empresaInput) empresaInput.removeAttribute('list');
    document.getElementById('empresas-frecuentes-datalist')?.remove();
}

// Inicializar preferencias al cargar la página
function inicializarPreferencias() {
    const preferencias = cargarPreferencias();
    
    // Aplicar tema
    if (preferencias.tema === 'oscuro') {
        document.documentElement.setAttribute('data-tema', 'oscuro');
    }
    
    // Autocompletar empresas frecuentes
    autocompletarConEmpresaFrecuente();
    
    // Configurar otras preferencias...
    return preferencias;
}

// Exportar funciones
window.cargarPreferencias = cargarPreferencias;
window.guardarPreferencias = guardarPreferencias;
window.actualizarPreferencia = actualizarPreferencia;
window.guardarEmpresaFrecuente = guardarEmpresaFrecuente;
window.inicializarPreferencias = inicializarPreferencias;

