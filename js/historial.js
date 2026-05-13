// ========== HISTORIAL DE COMANDA ==========

function cargarHistorial() {
    const historial = JSON.parse(localStorage.getItem('historialComandas') || '[]');
    const container = document.getElementById('comandasListHistorial') || document.getElementById('comandasList');

    if (historial.length === 0) {
        container.innerHTML = '<p style="color: #94a3b8; text-align: center; font-size: 0.9rem; padding: 40px;">No hay comandas en el historial</p>';
        return;
    }

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
        </div>`;
    });

    container.innerHTML = html;
}

function filtrarComandas() {
    const historial = JSON.parse(localStorage.getItem('historialComandas') || '[]');
    const busqEl = document.getElementById('filtroBusquedaH') || document.getElementById('filtroBusqueda');
    const filtro = busqEl ? busqEl.value.toLowerCase() : '';
    const filtroFecha = document.getElementById('filtroFecha').value;
    const filtroEstado = document.getElementById('filtroEstado').value;

    const comandasFiltradas = historial.filter(comanda => {
        const coincideBusqueda = !filtro ||
            comanda.empresa.toLowerCase().includes(filtro) ||
            comanda.codigo.toLowerCase().includes(filtro) ||
            comanda.responsable.toLowerCase().includes(filtro);

        const coincideFecha = !filtroFecha ||
            comanda.fecha_evento.split('T')[0] === filtroFecha;

        const coincideEstado = !filtroEstado ||
            comanda.estado === filtroEstado;

        return coincideBusqueda && coincideFecha && coincideEstado;
    });

    comandasFiltradas.sort((a, b) => new Date(b.fecha_creacion) - new Date(a.fecha_creacion));

    const container = document.getElementById('comandasListHistorial') || document.getElementById('comandasList');

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
        </div>`;
    });

    container.innerHTML = html;
}

function verDetalleComanda(codigo) {
    const comanda = obtenerComandaDelHistorial(codigo);
    if (!comanda) { alert('Comanda no encontrada'); return; }

    const dashboard = document.getElementById('dashboard');
    const comandaForm = document.getElementById('comandaForm');
    const historialPage = document.getElementById('historialPage');
    const detalleComanda = document.getElementById('detalleComanda');

    if (dashboard) dashboard.style.display = 'none';
    if (comandaForm) comandaForm.style.display = 'none';
    if (historialPage) historialPage.style.display = 'none';
    if (detalleComanda) detalleComanda.style.display = 'block';

    _renderDetalleComanda(comanda);
}

