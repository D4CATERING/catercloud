// ========== STORAGE: claves y acceso local ==========

const ORDER_STORAGE_KEYS = Object.freeze({
    kitchenHistory: 'historialComandas',
    logisticsHistory: 'historialComandasLogistica',
    localCounter: 'contadorComandas',
    localCounterYear: 'ultimoAñoComandas',
    calendarEvents: 'calendarioEventos'
});

function leerJsonLocalStorage(key, fallback) {
    try {
        const raw = localStorage.getItem(key);
        if (!raw) return fallback;
        return JSON.parse(raw);
    } catch (error) {
        console.warn(`No se pudo leer ${key} desde localStorage:`, error);
        return fallback;
    }
}

function guardarJsonLocalStorage(key, value) {
    localStorage.setItem(key, JSON.stringify(value));
}

function getUsuarioActual() {
    return window.currentUser || {};
}

function getUsuarioActualId() {
    return getUsuarioActual().id || null;
}

function getUsuarioActualEmail() {
    return getUsuarioActual().email || '';
}

function haySesionSupabase() {
    return Boolean(window.supabaseClient && getUsuarioActualId());
}

function fechaHoraIso() {
    return new Date().toISOString();
}

function leerHistorialComandasLocal() {
    return leerJsonLocalStorage(ORDER_STORAGE_KEYS.kitchenHistory, []);
}

function guardarHistorialComandasLocal(historial) {
    guardarJsonLocalStorage(ORDER_STORAGE_KEYS.kitchenHistory, historial || []);
}

function leerHistorialLogisticaLocal() {
    return leerJsonLocalStorage(ORDER_STORAGE_KEYS.logisticsHistory, []);
}

function guardarHistorialLogisticaLocal(historial) {
    guardarJsonLocalStorage(ORDER_STORAGE_KEYS.logisticsHistory, historial || []);
}

async function sincronizarPayloadOrdenSupabase(codigo, patch = {}, options = {}) {
    if (!codigo || !haySesionSupabase()) return false;

    const { data, error: selectError } = await window.supabaseClient
        .from('orders')
        .select('payload')
        .eq('codigo', codigo)
        .maybeSingle();

    if (selectError || !data) {
        throw selectError || new Error(`No se encontro la comanda ${codigo} en Supabase.`);
    }

    const payloadActual = data.payload || {};
    const payload = {
        ...payloadActual,
        ...patch,
        fecha_modificacion: options.fecha_modificacion || fechaHoraIso(),
        editado_por_id: options.editado_por_id || getUsuarioActualId(),
        editado_por_nombre: options.editado_por_nombre || getResponsableFromUser(),
        editado_por_email: options.editado_por_email || getUsuarioActualEmail()
    };

    const { error: updateError } = await window.supabaseClient
        .from('orders')
        .update({
            payload,
            updated_by: getUsuarioActualId(),
            updated_at: fechaHoraIso()
        })
        .eq('codigo', codigo);

    if (updateError) throw updateError;
    return true;
}

async function sincronizarAccionesOperativasSupabase(codigo, patch = {}, options = {}) {
    if (!codigo || !haySesionSupabase()) return false;
    return sincronizarPayloadOrdenSupabase(codigo, patch, options);
}

async function obtenerOrdenSupabasePorCodigo(codigo, options = {}) {
    if (!codigo || !haySesionSupabase()) return null;

    const columnasPreferidas = options.select || 'id, codigo, company_name, responsable_name, estado, fecha_evento, hora_salida, pax_total, created_at, updated_at, payload';
    const columnasBase = options.fallbackSelect || 'id, codigo, estado, fecha_evento, hora_salida, pax_total, created_at, payload';

    let respuesta = await window.supabaseClient
        .from('orders')
        .select(columnasPreferidas)
        .eq('codigo', codigo)
        .limit(1);

    if (respuesta.error && /updated_at|company_name|responsable_name/i.test(String(respuesta.error.message || ''))) {
        respuesta = await window.supabaseClient
            .from('orders')
            .select(columnasBase)
            .eq('codigo', codigo)
            .limit(1);
    }

    if (respuesta.error) throw respuesta.error;

    let row = (respuesta.data || [])[0] || null;
    if (!row && options.searchPayload !== false) {
        const fallback = await window.supabaseClient
            .from('orders')
            .select(columnasPreferidas)
            .filter('payload->>codigo', 'eq', codigo)
            .limit(1);
        if (fallback.error) throw fallback.error;
        row = (fallback.data || [])[0] || null;
    }

    return row;
}

// ========== STORAGE: API publica del modulo ==========

window.CaterCloudStorage = Object.assign(window.CaterCloudStorage || {}, {
    keys: ORDER_STORAGE_KEYS,
    leerJsonLocalStorage,
    guardarJsonLocalStorage,
    leerHistorialComandasLocal,
    guardarHistorialComandasLocal,
    leerHistorialLogisticaLocal,
    guardarHistorialLogisticaLocal,
    sincronizarPayloadOrdenSupabase,
    sincronizarAccionesOperativasSupabase,
    obtenerOrdenSupabasePorCodigo
});

// ========== STORAGE: auditoria y avisos realtime ==========

function getAuditActionForUpdate(nuevosDatos = {}) {
    if (Object.prototype.hasOwnProperty.call(nuevosDatos, 'estado')) {
        if (nuevosDatos.estado === 'anulada') return 'pedido_anulado';
        if (nuevosDatos.estado === 'eliminada') return 'pedido_eliminado';
        if (nuevosDatos.estado === 'confirmado') return 'pedido_confirmado';
        return 'estado_actualizado';
    }
    if (Object.prototype.hasOwnProperty.call(nuevosDatos, 'adjuntos')) return 'archivos_actualizados';
    if (Object.prototype.hasOwnProperty.call(nuevosDatos, 'notas_pedido')) return 'anotaciones_actualizadas';
    return 'pedido_editado';
}

function logActividadApp(action, codigo, details = {}, area = null) {
    if (typeof window.registrarActividadApp === 'function') {
        window.registrarActividadApp(action, {
            entityType: 'pedido',
            entityCode: codigo,
            area,
            details
        });
    }
}

function emitirCambioHistorialCompartido(action, codigo, details = {}) {
    if (!window._ordersRealtimeChannel) return;
    try {
        window._ordersRealtimeChannel.send({
            type: 'broadcast',
            event: 'orders_changed',
            payload: {
                action,
                codigo: codigo || null,
                by: getUsuarioActualEmail() || null,
                at: fechaHoraIso(),
                details
            }
        });
    } catch (error) {
        console.warn('No se pudo emitir aviso realtime de comandas:', error);
    }
}

window.emitirCambioHistorialCompartido = emitirCambioHistorialCompartido;

function permitirGuardadoSoloLocal() {
  return window.CATER_ALLOW_LOCAL_ONLY === true;
}

function crearErrorGuardadoRemoto(mensaje, codigo, causa) {
  const error = new Error(mensaje);
  error.codigoComanda = codigo;
  error.copiaLocalGuardada = true;
  if (causa) error.cause = causa;
  return error;
}

// ========== STORAGE: codigos de comanda ==========

function getPrefijoCodigoComanda(fecha = new Date()) {
    return `D4${fecha.getFullYear().toString().slice(-2)}`;
}

