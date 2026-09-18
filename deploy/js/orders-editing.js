// ========== EDICION Y REVISION OPERATIVA DE COMANDAS ==========
// Mantiene juntas las reglas que conservan estados de cocina/logistica al editar.

function normalizarClaveOperacion(valor) {
    return String(valor || '').trim().toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '');
}

function normalizarValorRevision(valor) {
    if (valor === null || valor === undefined) return '';
    if (typeof valor === 'number') return Number.isFinite(valor) ? String(valor) : '';
    if (typeof valor === 'boolean') return valor ? 'si' : 'no';
    return String(valor).trim();
}

function simplificarMenuRevision(menu = {}) {
    return {
        nombre: normalizarValorRevision(menu.nombre || menu.menu_nombre || menu.menu_principal?.nombre),
        pax: Number(menu.pax || menu.pax_adicional || 0) || 0,
        referencias_desayuno: menu.referencias_desayuno || null,
        referencias: menu.referencias || null,
        bandejas: menu.bandejas || null,
        foodbox_lunch: menu.foodbox_lunch || null,
        tipo_menaje: menu.tipo_menaje || null
    };
}

function simplificarMaterialRevision(material = {}) {
    const salida = {};
    ['bebidas', 'menaje', 'extras'].forEach(tipo => {
        salida[tipo] = (material?.[tipo] || []).map(item => ({
            nombre: normalizarValorRevision(item.nombre),
            cantidad: Number(item.cantidad || 0) || 0,
            unidad: normalizarValorRevision(item.unidad || item.unidad_comanda),
            subitems: (item.subitems_selected || []).map(sub => ({
                nombre: normalizarValorRevision(sub.nombre),
                cantidad: Number(sub.cantidad || 0) || 0,
                unidad: normalizarValorRevision(sub.unidad || sub.unidad_comanda)
            }))
        }));
    });
    return salida;
}

function crearResumenRevisionComanda(comanda = {}) {
    return {
        empresa: normalizarValorRevision(comanda.empresa || comanda.company_name),
        responsable: normalizarValorRevision(comanda.responsable),
        pax: Number(comanda.pax || comanda.pax_total || 0) || 0,
        fecha_evento: normalizarValorRevision(comanda.fecha_evento),
        hora_salida: normalizarValorRevision(comanda.hora_salida),
        categoria: normalizarValorRevision(comanda.categoria_id || comanda.categoria || comanda.menu_categoria_nombre),
        menu_principal: simplificarMenuRevision(comanda.menu_principal || {}),
        menus_adicionales: (comanda.menus_adicionales || []).map(simplificarMenuRevision),
        alergias: {
            notas: normalizarValorRevision(comanda.alergias?.notas),
            intolerancias: comanda.alergias?.intolerancias || null
        },
        logistica: {
            nombre_contacto: normalizarValorRevision(comanda.logistica_inline?.nombre_contacto || comanda.logistica?.nombre_contacto),
            telefono_contacto: normalizarValorRevision(comanda.logistica_inline?.telefono_contacto || comanda.logistica?.telefono_contacto),
            direccion: normalizarValorRevision(comanda.logistica_inline?.direccion || comanda.logistica?.direccion),
            codigo_postal: normalizarValorRevision(comanda.logistica_inline?.codigo_postal || comanda.logistica?.codigo_postal),
            montaje: normalizarValorRevision(comanda.logistica_inline?.montaje || comanda.logistica?.montaje),
            duracion_evento: normalizarValorRevision(comanda.logistica_inline?.duracion_evento || comanda.logistica?.duracion_evento),
            cantidad_camareros: normalizarValorRevision(comanda.logistica_inline?.cantidad_camareros || comanda.logistica?.cantidad_camareros),
            hora_entrega: normalizarValorRevision(comanda.logistica_inline?.hora_entrega || comanda.logistica?.hora_entrega),
            hora_evento: normalizarValorRevision(comanda.logistica_inline?.hora_evento || comanda.logistica?.hora_evento),
            notas_logistica: normalizarValorRevision(comanda.logistica_inline?.notas_logistica || comanda.logistica?.notas_logistica)
        },
        material_logistica: simplificarMaterialRevision(comanda.material_logistica || {})
    };
}

