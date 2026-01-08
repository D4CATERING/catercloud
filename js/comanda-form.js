// ========== VARIABLES DEL FORMULARIO ==========
let menuSeleccionado = null;
let menusAdicionales = [];
let multiplicadores = {
    saladas: 1,
    postres: 1
};
let pax = 0;
let referenciasSeleccionadas = {
    saladas: [],
    postres: []
};

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
    menuSeleccionado = null;
    referenciasSeleccionadas = { saladas: [], postres: [] };
    
    if (!categoriaId) return;
    
    let menus = [];
    
    if (categoriaId == 1) {
        menus = [
            { id: 1, nombre: 'HEALTHY', descripcion: 'Termo café + leche + infusión + mini bollería + sandwich jamón/tomate + yogurt con muesli + zumo naranja' },
            { id: 2, nombre: 'CLASSIC', descripcion: 'Termo café + leche + infusión + 2 mini bollerías + 2 sandwiches + fruta preparada + zumo naranja' },
            { id: 3, nombre: 'PREMIUM', descripcion: 'Termo café + leche + infusión + cookies + pop dots + 2 sandwiches + yogurt con granola + smoothie' },
            { id: 4, nombre: 'VEGGIE', descripcion: 'Termo café + leche vegetal + infusión + cookies + tostada aguacate + yogurt vegetal + zumo naranja' }
        ];
    }
    else if (categoriaId == 2) {
        menus = [
            { id: 5, nombre: 'ELECONÓMICO', descripcion: '7 salados + 1 postre', items_salados_min: 7, items_salados_max: 7, items_postres_min: 1, items_postres_max: 1 },
            { id: 6, nombre: 'ELDEENMEDIO', descripcion: '10 salados + 3 postres', items_salados_min: 10, items_salados_max: 10, items_postres_min: 3, items_postres_max: 3 },
            { id: 7, nombre: 'ELMUYTOP', descripcion: '12 salados + 3 postres', items_salados_min: 12, items_salados_max: 12, items_postres_min: 3, items_postres_max: 3 },
            { id: 8, nombre: 'VEGGIE', descripcion: '6 items vegetarianos', items_salados_min: 6, items_salados_max: 6 }
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
            { id: 15, nombre: 'FOODBOX LUNCH', descripcion: 'Ensalada + Sándwich + Postre + Bebida' }
        ];
    }
    
    mostrarMenusPrincipales(menus);
}

/**
 * Muestra los menús en el contenedor
 * @param {Array} menus - Lista de menús
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
                </p>` : ''}
        </div>
        `;
    });
    
    container.innerHTML = html;
}

/**
 * Selecciona un menú principal
 * @param {number} menuId - ID del menú
 * @param {HTMLElement} element - Elemento HTML clickeado
 */
async function seleccionarMenu(menuId, element) {
    document.querySelectorAll('.menu-option').forEach(opt => {
        opt.classList.remove('selected');
    });
    
    element.classList.add('selected');
    menuSeleccionado = JSON.parse(element.dataset.menu);
    document.getElementById('menu_id').value = menuId;
    
    pax = parseInt(document.getElementById('pax').value) || 0;
    
    if (pax > 0) {
        document.getElementById('multiplicadorSection').style.display = 'block';
        
        if (menuSeleccionado.items_postres_min > 0) {
            document.getElementById('multiplicadorPostresSection').style.display = 'block';
        } else {
            document.getElementById('multiplicadorPostresSection').style.display = 'none';
        }
        
        actualizarCantidades();
    }
    
    if ([2, 3].includes(parseInt(document.getElementById('categoria').value))) {
        document.getElementById('referenciasSection').style.display = 'block';
        
        await cargarReferencias();
        
        document.getElementById('minSaladas').textContent = menuSeleccionado.items_salados_min;
        document.getElementById('maxSaladas').textContent = menuSeleccionado.items_salados_max;
        
        if (menuSeleccionado.items_postres_min > 0) {
            document.getElementById('referenciasPostresGroup').style.display = 'block';
            document.getElementById('minPostres').textContent = menuSeleccionado.items_postres_min;
            document.getElementById('maxPostres').textContent = menuSeleccionado.items_postres_max;
        } else {
            document.getElementById('referenciasPostresGroup').style.display = 'none';
        }
    } else {
        document.getElementById('referenciasSection').style.display = 'none';
    }
}

// ========== MULTIPLICADORES ==========

/**
 * Actualiza un multiplicador
 * @param {string} tipo - 'saladas' o 'postres'
 * @param {number} valor - Nuevo valor del multiplicador
 */
