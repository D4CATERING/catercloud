// ========== HISTORIAL DE COMANDA ==========

/**
 * Carga y muestra el historial de comandas
 */
function cargarHistorial() {
    const historial = JSON.parse(localStorage.getItem('historialComandas') || '[]');
    const container = document.getElementById('comandasList');
    
    if (historial.length === 0) {
        container.innerHTML = '<p style="color: #94a3b8; text-align: center; font-size: 0.9rem; padding: 40px;">No hay comandas en el historial</p>';
        return;
    }
    
    // Ordenar por fecha de creación descendente
    historial.sort((a, b) => new Date(b.fecha_creacion) - new Date(a.fecha_creacion));
    
    let html = '';
    historial.forEach(comanda => {
        const fechaCreacion = new Date(comanda.fecha_creacion);
        const fechaEvento = new Date(comanda.fecha_evento);
        
        html += `
        <div class="comanda-item" onclick="verDetalleComanda('${comanda.codigo}')">
            <div class="comanda-header">
                <div class="comanda-codigo">${comanda.codigo}</div>
                <div class="comanda-fecha">${fechaCreacion.toLocaleDateString('es-ES', {
                    day: '2-digit',
                    month: '2-digit',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                })}</div>
            </div>
            <div class="comanda-empresa">${comanda.empresa}</div>
            <div class="comanda-info">Responsable: ${comanda.responsable}</div>
            <div class="comanda-info">${comanda.pax} PAX - Evento: ${fechaEvento.toLocaleDateString('es-ES')}</div>
            <div class="comanda-info">Menú principal: ${comanda.menu_principal?.nombre || 'No especificado'}</div>
            <div class="comanda-estado estado-${comanda.estado}">
                ${comanda.estado.charAt(0).toUpperCase() + comanda.estado.slice(1)}
            </div>
        </div>
        `;
    });
    
    container.innerHTML = html;
}

/**
 * Filtra las comandas según criterios
 */
function filtrarComandas() {
    const historial = JSON.parse(localStorage.getItem('historialComandas') || '[]');
    const filtro = document.getElementById('filtroBusqueda').value.toLowerCase();
    const filtroFecha = document.getElementById('filtroFecha').value;
    const filtroEstado = document.getElementById('filtroEstado').value;
    
    const comandasFiltradas = historial.filter(comanda => {
        // Filtro de búsqueda
        const coincideBusqueda = !filtro ||
            comanda.empresa.toLowerCase().includes(filtro) ||
            comanda.codigo.toLowerCase().includes(filtro) ||
            comanda.responsable.toLowerCase().includes(filtro);
        
        // Filtro de fecha
        const coincideFecha = !filtroFecha ||
            comanda.fecha_evento.split('T')[0] === filtroFecha;
        
        // Filtro de estado
        const coincideEstado = !filtroEstado ||
            comanda.estado === filtroEstado;
        
        return coincideBusqueda && coincideFecha && coincideEstado;
    });
    
    // Ordenar por fecha de creación descendente
    comandasFiltradas.sort((a, b) => new Date(b.fecha_creacion) - new Date(a.fecha_creacion));
    
    const container = document.getElementById('comandasList');
    
    if (comandasFiltradas.length === 0) {
        container.innerHTML = '<p style="color: #94a3b8; text-align: center; font-size: 0.9rem; padding: 40px;">No se encontraron comandas con los filtros seleccionados</p>';
        return;
    }
    
    let html = '';
    comandasFiltradas.forEach(comanda => {
        const fechaCreacion = new Date(comanda.fecha_creacion);
        const fechaEvento = new Date(comanda.fecha_evento);
        
        html += `
        <div class="comanda-item" onclick="verDetalleComanda('${comanda.codigo}')">
            <div class="comanda-header">
                <div class="comanda-codigo">${comanda.codigo}</div>
                <div class="comanda-fecha">${fechaCreacion.toLocaleDateString('es-ES', {
                    day: '2-digit',
                    month: '2-digit',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                })}</div>
            </div>
            <div class="comanda-empresa">${comanda.empresa}</div>
            <div class="comanda-info">Responsable: ${comanda.responsable}</div>
            <div class="comanda-info">${comanda.pax} PAX - Evento: ${fechaEvento.toLocaleDateString('es-ES')}</div>
            <div class="comanda-info">Menú principal: ${comanda.menu_principal?.nombre || 'No especificado'}</div>
            <div class="comanda-estado estado-${comanda.estado}">
                ${comanda.estado.charAt(0).toUpperCase() + comanda.estado.slice(1)}
            </div>
        </div>
        `;
    });
    
    container.innerHTML = html;
}