function extraerNumeroCodigoComanda(codigo, prefijo = getPrefijoCodigoComanda()) {
    const texto = String(codigo || '').trim();
    if (!texto.startsWith(prefijo)) return 0;
    const numero = Number(texto.slice(prefijo.length));
    return Number.isFinite(numero) ? numero : 0;
}

function getSiguienteCodigoLocal() {
    const prefijo = getPrefijoCodigoComanda();
    const añoCompleto = new Date().getFullYear();
    const historial = [
        ...leerHistorialComandasLocal(),
        ...leerHistorialLogisticaLocal()
    ];
    const numerosUsados = historial
        .map(item => extraerNumeroCodigoComanda(item?.codigo || item?.codigo_cocina || item?.codigo_original, prefijo))
        .filter(numero => numero > 0);
    const siguiente = Math.max(0, ...numerosUsados) + 1;
    localStorage.setItem(ORDER_STORAGE_KEYS.localCounter, String(siguiente));
    localStorage.setItem(ORDER_STORAGE_KEYS.localCounterYear, String(añoCompleto));
    return `${prefijo}${String(siguiente).padStart(4, '0')}`;
}

function getMayorNumeroComandaLocal(prefijo = getPrefijoCodigoComanda()) {
    const historial = [
        ...leerHistorialComandasLocal(),
        ...leerHistorialLogisticaLocal()
    ];
    return historial.reduce((maximo, item) => {
        const codigos = [
            item?.codigo,
            item?.codigo_cocina,
            item?.codigo_original,
            item?.codigo_comanda
        ];
        const mayorItem = codigos.reduce((mayor, codigo) => {
            const numero = extraerNumeroCodigoComanda(codigo, prefijo);
            return numero > mayor ? numero : mayor;
        }, 0);
        return mayorItem > maximo ? mayorItem : maximo;
    }, 0);
}

async function liberarCodigoComandaReservado(codigo = window.codigoComandaReservado) {
    if (!codigo || !haySesionSupabase()) return false;
    try {
        const { error } = await window.supabaseClient.rpc('release_order_code', { code_to_release: codigo });
        if (error) throw error;
        if (String(window.codigoComandaReservado || '') === String(codigo)) {
            window.codigoComandaReservado = null;
        }
        return true;
    } catch (error) {
        console.warn('No se pudo liberar la reserva del codigo de comanda:', error);
        return false;
    }
}

window.liberarCodigoComandaReservado = liberarCodigoComandaReservado;

async function codigoComandaExisteEnSupabase(codigo) {
    if (!codigo || !haySesionSupabase()) return false;
    const { data, error } = await window.supabaseClient
        .from('orders')
        .select('id, codigo, payload')
        .limit(2000);
    if (error) throw error;
    return (data || []).some(row => {
        const codigoColumna = String(row?.codigo || '').trim();
        const codigoPayload = String(row?.payload?.codigo || row?.payload?.codigo_comanda || '').trim();
        return codigoColumna === String(codigo) || codigoPayload === String(codigo);
    });
}

async function getMayorNumeroComandaSupabase(prefijo = getPrefijoCodigoComanda()) {
    if (!haySesionSupabase()) return 0;
    const { data, error } = await window.supabaseClient
        .from('orders')
        .select('codigo, payload')
        .limit(2000);
    if (error) throw error;

    return (data || []).reduce((maximo, row) => {
        const codigos = [
            row?.codigo,
            row?.payload?.codigo,
            row?.payload?.codigo_comanda
        ];
        const mayorFila = codigos.reduce((mayor, codigo) => {
            const numero = extraerNumeroCodigoComanda(codigo, prefijo);
            return numero > mayor ? numero : mayor;
        }, 0);
        return mayorFila > maximo ? mayorFila : maximo;
    }, 0);
}

async function reservarCodigoComanda() {
    if (window.codigoComandaReservado) {
        if (haySesionSupabase()) {
            try {
                const yaExiste = await codigoComandaExisteEnSupabase(window.codigoComandaReservado);
                const prefijo = getPrefijoCodigoComanda();
                const numeroReservado = extraerNumeroCodigoComanda(window.codigoComandaReservado, prefijo);
                const mayorNumeroUsado = Math.max(
                    getMayorNumeroComandaLocal(prefijo),
                    await getMayorNumeroComandaSupabase(prefijo)
                );
                if (!yaExiste && (!numeroReservado || !mayorNumeroUsado || numeroReservado > mayorNumeroUsado)) {
                    return window.codigoComandaReservado;
                }
                console.warn(`El codigo reservado ${window.codigoComandaReservado} ya existe en orders. Se descartara esta reserva local.`);
                window.codigoComandaReservado = null;
            } catch (error) {
                console.warn('No se pudo validar el codigo reservado actual:', error);
                throw error;
            }
        } else {
            return window.codigoComandaReservado;
        }
    }

    if (haySesionSupabase()) {
        let ultimoError = null;
        for (let intento = 0; intento < 5; intento += 1) {
            try {
                const { data, error } = await window.supabaseClient.rpc('next_order_code');
                if (error) throw error;
                const codigo = typeof data === 'string' ? data : data?.codigo;
                if (codigo) {
                    const yaExiste = await codigoComandaExisteEnSupabase(codigo);
                    if (yaExiste) {
                        console.warn(`Supabase devolvio el codigo ${codigo}, pero ya existe en orders. Se pedira otro codigo.`);
                        await liberarCodigoComandaReservado(codigo);
                        ultimoError = new Error(`El codigo ${codigo} ya existe en orders.`);
                        continue;
                    }
                    const prefijo = getPrefijoCodigoComanda();
                    const numeroCodigo = extraerNumeroCodigoComanda(codigo, prefijo);
                    const mayorNumeroUsado = Math.max(
                        getMayorNumeroComandaLocal(prefijo),
                        await getMayorNumeroComandaSupabase(prefijo)
                    );
                    if (numeroCodigo > 0 && mayorNumeroUsado > 0 && numeroCodigo <= mayorNumeroUsado) {
                        console.warn(`Supabase devolvio el codigo ${codigo}, pero el mayor codigo usado es ${prefijo}${String(mayorNumeroUsado).padStart(4, '0')}. Se pedira otro codigo.`);
                        await liberarCodigoComandaReservado(codigo);
                        ultimoError = new Error(`El codigo ${codigo} esta por debajo de la secuencia actual.`);
                        continue;
                    }
                    window.codigoComandaReservado = codigo;
                    return codigo;
                }
            } catch (error) {
                ultimoError = error;
                console.warn('No se pudo reservar codigo en Supabase:', error);
                break;
            }
        }

        throw new Error(
            ultimoError?.message
                ? `No se pudo reservar un codigo disponible en Supabase: ${ultimoError.message}`
                : 'No se pudo reservar un codigo disponible en Supabase.'
        );
    }

    window.codigoComandaReservado = getSiguienteCodigoLocal();
    return window.codigoComandaReservado;
}

window.reservarCodigoComanda = reservarCodigoComanda;

async function obtenerCodigoComandaParaGuardar(comandaData = {}) {
    const codigo = comandaData.codigo || window.codigoComandaReservado || await reservarCodigoComanda();
    return codigo;
}

window.obtenerCodigoComandaParaGuardar = obtenerCodigoComandaParaGuardar;

// ========== STORAGE: logistica vinculada a una comanda ==========