function actualizarMultiplicador(tipo, valor) {
    const numValor = parseFloat(valor);
    
    if (isNaN(numValor) || numValor < 0.1 || numValor > 10) {
        mostrarMensaje('❌ El multiplicador debe estar entre 0.1 y 10', 'error');
        return;
    }
    
    multiplicadores[tipo] = numValor;
    actualizarCantidades();
}

/**
 * Actualiza todas las cantidades basadas en PAX y multiplicadores
 */
function actualizarCantidades() {
    pax = parseInt(document.getElementById('pax').value) || 0;
    const totalSaladas = Math.ceil(pax * multiplicadores.saladas);
    const totalPostres = Math.ceil(pax * multiplicadores.postres);
    
    document.getElementById('paxValue').textContent = pax;
    document.getElementById('paxValue2').textContent = pax;
    document.getElementById('multSaladasValue').textContent = multiplicadores.saladas.toFixed(1);
    document.getElementById('multPostresValue').textContent = multiplicadores.postres.toFixed(1);
    document.getElementById('totalSaladasValue').textContent = totalSaladas;
    document.getElementById('totalPostresValue').textContent = totalPostres;
    
    if (pax > 0 && menuSeleccionado) {
        document.getElementById('multiplicadorSection').style.display = 'block';
    }
    
    if (typeof actualizarCantidadesReferencias === 'function') {
        actualizarCantidadesReferencias();
    }
}

// ========== REFERENCIAS ==========

/**
 * Carga las referencias (saladas y postres)
 */
async function cargarReferencias() {
    const referenciasSaladas = [
        { id: 1, nombre: 'Tabla de Embutidos Ibéricos con Picos', unidad: 'bandeja' },
        { id: 2, nombre: 'Tabla de Quesos con Uva y Frutos Secos', unidad: 'bandeja' },
        { id: 3, nombre: 'Croquetas de Jamón', unidad: 'uds' },
        { id: 4, nombre: 'Mini Croissant de Salmón Ahumado', unidad: 'uds' },
        { id: 5, nombre: 'Mini Burguer con Queso', unidad: 'uds' },
        { id: 6, nombre: 'Hummus con Pan de Pita', unidad: 'bandeja' },
        { id: 7, nombre: 'Brocheta Capresse con Pesto', unidad: 'uds' },
        { id: 8, nombre: 'Tortilla de Patata con Chistorra y Padrón', unidad: 'bandeja' }
    ];
    
    const referenciasPostres = [
        { id: 101, nombre: 'Brocheta de Fruta Natural', unidad: 'uds' },
        { id: 102, nombre: 'Mousse de Chocolate', unidad: 'uds' },
        { id: 103, nombre: 'Macarons', unidad: 'uds' },
        { id: 104, nombre: 'Cremoso de Cheese Cake', unidad: 'uds' },
        { id: 105, nombre: 'Arroz con Leche', unidad: 'uds' }
    ];
    
    mostrarReferenciasPrincipales(referenciasSaladas, 'referenciasSaladasGrid', 'saladas');
    mostrarReferenciasPrincipales(referenciasPostres, 'referenciasPostresGrid', 'postres');
}

/**
 * Muestra referencias en el contenedor
 * @param {Array} referencias - Lista de referencias
 * @param {string} containerId - ID del contenedor
 * @param {string} tipo - 'saladas' o 'postres'
 */
function mostrarReferenciasPrincipales(referencias, containerId, tipo) {
    const container = document.getElementById(containerId);
    container.innerHTML = '';
    
    const cantidadBase = Math.ceil(pax * multiplicadores[tipo]);
    
    referencias.forEach(ref => {
        const div = document.createElement('div');
        div.className = 'referencia-option';
        div.innerHTML = `
            <span style="flex: 1;">${ref.nombre}</span>
            <div class="cantidad-control">
                <input type="number" class="cantidad-input" value="${cantidadBase}" min="1"
                       onchange="actualizarCantidadReferencia(${ref.id}, '${tipo}', this.value)">
                <select class="unidad-select" onchange="actualizarUnidadReferencia(${ref.id}, '${tipo}', this.value)">
                    <option value="uds" ${ref.unidad === 'uds' ? 'selected' : ''}>uds</option>
                    <option value="kg" ${ref.unidad === 'kg' ? 'selected' : ''}>kg</option>
                    <option value="l" ${ref.unidad === 'l' ? 'selected' : ''}>l</option>
                    <option value="bandeja" ${ref.unidad === 'bandeja' ? 'selected' : ''}>bandeja</option>
                    <option value="caja" ${ref.unidad === 'caja' ? 'selected' : ''}>caja</option>
                </select>
            </div>
        `;
        
        div.dataset.id = ref.id;
        div.dataset.nombre = ref.nombre;
        div.dataset.tipo = tipo;
        
        div.onclick = (e) => {
            if (!e.target.classList.contains('cantidad-input') && !e.target.classList.contains('unidad-select')) {
                seleccionarReferenciaPrincipal(ref.id, ref.nombre, tipo, cantidadBase, ref.unidad, div);
            }
        };
        
        container.appendChild(div);
    });
}

