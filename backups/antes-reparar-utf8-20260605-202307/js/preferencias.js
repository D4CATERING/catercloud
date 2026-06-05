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
    const preferencias = cargarPreferencias();
    if (!preferencias.recordarEmpresa) return;
    
    const empresas = cargarPreferenciasEmpresa();
    if (empresas.length === 0) return;
    
    // Crear datalist para autocompletar
    let datalist = document.getElementById('empresas-frecuentes-datalist');
    if (!datalist) {
        datalist = document.createElement('datalist');
        datalist.id = 'empresas-frecuentes-datalist';
        document.body.appendChild(datalist);
    }
    
    datalist.innerHTML = '';
    empresas.forEach((emp, index) => {
        const option = document.createElement('option');
        option.value = emp.empresa;
        option.dataset.responsable = emp.responsable;
        option.dataset.index = index;
        datalist.appendChild(option);
    });
    
    const empresaInput = document.getElementById('empresa');
    const responsableInput = document.getElementById('responsable');
    
    if (empresaInput && !empresaInput.list) {
        empresaInput.setAttribute('list', 'empresas-frecuentes-datalist');
        
        // Cuando se selecciona una empresa del datalist
        empresaInput.addEventListener('input', function() {
            const selectedOption = Array.from(datalist.options).find(
                opt => opt.value === this.value
            );
            
            if (selectedOption && responsableInput) {
                responsableInput.value = selectedOption.dataset.responsable || '';
            }
        });
    }
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

