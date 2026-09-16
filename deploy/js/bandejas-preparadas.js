// =====================================================
// DO IT YOURSELF — Desayunos (Cat 5) & Foodbox (Cat 6)
// =====================================================

(function () {

  const $ = (id) => document.getElementById(id);

  // ── Estado ──────────────────────────────────────────
  window.BandejasState = window.BandejasState || {
    diy_dulces:        { items: [], selected: [], page: 1, perPage: 14, query: '' },
    diy_salados:       { items: [], selected: [], page: 1, perPage: 14, query: '' },
    diy_termos:        { items: [], selected: [], page: 1, perPage: 14, query: '' },

    diy_fb_saladas:    { items: [], selected: [], page: 1, perPage: 14, query: '' },
    diy_fb_postres:    { items: [], selected: [], page: 1, perPage: 14, query: '' },
  };

  function normalizarClave(texto) {
    return String(texto || '')
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .trim();
  }

  function escapeHtml(value) {
    return String(value ?? '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function asegurarEstadoGrupo(stKey) {
    window.BandejasState[stKey] = window.BandejasState[stKey] || {};
    const st = window.BandejasState[stKey];
    st.items = Array.isArray(st.items) ? st.items : [];
    st.selected = Array.isArray(st.selected) ? st.selected : [];
    st.page = Math.max(1, Number(st.page || 1));
    st.perPage = 14;
    st.query = String(st.query || '');
    return st;
  }

  function textoBusquedaItemDIY(item) {
    return normalizarClave([
      item?.nombre,
      item?.name,
      item?.tipo,
      item?.categoria,
      ...(item?.variantes || []).map(v => v?.nombre || v?.name || '')
    ].filter(Boolean).join(' '));
  }

  function getItemsFiltradosDIY(stKey) {
    const st = asegurarEstadoGrupo(stKey);
    const query = normalizarClave(st.query);
    const items = st.items || [];
    if (!query) return items;
    return items.filter(item => textoBusquedaItemDIY(item).includes(query));
  }

  function ensureBuscadorDIY(stKey, containerId) {
    const st = asegurarEstadoGrupo(stKey);
    const container = $(containerId);
    if (!container) return;

    const enlazarBuscador = () => {
      const input = $(`${containerId}__search`);
      const clear = $(`${containerId}__clear`);
      if (!input || !clear) return;
      const getEstadoActual = () => asegurarEstadoGrupo(stKey);
      const syncClear = () => clear.classList.toggle('hidden', !input.value.trim());
      input.value = getEstadoActual().query || '';
      syncClear();
      input.oninput = () => {
        const estadoActual = getEstadoActual();
        estadoActual.query = input.value || '';
        estadoActual.page = 1;
        syncClear();
        renderGrupo(stKey, containerId);
      };
      clear.onclick = () => {
        const estadoActual = getEstadoActual();
        estadoActual.query = '';
        input.value = '';
        estadoActual.page = 1;
        syncClear();
        renderGrupo(stKey, containerId);
        input.focus();
      };
    };

    if ($(`${containerId}__search`)) {
      enlazarBuscador();
      return;
    }

    const wrapper = document.createElement('div');
    wrapper.className = 'referencias-search diy-search';
    wrapper.innerHTML = `
      <input id="${containerId}__search" type="text"
        placeholder="Buscar referencia..." value="${escapeHtml(st.query)}" autocomplete="off">
      <button type="button" id="${containerId}__clear" class="search-clear ${st.query ? '' : 'hidden'}" aria-label="Limpiar busqueda">
        <svg viewBox="0 0 24 24" width="16" height="16">
          <path d="M18 6L6 18M6 6l12 12" fill="none" stroke="currentColor"
            stroke-width="2" stroke-linecap="round"/>
        </svg>
      </button>`;

    container.parentNode.insertBefore(wrapper, container);
    enlazarBuscador();
  }

  function normalizarTipoDesayuno(item) {
    const valor = normalizarClave(
      item.tipo || item.item_type || item.grupo || item.item_group || item.seccion || item.category || item.categoria_nombre
    );
    const nombre = normalizarClave(item.nombre || item.name);

    if (['dulce', 'dulces', 'bolleria', 'bolleria y dulces'].includes(valor) || valor.includes('dulce') || valor.includes('bolleria')) {
      return 'dulce';
    }
    if (['salado', 'salados', 'sandwich', 'sandwiches'].includes(valor) || valor.includes('salado') || valor.includes('sandwich')) {
      return 'salado';
    }
    if (['termo', 'termos', 'bebida', 'bebidas'].includes(valor) || valor.includes('termo') || valor.includes('bebida')) {
      return 'termo';
    }

    if (nombre.includes('termo') || nombre.includes('cafe') || nombre.includes('zumo') || nombre.includes('agua') || nombre.includes('smoothie')) {
      return 'termo';
    }
    if (nombre.includes('bolleria') || nombre.includes('cookie') || nombre.includes('bizcocho') || nombre.includes('fruta') || nombre.includes('yogur') || nombre.includes('muffin') || nombre.includes('croissant')) {
      return 'dulce';
    }
    return 'salado';
  }

  function normalizarTipoFoodbox(item) {
    const valor = normalizarClave(item.tipo || item.item_type || item.grupo || item.item_group || item.seccion || item.category);
    const nombre = normalizarClave(item.nombre || item.name);
    if (valor.includes('postre') || nombre.includes('postre') || nombre.includes('brownie') || nombre.includes('cheesecake') || nombre.includes('tirami') || nombre.includes('fruta')) {
      return 'postre';
    }
    return 'salado';
  }

  function resumirTipos(items) {
    return items.reduce((acc, item) => {
      const tipo = item.tipo || '(sin tipo)';
      acc[tipo] = (acc[tipo] || 0) + 1;
      return acc;
    }, {});
  }

  // ── Carga desde Supabase ─────────────────────────────
  async function cargarDesdeSupabase(categoria) {
    if (!window.supabaseClient) throw new Error('Supabase no inicializado');

    let { data: opciones, error } = await window.supabaseClient
      .from('diy_bandejas_desayunos')
      .select('*')
      .eq('categoria', categoria)
      .eq('activo', true)
      .order('orden', { ascending: true });

    if (error) throw error;

    if (!opciones?.length) {
      const { data: opcionesActivas, error: errorActivas } = await window.supabaseClient
        .from('diy_bandejas_desayunos')
        .select('*')
        .eq('activo', true)
        .order('orden', { ascending: true });

      if (errorActivas) throw errorActivas;
      if (opcionesActivas?.length) {
        console.warn(`DIY Desayunos no encontro filas con categoria=${categoria}; usando todos los items activos de la tabla.`, {
          totalActivos: opcionesActivas.length,
          categoriasRecibidas: [...new Set(opcionesActivas.map(o => o.categoria ?? '(sin categoria)'))]
        });
        opciones = opcionesActivas;
      }
    }

    const ids = opciones.map(o => o.id);
    let variantes = [];
    if (ids.length) {
      const { data: vars, error: errV } = await window.supabaseClient
        .from('diy_bandejas_desayunos_variantes')
        .select('*')
        .in('opcion_id', ids)
        .eq('activo', true)
        .order('orden', { ascending: true });
      if (errV) {
        console.warn('No se pudieron cargar variantes DIY Desayunos desde Supabase:', errV);
      } else {
        variantes = vars || [];
      }
    }

    return opciones.map(o => ({
      ...o,
      nombre: o.nombre || o.name || '',
      tipo: normalizarTipoDesayuno(o),
      variantes: variantes.filter(v => String(v.opcion_id) === String(o.id))
    }));
  }

  window.verificarBandejasDesayunoSupabase = async function () {
    if (!window.supabaseClient) {
      return { ok: false, error: 'Supabase no inicializado' };
    }

    const resultado = {
      ok: true,
      opciones: [],
      opcionesActivasSinFiltro: [],
      variantes: [],
      miniSandwich: [],
      errorOpciones: null,
      errorOpcionesActivas: null,
      errorVariantes: null
    };

    const { data: opciones, error } = await window.supabaseClient
      .from('diy_bandejas_desayunos')
      .select('*')
      .eq('categoria', 5)
      .eq('activo', true)
      .order('orden', { ascending: true });

    resultado.opciones = opciones || [];
    resultado.errorOpciones = error || null;
    if (error) {
      resultado.ok = false;
      return resultado;
    }

    const { data: opcionesActivas, error: errorActivas } = await window.supabaseClient
      .from('diy_bandejas_desayunos')
      .select('*')
      .eq('activo', true)
      .order('orden', { ascending: true });

    resultado.opcionesActivasSinFiltro = opcionesActivas || [];
    resultado.errorOpcionesActivas = errorActivas || null;
    if (errorActivas) resultado.ok = false;

    const baseOpciones = resultado.opciones.length ? resultado.opciones : resultado.opcionesActivasSinFiltro;
    resultado.opciones = baseOpciones;

    const ids = baseOpciones.map(o => o.id);
    if (ids.length) {
      const { data: vars, error: errV } = await window.supabaseClient
        .from('diy_bandejas_desayunos_variantes')
        .select('*')
        .in('opcion_id', ids)
        .eq('activo', true)
        .order('orden', { ascending: true });

      resultado.variantes = vars || [];
      resultado.errorVariantes = errV || null;
      if (errV) resultado.ok = false;
    }

    resultado.resumen = {
      totalCategoria5: (opciones || []).length,
      totalActivosSinFiltro: (opcionesActivas || []).length,
      categoriasActivas: [...new Set((opcionesActivas || []).map(o => o.categoria ?? '(sin categoria)'))],
      tiposActivos: [...new Set((opcionesActivas || []).map(o => o.tipo ?? o.item_type ?? o.grupo ?? o.item_group ?? '(sin tipo)'))]
    };

    const opcionMini = baseOpciones.find(o => {
      const nombre = normalizarClave(o.nombre || o.name);
      return nombre.includes('mini') && nombre.includes('sandwich');
    });
    resultado.miniSandwich = opcionMini
      ? resultado.variantes.filter(v => String(v.opcion_id) === String(opcionMini.id))
      : [];

    console.table(resultado.miniSandwich);
    return resultado;
  };

  // ── Fallback (Cat 5) ─────────────────────────────────
  function getFallbackDesayunos() {
    return [
      { id: 'f_t1', tipo: 'termo', nombre: 'Termo de café', variantes: [] },
      { id: 'f_t2', tipo: 'termo', nombre: 'Termo de chocolate caliente', variantes: [] },
      { id: 'f_t3', tipo: 'termo', nombre: 'Termo de leche', variantes: [] },
      { id: 'f_t4', tipo: 'termo', nombre: 'Termo de leche sin lactosa', variantes: [] },
      { id: 'f_t5', tipo: 'termo', nombre: 'Termo de bebida vegetal', variantes: [] },
      { id: 'f_t6', tipo: 'termo', nombre: 'Termo de agua para infusión', variantes: [
        { id: 'v1', nombre: 'Te english breakfast' },
        { id: 'v2', nombre: 'Te rojo' },
        { id: 'v3', nombre: 'Te verde' },
      ]},
      { id: 'f_e3', tipo: 'termo', nombre: 'Smoothie True Fruit (por unidad)', variantes: [] },
      { id: 'f_e4', tipo: 'termo', nombre: 'Café Starbucks (por unidad)', variantes: [] },
      { id: 'f_e5', tipo: 'termo', nombre: 'Zumo de naranja natural (1l.)', variantes: [] },
      { id: 'f_e6', tipo: 'termo', nombre: 'Agua pet 33 cl.', variantes: [] },
      { id: 'f_e7', tipo: 'termo', nombre: 'Agua envase ECO BRICK', variantes: [] },

      { id: 'f_d1', tipo: 'dulce', nombre: 'Mini bollería (30 Uds.)', variantes: [
        { id: 'v9', nombre: 'Mini croissant' },{ id: 'v10', nombre: 'Mini cinnamon roll' },
        { id: 'v11', nombre: 'Mini trenza de chocolate' },{ id: 'v12', nombre: 'Mini envoltini' },
        { id: 'v13', nombre: 'Mini dots rellenos' },{ id: 'v14', nombre: 'Mini berlinas' },
      ]},
      { id: 'f_d2', tipo: 'dulce', nombre: 'Pastas de té (48 Uds.)', variantes: [] },
      { id: 'f_d3', tipo: 'dulce', nombre: 'Muffin (15 Uds.)', variantes: [] },
      { id: 'f_d4', tipo: 'dulce', nombre: 'Mini cookies (24 Uds.)', variantes: [] },
      { id: 'f_d5', tipo: 'dulce', nombre: 'Bizcocho (10 raciones)', variantes: [
        { id: 'v15', nombre: 'Chocolate' },{ id: 'v16', nombre: 'Limón' },
        { id: 'v17', nombre: 'Arándanos' },{ id: 'v18', nombre: 'Naranja' },{ id: 'v19', nombre: 'Amapola' },
      ]},
      { id: 'f_d6', tipo: 'dulce', nombre: 'Cookies (por unidad)', variantes: [] },
      { id: 'f_d7', tipo: 'dulce', nombre: 'Cookie vegana (por unidad)', variantes: [] },
      { id: 'f_d8', tipo: 'dulce', nombre: 'Cookie sin gluten/sin lactosa (c/u)', variantes: [] },
      { id: 'f_d9', tipo: 'dulce', nombre: 'Croissant sin gluten/sin lactosa (c/u)', variantes: [] },
      { id: 'f_d10', tipo: 'dulce', nombre: 'Bandeja de Brochetas de fruta (24 Uds.)', variantes: [] },
      { id: 'f_d11', tipo: 'dulce', nombre: 'Vaso de fruta natural preparada (c/u)', variantes: [] },
      { id: 'f_d12', tipo: 'dulce', nombre: 'Vaso de yogur con granola y miel (c/u)', variantes: [] },
      { id: 'f_e1', tipo: 'salado', nombre: 'Bandeja de mini sándwich (36 Uds.)', variantes: [
        { id: 'v20', nombre: 'Paleta ibérica con tomate' },{ id: 'v21', nombre: 'Tortilla española' },
        { id: 'v22', nombre: 'Ensaladilla rusa' },{ id: 'v23', nombre: 'Vegetal' },
        { id: 'v24', nombre: 'Pollo al curry' },{ id: 'v25', nombre: 'Pechuga de pavo con queso edam' },
        { id: 'v26', nombre: 'Atún, aceituna negra, lechuga y mahonesa' },
        { id: 'v27', nombre: 'Crema de aguacate con tomate' },
      ]},
      { id: 'f_e2', tipo: 'salado', nombre: 'Bandeja de pulguitas 20 Uds.', variantes: [
        { id: 'v28', nombre: 'Paleta ibérica con tomate' },{ id: 'v29', nombre: 'Tortilla española' },
        { id: 'v30', nombre: 'Ensaladilla rusa' },{ id: 'v31', nombre: 'Vegetal' },{ id: 'v32', nombre: 'Pollo al curry' },
      ]},
    ];
  }

  // ── Modal flotante de variantes ──────────────────────
  function mostrarModalVariantes(item, stKey, onConfirm) {
    // Eliminar modal previo si existe
    const prev = $('diyVariantesModal');
    if (prev) prev.remove();

    const sel = window.BandejasState[stKey].selected.find(x => x.id === item.id);
    const selVariantes = sel?.variantes || [];

    const varHtml = item.variantes.map(v => `
      <label class="diy-modal-variante">
        <input type="checkbox" value="${v.id}" data-nombre="${v.nombre}"
          ${selVariantes.includes(v.id) ? 'checked' : ''}>
        <span>${v.nombre}</span>
      </label>`).join('');

    const modal = document.createElement('div');
    modal.id = 'diyVariantesModal';
    modal.className = 'diy-modal-overlay';
    modal.innerHTML = `
      <div class="diy-modal">
        <div class="diy-modal-header">
          <span class="diy-modal-titulo">${item.nombre}</span>
          <button type="button" class="diy-modal-close" id="diyModalClose">×</button>
        </div>
        <p class="diy-modal-sub">Selecciona las variantes</p>
        <div class="diy-modal-variantes">${varHtml}</div>
        <div class="diy-modal-footer">
          <button type="button" class="diy-modal-btn-cancel" id="diyModalCancel">Cancelar</button>
          <button type="button" class="diy-modal-btn-ok" id="diyModalOk">Confirmar</button>
        </div>
      </div>`;

    document.body.appendChild(modal);

    const cerrar = () => modal.remove();

    $('diyModalClose').onclick  = cerrar;
    $('diyModalCancel').onclick = cerrar;
    modal.addEventListener('click', e => { if (e.target === modal) cerrar(); });

    $('diyModalOk').onclick = () => {
      const checked = [...modal.querySelectorAll('.diy-modal-variantes input:checked')]
        .map(cb => ({ id: cb.value, nombre: cb.dataset.nombre }));
      onConfirm(checked);
      cerrar();
    };
  }

  // ── Render de un grupo ───────────────────────────────
  function actualizarResumen() {
    if (typeof window.actualizarResumenLateral === 'function') window.actualizarResumenLateral();
  }

  function enfocarCantidadDIY(containerId, itemId) {
    setTimeout(() => {
      const container = $(containerId);
      const row = Array.from(container?.querySelectorAll('.diy-item-row') || [])
        .find(node => String(node.dataset.itemId) === String(itemId));
      const input = row?.querySelector('.diy-ctrl-input');
      if (input) {
        input.focus();
        input.select();
      }
    }, 0);
  }

  function renderGrupo(stKey, containerId) {
    const container = $(containerId);
    if (!container) return;
    const st = asegurarEstadoGrupo(stKey);
    const items = st.items;
    const selected = st.selected;
    const itemIds = new Set(items.map(item => String(item.id)));
    const itemsFueraCarta = selected
      .filter(item => item.fuera_carta && !itemIds.has(String(item.id)))
      .map(item => ({ ...item, variantes: item.variantes || [] }));
    const itemsFiltrados = getItemsFiltradosDIY(stKey);
    const fueraCartaFiltrados = itemsFueraCarta
      .filter(item => !normalizarClave(st.query) || textoBusquedaItemDIY(item).includes(normalizarClave(st.query)));
    const itemsRender = [...itemsFiltrados, ...fueraCartaFiltrados];
    const totalPages = Math.max(1, Math.ceil(itemsRender.length / st.perPage));
    if (st.page > totalPages) st.page = totalPages;
    if (st.page < 1) st.page = 1;
    const pageItems = itemsRender.slice((st.page - 1) * st.perPage, st.page * st.perPage);

    container.innerHTML = '';
    container.className = 'diy-item-list';
    ensureBuscadorDIY(stKey, containerId);

    if (!pageItems.length) {
      container.innerHTML = '<div class="diy-empty">No hay referencias para esta busqueda.</div>';
    }

    pageItems.forEach(item => {
      const sel = selected.find(x => x.id === item.id);
      const qty = sel ? sel.cantidad : 0;
      const tieneVariantes = item.variantes?.length > 0;
      const precio = item.precio != null ? item.precio : null;

      const row = document.createElement('div');
      row.className = 'diy-item-row'
        + (qty > 0 ? ' diy-item-row--active' : '')
        + (item.fuera_carta ? ' diy-item-row--fuera-carta' : '');
      row.dataset.itemId = item.id;
      row.innerHTML = `
        <div class="diy-item-info">
          <span class="diy-item-nombre">${escapeHtml(item.nombre)}${item.fuera_carta ? ' <small>Fuera de Carta</small>' : ''}</span>
          ${precio != null ? `<span class="diy-item-precio">${precio.toFixed(2).replace('.', ',')} € / bandeja</span>` : ''}
          ${tieneVariantes && sel?.variantes?.length ? `<span class="diy-item-variantes-sel">${sel.variantes.map(v => escapeHtml(v.nombre)).join(', ')}</span>` : ''}
        </div>
        <div class="diy-item-controls">
          <button type="button" class="diy-ctrl-btn diy-ctrl-minus" ${qty === 0 ? 'disabled' : ''}>−</button>
          <input type="number" class="diy-ctrl-input" min="0" value="${qty}" ${qty === 0 ? 'placeholder="0"' : ''}>
          <button type="button" class="diy-ctrl-btn diy-ctrl-plus">+</button>
        </div>`;

      // Función común para aplicar una cantidad
      const aplicarCantidad = (nuevaCantidad) => {
        const c = Math.max(0, parseInt(nuevaCantidad) || 0);
        const idx = selected.findIndex(x => x.id === item.id);
        if (c === 0) {
          if (idx >= 0) selected.splice(idx, 1);
          if (item.fuera_carta) {
            window.BandejasState[stKey].items = window.BandejasState[stKey].items
              .filter(actual => String(actual.id) !== String(item.id));
          }
        } else if (idx >= 0) {
          selected[idx].cantidad = c;
        } else {
          selected.push({
            id: item.id,
            nombre: item.nombre,
            precio: item.precio || null,
            cantidad: c,
            unidad: item.unidad || 'uds',
            fuera_carta: !!item.fuera_carta,
            tipo: item.tipo || null,
            variantes: []
          });
        }
        renderGrupo(stKey, containerId);
        actualizarResumen();
      };

      // Botón −
      row.querySelector('.diy-ctrl-minus').onclick = (e) => {
        e.stopPropagation();
        aplicarCantidad(qty - 1);
      };

      // Botón +
      row.querySelector('.diy-ctrl-plus').onclick = (e) => {
        e.stopPropagation();
        if (tieneVariantes && !sel) {
          mostrarModalVariantes(item, stKey, (variantesSeleccionadas) => {
            if (variantesSeleccionadas.length > 0) {
              selected.push({
                id: item.id,
                nombre: item.nombre,
                precio: item.precio || null,
                cantidad: 1,
                unidad: item.unidad || 'uds',
                fuera_carta: !!item.fuera_carta,
                tipo: item.tipo || null,
                variantes: variantesSeleccionadas
              });
              renderGrupo(stKey, containerId);
              actualizarResumen();
            }
          });
        } else {
          aplicarCantidad(qty + 1);
        }
      };

      // Input manual
      row.querySelector('.diy-ctrl-input').onchange = (e) => {
        e.stopPropagation();
        aplicarCantidad(e.target.value);
      };
      row.querySelector('.diy-ctrl-input').onclick = (e) => {
        e.stopPropagation();
        e.target.select();
      };
      row.querySelector('.diy-ctrl-input').onfocus = (e) => e.target.select();
      row.onclick = (e) => {
        if (e.target.closest('input, button, select, textarea')) return;
        if (qty <= 0) {
          if (tieneVariantes && !sel) {
            mostrarModalVariantes(item, stKey, (variantesSeleccionadas) => {
              if (variantesSeleccionadas.length > 0) {
                selected.push({
                  id: item.id,
                  nombre: item.nombre,
                  precio: item.precio || null,
                  cantidad: 1,
                  unidad: item.unidad || 'uds',
                  fuera_carta: !!item.fuera_carta,
                  tipo: item.tipo || null,
                  variantes: variantesSeleccionadas
                });
                renderGrupo(stKey, containerId);
                actualizarResumen();
                enfocarCantidadDIY(containerId, item.id);
              }
            });
          } else {
            aplicarCantidad(1);
            enfocarCantidadDIY(containerId, item.id);
          }
        } else {
          enfocarCantidadDIY(containerId, item.id);
        }
      };

      container.appendChild(row);
    });

    const pager = document.createElement('div');
    pager.className = 'pager-sutil diy-pager';
    pager.innerHTML = `
      <button type="button" class="pager-btn" data-dir="-1">‹</button>
      <span class="pager-text">${st.page} / ${totalPages} · ${itemsRender.length} refs</span>
      <button type="button" class="pager-btn" data-dir="1">›</button>`;
    const prev = pager.querySelector('[data-dir="-1"]');
    const next = pager.querySelector('[data-dir="1"]');
    prev.disabled = st.page <= 1;
    next.disabled = st.page >= totalPages;
    prev.onclick = () => { st.page--; renderGrupo(stKey, containerId); };
    next.onclick = () => { st.page++; renderGrupo(stKey, containerId); };
    container.appendChild(pager);
  }

  function getOpcionesFueraCarta(categoria) {
    if (Number(categoria) === 6) {
      return [
        { stKey: 'diy_fb_saladas', label: 'Salada', tipo: 'salado' },
        { stKey: 'diy_fb_postres', label: 'Postre', tipo: 'postre' },
      ];
    }
    return [
      { stKey: 'diy_salados', label: 'Salado', tipo: 'salado' },
      { stKey: 'diy_dulces', label: 'Dulce', tipo: 'dulce' },
      { stKey: 'diy_termos', label: 'Bebida / termo', tipo: 'termo' },
    ];
  }

  function renderFueraCartaBandejas(sectionId, categoria) {
    const opciones = getOpcionesFueraCarta(categoria);
    return `
      <div class="diy-fuera-carta" data-diy-fuera-carta="${escapeHtml(sectionId)}">
        <div class="diy-fuera-carta-title">
          <strong>Fuera de Carta</strong>
          <span>Añade referencias puntuales para esta comanda</span>
        </div>
        <div class="diy-fuera-carta-form">
          <input type="text" id="${sectionId}_fueraCartaNombre" class="dc-input" placeholder="Nombre de la referencia">
          <input type="number" id="${sectionId}_fueraCartaCantidad" class="dc-input" min="1" step="1" value="1" aria-label="Cantidad">
          <select id="${sectionId}_fueraCartaTipo" class="dc-input" aria-label="Tipo">
            ${opciones.map(opcion => `<option value="${escapeHtml(opcion.stKey)}">${escapeHtml(opcion.label)}</option>`).join('')}
          </select>
          <button type="button" class="btn-fuera-carta" onclick="agregarFueraCartaBandejas('${escapeHtml(sectionId)}', ${Number(categoria)})">Añadir</button>
        </div>
      </div>
    `;
  }

  window.agregarFueraCartaBandejas = function (sectionId, categoria) {
    const nombreInput = $(`${sectionId}_fueraCartaNombre`);
    const cantidadInput = $(`${sectionId}_fueraCartaCantidad`);
    const tipoSelect = $(`${sectionId}_fueraCartaTipo`);
    const nombre = (nombreInput?.value || '').trim();
    const cantidad = Math.max(1, parseInt(cantidadInput?.value || '1', 10) || 1);
    const stKey = tipoSelect?.value || getOpcionesFueraCarta(categoria)[0]?.stKey;
    const opcion = getOpcionesFueraCarta(categoria).find(item => item.stKey === stKey) || {};
    const state = window.BandejasState?.[stKey];
    if (!state) return;
    if (!nombre) {
      alert('Escribe el nombre de la referencia fuera de carta.');
      nombreInput?.focus();
      return;
    }

    const item = {
      id: `diy_fuera_carta_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
      nombre,
      cantidad,
      unidad: 'uds',
      fuera_carta: true,
      tipo: opcion.tipo || null,
      precio: null,
      variantes: []
    };

    state.selected.push(item);
    if (!state.items.some(actual => String(actual.id) === String(item.id))) {
      state.items.push({ ...item });
    }

    if (nombreInput) nombreInput.value = '';
    if (cantidadInput) cantidadInput.value = '1';
    window.renderDIYGrupos?.(categoria);
    actualizarResumen();
    nombreInput?.focus();
  };

  // ── Sección HTML ─────────────────────────────────────
  function crearSeccion(id, titulo, grupos, options = {}) {
    if ($(id)) $(id).remove();
    const ref = $('referenciasSection') || document.body;
    const gruposHtml = grupos.map(g => `
      <div class="diy-grupo">
        <h4 class="foodbox-titulo">${g.icono} ${g.titulo}</h4>
        <div id="${g.containerId}" class="diy-btn-grid"></div>
      </div>`).join('');

    ref.insertAdjacentHTML('afterend', `
      <div class="form-section dc-section" id="${id}">
        <div class="dc-section-header"><h3>${titulo}</h3></div>
        <div style="padding: 10px 14px 16px;">
          ${gruposHtml}
          ${renderFueraCartaBandejas(id, options.categoria || 5)}
        </div>
      </div>`);
  }

  // ── API pública: DIY Desayunos ───────────────────────
  window.cargarDIYDesayunos = async function () {
    crearSeccion('diyDesayunosSection', '🥐 Do It Yourself Desayunos', [
      { icono: '☕', titulo: 'Termos y Bebidas',  containerId: 'diyTermosContainer'   },
      { icono: '🍰', titulo: 'Dulces y Bollería', containerId: 'diyDulcesContainer'   },
      { icono: '🥪', titulo: 'Salados y Bebidas', containerId: 'diySaladosContainer'  },
    ], { categoria: 5 });

    // Loading
    ['diyTermosContainer','diyDulcesContainer','diySaladosContainer']
      .forEach(id => { const el = $(id); if (el) el.innerHTML = '<span style="color:#94a3b8;font-size:.8rem">Cargando…</span>'; });

    let items;
    try {
      items = await cargarDesdeSupabase(5);
      const tieneTiposDIY = items.some(i => ['termo', 'dulce', 'salado'].includes(i.tipo));
      if (!items.length || !tieneTiposDIY) {
        console.warn('DIY Desayunos no pudo distribuir items de Supabase, usando fallback local', {
          totalRecibido: items.length,
          tiposNormalizados: resumirTipos(items)
        });
        items = getFallbackDesayunos();
        console.log('DIY Desayunos desde fallback local:', items.length, 'ítems');
      } else {
        console.log('DIY Desayunos desde Supabase:', items.length, 'ítems', resumirTipos(items));
      }
    } catch (err) {
      console.warn('Fallback DIY Desayunos:', err.message);
      items = getFallbackDesayunos();
      console.log('DIY Desayunos desde fallback local:', items.length, 'ítems');
    }

    const mapa = { termo: 'diy_termos', dulce: 'diy_dulces', salado: 'diy_salados' };
    const contenedores = { termo: 'diyTermosContainer', dulce: 'diyDulcesContainer', salado: 'diySaladosContainer' };

    Object.keys(mapa).forEach(tipo => {
      const stKey = mapa[tipo];
      const state = asegurarEstadoGrupo(stKey);
      state.items = items.filter(i => i.tipo === tipo);
      state.selected = [];
      state.page = 1;
      state.query = '';
      const search = $(`${contenedores[tipo]}__search`);
      if (search) search.value = '';
      $(`${contenedores[tipo]}__clear`)?.classList.add('hidden');
      renderGrupo(stKey, contenedores[tipo]);
    });
  };

  // ── API pública: DIY Foodbox ─────────────────────────
  async function cargarDesdeFoodboxSupabase() {
    if (!window.supabaseClient) throw new Error('Supabase no inicializado');

    const { data: opciones, error } = await window.supabaseClient
      .from('diy_bandejas_foodbox')
      .select('*')
      .eq('activo', true)
      .order('orden', { ascending: true });

    if (error) throw error;

    const ids = opciones.map(o => o.id);
    let variantes = [];
    if (ids.length) {
      const { data: vars, error: errV } = await window.supabaseClient
        .from('diy_bandejas_foodbox_variantes')
        .select('*')
        .in('opcion_id', ids)
        .eq('activo', true)
        .order('orden', { ascending: true });
      if (errV) {
        console.warn('No se pudieron cargar variantes DIY Foodbox desde Supabase:', errV);
      } else {
        variantes = vars || [];
      }
    }

    return opciones.map(o => ({
      ...o,
      nombre: o.nombre || o.name || '',
      tipo: normalizarTipoFoodbox(o),
      variantes: variantes.filter(v => String(v.opcion_id) === String(o.id))
    }));
  }

  window.cargarDIYFoodbox = async function () {
    crearSeccion('diyFoodboxSection', '🥗 Do It Yourself Foodbox', [
      { icono: '🥗', titulo: 'Saladas',    containerId: 'diyFbSaladasContainer'    },
      { icono: '🍰', titulo: 'Postres',    containerId: 'diyFbPostresContainer'    },
    ], { categoria: 6 });

    let items = [];
    try {
      items = await cargarDesdeFoodboxSupabase();
      console.log('✅ DIY Foodbox desde Supabase:', items.length, 'ítems');
    } catch (e) {
      console.warn('⚠️ Supabase falló para DIY Foodbox, usando fallback:', e.message);
      const fallbackSaladas = [
        // Tablas y embutidos
        { id: 'fs1',  nombre: 'Tabla de embutido ibérico 500g con picos y pan airbag'},
        { id: 'fs2',  nombre: 'Tabla de paleta ibérica 500g con pan airbag'},
        { id: 'fs3',  nombre: 'Tabla de jamón ibérico 400g con pan airbag', variantes: [] },
        { id: 'fs4',  nombre: 'Tabla de quesos internacionales 500g'},
         
      
        // Croquetas y fritos
        { id: 'fs5',  nombre: 'Croquetas 24 uds', variantes: [
          { id: 'fs5v1', nombre: 'Jamón' }, { id: 'fs5v2', nombre: 'Boletus' }, { id: 'fs5v3', nombre: 'Pollo' },
        ]},
        { id: 'fs6',  nombre: 'Pollo al estilo Kentucky con salsa barbacoa 24 uds', variantes: [] },
        { id: 'fs7',  nombre: 'Empanadillas 36 uds', variantes: [
          { id: 'fs7v1', nombre: 'Criollas' }, { id: 'fs7v2', nombre: 'Espinacas y pasas' },
          { id: 'fs7v3', nombre: 'Calabaza y bacon' }, { id: 'fs7v4', nombre: 'Atún' },
        ]},
        // Tortillas
        { id: 'fs8',  nombre: 'Tortilla de patata con pan airbag', variantes: [
          { id: 'fs9',  nombre: 'Guarnición de chistorra'},
          { id: 'fs10', nombre: 'Guarnición de padrón'}, ]},
        { id: 'fs11', nombre: 'Tortilla rellena', variantes: [
          { id: 'fs11v1', nombre: 'Sobrasada y brie' },
          { id: 'fs11v2', nombre: 'Ensalada de langostino' },
          { id: 'fs11v3', nombre: 'Pimiento de piquillo y morcilla' },
        ]},
        // Quiches
        { id: 'fs12', nombre: 'Quiche Loraine de bacon y puerro 8 raciones', variantes: [] },
        { id: 'fs13', nombre: 'Quiche Loraine de tomate seco y verduras 8 raciones', variantes: [] },
        { id: 'fs14', nombre: 'Quiche de bacalao con cebolla caramelizada 8 raciones', variantes: [] },
        // Mini croissants
        { id: 'fs15', nombre: 'Mini croissant 24 uds', variantes: [
          { id: 'fs15v1', nombre: 'Ensaladilla vegetal' }, { id: 'fs15v2', nombre: 'Mixto' },
          { id: 'fs15v3', nombre: 'Salmón y queso crema' },
        ]},
        // Mini bagels
        { id: 'fs16', nombre: 'Mini bagel 24 uds', variantes: [
          { id: 'fs16v1', nombre: 'Mortadela con crema trufada' },
          { id: 'fs16v2', nombre: 'Pastrami, pepinillo y mostaza Roastbeef' },
          { id: 'fs16v3', nombre: 'Salmón y queso crema' },
          { id: 'fs16v4', nombre: 'Proteína vegetal' },
        ]},
        // Pulguitas
        { id: 'fs17', nombre: 'Pulguitas 20 uds', variantes: [
          { id: 'fs17v1', nombre: 'Tortilla de patata' }, { id: 'fs17v2', nombre: 'Verduras asadas' },
          { id: 'fs17v3', nombre: 'Pollo al curry' }, { id: 'fs17v4', nombre: 'Paleta con tomate' },
          { id: 'fs17v5', nombre: 'Lomo con pimientos' },
        ]},
        // Mini wraps
        { id: 'fs18', nombre: 'Mini wraps 25 uds', variantes: [
          { id: 'fs18v1', nombre: 'Mortadela con crema trufada' },
          { id: 'fs18v2', nombre: 'Salmón con aguacate' },
          { id: 'fs18v3', nombre: 'Pastrami, pepinillo y mostaza' },
        ]},
        // Mini sándwich
        { id: 'fs19', nombre: 'Mini sándwich 36 uds', variantes: [
          { id: 'fs19v1', nombre: 'Pechuga de pavo, aguacate y tomate' },
          { id: 'fs19v2', nombre: 'Pollo lechuga mayo curry' },
          { id: 'fs19v3', nombre: 'Atún, aceituna negra, lechuga y mahonesa' },
          { id: 'fs19v4', nombre: 'Ensaladilla vegetal' },
          { id: 'fs19v5', nombre: 'Tortilla' },
          { id: 'fs19v6', nombre: 'Pastrami, pepinillo y mayo siracha' },
          { id: 'fs19v7', nombre: 'Ricota, tomate seco, pesto y mortadela' },
          { id: 'fs19v8', nombre: 'Bacon y mayo mostaza' },
          { id: 'fs19v9', nombre: 'Gorgonzola, queso crema, nueces y miel' },
        ]},
        // Mini rollitos y otros
        { id: 'fs20', nombre: 'Mini rollitos de primavera con salsa sweet chili 30 uds', variantes: [] },
        { id: 'fs21', nombre: 'Cheese rings con salsa Barbacoa 24 uds', variantes: [] },
        { id: 'fs22', nombre: 'Gyozas vegetales con salsa de soja 24 uds', variantes: [] },
        { id: 'fs23', nombre: 'Focaccia de mortadela, pesto, tomate seco y ricotta 24 uds', variantes: [] },
        // Mini tartaletas
        { id: 'fs24', nombre: 'Mini tartaletas 30 uds — Salmón con queso crema', variantes: [] },
        { id: 'fs25', nombre: 'Mini tartaletas 30 uds — Nuestra ensaladilla rusa', variantes: [] },
        // Mini ensaladas
        { id: 'fs26', nombre: 'Mini ensaladas (c/u)', variantes: [
          { id: 'fs26v1', nombre: 'Mini poke teriyaki' },
          { id: 'fs26v2', nombre: 'Mini poke de salmón' },
          { id: 'fs26v3', nombre: 'Mini ensalada toscana' },
          { id: 'fs26v4', nombre: 'Mini ensalada de pasta-pesto' },
          { id: 'fs26v5', nombre: 'Mini ensalada L.A' },
          { id: 'fs26v6', nombre: 'Mini tabule de cuscús con garbanzo' },
          { id: 'fs26v7', nombre: 'Mini ensalada griega' },
          { id: 'fs26v8', nombre: 'Mini ensalada César' },
        ]},
      // Mini burgers, tacos y bao
        { id: 'fw1', nombre: 'Mini Burger con queso 25 uds', variantes: [] },
        { id: 'fw2', nombre: 'Mini quesadillas sincronizadas 24 uds', variantes: [] },
        { id: 'fw3', nombre: 'Taco al pastor 24 uds', variantes: [] },
        { id: 'fw4', nombre: 'Taco de tinga de pollo 24 uds', variantes: [] },
        { id: 'fw5', nombre: 'Bao de pulled pork 24 uds', variantes: [] },
      ];
      // fallback postres
      const fallbackPostres = [
        { id: 'fp1', nombre: 'Brocheta de fruta 30 uds', variantes: [] },
        { id: 'fp2', nombre: 'Postres 20 uds', variantes: [
          { id: 'fp2v1', nombre: 'Mini cheesecake' },
          { id: 'fp2v2', nombre: 'Mini brownie con crema inglesa' },
          { id: 'fp2v3', nombre: 'Mini arroz con leche' },
          { id: 'fp2v4', nombre: 'Mini natillas con galleta' },
          { id: 'fp2v5', nombre: 'Mini oreo sweet' },
          { id: 'fp2v6', nombre: 'Mini kitkat shot' },
          { id: 'fp2v7', nombre: 'Mini tiramisú' },
        ]},
      ];
      items = [...fallbackSaladas, ...fallbackPostres];
    }

    // Distribuir por tipo, normalizando datos de Supabase y fallback local.
    const itemsNormalizados = items.map(item => ({
      ...item,
      nombre: item.nombre || item.name || '',
      tipo: item.tipo ? normalizarTipoFoodbox(item) : item.tipo
    }));
    let saladas, postres;
    if (itemsNormalizados.length && itemsNormalizados.some(o => o.tipo === 'salado' || o.tipo === 'postre')) {
      saladas = itemsNormalizados.filter(o => o.tipo === 'salado');
      postres = itemsNormalizados.filter(o => o.tipo === 'postre');
    } else {
      saladas = itemsNormalizados.filter(o => !['fp1','fp2'].includes(o.id));
      postres = itemsNormalizados.filter(o =>  ['fp1','fp2'].includes(o.id));
    }

    const data = {
      diy_fb_saladas: saladas,
      diy_fb_postres: postres,
    };

    const contenedores = {
      diy_fb_saladas: 'diyFbSaladasContainer',
      diy_fb_postres: 'diyFbPostresContainer',
    };

    Object.keys(data).forEach(stKey => {
      const state = asegurarEstadoGrupo(stKey);
      state.items = data[stKey];
      state.selected = [];
      state.page = 1;
      state.query = '';
      const search = $(`${contenedores[stKey]}__search`);
      if (search) search.value = '';
      $(`${contenedores[stKey]}__clear`)?.classList.add('hidden');
      renderGrupo(stKey, contenedores[stKey]);
    });
  };

  window.cargarBandejasPreparadas = window.cargarDIYDesayunos;

  // ── Obtener selecciones ──────────────────────────────
  window.obtenerSeleccionesDIY = function (categoria) {
    if (categoria === 5) return {
      termos:  window.BandejasState.diy_termos.selected,
      dulces:  window.BandejasState.diy_dulces.selected,
      salados: window.BandejasState.diy_salados.selected,
    };
    if (categoria === 6) return {
      saladas: window.BandejasState.diy_fb_saladas.selected,
      postres: window.BandejasState.diy_fb_postres.selected,
    };
    return {};
  };

  // ── Re-renderizar todos los grupos activos de una categoría ──
  window.renderDIYGrupos = function (categoriaId) {
    if (categoriaId === 5) {
      renderGrupo('diy_termos',  'diyTermosContainer');
      renderGrupo('diy_dulces',  'diyDulcesContainer');
      renderGrupo('diy_salados', 'diySaladosContainer');
    } else if (categoriaId === 6) {
      renderGrupo('diy_fb_saladas', 'diyFbSaladasContainer');
      renderGrupo('diy_fb_postres', 'diyFbPostresContainer');
    }
  };

  console.log('✅ Módulo DIY listo');

})();
