// ========== OPERATIONAL ALERTS MODULE ==========

function hashCambioOperativo(value) {
    const texto = String(value || '');
    let hash = 0;
    for (let i = 0; i < texto.length; i++) {
        hash = ((hash << 5) - hash) + texto.charCodeAt(i);
        hash |= 0;
    }
    return Math.abs(hash).toString(36);
}

function getResumenNoticeOperativa(notice) {
    if (!notice) return 'Comanda actualizada';
    if (Array.isArray(notice.changes_detail) && notice.changes_detail.length) {
        return notice.changes_detail
            .slice(0, 4)
            .map(cambio => `${cambio.campo || 'Campo'}: ${cambio.antes || 'Vacio'} -> ${cambio.despues || 'Vacio'}`)
            .join(' · ');
    }
    if (Array.isArray(notice.changes) && notice.changes.length) {
        return notice.changes.join(', ');
    }
    return notice.message || 'Comanda actualizada';
}

function getEtiquetaTipoCambioOperativo(tipo, notice) {
    const cambios = Array.isArray(notice?.changes) ? notice.changes.join(' ').toLowerCase() : '';
    const detalle = Array.isArray(notice?.changes_detail)
        ? notice.changes_detail.map(c => `${c.grupo || ''} ${c.campo || ''}`).join(' ').toLowerCase()
        : '';
    if (/hora de salida|fecha del evento|empresa|responsable|pax/.test(detalle)) {
        return 'Cambio en datos del pedido';
    }
    if (tipo === 'logistica') {
        if (/material/.test(cambios)) return 'Cambio en material (Logistica)';
        return 'Cambio en datos de logistica';
    }
    if (/intolerancias|notas/.test(cambios)) return 'Cambio en cocina';
    return 'Cambio en menu (Cocina)';
}

function noticeAfectaMaterialLogistica(notice) {
    const cambios = Array.isArray(notice?.changes) ? notice.changes.join(' ').toLowerCase() : '';
    return /material de logistica|datos de entrega|datos generales|pax/.test(cambios);
}

function getKeyCambioOperativo(areaVista, item, tipo, notice) {
    const codigo = getCodigoOperativo(item) || 'sin-codigo';
    return [
        'catercloudOperationalChange',
        areaVista,
        tipo,
        codigo,
        hashCambioOperativo(JSON.stringify(notice || {}))
    ].join(':');
}

function getUsuarioKeyCambioOperativo() {
    return String(getUsuarioActualIdDashboard() || getUsuarioActualEmailDashboard() || 'usuario-local')
        .replace(/[^a-z0-9@._-]/gi, '_');
}

function getStorageKeyCambioOperativo(key) {
    return `${key}:seen:${getUsuarioKeyCambioOperativo()}`;
}

function getStorageKeyCambioOperativoGlobal(key) {
    return `${key}:seen`;
}

function cambioOperativoYaGestionado(key) {
    if (!key) return false;
    try {
        return !!localStorage.getItem(getStorageKeyCambioOperativo(key)) ||
            !!localStorage.getItem(getStorageKeyCambioOperativoGlobal(key));
    } catch (_) {
        return false;
    }
}

function crearPayloadCambioOperativoGestionado(action) {
    return JSON.stringify({
        action,
        by: getUsuarioActualEmailDashboard() || null,
        at: getTimestampOperativoDashboard()
    });
}

function marcarCambioOperativoGestionado(key, action = 'dismissed') {
    if (!key) return;
    try {
        const payload = crearPayloadCambioOperativoGestionado(action);
        localStorage.setItem(getStorageKeyCambioOperativoGlobal(key), payload);
        localStorage.setItem(getStorageKeyCambioOperativo(key), payload);
    } catch (_) {
        sessionStorage.setItem(key, action);
    }
}