async function sincronizarComandaLogisticaEnSupabase(codigoPedido, datosLogistica = {}) {
  if (!codigoPedido) throw new Error('No se encontro el codigo de cocina para vincular la logistica.');
  if (!haySesionSupabase()) {
    throw new Error('No hay sesion activa de Supabase. La logistica no se puede guardar para el equipo.');
  }

  const idOrden = datosLogistica.orden_id || datosLogistica.supabase_order_id || null;
  let query = window.supabaseClient
    .from('orders')
    .select('id, payload, version')
    .limit(1);

  query = idOrden ? query.eq('id', idOrden) : query.eq('codigo', codigoPedido);
  const { data: existentes, error: selectError } = await query;
  if (selectError) throw selectError;
  const order = existentes?.[0];
  if (!order?.id) {
    throw new Error(`No se encontro en Supabase la comanda ${codigoPedido} para adjuntar la logistica.`);
  }

  const version = Number(order.version || order.payload?.version || 1) + 1;
  const payload = {
    ...(order.payload || {}),
    logistica: datosLogistica.logistica || {},
    logistica_inline: datosLogistica.logistica || {},
    material_logistica: datosLogistica.material_logistica || {},
    logistics_status: datosLogistica.logistics_status || datosLogistica.estado || 'sin_preparar',
    logistics_assigned_to: datosLogistica.logistics_assigned_to || '',
    logistics_prepared_items: Number(datosLogistica.logistics_prepared_items || 0),
    tiene_comanda_logistica: true,
    fecha_modificacion: fechaHoraIso(),
    version,
    editado_por_id: getUsuarioActualId(),
    editado_por_nombre: getResponsableFromUser(),
    editado_por_email: getUsuarioActualEmail()
  };

  const { error: updateError } = await window.supabaseClient
    .from('orders')
    .update({
      payload,
      estado: payload.estado || 'creada',
      version,
      updated_by: getUsuarioActualId(),
      updated_at: fechaHoraIso()
    })
    .eq('id', order.id);

  if (updateError) throw updateError;

  logActividadApp('logistica_creada', codigoPedido, {
    cambios: ['logistica', 'material_logistica'],
    material: datosLogistica.material_logistica || {},
    contacto: datosLogistica.logistica?.nombre_contacto || ''
  }, 'logistica');

  emitirCambioHistorialCompartido('logistica_creada', codigoPedido, {
    cambios: ['logistica', 'material_logistica'],
    version
  });

  return { id: order.id, payload };
}

window.sincronizarComandaLogisticaEnSupabase = sincronizarComandaLogisticaEnSupabase;

// ========== STORAGE: guardado principal de comandas ==========

/**
 * Guarda una comanda en Supabase (multiusuario)
 * @param {Object} comandaData - Datos de la comanda
 * @returns {Promise<string>} Código generado
 */
async function guardarComandaEnHistorial(comandaData) {
  const codigo = await obtenerCodigoComandaParaGuardar(comandaData);
  const usuarioNombre = getResponsableFromUser();

  // Construimos el payload igual que siempre
  const solicitudOrigen = comandaData.solicitud_origen || null;
  const payload = {
    ...comandaData,
    codigo,
    tipo_registro: solicitudOrigen ? 'comanda' : (comandaData.tipo_registro || 'comanda'),
    codigo_solicitud_origen: solicitudOrigen?.codigo || comandaData.codigo_solicitud_origen || '',
    adjuntos: comandaData.adjuntos || solicitudOrigen?.adjuntos || [],
    documentos: comandaData.documentos || solicitudOrigen?.documentos || {},
    fecha_creacion: solicitudOrigen?.fecha_creacion || comandaData.fecha_creacion || fechaHoraIso(),
    fecha_modificacion: fechaHoraIso(),
    estado: 'creada',
    estado_confirmacion: solicitudOrigen
      ? (solicitudOrigen.estado === 'confirmado' ? 'confirmado' : 'por_confirmar')
      : (comandaData.estado_confirmacion || comandaData.confirmation_status || 'por_confirmar'),
    version: 1,
    creado_por_id: getUsuarioActualId() || comandaData.creado_por_id || null,
    creado_por_nombre: comandaData.creado_por_nombre || usuarioNombre,
    creado_por_email: getUsuarioActualEmail() || comandaData.creado_por_email || '',
    editado_por_id: null,
    editado_por_nombre: null,
    editado_por_email: null
  };

  // Si NO hay supabase o NO hay login -> guardamos SOLO en local como backup
  if (!haySesionSupabase()) {
    if (solicitudOrigen?.codigo) {
      reemplazarSolicitudPorComandaLocal(solicitudOrigen.codigo, payload);
    } else {
      guardarComandaEnHistorialLocal(payload);
    }
    logActividadApp('comanda_creada_local', codigo, {
      empresa: payload.empresa || payload.company_name || '',
      motivo: 'sin_supabase_o_sin_login'
    });
    if (!permitirGuardadoSoloLocal()) {
      throw crearErrorGuardadoRemoto(
        'No se pudo guardar en Supabase. Se dejo una copia local de emergencia, pero no esta disponible para el equipo.',
        codigo
      );
    }
    return codigo;
  }

  try {
    const empresaNombre =
      (comandaData.empresa || comandaData.empresa_nombre || comandaData.company_name || '').toString();

    const { company_id, company_name } = await getOrCreateCompanyIdByName(empresaNombre);

    const responsable =
      usuarioNombre
      || (comandaData.responsable || comandaData.responsable_nombre || '').toString().trim();

    if (!responsable) throw new Error('No se pudo determinar el Responsable (usuario sin nombre/email)');

    if (await codigoComandaExisteEnSupabase(codigo)) {
      throw new Error(`El codigo ${codigo} ya existe en Supabase. Ejecuta sql/order_code_sequence.sql y vuelve a intentarlo.`);
    }

    if (typeof window.subirComandasAStorage === 'function') {
      try {
        const documentos = await window.subirComandasAStorage(codigo, payload);
        payload.documentos = {
          cocina_path: documentos.cocinaPath || null,
          logistica_path: documentos.logisticaPath || null
        };
        comandaData.documentos = payload.documentos;
      } catch (storageError) {
        console.warn('No se pudieron subir los documentos a Storage:', storageError);
      }
    }

    const paxTotal = Number(comandaData.pax || comandaData.pax_total || payload.pax || 0) || null;

    if (solicitudOrigen?.codigo || solicitudOrigen?.orden_id || solicitudOrigen?.supabase_order_id) {
      const idSolicitud = solicitudOrigen.supabase_order_id || solicitudOrigen.orden_id || null;
      if (idSolicitud) {
        payload.orden_id = idSolicitud;
        payload.supabase_order_id = idSolicitud;
      }
      const query = window.supabaseClient.from('orders').update({
        company_id,
        company_name: company_name || (empresaNombre || null),
        responsable_name: responsable,
        codigo,
        fecha_evento: comandaData.fecha_evento || null,
        hora_salida: comandaData.hora_salida || null,
        pax_total: paxTotal,
        estado: payload.estado,
        version: payload.version,
        updated_by: getUsuarioActualId(),
        updated_at: fechaHoraIso(),
        payload
      }).select('id');

      const { data: updatedRows, error: updateSolicitudError } = idSolicitud
        ? await query.eq('id', idSolicitud)
        : await query.eq('codigo', solicitudOrigen.codigo);

      if (updateSolicitudError) throw updateSolicitudError;
      const updatedOrder = Array.isArray(updatedRows) ? updatedRows[0] : updatedRows;
      if (!updatedOrder?.id) {
        throw new Error(`No se encontro la solicitud ${solicitudOrigen.codigo || ''} para convertirla en comanda.`);
      }
      if (updatedOrder?.id) {
        payload.orden_id = updatedOrder.id;
        payload.supabase_order_id = updatedOrder.id;
        if (!idSolicitud) {
          await window.supabaseClient
            .from('orders')
            .update({ payload })
            .eq('id', updatedOrder.id);
        }
      }

      if (typeof window.liberarCodigoComandaReservado === 'function') {
        await window.liberarCodigoComandaReservado(codigo);
      }

      reemplazarSolicitudPorComandaLocal(solicitudOrigen.codigo, payload);
      emitirCambioHistorialCompartido('solicitud_convertida_comanda', codigo, {
        codigo_solicitud_origen: solicitudOrigen.codigo || '',
        empresa: payload.empresa || payload.company_name || '',
        fecha_evento: payload.fecha_evento || null
      });
      logActividadApp('solicitud_convertida_comanda', codigo, {
        codigo_solicitud_origen: solicitudOrigen.codigo || '',
        empresa: payload.empresa || payload.company_name || '',
        fecha_evento: payload.fecha_evento || null,
        pax: payload.pax || payload.pax_total || null
      });
      return codigo;
    }

    const { data: insertedOrder, error } = await window.supabaseClient.from('orders').insert([{
      created_by: getUsuarioActualId(),
      company_id,
      company_name: company_name || (empresaNombre || null),
      responsable_name: responsable,
      codigo,
      fecha_evento: comandaData.fecha_evento || null,
      hora_salida: comandaData.hora_salida || null,
      pax_total: paxTotal,
      estado: payload.estado,
      version: payload.version,
      updated_by: getUsuarioActualId(),
      payload
    }]).select('id').single();

    if (error) throw error;
    if (insertedOrder?.id) {
      payload.orden_id = insertedOrder.id;
      payload.supabase_order_id = insertedOrder.id;
    }

    if (typeof window.liberarCodigoComandaReservado === 'function') {
      await window.liberarCodigoComandaReservado(codigo);
    }

    // ✅ Backup local también (opcional, pero recomendado)
    guardarComandaEnHistorialLocal(payload);
    emitirCambioHistorialCompartido('comanda_creada', codigo, {
      empresa: payload.empresa || payload.company_name || '',
      fecha_evento: payload.fecha_evento || null
    });
    if (typeof window.refrescarAlertasOperativasGlobales === 'function') {
      window.refrescarAlertasOperativasGlobales();
    }
    logActividadApp('comanda_creada', codigo, {
      empresa: payload.empresa || payload.company_name || '',
      fecha_evento: payload.fecha_evento || null,
      pax: payload.pax || payload.pax_total || null
    });

    return codigo;

  } catch (error) {
    // ✅ Si Supabase falla, guardamos en local como respaldo
    console.warn('Supabase falló, guardando backup en localStorage:', error);
    if (solicitudOrigen?.codigo) {
      reemplazarSolicitudPorComandaLocal(solicitudOrigen.codigo, payload);
    } else {
      guardarComandaEnHistorialLocal(payload);
    }
    logActividadApp('comanda_creada_local', codigo, {
      empresa: payload.empresa || payload.company_name || '',
      motivo: 'fallo_supabase'
    });
    if (!permitirGuardadoSoloLocal()) {
      throw crearErrorGuardadoRemoto(
        'No se pudo guardar en Supabase. Se dejo una copia local de emergencia, pero debes revisar la conexion o permisos antes de continuar.',
        codigo,
        error
      );
    }
    return codigo;
  }
}