function _renderMenuDetalle(comanda, pax) {

    let html = '';

    function fila(nombre, cantidad, unidad, esTitulo) {
        return `<div class="detalle-menu-row">
            <span class="detalle-menu-nombre${esTitulo ? ' es-titulo' : ''}">${nombre}</span>
            <span class="detalle-menu-cantidad">${cantidad ? cantidad + ' ' + (unidad || '') : ''}</span>
        </div>`;
    }

    if (comanda.referencias_desayuno && Object.keys(comanda.referencias_desayuno).length) {
        const refs = Object.values(comanda.referencias_desayuno).filter(r => r && r.cantidad > 0);

        refs.filter(r => r.tipo !== 'termo' && r.tipo !== 'leche_especial').forEach(ref => {
            let extra = '';

            if (ref.tipo === 'bolleria' && ref.opcionesSeleccionadas?.length) {
                extra = ' (' + ref.opcionesSeleccionadas.join(', ') + ')';
            }

            if (ref.tipo === 'sandwich' && ref.sabor) {
                extra = ' — ' + ref.sabor;
            }

            if (ref.tipo === 'sandwich_multiple' && ref.sandwiches?.length) {
                extra = ': ' + ref.sandwiches
                    .filter(s => s.sabor)
                    .map(s => `${s.sabor} ×${s.cantidad || ''}`)
                    .join(', ');
            }

            html += fila(ref.nombre + extra, ref.cantidad, ref.unidad || 'uds', false);
        });
    }

    if (comanda.foodbox_lunch) {
        const fl = comanda.foodbox_lunch;

        const ensaladas = fl.ensaladas || fl.selecciones?.ensaladas || [];
        const sandwiches = fl.sandwiches || fl.selecciones?.sandwiches || [];
        const postres = fl.postres || fl.selecciones?.postres || [];

        if (ensaladas.length || sandwiches.length || postres.length) {
            ensaladas.forEach(e => {
                if ((e.cantidad || 1) > 0) {
                    html += fila('🥗 ' + (e.nombre || e.id), e.cantidad || '', 'uds', false);
                }
            });

            sandwiches.forEach(s => {
                if ((s.cantidad || 1) > 0) {
                    html += fila('🥪 ' + (s.nombre || s.id), s.cantidad || '', 'uds', false);
                }
            });

            postres.forEach(p => {
                if ((p.cantidad || 1) > 0) {
                    html += fila('🍰 ' + (p.nombre || p.id), p.cantidad || '', 'uds', false);
                }
            });
        } else {
            if (fl.ensalada_principal) html += fila('🥗 ' + (fl.ensalada_principal.nombre || fl.ensalada_principal), '', '', false);
            if (fl.sandwich_principal) html += fila('🥪 ' + (fl.sandwich_principal.nombre || fl.sandwich_principal), '', '', false);
            if (fl.postre_principal) html += fila('🍰 ' + (fl.postre_principal.nombre || fl.postre_principal), '', '', false);

            if (fl.adicionales?.length) {
                fl.adicionales.forEach(a => {
                    html += fila('➕ ' + (a.nombre || a.opcionId || ''), a.cantidad, '', false);
                });
            }
        }
    }

    if (comanda.referencias) {
        const saladas = comanda.referencias.saladas || [];
        const postres = comanda.referencias.postres || [];
        const mul = comanda.multiplicadores;

        if (saladas.length) {
            const mulLabel = mul?.saladas ? ` ×${mul.saladas}` : '';
            html += fila('Saladas' + mulLabel, '', '', true);
            saladas.forEach(r => html += fila(r.nombre || r.id, r.cantidad, r.unidad || 'uds', false));
        }

        if (postres.length) {
            const mulLabel = mul?.postres ? ` ×${mul.postres}` : '';
            html += fila('Postres' + mulLabel, '', '', true);
            postres.forEach(r => html += fila(r.nombre || r.id, r.cantidad, r.unidad || 'uds', false));
        }
    }

    // ── DIY Desayunos (cat 5) y Foodbox (cat 6) ──
    if (comanda.bandejas) {
        const b = comanda.bandejas;
        const grupos = [
            { icono: '☕', label: 'Termos y Bebidas',  items: b.termos     || [] },
            { icono: '🍽️', label: 'Servicio',          items: b.servicio   || [] },
            { icono: '🍰', label: 'Dulces y Bollería', items: b.dulces     || [] },
            { icono: '🥪', label: 'Salados y Bebidas', items: b.salados    || [] },
            { icono: '🥗', label: 'Saladas',           items: b.saladas    || [] },
            { icono: '🥪', label: 'Sándwiches',        items: b.sandwiches || [] },
            { icono: '🍰', label: 'Postres',           items: b.postres    || [] },
        ].filter(g => g.items.length > 0);

        grupos.forEach(g => {
            html += fila(g.icono + ' ' + g.label, '', '', true);
            g.items.forEach(it => {
                const variantes = it.variantes?.length
                    ? ' (' + it.variantes.map(v => v.nombre || v).join(', ') + ')'
                    : '';
                html += fila(it.nombre + variantes, it.cantidad || 1, 'ud.', false);
            });
        });
    }

    if (!html) {
        html = `<span class="detalle-menu-nombre" style="color:#94a3b8;">Sin detalle disponible</span>`;
    }

    return html;
}

function _renderTotalTermosDetalle(comanda) {
    const todosMenusDetalle = [comanda, ...(comanda.menus_adicionales || [])];
    const termosTotales = {};

    todosMenusDetalle.forEach(m => {
        const refs = m.referencias_desayuno || {};

        Object.values(refs).forEach(r => {
            if (!r || (r.tipo !== 'termo' && r.tipo !== 'leche_especial') || !r.cantidad || r.cantidad <= 0) return;

            if (!termosTotales[r.nombre]) {
                termosTotales[r.nombre] = { ...r, cantidad: 0 };
            }

            termosTotales[r.nombre].cantidad += r.cantidad;
        });
    });

    const termosList = Object.values(termosTotales);
    if (!termosList.length) return '';

    const tipoTermo = termosList[0]?.tipoTermo || '';
    const tag = tipoTermo ? ` <span class="detalle-termo-tag">${tipoTermo.toUpperCase()}</span>` : '';

    const partes = termosList.map(r => {
        const nombreCorto = String(r.nombre || '')
            .replace(/^Termo de?\s*/i, '')
            .replace(/^Termo\s*/i, '');

        return `${nombreCorto} ×${r.cantidad}`;
    }).join('  ·  ');

    return `<div class="detalle-termos-total">
        <div class="detalle-menu-row">
            <span class="detalle-menu-nombre" style="font-weight:600;">☕ Total termos: ${partes}${tag}</span>
        </div>
    </div>`;
}

