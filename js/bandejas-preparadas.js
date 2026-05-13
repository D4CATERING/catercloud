// =====================================================
// DO IT YOURSELF — Desayunos (Cat 5) & Foodbox (Cat 6)
// =====================================================

(function () {

  const $ = (id) => document.getElementById(id);

  // ── Estado ──────────────────────────────────────────
  window.BandejasState = window.BandejasState || {
    diy_dulces:        { items: [], selected: [] },
    diy_salados:       { items: [], selected: [] },
    diy_termos:        { items: [], selected: [] },
    diy_servicio:      { items: [], selected: [] },
    diy_fb_saladas:    { items: [], selected: [] },
    diy_fb_sandwiches: { items: [], selected: [] },
    diy_fb_postres:    { items: [], selected: [] },
  };

  // ── Carga desde Supabase ─────────────────────────────
  async function cargarDesdeSupabase(categoria) {
    if (!window.supabaseClient) throw new Error('Supabase no inicializado');

    const { data: opciones, error } = await window.supabaseClient
      .from('diy_bandejas_desayunos')
      .select('*')
      .eq('categoria', categoria)
      .eq('activo', true)
      .order('orden', { ascending: true });

    if (error) throw error;

    const ids = opciones.map(o => o.id);
    let variantes = [];
    if (ids.length) {
      const { data: vars, error: errV } = await window.supabaseClient
        .from('diy_bandejas_desayunos_variantes')
        .select('*')
        .in('opcion_id', ids)
        .eq('activo', true)
        .order('orden', { ascending: true });
      if (!errV) variantes = vars || [];
    }

    return opciones.map(o => ({
      ...o,
      variantes: variantes.filter(v => v.opcion_id === o.id)
    }));
  }

  // ── Fallback (Cat 5) ─────────────────────────────────
  function getFallbackDesayunos() {
    return [
      { id: 'f_t1', tipo: 'termo',    nombre: 'Termo de café', variantes: [] },
      { id: 'f_t2', tipo: 'termo',    nombre: 'Termo de chocolate caliente', variantes: [] },
      { id: 'f_t3', tipo: 'termo',    nombre: 'Termo de leche', variantes: [] },
      { id: 'f_t4', tipo: 'termo',    nombre: 'Termo de leche sin lactosa', variantes: [] },
      { id: 'f_t5', tipo: 'termo',    nombre: 'Termo de bebida vegetal', variantes: [] },
      { id: 'f_t6', tipo: 'termo',    nombre: 'Termo de agua para infusión', variantes: [
        { id: 'v1', nombre: 'Te english breakfast' },
        { id: 'v2', nombre: 'Te rojo' },
        { id: 'v3', nombre: 'Te verde' },
      ]},
      { id: 'f_s1', tipo: 'servicio', nombre: 'Servicio desechable', variantes: [
        { id: 'v4', nombre: 'Vaso' },{ id: 'v5', nombre: 'Removedor' },
        { id: 'v6', nombre: 'Azúcar blanca' },{ id: 'v7', nombre: 'Azúcar morena' },
        { id: 'v8', nombre: 'Sacarina' },
      ]},
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
      { id: 'f_e3', tipo: 'salado', nombre: 'Smoothie True Fruit (por unidad)', variantes: [] },
      { id: 'f_e4', tipo: 'salado', nombre: 'Café Starbucks (por unidad)', variantes: [] },
      { id: 'f_e5', tipo: 'salado', nombre: 'Zumo de naranja natural (1l.)', variantes: [] },
      { id: 'f_e6', tipo: 'salado', nombre: 'Agua pet 33 cl.', variantes: [] },
      { id: 'f_e7', tipo: 'salado', nombre: 'Agua envase ECO BRICK', variantes: [] },
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

  function renderGrupo(stKey, containerId) {
    const container = $(containerId);
    if (!container) return;
    const items = window.BandejasState[stKey].items;
    const selected = window.BandejasState[stKey].selected;

    container.innerHTML = '';
    container.className = 'diy-item-list';

    items.forEach(item => {
      const sel = selected.find(x => x.id === item.id);
      const qty = sel ? sel.cantidad : 0;
      const tieneVariantes = item.variantes?.length > 0;
      const precio = item.precio != null ? item.precio : null;

      const row = document.createElement('div');
      row.className = 'diy-item-row' + (qty > 0 ? ' diy-item-row--active' : '');
      row.innerHTML = `
        <div class="diy-item-info">
          <span class="diy-item-nombre">${item.nombre}</span>
          ${precio != null ? `<span class="diy-item-precio">${precio.toFixed(2).replace('.', ',')} € / bandeja</span>` : ''}
          ${tieneVariantes && sel?.variantes?.length ? `<span class="diy-item-variantes-sel">${sel.variantes.map(v => v.nombre).join(', ')}</span>` : ''}
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
        } else if (idx >= 0) {
          selected[idx].cantidad = c;
        } else {
          selected.push({ id: item.id, nombre: item.nombre, precio: item.precio || null, cantidad: c, variantes: [] });
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
              selected.push({ id: item.id, nombre: item.nombre, precio: item.precio || null, cantidad: 1, variantes: variantesSeleccionadas });
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
      row.querySelector('.diy-ctrl-input').onclick = (e) => e.stopPropagation();

      container.appendChild(row);
    });
  }

  // ── Sección HTML ─────────────────────────────────────
  function crearSeccion(id, titulo, grupos) {
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
        <div style="padding: 10px 14px 16px;">${gruposHtml}</div>
      </div>`);
  }

  // ── API pública: DIY Desayunos ───────────────────────
  window.cargarDIYDesayunos = async function () {
    crearSeccion('diyDesayunosSection', '🥐 Do It Yourself Desayunos', [
      { icono: '☕', titulo: 'Termos y Bebidas',  containerId: 'diyTermosContainer'   },
      { icono: '🍽️', titulo: 'Servicio',          containerId: 'diyServicioContainer' },
      { icono: '🍰', titulo: 'Dulces y Bollería', containerId: 'diyDulcesContainer'   },
      { icono: '🥪', titulo: 'Salados y Bebidas', containerId: 'diySaladosContainer'  },
    ]);

    // Loading
    ['diyTermosContainer','diyServicioContainer','diyDulcesContainer','diySaladosContainer']
      .forEach(id => { const el = $(id); if (el) el.innerHTML = '<span style="color:#94a3b8;font-size:.8rem">Cargando…</span>'; });

    let items;
    try {
      items = await cargarDesdeSupabase(5);
      console.log('✅ DIY Desayunos desde Supabase:', items.length, 'ítems');
    } catch (err) {
      console.warn('⚠️ Fallback DIY Desayunos:', err.message);
      items = getFallbackDesayunos();
    }

    const mapa = { termo: 'diy_termos', servicio: 'diy_servicio', dulce: 'diy_dulces', salado: 'diy_salados' };
    const contenedores = { termo: 'diyTermosContainer', servicio: 'diyServicioContainer', dulce: 'diyDulcesContainer', salado: 'diySaladosContainer' };

    Object.keys(mapa).forEach(tipo => {
      const stKey = mapa[tipo];
      window.BandejasState[stKey].items    = items.filter(i => i.tipo === tipo);
      window.BandejasState[stKey].selected = [];
      renderGrupo(stKey, contenedores[tipo]);
    });
  };

  // ── API pública: DIY Foodbox ─────────────────────────
  window.cargarDIYFoodbox = function () {
    crearSeccion('diyFoodboxSection', '🥗 Do It Yourself Foodbox', [
      { icono: '🥗', titulo: 'Saladas',    containerId: 'diyFbSaladasContainer'    },
      { icono: '🥪', titulo: 'Sándwiches', containerId: 'diyFbSandwichesContainer' },
      { icono: '🍰', titulo: 'Postres',    containerId: 'diyFbPostresContainer'    },
    ]);

    const data = {
      diy_fb_saladas:    [
        { id: 'fs1', nombre: 'Tabla Jamón Ibérico 500gr', variantes: [] },
        { id: 'fs2', nombre: 'Tabla Paletilla Ibérica 500gr', variantes: [] },
        { id: 'fs3', nombre: 'Tabla de Quesos 500gr', variantes: [] },
        { id: 'fs4', nombre: 'Croquetas Jamón/Pollo 24uds', variantes: [] },
        { id: 'fs5', nombre: 'Tortilla con Chistorra y/o Padrón', variantes: [] },
        { id: 'fs6', nombre: 'Quiche Lorraine 8 raciones', variantes: [] },
        { id: 'fs7', nombre: 'Mini Sandwich Variado 36uds', variantes: [] },
        { id: 'fs8', nombre: 'Mini Empanadilla Criolla 36uds', variantes: [] },
      ],
      diy_fb_sandwiches: [
        { id: 'fw1', nombre: 'Mini Burguer con Queso 24uds', variantes: [] },
        { id: 'fw2', nombre: 'Mini Bao de Costilla BBQ 24uds', variantes: [] },
        { id: 'fw3', nombre: 'Mini Taco Cochinita Pibil 24uds', variantes: [] },
        { id: 'fw4', nombre: 'Mini Quesadillas 24uds', variantes: [] },
      ],
      diy_fb_postres:    [
        { id: 'fp1', nombre: 'Mini bollería 30uds', variantes: [] },
        { id: 'fp2', nombre: 'Mini carrot cakes 30uds', variantes: [] },
        { id: 'fp3', nombre: 'Mini tarta Idiazabal 30uds', variantes: [] },
      ],
    };
    const contenedores = {
      diy_fb_saladas: 'diyFbSaladasContainer',
      diy_fb_sandwiches: 'diyFbSandwichesContainer',
      diy_fb_postres: 'diyFbPostresContainer',
    };

    Object.keys(data).forEach(stKey => {
      window.BandejasState[stKey].items    = data[stKey];
      window.BandejasState[stKey].selected = [];
      renderGrupo(stKey, contenedores[stKey]);
    });
  };

  window.cargarBandejasPreparadas = window.cargarDIYDesayunos;

  // ── Obtener selecciones ──────────────────────────────
  window.obtenerSeleccionesDIY = function (categoria) {
    if (categoria === 5) return {
      termos:   window.BandejasState.diy_termos.selected,
      servicio: window.BandejasState.diy_servicio.selected,
      dulces:   window.BandejasState.diy_dulces.selected,
      salados:  window.BandejasState.diy_salados.selected,
    };
    if (categoria === 6) return {
      saladas:    window.BandejasState.diy_fb_saladas.selected,
      sandwiches: window.BandejasState.diy_fb_sandwiches.selected,
      postres:    window.BandejasState.diy_fb_postres.selected,
    };
    return {};
  };

  console.log('✅ Módulo DIY listo');

})();