/**
 * Guarda una comanda en el historial
 * @param {Object} comandaData - Datos de la comanda
 * @returns {string} Código generado
 */
// ========== STORAGE: respaldo local y recuperacion ==========

function guardarComandaEnHistorialLocal(comandaData) {
    const historial = leerHistorialComandasLocal();
    // Usar el código que ya viene en el payload, NO generar uno nuevo
    const codigo = comandaData.codigo || generarCodigoComanda();
    
    const comandaCompleta = {
        ...comandaData,
        codigo,
        fecha_creacion: comandaData.fecha_creacion || fechaHoraIso(),
        fecha_modificacion: fechaHoraIso(),
        estado: comandaData.estado || 'creada',
        version: comandaData.version || 1
    };
    
    const indexExistente = historial.findIndex(item => String(item.codigo || item.codigo_comanda || '') === String(codigo));
    if (indexExistente >= 0) {
        historial[indexExistente] = {
            ...historial[indexExistente],
            ...comandaCompleta
        };
    } else {
        historial.push(comandaCompleta);
    }
    guardarHistorialComandasLocal(historial);
    return codigo;
}

function reemplazarSolicitudPorComandaLocal(codigoSolicitud, comandaData) {
    const historial = leerHistorialComandasLocal();
    const codigoComanda = comandaData.codigo || comandaData.codigo_comanda || '';
    const ahora = fechaHoraIso();
    const solicitudLocal = historial.find(item =>
        String(item.codigo || item.codigo_comanda || '') === String(codigoSolicitud || '')
    );
    const historialSinDuplicados = historial.filter(item => {
        const codigoItem = String(item.codigo || item.codigo_comanda || '');
        return codigoItem !== String(codigoSolicitud || '') && codigoItem !== String(codigoComanda || '');
    });

    const comandaCompleta = {
        ...(solicitudLocal || {}),
        ...comandaData,
        tipo_registro: 'comanda',
        codigo: codigoComanda,
        codigo_solicitud_origen: codigoSolicitud || comandaData.codigo_solicitud_origen || '',
        estado: comandaData.estado || 'creada',
        fecha_creacion: comandaData.fecha_creacion || solicitudLocal?.fecha_creacion || ahora,
        fecha_modificacion: ahora
    };

    historialSinDuplicados.push(comandaCompleta);
    guardarHistorialComandasLocal(historialSinDuplicados);
    return codigoComanda;
}

function buscarComandaLocalPorCodigo(codigoBuscado) {
    const codigo = String(codigoBuscado || '').trim();
    if (!codigo) return null;

    const historiales = [
        leerHistorialComandasLocal(),
        leerHistorialLogisticaLocal()
    ];

    return historiales
        .flat()
        .find(item => {
            const codigosItem = [
                item?.codigo,
                item?.codigo_comanda,
                item?.codigo_cocina,
                item?.codigo_original
            ].map(valor => String(valor || '').trim());
            return codigosItem.includes(codigo);
        }) || null;
}

