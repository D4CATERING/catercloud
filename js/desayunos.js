// ========== REFERENCIAS PARA DESAYUNOS - VERSIÓN MEJORADA ==========

/**
 * Carga las referencias para el menú de desayuno seleccionado
 * CON CONTAINERS PARA LECHE SIN LACTOSA Y LECHE VEGETAL
 */
function cargarReferenciasDesayuno(menu) {
    const containerId = 'referenciasDesayunoGrid';
    let container = document.getElementById(containerId);
    
    if (!container) {
        return;
    }
    
    const pax = window.pax || 0;
    const termosPorPersona = 1/20; // MODIFICADO: 1 termo por cada 20 personas
    
    const opcionesBolleria = [
        'Mini bollería variada',
        'Mini donuts',
        'Mini malla de fruta',
        'Mini croissant',
        'Mini napolitana de chocolate',
        'Mini Pecaditos'
    ];
    
    const opcionesSandwiches = [
        'Puerro & Manzana',
        'Verduras asadas',
        'Tortilla de Patata',
        'Tortilla francesa',
        'Roastbeef',
        'Pastrami',
        'Salmon & Quesocrema',
        'Salmon & Aguacate',
        'Mortadela',
        'Atún',
        'Mixto',
        'Pollo asado',
        'Pavo & Queso',
        'Paletilla & Tomate',
        'Ensaladilla rusa'
    ];
    
    // Configuraciones por tipo de desayuno
    const configuracionesDesayunos = {
        1: { // HEALTHY
            nombre: 'HEALTHY',
            referencias: [
                { id: 'healthy_cafe', nombre: 'Termo de café', tipo: 'termo', 
                  cantidadPorPax: termosPorPersona, unidad: 'termo', selectorTermo: true },
                { id: 'healthy_leche', nombre: 'Termo de leche', tipo: 'termo', 
                  cantidadPorPax: termosPorPersona, unidad: 'termo', selectorTermo: true },
                { id: 'healthy_leche_sin_lactosa', nombre: 'Termo leche sin lactosa', tipo: 'leche_especial', 
                  cantidadPorPax: 0, unidad: 'termo', selectorTermo: true },
		{ id: 'healthy_leche_veg', nombre: 'Termo leche vegetal', tipo: 'leche_especial', 
                  cantidadPorPax: 0, unidad: 'termo', selectorTermo: true },
                { id: 'healthy_infusion', nombre: 'Termo de infusión', tipo: 'termo', 
                  cantidadPorPax: termosPorPersona, unidad: 'termo', selectorTermo: true },
                { id: 'healthy_yogurt', nombre: 'Vasito Yogurt con Muesly', tipo: 'simple', 
                  cantidadPorPax: 1, unidad: 'uds' },
		{ id: 'healthy_bolleria', nombre: 'Bollería', tipo: 'bolleria', 
                  cantidadPorPax: 1, unidad: 'uds', opciones: opcionesBolleria },
                { id: 'healthy_sandwich', nombre: 'Sandwich', tipo: 'sandwich', 
                  cantidadPorPax: 1, unidad: 'uds', opciones: opcionesSandwiches },
                { id: 'healthy_zumo', nombre: 'Zumo natural', tipo: 'zumo', 
                  cantidadPorPax: 1/5, unidad: 'litro' }
            ]
        },
        2: { // CLASSIC
            nombre: 'CLASSIC',
            referencias: [
                { id: 'classic_cafe', nombre: 'Termo de café', tipo: 'termo', 
                  cantidadPorPax: termosPorPersona, unidad: 'termo', selectorTermo: true },
                { id: 'classic_leche', nombre: 'Termo de leche', tipo: 'termo', 
                  cantidadPorPax: termosPorPersona, unidad: 'termo', selectorTermo: true },
                { id: 'classic_leche_sin_lactosa', nombre: 'Termo leche sin lactosa', tipo: 'leche_especial', 
                  cantidadPorPax: 0, unidad: 'termo', selectorTermo: true },
		{ id: 'classic_leche_veg', nombre: 'Termo leche vegetal', tipo: 'leche_especial', 
                  cantidadPorPax: 0, unidad: 'termo', selectorTermo: true },
                { id: 'classic_infusion', nombre: 'Termo de infusión', tipo: 'termo', 
                  cantidadPorPax: termosPorPersona, unidad: 'termo', selectorTermo: true },
                { id: 'classic_fruta', nombre: 'Vasito fruta preparada', tipo: 'simple', 
                  cantidadPorPax: 1, unidad: 'uds' },
		{ id: 'classic_bolleria', nombre: 'Bollería', tipo: 'bolleria', 
                  cantidadPorPax: 2, unidad: 'uds', opciones: opcionesBolleria },
                { id: 'classic_sandwich', nombre: 'Sandwiches', tipo: 'sandwich_multiple', 
                  cantidadPorPax: 2, unidad: 'uds', opciones: opcionesSandwiches, cantidadSandwiches: 2 },
                { id: 'classic_zumo', nombre: 'Zumo natural', tipo: 'zumo', 
                  cantidadPorPax: 1/5, unidad: 'litro' }
            ]
        },
        3: { // PREMIUM
            nombre: 'PREMIUM',
            referencias: [
                { id: 'premium_cafe', nombre: 'Termo de café', tipo: 'termo', 
                  cantidadPorPax: termosPorPersona, unidad: 'termo', selectorTermo: true },
                { id: 'premium_leche', nombre: 'Termo de leche', tipo: 'termo', 
                  cantidadPorPax: termosPorPersona, unidad: 'termo', selectorTermo: true },
                { id: 'premium_leche_sin_lactosa', nombre: 'Termo leche sin lactosa', tipo: 'leche_especial', 
                  cantidadPorPax: 0, unidad: 'termo', selectorTermo: true },
		{ id: 'premium_leche_veg', nombre: 'Termo leche vegetal', tipo: 'leche_especial', 
                  cantidadPorPax: 0, unidad: 'termo', selectorTermo: true },
                { id: 'premium_infusion', nombre: 'Termo de infusión', tipo: 'termo', 
                  cantidadPorPax: termosPorPersona, unidad: 'termo', selectorTermo: true },
                { id: 'premium_cookies', nombre: 'Cookies', tipo: 'simple', 
                  cantidadPorPax: 1, unidad: 'uds' },
                { id: 'premium_popdots', nombre: 'Pop dots', tipo: 'simple', 
                  cantidadPorPax: 2, unidad: 'uds' },
                { id: 'premium_sandwich', nombre: 'Sandwiches', tipo: 'sandwich_multiple', 
                  cantidadPorPax: 2, unidad: 'uds', opciones: opcionesSandwiches, cantidadSandwiches: 2 },
                { id: 'premium_yogurt', nombre: 'Vasito yogurt con granola y miel', tipo: 'simple', 
                  cantidadPorPax: 1, unidad: 'uds' },
                { id: 'premium_smoothie', nombre: 'Smoothie', tipo: 'simple', 
                  cantidadPorPax: 1, unidad: 'uds' },

            ]
        },
        4: { // VEGGIE
            nombre: 'VEGGIE',
            referencias: [
                { id: 'veggie_cafe', nombre: 'Termo de café', tipo: 'termo', 
                  cantidadPorPax: termosPorPersona, unidad: 'termo', selectorTermo: true },
		{ id: 'veggie_leche', nombre: 'Termo de leche', tipo: 'termo', 
                  cantidadPorPax: termosPorPersona, unidad: 'termo', selectorTermo: true },
                { id: 'premium_leche_sin_lactosa', nombre: 'Termo leche sin lactosa', tipo: 'leche_especial', 
                  cantidadPorPax: 0, unidad: 'termo', selectorTermo: true },
		{ id: 'veggie_leche_veg', nombre: 'Termo leche vegetal', tipo: 'leche_especial', 
                  cantidadPorPax: termosPorPersona, unidad: 'termo', selectorTermo: true },
                { id: 'veggie_infusion', nombre: 'Termo de infusión', tipo: 'termo', 
                  cantidadPorPax: termosPorPersona, unidad: 'termo', selectorTermo: true },
                { id: 'veggie_cookies', nombre: 'Cookies', tipo: 'simple', 
                  cantidadPorPax: 1, unidad: 'uds' },
                { id: 'veggie_tostada', nombre: 'Tostada aguacate', tipo: 'simple', 
                  cantidadPorPax: 1, unidad: 'uds' },
                { id: 'veggie_yogurt', nombre: 'Vasito yogurt vegetal con granola y miel', tipo: 'simple', 
                  cantidadPorPax: 1, unidad: 'uds' },
                { id: 'veggie_zumo', nombre: 'Zumo natural', tipo: 'zumo', 
                  cantidadPorPax: 1/5, unidad: 'litro' }
            ]
        }
    };
    
    const config = configuracionesDesayunos[menu.id];
    if (!config) return;
    
    const referencias = config.referencias || [];
    
    if (container) {
        container.innerHTML = '';
        window.referenciasDesayuno = {};
        
        // Agregar header para leches especiales (solo si hay)
        const tieneLecheEspecial = referencias.some(ref => ref.tipo === 'leche_especial');
        if (tieneLecheEspecial) {
            const headerEspecial = document.createElement('div');
            headerEspecial.className = 'leche-especial-header';
            headerEspecial.style.cssText = `
                grid-column: 1 / -1;
                background: #f0f9ff;
                padding: 10px;
                border-radius: 8px;
                margin-bottom: 10px;
                border-left: 4px solid #3b82f6;
            `;
            headerEspecial.innerHTML = `
                <strong>🥛 Opciones de Leche Especial</strong>
                <div style="font-size: 0.8rem; color: #475569; margin-top: 5px;">
                    Estas cantidades NO se calculan automáticamente. Indica la cantidad manualmente.
                </div>
            `;
            container.appendChild(headerEspecial);
        }

        // Iterar referencias del menú
        referencias.forEach(ref => {
            let cantidadTotal;

            if (ref.tipo === 'leche_especial') {
                cantidadTotal = 0;
            } else if (ref.tipo === 'termo') {
                if (ref.id.includes('_cafe')) {
                    cantidadTotal = Math.ceil(pax * (1/10));
                } else {
                    cantidadTotal = Math.ceil(pax * (1/20));
                }
            } else if (ref.tipo === 'zumo') {
                cantidadTotal = Math.ceil(pax * ref.cantidadPorPax);
            } else {
                cantidadTotal = Math.ceil(pax * ref.cantidadPorPax);
            }

            // ZUMO / AGUA: Solo en logística, NO en referencias de cocina
            if (ref.tipo === 'zumo') {
                renderizarZumoEnLogistica(ref, cantidadTotal);
                return;
            }

            // Resto de referencias: renderizar como bubble
            const itemDiv = document.createElement('div');
            itemDiv.className = 'dc-item-bubble';
            if (ref.tipo === 'leche_especial') {
                itemDiv.style.background = '#f0f9ff';
                itemDiv.style.borderColor = '#93c5fd';
            }

            itemDiv.innerHTML = generarHTMLReferenciaDesayuno(ref, cantidadTotal, pax);
            itemDiv.dataset.id = ref.id;
            itemDiv.dataset.tipo = ref.tipo;

            container.appendChild(itemDiv);
            inicializarDatosReferenciaDesayuno(ref, cantidadTotal);
        });

        // Menaje y extras vienen de Supabase (logistics-material.js)
    }
}