function _renderDetalleComanda(comanda) {
    const el = (id) => document.getElementById(id);

    if (el('detalleCodigo')) el('detalleCodigo').textContent = comanda.codigo || '';

    if (el('detalleFecha')) {
        el('detalleFecha').textContent = comanda.fecha_creacion
            ? 'Creada el ' + new Date(comanda.fecha_creacion).toLocaleDateString('es-ES')
            : '';
    }

    if (el('detalleEmpresa')) el('detalleEmpresa').textContent = comanda.empresa || '—';
    if (el('detalleResponsable')) el('detalleResponsable').textContent = comanda.responsable || '—';
    if (el('detallePax')) el('detallePax').textContent = comanda.pax || '0';

    if (el('detalleFechaEvento')) {
        const fe = comanda.fecha_evento ? new Date(comanda.fecha_evento + 'T00:00:00') : null;
        el('detalleFechaEvento').textContent = fe ? fe.toLocaleDateString('es-ES') : '—';
    }

    if (el('detalleHoraSalida')) el('detalleHoraSalida').textContent = comanda.hora_salida || '—';

    const nombreMenu = comanda.menu_principal?.nombre || 'Menú';
    const tipoMenaje = comanda.tipo_menaje;

    const labelMenaje = tipoMenaje === 'loza'
        ? 'LOZA'
        : tipoMenaje === 'desechable'
            ? 'DESECHABLE'
            : (tipoMenaje ? String(tipoMenaje).toUpperCase() : '');

    const menusDetalle = [];

    menusDetalle.push({
        ...comanda,
        nombre: nombreMenu,
        pax: comanda.pax
    });

    (comanda.menus_adicionales || []).forEach(m => {
        menusDetalle.push({
            ...m,
            nombre: m.nombre || m.menu_principal?.nombre || 'Menú adicional',
            pax: m.pax_adicional || m.pax || '',
            menu_principal: { nombre: m.nombre || m.menu_principal?.nombre || 'Menú adicional' },
            referencias_desayuno: m.referencias_desayuno || null,
            referencias: m.referencias || null,
            foodbox_lunch: m.foodbox_lunch || null,
            multiplicadores: m.multiplicadores || null
        });
    });

    if (el('detalleMenuTitulo')) {
        const titulo = menusDetalle.length > 1 ? 'Menús de la comanda' : nombreMenu;
        el('detalleMenuTitulo').innerHTML = titulo;
    }
    // Badge DESECHABLE/LOZA centrado debajo del header
    const menajeBadgeEl = el('detalleMenajeBadge');
    if (menajeBadgeEl) {
        if (labelMenaje) {
            menajeBadgeEl.textContent = labelMenaje;
            menajeBadgeEl.style.display = 'block';
        } else {
            menajeBadgeEl.style.display = 'none';
        }
    }

    if (el('detalleMenuPrincipal')) {
        const totalTermosHtml = _renderTotalTermosDetalle(comanda);

        if (menusDetalle.length > 1) {
            const cardsHtml = menusDetalle.map(menu => {
                const paxMenu = menu.pax || comanda.pax || '';

                return `<div class="detalle-menu-card">
                    <div class="detalle-menu-row" style="margin-bottom:6px;">
                        <span class="detalle-menu-nombre es-titulo" style="font-weight:600;">${menu.nombre || 'Menú'}</span>
                        <span class="detalle-menu-cantidad">${paxMenu ? paxMenu + ' pax' : ''}</span>
                    </div>
                    ${_renderMenuDetalle(menu, paxMenu)}
                </div>`;
            }).join('');

            el('detalleMenuPrincipal').innerHTML = `<div class="detalle-menus-grid">${cardsHtml}</div>${totalTermosHtml}`;
        } else {
            const unico = menusDetalle[0] || comanda;
            el('detalleMenuPrincipal').innerHTML = _renderMenuDetalle(unico, unico.pax || comanda.pax) + totalTermosHtml;
        }
    }

    const secAdi = el('detalleMenusAdicionalesSection');
    const contAdi = el('detalleMenusAdicionales');

    if (secAdi) secAdi.style.display = 'none';
    if (contAdi) contAdi.innerHTML = '';

    const secRef = el('detalleReferenciasSection');
    if (secRef) secRef.style.display = 'none';

    const secMul = el('detalleMultiplicadoresSection');
    if (secMul) secMul.style.display = 'none';

    const secNotas = el('detalleNotasSection');
    const divNotas = el('detalleNotas');
    const notasTexto = comanda.alergias?.notas || '';

    if (notasTexto) {
        if (secNotas) secNotas.style.display = '';
        if (divNotas) divNotas.textContent = notasTexto;
    } else {
        if (secNotas) secNotas.style.display = 'none';
    }

    const secEntrega = el('detalleDatosLogisticaSection');
    const contEntrega = el('detalleDatosLogisticaContent');

    if (secEntrega && contEntrega) {
        const logInline = comanda.logistica_inline ||
            (comanda.logistica && !Array.isArray(comanda.logistica.bebidas) &&
            (comanda.logistica.nombre_contacto || comanda.logistica.direccion)
                ? comanda.logistica
                : null);

        const campos = [
            { label: 'Contacto', valor: logInline?.nombre_contacto },
            { label: 'Teléfono', valor: logInline?.telefono_contacto },
            { label: 'Hora Entrega', valor: logInline?.hora_entrega },
            { label: 'Hora Evento', valor: logInline?.hora_evento },
            { label: 'Dirección', valor: logInline?.direccion },
            { label: 'Cód. Postal', valor: logInline?.codigo_postal },
            { label: 'Notas', valor: logInline?.notas_logistica },
        ].filter(c => c.valor);

        if (campos.length) {
            secEntrega.style.display = '';
            const li = logInline;

            const tieneDireccion = li?.direccion;
            const tieneCP = li?.codigo_postal;

            contEntrega.innerHTML = `<table style="width:100%; border-collapse:collapse; padding: 0 14px; display:block;">
                <tr>
                    ${li?.nombre_contacto ? `<td style="padding:1px 8px 2px; vertical-align:top; width:22%;"><div class="detalle-field-label">Contacto</div><div class="detalle-field-value" style="word-break:break-word;">${li.nombre_contacto}</div></td>` : ''}
                    ${li?.telefono_contacto ? `<td style="padding:1px 8px 2px; vertical-align:top; width:14%;"><div class="detalle-field-label">Teléfono</div><div class="detalle-field-value">${li.telefono_contacto}</div></td>` : ''}
                    ${tieneDireccion ? `<td style="padding:1px 8px 2px; vertical-align:top;"><div class="detalle-field-label">Dirección</div><div class="detalle-field-value" style="word-break:break-word;">${tieneDireccion}</div></td>` : ''}
                    ${tieneCP ? `<td style="padding:1px 8px 2px; vertical-align:top; width:90px; white-space:nowrap;"><div class="detalle-field-label">Cód. Postal</div><div class="detalle-field-value">${tieneCP}</div></td>` : ''}
                    ${li?.hora_entrega ? `<td style="padding:1px 8px 2px; vertical-align:top; width:10%;"><div class="detalle-field-label">Hora Entrega</div><div class="detalle-field-value">${li.hora_entrega}</div></td>` : ''}
                    ${li?.hora_evento ? `<td style="padding:1px 8px 2px; vertical-align:top; width:10%;"><div class="detalle-field-label">Hora Evento</div><div class="detalle-field-value">${li.hora_evento}</div></td>` : ''}
                </tr>
            </table>`;
        } else {
            secEntrega.style.display = 'none';
        }
    }

    const secLog = el('detalleLogisticaSection');
    const contLog = el('detalleLogisticaContent');

    if (secLog && contLog) {
        const log = comanda.material_logistica ||
            (comanda.logistica?.bebidas ? comanda.logistica : null);

        const tieneItems = log && (
            (log.bebidas || []).some(i => i.checked !== false) ||
            (log.menaje || []).some(i => i.checked !== false) ||
            (log.extras || []).some(i => i.checked !== false)
        );

        if (tieneItems) {
            secLog.style.display = '';

            function renderColMaterial(icono, titulo, items) {
                if (!items?.length) return '';

                const filtrados = items.filter(it => it.checked !== false && (it.cantidad ?? 0) > 0);
                if (!filtrados.length) return '';

                let h = `<div class="dc-material-col">
                    <h5>${icono} ${titulo}</h5>
                    <div class="dc-material-list">`;

                filtrados.forEach(it => {
                    h += `<div class="dc-material-item">
                        <span class="dc-material-nombre">${it.nombre}</span>
                        <span class="dc-material-cantidad">${it.cantidad ?? 0}</span>
                        <span class="dc-material-unidad">${it.unidad || 'uds'}</span>
                    </div>`;

                    (it.subitems_selected || []).forEach(sub => {
                        h += `<div class="dc-material-item" style="padding-left:10px; opacity:0.85;">
                            <span class="dc-material-nombre" style="font-size:0.72rem; color:#64748b;">↳ ${sub.nombre}</span>
                            <span class="dc-material-cantidad" style="font-size:0.72rem;">${sub.cantidad ?? 0}</span>
                            <span class="dc-material-unidad" style="font-size:0.72rem;">${sub.unidad || 'uds'}</span>
                        </div>`;
                    });
                });

                h += `</div></div>`;
                return h;
            }

            contLog.innerHTML = `<div class="dc-material-grid">
                ${renderColMaterial('🥤', 'Bebidas', log.bebidas)}
                ${renderColMaterial('🍽️', 'Menaje', log.menaje)}
                ${renderColMaterial('✨', 'Extras', log.extras)}
            </div>`;
        } else {
            secLog.style.display = 'none';
        }
    }

    if (el('detalleEstado')) {
        el('detalleEstado').textContent = comanda.estado
            ? comanda.estado.charAt(0).toUpperCase() + comanda.estado.slice(1)
            : '—';
    }

    if (el('detalleVersion')) {
        el('detalleVersion').textContent = `v${comanda.version || '1'}`;
    }

    if (el('detalleFechaCreacion') && comanda.fecha_creacion) {
        el('detalleFechaCreacion').textContent = new Date(comanda.fecha_creacion)
            .toLocaleDateString('es-ES', {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            });
    }

    if (el('detalleFechaModificacion')) {
        el('detalleFechaModificacion').textContent = comanda.fecha_modificacion
            ? new Date(comanda.fecha_modificacion).toLocaleDateString('es-ES', {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            })
            : 'No modificada';
    }
}