function parseFechaOperativaLocal(fecha) {
    if (!fecha) return null;
    const [year, month, day] = String(fecha).split('T')[0].split('-').map(Number);
    if (!year || !month || !day) return null;
    const parsed = new Date(year, month - 1, day);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function getFechaEventoOperativa(item) {
    const fecha = String(item?.fecha_evento || item?.fecha || item?.fecha_creacion || '').split('T')[0];
    return fecha || '';
}

function esFechaAvisoOperativoSemanaActual(item) {
    const fechaEvento = parseFechaOperativaLocal(getFechaEventoOperativa(item));
    const hoy = parseFechaOperativaLocal(getFechaLocalHoyDashboard());
    if (!fechaEvento || !hoy) return false;

    const inicioSemana = new Date(hoy);
    const diaSemana = inicioSemana.getDay() || 7;
    inicioSemana.setDate(inicioSemana.getDate() - diaSemana + 1);
    inicioSemana.setHours(0, 0, 0, 0);

    const finSemana = new Date(inicioSemana);
    finSemana.setDate(inicioSemana.getDate() + 7);

    return fechaEvento >= inicioSemana && fechaEvento < finSemana;
}

function getCambiosOperativosPendientes(areaVista, eventos) {
    if (window.AppPermissions) {
        if (areaVista === 'cocina' && !AppPermissions.canEditKitchen()) return [];
        if (areaVista === 'logistica' && !AppPermissions.canEditLogistics()) return [];
    }

    const cambios = [];
    (eventos || []).forEach((item, index) => {
        if (!esFechaAvisoOperativoSemanaActual(item)) return;

        const codigo = getCodigoOperativo(item);
        const empresa = item.empresa || item.company_name || 'Sin empresa';
        const fechaEvento = getFechaEventoOperativa(item);

        if (areaVista === 'cocina' && item.kitchen_revision_notice) {
            cambios.push({
                areaVista,
                tipo: 'cocina',
                index,
                codigo,
                fechaEvento,
                empresa,
                label: 'Cocina',
                notice: item.kitchen_revision_notice,
                key: getKeyCambioOperativo(areaVista, item, 'cocina', item.kitchen_revision_notice)
            });
        }

        if (areaVista === 'logistica') {
            if (item.kitchen_revision_notice) {
                cambios.push({
                    areaVista,
                    tipo: 'cocina',
                    index,
                    codigo,
                    fechaEvento,
                    empresa,
                    label: 'Cocina',
                    notice: item.kitchen_revision_notice,
                    key: getKeyCambioOperativo(areaVista, item, 'cocina', item.kitchen_revision_notice)
                });
            }
            if (item.logistics_revision_notice) {
                const mismaRevisionCocina = item.kitchen_revision_notice
                    && JSON.stringify(item.kitchen_revision_notice) === JSON.stringify(item.logistics_revision_notice);
                if (!mismaRevisionCocina || noticeAfectaMaterialLogistica(item.logistics_revision_notice)) {
                    cambios.push({
                        areaVista,
                        tipo: 'logistica',
                        index,
                        codigo,
                        fechaEvento,
                        empresa,
                        label: 'Logistica',
                        notice: item.logistics_revision_notice,
                        key: getKeyCambioOperativo(areaVista, item, 'logistica', item.logistics_revision_notice)
                    });
                }
            }
        }
    });
    return cambios.filter(cambio => !cambioOperativoYaGestionado(cambio.key) && !sessionStorage.getItem(cambio.key));
}

function getAreasAvisoOperativoPorRol() {
    const role = window.AppPermissions?.role || 'viewer';
    if (role === 'admin') return ['cocina', 'logistica'];
    if (role === 'cocina') return ['cocina'];
    if (role === 'logistica') return ['logistica'];
    return [];
}

function getCambiosOperativosPendientesGlobales() {
    const areas = getAreasAvisoOperativoPorRol();
    if (!areas.length) return [];

    const cambios = areas.flatMap(areaVista => {
        const eventos = areaVista === 'cocina'
            ? getEventosCocinaActivos()
            : getEventosLogisticaActivos();
        return getCambiosOperativosPendientes(areaVista, eventos);
    });

    const porAviso = new Map();
    cambios.forEach(cambio => {
        const dedupeKey = [
            cambio.tipo,
            cambio.codigo || 'sin-codigo',
            hashCambioOperativo(JSON.stringify(cambio.notice || {}))
        ].join(':');
        const existente = porAviso.get(dedupeKey);
        if (!existente || cambio.areaVista === cambio.tipo) {
            porAviso.set(dedupeKey, cambio);
        }
    });

    return Array.from(porAviso.values()).sort((a, b) => {
        const fechaB = new Date(b.notice?.at || 0).getTime() || 0;
        const fechaA = new Date(a.notice?.at || 0).getTime() || 0;
        return fechaB - fechaA;
    });
}

function reproducirSonidoCambioOperativo(key) {
    if (!key || sessionStorage.getItem(`${key}:sound`)) return;
    const prefs = typeof cargarPreferencias === 'function' ? cargarPreferencias() : { notificaciones: true };
    if (prefs.notificaciones === false) return;

    try {
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        if (!AudioContext) return;
        const ctx = window._operationalAlertAudioCtx || new AudioContext();
        window._operationalAlertAudioCtx = ctx;

        const emitir = () => {
            const now = ctx.currentTime;
            const gain = ctx.createGain();
            gain.gain.setValueAtTime(0.0001, now);
            gain.gain.exponentialRampToValueAtTime(0.16, now + 0.02);
            gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.62);
            gain.connect(ctx.destination);

            [740, 980, 740].forEach((freq, i) => {
                const osc = ctx.createOscillator();
                osc.type = 'sine';
                osc.frequency.setValueAtTime(freq, now + (i * 0.14));
                osc.connect(gain);
                osc.start(now + (i * 0.14));
                osc.stop(now + 0.16 + (i * 0.14));
            });
            sessionStorage.setItem(`${key}:sound`, '1');
        };

        if (ctx.state === 'suspended') {
            ctx.resume().then(emitir).catch(() => {});
        } else {
            emitir();
        }
    } catch (error) {
        console.warn('No se pudo reproducir el sonido de alerta:', error);
    }
}

