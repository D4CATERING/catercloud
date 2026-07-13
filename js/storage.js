// ========== STORAGE (LOCALSTORAGE) ==========

function getAuditActionForUpdate(nuevosDatos = {}) {
    if (Object.prototype.hasOwnProperty.call(nuevosDatos, 'estado')) {
        if (nuevosDatos.estado === 'anulada') return 'pedido_anulado';
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

/**
 * Guarda una comanda en Supabase (multiusuario)
 * @param {Object} comandaData - Datos de la comanda
 * @returns {Promise<string>} Código generado
 */
async function guardarComandaEnHistorial(comandaData) {
  const codigo = generarCodigoComanda();
  const usuarioNombre = getResponsableFromUser();

  // Construimos el payload igual que siempre
  const payload = {
    ...comandaData,
    codigo,
    fecha_creacion: new Date().toISOString(),
    fecha_modificacion: new Date().toISOString(),
    estado: 'creada',
    version: 1,
    creado_por_id: window.currentUser?.id || comandaData.creado_por_id || null,
    creado_por_nombre: comandaData.creado_por_nombre || usuarioNombre,
    creado_por_email: window.currentUser?.email || comandaData.creado_por_email || '',
    editado_por_id: null,
    editado_por_nombre: null,
    editado_por_email: null
  };

  // Si NO hay supabase o NO hay login -> guardamos SOLO en local como backup
  if (!window.supabaseClient || !window.currentUser?.id) {
    guardarComandaEnHistorialLocal(payload);
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

    const { error } = await window.supabaseClient.from('orders').insert([{
      created_by: window.currentUser.id,
      company_id,
      company_name: company_name || (empresaNombre || null),
      responsable_name: responsable,
      codigo,
      fecha_evento: comandaData.fecha_evento || null,
      hora_salida: comandaData.hora_salida || null,
      pax_total: paxTotal,
      estado: payload.estado,
      version: payload.version,
      updated_by: window.currentUser.id,
      payload
    }]);

    if (error) throw error;

    // ✅ Backup local también (opcional, pero recomendado)
    guardarComandaEnHistorialLocal(payload);
    logActividadApp('comanda_creada', codigo, {
      empresa: payload.empresa || payload.company_name || '',
      fecha_evento: payload.fecha_evento || null,
      pax: payload.pax || payload.pax_total || null
    });

    return codigo;

  } catch (error) {
    // ✅ Si Supabase falla, guardamos en local como respaldo
    console.warn('Supabase falló, guardando backup en localStorage:', error);
    guardarComandaEnHistorialLocal(payload);
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
function guardarComandaEnHistorialLocal(comandaData) {
    const historial = JSON.parse(localStorage.getItem('historialComandas') || '[]');
    // Usar el código que ya viene en el payload, NO generar uno nuevo
    const codigo = comandaData.codigo || generarCodigoComanda();
    
    const comandaCompleta = {
        ...comandaData,
        codigo,
        fecha_creacion: comandaData.fecha_creacion || new Date().toISOString(),
        fecha_modificacion: new Date().toISOString(),
        estado: comandaData.estado || 'creada',
        version: comandaData.version || 1
    };
    
    historial.push(comandaCompleta);
    localStorage.setItem('historialComandas', JSON.stringify(historial));
    return codigo;
}

async function sincronizarSolicitudPedido(solicitud) {
    if (!window.supabaseClient || !window.currentUser?.id) return false;

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

        solicitud.creado_por_id = window.currentUser.id;
        solicitud.creado_por_nombre = responsable;
        solicitud.creado_por_email = window.currentUser.email || '';

        const { error } = await window.supabaseClient.from('orders').insert([{
            created_by: window.currentUser.id,
            company_id,
            company_name,
            responsable_name: responsable,
            codigo: solicitud.codigo,
            fecha_evento: solicitud.fecha_evento || null,
            hora_salida: null,
            pax_total: Number(solicitud.pax || solicitud.pax_total || 0) || null,
            estado: solicitud.estado || 'negociacion',
            version: solicitud.version || 1,
            updated_by: window.currentUser.id,
            payload: solicitud
        }]);

        if (error) throw error;
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
    const historial = JSON.parse(localStorage.getItem('historialComandas') || '[]');
    const index = historial.findIndex(c => c.codigo === codigo);
    
    if (index !== -1) {
        const versionActual = Number(historial[index].version || 1);
        historial[index] = {
            ...historial[index],
            ...nuevosDatos,
            fecha_modificacion: new Date().toISOString(),
            version: versionActual + 1,
            editado_por: getResponsableFromUser(),
            editado_por_id: window.currentUser?.id || null,
            editado_por_nombre: getResponsableFromUser(),
            editado_por_email: window.currentUser?.email || ''
        };
        
        localStorage.setItem('historialComandas', JSON.stringify(historial));
        const auditAction = getAuditActionForUpdate(nuevosDatos);
        logActividadApp(auditAction, codigo, {
            cambios: Object.keys(nuevosDatos || {}),
            estado: historial[index].estado || null,
            version: historial[index].version
        });

        if (window.supabaseClient && window.currentUser?.id) {
            try {
                const { error } = await window.supabaseClient
                    .from('orders')
                    .update({
                        payload: historial[index],
                        fecha_evento: historial[index].fecha_evento || null,
                        hora_salida: historial[index].hora_salida || null,
                        pax_total: Number(historial[index].pax || historial[index].pax_total || 0) || null,
                        estado: historial[index].estado || 'editada',
                        version: historial[index].version,
                        updated_by: window.currentUser.id,
                        updated_at: new Date().toISOString()
                    })
                    .eq('codigo', codigo);

                if (error) throw error;
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
    const historial = JSON.parse(localStorage.getItem('historialComandas') || '[]');
    return historial.find(c => c.codigo === codigo);
}

/**
 * Elimina una comanda del historial
 * @param {string} codigo - Código de la comanda
 */
function eliminarComandaDelHistorial(codigo) {
    const historial = JSON.parse(localStorage.getItem('historialComandas') || '[]');
    const comanda = historial.find(c => c.codigo === codigo);
    const nuevoHistorial = historial.filter(c => c.codigo !== codigo);
    localStorage.setItem('historialComandas', JSON.stringify(nuevoHistorial));
    logActividadApp('pedido_eliminado_local', codigo, {
        empresa: comanda?.empresa || comanda?.company_name || '',
        fecha_evento: comanda?.fecha_evento || null
    });
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
 * MODIFICADO: Año de 2 dígitos en lugar de 4
 * @returns {string} Código generado
 */
function generarCodigoComanda() {
    const añoCompleto = new Date().getFullYear();
    const año = añoCompleto.toString().slice(-2); // Obtiene los 2 últimos dígitos
    const lastCounter = localStorage.getItem('contadorComandas');
    const lastYear = localStorage.getItem('ultimoAñoComandas');
    
    let contador;
    if (lastYear === añoCompleto.toString()) {
        contador = parseInt(lastCounter) + 1;
    } else {
        contador = 1;
    }
    
    localStorage.setItem('contadorComandas', contador.toString());
    localStorage.setItem('ultimoAñoComandas', añoCompleto.toString());
    
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

// ====== SUPABASE HELPERS ======

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
  const user = window.currentUser;
  if (!user?.id) throw new Error('Usuario no autenticado');

  const { data: inserted, error: insError } = await window.supabaseClient
    .from('companies')
    .insert([{ name, created_by: user.id }])
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
  const u = window.currentUser;
  return (u?.user_metadata?.full_name || u?.email || '').toString();
}