// ============================================================
// RENDERIZAR ZUMO/AGUA EN SECCIÓN DE LOGÍSTICA
// ============================================================
function renderizarZumoEnLogistica(ref, cantidadTotal) {
    if (!window.materialLogistica) window.materialLogistica = { bebidas: [], menaje: [], extras: [] };
    if (!window.materialLogistica.bebidas) window.materialLogistica.bebidas = [];

    // Limpiar zumos de menús anteriores — cada selección de menú reemplaza el zumo
    window.materialLogistica.bebidas = window.materialLogistica.bebidas.filter(i => !i._zumoId);

    // Añadir el zumo del menú actual
    window.materialLogistica.bebidas.push({
        _zumoId: ref.id,
        item_id: ref.id,
        nombre: ref.nombre,
        cantidad: cantidadTotal,
        unidad: ref.unidad || 'litros',
        checked: true,
        tipo: 'bebidas',
        tiene_subitems: false,
        subitems: [],
        subitems_selected: []
    });

    if (typeof window.renderizarMaterial === 'function') window.renderizarMaterial('materialLogisticaInline');
}

// ============================================================
// RENDERIZAR MENAJE DE DESAYUNOS EN LOGÍSTICA
// ============================================================
// ============================================================
// MENAJE DE DESAYUNOS EN LOGÍSTICA


// ============================================================
// EXTRAS DE DESAYUNOS EN LOGÍSTICA




// ============================================================
// MENAJE Y EXTRAS DE FOODBOX/COMIDA EN LOGÍSTICA