function prepararSonidoAlertasOperativas() {
    if (window._operationalAlertAudioPrepared) return;
    window._operationalAlertAudioPrepared = true;

    const activar = () => {
        try {
            const AudioContext = window.AudioContext || window.webkitAudioContext;
            if (!AudioContext) return;
            const ctx = window._operationalAlertAudioCtx || new AudioContext();
            window._operationalAlertAudioCtx = ctx;
            if (ctx.state === 'suspended') ctx.resume().catch(() => {});
        } catch (error) {
            console.warn('No se pudo preparar el audio de alertas:', error);
        }
    };

    ['pointerdown', 'keydown', 'touchstart'].forEach(evento => {
        window.addEventListener(evento, activar, { once: true, passive: true });
    });
}

function cerrarTarjetaCambioOperativo() {
    document.getElementById('operationalChangeOverlay')?.remove();
}

async function abrirCambioOperativoDesdeTarjeta(areaVista, index, key) {
    marcarCambioOperativoGestionado(key, 'opened');
    cerrarTarjetaCambioOperativo();
    const codigo = key ? String(key).split(':')[3] || '' : '';
    if (areaVista === 'cocina') {
        if (typeof mostrarCocina === 'function') await mostrarCocina();
        window.cocinaEventosActivos = getEventosCocinaActivos();
        abrirProduccionCocina(index, codigo);
        return;
    }
    if (typeof mostrarLogistica === 'function') await mostrarLogistica();
    window.logisticaEventosActivos = getEventosLogisticaActivos();
    abrirPreparacionLogistica(index, codigo);
}

function descartarCambioOperativoDesdeTarjeta(key) {
    marcarCambioOperativoGestionado(key, 'dismissed');
    cerrarTarjetaCambioOperativo();
}

function crearTarjetaCambioOperativoHtml({ key, areaVista, index, claseTipo = '', kicker, titulo, subtitulo, detalle, accion }) {
    const clase = claseTipo ? ` operational-change-overlay--${claseTipo}` : '';
    return {
        clase,
        html: `
        <article class="operational-change-card" role="dialog" aria-live="assertive" aria-label="Comanda modificada">
            <button type="button" class="operational-change-close" aria-label="Cerrar aviso"
                onclick="descartarCambioOperativoDesdeTarjeta('${key}')">×</button>
            <button type="button" class="operational-change-body"
                onclick="abrirCambioOperativoDesdeTarjeta('${areaVista}', ${index}, '${key}')">
                <span class="operational-change-kicker">${escapeLogisticaHtml(kicker)}</span>
                <strong>${escapeLogisticaHtml(titulo)}</strong>
                <span>${escapeLogisticaHtml(subtitulo)}</span>
                <small>${escapeLogisticaHtml(detalle)}</small>
                <em>${escapeLogisticaHtml(accion)}</em>
            </button>
        </article>
    `
    };
}