async function recuperarComandaLocalEnSupabase(codigoBuscado) {
    const codigo = String(codigoBuscado || '').trim();
    if (!codigo) throw new Error('Indica el codigo de la comanda que quieres recuperar.');
    if (!haySesionSupabase()) {
        throw new Error('Necesitas iniciar sesion para recuperar la comanda en Supabase.');
    }
    if (window.AppPermissions && !AppPermissions.canCreateOrders()) {
        throw new Error('Tu usuario no tiene permiso para recuperar comandas en Supabase.');
    }

    const local = buscarComandaLocalPorCodigo(codigo);
    if (!local) {
        throw new Error(`No encontre la comanda ${codigo} en el historial local de este navegador.`);
    }

    const empresaNombre = (local.empresa || local.empresa_nombre || local.company_name || '').toString().trim();
    let company_id = local.company_id || null;
    let company_name = local.company_name || empresaNombre || null;
    if (empresaNombre && typeof getOrCreateCompanyIdByName === 'function') {
        const company = await getOrCreateCompanyIdByName(empresaNombre);
        company_id = company.company_id;
        company_name = company.company_name || company_name;
    }

    const responsable = getResponsableFromUser()
        || (local.responsable || local.responsable_nombre || local.creado_por_nombre || '').toString().trim()
        || getUsuarioActualEmail()
        || 'Usuario';

    const ahora = fechaHoraIso();
    const payload = {
        ...local,
        codigo,
        tipo_registro: local.tipo_registro === 'logistica' ? 'logistica' : 'comanda',
        estado: local.estado && local.estado !== 'eliminada' ? local.estado : 'creada',
        fecha_creacion: local.fecha_creacion || local.created_at || ahora,
        fecha_modificacion: ahora,
        creado_por_id: local.creado_por_id || getUsuarioActualId(),
        creado_por_nombre: local.creado_por_nombre || responsable,
        creado_por_email: local.creado_por_email || getUsuarioActualEmail(),
        editado_por_id: getUsuarioActualId(),
        editado_por_nombre: responsable,
        editado_por_email: getUsuarioActualEmail()
    };

    const { data: existente, error: selectError } = await window.supabaseClient
        .from('orders')
        .select('id')
        .eq('codigo', codigo)
        .maybeSingle();

    if (selectError) throw selectError;

    const datosOrder = {
        company_id,
        company_name: company_name || null,
        responsable_name: responsable,
        codigo,
        fecha_evento: payload.fecha_evento || null,
        hora_salida: payload.hora_salida || null,
        pax_total: Number(payload.pax || payload.pax_total || 0) || null,
        estado: payload.estado,
        version: Number(payload.version || 1) || 1,
        updated_by: getUsuarioActualId(),
        updated_at: ahora,
        payload
    };

    let orderId = existente?.id || null;
    if (orderId) {
        const { error: updateError } = await window.supabaseClient
            .from('orders')
            .update(datosOrder)
            .eq('id', orderId);
        if (updateError) throw updateError;
    } else {
        const { data: insertada, error: insertError } = await window.supabaseClient
            .from('orders')
            .insert([{ ...datosOrder, created_by: getUsuarioActualId() }])
            .select('id')
            .single();
        if (insertError) throw insertError;
        orderId = insertada?.id || null;
    }

    if (orderId) {
        payload.orden_id = orderId;
        payload.supabase_order_id = orderId;
        await window.supabaseClient
            .from('orders')
            .update({ payload })
            .eq('id', orderId);
    }

    guardarComandaEnHistorialLocal(payload);
    emitirCambioHistorialCompartido('comanda_recuperada_supabase', codigo, {
        empresa: payload.empresa || payload.company_name || '',
        fecha_evento: payload.fecha_evento || null
    });
    logActividadApp('comanda_recuperada_supabase', codigo, {
        empresa: payload.empresa || payload.company_name || '',
        fecha_evento: payload.fecha_evento || null
    });

    return { codigo, orderId, estado: payload.estado };
}

window.buscarComandaLocalPorCodigo = buscarComandaLocalPorCodigo;
window.recuperarComandaLocalEnSupabase = recuperarComandaLocalEnSupabase;

// ========== STORAGE: solicitudes y actualizaciones ==========

async function sincronizarSolicitudPedido(solicitud) {
    if (!haySesionSupabase()) return false;

    try {
        const empresaNombre = (solicitud.empresa || '').toString().trim();
        let company_id = null;
        let company_name = empresaNombre || null;

        if (empresaNombre && typeof getOrCreateCompanyIdByName === 'function') {
            const company = await getOrCreateCompanyIdByName(empresaNombre);
            company_id = company.company_id;
            company_name = company.company_name || empresaNombre;
        }

        const responsable = getResponsableFromUser()
            || (solicitud.responsable || '').toString().trim()
            || 'Pendiente';

        solicitud.creado_por_id = getUsuarioActualId();
        solicitud.creado_por_nombre = responsable;
        solicitud.creado_por_email = getUsuarioActualEmail();

        const { error } = await window.supabaseClient.from('orders').insert([{
            created_by: getUsuarioActualId(),
            company_id,
            company_name,
            responsable_name: responsable,
            codigo: solicitud.codigo,
            fecha_evento: solicitud.fecha_evento || null,
            hora_salida: null,
            pax_total: Number(solicitud.pax || solicitud.pax_total || 0) || null,
            estado: solicitud.estado || 'negociacion',
            version: solicitud.version || 1,
            updated_by: getUsuarioActualId(),
            payload: solicitud
        }]);

        if (error) throw error;
        emitirCambioHistorialCompartido('solicitud_creada', solicitud.codigo, {
            empresa: solicitud.empresa || '',
            fecha_evento: solicitud.fecha_evento || null
        });
        logActividadApp('solicitud_creada', solicitud.codigo, {
            empresa: solicitud.empresa || '',
            fecha_evento: solicitud.fecha_evento || null,
            pax: solicitud.pax || solicitud.pax_total || null
        });
        return true;
    } catch (error) {
        console.warn('No se pudo sincronizar la solicitud con Supabase:', error);
        return false;
    }
}

/**
 * Actualiza una comanda existente
 * @param {string} codigo - Código de la comanda
 * @param {Object} nuevosDatos - Nuevos datos
 * @returns {boolean} True si se actualizó correctamente
 */