// Función auxiliar para generar HTML de cada referencia
function generarHTMLReferenciaDesayuno(ref, cantidadTotal, pax) {
    // Nombre del item con descripción como badge pequeño
    let descripcion = '';
    if (ref.tipo === 'termo' && ref.id.includes('_cafe')) {
        descripcion = '1/10';
    } else if (ref.tipo === 'termo') {
        descripcion = '1/20';
    } else if (ref.tipo === 'leche_especial') {
        descripcion = 'Manual';
    } else if (ref.tipo === 'zumo') {
        descripcion = '1/5';
    } else {
        descripcion = `${ref.cantidadPorPax}x`;
    }
    
    let html = `
        <div class="dc-item-nombre" style="display: flex; flex-direction: column; flex: 1;">
            <div style="display: flex; align-items: center; gap: 6px;">
                <span style="font-size: 0.75rem;">${ref.nombre}</span>
                <span style="font-size: 0.65rem; color: #64748b; background: #f1f5f9; padding: 1px 4px; border-radius: 4px;">${descripcion}</span>
            </div>
    `;
    
    // Contenido específico según tipo (selectores de bollería/sandwich)
    if (ref.tipo === 'bolleria' && ref.opciones) {
        html += generarHTMLBolleria(ref);
    } else if (ref.tipo === 'sandwich' && ref.opciones) {
        html += generarHTMLSandwichSimple(ref);
    } else if (ref.tipo === 'sandwich_multiple' && ref.opciones) {
        html += generarHTMLSandwichMultiple(ref, pax);
    } else if (ref.tipo === 'sandwich_fijo') {
        html += `<div style="font-size: 0.7rem; color: #64748b; margin-top: 2px;">${ref.sabor}</div>`;
    }
    
    html += `</div>`; // Cierre de dc-item-nombre
    
    // Controles de cantidad (estilo bubble)
    html += `<div class="dc-item-controles">`;
    
    // Si tiene selector de termo
    if (ref.selectorTermo) {
        html += `
            <button type="button" class="dc-btn-qty" onclick="cambiarCantidadDesayuno('${ref.id}', -1)">−</button>
            <input type="number" class="dc-input-qty" id="input_${ref.id}"
                value="${cantidadTotal}" min="0"
                onchange="actualizarCantidadDesayuno('${ref.id}', this.value)"
                data-base="${ref.cantidadPorPax}"
                ${ref.tipo === 'leche_especial' ? 'style="background: #fef3c7;"' : ''}>
            <button type="button" class="dc-btn-qty" onclick="cambiarCantidadDesayuno('${ref.id}', 1)">+</button>
            <select class="select-termo" style="font-size: 0.7rem; padding: 2px 4px; border: 1px solid #cbd5e1; border-radius: 4px; width: 80px; height: 24px; margin-left: 4px;"
                onchange="actualizarTipoTermo('${ref.id}', this.value)">
                <option value="acero">Acero</option>
                <option value="desechable" selected>Desech.</option>
            </select>
        `;
    } else {
        // Sin selector de termo - solo +/- y cantidad
        html += `
            <button type="button" class="dc-btn-qty" onclick="cambiarCantidadDesayuno('${ref.id}', -1)">−</button>
            <input type="number" class="dc-input-qty" id="input_${ref.id}"
                value="${cantidadTotal}" min="0"
                onchange="actualizarCantidadDesayuno('${ref.id}', this.value)"
                data-base="${ref.cantidadPorPax}">
            <button type="button" class="dc-btn-qty" onclick="cambiarCantidadDesayuno('${ref.id}', 1)">+</button>
            <span style="font-size: 0.7rem; color: #64748b; margin-left: 4px; min-width: 35px;">${ref.unidad}</span>
        `;
    }
    
    html += `</div>`; // Cierre de dc-item-controles
    
    return html;
}


// Generar HTML para selector de bollería
function generarHTMLBolleria(ref) {
    return `
        <div class="dropdown-bolleria">
            <button type="button" class="dropdown-btn" onclick="toggleBolleriaDropdown('${ref.id}')">
                <span class="dropdown-text" id="dropdown-text-${ref.id}">Seleccionar tipos</span>
                <span class="dropdown-arrow">▼</span>
            </button>
            <div class="dropdown-content" id="dropdown-${ref.id}">
                <div class="bolleria-checkbox-group">
                    ${ref.opciones.map(opcion => `
                        <label class="checkbox-bolleria">
                            <input type="checkbox" value="${opcion}"
                                onchange="actualizarBolleriaCheckbox('${ref.id}', this)">
                            <span>${opcion}</span>
                        </label>
                    `).join('')}
                </div>
            </div>
        </div>
    `;
}

// Generar HTML para sandwich simple (1 por persona)
function generarHTMLSandwichSimple(ref) {
    return `
        <div class="sandwich-select">
            <select class="select-sandwich" onchange="actualizarSandwichSeleccion('${ref.id}', this.value)">
                <option value="">Elegir sabor...</option>
                ${ref.opciones.map(opcion => `
                    <option value="${opcion}">${opcion}</option>
                `).join('')}
            </select>
        </div>
    `;
}

// Generar HTML para sandwiches múltiples (2 por persona - CLASSIC) - VERSIÓN SIMPLIFICADA
function generarHTMLSandwichMultiple(ref, pax) {
    let html = `<div class="sandwich-multiple-container" style="margin-top: 5px; width: 100%;">`;
    
    for (let i = 1; i <= ref.cantidadSandwiches; i++) {
        html += `
            <div class="sandwich-multiple-item" style="margin-bottom: 5px;">
                <select class="select-sandwich"
                    onchange="actualizarSandwichMultipleSeleccion('${ref.id}', ${i}, this.value)">
                    <option value="">Elegir sabor ${i}...</option>
                    ${ref.opciones.map(opcion => `
                        <option value="${opcion}">${opcion}</option>
                    `).join('')}
                </select>
            </div>
        `;
    }
    
    html += `</div>`;
    return html;
}

// Inicializar datos de referencia en window.referenciasDesayuno
function inicializarDatosReferenciaDesayuno(ref, cantidadTotal) {
    if (ref.tipo === 'bolleria') {
        window.referenciasDesayuno[ref.id] = {
            nombre: ref.nombre,
            cantidad: cantidadTotal,
            unidad: ref.unidad,
            tipo: ref.tipo,
            tipoTermo: 'desechable', // Valor por defecto
            opcionesSeleccionadas: [],
            opcionesDisponibles: ref.opciones || [],
            cantidadPorPax: ref.cantidadPorPax
        };
    } else if (ref.tipo === 'sandwich_multiple') {
        window.referenciasDesayuno[ref.id] = {
            nombre: ref.nombre,
            cantidad: cantidadTotal,
            unidad: ref.unidad,
            tipo: ref.tipo,
            tipoTermo: 'desechable',
            sandwiches: [],
            cantidadPorPax: ref.cantidadPorPax,
            cantidadSandwiches: ref.cantidadSandwiches
        };
        
        // Inicializar array de sandwiches
        for (let i = 1; i <= ref.cantidadSandwiches; i++) {
            window.referenciasDesayuno[ref.id].sandwiches.push({
                id: `${ref.id}_${i}`,
                sabor: '',
                cantidad: Math.ceil(cantidadTotal / ref.cantidadSandwiches)
            });
        }
    } else if (ref.tipo === 'sandwich') {
        window.referenciasDesayuno[ref.id] = {
            nombre: ref.nombre,
            cantidad: cantidadTotal,
            unidad: ref.unidad,
            tipo: ref.tipo,
            tipoTermo: 'desechable',
            sabor: '',
            opcionesDisponibles: ref.opciones || [],
            cantidadPorPax: ref.cantidadPorPax
        };
    } else if (ref.tipo === 'sandwich_fijo') {
        window.referenciasDesayuno[ref.id] = {
            nombre: ref.nombre,
            cantidad: cantidadTotal,
            unidad: ref.unidad,
            tipo: ref.tipo,
            tipoTermo: 'desechable',
            sabor: ref.sabor,
            cantidadPorPax: ref.cantidadPorPax
        };
    } else {
        window.referenciasDesayuno[ref.id] = {
            nombre: ref.nombre,
            cantidad: cantidadTotal,
            unidad: ref.unidad,
            tipo: ref.tipo,
            tipoTermo: 'desechable',
            cantidadPorPax: ref.cantidadPorPax
        };
    }
}


// ========== NUEVAS FUNCIONES PARA DESAYUNOS MEJORADOS ==========

/**
 * Actualiza la selección de sandwich múltiple (CLASSIC - 2 por persona)
 */
