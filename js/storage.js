// ========== STORAGE (LOCALSTORAGE) ==========

/**
 * Guarda una comanda en Supabase (multiusuario)
 * @param {Object} comandaData - Datos de la comanda
 * @returns {Promise<string>} Código generado
 */
async function guardarComandaEnHistorial(comandaData) {
  const codigo = generarCodigoComanda();

  // Construimos el payload igual que siempre
  const payload = {
    ...comandaData,
    codigo,
    fecha_creacion: new Date().toISOString(),
    fecha_modificacion: new Date().toISOString(),
    estado: 'creada',
    version: 1
  };

  // Si NO hay supabase o NO hay login -> guardamos SOLO en local como backup
  if (!window.supabaseClient || !window.currentUser?.id) {
    guardarComandaEnHistorialLocal(payload);
    return codigo;
  }

  try {
    const empresaNombre =
      (comandaData.empresa || comandaData.empresa_nombre || comandaData.company_name || '').toString();

    const { company_id, company_name } = await getOrCreateCompanyIdByName(empresaNombre);

    const responsable =
      (comandaData.responsable || comandaData.responsable_nombre || '').toString().trim()
      || getResponsableFromUser();

    if (!responsable) throw new Error('No se pudo determinar el Responsable (usuario sin nombre/email)');

    const { error } = await window.supabaseClient.from('orders').insert([{
      created_by: window.currentUser.id,
      company_id,
      company_name: company_name || (empresaNombre || null),
      responsable_name: responsable,
      payload
    }]);

    if (error) throw error;

    // ✅ Backup local también (opcional, pero recomendado)
    guardarComandaEnHistorialLocal(payload);

    return codigo;

  } catch (error) {
    // ✅ Si Supabase falla, guardamos en local como respaldo
    console.warn('Supabase falló, guardando backup en localStorage:', error);
    guardarComandaEnHistorialLocal(payload);
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