async function actualizarComandaEnHistorial(codigo, nuevosDatos) {
    const historial = leerHistorialComandasLocal();
    const idSupabase = nuevosDatos?.supabase_order_id || nuevosDatos?.orden_id || null;
    const coincidencias = historial
        .map((item, index) => ({ item, index }))
        .filter(({ item }) => {
            if (idSupabase && (item.supabase_order_id === idSupabase || item.orden_id === idSupabase)) return true;
            return String(item.codigo || item.codigo_comanda || '') === String(codigo || '');
        })
        .sort((a, b) => getFechaModificacionHistorialSync(b.item) - getFechaModificacionHistorialSync(a.item));
    const index = coincidencias[0]?.index ?? -1;
    
    if (index !== -1) {
        const idParaActualizar = idSupabase || historial[index].supabase_order_id || historial[index].orden_id || null;
        const versionActual = Number(historial[index].version || 1);
        historial[index] = {
            ...historial[index],
            ...nuevosDatos,
            ...(idParaActualizar ? { orden_id: idParaActualizar, supabase_order_id: idParaActualizar } : {}),
            fecha_modificacion: fechaHoraIso(),
            version: versionActual + 1,
            editado_por: getResponsableFromUser(),
            editado_por_id: getUsuarioActualId(),
            editado_por_nombre: getResponsableFromUser(),
            editado_por_email: getUsuarioActualEmail()
        };
        
        guardarHistorialComandasLocal(historial);
        const auditAction = getAuditActionForUpdate(nuevosDatos);
        logActividadApp(auditAction, codigo, {
            cambios: Object.keys(nuevosDatos || {}),
            estado: historial[index].estado || null,
            version: historial[index].version
        });

        if (haySesionSupabase()) {
            try {
                const query = window.supabaseClient
                    .from('orders')
                    .update({
                        payload: historial[index],
                        fecha_evento: historial[index].fecha_evento || null,
                        hora_salida: historial[index].hora_salida || null,
                        pax_total: Number(historial[index].pax || historial[index].pax_total || 0) || null,
                        estado: historial[index].estado || 'editada',
                        version: historial[index].version,
                        updated_by: getUsuarioActualId(),
                        updated_at: fechaHoraIso()
                    });
                const { error } = idParaActualizar
                    ? await query.eq('id', idParaActualizar)
                    : await query.eq('codigo', codigo);

                if (error) throw error;
                emitirCambioHistorialCompartido(auditAction, codigo, {
                    cambios: Object.keys(nuevosDatos || {}),
                    version: historial[index].version
                });
                if (typeof window.refrescarAlertasOperativasGlobales === 'function') {
                    window.refrescarAlertasOperativasGlobales();
                }
            } catch (error) {
                console.warn('No se pudo sincronizar la edición con Supabase:', error);
                if (!permitirGuardadoSoloLocal()) {
                    throw crearErrorGuardadoRemoto(
                        'No se pudo sincronizar la edicion con Supabase. Se dejo una copia local de emergencia, pero el equipo no vera este cambio hasta resolverlo.',
                        codigo,
                        error
                    );
                }
            }
        } else if (!permitirGuardadoSoloLocal()) {
            throw crearErrorGuardadoRemoto(
                'No se pudo sincronizar la edicion porque no hay sesion activa de Supabase.',
                codigo
            );
        }

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
    const historial = leerHistorialComandasLocal();
    const coincidencias = historial.filter(c => String(c.codigo || c.codigo_comanda || '') === String(codigo || ''));
    if (!coincidencias.length) return null;
    return coincidencias.sort((a, b) => {
        const fechaB = new Date(b.fecha_modificacion || b.updated_at || b.fecha_creacion || b.created_at || 0).getTime();
        const fechaA = new Date(a.fecha_modificacion || a.updated_at || a.fecha_creacion || a.created_at || 0).getTime();
        return (Number.isFinite(fechaB) ? fechaB : 0) - (Number.isFinite(fechaA) ? fechaA : 0);
    })[0];
}

/**
 * Elimina una comanda del historial
 * @param {string} codigo - Código de la comanda
 */
function eliminarComandaDelHistorial(codigo) {
    const historial = leerHistorialComandasLocal();
    const ahora = fechaHoraIso();
    const comanda = historial.find(c => String(c.codigo || c.codigo_comanda || '') === String(codigo || ''));
    const nuevoHistorial = historial.map(c => {
        if (String(c.codigo || c.codigo_comanda || '') !== String(codigo || '')) return c;
        return {
            ...c,
            estado: 'eliminada',
            estado_pedido: 'eliminada',
            fecha_modificacion: ahora,
            eliminado_en: ahora,
            eliminado_por_id: getUsuarioActualId(),
            eliminado_por_email: getUsuarioActualEmail()
        };
    });
    guardarHistorialComandasLocal(nuevoHistorial);
    logActividadApp('pedido_eliminado_local', codigo, {
        empresa: comanda?.empresa || comanda?.company_name || '',
        fecha_evento: comanda?.fecha_evento || null
    });
}

async function marcarComandaEliminadaEnSupabase(codigo, pedido = null) {
    if (!window.supabaseClient || !codigo) return false;

    const ahora = fechaHoraIso();
    const payloadBase = pedido || obtenerComandaDelHistorial(codigo) || {};
    const payloadEliminado = {
        ...payloadBase,
        codigo,
        estado: 'eliminada',
        estado_pedido: 'eliminada',
        fecha_modificacion: ahora,
        eliminado_en: ahora,
        eliminado_por_id: getUsuarioActualId(),
        eliminado_por_email: getUsuarioActualEmail()
    };

    const { error } = await window.supabaseClient
        .from('orders')
        .update({
            estado: 'eliminada',
            updated_by: getUsuarioActualId(),
            payload: payloadEliminado
        })
        .eq('codigo', codigo);

    if (error) throw error;
    return true;
}

window.marcarComandaEliminadaEnSupabase = marcarComandaEliminadaEnSupabase;

/**
 * Obtiene todo el historial de comandas
 * @returns {Array} Lista de comandas
 */
// ========== STORAGE: lectura, fusion y normalizacion remota ==========

function obtenerHistorialCompleto() {
    return leerHistorialComandasLocal();
}

function normalizarComandaRemota(row) {
    const payload = row?.payload && typeof row.payload === 'object' ? row.payload : {};
    return {
        ...payload,
        orden_id: payload.orden_id || row?.id || null,
        supabase_order_id: payload.supabase_order_id || row?.id || null,
        codigo: payload.codigo || row?.codigo || '',
        fecha_creacion: payload.fecha_creacion || row?.created_at || '',
        fecha_modificacion: payload.fecha_modificacion || row?.updated_at || payload.fecha_creacion || row?.created_at || '',
        fecha_evento: payload.fecha_evento || row?.fecha_evento || '',
        hora_salida: payload.hora_salida || row?.hora_salida || '',
        pax: payload.pax || payload.pax_total || row?.pax_total || 0,
        pax_total: payload.pax_total || payload.pax || row?.pax_total || 0,
        estado: payload.estado || row?.estado || 'creada'
    };
}

function getCodigoHistorialSync(item) {
    return item?.codigo || item?.codigo_cocina || item?.codigo_original || item?.codigo_comanda || '';
}

function getClaveHistorialSync(item) {
    return getCodigoHistorialSync(item) || item?.supabase_order_id || item?.orden_id;
}

function getFechaModificacionHistorialSync(item) {
    const raw = item?.fecha_modificacion || item?.updated_at || item?.fecha_creacion || item?.created_at || '';
    const time = raw ? new Date(raw).getTime() : 0;
    return Number.isFinite(time) ? time : 0;
}

function tieneDatosLogisticaSync(item = {}) {
    const log = item.logistica_inline || item.logistica || {};
    const material = item.material_logistica || log.material_logistica || {};
    return Boolean(
        item.tiene_comanda_logistica ||
        item.logistica_creada ||
        item.documentos?.logistica ||
        item.logistics_status ||
        item.estado_logistica ||
        item.estado_confirmacion ||
        item.confirmation_status ||
        item.logistics_assigned_to ||
        item.logistics_prepared_items !== undefined ||
        item.logistics_ready_at ||
        item.logistics_completed_confirmed_at ||
        item.logistics_action_log?.length ||
        item.logistics_revision_notice ||
        Object.values(log || {}).some(Boolean) ||
        ['bebidas', 'menaje', 'extras'].some(tipo => Array.isArray(material?.[tipo]) && material[tipo].length)
    );
}

function materialLogisticaSyncTieneItems(material = {}) {
    return ['bebidas', 'menaje', 'extras'].some(tipo => Array.isArray(material?.[tipo]) && material[tipo].length);
}

function valorLogisticaSync(baseValor, fuenteValor, preferirFuente = true) {
    if (preferirFuente) return fuenteValor ?? baseValor;
    return baseValor ?? fuenteValor;
}

function textoLogisticaSync(baseValor, fuenteValor, preferirFuente = true) {
    if (preferirFuente) return fuenteValor || baseValor;
    return baseValor || fuenteValor;
}

function fusionarDatosLogisticaSync(base = {}, fuente = {}, options = {}) {
    if (!tieneDatosLogisticaSync(fuente)) return base;
    const preferirFuente = options.preferirFuente !== false;
    const logFuente = fuente.logistica_inline || fuente.logistica || {};
    const materialFuente = fuente.material_logistica || logFuente.material_logistica || {};
    const materialBase = base.material_logistica || base.logistica_inline?.material_logistica || base.logistica?.material_logistica || {};
    const usarMaterialFuente = materialLogisticaSyncTieneItems(materialFuente) &&
        (preferirFuente || !materialLogisticaSyncTieneItems(materialBase));
    const logisticaFusionada = preferirFuente
        ? { ...(base.logistica || {}), ...logFuente }
        : { ...logFuente, ...(base.logistica || {}) };
    const logisticaInlineFusionada = preferirFuente
        ? { ...(base.logistica_inline || {}), ...logFuente }
        : { ...logFuente, ...(base.logistica_inline || {}) };
    return {
        ...base,
        tiene_comanda_logistica: valorLogisticaSync(base.tiene_comanda_logistica, fuente.tiene_comanda_logistica, preferirFuente),
        logistica_creada: valorLogisticaSync(base.logistica_creada, fuente.logistica_creada, preferirFuente),
        documentos: {
            ...(base.documentos || {}),
            ...(fuente.documentos || {})
        },
        logistica: logisticaFusionada,
        logistica_inline: logisticaInlineFusionada,
        material_logistica: usarMaterialFuente ? materialFuente : base.material_logistica,
        logistics_status: textoLogisticaSync(base.logistics_status, fuente.logistics_status, preferirFuente),
        estado_logistica: textoLogisticaSync(base.estado_logistica, fuente.estado_logistica || fuente.logistics_status, preferirFuente),
        estado_confirmacion: textoLogisticaSync(base.estado_confirmacion, fuente.estado_confirmacion || fuente.confirmation_status, preferirFuente),
        confirmation_status: textoLogisticaSync(base.confirmation_status, fuente.confirmation_status || fuente.estado_confirmacion, preferirFuente),
        logistics_assigned_to: textoLogisticaSync(base.logistics_assigned_to, fuente.logistics_assigned_to, preferirFuente),
        logistics_prepared_items: valorLogisticaSync(base.logistics_prepared_items, fuente.logistics_prepared_items, preferirFuente),
        logistics_action_log: preferirFuente
            ? (Array.isArray(fuente.logistics_action_log) ? fuente.logistics_action_log : base.logistics_action_log)
            : (Array.isArray(base.logistics_action_log) ? base.logistics_action_log : fuente.logistics_action_log),
        logistics_revision_notice: Object.prototype.hasOwnProperty.call(fuente, 'logistics_revision_notice')
            ? (preferirFuente ? fuente.logistics_revision_notice : base.logistics_revision_notice)
            : (preferirFuente ? base.logistics_revision_notice : fuente.logistics_revision_notice),
        logistics_completed_confirmed_at: valorLogisticaSync(base.logistics_completed_confirmed_at, fuente.logistics_completed_confirmed_at, preferirFuente),
        logistics_completed_confirmed_by: textoLogisticaSync(base.logistics_completed_confirmed_by, fuente.logistics_completed_confirmed_by, preferirFuente),
        logistics_ready_at: valorLogisticaSync(base.logistics_ready_at, fuente.logistics_ready_at, preferirFuente),
        logistics_ready_by: textoLogisticaSync(base.logistics_ready_by, fuente.logistics_ready_by, preferirFuente),
        inventory_deducted_at: valorLogisticaSync(base.inventory_deducted_at, fuente.inventory_deducted_at, preferirFuente),
        inventory_deducted_by: textoLogisticaSync(base.inventory_deducted_by, fuente.inventory_deducted_by, preferirFuente),
        operational_revision_log: preferirFuente && Array.isArray(fuente.operational_revision_log)
            ? fuente.operational_revision_log
            : base.operational_revision_log
    };
}

function fusionarHistorialRemoto(localItems, remoteItems) {
    const mapa = new Map();

    (remoteItems || []).forEach(item => {
        const key = getClaveHistorialSync(item);
        if (key) mapa.set(String(key), item);
    });

    (localItems || []).forEach(item => {
        const key = getClaveHistorialSync(item);
        if (!key) return;
        const remoto = mapa.get(String(key));
        if (!remoto || getFechaModificacionHistorialSync(item) > getFechaModificacionHistorialSync(remoto)) {
            mapa.set(String(key), remoto ? fusionarDatosLogisticaSync(item, remoto, { preferirFuente: false }) : item);
        } else if (remoto) {
            mapa.set(String(key), fusionarDatosLogisticaSync(remoto, item, { preferirFuente: false }));
        }
    });

    return Array.from(mapa.values()).sort((a, b) => {
        const fechaB = getFechaModificacionHistorialSync(b);
        const fechaA = getFechaModificacionHistorialSync(a);
        if (fechaA !== fechaB) return fechaB - fechaA;
        return String(getCodigoHistorialSync(b)).localeCompare(String(getCodigoHistorialSync(a)));
    });
}

async function cargarHistorialRemotoSupabase(options = {}) {
    if (!haySesionSupabase()) return false;
    if (window._cargandoHistorialRemotoSupabase) {
        window._historialRemotoPendiente = true;
        if (window._historialRemotoPromise) {
            return window._historialRemotoPromise;
        }
        return Boolean(window._ultimoHistorialRemotoOk);
    }

    window._cargandoHistorialRemotoSupabase = true;
    window._historialRemotoPromise = (async () => {

    try {
        let data = [];
        let error = null;
        const columnasPreferidas = 'id, codigo, estado, fecha_evento, hora_salida, pax_total, created_at, updated_at, payload';
        const columnasBase = 'id, codigo, estado, fecha_evento, hora_salida, pax_total, created_at, payload';
        let respuesta = await window.supabaseClient
            .from('orders')
            .select(columnasPreferidas)
            .order('created_at', { ascending: false })
            .limit(1000);

        if (respuesta.error && /updated_at/i.test(String(respuesta.error.message || ''))) {
            respuesta = await window.supabaseClient
                .from('orders')
                .select(columnasBase)
                .order('created_at', { ascending: false })
                .limit(1000);
        }

        data = respuesta.data || [];
        error = respuesta.error;

        if (error) throw error;

        const comandasRemotas = [];
        const logisticasRemotas = [];

        (data || []).forEach(row => {
            const item = normalizarComandaRemota(row);
            if (!getCodigoHistorialSync(item)) return;
            if (item.tipo_registro === 'logistica') {
                logisticasRemotas.push(item);
            } else {
                comandasRemotas.push(item);
            }
        });

        window._ultimoHistorialRemotoOk = {
            at: fechaHoraIso(),
            total: data.length,
            comandas: comandasRemotas.length,
            logisticas: logisticasRemotas.length,
            codigosDuplicados: Object.entries((data || []).reduce((acc, row) => {
                const codigo = row?.payload?.codigo || row?.codigo || '';
                if (codigo) acc[codigo] = (acc[codigo] || 0) + 1;
                return acc;
            }, {})).filter(([, count]) => count > 1).slice(0, 12)
        };

        const comandasLocales = leerHistorialComandasLocal();
        const logisticasLocales = leerHistorialLogisticaLocal();

        const comandasFusionadas = fusionarHistorialRemoto(comandasLocales, comandasRemotas);
        const logisticasFusionadas = fusionarHistorialRemoto(logisticasLocales, logisticasRemotas);

        guardarHistorialComandasLocal(comandasFusionadas);
        guardarHistorialLogisticaLocal(logisticasFusionadas);

        window._ultimoHistorialRemotoOk.comandasLocales = comandasFusionadas.length;
        window._ultimoHistorialRemotoOk.logisticasLocales = logisticasFusionadas.length;

        if (options.render !== false) {
            if (typeof cargarCalendario === 'function') cargarCalendario();
            if (typeof renderizarComandasCocina === 'function') renderizarComandasCocina();
            if (typeof renderizarComandasLogistica === 'function') renderizarComandasLogistica();
        }
        if (typeof window.refrescarAlertasOperativasGlobales === 'function') {
            window.refrescarAlertasOperativasGlobales();
        }

        return true;
    } catch (error) {
        window._ultimoHistorialRemotoError = {
            at: fechaHoraIso(),
            message: error?.message || String(error)
        };
        console.warn('No se pudo cargar el historial compartido desde Supabase:', error);
        return false;
    } finally {
        window._cargandoHistorialRemotoSupabase = false;
        window._historialRemotoPromise = null;
        if (window._historialRemotoPendiente) {
            window._historialRemotoPendiente = false;
            setTimeout(() => cargarHistorialRemotoSupabase(options), 120);
        }
    }
    })();

    return window._historialRemotoPromise;
}

window.cargarHistorialRemotoSupabase = cargarHistorialRemotoSupabase;

// ========== STORAGE: realtime y refresco compartido ==========

function iniciarRealtimeHistorialSupabase() {
    if (!haySesionSupabase() || window._ordersRealtimeChannel) return;

    try {
        window._ordersRealtimeChannel = window.supabaseClient
            .channel('catercloud-orders-realtime')
            .on('broadcast', { event: 'orders_changed' }, payload => {
                window._ultimoBroadcastOrders = {
                    at: fechaHoraIso(),
                    payload: payload?.payload || null
                };
                if (typeof window.cargarHistorialRemotoSupabase === 'function') {
                    window.cargarHistorialRemotoSupabase({ render: true });
                }
            })
            .on('postgres_changes', {
                event: '*',
                schema: 'public',
                table: 'orders'
            }, () => {
                if (typeof window.cargarHistorialRemotoSupabase === 'function') {
                    window.cargarHistorialRemotoSupabase({ render: true });
                }
            })
            .subscribe(status => {
                window._ordersRealtimeStatus = {
                    status,
                    at: fechaHoraIso()
                };
                if (status === 'SUBSCRIBED') {
                    window.cargarHistorialRemotoSupabase?.({ render: true });
                }
            });
    } catch (error) {
        console.warn('No se pudo activar realtime de comandas:', error);
    }
}

window.iniciarRealtimeHistorialSupabase = iniciarRealtimeHistorialSupabase;

window.verificarRealtimeCaterCloud = async function verificarRealtimeCaterCloud() {
    const lecturaOk = await cargarHistorialRemotoSupabase({ render: true });
    return {
        usuario: getUsuarioActualEmail() || null,
        realtime: window._ordersRealtimeStatus || null,
        ultimoBroadcast: window._ultimoBroadcastOrders || null,
        lecturaOk,
        ultimaLectura: window._ultimoHistorialRemotoOk || null,
        ultimoError: window._ultimoHistorialRemotoError || null,
        comandasLocales: leerHistorialComandasLocal().length,
        logisticasLocales: leerHistorialLogisticaLocal().length
    };
};

function iniciarRefrescoHistorialCompartido() {
    if (window._historialCompartidoTimer) clearInterval(window._historialCompartidoTimer);
    window._historialCompartidoTimer = setInterval(() => {
        if (!document.hidden && getUsuarioActualId() && typeof window.cargarHistorialRemotoSupabase === 'function') {
            window.cargarHistorialRemotoSupabase({ render: true });
        }
    }, 3000);
}

document.addEventListener('user:changed', () => {
    if (window._ordersRealtimeChannel && window.supabaseClient) {
        window.supabaseClient.removeChannel(window._ordersRealtimeChannel);
        window._ordersRealtimeChannel = null;
    }
    iniciarRealtimeHistorialSupabase();
    iniciarRefrescoHistorialCompartido();
});

document.addEventListener('DOMContentLoaded', async () => {
    if (window.AuthReady) await window.AuthReady;
    iniciarRealtimeHistorialSupabase();
    iniciarRefrescoHistorialCompartido();
    if (typeof window.cargarHistorialRemotoSupabase === 'function') {
        window.cargarHistorialRemotoSupabase({ render: true });
    }
});

// ========== STORAGE: compatibilidad con funciones historicas ==========

/**
 * Genera un código único para la comanda
 * MODIFICADO: Año de 2 dígitos en lugar de 4
 * @returns {string} Código generado
 */
function generarCodigoComanda() {
    return getSiguienteCodigoLocal();
}

/**
 * Inicializa el contador si no existe
 */
function inicializarContador() {
    if (!localStorage.getItem(ORDER_STORAGE_KEYS.localCounter)) {
        localStorage.setItem(ORDER_STORAGE_KEYS.localCounter, '0');
    }
}

/**
 * Guarda eventos en el calendario
 * @param {Object} eventos - Eventos del calendario
 */
function guardarEventosCalendario(eventos) {
    guardarJsonLocalStorage(ORDER_STORAGE_KEYS.calendarEvents, eventos || {});
}

/**
 * Carga eventos del calendario
 * @returns {Object} Eventos del calendario
 */
function cargarEventosCalendario() {
    return leerJsonLocalStorage(ORDER_STORAGE_KEYS.calendarEvents, {});
}

// ========== STORAGE: helpers de Supabase ==========

async function getOrCreateCompanyIdByName(nombreEmpresa) {
  const name = (nombreEmpresa || '').trim();
  if (!name) return { company_id: null, company_name: null };

  // 1) Buscar exacto (case-insensitive)
  const { data: found, error: findError } = await window.supabaseClient
    .from('companies')
    .select('id,name')
    .ilike('name', name)
    .limit(1);

  if (findError) throw findError;
  if (found && found.length) {
    return { company_id: found[0].id, company_name: found[0].name };
  }

  // 2) Crear
  const userId = getUsuarioActualId();
  if (!userId) throw new Error('Usuario no autenticado');

  const { data: inserted, error: insError } = await window.supabaseClient
    .from('companies')
    .insert([{ name, created_by: userId }])
    .select('id,name')
    .single();

  // Si dos personas crean la misma empresa a la vez, puede fallar por unique.
  // En ese caso volvemos a buscar.
  if (insError) {
    const { data: retry, error: retryErr } = await window.supabaseClient
      .from('companies')
      .select('id,name')
      .ilike('name', name)
      .limit(1);

    if (retryErr) throw retryErr;
    if (retry && retry.length) return { company_id: retry[0].id, company_name: retry[0].name };
    throw insError;
  }

  return { company_id: inserted.id, company_name: inserted.name };
}

function getResponsableFromUser() {
  const u = getUsuarioActual();
  return (u?.user_metadata?.full_name || u?.email || '').toString();
}