function actualizarSandwichMultipleSeleccion(refId, sandwichNum, sabor) {
    if (!window.referenciasDesayuno || !window.referenciasDesayuno[refId]) return;
    
    const refData = window.referenciasDesayuno[refId];
    
    if (refData.tipo === 'sandwich_multiple' && refData.sandwiches) {
        const sandwichIndex = sandwichNum - 1;
        if (sandwichIndex >= 0 && sandwichIndex < refData.sandwiches.length) {
            refData.sandwiches[sandwichIndex].sabor = sabor;
            
            // Recalcular cantidades por sabor
            const sandwichesConSabor = refData.sandwiches.filter(s => s.sabor);
            if (sandwichesConSabor.length > 0) {
                const cantidadPorSabor = Math.ceil(refData.cantidad / sandwichesConSabor.length);
                sandwichesConSabor.forEach(s => {
                    s.cantidad = cantidadPorSabor;
                });
            }
            
            console.log(`Sandwich ${sandwichNum} actualizado:`, sabor);
        }
    }
}

/**
 * Actualiza el tipo de termo seleccionado
 */
function actualizarTipoTermo(refId, tipoTermo) {
    if (!window.referenciasDesayuno || !window.referenciasDesayuno[refId]) return;
    
    window.referenciasDesayuno[refId].tipoTermo = tipoTermo;
    console.log(`Tipo de termo para ${refId}:`, tipoTermo);
}

/**
 * Actualiza cantidad de una referencia de desayuno
 */
function actualizarCantidadDesayuno(refId, nuevaCantidad) {
    if (!window.referenciasDesayuno || !window.referenciasDesayuno[refId]) return;
    
    const cantidad = parseInt(nuevaCantidad) || 0;
    window.referenciasDesayuno[refId].cantidad = cantidad;
    
    // NOTA: Ya no actualizamos el texto del contador de termos porque lo eliminamos
    
    // Si es sandwich múltiple, recalcular cantidades por sabor
    if (window.referenciasDesayuno[refId].tipo === 'sandwich_multiple') {
        const refData = window.referenciasDesayuno[refId];
        const sandwichesConSabor = refData.sandwiches.filter(s => s.sabor);
        
        if (sandwichesConSabor.length > 0) {
            const cantidadPorSabor = Math.ceil(cantidad / sandwichesConSabor.length);
            sandwichesConSabor.forEach(s => {
                s.cantidad = cantidadPorSabor;
            });
        }
    }
    
    console.log(`Cantidad actualizada para ${refId}:`, cantidad);
}


/**
 * Actualiza cantidades de desayuno basado en PAX
 */
function actualizarCantidadesDesayuno() {
    if (!window.menuSeleccionado || 
        parseInt(document.getElementById('categoria').value) !== 1) return;
    
    const pax = window.pax || 0;
    const container = document.getElementById('referenciasDesayunoGrid');
    
    if (!container) return;
    
    container.querySelectorAll('.desayuno-item').forEach(item => {
        const refId = item.dataset.id;
        const tipo = item.dataset.tipo;
        const input = item.querySelector('.cantidad-input-compact');
        
        if (!input || !window.referenciasDesayuno || !window.referenciasDesayuno[refId]) return;
        
        const baseCantidad = parseFloat(input.dataset.base) || 0;
        let nuevaCantidad;
        
        // NO actualizar automáticamente leches especiales
        if (tipo === 'leche_especial') {
            return; // Mantener valor manual
        }
        else if (tipo === 'termo') {
            // Café: 1 por cada 10 personas, otros: 1 por cada 20
            if (refId.includes('_cafe')) {
                nuevaCantidad = Math.ceil(pax * (1/10));
            } else {
                nuevaCantidad = Math.ceil(pax * (1/20));
            }
        } else if (tipo === 'zumo') {
            nuevaCantidad = Math.ceil(pax * baseCantidad);
        } else {
            nuevaCantidad = Math.ceil(pax * baseCantidad);
        }
        
        input.value = nuevaCantidad;
        window.referenciasDesayuno[refId].cantidad = nuevaCantidad;
        
        // Si es sandwich múltiple, recalcular
        if (window.referenciasDesayuno[refId].tipo === 'sandwich_multiple') {
            const refData = window.referenciasDesayuno[refId];
            const sandwichesConSabor = refData.sandwiches.filter(s => s.sabor);
            
            if (sandwichesConSabor.length > 0) {
                const cantidadPorSabor = Math.ceil(nuevaCantidad / sandwichesConSabor.length);
                sandwichesConSabor.forEach(s => {
                    s.cantidad = cantidadPorSabor;
                });
            }
        }
        
        // NOTA: Ya no actualizamos el texto del contador de termos porque lo eliminamos
    });
}

// ========== FUNCIONES PARA DESPLEGABLE DE BOLLERÍA ==========

/**
 * Muestra/oculta el desplegable de bollería
 */
function toggleBolleriaDropdown(refId) {
    const dropdown = document.getElementById('dropdown-' + refId);
    const btn = dropdown.previousElementSibling;
    const arrow = btn.querySelector('.dropdown-arrow');

    if (dropdown.style.display === 'block') {
        dropdown.style.display = 'none';
        arrow.innerHTML = '▼';
    } else {
        // Cerrar otros dropdowns abiertos
        document.querySelectorAll('.dropdown-content').forEach(d => { d.style.display = 'none'; });
        document.querySelectorAll('.dropdown-arrow').forEach(a => { a.innerHTML = '▼'; });

        // Calcular posición con position:fixed para no quedar recortado
        const rect = btn.getBoundingClientRect();
        dropdown.style.display = 'block';
        const dropH = dropdown.offsetHeight;
        const spaceBelow = window.innerHeight - rect.bottom;

        if (spaceBelow < dropH + 8) {
            // Abrir hacia arriba
            dropdown.style.top = (rect.top - dropH - 4) + 'px';
        } else {
            dropdown.style.top = (rect.bottom + 4) + 'px';
        }
        dropdown.style.left = rect.left + 'px';
        arrow.innerHTML = '▲';
    }
}

/**
 * Actualiza los checkboxes de bollería
 */
function actualizarBolleriaCheckbox(refId, checkbox) {
    if (!window.referenciasDesayuno || !window.referenciasDesayuno[refId]) return;
    
    const bolleria = window.referenciasDesayuno[refId];
    
    if (!bolleria.opcionesSeleccionadas) {
        bolleria.opcionesSeleccionadas = [];
    }
    
    if (checkbox.checked) {
        if (!bolleria.opcionesSeleccionadas.includes(checkbox.value)) {
            bolleria.opcionesSeleccionadas.push(checkbox.value);
        }
    } else {
        const index = bolleria.opcionesSeleccionadas.indexOf(checkbox.value);
        if (index > -1) {
            bolleria.opcionesSeleccionadas.splice(index, 1);
        }
    }
    
    // Actualizar texto del botón
    const dropdownText = document.getElementById(`dropdown-text-${refId}`);
    if (dropdownText) {
        if (bolleria.opcionesSeleccionadas.length === 0) {
            dropdownText.textContent = 'Seleccionar tipos';
        } else if (bolleria.opcionesSeleccionadas.length === 1) {
            dropdownText.textContent = bolleria.opcionesSeleccionadas[0];
        } else {
            dropdownText.textContent = `${bolleria.opcionesSeleccionadas.length} tipos seleccionados`;
        }
    }
    
    console.log(`Bollería ${refId}:`, bolleria.opcionesSeleccionadas);
}

/**
 * Actualiza selección de sandwich
 */