/**
 * Muestra el detalle de una comanda
 * @param {string} codigo - Código de la comanda
 */
function verDetalleComanda(codigo) {
    const comanda = obtenerComandaDelHistorial(codigo);
    
    if (!comanda) {
        alert('Comanda no encontrada');
        return;
    }
    
    document.getElementById('historialPage').style.display = 'none';
    document.getElementById('detalleComanda').style.display = 'block';
    
    // Llenar los detalles
    document.getElementById('detalleCodigo').textContent = comanda.codigo;
    document.getElementById('detalleFecha').textContent = `Creada el ${new Date(comanda.fecha_creacion).toLocaleDateString('es-ES')}`;
    document.getElementById('detalleEmpresa').textContent = comanda.empresa;
    document.getElementById('detalleResponsable').textContent = comanda.responsable;
    document.getElementById('detallePax').textContent = comanda.pax;
    document.getElementById('detalleFechaEvento').textContent = new Date(comanda.fecha_evento).toLocaleDateString('es-ES');
    document.getElementById('detalleHoraSalida').textContent = comanda.hora_salida;
    document.getElementById('detalleMenuPrincipal').textContent = 
        `${comanda.menu_principal?.nombre || 'No especificado'} - ${comanda.menu_principal?.descripcion || ''}`;
    
    // Menús adicionales
    if (comanda.menus_adicionales && comanda.menus_adicionales.length > 0) {
        let html = '';
        comanda.menus_adicionales.forEach(menu => {
            html += `<div>• ${menu.nombre} - ${menu.pax_adicional} PAX</div>`;
        });
        document.getElementById('detalleMenusAdicionales').innerHTML = html;
    } else {
        document.getElementById('detalleMenusAdicionales').textContent = 'No hay menús adicionales';
    }
    
    // Multiplicadores
    if (comanda.multiplicadores) {
        document.getElementById('detalleMultiplicadoresSection').style.display = 'block';
        document.getElementById('detalleMultiplicadores').textContent = 
            `Saladas: ${comanda.multiplicadores.saladas} | Postres: ${comanda.multiplicadores.postres || 'N/A'}`;
    }
    
    // Referencias
    if (comanda.referencias && (comanda.referencias.saladas.length > 0 || comanda.referencias.postres.length > 0)) {
        document.getElementById('detalleReferenciasSection').style.display = 'block';
        let html = '';
        
        if (comanda.referencias.saladas.length > 0) {
            html += '<strong>Saladas:</strong><br>';
            comanda.referencias.saladas.forEach(ref => {
                html += `• ${ref.nombre} - ${ref.cantidad} ${ref.unidad}<br>`;
            });
        }
        
        if (comanda.referencias.postres.length > 0) {
            html += '<strong>Postres:</strong><br>';
            comanda.referencias.postres.forEach(ref => {
                html += `• ${ref.nombre} - ${ref.cantidad} ${ref.unidad}<br>`;
            });
        }
        
        document.getElementById('detalleReferencias').innerHTML = html;
    }
    
    // Alérgenos
    let alergenos = [];
    if (comanda.alergias) {
        if (comanda.alergias.sin_alergias) alergenos.push('Sin alergias');
        if (comanda.alergias.gluten) alergenos.push('Gluten');
        if (comanda.alergias.lactosa) alergenos.push('Lactosa');
        if (comanda.alergias.frutos_secos) alergenos.push('Frutos secos');
        if (comanda.alergias.marisco) alergenos.push('Marisco');
        if (comanda.alergias.vegano) alergenos.push('Vegano');
        if (comanda.alergias.vegetariano) alergenos.push('Vegetariano');
    }
    
    document.getElementById('detalleAlergenos').textContent = 
        alergenos.length > 0 ? alergenos.join(', ') : 'Sin restricciones';
    
    // Información del sistema
    document.getElementById('detalleEstado').textContent = 
        comanda.estado.charAt(0).toUpperCase() + comanda.estado.slice(1);
    
    document.getElementById('detalleVersion').textContent = `v${comanda.version}`;
    
    document.getElementById('detalleFechaCreacion').textContent = 
        new Date(comanda.fecha_creacion).toLocaleDateString('es-ES', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    
    document.getElementById('detalleFechaModificacion').textContent = comanda.fecha_modificacion ?
        new Date(comanda.fecha_modificacion).toLocaleDateString('es-ES', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        }) : 'No modificada';
}