function mostrarTarjetaCambioOperativo(areaVista, eventos) {
    const cambios = getCambiosOperativosPendientes(areaVista, eventos);
    if (!cambios.length) {
        cerrarTarjetaCambioOperativo();
        return;
    }

    const cambio = cambios[0];
    const detalle = getResumenNoticeOperativa(cambio.notice);
    const codigoConFecha = `${cambio.codigo || 'Sin codigo'}${cambio.fechaEvento ? ` · ${cambio.fechaEvento}` : ''}`;
    const tituloArea = areaVista === 'cocina' ? 'Cocina' : 'Logistica';
    const accion = areaVista === 'cocina' ? 'Abrir comanda de trabajo' : 'Abrir preparacion';
    const existente = document.getElementById('operationalChangeOverlay');
    if (existente?.dataset.key === cambio.key) return;
    cerrarTarjetaCambioOperativo();

    const overlay = document.createElement('div');
    overlay.id = 'operationalChangeOverlay';
    overlay.className = 'operational-change-overlay';
    overlay.dataset.key = cambio.key;
    overlay.innerHTML = crearTarjetaCambioOperativoHtml({
        key: cambio.key,
        areaVista,
        index: cambio.index,
        kicker: `Cambio para ${tituloArea}`,
        titulo: `Comanda modificada · ${codigoConFecha}`,
        subtitulo: `${cambio.empresa} · afecta ${cambio.label}`,
        detalle,
        accion
    }).html;
    document.body.appendChild(overlay);
}

function mostrarTarjetaCambioOperativoGlobal() {
    const cambios = getCambiosOperativosPendientesGlobales();
    if (!cambios.length) {
        cerrarTarjetaCambioOperativo();
        return;
    }

    const cambio = cambios[0];
    const detalle = getResumenNoticeOperativa(cambio.notice);
    const codigoConFecha = `${cambio.codigo || 'Sin codigo'}${cambio.fechaEvento ? ` · ${cambio.fechaEvento}` : ''}`;
    const tituloTipo = getEtiquetaTipoCambioOperativo(cambio.tipo, cambio.notice);
    const tituloArea = cambio.areaVista === 'cocina' ? 'Cocina' : 'Logistica';
    const accion = cambio.areaVista === 'cocina' ? 'Abrir produccion' : 'Abrir preparacion';
    const existente = document.getElementById('operationalChangeOverlay');
    if (existente?.dataset.key === cambio.key) return;
    cerrarTarjetaCambioOperativo();

    const overlay = document.createElement('div');
    const tarjeta = crearTarjetaCambioOperativoHtml({
        key: cambio.key,
        areaVista: cambio.areaVista,
        index: cambio.index,
        claseTipo: cambio.tipo,
        kicker: tituloTipo,
        titulo: codigoConFecha,
        subtitulo: `${cambio.empresa} · aviso para ${tituloArea}`,
        detalle,
        accion
    });
    overlay.id = 'operationalChangeOverlay';
    overlay.className = `operational-change-overlay${tarjeta.clase}`;
    overlay.dataset.key = cambio.key;
    overlay.innerHTML = tarjeta.html;
    document.body.appendChild(overlay);
    reproducirSonidoCambioOperativo(cambio.key);
}

function refrescarAlertasOperativasGlobales() {
    if (document.hidden) return;
    mostrarTarjetaCambioOperativoGlobal();
}

window.refrescarAlertasOperativasGlobales = refrescarAlertasOperativasGlobales;

window.verificarNotificacionesOperativas = async function verificarNotificacionesOperativas() {
    if (typeof window.cargarHistorialRemotoSupabase === 'function') {
        await window.cargarHistorialRemotoSupabase({ render: false });
    }
    const areas = getAreasAvisoOperativoPorRol();
    const pendientes = getCambiosOperativosPendientesGlobales();
    return {
        usuario: getUsuarioActualEmailDashboard() || null,
        rol: window.AppPermissions?.role || null,
        areas,
        pendientes: pendientes.length,
        avisos: pendientes.slice(0, 8).map(item => ({
            codigo: item.codigo,
            empresa: item.empresa,
            tipo: item.tipo,
            areaVista: item.areaVista,
            cambios: item.notice?.changes || [],
            fecha: item.notice?.at || null
        })),
        realtime: window._ordersRealtimeStatus || null,
        ultimaLectura: window._ultimoHistorialRemotoOk || null
    };
};