function actualizarSandwichSeleccion(sandwichId, sabor) {
    if (!window.referenciasDesayuno) return;
    
    for (const [refId, refData] of Object.entries(window.referenciasDesayuno)) {
        if (refData.tipo === 'sandwich' && refData.sandwiches) {
            const sandwichIndex = refData.sandwiches.findIndex(s => s.id === sandwichId);
            if (sandwichIndex !== -1) {
                refData.sandwiches[sandwichIndex].sabor = sabor;
                refData.sandwiches[sandwichIndex].nombre = sabor;
                return;
            }
        } else if (refData.tipo === 'sandwich' && refId === sandwichId) {
            refData.sabor = sabor;
            refData.nombre = sabor;
            return;
        }
    }
}

/**
 * Cerrar dropdowns al hacer clic fuera
 */
document.addEventListener('click', function(event) {
    if (!event.target.matches('.dropdown-btn') && !event.target.closest('.dropdown-content')) {
        document.querySelectorAll('.dropdown-content').forEach(dropdown => {
            dropdown.style.display = 'none';
        });
        document.querySelectorAll('.dropdown-arrow').forEach(arrow => {
            arrow.innerHTML = '▼';
        });
    }
});

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
    
    const cantidadBase = Math.ceil(window.pax * window.multiplicadores[tipo]);
    
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
    const cantidadSaladas = Math.ceil(window.pax * window.multiplicadores.saladas);
    const cantidadPostres = Math.ceil(window.pax * window.multiplicadores.postres);
    
    document.querySelectorAll('.referencia-option[data-tipo="saladas"] .cantidad-input').forEach(input => {
        input.value = cantidadSaladas;
    });
    
    document.querySelectorAll('.referencia-option[data-tipo="postres"] .cantidad-input').forEach(input => {
        input.value = cantidadPostres;
    });
    
    window.referenciasSeleccionadas.saladas.forEach(ref => {
        ref.cantidad = cantidadSaladas;
    });
    
    window.referenciasSeleccionadas.postres.forEach(ref => {
        ref.cantidad = cantidadPostres;
    });
}

/**
 * Actualiza cantidad de una referencia
 */
function actualizarCantidadReferencia(refId, tipo, cantidad) {
    const ref = window.referenciasSeleccionadas[tipo].find(r => r.id === refId);
    if (ref) {
        ref.cantidad = parseInt(cantidad);
    }
}

/**
 * Actualiza unidad de una referencia
 */
function actualizarUnidadReferencia(refId, tipo, unidad) {
    const ref = window.referenciasSeleccionadas[tipo].find(r => r.id === refId);
    if (ref) {
        ref.unidad = unidad;
    }
}

/**
 * Selecciona/deselecciona una referencia
 */