/**
 * Actualiza cantidades de referencias
 */
function actualizarCantidadesReferencias() {
    const cantidadSaladas = Math.ceil(pax * multiplicadores.saladas);
    const cantidadPostres = Math.ceil(pax * multiplicadores.postres);
    
    document.querySelectorAll('.referencia-option[data-tipo="saladas"] .cantidad-input').forEach(input => {
        input.value = cantidadSaladas;
    });
    
    document.querySelectorAll('.referencia-option[data-tipo="postres"] .cantidad-input').forEach(input => {
        input.value = cantidadPostres;
    });
    
    referenciasSeleccionadas.saladas.forEach(ref => {
        ref.cantidad = cantidadSaladas;
    });
    
    referenciasSeleccionadas.postres.forEach(ref => {
        ref.cantidad = cantidadPostres;
    });
}

/**
 * Actualiza cantidad de una referencia
 */
function actualizarCantidadReferencia(refId, tipo, cantidad) {
    const ref = referenciasSeleccionadas[tipo].find(r => r.id === refId);
    if (ref) {
        ref.cantidad = parseInt(cantidad);
    }
}

/**
 * Actualiza unidad de una referencia
 */
function actualizarUnidadReferencia(refId, tipo, unidad) {
    const ref = referenciasSeleccionadas[tipo].find(r => r.id === refId);
    if (ref) {
        ref.unidad = unidad;
    }
}

/**
 * Selecciona/deselecciona una referencia
 */
function seleccionarReferenciaPrincipal(refId, refNombre, tipo, cantidad, unidad, element) {
    const max = tipo === 'saladas' ? menuSeleccionado.items_salados_max : menuSeleccionado.items_postres_max;
    const min = tipo === 'saladas' ? menuSeleccionado.items_salados_min : menuSeleccionado.items_postres_min;
    const seleccionadas = referenciasSeleccionadas[tipo];
    const index = seleccionadas.findIndex(r => r.id === refId);
    
    if (index > -1) {
        seleccionadas.splice(index, 1);
        element.classList.remove('selected');
    } else {
        if (seleccionadas.length >= max) {
            alert(`Solo puedes seleccionar hasta ${max} referencias ${tipo}`);
            return;
        }
        
        const cantidadInput = element.querySelector('.cantidad-input').value;
        const unidadSelect = element.querySelector('.unidad-select').value;
        
        seleccionadas.push({
            id: refId,
            nombre: refNombre,
            cantidad: parseInt(cantidadInput),
            unidad: unidadSelect
        });
        
        element.classList.add('selected');
    }
}

// ========== MENÚS ADICIONALES ==========

/**
 * Muestra el modal para agregar menús adicionales
 */
function mostrarModalMenus() {
    document.getElementById('modalMenus').style.display = 'block';
    document.getElementById('modalCategoria').value = '';
    document.getElementById('modalMenusContainer').innerHTML = '';
}

/**
 * Cierra el modal de menús adicionales
 */
function cerrarModalMenus() {
    document.getElementById('modalMenus').style.display = 'none';
}

/**
 * Carga menús en el modal
 */
function cargarMenusModal() {
    const categoriaId = document.getElementById('modalCategoria').value;
    const container = document.getElementById('modalMenusContainer');
    container.innerHTML = '';
    
    if (!categoriaId) return;
    
    let menus = [];
    
    if (categoriaId == 1) {
        menus = [
            { id: 1001, nombre: 'HEALTHY ADICIONAL', descripcion: 'Termo café + leche + infusión + mini bollería + sandwich jamón/tomate + yogurt con muesli + zumo naranja' },
            { id: 1002, nombre: 'CLASSIC ADICIONAL', descripcion: 'Termo café + leche + infusión + 2 mini bollerías + 2 sandwiches + fruta preparada + zumo naranja' }
        ];
    }
    else if (categoriaId == 2) {
        menus = [
            { id: 1003, nombre: 'ELECONÓMICO ADICIONAL', descripcion: '7 salados + 1 postre', items_salados_min: 7, items_salados_max: 7, items_postres_min: 1, items_postres_max: 1 },
            { id: 1004, nombre: 'ELDEENMEDIO ADICIONAL', descripcion: '10 salados + 3 postres', items_salados_min: 10, items_salados_max: 10, items_postres_min: 3, items_postres_max: 3 }
        ];
    }
    else if (categoriaId == 3) {
        menus = [
            { id: 1005, nombre: 'AFTERWORK ADICIONAL', descripcion: '6 items salados', items_salados_min: 6, items_salados_max: 6 },
            { id: 1006, nombre: 'VINOESPAÑOL ADICIONAL', descripcion: '7 items salados', items_salados_min: 7, items_salados_max: 7 }
        ];
    }
    else if (categoriaId == 4) {
        menus = [
            { id: 1007, nombre: 'FOODBOX LUNCH ADICIONAL', descripcion: 'Ensalada + Sándwich + Postre + Bebida' }
        ];
    }
    
    mostrarMenusModal(menus);
}