function crearDetalleRevisionComanda(anterior, nueva) {
    const antes = crearResumenRevisionComanda(anterior);
    const despues = crearResumenRevisionComanda(nueva);
    const cambios = [];
    const cambiosDetalle = [];

    const comparar = (label, a, b) => {
        if (JSON.stringify(a) !== JSON.stringify(b)) cambios.push(label);
    };
    const compararCampo = (grupo, label, a, b) => {
        const antesValor = normalizarValorRevision(a);
        const despuesValor = normalizarValorRevision(b);
        if (antesValor === despuesValor) return;
        if (!cambios.includes(grupo)) cambios.push(grupo);
        cambiosDetalle.push({
            grupo,
            campo: label,
            antes: antesValor || 'Vacio',
            despues: despuesValor || 'Vacio'
        });
    };

    compararCampo('datos generales', 'Empresa', antes.empresa, despues.empresa);
    compararCampo('datos generales', 'Responsable', antes.responsable, despues.responsable);
    compararCampo('datos generales', 'Fecha del evento', antes.fecha_evento, despues.fecha_evento);
    compararCampo('datos generales', 'Hora de salida', antes.hora_salida, despues.hora_salida);
    compararCampo('datos generales', 'Categoria', antes.categoria, despues.categoria);
    compararCampo('pax', 'Pax', antes.pax, despues.pax);

    comparar('menus y cantidades de cocina', {
        menu_principal: antes.menu_principal,
        menus_adicionales: antes.menus_adicionales
    }, {
        menu_principal: despues.menu_principal,
        menus_adicionales: despues.menus_adicionales
    });
    comparar('intolerancias/notas de cocina', antes.alergias, despues.alergias);
    compararCampo('datos de entrega', 'Contacto', antes.logistica.nombre_contacto, despues.logistica.nombre_contacto);
    compararCampo('datos de entrega', 'Telefono', antes.logistica.telefono_contacto, despues.logistica.telefono_contacto);
    compararCampo('datos de entrega', 'Direccion', antes.logistica.direccion, despues.logistica.direccion);
    compararCampo('datos de entrega', 'Codigo postal', antes.logistica.codigo_postal, despues.logistica.codigo_postal);
    compararCampo('datos de entrega', 'Montaje', antes.logistica.montaje, despues.logistica.montaje);
    compararCampo('datos de entrega', 'Hora de entrega', antes.logistica.hora_entrega, despues.logistica.hora_entrega);
    compararCampo('datos de entrega', 'Hora del evento', antes.logistica.hora_evento, despues.logistica.hora_evento);
    compararCampo('datos de entrega', 'Notas logistica', antes.logistica.notas_logistica, despues.logistica.notas_logistica);
    comparar('material de logistica', antes.material_logistica, despues.material_logistica);

    return {
        cambios,
        cambiosDetalle,
        paxAnterior: antes.pax,
        paxNuevo: despues.pax
    };
}

function crearRegistroRevisionOperativa(anterior, nueva) {
    const detalle = crearDetalleRevisionComanda(anterior, nueva);
    if (!detalle.cambios.length) return null;

    const paxCambio = detalle.paxAnterior !== detalle.paxNuevo
        ? ` Pax ${detalle.paxAnterior} -> ${detalle.paxNuevo}.`
        : '';

    return {
        at: new Date().toISOString(),
        by: window.currentUser?.user_metadata?.full_name || window.currentUser?.email || 'Usuario local',
        type: 'order_changed',
        changes: detalle.cambios,
        changes_detail: detalle.cambiosDetalle,
        pax_before: detalle.paxAnterior,
        pax_after: detalle.paxNuevo,
        message: `Comanda editada: ${detalle.cambiosDetalle.length ? detalle.cambiosDetalle.map(c => `${c.campo}: ${c.antes} -> ${c.despues}`).join(', ') : detalle.cambios.join(', ')}.${paxCambio}`.trim()
    };
}