function seleccionarReferenciaPrincipal(refId, refNombre, tipo, cantidad, unidad, element) {
    const max = tipo === 'saladas' ? window.menuSeleccionado.items_salados_max : window.menuSeleccionado.items_postres_max;
    const min = tipo === 'saladas' ? window.menuSeleccionado.items_salados_min : window.menuSeleccionado.items_postres_min;
    const seleccionadas = window.referenciasSeleccionadas[tipo];
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

// ========== MENÚS ADICIONALES MEJORADOS ==========

// Variable para el menú adicional seleccionado en el modal
let menuAdicionalSeleccionadoModal = null;
let indiceMenuEditando = -1; // -1 = nuevo, >=0 = editando

function mostrarModalMenus() {
    document.getElementById('modalMenus').style.display = 'block';
    document.getElementById('modalCategoria').value = '';
    document.getElementById('modalMenusContainer').innerHTML = '';
    document.getElementById('modalMultiplicadorSection').style.display = 'none';
    document.getElementById('modalReferenciasSection').style.display = 'none';
    menuAdicionalSeleccionadoModal = null;
    indiceMenuEditando = -1;
    
    // Limpiar campos
    document.getElementById('modalPaxAdicional').value = '';
    document.getElementById('modalMultiplicadorSaladasAdicional').value = '1';
    document.getElementById('modalMultiplicadorPostresAdicional').value = '1';
}

function cerrarModalMenus() {
    document.getElementById('modalMenus').style.display = 'none';
    menuAdicionalSeleccionadoModal = null;
    indiceMenuEditando = -1;
}

function cargarMenusModal() {
    const categoriaId = document.getElementById('modalCategoria').value;
    const container = document.getElementById('modalMenusContainer');
    container.innerHTML = '';
    
    document.getElementById('modalMultiplicadorSection').style.display = 'none';
    document.getElementById('modalReferenciasSection').style.display = 'none';
    menuAdicionalSeleccionadoModal = null;
    
    if (!categoriaId) return;
    
    let menus = [];
    if (categoriaId == 1) {
        menus = [
            { id: 1001, nombre: 'HEALTHY ADICIONAL', descripcion: 'Termo café + leche + infusión + mini bollería + sandwich jamón/tomate + yogurt con muesli + zumo naranja' },
            { id: 1002, nombre: 'CLASSIC ADICIONAL', descripcion: 'Termo café + leche + infusión + 2 mini bollerías + 2 sandwiches + fruta preparada + zumo naranja' },
            { id: 1003, nombre: 'PREMIUM ADICIONAL', descripcion: 'Termo café + leche + infusión + cookies + pop dots + 2 sandwiches + yogurt con granola + smoothie' }
        ];
    }
    else if (categoriaId == 2) {
        menus = [
            { id: 1004, nombre: 'ELECONÓMICO ADICIONAL', descripcion: '7 salados + 1 postre', items_salados_min: 7, items_salados_max: 7, items_postres_min: 1, items_postres_max: 1 },
            { id: 1005, nombre: 'ELDEENMEDIO ADICIONAL', descripcion: '10 salados + 3 postres', items_salados_min: 10, items_salados_max: 10, items_postres_min: 3, items_postres_max: 3 },
            { id: 1006, nombre: 'ELMUYTOP ADICIONAL', descripcion: '12 salados + 3 postres', items_salados_min: 12, items_salados_max: 12, items_postres_min: 3, items_postres_max: 3 }
        ];
    }
    else if (categoriaId == 3) {
        menus = [
            { id: 1007, nombre: 'AFTERWORK ADICIONAL', descripcion: '6 items salados', items_salados_min: 6, items_salados_max: 6 },
            { id: 1008, nombre: 'VINOESPAÑOL ADICIONAL', descripcion: '7 items salados', items_salados_min: 7, items_salados_max: 7 },
            { id: 1009, nombre: 'COCTEL DECUATRO ADICIONAL', descripcion: '9 items salados', items_salados_min: 9, items_salados_max: 9 }
        ];
    }
    else if (categoriaId == 4) {
        menus = [
            { id: 1010, nombre: 'FOODBOX LUNCH ADICIONAL', descripcion: 'Ensalada + Sándwich + Postre + Bebida' }
        ];
    }
    else if (categoriaId == 5) {
        menus = [
            { id: 1011, nombre: 'BANDEJAS PREPARADAS', descripcion: 'Seleccion de Referencias' }
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
        <div class="menu-option" onclick="seleccionarMenuAdicionalModal(${menu.id}, this)" data-menu='${JSON.stringify(menu)}'>
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
 * Selecciona un menú adicional en el modal
 */
function seleccionarMenuAdicionalModal(menuId, element) {
    document.querySelectorAll('#modalMenusContainer .menu-option').forEach(opt => {
        opt.classList.remove('selected');
    });
    
    element.classList.add('selected');
    menuAdicionalSeleccionadoModal = JSON.parse(element.dataset.menu);
    
    // Mostrar secciones adicionales
    document.getElementById('modalPaxSection').style.display = 'block';
    
    if ([2, 3].includes(parseInt(document.getElementById('modalCategoria').value))) {
        document.getElementById('modalMultiplicadorSection').style.display = 'block';
        document.getElementById('modalReferenciasSection').style.display = 'block';
        
        // Actualizar etiquetas
        document.getElementById('modalMinSaladas').textContent = menuAdicionalSeleccionadoModal.items_salados_min;
        document.getElementById('modalMaxSaladas').textContent = menuAdicionalSeleccionadoModal.items_salados_max;
        
        if (menuAdicionalSeleccionadoModal.items_postres_min > 0) {
            document.getElementById('modalPostresGroup').style.display = 'block';
            document.getElementById('modalMinPostres').textContent = menuAdicionalSeleccionadoModal.items_postres_min;
            document.getElementById('modalMaxPostres').textContent = menuAdicionalSeleccionadoModal.items_postres_max;
        } else {
            document.getElementById('modalPostresGroup').style.display = 'none';
        }
        
        // Cargar referencias para este menú adicional
        cargarReferenciasAdicionales();
    } else {
        document.getElementById('modalMultiplicadorSection').style.display = 'none';
        document.getElementById('modalReferenciasSection').style.display = 'none';
    }
}

/**
 * Carga referencias para menú adicional
 */
async function cargarReferenciasAdicionales() {
    // Usamos las mismas referencias del menú principal
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
    
    mostrarReferenciasAdicionales(referenciasSaladas, 'modalReferenciasSaladasGrid', 'saladas');
    mostrarReferenciasAdicionales(referenciasPostres, 'modalReferenciasPostresGrid', 'postres');
}

/**
 * Muestra referencias para menú adicional
 */
function mostrarReferenciasAdicionales(referencias, containerId, tipo) {
    const container = document.getElementById(containerId);
    container.innerHTML = '';
    
    const paxAdicional = parseInt(document.getElementById('modalPaxAdicional').value) || 0;
    const multiplicador = tipo === 'saladas' ? 
        parseFloat(document.getElementById('modalMultiplicadorSaladasAdicional').value) || 1 :
        parseFloat(document.getElementById('modalMultiplicadorPostresAdicional').value) || 1;
    
    const cantidadBase = Math.ceil(paxAdicional * multiplicador);
    
    referencias.forEach(ref => {
        const div = document.createElement('div');
        div.className = 'referencia-option';
        div.innerHTML = `
            <span style="flex: 1;">${ref.nombre}</span>
            <div class="cantidad-control">
                <input type="number" class="cantidad-input" value="${cantidadBase}" min="1"
                       onchange="actualizarCantidadReferenciaAdicional(${ref.id}, '${tipo}', this.value)">
                <select class="unidad-select" onchange="actualizarUnidadReferenciaAdicional(${ref.id}, '${tipo}', this.value)">
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
                seleccionarReferenciaAdicional(ref.id, ref.nombre, tipo, cantidadBase, ref.unidad, div);
            }
        };
        
        container.appendChild(div);
    });
}

/**
 * Actualiza cantidades de referencias adicionales
 */
function actualizarCantidadesReferenciasAdicionales() {
    const paxAdicional = parseInt(document.getElementById('modalPaxAdicional').value) || 0;
    const multiplicadorSaladas = parseFloat(document.getElementById('modalMultiplicadorSaladasAdicional').value) || 1;
    const multiplicadorPostres = parseFloat(document.getElementById('modalMultiplicadorPostresAdicional').value) || 1;
    
    const cantidadSaladas = Math.ceil(paxAdicional * multiplicadorSaladas);
    const cantidadPostres = Math.ceil(paxAdicional * multiplicadorPostres);
    
    document.querySelectorAll('#modalReferenciasSaladasGrid .cantidad-input').forEach(input => {
        input.value = cantidadSaladas;
    });
    
    document.querySelectorAll('#modalReferenciasPostresGrid .cantidad-input').forEach(input => {
        input.value = cantidadPostres;
    });
    
    // También actualizar en el objeto temporal si existe
    if (window.referenciasAdicionalesTemporales) {
        window.referenciasAdicionalesTemporales.saladas.forEach(ref => {
            ref.cantidad = cantidadSaladas;
        });
        window.referenciasAdicionalesTemporales.postres.forEach(ref => {
            ref.cantidad = cantidadPostres;
        });
    }
}

/**
 * Selecciona/deselecciona una referencia para menú adicional
 */
function seleccionarReferenciaAdicional(refId, refNombre, tipo, cantidad, unidad, element) {
    if (!window.referenciasAdicionalesTemporales) {
        window.referenciasAdicionalesTemporales = { saladas: [], postres: [] };
    }
    
    const max = tipo === 'saladas' ? menuAdicionalSeleccionadoModal.items_salados_max : menuAdicionalSeleccionadoModal.items_postres_max;
    const min = tipo === 'saladas' ? menuAdicionalSeleccionadoModal.items_salados_min : menuAdicionalSeleccionadoModal.items_postres_min;
    const seleccionadas = window.referenciasAdicionalesTemporales[tipo];
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

function actualizarCantidadReferenciaAdicional(refId, tipo, cantidad) {
    if (window.referenciasAdicionalesTemporales && window.referenciasAdicionalesTemporales[tipo]) {
        const ref = window.referenciasAdicionalesTemporales[tipo].find(r => r.id === refId);
        if (ref) {
            ref.cantidad = parseInt(cantidad);
        }
    }
}

function actualizarUnidadReferenciaAdicional(refId, tipo, unidad) {
    if (window.referenciasAdicionalesTemporales && window.referenciasAdicionalesTemporales[tipo]) {
        const ref = window.referenciasAdicionalesTemporales[tipo].find(r => r.id === refId);
        if (ref) {
            ref.unidad = unidad;
        }
    }
}

/**
 * Confirma y agrega el menú adicional
 */
function confirmarMenuAdicional() {
    if (!menuAdicionalSeleccionadoModal) {
        mostrarMensaje('❌ Por favor, selecciona un menú adicional', 'error');
        return;
    }
    
    const paxAdicional = parseInt(document.getElementById('modalPaxAdicional').value);
    if (!paxAdicional || paxAdicional < 1) {
        mostrarMensaje('❌ Por favor, ingresa un número válido de PAX', 'error');
        return;
    }
    
    // Validar referencias si corresponde
    if ([2, 3].includes(parseInt(document.getElementById('modalCategoria').value))) {
        if (!window.referenciasAdicionalesTemporales) {
            window.referenciasAdicionalesTemporales = { saladas: [], postres: [] };
        }
        
        const seleccionadasSaladas = window.referenciasAdicionalesTemporales.saladas.length;
        if (seleccionadasSaladas < menuAdicionalSeleccionadoModal.items_salados_min) {
            mostrarMensaje(`❌ Debes seleccionar al menos ${menuAdicionalSeleccionadoModal.items_salados_min} referencias saladas`, 'error');
            return;
        }
    }
    
    const menuData = {
        ...menuAdicionalSeleccionadoModal,
        pax_adicional: paxAdicional,
        categoria: document.getElementById('modalCategoria').selectedOptions[0].text,
        multiplicadores: {
            saladas: parseFloat(document.getElementById('modalMultiplicadorSaladasAdicional').value) || 1,
            postres: parseFloat(document.getElementById('modalMultiplicadorPostresAdicional').value) || 1
        },
        referencias: window.referenciasAdicionalesTemporales ? { ...window.referenciasAdicionalesTemporales } : { saladas: [], postres: [] }
    };
    
    if (indiceMenuEditando >= 0) {
        // Editar menú existente
        window.menusAdicionales[indiceMenuEditando] = menuData;
    } else {
        // Agregar nuevo menú
        window.menusAdicionales.push(menuData);
    }
    
    actualizarListaMenusAdicionalesCompleta();
    cerrarModalMenus();
    window.referenciasAdicionalesTemporales = null;
}

/**
 * Edita un menú adicional existente
 */
function editarMenuAdicional(index) {
    const menu = window.menusAdicionales[index];
    if (!menu) return;
    
    indiceMenuEditando = index;
    mostrarModalMenus();
    
    // Configurar valores del menú a editar
    setTimeout(() => {
        document.getElementById('modalCategoria').value = 
            menu.categoria.includes('Desayunos') ? '1' :
            menu.categoria.includes('Foodbox') ? '2' :
            menu.categoria.includes('Servicios') ? '3' : '4';
        
        cargarMenusModal();
        
        // Seleccionar el menú correcto después de cargar
        setTimeout(() => {
            const menuOption = document.querySelector(`#modalMenusContainer .menu-option[data-menu*='"id":${menu.id}"]`);
            if (menuOption) {
                seleccionarMenuAdicionalModal(menu.id, menuOption);
                
                // Llenar los campos
                document.getElementById('modalPaxAdicional').value = menu.pax_adicional;
                document.getElementById('modalMultiplicadorSaladasAdicional').value = menu.multiplicadores?.saladas || 1;
                document.getElementById('modalMultiplicadorPostresAdicional').value = menu.multiplicadores?.postres || 1;
                
                // Configurar referencias temporales
                window.referenciasAdicionalesTemporales = menu.referencias ? 
                    { saladas: [...menu.referencias.saladas], postres: [...menu.referencias.postres] } : 
                    { saladas: [], postres: [] };
                
                // Marcar referencias seleccionadas
                setTimeout(() => {
                    if (window.referenciasAdicionalesTemporales) {
                        window.referenciasAdicionalesTemporales.saladas.forEach(ref => {
                            const elemento = document.querySelector(`#modalReferenciasSaladasGrid [data-id="${ref.id}"]`);
                            if (elemento) {
                                elemento.classList.add('selected');
                                elemento.querySelector('.cantidad-input').value = ref.cantidad;
                                elemento.querySelector('.unidad-select').value = ref.unidad;
                            }
                        });
                        
                        window.referenciasAdicionalesTemporales.postres.forEach(ref => {
                            const elemento = document.querySelector(`#modalReferenciasPostresGrid [data-id="${ref.id}"]`);
                            if (elemento) {
                                elemento.classList.add('selected');
                                elemento.querySelector('.cantidad-input').value = ref.cantidad;
                                elemento.querySelector('.unidad-select').value = ref.unidad;
                            }
                        });
                    }
                }, 300);
            }
        }, 300);
    }, 100);
}

/**
 * Actualiza la lista de menús adicionales con todas las funcionalidades
 */
function actualizarListaMenusAdicionalesCompleta() {
    const container = document.getElementById('menusAdicionalesList');
    
    if (window.menusAdicionales.length === 0) {
        container.innerHTML = '<p style="color: #94a3b8; text-align: center; font-size: 0.9rem;">No hay menús adicionales añadidos</p>';
        return;
    }
    
    let html = '';
    window.menusAdicionales.forEach((menu, index) => {
        let referenciasHtml = '';
        
        if (menu.referencias && (menu.referencias.saladas.length > 0 || menu.referencias.postres.length > 0)) {
            referenciasHtml = '<div style="margin-top: 8px; font-size: 0.85rem; color: #475569;">';
            
            if (menu.referencias.saladas.length > 0) {
                referenciasHtml += '<div><strong>Saladas:</strong></div>';
                menu.referencias.saladas.forEach(ref => {
                    referenciasHtml += `<div>• ${ref.nombre} - ${ref.cantidad} ${ref.unidad}</div>`;
                });
            }
            
            if (menu.referencias.postres.length > 0) {
                referenciasHtml += '<div style="margin-top: 5px;"><strong>Postres:</strong></div>';
                menu.referencias.postres.forEach(ref => {
                    referenciasHtml += `<div>• ${ref.nombre} - ${ref.cantidad} ${ref.unidad}</div>`;
                });
            }
            
            referenciasHtml += '</div>';
        }
        
        html += `
        <div class="menu-adicional-item">
            <div class="menu-adicional-info">
                <h4>${menu.nombre}</h4>
                <p>${menu.categoria} - ${menu.pax_adicional} PAX</p>
                ${menu.multiplicadores ? 
                    `<p style="font-size: 0.85rem; color: #64748b;">
                    Multiplicadores: Saladas ×${menu.multiplicadores.saladas} ${menu.multiplicadores.postres ? `| Postres ×${menu.multiplicadores.postres}` : ''}
                    </p>` : ''}
                <p style="font-size: 0.8rem; color: #64748b;">${menu.descripcion}</p>
                ${referenciasHtml}
            </div>
            <div class="menu-adicional-controls">
                <input type="number" class="menu-pax-input" value="${menu.pax_adicional}" min="1"
                       onchange="actualizarPaxMenuAdicional(${index}, this.value)">
                <button type="button" class="btn-editar" onclick="editarMenuAdicional(${index})" style="background: #3b82f6; color: white; border: none; border-radius: 4px; padding: 6px 12px; cursor: pointer;">✏️</button>
                <button type="button" class="btn-remove-menu" onclick="eliminarMenuAdicional(${index})">✕</button>
            </div>
        </div>
        `;
    });
    
    container.innerHTML = html;
}

/**
 * Elimina un menú adicional
 */
function eliminarMenuAdicional(index) {
    if (confirm('¿Estás seguro de que deseas eliminar este menú adicional?')) {
        window.menusAdicionales.splice(index, 1);
        actualizarListaMenusAdicionalesCompleta();
    }
}

/**
 * Actualiza PAX de un menú adicional
 */
function actualizarPaxMenuAdicional(index, valor) {
    if (window.menusAdicionales[index]) {
        const nuevoPax = parseInt(valor) || 1;
        window.menusAdicionales[index].pax_adicional = nuevoPax;
        
        // Actualizar cantidades de referencias si existen
        if (window.menusAdicionales[index].multiplicadores && window.menusAdicionales[index].referencias) {
            const multiplicadorSaladas = window.menusAdicionales[index].multiplicadores.saladas || 1;
            const multiplicadorPostres = window.menusAdicionales[index].multiplicadores.postres || 1;
            
            const nuevaCantidadSaladas = Math.ceil(nuevoPax * multiplicadorSaladas);
            const nuevaCantidadPostres = Math.ceil(nuevoPax * multiplicadorPostres);
            
            window.menusAdicionales[index].referencias.saladas.forEach(ref => {
                ref.cantidad = nuevaCantidadSaladas;
            });
            
            window.menusAdicionales[index].referencias.postres.forEach(ref => {
                ref.cantidad = nuevaCantidadPostres;
            });
        }
        
        actualizarListaMenusAdicionalesCompleta();
    }
}

// ========== FUNCIÓN PARA ACTUALIZAR CANTIDADES DE DESAYUNO ==========

function actualizarCantidadesDesayuno() {
    if (!window.menuSeleccionado || parseInt(document.getElementById('categoria').value) !== 1) return;
    
    const pax = window.pax || 0;
    const container = document.getElementById('referenciasDesayunoGrid');
    
    if (!container) return;
    
    const termosPorPersona = 1/10;
    const zumoPorPersona = 1/5;
    
    container.querySelectorAll('.desayuno-item').forEach(item => {
        const refId = item.dataset.id;
        const tipo = item.dataset.tipo;
        const input = item.querySelector('.cantidad-input-compact');
        
        if (!input) return;
        
        const baseCantidad = parseFloat(input.dataset.base) || 0;
        let nuevaCantidad;

        if (tipo === 'leche_especial') {
            return; // Siempre manual, nunca recalcular
        } else if (tipo === 'termo') {
            nuevaCantidad = Math.ceil(pax * termosPorPersona);
        } else if (tipo === 'zumo') {
            nuevaCantidad = Math.ceil(pax * zumoPorPersona);
        } else {
            nuevaCantidad = Math.ceil(pax * baseCantidad);
        }
        
        input.value = nuevaCantidad;
        
        if (window.referenciasDesayuno && window.referenciasDesayuno[refId]) {
            window.referenciasDesayuno[refId].cantidad = nuevaCantidad;
        }
    });
}



/**
 * Actualiza el multiplicador y recalcula cantidades
 */
function actualizarMultiplicador(tipo, valor) {
    if (!window.multiplicadores) window.multiplicadores = { saladas: 1.5, postres: 1 };
    
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
    window.referenciasSeleccionadas = { saladas: [], postres: [] };
    
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
        const menuJson = JSON.stringify(menu).replace(/'/g, '&#39;');
        html += `
        <div class="menu-option" data-menu='${menuJson}' style="display:flex; align-items:center; gap:8px;">
            <div class="menu-option-info" onclick="seleccionarMenu(${menu.id}, this.closest('.menu-option'))" style="flex:1; cursor:pointer;">
                <h4>${menu.nombre}</h4>
                <p>${menu.descripcion || 'Sin descripcion'}</p>
                ${menu.items_salados_min > 0 ?
                    `<p style="font-size: 0.75rem; color: #64748b; margin-top: 3px;">
                        Salados: ${menu.items_salados_min}-${menu.items_salados_max}
                        ${menu.items_postres_min > 0 ? `, Postres: ${menu.items_postres_min}-${menu.items_postres_max}` : ''}
                    </p>` : ''
                }
            </div>
            <button type="button" class="btn-anadir-menu"
                    onclick="event.stopPropagation(); anadirMenuComoAdicional(${menu.id}, this.closest('.menu-option'))"
                    title="Añadir como menu adicional">
                + Añadir
            </button>
        </div>
        `;
    });
    
    container.innerHTML = html;
}


/**
 * Limpia todas las secciones de configuracion de menu
 */
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
}

