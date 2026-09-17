
// =====================================================
// MENÚS ADICIONALES (Modal + gestión) - versión aislada
// Evita colisiones globales usando un estado en window.
// =====================================================

(function () {
  // ---------- Estado aislado ----------
  window.MenusAdicionalesState = window.MenusAdicionalesState || {
    indiceMenuEditando: -1, // -1 = nuevo, >=0 = editando
    indiceMenuSeleccionadoResumen: -1,
    menuSeleccionadoModal: null,
    menusAdicionales: [],
    referenciasTemporales: { saladas: [], postres: [] },
    multiplicadoresTemporales: { saladas: 1, postres: 1 },
    paxTemporal: 0,
  };

  // Alias opcionales por compatibilidad (si otras partes del código los usan)
  window.menusAdicionales = window.MenusAdicionalesState.menusAdicionales;

  // ---------- Helpers DOM seguros ----------
  const $ = (id) => document.getElementById(id);
  const show = (id) => { const el = $(id); if (el) el.style.display = 'block'; };
  const hide = (id) => { const el = $(id); if (el) el.style.display = 'none'; };
  const setText = (id, v) => { const el = $(id); if (el) el.textContent = String(v); };
  const cloneMenuData = (value) => {
    try { return JSON.parse(JSON.stringify(value || null)); }
    catch (error) { return value; }
  };

  window.esMenuServicioExtraNoSumaPax = function(menu) {
    return !!menu?.no_suma_pax ||
      (menu?.servicio_categoria === 'welcome' && Number(menu?.categoriaOriginalId || menu?.categoriaId || 0) === 3);
  };

  window.calcularPaxTotalComanda = function(menus) {
    const lista = Array.isArray(menus) ? menus : [];
    const menusQueSuman = lista.filter(menu => !window.esMenuServicioExtraNoSumaPax(menu));
    const base = menusQueSuman.length ? menusQueSuman : lista;
    return base.reduce((s, m) => s + (Number(m.pax) || 0), 0);
  };

  // ---------- Datos: menús por categoría (ajusta si lo tienes centralizado) ----------
  function getMenusModalPorCategoria(categoriaId) {
    // IMPORTANTE: Mantén ids/nombres consistentes con tu sistema
    if (categoriaId == 1) {
      return [
        { id: 1, nombre: 'HEALTHY', descripcion: 'Desayuno Healthy', items_salados_min: 0, items_salados_max: 0, items_postres_min: 0, items_postres_max: 0 },
        { id: 2, nombre: 'CLASSIC', descripcion: 'Desayuno Classic', items_salados_min: 0, items_salados_max: 0, items_postres_min: 0, items_postres_max: 0 },
        { id: 3, nombre: 'PREMIUM', descripcion: 'Desayuno Premium', items_salados_min: 0, items_salados_max: 0, items_postres_min: 0, items_postres_max: 0 },
        { id: 4, nombre: 'VEGGIE', descripcion: 'Desayuno Veggie', items_salados_min: 0, items_salados_max: 0, items_postres_min: 0, items_postres_max: 0 },
      ];
    }
    if (categoriaId == 2) {
      return [
        { id: 5, nombre: 'FOODBOX / COMIDA', descripcion: 'Menú Foodbox/Comida', items_salados_min: 6, items_salados_max: 8, items_postres_min: 0, items_postres_max: 0 },
      ];
    }
    if (categoriaId == 3) {
      return [
        { id: 6, nombre: 'SERVICIOS', descripcion: 'Servicios', items_salados_min: 6, items_salados_max: 8, items_postres_min: 2, items_postres_max: 4 },
      ];
    }
    if (categoriaId == 4) {
      return [
        { id: 15, nombre: 'FOODBOX LUNCH', descripcion: 'Ensalada o sándwich + postre + bebida', tipo: 'foodbox_lunch', items_salados_min: 0, items_salados_max: 0, items_postres_min: 0, items_postres_max: 0 },
      ];
    }
    if (categoriaId == 5) {
      return [
        { id: 16, nombre: 'DO IT YOURSELF DESAYUNOS', descripcion: 'Bandejas de desayuno para montar', items_salados_min: 0, items_salados_max: 0, items_postres_min: 0, items_postres_max: 0 },
      ];
    }
    if (categoriaId == 6) {
      return [
        { id: 17, nombre: 'DO IT YOURSELF FOODBOX', descripcion: 'Bandejas foodbox para montar', items_salados_min: 0, items_salados_max: 0, items_postres_min: 0, items_postres_max: 0 },
      ];
    }
    return [];
  }

  // ---------- Datos: referencias para cat 2/3 (mismo set que principal) ----------
  const REFERENCIAS_SALADAS = [
    { id: 1, nombre: 'Tabla de Embutidos Ibéricos con Picos', unidad: 'bandeja' },
    { id: 2, nombre: 'Tabla de Quesos con Uva y Frutos Secos', unidad: 'bandeja' },
    { id: 3, nombre: 'Croquetas de Jamón', unidad: 'uds' },
    { id: 4, nombre: 'Mini Croissant de Salmón Ahumado', unidad: 'uds' },
    { id: 5, nombre: 'Mini Burguer con Queso', unidad: 'uds' },
    { id: 6, nombre: 'Hummus con Pan de Pita', unidad: 'bandeja' },
    { id: 7, nombre: 'Brocheta Capresse con Pesto', unidad: 'uds' },
    { id: 8, nombre: 'Tortilla de Patata con Chistorra y Padrón', unidad: 'bandeja' },
  ];

  const REFERENCIAS_POSTRES = [
    { id: 101, nombre: 'Brocheta de Fruta Natural', unidad: 'uds' },
    { id: 102, nombre: 'Mousse de Chocolate', unidad: 'uds' },
    { id: 103, nombre: 'Macarons', unidad: 'uds' },
    { id: 104, nombre: 'Cremoso de Cheese Cake', unidad: 'uds' },
    { id: 105, nombre: 'Arroz con Leche', unidad: 'uds' },
  ];

  // ---------- UI: render menús en modal ----------
  function mostrarMenusModal(menus) {
    const container = $('modalMenusContainer');
    if (!container) return;

    if (!menus || menus.length === 0) {
      container.innerHTML = '<p style="color:#94a3b8;text-align:center;font-size:0.9rem;">No hay menús disponibles</p>';
      return;
    }

    let html = '';
    menus.forEach(menu => {
      html += `
        <div class="menu-option" onclick="seleccionarMenuAdicionalModal(${menu.id}, this)" data-menu='${JSON.stringify(menu)}'>
          <h4>${menu.nombre}</h4>
          <p>${menu.descripcion || 'Sin descripción'}</p>
          ${(menu.items_salados_min || 0) > 0 ? `
            <p style="font-size:0.75rem;color:#64748b;margin-top:3px;">
              📋 ${menu.items_salados_min}-${menu.items_salados_max} salados
              ${(menu.items_postres_min || 0) > 0 ? `, ${menu.items_postres_min}-${menu.items_postres_max} postres` : ''}
            </p>` : ''
          }
        </div>
      `;
    });

    container.innerHTML = html;
  }

  // ---------- Público: abrir/cerrar modal ----------
  window.mostrarModalMenus = function (options = {}) {
    const st = window.MenusAdicionalesState;
    const indicePreservado = options.preservarIndiceEdicion ? st.indiceMenuEditando : -1;

    show('modalMenus');
    if ($('modalCategoria')) $('modalCategoria').value = '';
    if ($('modalMenusContainer')) $('modalMenusContainer').innerHTML = '';

    hide('modalMultiplicadorSection');
    hide('modalReferenciasSection');
    hide('modalPaxSection'); // si existe en tu HTML

    st.menuSeleccionadoModal = null;
    st.indiceMenuEditando = indicePreservado;
    st.referenciasTemporales = { saladas: [], postres: [] };
    st.multiplicadoresTemporales = { saladas: 1, postres: 1 };
    st.paxTemporal = 0;

    if ($('modalPaxAdicional')) $('modalPaxAdicional').value = '';
    if ($('modalMultiplicadorSaladasAdicional')) $('modalMultiplicadorSaladasAdicional').value = '1';
    if ($('modalMultiplicadorPostresAdicional')) $('modalMultiplicadorPostresAdicional').value = '1';
    ['modalReferenciasSaladasGrid__search', 'modalReferenciasPostresGrid__search'].forEach(id => {
      const input = $(id);
      const clear = $(id.replace('__search', '__clear'));
      if (input) input.value = '';
      if (clear) clear.classList.add('hidden');
    });
  };

  window.cerrarModalMenus = function () {
    hide('modalMenus');
    const st = window.MenusAdicionalesState;
    st.menuSeleccionadoModal = null;
    st.indiceMenuEditando = -1;
  };

  // ---------- Público: cargar menús en modal al cambiar categoría ----------
  window.cargarMenusModal = function () {
    const cat = $('modalCategoria')?.value;
    const categoriaId = parseInt(cat);
    const st = window.MenusAdicionalesState;

    // reset UI
    if ($('modalMenusContainer')) $('modalMenusContainer').innerHTML = '';
    hide('modalMultiplicadorSection');
    hide('modalReferenciasSection');
    hide('modalPaxSection');

    st.menuSeleccionadoModal = null;
    st.referenciasTemporales = { saladas: [], postres: [] };
    st.multiplicadoresTemporales = { saladas: 1, postres: 1 };

    if (!categoriaId) return;

    const menus = getMenusModalPorCategoria(categoriaId);
    mostrarMenusModal(menus);
  };

  // ---------- Público: seleccionar menú en el modal ----------
  window.seleccionarMenuAdicionalModal = function (menuId, element) {
    const st = window.MenusAdicionalesState;

    document.querySelectorAll('#modalMenusContainer .menu-option').forEach(opt => opt.classList.remove('selected'));
    if (element) element.classList.add('selected');

    st.menuSeleccionadoModal = JSON.parse(element.dataset.menu);

    // Mostrar sección PAX si existe
    show('modalPaxSection');

    const categoriaId = parseInt($('modalCategoria')?.value);

    // Para cat 2/3: mostrar multiplicadores + referencias
    if ([2, 3].includes(categoriaId)) {
      show('modalMultiplicadorSection');
      show('modalReferenciasSection');

      setText('modalMinSaladas', st.menuSeleccionadoModal.items_salados_min || 0);
      setText('modalMaxSaladas', st.menuSeleccionadoModal.items_salados_max || 0);

      const hasPostres = (st.menuSeleccionadoModal.items_postres_min || 0) > 0;
      if (hasPostres) {
        show('modalPostresGroup');
        setText('modalMinPostres', st.menuSeleccionadoModal.items_postres_min || 0);
        setText('modalMaxPostres', st.menuSeleccionadoModal.items_postres_max || 0);
      } else {
        hide('modalPostresGroup');
      }

      // Cargar referencias para este menú adicional
      cargarReferenciasAdicionales();
    } else {
      hide('modalMultiplicadorSection');
      hide('modalReferenciasSection');
    }
  };

  // ---------- Referencias en modal ----------
  function normalizarTextoBusquedaModal(valor) {
    return String(valor || '')
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .trim();
  }

  function asegurarBuscadorReferenciasModal(containerId, tipo) {
    const container = $(containerId);
    if (!container || $(`${containerId}__search`)) return;

    const wrapper = document.createElement('div');
    wrapper.className = 'referencias-search';
    wrapper.innerHTML = `
      <input id="${containerId}__search" type="text" placeholder="Buscar..." autocomplete="off">
      <button type="button" id="${containerId}__clear" class="search-clear hidden">
        <svg viewBox="0 0 24 24" width="16" height="16">
          <path d="M18 6L6 18M6 6l12 12" fill="none" stroke="currentColor"
            stroke-width="2" stroke-linecap="round"/>
        </svg>
      </button>`;

    container.parentNode.insertBefore(wrapper, container);
    const input = $(`${containerId}__search`);
    const clear = $(`${containerId}__clear`);
    const syncClear = () => clear?.classList.toggle('hidden', !input.value.trim());

    input.addEventListener('input', () => {
      syncClear();
      cargarReferenciasAdicionales();
    });
    clear.addEventListener('click', () => {
      input.value = '';
      syncClear();
      cargarReferenciasAdicionales();
      input.focus();
    });
  }

  function renderReferenciasModal(referencias, containerId, tipo) {
    const container = $(containerId);
    if (!container) return;

    asegurarBuscadorReferenciasModal(containerId, tipo);
    container.innerHTML = '';
    const st = window.MenusAdicionalesState;
    const query = normalizarTextoBusquedaModal($(`${containerId}__search`)?.value || '');

    const pax = st.paxTemporal || parseInt($('modalPaxAdicional')?.value) || 0;
    const mult = st.multiplicadoresTemporales[tipo] || 1;
    const cantidadBase = Math.max(1, Math.ceil(pax * mult));

    const filtradas = query
      ? referencias.filter(ref => normalizarTextoBusquedaModal(ref.nombre).includes(query))
      : referencias;

    filtradas.forEach(ref => {
      const div = document.createElement('div');
      div.className = 'referencia-option';
      div.dataset.id = String(ref.id);
      div.dataset.tipo = tipo;
      div.dataset.nombre = ref.nombre;

      div.innerHTML = `
        <span style="flex:1;">${ref.nombre}</span>
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

      div.onclick = (e) => {
        if (!e.target.classList.contains('cantidad-input') && !e.target.classList.contains('unidad-select')) {
          seleccionarReferenciaAdicional(ref.id, ref.nombre, tipo, div);
        }
      };

      container.appendChild(div);
    });

    if (!filtradas.length) {
      container.innerHTML = '<p style="grid-column:1/-1;color:#64748b;font-size:0.9rem;">No hay referencias que coincidan con la búsqueda.</p>';
    }
  }

  function cargarReferenciasAdicionales() {
    renderReferenciasModal(REFERENCIAS_SALADAS, 'modalReferenciasSaladasGrid', 'saladas');
    renderReferenciasModal(REFERENCIAS_POSTRES, 'modalReferenciasPostresGrid', 'postres');
  }

  // ---------- Público: selección de referencias en modal ----------
  window.seleccionarReferenciaAdicional = function (refId, refNombre, tipo, element) {
    const st = window.MenusAdicionalesState;
    if (!st.menuSeleccionadoModal) return;

    const max = tipo === 'saladas' ? (st.menuSeleccionadoModal.items_salados_max || 0) : (st.menuSeleccionadoModal.items_postres_max || 0);
    const seleccionadas = st.referenciasTemporales[tipo];
    const index = seleccionadas.findIndex(r => String(r.id) === String(refId));

    if (index > -1) {
      seleccionadas.splice(index, 1);
      if (element) element.classList.remove('selected');
      return;
    }

    if (max > 0 && seleccionadas.length >= max) {
      alert(`Solo puedes seleccionar hasta ${max} referencias ${tipo}`);
      return;
    }

    const cantidadInput = element?.querySelector('.cantidad-input');
    const unidadSelect = element?.querySelector('.unidad-select');

    seleccionadas.push({
      id: String(refId),
      nombre: refNombre,
      cantidad: parseInt(cantidadInput?.value) || 1,
      unidad: unidadSelect?.value || 'uds',
    });

    if (element) element.classList.add('selected');
  };

  window.actualizarCantidadReferenciaAdicional = function (refId, tipo, cantidad) {
    const st = window.MenusAdicionalesState;
    const ref = st.referenciasTemporales[tipo].find(r => String(r.id) === String(refId));
    if (ref) ref.cantidad = parseInt(cantidad) || 1;
  };

  window.actualizarUnidadReferenciaAdicional = function (refId, tipo, unidad) {
    const st = window.MenusAdicionalesState;
    const ref = st.referenciasTemporales[tipo].find(r => String(r.id) === String(refId));
    if (ref) ref.unidad = unidad || 'uds';
  };

  // ---------- Público: actualizar multiplicadores en modal ----------
  window.actualizarMultiplicadorAdicional = function (tipo, valor) {
    const st = window.MenusAdicionalesState;
    const v = parseFloat(valor);
    st.multiplicadoresTemporales[tipo] = isNaN(v) || v <= 0 ? 1 : v;

    // Recalcular cantidades mostradas en inputs (no solo seleccionadas)
    const pax = parseInt($('modalPaxAdicional')?.value) || 0;
    st.paxTemporal = pax;

    const cantidad = Math.max(1, Math.ceil(pax * st.multiplicadoresTemporales[tipo]));
    const gridId = tipo === 'saladas' ? 'modalReferenciasSaladasGrid' : 'modalReferenciasPostresGrid';

    document.querySelectorAll(`#${gridId} .cantidad-input`).forEach(inp => { inp.value = cantidad; });

    // Actualizar también las ya seleccionadas
    st.referenciasTemporales[tipo].forEach(r => { r.cantidad = cantidad; });
  };

  // ---------- Público: confirmar menú adicional ----------
  window.confirmarMenuAdicional = function () {
    const st = window.MenusAdicionalesState;
    const categoriaId = parseInt($('modalCategoria')?.value);

    if (!categoriaId || !st.menuSeleccionadoModal) {
      alert('Selecciona categoría y menú.');
      return;
    }

    const pax = parseInt($('modalPaxAdicional')?.value) || 0;
    if (pax <= 0) {
      alert('Introduce PAX válido.');
      return;
    }
    st.paxTemporal = pax;

    const menu = st.menuSeleccionadoModal;
    const item = {
      id: menu.id,
      nombre: menu.nombre,
      descripcion: menu.descripcion || '',
      categoriaId,
      categoria: categoriaId === 1 ? 'Desayunos' : categoriaId === 2 ? 'Foodbox/Comida' : categoriaId === 3 ? 'Servicios' : categoriaId === 4 ? 'Foodbox Lunch' : 'Otros',
      pax_adicional: pax,
    };

    // Para cat 2/3: guardar refs + multiplicadores del modal
    if ([2, 3].includes(categoriaId)) {
      item.multiplicadores = {
        saladas: st.multiplicadoresTemporales.saladas || 1,
        postres: st.multiplicadoresTemporales.postres || 1,
      };
      item.referencias = {
        saladas: [...st.referenciasTemporales.saladas],
        postres: [...st.referenciasTemporales.postres],
      };
    }

    if (st.indiceMenuEditando >= 0 && st.indiceMenuEditando < st.menusAdicionales.length) {
      st.menusAdicionales[st.indiceMenuEditando] = item;
    } else {
      st.menusAdicionales.push(item);
    }

    // Refrescar lista
    actualizarListaMenusAdicionalesCompleta();

    // Cerrar modal
    window.cerrarModalMenus();
  };

  // ---------- Público: actualizar lista UI ----------
  window.actualizarListaMenusAdicionalesCompleta = function () {
    const st = window.MenusAdicionalesState;
    const container = $('menusAdicionalesList');
    if (!container) return;

    if (!st.menusAdicionales || st.menusAdicionales.length === 0) {
      container.innerHTML = '<p style="color:#94a3b8;font-size:0.9rem;">No hay menús adicionales</p>';
      return;
    }

    let html = '';
    st.menusAdicionales.forEach((menu, index) => {
      let refsHtml = '';

      if (menu.referencias && (menu.referencias.saladas?.length || menu.referencias.postres?.length)) {
        refsHtml += '<div style="margin-top:6px;font-size:0.85rem;">';
        if (menu.referencias.saladas?.length) {
          refsHtml += '<div><strong>Saladas:</strong></div>';
          menu.referencias.saladas.forEach(r => { refsHtml += `<div>• ${r.nombre} - ${r.cantidad} ${r.unidad}</div>`; });
        }
        if (menu.referencias.postres?.length) {
          refsHtml += '<div style="margin-top:6px;"><strong>Postres:</strong></div>';
          menu.referencias.postres.forEach(r => { refsHtml += `<div>• ${r.nombre} - ${r.cantidad} ${r.unidad}</div>`; });
        }
        refsHtml += '</div>';
      }

      html += `
        <div class="menu-adicional-item">
          <div class="menu-adicional-info">
            <h4>${menu.nombre}</h4>
            <p>${menu.categoria} - ${menu.pax_adicional} PAX</p>
            ${menu.multiplicadores ? `
              <p style="font-size:0.85rem;color:#64748b;">
                Multiplicadores: Saladas ×${menu.multiplicadores.saladas}${menu.multiplicadores.postres ? ` | Postres ×${menu.multiplicadores.postres}` : ''}
              </p>` : ''
            }
            <p style="font-size:0.8rem;color:#64748b;">${menu.descripcion || ''}</p>
            ${refsHtml}
          </div>

          <div class="menu-adicional-controls">
            <input type="number" class="menu-pax-input" value="${menu.pax_adicional}" min="1"
                   onchange="actualizarPaxMenuAdicional(${index}, this.value)">
            <button type="button" class="btn-editar"
                    onclick="editarMenuAdicional(${index})"
                    style="background:#3b82f6;color:white;border:none;border-radius:4px;padding:6px 12px;cursor:pointer;">✏️</button>
            <button type="button" class="btn-remove-menu" onclick="eliminarMenuAdicional(${index})">✕</button>
          </div>
        </div>
      `;
    });

    container.innerHTML = html;
  };

  window.eliminarMenuAdicional = function (index) {
    const st = window.MenusAdicionalesState;
    if (!st.menusAdicionales[index]) return;

    if (confirm('¿Estás seguro de que deseas eliminar este menú adicional?')) {
      st.menusAdicionales.splice(index, 1);
      actualizarListaMenusAdicionalesCompleta();
    }
  };

  window.editarMenuAdicional = function (index) {
    const st = window.MenusAdicionalesState;
    const item = st.menusAdicionales[index];
    if (!item) return;

    // Abrir modal y precargar
    st.indiceMenuEditando = index;
    window.mostrarModalMenus({ preservarIndiceEdicion: true });

    if ($('modalCategoria')) $('modalCategoria').value = String(item.categoriaId);
    window.cargarMenusModal();

    // Esperar a que se rendericen menús y seleccionar el correcto
    setTimeout(() => {
      // seleccionar elemento menu
      const nodes = document.querySelectorAll('#modalMenusContainer .menu-option');
      nodes.forEach(n => {
        try {
          const m = JSON.parse(n.dataset.menu);
          if (String(m.id) === String(item.id)) {
            window.seleccionarMenuAdicionalModal(m.id, n);
          }
        } catch {}
      });

      if ($('modalPaxAdicional')) $('modalPaxAdicional').value = String(item.pax_adicional || 0);

      if ([2, 3].includes(item.categoriaId)) {
        // multiplicadores
        const ms = item.multiplicadores?.saladas || 1;
        const mp = item.multiplicadores?.postres || 1;
        if ($('modalMultiplicadorSaladasAdicional')) $('modalMultiplicadorSaladasAdicional').value = String(ms);
        if ($('modalMultiplicadorPostresAdicional')) $('modalMultiplicadorPostresAdicional').value = String(mp);

        st.multiplicadoresTemporales = { saladas: ms, postres: mp };
        st.paxTemporal = item.pax_adicional || 0;

        // refs
        st.referenciasTemporales = {
          saladas: item.referencias?.saladas ? [...item.referencias.saladas] : [],
          postres: item.referencias?.postres ? [...item.referencias.postres] : [],
        };

        // marcar seleccionadas en UI
        ['saladas', 'postres'].forEach(tipo => {
          const gridId = tipo === 'saladas' ? 'modalReferenciasSaladasGrid' : 'modalReferenciasPostresGrid';
          const sel = st.referenciasTemporales[tipo].map(r => String(r.id));
          document.querySelectorAll(`#${gridId} .referencia-option`).forEach(div => {
            const id = div.dataset.id;
            if (sel.includes(String(id))) div.classList.add('selected');
          });
        });
      }
    }, 80);
  };

  window.actualizarPaxMenuAdicional = function (index, valor) {
    const st = window.MenusAdicionalesState;
    const item = st.menusAdicionales[index];
    if (!item) return;

    const nuevoPax = parseInt(valor) || 1;
    item.pax_adicional = nuevoPax;

    if (item.multiplicadores && item.referencias) {
      const ms = item.multiplicadores.saladas || 1;
      const mp = item.multiplicadores.postres || 1;
      item.referencias.saladas?.forEach(r => { r.cantidad = Math.max(1, Math.ceil(nuevoPax * ms)); });
      item.referencias.postres?.forEach(r => { r.cantidad = Math.max(1, Math.ceil(nuevoPax * mp)); });
    }

    actualizarListaMenusAdicionalesCompleta();
  };

  // ─────────────────────────────────────────────────────────────
  // Capturar snapshot del material del DOM en el momento actual
  // ─────────────────────────────────────────────────────────────
  function capturarMaterialDOM() {
    function leerTipo(tipo) {
      const cont = document.getElementById('materialLogisticaInline_' + tipo);
      if (!cont) return [];
      const items = [];
      cont.querySelectorAll('label.dc-material-item').forEach(label => {
        const chk = label.querySelector('input[type="checkbox"]');
        if (!chk?.checked) return;
        const nombre = (label.querySelector('.dc-material-nombre')?.firstChild?.textContent
                     || label.querySelector('.dc-material-nombre')?.textContent || '').trim();
        if (!nombre) return;
        const cantEl = label.querySelector('input[type="number"]');
        const cant   = cantEl ? Number(cantEl.value) : 0;
        if (tipo !== 'menaje' && cant <= 0) return;
        const unidad = (label.querySelector('.dc-material-unidad')?.textContent || 'uds').trim();
        const subitems = [];
        label.closest('[data-extra-wrap]')?.querySelectorAll('.dc-material-subitem').forEach(sub => {
          const sChk = sub.querySelector('input[type="checkbox"]');
          if (!sChk?.checked) return;
          const sNom = sub.querySelector('.dc-material-nombre')?.textContent?.trim() || '';
          const sCnt = Number(sub.querySelector('input[type="number"]')?.value ?? 0);
          const sUnd = sub.querySelector('.dc-material-unidad')?.textContent?.trim() || 'uds';
          if (sNom) subitems.push({ nombre: sNom, cantidad: sCnt, unidad: sUnd });
        });
        items.push({ nombre, cantidad: cant, unidad, checked: true, subitems_selected: subitems });
      });
      return items;
    }
    return {
      bebidas: leerTipo('bebidas'),
      menaje:  leerTipo('menaje'),
      extras:  leerTipo('extras'),
    };
  }

  // ─────────────────────────────────────────────────────────────
  // Sumar dos objetos de material (acumular entre menús)
  // ─────────────────────────────────────────────────────────────
  function sumarMaterial(base, nuevo) {
    const result = {
      bebidas: [...(base.bebidas || [])],
      menaje:  [...(base.menaje  || [])],
      extras:  [...(base.extras  || [])],
    };
    ['bebidas', 'menaje', 'extras'].forEach(tipo => {
      (nuevo[tipo] || []).forEach(item => {
        const key = claveMaterialAcumulado(item, tipo);
        const exist = result[tipo].find(i => claveMaterialAcumulado(i, tipo) === key);
        if (exist) {
          exist.cantidad = (exist.cantidad || 0) + (item.cantidad || 0);
        } else {
          result[tipo].push(normalizarItemMaterial(item, tipo));
        }
      });
    });
    return result;
  }

  function limpiarTextoMaterial(value) {
    return String(value || '')
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .replace(/\s+/g, ' ')
      .trim();
  }

  function claveMaterialAcumulado(item, tipo) {
    const nombre = limpiarTextoMaterial(item?.nombre);
    const unidad = limpiarTextoMaterial(item?.unidad || item?.unidad_comanda || item?.unidad_inventario || '');

    if (tipo === 'bebidas' && nombre.includes('zumo') && (nombre.includes('naranja') || nombre === 'zumo natural')) {
      return 'bebidas:zumo-naranja-natural';
    }

    return `${tipo}:${nombre}:${unidad}`;
  }

  function normalizarItemMaterial(item, tipo) {
    const copia = { ...item };
    const esManual = !!copia._manual_otro || copia.source_table === 'manual' || copia.subcategoria === 'otros';
    if (esManual) {
      copia.source_table = 'manual';
      copia._manual_otro = true;
      copia.subcategoria = copia.subcategoria || 'otros';
      copia.tipo = copia.tipo || tipo;
      copia.item_id = copia.item_id || copia.id;
    }
    if (claveMaterialAcumulado(copia, tipo) === 'bebidas:zumo-naranja-natural') {
      copia.nombre = 'Zumo de naranja';
      copia.unidad = copia.unidad_comanda || copia.unidad || 'Lt';
      copia.unidad_comanda = copia.unidad_comanda || copia.unidad;
    } else if (copia.unidad_comanda) {
      copia.unidad = copia.unidad_comanda;
    }
    return copia;
  }

  window.normalizarMaterialLogistica = function(material) {
    const resultado = { bebidas: [], menaje: [], extras: [] };

    if (typeof material === 'string') {
      try {
        material = JSON.parse(material);
      } catch (_) {
        material = {};
      }
    }

    if (material?.material_logistica) material = material.material_logistica;
    if (material?.materialLogistica) material = material.materialLogistica;

    ['bebidas', 'menaje', 'extras'].forEach(tipo => {
      (material?.[tipo] || []).forEach(item => {
        const itemNormalizado = normalizarItemMaterial(item, tipo);
        const key = claveMaterialAcumulado(itemNormalizado, tipo);
        const existe = resultado[tipo].find(i => claveMaterialAcumulado(i, tipo) === key);

        if (existe) {
          existe.cantidad = (existe.cantidad || 0) + (itemNormalizado.cantidad || 0);
          existe.checked = existe.checked !== false || itemNormalizado.checked !== false || Number(existe.cantidad || 0) > 0;
          existe.subitems_selected = [
            ...(existe.subitems_selected || []),
            ...(itemNormalizado.subitems_selected || []),
          ];
        } else {
          resultado[tipo].push(itemNormalizado);
        }
      });
    });

    return resultado;
  };

  function materialTieneItems(material) {
    const normalizado = window.normalizarMaterialLogistica(material || {});
    return ['bebidas', 'menaje', 'extras'].some(tipo =>
      (normalizado[tipo] || []).some(item =>
        item?.checked !== false &&
        (Number(item?.cantidad || 0) > 0 || (item?.subitems_selected || []).length > 0)
      )
    );
  }

  function inferirCategoriaMenuResumen(menu) {
    const categoriaDirecta = Number(menu?.categoriaId || menu?._cat || 0);
    if (categoriaDirecta) return categoriaDirecta;

    const bandejas = menu?.bandejas || null;
    if (bandejas?.saladas || bandejas?.postres) return 6;

    const categoriaTexto = String(menu?.categoria || '').toLowerCase();
    if (categoriaTexto.includes('servicio')) return 3;
    if (categoriaTexto.includes('desayuno')) return 1;
    if (categoriaTexto.includes('lunch')) return 4;
    if (categoriaTexto.includes('foodbox') && (categoriaTexto.includes('diy') || categoriaTexto.includes('yourself') || categoriaTexto.includes('bandeja'))) return 6;
    if (categoriaTexto.includes('bandeja') || categoriaTexto.includes('diy')) return 5;
    if (categoriaTexto.includes('foodbox') || categoriaTexto.includes('comida')) return 2;

    if (menu?.referencias_desayuno) return 1;
    if (menu?.foodbox_lunch) return 4;
    if (menu?.referencias) return 2;
    if (bandejas) return 5;
    return 0;
  }

  function materialGuardadoCoincide(guardado, item, tipo) {
    const nombreGuardado = limpiarTextoMaterial(guardado?.nombre);
    const nombreItem = limpiarTextoMaterial(item?.nombre);
    const unidadGuardado = limpiarTextoMaterial(guardado?.unidad || guardado?.unidad_comanda || guardado?.unidad_inventario || '');
    const unidadItem = limpiarTextoMaterial(item?.unidad || item?.unidad_comanda || item?.unidad_inventario || '');

    if (nombreGuardado && nombreItem && nombreGuardado === nombreItem) {
      return !unidadGuardado || !unidadItem || unidadGuardado === unidadItem || ['ud', 'uds'].includes(unidadGuardado) || ['ud', 'uds'].includes(unidadItem);
    }

    const clavesGuardado = [
      guardado?.id,
      guardado?.item_id,
      guardado?.nombre,
      claveMaterialAcumulado(guardado, tipo)
    ].map(limpiarTextoMaterial).filter(Boolean);

    const clavesItem = [
      item?.id,
      item?.item_id,
      item?.nombre,
      claveMaterialAcumulado(item, tipo)
    ].map(limpiarTextoMaterial).filter(Boolean);

    return clavesGuardado.some(clave => clavesItem.includes(clave));
  }

  function esKitCafeDesechableEdicion(item) {
    const nombre = limpiarTextoMaterial(item?.nombre);
    return nombre.includes('kit') && nombre.includes('desechable') && nombre.includes('cafe');
  }

  function esKitCafeLozaEdicion(item) {
    const nombre = limpiarTextoMaterial(item?.nombre);
    return nombre.includes('kit') && nombre.includes('cafe') && (
      nombre.includes('loza') ||
      nombre.includes('vajilla')
    );
  }

  function esVasoDesechableZumoEdicion(item) {
    const nombre = limpiarTextoMaterial(item?.nombre);
    return nombre.includes('vaso') && nombre.includes('desechable') && nombre.includes('zumo');
  }

  function materialCompatibleConTipoMenajeEdicion(item, tipoMenaje = '') {
    const esLoza = tipoMenaje === 'loza';
    if (esLoza) {
      if (item?.solo_desechable || esKitCafeDesechableEdicion(item) || esVasoDesechableZumoEdicion(item)) return false;
      return true;
    }
    if (item?.solo_loza || esKitCafeLozaEdicion(item)) return false;
    return true;
  }

  function deduplicarMaterialMenuEdicion(material = {}) {
    const resultado = { bebidas: [], menaje: [], extras: [] };
    ['bebidas', 'menaje', 'extras'].forEach(tipo => {
      const porClave = new Map();
      (material?.[tipo] || []).forEach(item => {
        const normalizado = normalizarItemMaterial(item, tipo);
        const key = claveMaterialAcumulado(normalizado, tipo);
        if (!key) return;
        const existente = porClave.get(key);
        if (!existente) {
          porClave.set(key, normalizado);
          return;
        }
        const cantidadExistente = Number(existente.cantidad || 0);
        const cantidadNueva = Number(normalizado.cantidad || 0);
        porClave.set(key, {
          ...existente,
          ...normalizado,
          cantidad: Math.max(cantidadExistente, cantidadNueva),
          checked: existente.checked !== false || normalizado.checked !== false || cantidadNueva > 0,
          subitems_selected: [
            ...(existente.subitems_selected || []),
            ...(normalizado.subitems_selected || [])
          ]
        });
      });
      resultado[tipo] = Array.from(porClave.values());
    });
    return resultado;
  }

  function prepararMaterialMenuEdicion(material = {}) {
    const tipoMenaje = document.getElementById('tipo_menaje')?.value || '';
    if (material?.material_logistica) material = material.material_logistica;
    if (material?.materialLogistica) material = material.materialLogistica;
    const sinDuplicados = deduplicarMaterialMenuEdicion(material || {});
    const normalizado = deduplicarMaterialMenuEdicion(window.normalizarMaterialLogistica(sinDuplicados));
    ['bebidas', 'menaje', 'extras'].forEach(tipo => {
      normalizado[tipo] = (normalizado[tipo] || []).filter(item =>
        materialCompatibleConTipoMenajeEdicion(item, tipoMenaje)
      );
    });
    return normalizado;
  }

  function hidratarItemMaterialGuardado(actual, guardados, tipo, mantenerActual = false) {
    if (actual.tiene_subitems && Array.isArray(actual.subitems)) {
      const subitemsSeleccionados = [];
      actual.subitems.forEach(subitem => {
        const guardado = guardados.find(item => materialGuardadoCoincide(item, subitem, tipo));
        if (!guardado) return;
        subitemsSeleccionados.push({
          ...subitem,
          ...guardado,
          id: subitem.id || guardado.id,
          item_id: subitem.item_id || guardado.item_id || guardado.id,
          nombre: guardado.nombre || subitem.nombre,
          cantidad: Number(guardado.cantidad || 0),
          unidad: guardado.unidad || subitem.unidad || 'uds'
        });
      });

      return {
        ...actual,
        checked: subitemsSeleccionados.length > 0 || (mantenerActual && actual.checked),
        cantidad: subitemsSeleccionados.length
          ? subitemsSeleccionados.reduce((total, sub) => total + Number(sub.cantidad || 0), 0)
          : (mantenerActual ? Number(actual.cantidad || 0) : 0),
        subitems_selected: subitemsSeleccionados
      };
    }

    const guardado = guardados.find(item => materialGuardadoCoincide(item, actual, tipo));
    return guardado
      ? { ...actual, ...guardado, checked: true, cantidad: Number(guardado.cantidad || 0) }
      : {
          ...actual,
          checked: mantenerActual ? !!actual.checked : false,
          cantidad: mantenerActual ? Number(actual.cantidad || 0) : 0,
          subitems_selected: mantenerActual ? (actual.subitems_selected || []) : []
        };
  }

  async function restaurarMaterialMenuEnSelector(material, categoriaId = null) {
    if (window.serviciosMode || Number(categoriaId || 0) === 3) return;
    const materialBase = prepararMaterialMenuEdicion(material || {});
    if (!materialTieneItems(materialBase)) return;

    const cont = document.getElementById('materialLogisticaInline');
    if (cont) {
      cont.style.display = 'block';
      cont.dataset.modoLogistica = Number(categoriaId || 0) === 3 ? 'servicios' : 'menus';
    }
    window.modoMaterialLogisticaInline = Number(categoriaId || 0) === 3 ? 'servicios' : 'menus';

    if (typeof window.inicializarMaterialLogistica === 'function') {
      await window.inicializarMaterialLogistica('materialLogisticaInline');
    }

    if (categoriaId && typeof window.autocompletarMaterialPorCategoria === 'function') {
      await window.autocompletarMaterialPorCategoria(Number(categoriaId), 'materialLogisticaInline');
    }

    if (!window.materialLogistica) return;

    ['bebidas', 'menaje', 'extras'].forEach(tipo => {
      const actuales = window.materialLogistica[tipo] || [];
      const guardados = prepararMaterialMenuEdicion(sumarMaterial(
        { bebidas: [], menaje: [], extras: [] },
        {
          bebidas: tipo === 'bebidas' ? [...(materialBase.bebidas || [])] : [],
          menaje: tipo === 'menaje' ? [...(materialBase.menaje || [])] : [],
          extras: tipo === 'extras' ? [...(materialBase.extras || [])] : []
        }
      ))[tipo] || [];
      const rehidratados = actuales
        .filter(item => materialCompatibleConTipoMenajeEdicion(item, document.getElementById('tipo_menaje')?.value || ''))
        .map(item => hidratarItemMaterialGuardado(item, guardados, tipo, true));
      const sinCatalogo = guardados
        .filter(guardado => materialCompatibleConTipoMenajeEdicion(guardado, document.getElementById('tipo_menaje')?.value || ''))
        .filter(guardado => !rehidratados.some(item =>
          materialGuardadoCoincide(guardado, item, tipo) ||
          (item.subitems || []).some(subitem => materialGuardadoCoincide(guardado, subitem, tipo))
        ))
        .map(guardado => ({
          ...guardado,
          item_id: guardado.item_id || guardado.id,
          tipo: guardado.tipo || tipo,
          subcategoria: guardado.subcategoria || (guardado._manual_otro || guardado.source_table === 'manual' ? 'otros' : ''),
          source_table: guardado.source_table || (guardado._manual_otro ? 'manual' : 'logistics_materials'),
          _manual_otro: !!guardado._manual_otro || guardado.source_table === 'manual',
          checked: true,
          cantidad: Number(guardado.cantidad || 0),
          subitems: [],
          subitems_selected: [],
          tiene_subitems: false
        }));

      window.materialLogistica[tipo] = [...rehidratados, ...sinCatalogo];
    });

    if (typeof window.renderizarMaterialLogisticaActual === 'function') {
      window.renderizarMaterialLogisticaActual('materialLogisticaInline');
    }
  }

  async function abrirMaterialLogisticaMenuEdicion(categoriaId) {
    if (window.serviciosMode || Number(categoriaId || 0) === 3) {
      const cont = document.getElementById('materialLogisticaInline');
      const logisticaSection = document.getElementById('logisticaInlineSection');
      const notasSection = document.getElementById('logisticaInlineNotasSection');
      if (logisticaSection) logisticaSection.style.display = 'none';
      if (notasSection) notasSection.style.display = 'none';
      if (cont) {
        cont.style.display = 'none';
        cont.innerHTML = '';
      }
      return;
    }

    const cont = document.getElementById('materialLogisticaInline');
    const logisticaSection = document.getElementById('logisticaInlineSection');
    const notasSection = document.getElementById('logisticaInlineNotasSection');

    if (logisticaSection) logisticaSection.style.display = 'block';
    if (notasSection) notasSection.style.display = 'block';
    if (cont) {
      cont.style.display = 'block';
      cont.dataset.modoLogistica = 'menus';
    }
    window.modoMaterialLogisticaInline = 'menus';

    if (typeof window.inicializarMaterialLogistica === 'function') {
      await window.inicializarMaterialLogistica('materialLogisticaInline');
    }
    if (categoriaId && typeof window.autocompletarMaterialPorCategoria === 'function') {
      await window.autocompletarMaterialPorCategoria(categoriaId, 'materialLogisticaInline');
    }
    if (typeof window.renderizarMaterialLogisticaActual === 'function') {
      window.renderizarMaterialLogisticaActual('materialLogisticaInline');
    }
  }

  function programarRestauracionMaterialMenuEdicion(material, categoriaId, index) {
    const materialSeguro = cloneMenuData(window.normalizarMaterialLogistica(material || {}));
    if (!materialTieneItems(materialSeguro)) return;

    window._materialMenuResumenEditando = materialSeguro;
    window._materialMenuResumenVersion = window._materialMenuResumenVersion || 0;
    const versionRestauracion = window._materialMenuResumenVersion;
    clearTimeout(window._restoreMaterialResumenTimer1);
    clearTimeout(window._restoreMaterialResumenTimer2);

    const restaurar = async () => {
      if ((window._materialMenuResumenVersion || 0) !== versionRestauracion) return;
      const st = window.MenusAdicionalesState || {};
      const sigueEditando = st.indiceMenuEditando === index || window._indiceMenuResumenEditando === index;
      if (!sigueEditando) return;
      await restaurarMaterialMenuEnSelector(materialSeguro, categoriaId);
    };

    restaurar();
    window._restoreMaterialResumenTimer1 = setTimeout(restaurar, 250);
    window._restoreMaterialResumenTimer2 = setTimeout(restaurar, 700);
  }

  function recalcularMaterialAcumuladoDesdeMenus() {
    const st = window.MenusAdicionalesState || { menusAdicionales: [] };
    window._materialAcumulado = (st.menusAdicionales || []).reduce((acc, menu) => {
      return sumarMaterial(acc, menu.material || { bebidas: [], menaje: [], extras: [] });
    }, { bebidas: [], menaje: [], extras: [] });
    return window._materialAcumulado;
  }

  window.recalcularMaterialAcumuladoDesdeMenus = recalcularMaterialAcumuladoDesdeMenus;

  function renderMaterialAcumuladoInline() {
    const cont = document.getElementById('materialLogisticaInline');
    const material = window.normalizarMaterialLogistica(window._materialAcumulado || {});
    if (!cont || !material) return;

    const itemMaterialActivo = (item) =>
      item.checked !== false &&
      (Number(item.cantidad || 0) > 0 || (item.subitems_selected || []).length > 0);

    const total = ['bebidas', 'menaje', 'extras']
      .reduce((sum, tipo) => sum + (material[tipo] || []).filter(itemMaterialActivo).length, 0);

    if (!total) {
      cont.style.display = 'none';
      cont.innerHTML = '';
      return;
    }

    window._materialAcumulado = material;

    const titulos = {
      bebidas: 'Bebidas',
      menaje: 'Menaje',
      extras: 'Extras'
    };

    const renderCol = (tipo) => {
      const items = (material[tipo] || []).filter(itemMaterialActivo);
      if (!items.length) return '';
      return `
        <div class="dc-material-col">
          <div class="dc-material-col-header">
            <span>${titulos[tipo]}</span>
            <small>Material acumulado</small>
          </div>
          <div class="dc-material-list">
            ${items.map((item, index) => `
              <div class="dc-material-item dc-material-item--active">
                <span class="dc-material-nombre">${item.nombre || 'Material'}</span>
                <span class="dc-material-item-right">
                  <input type="number" class="dc-material-cantidad" value="${Math.round(Number(item.cantidad || 0))}" min="0" step="1" onfocus="this.select()"
                    onchange="actualizarMaterialAcumuladoInline('${tipo}', ${index}, this.value)">
                  <span class="dc-material-unit">${item.unidad || 'uds'}</span>
                </span>
              </div>
              ${(item.subitems_selected || []).map((sub, subIndex) => `
                <div class="dc-material-subitem">
                  <span class="dc-material-nombre">${sub.nombre || 'Opcion'}</span>
                  <span class="dc-material-item-right">
                    <input type="number" class="dc-material-cantidad" value="${Math.round(Number(sub.cantidad || 0))}" min="0" step="1" onfocus="this.select()"
                      onchange="actualizarSubmaterialAcumuladoInline('${tipo}', ${index}, ${subIndex}, this.value)">
                    <span class="dc-material-unit">${sub.unidad || item.unidad || 'uds'}</span>
                  </span>
                </div>
              `).join('')}
            `).join('')}
          </div>
        </div>
      `;
    };

    cont.style.display = 'block';
    cont.innerHTML = `
      <div class="dc-material-section dc-material-section--accumulated">
        <div class="dc-material-header">
          <strong>Material acumulado</strong>
          <span>Se actualiza al añadir otro menu</span>
        </div>
        <div class="dc-material-grid">
          ${renderCol('bebidas')}
          ${renderCol('menaje')}
          ${renderCol('extras')}
        </div>
      </div>
    `;
  }

  window.renderMaterialAcumuladoInline = renderMaterialAcumuladoInline;

  async function mostrarMaterialAcumuladoComoFormulario(categoriaId = null) {
    const material = cloneMenuData(window.normalizarMaterialLogistica(window._materialAcumulado || {}));
    const categoriaBase = Number(categoriaId || document.getElementById('categoria')?.value || 0);
    const cont = document.getElementById('materialLogisticaInline');
    if (!cont) return;

    cont.style.display = 'block';
    cont.dataset.modoLogistica = categoriaBase === 3 ? 'servicios' : 'menus';
    window.modoMaterialLogisticaInline = categoriaBase === 3 ? 'servicios' : 'menus';

    if (materialTieneItems(material)) {
      if (window.materialLogistica) {
        window.materialLogistica.bebidas = [];
        window.materialLogistica.menaje = [];
        window.materialLogistica.extras = [];
      }
      await restaurarMaterialMenuEnSelector(material, categoriaBase || null);
      return;
    }

    if (typeof window.inicializarMaterialLogistica === 'function') {
      await window.inicializarMaterialLogistica('materialLogisticaInline');
    }
  }

  window.mostrarMaterialAcumuladoComoFormulario = mostrarMaterialAcumuladoComoFormulario;

  window.actualizarMaterialAcumuladoInline = function(tipo, index, value) {
    if (!window._materialAcumulado?.[tipo]?.[index]) return;
    const cantidad = Math.max(0, Math.round(Number(value || 0)));
    window._materialAcumulado[tipo][index].cantidad = cantidad;
    window._materialAcumulado[tipo][index].checked = cantidad > 0;
    renderMaterialAcumuladoInline();
  };

  window.actualizarSubmaterialAcumuladoInline = function(tipo, index, subIndex, value) {
    const subitem = window._materialAcumulado?.[tipo]?.[index]?.subitems_selected?.[subIndex];
    if (!subitem) return;
    subitem.cantidad = Math.max(0, Math.round(Number(value || 0)));
    renderMaterialAcumuladoInline();
  };

  function setModoEdicionResumenActivo(activo) {
    const btn = document.getElementById('btnAnadirMenu');
    if (!btn) return;
    btn.textContent = activo && getIndiceMenuEditandoResumen() >= 0 ? 'Actualizar menú' : '+ Añadir menú';
  }

  function getIndiceMenuEditandoResumen() {
    const st = window.MenusAdicionalesState;
    const total = st.menusAdicionales.length;
    const indiceFormulario = Number(st.indiceMenuEditando ?? -1);
    const indiceResumen = Number(window._indiceMenuResumenEditando ?? -1);

    const formularioValido = indiceFormulario >= 0 && indiceFormulario < total;
    const resumenValido = indiceResumen >= 0 && indiceResumen < total;

    if (!formularioValido && indiceFormulario >= 0) st.indiceMenuEditando = -1;
    if (!resumenValido && indiceResumen >= 0) window._indiceMenuResumenEditando = -1;

    if (formularioValido) return indiceFormulario;
    if (resumenValido) return indiceResumen;
    return -1;
  }

  function getIndiceMenuSeleccionadoResumen() {
    const st = window.MenusAdicionalesState;
    const index = Number(st.indiceMenuSeleccionadoResumen ?? -1);
    return index >= 0 && index < st.menusAdicionales.length ? index : -1;
  }

  function asegurarSeleccionResumenEnEdicion() {
    // La seleccion del resumen debe ser una accion explicita o hacerse solo
    // al cargar una comanda para edicion. Si la forzamos en cada render,
    // el boton vuelve a "Editar menu" despues de "Actualizar menu".
  }

  function getAccionResumenPrincipal() {
    const editandoFormulario = getIndiceMenuEditandoResumen();
    if (editandoFormulario >= 0) {
      return {
        label: 'Actualizar menú',
        disabled: false,
        onclick: 'anadirMenuAComanda()',
        showCancel: true
      };
    }

    const seleccionado = getIndiceMenuSeleccionadoResumen();
    if (seleccionado >= 0) {
      return {
        label: 'Editar menú',
        disabled: false,
        onclick: `editarMenuResumen(${seleccionado})`,
        showCancel: true
      };
    }

    return {
      label: 'Guardar Comanda',
      disabled: false,
      onclick: 'window._guardarComandaDIY()',
      showCancel: true
    };
  }

  function restaurarReferenciasMenuEdicion(menu) {
    window.referenciasExtras = Array.isArray(menu?.referencias_extras)
      ? cloneMenuData(menu.referencias_extras).map(ref => ({
        ...ref,
        id: String(ref.id || `extra_carta_${Date.now()}_${Math.floor(Math.random() * 1000)}`),
        cantidad: Number(ref.cantidad || 0) || 1,
        unidad: ref.unidad || 'uds',
        tipo: ref.tipo || (ref.grupo === 'postre' ? 'postres' : 'saladas'),
        grupo: ref.grupo || (ref.tipo === 'postres' ? 'postre' : 'salado'),
        extra_carta: ref.extra_carta !== false,
        cantidad_manual: ref.cantidad_manual !== false,
        _cantidad_guardada_edicion: true
      }))
      : [];

    if (!menu?.referencias) {
      if (typeof renderReferenciasExtras === 'function') renderReferenciasExtras();
      if (typeof renderReferenciasFueraCarta === 'function') renderReferenciasFueraCarta();
      return;
    }
    const saladas = menu.referencias.saladas || [];
    const postres = menu.referencias.postres || [];
    const rojasIds = new Set((window.referenciasPaginacion?.rojo?.items || []).map(ref => String(ref.id)));
    const marcarCantidadGuardada = ref => ({
      ...ref,
      cantidad_manual: ref.cantidad_manual !== false,
      _cantidad_guardada_edicion: true
    });
    window.referenciasSeleccionadas = {
      gris: saladas.filter(ref => !rojasIds.has(String(ref.id))).map(marcarCantidadGuardada),
      rojo: saladas.filter(ref => rojasIds.has(String(ref.id))).map(marcarCantidadGuardada),
      postres: postres.map(marcarCantidadGuardada)
    };
    Object.defineProperty(window.referenciasSeleccionadas, 'saladas', {
      get() { return this.gris; },
      set(v) { this.gris = v; },
      configurable: true
    });
    if (typeof actualizarCantidadesReferencias === 'function') actualizarCantidadesReferencias();
    else {
      ['gris', 'rojo', 'postres'].forEach(tipo => {
        document.querySelectorAll(`.referencia-option[data-tipo="${tipo}"]`).forEach(card => {
          const selected = (window.referenciasSeleccionadas[tipo] || [])
            .find(ref => String(ref.id) === String(card.dataset.id));
          card.classList.toggle('selected', !!selected);
          const input = card.querySelector('.cantidad-input');
          if (selected && input) input.value = selected.cantidad || 1;
        });
      });
    }
    if (typeof renderReferenciasExtras === 'function') renderReferenciasExtras();
    if (typeof renderReferenciasFueraCarta === 'function') renderReferenciasFueraCarta();
  }

  function restaurarDesayunoMenuEdicion(menu) {
    if (!menu?.referencias_desayuno || !window.referenciasDesayuno) return;

    window.referenciasDesayuno = {
      ...(window.referenciasDesayuno || {}),
      ...Object.fromEntries(Object.entries(cloneMenuData(menu.referencias_desayuno)).map(([refId, ref]) => [
        refId,
        (() => {
          const actual = window.referenciasDesayuno?.[refId] || {};
          return {
          ...actual,
          ...ref,
          cantidad_manual: ref?.cantidad_manual !== false,
          _cantidad_guardada_edicion: true,
          opcionesDisponibles: actual.opcionesDisponibles || ref?.opcionesDisponibles || [],
          pulguitasDisponibles: actual.pulguitasDisponibles || ref?.pulguitasDisponibles || []
          };
        })()
      ]))
    };

    Object.entries(window.referenciasDesayuno).forEach(([refId, ref]) => {
      const cantidad = Number(ref?.cantidad || 0);
      const input = document.getElementById('input_' + refId)
        || document.querySelector(`#referenciasDesayunoGrid [data-id="${CSS.escape(String(refId))}"] input[type="number"]`);
      if (input) input.value = cantidad;

      const bubble = document.querySelector(`#referenciasDesayunoGrid [data-id="${CSS.escape(String(refId))}"]`);
      if (bubble) {
        bubble.classList.toggle('selected', cantidad > 0);
        bubble.classList.toggle('active', cantidad > 0);
      }

      if (typeof actualizarTextoDropdownDesayuno === 'function') {
        actualizarTextoDropdownDesayuno(refId);
      }
      if (typeof actualizarCantidadDesayuno === 'function') {
        actualizarCantidadDesayuno(refId, cantidad);
      }
    });
  }

  function restaurarFoodboxLunchMenuEdicion(menu) {
    const fl = menu?.foodbox_lunch;
    if (!fl) return;
    const seleccion = {
      ensaladas: (fl.ensaladas || fl.selecciones?.ensaladas || []).map(item => ({ ...item })),
      sandwiches: (fl.sandwiches || fl.selecciones?.sandwiches || []).map(item => ({ ...item })),
      postres: (fl.postres || fl.selecciones?.postres || []).map(item => ({ ...item }))
    };
    const foodboxListo = !!document.querySelector('#foodboxLunchSection .referencia-option');
    if (foodboxListo && typeof window.aplicarSeleccionesFoodboxLunch === 'function') {
      window.aplicarSeleccionesFoodboxLunch(seleccion);
    } else {
      window._foodboxLunchSeleccionesPendientes = seleccion;
    }
  }

  function restaurarBandejasMenuEdicion(menu) {
    const categoriaId = Number(menu?.categoriaId || menu?._cat || 0);
    const b = menu?.bandejas;
    if (!b || !window.BandejasState) return;

    const asignar = (key, items) => {
      if (!window.BandejasState[key]) return;
      window.BandejasState[key].selected = (items || []).map(item => ({ ...item }));
    };

    if (categoriaId === 5) {
      asignar('diy_termos', b.termos);
      asignar('diy_servicio', b.servicio);
      asignar('diy_dulces', b.dulces);
      asignar('diy_salados', b.salados);
    }

    if (categoriaId === 6) {
      asignar('diy_fb_saladas', b.saladas);
      asignar('diy_fb_postres', b.postres);
    }

    if (typeof window.renderDIYGrupos === 'function') {
      window.renderDIYGrupos(categoriaId);
    }
  }

  // ─────────────────────────────────────────────────────────────
  // Toast de error discreto (sin alert)
  // ─────────────────────────────────────────────────────────────
  function mostrarToastError(msg) {
    let toast = document.getElementById('_toastMenuError');
    if (!toast) {
      toast = document.createElement('div');
      toast.id = '_toastMenuError';
      toast.style.cssText = [
        'position:fixed', 'bottom:24px', 'left:50%', 'transform:translateX(-50%)',
        'background:#1e293b', 'color:#f8fafc', 'padding:10px 20px', 'border-radius:8px',
        'font-size:0.85rem', 'z-index:9999', 'opacity:0', 'transition:opacity .2s',
        'pointer-events:none', 'white-space:nowrap',
      ].join(';');
      document.body.appendChild(toast);
    }
    toast.textContent = msg;
    toast.style.opacity = '1';
    clearTimeout(toast._t);
    toast._t = setTimeout(() => { toast.style.opacity = '0'; }, 2500);
  }

  // ─────────────────────────────────────────────────────────────
  // PÚBLICA: Añadir el menú configurado actualmente a la comanda
  // ─────────────────────────────────────────────────────────────
  window.anadirMenuAComanda = function () {
    const st = window.MenusAdicionalesState;

    if (!window.menuSeleccionado) {
      mostrarToastError('Selecciona un menú antes de añadir');
      return;
    }

    const categoriaSelectId = parseInt(document.getElementById('categoria')?.value) || 0;
    const categoriaId = window.menuSeleccionado?._cat || categoriaSelectId;

    const paxEl = document.getElementById('pax');
    const pax = parseInt(paxEl?.value) || 0;
    // Cat 5/6 (DIY) no requieren PAX
    if (pax <= 0 && ![5, 6].includes(categoriaId)) {
      mostrarToastError('Introduce el número de PAX para este menú');
      paxEl?.focus();
      return;
    }

    // Capturar material usando la fuente de verdad (window.materialLogistica)
    // ANTES de que limpiarMaterialLogistica() lo vacíe
    if ([2, 3].includes(Number(categoriaId))) {
      const seleccionadasSaladas = typeof window.contarReferenciasSeleccionadas === 'function'
        ? window.contarReferenciasSeleccionadas('saladas')
        : [
          ...(window.referenciasSeleccionadas?.gris || []),
          ...(window.referenciasSeleccionadas?.rojo || [])
        ].length;
      const minSaladas = Number(window.menuSeleccionado.items_salados_min || 0);
      if (seleccionadasSaladas < minSaladas) {
        mostrarToastError(`Debes completar ${minSaladas} referencias saladas. Puedes usar Fuera de carta si aplica.`);
        return;
      }

      const minPostres = Number(window.menuSeleccionado.items_postres_min || 0);
      const seleccionadasPostres = typeof window.contarReferenciasSeleccionadas === 'function'
        ? window.contarReferenciasSeleccionadas('postres')
        : (window.referenciasSeleccionadas?.postres || []).length;
      if (seleccionadasPostres < minPostres) {
        mostrarToastError(`Debes completar ${minPostres} postres. Puedes usar Fuera de carta si aplica.`);
        return;
      }
    }

    const materialSnapshotBase = typeof window.obtenerMaterialSeleccionado === 'function'
      ? window.obtenerMaterialSeleccionado()
      : capturarMaterialDOM();
    const materialSnapshot = (window.serviciosMode || Number(categoriaId || 0) === 3)
      ? materialSnapshotBase
      : prepararMaterialMenuEdicion(materialSnapshotBase);

    // Construir objeto del menú
    const item = {
      _edicion_uid: `nuevo_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
      id:          window.menuSeleccionado.id || '',
      nombre:      window.menuSeleccionado.nombre || '',
      categoriaId,
      categoriaOriginalId: categoriaSelectId,
      categoria:   window.serviciosMode ? 'Servicios' : (document.getElementById('categoria')?.selectedOptions[0]?.text || ''),
      servicio_categoria: window.menuSeleccionado.servicio_categoria || null,
      no_suma_pax: window.serviciosMode && window.menuSeleccionado.servicio_categoria === 'welcome',
      pax,
      tipo_menaje: document.getElementById('tipo_menaje')?.value || null,
      material:    materialSnapshot,
    };

    if (categoriaId === 1 && window.referenciasDesayuno) {
      item.referencias_desayuno = { ...window.referenciasDesayuno };
    }
    if ([2, 3].includes(categoriaId)) {
      item.multiplicadores = { ...(window.multiplicadores || { saladas: 1, postres: 1 }) };
      item.referencias = {
        saladas: [
          ...(window.referenciasSeleccionadas?.gris  || []),
          ...(window.referenciasSeleccionadas?.rojo  || []),
        ],
        postres: [...(window.referenciasSeleccionadas?.postres || [])],
      };
      item.referencias_extras = [...(window.referenciasExtras || [])];
    }
    if (categoriaId === 4 && typeof obtenerSeleccionesFoodboxLunch === 'function') {
      const sel = obtenerSeleccionesFoodboxLunch();
      // Guardar las selecciones completas (arrays con cantidades)
      item.foodbox_lunch = {
        selecciones: sel,
        // También en formato plano para compatibilidad con _renderMenuDetalle
        ensaladas: sel.ensaladas || [],
        sandwiches: sel.sandwiches || [],
        postres: sel.postres || [],
      };
    }
    if (categoriaId === 5 && window.BandejasState) {
      item.bandejas = {
        termos:   [...(window.BandejasState?.diy_termos?.selected   || [])],
        servicio: [...(window.BandejasState?.diy_servicio?.selected || [])],
        dulces:   [...(window.BandejasState?.diy_dulces?.selected   || [])],
        salados:  [...(window.BandejasState?.diy_salados?.selected  || [])],
      };
    }
    if (categoriaId === 6 && window.BandejasState) {
      item.bandejas = {
        saladas: [...(window.BandejasState?.diy_fb_saladas?.selected || [])],
        postres: [...(window.BandejasState?.diy_fb_postres?.selected || [])],
      };
    }

    // Guardar o reemplazar el menu editado
    const indiceEditando = getIndiceMenuEditandoResumen();
    const editandoMenuExistente = indiceEditando >= 0 && indiceEditando < st.menusAdicionales.length;
    if (editandoMenuExistente) {
      st.menusAdicionales[indiceEditando] = item;
    } else {
      st.menusAdicionales.push(item);
    }
    st.indiceMenuEditando = -1;
    st.indiceMenuSeleccionadoResumen = -1;
    window._indiceMenuResumenEditando = -1;
    window._materialMenuResumenEditando = null;
    clearTimeout(window._restoreMaterialResumenTimer1);
    clearTimeout(window._restoreMaterialResumenTimer2);
    window.menusAdicionales = st.menusAdicionales;

    // Recalcular material global desde cero para evitar duplicados al editar
    recalcularMaterialAcumuladoDesdeMenus();

    // Actualizar PAX total visible
    const paxTotal = window.calcularPaxTotalComanda(st.menusAdicionales);
    const paxTotalEl = document.getElementById('paxTotalValor');
    if (paxTotalEl) paxTotalEl.textContent = paxTotal;
    const paxWrap = document.getElementById('paxTotalWrap');
    if (paxWrap) paxWrap.style.display = 'block';

    // Actualizar resumen lateral
    actualizarResumenLateral();

    // Feedback discreto en el botón
    const btn = document.getElementById('btnAnadirMenu');
    if (btn) {
      const orig = btn.textContent;
      btn.textContent = '✓';
      btn.style.color = '#16a34a';
      btn.style.borderColor = '#16a34a';
      setTimeout(() => { setModoEdicionResumenActivo(false); btn.style.color = ''; btn.style.borderColor = ''; }, 1200);
    }

    // Limpiar formulario para el siguiente menú
    if (typeof limpiarSeccionesMenu === 'function') limpiarSeccionesMenu();
    // Reaplicar tipo de menaje al nuevo menú que se configurará a continuación
    setTimeout(() => {
      if (typeof window.actualizarTipoMenajeGlobal === 'function') {
        window.actualizarTipoMenajeGlobal();
      }
    }, 250);

    // Resetear campos del menú principal
    const catSelect = document.getElementById('categoria');
    if (catSelect) catSelect.value = window.serviciosMode ? '3' : '';
    const menuIdInput = document.getElementById('menu_id');
    if (menuIdInput) menuIdInput.value = '';
    if (paxEl) paxEl.value = '';
    const menusContainer = document.getElementById('menusContainer');
    if (menusContainer) menusContainer.innerHTML = '';
    window.menuSeleccionado = null;
    window.referenciasExtras = [];

    // Ocultar botón hasta próxima selección de categoría
    const btnWrap = document.getElementById('btnAnadirMenuWrap');
    if (btnWrap) btnWrap.style.display = window.serviciosMode ? 'flex' : 'none';
    setModoEdicionResumenActivo(false);

    // Mantener logística como formulario editable, con lo ya acumulado como base.
    mostrarMaterialAcumuladoComoFormulario(categoriaId);
    if (typeof asegurarLogisticaInlineVisible === 'function') {
      asegurarLogisticaInlineVisible();
    } else {
      const logisticaSection = document.getElementById('logisticaInlineSection');
      const notasSection = document.getElementById('logisticaInlineNotasSection');
      if (logisticaSection) logisticaSection.style.display = 'block';
      if (notasSection) notasSection.style.display = 'block';
    }

    console.log(`✅ Menú añadido: ${item.nombre} (${pax} pax). Total: ${st.menusAdicionales.length} menús, ${paxTotal} PAX`);
  };

  // ─────────────────────────────────────────────────────────────
  // PÚBLICA: Para el submit — obtener todos los menús acumulados
  // ─────────────────────────────────────────────────────────────
  window.obtenerMenusAcumulados = function () {
    return window.MenusAdicionalesState.menusAdicionales;
  };

  // ─────────────────────────────────────────────────────────────
  // PÚBLICA: Resetear todo al limpiar el formulario principal
  // ─────────────────────────────────────────────────────────────
  window.resetearMenusAcumulados = function () {
    window.MenusAdicionalesState.menusAdicionales = [];
    window.menusAdicionales = window.MenusAdicionalesState.menusAdicionales;
    window._materialAcumulado = { bebidas: [], menaje: [], extras: [] };
    const paxWrap = document.getElementById('paxTotalWrap');
    if (paxWrap) paxWrap.style.display = 'none';
    const paxTotalEl = document.getElementById('paxTotalValor');
    if (paxTotalEl) paxTotalEl.textContent = '0';
    actualizarResumenLateral();
  };

  // ─────────────────────────────────────────────────────────────
  // INTERNA: Renderiza el resumen lateral de menús acumulados
  // ─────────────────────────────────────────────────────────────
  function escResumen(value) {
    return String(value ?? '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function formatoCantidadResumen(item, unidadFallback) {
    if (!item || item.cantidad === undefined || item.cantidad === null || item.cantidad === '') return '';
    return `${escResumen(item.cantidad)} ${escResumen(item.unidad || unidadFallback || '')}`.trim();
  }

  function renderFilaDetalleResumen(nombre, cantidad, esTitulo) {
    return `
      <div class="resumen-detalle-row${esTitulo ? ' resumen-detalle-row--title' : ''}">
        <span>${escResumen(nombre)}</span>
        ${cantidad ? `<b>${cantidad}</b>` : ''}
      </div>`;
  }

  function detalleDesayunoResumen(menu) {
    const ordenDesayuno = {
      healthy_bolleria: 10,
      healthy_sandwich: 20,
      healthy_tostada: 30,
      healthy_fruta: 40,
      classic_bolleria: 10,
      classic_sandwich: 20,
      classic_fruta: 30,
      premium_cookie: 10,
      premium_bolleria: 20,
      premium_sandwich_o_pulguita: 30,
      premium_fruta: 40,
      premium_smoothie: 50,
      veggie_cookie: 10,
      veggie_sandwich_vegetal: 20,
      veggie_sandwich_aguacate: 21,
      veggie_fruta: 30
    };
    const refs = Object.entries(menu.referencias_desayuno || {})
      .map(([key, ref], index) => ({ key, ref, index }))
      .filter(item => item.ref && item.ref.cantidad > 0 && item.ref.tipo !== 'termo' && item.ref.tipo !== 'leche_especial')
      .sort((a, b) => (ordenDesayuno[a.ref.id || a.key] ?? a.index + 100) - (ordenDesayuno[b.ref.id || b.key] ?? b.index + 100))
      .map(item => ({ ...item.ref, _refKey: item.key }));
    const distribuirCantidad = (total, opciones) => {
      const cantidadTotal = Math.max(0, Number(total) || 0);
      const cantidadOpciones = Math.max(1, Number(opciones) || 1);
      const base = Math.floor(cantidadTotal / cantidadOpciones);
      const resto = cantidadTotal % cantidadOpciones;
      return Array.from({ length: cantidadOpciones }, (_, index) => base + (index < resto ? 1 : 0));
    };

    let tituloSandwichFijoRenderizado = false;

    return refs.map(ref => {
      let extra = '';
      const refKey = ref.id || ref._refKey || '';

      if (ref.tipo === 'bolleria' && ref.opcionesSeleccionadas?.length) {
        const cantidades = distribuirCantidad(ref.cantidad || menu.pax, ref.opcionesSeleccionadas.length);
        return renderFilaDetalleResumen('Bollería:', '', true) + ref.opcionesSeleccionadas
          .map((opcion, index) => renderFilaDetalleResumen(opcion, `${cantidades[index]} ${escResumen(ref.unidad || 'uds')}`, false))
          .join('');
      }

      if (ref.tipo === 'sandwich' && ref.sabor) {
        if (refKey === 'premium_cookie' || refKey === 'premium_fruta') {
          return (refKey === 'premium_fruta' ? '<div class="resumen-detalle-row resumen-detalle-row--spacer"></div>' : '')
            + renderFilaDetalleResumen(ref.sabor, formatoCantidadResumen(ref, 'uds'), false);
        }
        const tituloSimple = /sandwich|s[aá]ndwich/i.test(`${ref.id || ''} ${ref.nombre || ''}`)
          ? 'Sándwich:'
          : `${ref.nombre}:`;
        return renderFilaDetalleResumen(tituloSimple, '', true)
          + renderFilaDetalleResumen(ref.sabor, formatoCantidadResumen(ref, 'uds'), false);
      }

      if (ref.tipo === 'sandwich_fijo') {
        const titulo = tituloSandwichFijoRenderizado ? '' : renderFilaDetalleResumen('Sándwich:', '', true);
        tituloSandwichFijoRenderizado = true;
        return titulo + renderFilaDetalleResumen(ref.sabor || ref.nombre, formatoCantidadResumen(ref, 'uds'), false);
      }

      if (ref.tipo === 'sandwich_multiple' && ref.sandwiches?.length) {
        const sandwiches = ref.sandwiches.filter(s => s.sabor);
        const cantidades = distribuirCantidad(ref.cantidad || menu.pax, sandwiches.length);
        return renderFilaDetalleResumen('Mini sandwich:', '', true) + sandwiches
          .map((s, index) => renderFilaDetalleResumen(s.sabor, `${cantidades[index]} ${escResumen(ref.unidad || 'uds')}`, false))
          .join('');
      }

      if (ref.tipo === 'sandwich_o_pulguita') {
        if (ref.modo === 'pulguita' && ref.pulguita) {
          extra = ` - ${ref.pulguita}`;
        } else if (ref.sandwiches?.length) {
          const sandwiches = ref.sandwiches.filter(s => s.sabor);
          const cantidades = distribuirCantidad(ref.cantidad || menu.pax, sandwiches.length);
          return renderFilaDetalleResumen('Mini sandwich:', '', true) + sandwiches
            .map((s, index) => renderFilaDetalleResumen(s.sabor, `${cantidades[index]} ${escResumen(ref.unidad || 'uds')}`, false))
            .join('');
        }
      }

      return (['classic_fruta', 'healthy_fruta', 'veggie_fruta'].includes(refKey) ? '<div class="resumen-detalle-row resumen-detalle-row--spacer"></div>' : '')
        + renderFilaDetalleResumen(ref.nombre + extra, formatoCantidadResumen(ref, 'uds'), false);
    }).join('');
  }

  function detalleReferenciasResumen(menu) {
    let html = '';
    const saladas = menu.referencias?.saladas || [];
    const postres = menu.referencias?.postres || [];
    const mul = menu.multiplicadores || {};
    const extras = Array.isArray(menu.referencias_extras) ? menu.referencias_extras : [];
    const extrasSaladas = extras.filter(ref => ref.grupo !== 'postre' && ref.tipo !== 'postres');
    const extrasPostres = extras.filter(ref => ref.grupo === 'postre' || ref.tipo === 'postres');
    const saladasCarta = saladas.filter(ref => !ref.fuera_carta);
    const saladasFueraCarta = saladas.filter(ref => ref.fuera_carta);
    const postresCarta = postres.filter(ref => !ref.fuera_carta);
    const postresFueraCarta = postres.filter(ref => ref.fuera_carta);

    if (saladasCarta.length) {
      saladasCarta.forEach(ref => {
        html += renderFilaDetalleResumen(ref.nombre || ref.id || 'Referencia', formatoCantidadResumen(ref, 'uds'), false);
      });
    }

    if (saladasFueraCarta.length) {
      saladasFueraCarta.forEach(ref => {
        html += renderFilaDetalleResumen(ref.nombre || ref.id || 'Referencia', formatoCantidadResumen(ref, 'uds'), false);
      });
    }

    if (extrasSaladas.length) {
      extrasSaladas.forEach(ref => {
        html += renderFilaDetalleResumen(ref.nombre || ref.id || 'Extra', formatoCantidadResumen(ref, 'uds'), false);
      });
    }

    if (postresCarta.length || postresFueraCarta.length || extrasPostres.length) {
      html += renderFilaDetalleResumen('POSTRES', '', true);
      postresCarta.forEach(ref => {
        html += renderFilaDetalleResumen(ref.nombre || ref.id || 'Referencia', formatoCantidadResumen(ref, 'uds'), false);
      });
      postresFueraCarta.forEach(ref => {
        html += renderFilaDetalleResumen(ref.nombre || ref.id || 'Referencia', formatoCantidadResumen(ref, 'uds'), false);
      });
      extrasPostres.forEach(ref => {
        html += renderFilaDetalleResumen(ref.nombre || ref.id || 'Extra', formatoCantidadResumen(ref, 'uds'), false);
      });
    }

    return html;
  }

  function detalleFoodboxResumen(menu) {
    const fl = menu.foodbox_lunch || {};
    const grupos = [
      { label: 'Ensaladas', items: fl.ensaladas || fl.selecciones?.ensaladas || [] },
      { label: 'Sandwiches', items: fl.sandwiches || fl.selecciones?.sandwiches || [] },
      { label: 'Postres', items: fl.postres || fl.selecciones?.postres || [] },
    ].filter(g => g.items.length);

    let html = '';
    grupos.forEach(grupo => {
      if (grupo.label.toLowerCase() === 'postres') html += renderFilaDetalleResumen('POSTRES', '', true);
      grupo.items.forEach(item => {
        html += renderFilaDetalleResumen(item.nombre || item.id || 'Item', formatoCantidadResumen(item, 'uds'), false);
      });
    });

    return html;
  }

  function detalleBandejasResumen(menu) {
    const b = menu.bandejas || {};
    const grupos = [
      { label: 'Termos y bebidas', items: b.termos || [] },
      { label: 'Servicio', items: b.servicio || [] },
      { label: 'Dulces y bolleria', items: b.dulces || [] },
      { label: 'Salados y bebidas', items: b.salados || [] },
      { label: 'Saladas', items: b.saladas || [] },
      { label: 'Postres', items: b.postres || [] },
    ].filter(g => g.items.length);

    let html = '';
    grupos.forEach(grupo => {
      if (grupo.label.toLowerCase() === 'postres') html += renderFilaDetalleResumen('POSTRES', '', true);
      grupo.items.forEach(item => {
        const variantes = item.variantes?.length
          ? ` (${item.variantes.map(v => v.nombre || v).join(', ')})`
          : '';
        html += renderFilaDetalleResumen((item.nombre || item.id || 'Item') + variantes, formatoCantidadResumen(item, 'ud.'), false);
      });
    });

    return html;
  }

  function renderDetalleMenuResumen(menu) {
    const html = [
      detalleDesayunoResumen(menu),
      detalleReferenciasResumen(menu),
      detalleFoodboxResumen(menu),
      detalleBandejasResumen(menu),
    ].filter(Boolean).join('');

    return html ? `<div class="resumen-menu-detalle">${html}</div>` : '';
  }

  function actualizarResumenLateral() {
    const body = document.getElementById('resumenBody');
    if (!body) return;

    const menus = window.MenusAdicionalesState.menusAdicionales;
    asegurarSeleccionResumenEnEdicion();

    // Recoger selecciones DIY activas (cat 5 o 6)
    // window.menuSeleccionado?._cat resuelve el caso en que cat 5 y 6 comparten el mismo <select value="5">
    const categoriaActiva = window.menuSeleccionado?._cat
      || parseInt(document.getElementById('categoria')?.value)
      || 0;
    const diyItems = [];
    if ([5, 6].includes(categoriaActiva) && window.BandejasState) {
      const claves = categoriaActiva === 5
        ? ['diy_termos', 'diy_servicio', 'diy_dulces', 'diy_salados']
        : ['diy_fb_saladas', 'diy_fb_postres'];
      claves.forEach(k => {
        (window.BandejasState[k]?.selected || []).forEach(it => diyItems.push(it));
      });
    }

    const hayMenus = menus.length > 0;
    const hayDIY   = diyItems.length > 0;
    setModoEdicionResumenActivo(getIndiceMenuEditandoResumen() >= 0);

    if (!hayMenus && !hayDIY) {
      body.innerHTML = `
        <div class="resumen-empty">
          <div style="font-size:1.5rem;margin-bottom:6px">📋</div>
          <div>Añade menús a la comanda</div>
        </div>
        <div class="resumen-footer">
          <button type="button" class="btn-guardar-comanda" onclick="window._guardarComandaDIY()" disabled>
            💾 Guardar Comanda
          </button>
        </div>`;
      return;
    }

    let itemsHtml = '';

    // Menús acumulados normales
    menus.forEach((m, i) => {
      const seleccionadoParaEditar = getIndiceMenuSeleccionadoResumen() === i;
      itemsHtml += `
        <div class="resumen-menu-card ${seleccionadoParaEditar ? 'resumen-menu-card--selected' : ''}" onclick="seleccionarMenuResumenParaEditar(${i})">
          <div class="resumen-item">
            <span class="resumen-item-nombre">${escResumen(m.nombre || '-')}</span>
            <span class="resumen-item-pax">${escResumen(m.pax)} pax${window.esMenuServicioExtraNoSumaPax(m) ? ' · extra' : ''}</span>
            <button type="button" class="resumen-chip-x" onclick="event.stopPropagation(); eliminarMenuResumen(${i})" title="Eliminar">&times;</button>
          </div>
          ${renderDetalleMenuResumen(m)}
        </div>`;
    });

    // Ítems DIY seleccionados en tiempo real
    let totalDIY = 0;
    if (hayDIY) {
      if (hayMenus) itemsHtml += '<div class="resumen-divider"></div>';
      diyItems.forEach(it => {
        const qty = it.cantidad || 1;
        const precio = it.precio != null ? it.precio : null;
        const subtotal = precio != null ? precio * qty : null;
        if (subtotal != null) totalDIY += subtotal;

        const variantesText = it.variantes?.length
          ? `<div class="resumen-item-variantes">${it.variantes.map(v => v.nombre || v).join(', ')}</div>`
          : '';
        const precioText = precio != null
          ? `<span class="resumen-diy-precio">${subtotal.toFixed(2).replace('.', ',')} €</span>`
          : '';

        itemsHtml += `
          <div class="resumen-item resumen-item--diy">
            <div class="resumen-diy-body">
              <span class="resumen-item-nombre">${it.nombre}</span>
              ${precio != null ? `<span class="resumen-diy-sub">${qty} × ${precio.toFixed(2).replace('.', ',')} €</span>` : `<span class="resumen-diy-sub">${qty} ud${qty > 1 ? 's' : ''}.</span>`}
              ${variantesText}
            </div>
            <div class="resumen-diy-right">
              ${precioText}
              <button type="button" class="resumen-diy-trash" onclick="window._diyEliminar('${it.id}')" title="Eliminar">🗑</button>
            </div>
          </div>`;
      });
    }

    // Función para eliminar ítem DIY desde el resumen
    window._diyEliminar = function(itemId) {
      if (!window.BandejasState) return;
      const categoriaActiva = window.menuSeleccionado?._cat
        || parseInt(document.getElementById('categoria')?.value)
        || 0;
      const claves = categoriaActiva === 5
        ? ['diy_termos', 'diy_servicio', 'diy_dulces', 'diy_salados']
        : ['diy_fb_saladas', 'diy_fb_postres'];
      claves.forEach(k => {
        const st = window.BandejasState[k];
        if (!st) return;
        const idx = st.selected.findIndex(x => x.id === itemId);
        if (idx >= 0) st.selected.splice(idx, 1);
      });
      // Re-renderizar grids DIY llamando al módulo de bandejas
      if (typeof window.renderDIYGrupos === 'function') {
        window.renderDIYGrupos(categoriaActiva);
      }
      actualizarResumenLateral();
    };

    const paxTotal = window.calcularPaxTotalComanda(menus);
    const totalesHtml = (paxTotal > 0 || totalDIY > 0) ? `
      <div class="resumen-divider"></div>
      ${paxTotal > 0 ? `<div class="resumen-total-row"><span>Total PAX</span><span class="resumen-total-num">${paxTotal} pax</span></div>` : ''}
      ${totalDIY > 0 ? `<div class="resumen-total-row"><span>Total</span><span class="resumen-total-num">${totalDIY.toFixed(2).replace('.', ',')} €</span></div>` : ''}
    ` : '';

    const accionResumen = getAccionResumenPrincipal();
    const footerHtml = `
      <div class="resumen-footer ${accionResumen.showCancel ? 'resumen-footer--edit' : ''}">
        <button type="button" class="btn-guardar-comanda" onclick="${accionResumen.onclick}" ${accionResumen.disabled ? 'disabled' : ''}>
          💾 ${accionResumen.label}
        </button>
        ${accionResumen.showCancel ? `
          <button type="button" class="btn-cancelar-edicion-menu" onclick="cancelarEdicionMenuResumen()">
            Cancelar
          </button>` : ''}
      </div>`;

    body.innerHTML = itemsHtml + totalesHtml + footerHtml;
  }

  // Exponer para que bandejas-preparadas.js pueda llamarla
  window.actualizarResumenLateral = actualizarResumenLateral;

  window.editarMenuResumen = async function(index) {
    const st = window.MenusAdicionalesState;
    const menu = cloneMenuData(st.menusAdicionales[index]);
    if (!menu) return;

    clearTimeout(window._restoreMaterialEdicionTimer);
    st.indiceMenuEditando = index;
    window._indiceMenuResumenEditando = index;
    window.menuSeleccionado = { ...menu, _cat: Number(menu.categoriaId || menu._cat || 0) };

    try {
      if (typeof window._activarPrimerMenuEdicion === 'function') {
        await window._activarPrimerMenuEdicion(menu);
      } else if (typeof _activarPrimerMenuEdicion === 'function') {
        await _activarPrimerMenuEdicion(menu);
      } else {
        const categoriaSelect = document.getElementById('categoria');
        if (categoriaSelect) categoriaSelect.value = String(menu.categoriaId || '');
        if (typeof cargarMenus === 'function') await cargarMenus();
      }
    } catch (error) {
      console.warn('No se pudo cargar el menu para editar:', error);
    }
    st.indiceMenuEditando = index;

    const paxEl = document.getElementById('pax');
    if (paxEl) {
      paxEl.value = Number(menu.pax || menu.pax_adicional || 0) || '';
      window.pax = Number(paxEl.value) || 0;
      paxEl.dispatchEvent(new Event('input', { bubbles: true }));
      paxEl.dispatchEvent(new Event('change', { bubbles: true }));
    }

    const menajeEl = document.getElementById('tipo_menaje');
    if (menajeEl && menu.tipo_menaje) {
      menajeEl.value = menu.tipo_menaje;
      menajeEl.dispatchEvent(new Event('change', { bubbles: true }));
    }

    restaurarDesayunoMenuEdicion(menu);
    restaurarReferenciasMenuEdicion(menu);
    restaurarFoodboxLunchMenuEdicion(menu);
    restaurarBandejasMenuEdicion(menu);

    const categoriaEdicion = inferirCategoriaMenuResumen(menu);
    const requiereLogisticaMenu = [1, 2, 4, 5, 6].includes(categoriaEdicion);

    const materialParaEditar = materialTieneItems(menu.material)
      ? menu.material
      : null;

    if (materialParaEditar) {
      programarRestauracionMaterialMenuEdicion(materialParaEditar, categoriaEdicion, index);
    } else if (menu.material && window.materialLogistica) {
      const automaticos = {
        bebidas: (window.materialLogistica.bebidas || []).filter(item => item._zumoId),
        menaje: (window.materialLogistica.menaje || []).filter(item => item._menaje_desayuno || item._extras_desayuno || item._menaje_foodbox || item._extras_foodbox),
        extras: (window.materialLogistica.extras || []).filter(item => item._menaje_desayuno || item._extras_desayuno || item._menaje_foodbox || item._extras_foodbox)
      };
      const material = window.normalizarMaterialLogistica(menu.material);
      if (automaticos.bebidas.length) {
        material.bebidas = [
          ...automaticos.bebidas,
          ...(material.bebidas || []).filter(item => claveMaterialAcumulado(item, 'bebidas') !== 'bebidas:zumo-naranja-natural')
        ];
      }
      ['menaje', 'extras'].forEach(tipo => {
        automaticos[tipo].forEach(item => {
          const key = claveMaterialAcumulado(item, tipo);
          if (!(material[tipo] || []).some(actual => claveMaterialAcumulado(actual, tipo) === key)) {
            material[tipo].push(item);
          }
        });
      });
      window.materialLogistica = {
        bebidas: material.bebidas || [],
        menaje: material.menaje || [],
        extras: material.extras || [],
        catalogoCompleto: window.materialLogistica.catalogoCompleto,
        isAdmin: window.materialLogistica.isAdmin
      };
      if (typeof window.renderizarMaterialLogisticaActual === 'function') {
        window.renderizarMaterialLogisticaActual('materialLogisticaInline');
      }
      if (typeof window.actualizarCantidadesMaterialIncluido === 'function') {
        window.actualizarCantidadesMaterialIncluido('materialLogisticaInline');
      }
    }

    if (requiereLogisticaMenu) {
      await abrirMaterialLogisticaMenuEdicion(categoriaEdicion);
      if (materialParaEditar) {
        await restaurarMaterialMenuEnSelector(materialParaEditar, categoriaEdicion);
      }
      clearTimeout(window._abrirMaterialEdicionResumenTimer);
      window._abrirMaterialEdicionResumenTimer = setTimeout(() => {
        const sigueEditando = st.indiceMenuEditando === index || window._indiceMenuResumenEditando === index;
        if (!sigueEditando) return;
        abrirMaterialLogisticaMenuEdicion(categoriaEdicion).then(() => {
          if (materialParaEditar) return restaurarMaterialMenuEnSelector(materialParaEditar, categoriaEdicion);
          return null;
        });
      }, 300);
    }

    const btnWrap = document.getElementById('btnAnadirMenuWrap');
    if (btnWrap) btnWrap.style.display = 'flex';
    setModoEdicionResumenActivo(true);
    actualizarResumenLateral();
  };

  window.seleccionarMenuResumenParaEditar = function(index) {
    const st = window.MenusAdicionalesState;
    if (getIndiceMenuEditandoResumen() >= 0) return;
    const actual = getIndiceMenuSeleccionadoResumen();
    st.indiceMenuSeleccionadoResumen = actual === index ? -1 : index;
    actualizarResumenLateral();
  };

  window.cancelarEdicionMenuResumen = function() {
    const st = window.MenusAdicionalesState;
    if (window.comandaEditando) {
      const confirmar = confirm('¿Cancelar la edición y volver a la comanda creada? Los cambios no guardados se perderán.');
      if (!confirmar) return;

      st.indiceMenuEditando = -1;
      st.indiceMenuSeleccionadoResumen = -1;
      window._indiceMenuResumenEditando = -1;
      window._materialMenuResumenEditando = null;
      clearTimeout(window._restoreMaterialResumenTimer1);
      clearTimeout(window._restoreMaterialResumenTimer2);

      if (typeof cancelarFormularioComanda === 'function') {
        cancelarFormularioComanda();
      } else if (typeof verDetalleComanda === 'function') {
        const codigo = window.comandaEditando?.codigo || window.comandaEditando?.codigo_comanda || '';
        if (codigo) verDetalleComanda(codigo);
      }
      return;
    }

    const editandoFormulario = getIndiceMenuEditandoResumen() >= 0;
    const seleccionado = getIndiceMenuSeleccionadoResumen();
    const confirmar = confirm(
      editandoFormulario || seleccionado >= 0
        ? '¿Cancelar la selección del menú?'
        : '¿Cancelar esta comanda y volver al dashboard?'
    );
    if (!confirmar) return;

    st.indiceMenuEditando = -1;
    st.indiceMenuSeleccionadoResumen = -1;
    window._indiceMenuResumenEditando = -1;
    window._materialMenuResumenEditando = null;
    clearTimeout(window._restoreMaterialResumenTimer1);
    clearTimeout(window._restoreMaterialResumenTimer2);
    if (!editandoFormulario && seleccionado < 0 && typeof cancelarFormularioComanda === 'function') {
      cancelarFormularioComanda();
      return;
    }
    if (typeof limpiarSeccionesMenu === 'function') limpiarSeccionesMenu();
    actualizarResumenLateral();
  };

  // ─────────────────────────────────────────────────────────────
  // PÚBLICA: Eliminar un menú del resumen por índice
  // ─────────────────────────────────────────────────────────────
  window.eliminarMenuResumen = function(index) {
    const st = window.MenusAdicionalesState;
    if (index < 0 || index >= st.menusAdicionales.length) return;
    const menuEliminado = st.menusAdicionales[index];
    if (window.comandaEditando) {
      window._menusEliminadosEdicion = [
        ...(window._menusEliminadosEdicion || []),
        {
          uid: String(menuEliminado?._edicion_uid || ''),
          id: String(menuEliminado?.id || menuEliminado?.menu_id || ''),
          nombre: String(menuEliminado?.nombre || menuEliminado?.menu_principal?.nombre || '').trim().toLowerCase(),
          categoriaId: Number(menuEliminado?.categoriaId || menuEliminado?._cat || menuEliminado?.categoriaOriginalId || 0),
          pax: Number(menuEliminado?.pax || 0)
        }
      ];
    }
    const indiceEditandoActual = Number(st.indiceMenuEditando ?? -1);
    const indiceResumenEditando = Number(window._indiceMenuResumenEditando ?? -1);
    const eliminandoMenuEnEdicion = indiceEditandoActual === index || indiceResumenEditando === index;

    // Restar el material de ese menú del acumulado
    const materialEliminado = st.menusAdicionales[index].material;
    if (materialEliminado && window._materialAcumulado) {
      ['bebidas', 'menaje', 'extras'].forEach(tipo => {
        (materialEliminado[tipo] || []).forEach(item => {
          const exist = window._materialAcumulado[tipo]?.find(i => i.nombre === item.nombre);
          if (exist) {
            exist.cantidad = Math.max(0, (exist.cantidad || 0) - (item.cantidad || 0));
            if (exist.cantidad === 0) {
              window._materialAcumulado[tipo] = window._materialAcumulado[tipo].filter(i => i.nombre !== item.nombre);
            }
          }
        });
      });
    }

    st.menusAdicionales.splice(index, 1);
    if (eliminandoMenuEnEdicion) {
      st.indiceMenuEditando = -1;
      st.indiceMenuSeleccionadoResumen = -1;
      window._indiceMenuResumenEditando = -1;
      window._materialMenuResumenEditando = null;
      clearTimeout(window._restoreMaterialResumenTimer1);
      clearTimeout(window._restoreMaterialResumenTimer2);
      clearTimeout(window._abrirMaterialEdicionResumenTimer);
      if (typeof limpiarSeccionesMenu === 'function') limpiarSeccionesMenu();
      const categoria = document.getElementById('categoria');
      if (categoria) categoria.value = window.serviciosMode ? '3' : '';
      const menuIdInput = document.getElementById('menu_id');
      if (menuIdInput) menuIdInput.value = '';
      const paxEl = document.getElementById('pax');
      if (paxEl) paxEl.value = '';
      const menusContainer = document.getElementById('menusContainer');
      if (menusContainer) menusContainer.innerHTML = '';
      window.menuSeleccionado = null;
      window.referenciasSeleccionadas = { gris: [], rojo: [], postres: [] };
      Object.defineProperty(window.referenciasSeleccionadas, 'saladas', {
        get() { return this.gris; },
        set(v) { this.gris = v; },
        configurable: true
      });
      window.referenciasDesayuno = {};
      window.referenciasExtras = [];
      if (typeof setModoEdicionResumenActivo === 'function') setModoEdicionResumenActivo(false);
    } else {
      if (indiceEditandoActual > index) st.indiceMenuEditando = indiceEditandoActual - 1;
      if (indiceResumenEditando > index) window._indiceMenuResumenEditando = indiceResumenEditando - 1;
      const seleccionado = Number(st.indiceMenuSeleccionadoResumen ?? -1);
      if (seleccionado === index) st.indiceMenuSeleccionadoResumen = -1;
      else if (seleccionado > index) st.indiceMenuSeleccionadoResumen = seleccionado - 1;
    }
    window.menusAdicionales = st.menusAdicionales;
    recalcularMaterialAcumuladoDesdeMenus();

    // Actualizar PAX total
    const paxTotal = window.calcularPaxTotalComanda(st.menusAdicionales);
    const paxTotalEl = document.getElementById('paxTotalValor');
    if (paxTotalEl) paxTotalEl.textContent = paxTotal;
    const paxWrap = document.getElementById('paxTotalWrap');
    if (paxWrap) paxWrap.style.display = st.menusAdicionales.length ? 'block' : 'none';

    actualizarResumenLateral();
    console.log(`🗑️ Menú eliminado del resumen. Quedan: ${st.menusAdicionales.length}`);
  };


  // Para cat 5/6: acumular selecciones DIY y luego disparar el submit
  window._guardarComandaDIY = function () {
    const categoriaId = parseInt(document.getElementById('categoria')?.value) || 0;
    if ([5, 6].includes(categoriaId)) {
      // Acumular el menú DIY antes de guardar
      window.anadirMenuAComanda();
      // Dar un tick para que se procese y luego disparar submit
      setTimeout(() => {
        const form = document.getElementById('comandaCocinaForm');
        if (form) form.requestSubmit ? form.requestSubmit() : form.submit();
      }, 50);
    } else {
      const form = document.getElementById('comandaCocinaForm');
      if (form) form.requestSubmit ? form.requestSubmit() : form.submit();
    }
  };

})();