/**
 * Edita una comanda existente
 */
function editarComanda() {
    const codigo = document.getElementById('detalleCodigo').textContent;
    window.comandaEditando = obtenerComandaDelHistorial(codigo);
    
    if (!window.comandaEditando) {
        alert('Comanda no encontrada');
        return;
    }
    
    // Cargar datos en el formulario
    document.getElementById('empresa').value = window.comandaEditando.empresa;
    document.getElementById('responsable').value = window.comandaEditando.responsable;
    document.getElementById('pax').value = window.comandaEditando.pax;
    document.getElementById('hora_salida').value = window.comandaEditando.hora_salida;
    document.getElementById('fecha_evento').value = window.comandaEditando.fecha_evento;
    
    // Cargar menú principal
    if (window.comandaEditando.menu_principal) {
        document.getElementById('categoria').value = '2'; // Por defecto Foodbox/Comida
        if (typeof cargarMenus === 'function') {
            cargarMenus();
        }
        
        // Esperar a que se carguen los menús y seleccionar el correcto
        setTimeout(() => {
            const menuOptions = document.querySelectorAll('.menu-option');
            menuOptions.forEach(option => {
                const menu = JSON.parse(option.dataset.menu);
                if (menu.nombre === window.comandaEditando.menu_principal.nombre) {
                    if (typeof seleccionarMenu === 'function') {
                        seleccionarMenu(menu.id, option);
                    }
                }
            });
        }, 500);
    }
    
    // Cargar menús adicionales
    if (window.comandaEditando.menus_adicionales) {
        window.menusAdicionales = [...window.comandaEditando.menus_adicionales];
        if (typeof actualizarListaMenusAdicionales === 'function') {
            actualizarListaMenusAdicionales();
        }
    }
    
    // Cargar multiplicadores
    if (window.comandaEditando.multiplicadores) {
        window.multiplicadores = { ...window.comandaEditando.multiplicadores };
        document.getElementById('multiplicadorSaladas').value = window.multiplicadores.saladas;
        document.getElementById('multiplicadorPostres').value = window.multiplicadores.postres || 1;
        
        if (typeof actualizarCantidades === 'function') {
            actualizarCantidades();
        }
    }
    
    // Cargar referencias
    if (window.comandaEditando.referencias) {
        window.referenciasSeleccionadas = { ...window.comandaEditando.referencias };
    }
    
    // Cargar alérgenos
    if (window.comandaEditando.alergias) {
        document.getElementById('sin_alergias').checked = window.comandaEditando.alergias.sin_alergias || false;
        document.getElementById('alergia_gluten').checked = window.comandaEditando.alergias.gluten || false;
        document.getElementById('alergia_lactosa').checked = window.comandaEditando.alergias.lactosa || false;
        document.getElementById('alergia_frutos_secos').checked = window.comandaEditando.alergias.frutos_secos || false;
        document.getElementById('alergia_marisco').checked = window.comandaEditando.alergias.marisco || false;
        document.getElementById('es_vegano').checked = window.comandaEditando.alergias.vegano || false;
        document.getElementById('es_vegetariano').checked = window.comandaEditando.alergias.vegetariano || false;
        document.getElementById('alergias_notas').value = window.comandaEditando.alergias.notas || '';
    }
    
    // Cambiar a la vista de formulario
    document.getElementById('detalleComanda').style.display = 'none';
    document.getElementById('comandaForm').style.display = 'block';
    document.getElementById('dashboard').style.display = 'none';
    
    // Cambiar texto del botón
    const submitBtn = document.querySelector('#comandaCocinaForm button[type="submit"]');
    submitBtn.textContent = '💾 Guardar Cambios';
}

/**
 * Imprime la comanda actual
 */
function imprimirComanda() {
    window.print();
}

/**
 * Elimina una comanda
 */
function eliminarComanda() {
    const codigo = document.getElementById('detalleCodigo').textContent;
    
    if (confirm(`¿Estás seguro de que deseas eliminar la comanda ${codigo}? Esta acción no se puede deshacer.`)) {
        eliminarComandaDelHistorial(codigo);
        alert(`Comanda ${codigo} eliminada correctamente`);
        
        if (typeof volverAlHistorial === 'function') {
            volverAlHistorial();
        }
    }
}