/**
 * Aniade el menu como adicional sin reemplazar el menu principal
 */
function anadirMenuComoAdicional(menuId, element) {
    const menu = JSON.parse(element.dataset.menu);
    const paxActual = parseInt(document.getElementById('pax').value) || 0;
    const categoriaTexto = document.getElementById('categoria').selectedOptions[0]?.text || '';

    if (!window.menusAdicionales) window.menusAdicionales = [];

    const menuData = {
        ...menu,
        pax_adicional: paxActual,
        categoria: categoriaTexto,
        multiplicadores: { saladas: 1.5, postres: 1 },
        referencias: { saladas: [], postres: [] }
    };

    window.menusAdicionales.push(menuData);

    if (typeof actualizarListaMenusAdicionalesCompleta === 'function') {
        actualizarListaMenusAdicionalesCompleta();
    }

    // Flash verde en la card
    element.style.transition = 'background 0.2s';
    element.style.background = '#d1fae5';
    setTimeout(() => { element.style.background = ''; }, 700);

    mostrarMensaje('"' + menu.nombre + '" anadido como menu adicional', 'success');
}

/**
 * Selecciona un menú principal
 */
async function seleccionarMenu(menuId, element) {
    // Limpiar secciones del menú anterior
    limpiarSeccionesMenu();

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
                    <div class="form-section" id="desayunoReferencesSection" style="display: block;">
                        <h3>🥐 Referencias del Desayuno</h3>
                        <p style="color: #64748b; margin-bottom: 15px;">Cantidades por persona. Puedes modificar si es necesario:</p>
                        <div id="referenciasDesayunoGrid" class="dc-items-grid"></div>
                    </div>
                `);
            }

            desayunoSection = document.getElementById('desayunoReferencesSection');
        } else {
            desayunoSection.style.display = 'block';
        }

        // Cargar referencias del desayuno
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

        if (window.pax > 0) {
            document.getElementById('multiplicadorSection').style.display = 'block';

            if (window.menuSeleccionado.items_postres_min > 0) {
                document.getElementById('multiplicadorPostresSection').style.display = 'block';
            } else {
                document.getElementById('multiplicadorPostresSection').style.display = 'none';
            }

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

        document.getElementById('minSaladas').textContent = window.menuSeleccionado.items_salados_min || 0;
        document.getElementById('maxSaladas').textContent = window.menuSeleccionado.items_salados_max || 0;

        if (window.menuSeleccionado.items_postres_min > 0) {
            document.getElementById('referenciasPostresGroup').style.display = 'block';
            document.getElementById('minPostres').textContent = window.menuSeleccionado.items_postres_min;
            document.getElementById('maxPostres').textContent = window.menuSeleccionado.items_postres_max;
        } else {
            document.getElementById('referenciasPostresGroup').style.display = 'none';
        }

        return;
    }

    // ===== FOODBOX LUNCH =====
    if (categoriaId === 4) {
        // Ocultar secciones que no aplican
        document.getElementById('multiplicadorSection').style.display = 'none';
        document.getElementById('referenciasSection').style.display = 'none';

        const desayunoSection = document.getElementById('desayunoReferencesSection');
        if (desayunoSection) {
            desayunoSection.style.display = 'none';
        }

        // Cargar opciones de Foodbox Lunch
        if (typeof cargarOpcionesFoodboxLunch === 'function') {
            cargarOpcionesFoodboxLunch();
        } else {
            console.error('No existe cargarOpcionesFoodboxLunch(). Falta importar/definir el módulo Foodbox Lunch.');
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


// Función para botones +/- en Desayunos
function cambiarCantidadDesayuno(refId, delta) {
    const input = document.getElementById('input_' + refId);
    if (!input) return;
    
    let valorActual = parseInt(input.value) || 0;
    let nuevoValor = valorActual + delta;
    
    if (nuevoValor < 0) nuevoValor = 0;
    
    input.value = nuevoValor;
    actualizarCantidadDesayuno(refId, nuevoValor);
}

window.cambiarCantidadDesayuno = cambiarCantidadDesayuno;