function editarComanda() {
    const codigo = document.getElementById('detalleCodigo').textContent;
    window.comandaEditando = obtenerComandaDelHistorial(codigo);

    if (!window.comandaEditando) {
        alert('Comanda no encontrada');
        return;
    }

    document.getElementById('empresa').value = window.comandaEditando.empresa || '';
    document.getElementById('responsable').value = window.comandaEditando.responsable || '';
    document.getElementById('pax').value = window.comandaEditando.pax || '';
    document.getElementById('hora_salida').value = window.comandaEditando.hora_salida || '';
    document.getElementById('fecha_evento').value = window.comandaEditando.fecha_evento || '';

    const notasInput = document.getElementById('alergias_notas');

    if (notasInput && window.comandaEditando.alergias) {
        notasInput.value = window.comandaEditando.alergias.notas || '';
    }

    document.getElementById('detalleComanda').style.display = 'none';
    document.getElementById('comandaForm').style.display = 'block';
    document.getElementById('dashboard').style.display = 'none';

    const submitBtn = document.querySelector('#comandaCocinaForm button[type="submit"]');

    if (submitBtn) {
        submitBtn.textContent = '💾 Guardar Cambios';
    }

    console.log('Comanda cargada para edición:', window.comandaEditando.codigo);
}

function imprimirComanda() {
    window.print();
}

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

async function verDetalleComandaPorCodigo(codigo) {
    let comanda = null;

    if (window.supabaseClient && window.currentUser?.id) {
        try {
            const { data, error } = await window.supabaseClient
                .from('orders')
                .select('payload')
                .contains('payload', { codigo })
                .limit(1);

            if (!error && data && data.length > 0) {
                comanda = data[0].payload;
            }
        } catch (e) {
            // fallback a localStorage
        }
    }

    if (!comanda) {
        comanda = obtenerComandaDelHistorial(codigo);
    }

    if (!comanda) {
        console.warn('Comanda no encontrada:', codigo);
        if (typeof volverAlDashboard === 'function') volverAlDashboard();
        return;
    }

    const dashboard = document.getElementById('dashboard');
    const comandaForm = document.getElementById('comandaForm');
    const historialPage = document.getElementById('historialPage');
    const detalleEl = document.getElementById('detalleComanda');

    if (dashboard) dashboard.style.display = 'none';
    if (comandaForm) comandaForm.style.display = 'none';
    if (historialPage) historialPage.style.display = 'none';
    if (detalleEl) detalleEl.style.display = 'block';

    _renderDetalleComanda(comanda);
}