function aplicarRevisionCocinaEnEdicion(anterior, nueva, revision) {
    const tieneAvance = anterior?.kitchen_items_state && Object.values(anterior.kitchen_items_state).some(Boolean);

    nueva.kitchen_status = anterior.kitchen_status || anterior.estado_cocina || nueva.kitchen_status || 'sin_producir';
    nueva.estado_cocina = anterior.estado_cocina || nueva.kitchen_status;
    nueva.kitchen_assigned_to = anterior.kitchen_assigned_to || '';
    nueva.kitchen_items_state = { ...(anterior.kitchen_items_state || {}) };
    nueva.kitchen_action_log = [...(anterior.kitchen_action_log || [])];
    nueva.kitchen_ready_at = anterior.kitchen_ready_at || null;
    nueva.kitchen_ready_by = anterior.kitchen_ready_by || '';

    if (revision) {
        const itemsAntes = typeof getProduccionCocinaDetalle === 'function'
            ? getProduccionCocinaDetalle(anterior).flatMap(grupo => grupo.items)
            : [];
        const itemsDespues = typeof getProduccionCocinaDetalle === 'function'
            ? getProduccionCocinaDetalle(nueva).flatMap(grupo => grupo.items)
            : [];
        const mapaAntes = new Map(itemsAntes.map(item => [item.key, item]));
        nueva.kitchen_items_updates = { ...(anterior.kitchen_items_updates || {}) };
        itemsDespues.forEach(item => {
            const itemAnterior = mapaAntes.get(item.key);
            if (!itemAnterior) {
                nueva.kitchen_items_updates[item.key] = {
                    tipo: 'nuevo',
                    nombre: item.nombre,
                    cantidad_after: item.cantidad,
                    unidad: item.unidad || 'uds'
                };
                return;
            }
            if (Number(itemAnterior.cantidad || 0) !== Number(item.cantidad || 0) || (itemAnterior.unidad || '') !== (item.unidad || '')) {
                nueva.kitchen_items_updates[item.key] = {
                    tipo: 'cantidad',
                    nombre: item.nombre,
                    cantidad_before: itemAnterior.cantidad,
                    cantidad_after: item.cantidad,
                    unidad: item.unidad || itemAnterior.unidad || 'uds'
                };
            }
        });

        nueva.kitchen_action_log.push({
            at: revision.at,
            by: revision.by,
            action: 'Comanda editada',
            detail: revision.message
        });
        nueva.kitchen_revision_notice = revision;
        nueva.kitchen_completed_confirmed_at = null;
        nueva.kitchen_completed_confirmed_by = '';
    } else {
        nueva.kitchen_completed_confirmed_at = anterior.kitchen_completed_confirmed_at || null;
        nueva.kitchen_completed_confirmed_by = anterior.kitchen_completed_confirmed_by || '';
    }

    if (typeof getProducidosCocina === 'function') {
        nueva.kitchen_produced_items = getProducidosCocina(nueva);
    } else {
        nueva.kitchen_produced_items = anterior.kitchen_produced_items || 0;
    }
}

function getClaveMaterialOperacion(tipo, item) {
    return [
        tipo,
        item?.item_id || item?.material_id || item?.id || '',
        item?.nombre || '',
        item?.unidad || item?.unidad_comanda || ''
    ].map(normalizarClaveOperacion).filter(Boolean).join(':');
}

function mapearMaterialPreparado(material) {
    const mapa = new Map();
    ['bebidas', 'menaje', 'extras'].forEach(tipo => {
        (material?.[tipo] || []).forEach(item => {
            const key = getClaveMaterialOperacion(tipo, item);
            if (key) mapa.set(key, item);
            (item.subitems_selected || []).forEach(subitem => {
                const subKey = getClaveMaterialOperacion(`${tipo}:sub`, subitem);
                if (subKey) mapa.set(subKey, subitem);
            });
        });
    });
    return mapa;
}