/**
 * Muestra menús en el modal
 */
function mostrarMenusModal(menus) {
    const container = document.getElementById('modalMenusContainer');
    
    if (menus.length === 0) {
        container.innerHTML = '<p style="color: #94a3b8; text-align: center; font-size: 0.9rem;">No hay menús disponibles</p>';
        return;
    }
    
    let html = '';
    menus.forEach(menu => {
        html += `
        <div class="menu-option" onclick="seleccionarMenuAdicional(${menu.id}, this)" data-menu='${JSON.stringify(menu)}'>
            <h4>${menu.nombre}</h4>
            <p>${menu.descripcion || 'Sin descripción'}</p>
            ${menu.items_salados_min > 0 ?
                `<p style="font-size: 0.75rem; color: #64748b; margin-top: 3px;">
                📋 ${menu.items_salados_min}-${menu.items_salados_max} salados
                ${menu.items_postres_min > 0 ? `, ${menu.items_postres_min}-${menu.items_postres_max} postres` : ''}
                </p>` : ''}
        </div>
        `;
    });
    
    container.innerHTML = html;
}

/**
 * Selecciona un menú adicional
 */
function seleccionarMenuAdicional(menuId, element) {
    document.querySelectorAll('#modalMenusContainer .menu-option').forEach(opt => {
        opt.classList.remove('selected');
    });
    
    element.classList.add('selected');
    const menu = JSON.parse(element.dataset.menu);
    const paxAdicional = prompt(`¿Cuántos PAX para el menú "${menu.nombre}"?`, pax || "1");
    
    if (paxAdicional && !isNaN(paxAdicional) && parseInt(paxAdicional) > 0) {
        agregarMenuAdicional({
            ...menu,
            pax_adicional: parseInt(paxAdicional),
            categoria: document.getElementById('modalCategoria').selectedOptions[0].text
        });
        
        cerrarModalMenus();
    } else {
        alert('Por favor, ingresa un número válido de PAX');
    }
}

/**
 * Agrega un menú adicional a la lista
 */
function agregarMenuAdicional(menuData) {
    menusAdicionales.push(menuData);
    actualizarListaMenusAdicionales();
}

/**
 * Elimina un menú adicional
 */
function eliminarMenuAdicional(index) {
    menusAdicionales.splice(index, 1);
    actualizarListaMenusAdicionales();
}

/**
 * Actualiza la lista de menús adicionales
 */
function actualizarListaMenusAdicionales() {
    const container = document.getElementById('menusAdicionalesList');
    
    if (menusAdicionales.length === 0) {
        container.innerHTML = '<p style="color: #94a3b8; text-align: center; font-size: 0.9rem;">No hay menús adicionales añadidos</p>';
        return;
    }
    
    let html = '';
    menusAdicionales.forEach((menu, index) => {
        html += `
        <div class="menu-adicional-item">
            <div class="menu-adicional-info">
                <h4>${menu.nombre}</h4>
                <p>${menu.categoria} - ${menu.pax_adicional} PAX</p>
                <p style="font-size: 0.8rem; color: #64748b;">${menu.descripcion}</p>
            </div>
            <div class="menu-adicional-controls">
                <input type="number" class="menu-pax-input" value="${menu.pax_adicional}" min="1"
                       onchange="actualizarPaxMenuAdicional(${index}, this.value)">
                <button type="button" class="btn-remove-menu" onclick="eliminarMenuAdicional(${index})">✕</button>
            </div>
        </div>
        `;
    });
    
    container.innerHTML = html;
}

/**
 * Actualiza PAX de un menú adicional
 */
function actualizarPaxMenuAdicional(index, valor) {
    if (menusAdicionales[index]) {
        menusAdicionales[index].pax_adicional = parseInt(valor) || 1;
    }
}