function aplicarRevisionLogisticaEnEdicion(anterior, nueva, revision) {
    const materialAnterior = anterior?.material_logistica || {};
    const materialNuevo = nueva?.material_logistica || {};
    const mapaAnterior = mapearMaterialPreparado(materialAnterior);
    const habiaAvance = Array.from(mapaAnterior.values()).some(item => item.preparado);

    ['bebidas', 'menaje', 'extras'].forEach(tipo => {
        (materialNuevo?.[tipo] || []).forEach(item => {
            const anteriorItem = mapaAnterior.get(getClaveMaterialOperacion(tipo, item));
            if (!anteriorItem) {
                item.preparado = false;
                item.material_nuevo = true;
                item.cantidad_actualizada = false;
                delete item.cantidad_anterior;
            }
            if (anteriorItem?.preparado) item.preparado = true;
            if (anteriorItem && Number(anteriorItem.cantidad || 0) !== Number(item.cantidad || 0)) {
                item.cantidad_anterior = anteriorItem.cantidad;
                item.cantidad_actualizada = true;
                item.material_nuevo = false;
            }
            (item.subitems_selected || []).forEach(subitem => {
                const anteriorSubitem = mapaAnterior.get(getClaveMaterialOperacion(`${tipo}:sub`, subitem));
                if (!anteriorSubitem) {
                    subitem.preparado = false;
                    subitem.material_nuevo = true;
                    subitem.cantidad_actualizada = false;
                    delete subitem.cantidad_anterior;
                }
                if (anteriorSubitem?.preparado) subitem.preparado = true;
                if (anteriorSubitem && Number(anteriorSubitem.cantidad || 0) !== Number(subitem.cantidad || 0)) {
                    subitem.cantidad_anterior = anteriorSubitem.cantidad;
                    subitem.cantidad_actualizada = true;
                    subitem.material_nuevo = false;
                }
            });
        });
    });

    nueva.logistics_status = anterior.logistics_status || anterior.estado_logistica || nueva.logistics_status || 'sin_preparar';
    nueva.estado_logistica = anterior.estado_logistica || nueva.logistics_status;
    nueva.logistics_assigned_to = anterior.logistics_assigned_to || '';
    nueva.logistics_action_log = [...(anterior.logistics_action_log || [])];
    nueva.logistics_ready_at = anterior.logistics_ready_at || null;
    nueva.logistics_ready_by = anterior.logistics_ready_by || '';
    nueva.inventory_deducted_at = anterior.inventory_deducted_at || null;
    nueva.inventory_deducted_by = anterior.inventory_deducted_by || '';

    if (revision) {
        nueva.logistics_action_log.push({
            at: revision.at,
            by: revision.by,
            action: 'Comanda editada',
            detail: revision.message
        });
        nueva.logistics_revision_notice = revision;
        nueva.logistics_completed_confirmed_at = null;
        nueva.logistics_completed_confirmed_by = '';
    } else {
        nueva.logistics_completed_confirmed_at = anterior.logistics_completed_confirmed_at || null;
        nueva.logistics_completed_confirmed_by = anterior.logistics_completed_confirmed_by || '';
    }

    const materiales = typeof getMaterialLogisticaPlano === 'function'
        ? getMaterialLogisticaPlano(materialNuevo)
        : ['bebidas', 'menaje', 'extras'].flatMap(tipo => materialNuevo?.[tipo] || []);
    nueva.logistics_prepared_items = materiales.filter(item => item.preparado).length;
}

function conservarAvanceOperativoEnEdicion(anterior, nueva) {
    if (!anterior || !nueva) return nueva;
    const revision = crearRegistroRevisionOperativa(anterior, nueva);
    nueva.operational_revision_log = [...(anterior.operational_revision_log || [])];
    if (revision) nueva.operational_revision_log.push(revision);
    aplicarRevisionCocinaEnEdicion(anterior, nueva, revision);
    aplicarRevisionLogisticaEnEdicion(anterior, nueva, revision);
    return nueva;
}

function clonarDatoEdicion(valor) {
    try {
        return JSON.parse(JSON.stringify(valor || null));
    } catch (error) {
        return valor;
    }
}

function escalarCantidadLogisticaPorPax(cantidad, paxAnterior, paxNuevo) {
    const base = Number(cantidad || 0);
    const antes = Number(paxAnterior || 0);
    const despues = Number(paxNuevo || 0);
    if (!base || !antes || !despues || antes === despues) return base;
    const escalado = base * (despues / antes);
    return Math.round(escalado * 100) / 100;
}

function ajustarMaterialLogisticaPorPax(material = {}, paxAnterior = 0, paxNuevo = 0) {
    const copia = clonarDatoEdicion(material) || {};
    ['bebidas', 'menaje', 'extras'].forEach(tipo => {
        copia[tipo] = (copia[tipo] || []).map(item => {
            const actualizado = { ...item };
            actualizado.cantidad = escalarCantidadLogisticaPorPax(actualizado.cantidad, paxAnterior, paxNuevo);
            actualizado.cantidad_actualizada = Number(paxAnterior || 0) !== Number(paxNuevo || 0);
            if (actualizado.cantidad_actualizada) actualizado.cantidad_anterior = Number(item.cantidad || 0);
            actualizado.subitems_selected = (actualizado.subitems_selected || []).map(subitem => ({
                ...subitem,
                cantidad_anterior: Number(paxAnterior || 0) !== Number(paxNuevo || 0) ? Number(subitem.cantidad || 0) : subitem.cantidad_anterior,
                cantidad_actualizada: Number(paxAnterior || 0) !== Number(paxNuevo || 0),
                cantidad: escalarCantidadLogisticaPorPax(subitem.cantidad, paxAnterior, paxNuevo)
            }));
            return actualizado;
        });
    });
    return copia;
}

function conservarLogisticaSeparadaEnEdicionServicios(anterior, nueva) {
    const paxAnterior = Number(anterior?.pax || anterior?.pax_total || 0);
    const paxNuevo = Number(nueva?.pax || nueva?.pax_total || 0);
    const materialAnterior = anterior?.material_logistica || {};
    const materialActualizado = ajustarMaterialLogisticaPorPax(materialAnterior, paxAnterior, paxNuevo);

    nueva.logistica = clonarDatoEdicion(anterior?.logistica || anterior?.logistica_inline || {}) || {};
    nueva.logistica_inline = clonarDatoEdicion(anterior?.logistica_inline || anterior?.logistica || {}) || {};
    nueva.material_logistica = materialActualizado;
    nueva.tiene_comanda_logistica = anterior?.tiene_comanda_logistica || anterior?.logistica_creada || Boolean(anterior?.documentos?.logistica);
    nueva.logistica_creada = anterior?.logistica_creada || nueva.tiene_comanda_logistica;
    nueva.documentos = {
        ...(nueva.documentos || {}),
        ...(anterior?.documentos || {})
    };
    return nueva;
}

async function sincronizarLogisticaSeparadaTrasEdicionCocina(anterior, nueva) {
    if (!anterior || !nueva || !nueva.tiene_comanda_logistica) return;
    if (typeof window.sincronizarComandaLogisticaEnSupabase !== 'function') return;

    const datosLogistica = {
        tipo_registro: 'logistica',
        codigo_original: anterior?.documentos?.logistica?.codigo || anterior.codigo || '',
        codigo_cocina: nueva.codigo || anterior.codigo || '',
        orden_id: nueva.orden_id || nueva.supabase_order_id || anterior.orden_id || anterior.supabase_order_id || null,
        empresa: nueva.empresa || anterior.empresa || '',
        responsable: nueva.responsable || anterior.responsable || '',
        pax: Number(nueva.pax || nueva.pax_total || 0),
        fecha_evento: nueva.fecha_evento || anterior.fecha_evento || '',
        hora_salida: nueva.hora_salida || anterior.hora_salida || '',
        menu_principal: nueva.menu_principal || null,
        menus_adicionales: nueva.menus_adicionales || [],
        menu_nombre: nueva.menu_principal?.nombre || anterior.menu_principal?.nombre || '',
        logistica: nueva.logistica || nueva.logistica_inline || {},
        material_logistica: nueva.material_logistica || {},
        logistics_status: anterior.logistics_status || anterior.estado_logistica || 'sin_preparar',
        logistics_assigned_to: anterior.logistics_assigned_to || '',
        logistics_prepared_items: anterior.logistics_prepared_items || 0,
        estado: anterior.logistics_status || anterior.estado_logistica || 'sin_preparar',
        fecha_creacion: anterior.fecha_creacion || new Date().toISOString()
    };

    try {
        await window.sincronizarComandaLogisticaEnSupabase(datosLogistica.codigo_cocina, datosLogistica);
        if (typeof guardarComandaLogisticaEnHistorial === 'function') {
            guardarComandaLogisticaEnHistorial(datosLogistica);
        }
    } catch (error) {
        console.warn('No se pudo actualizar automaticamente la comanda de logistica vinculada:', error);
        if (typeof mostrarMensaje === 'function') {
            mostrarMensaje('La cocina se guardo, pero no se pudo actualizar automaticamente la logistica vinculada.', 'warning');
        }
    }
}
