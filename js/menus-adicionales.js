
// =====================================================
// MENÚS ADICIONALES (Modal + gestión) - versión aislada
// Evita colisiones globales usando un estado en window.
// =====================================================

(function () {
  // ---------- Estado aislado ----------
  window.MenusAdicionalesState = window.MenusAdicionalesState || {
    indiceMenuEditando: -1, // -1 = nuevo, >=0 = editando
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
        { id: 16, nombre: 'BANDEJAS PREPARADAS', descripcion: 'Selección de bandejas', items_salados_min: 0, items_salados_max: 0, items_postres_min: 0, items_postres_max: 0 },
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
  window.mostrarModalMenus = function () {
    const st = window.MenusAdicionalesState;

    show('modalMenus');
    if ($('modalCategoria')) $('modalCategoria').value = '';
    if ($('modalMenusContainer')) $('modalMenusContainer').innerHTML = '';

    hide('modalMultiplicadorSection');
    hide('modalReferenciasSection');
    hide('modalPaxSection'); // si existe en tu HTML

    st.menuSeleccionadoModal = null;
    st.indiceMenuEditando = -1;
    st.referenciasTemporales = { saladas: [], postres: [] };
    st.multiplicadoresTemporales = { saladas: 1, postres: 1 };
    st.paxTemporal = 0;

    if ($('modalPaxAdicional')) $('modalPaxAdicional').value = '';
    if ($('modalMultiplicadorSaladasAdicional')) $('modalMultiplicadorSaladasAdicional').value = '1';
    if ($('modalMultiplicadorPostresAdicional')) $('modalMultiplicadorPostresAdicional').value = '1';
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
  function renderReferenciasModal(referencias, containerId, tipo) {
    const container = $(containerId);
    if (!container) return;

    container.innerHTML = '';
    const st = window.MenusAdicionalesState;

    const pax = st.paxTemporal || parseInt($('modalPaxAdicional')?.value) || 0;
    const mult = st.multiplicadoresTemporales[tipo] || 1;
    const cantidadBase = Math.max(1, Math.ceil(pax * mult));

    referencias.forEach(ref => {
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
    window.mostrarModalMenus();
    st.indiceMenuEditando = index;

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

    // Recalcular cantidades en referencias si existen
    if (item.multiplicadores && item.referencias) {
      const ms = item.multiplicadores.saladas || 1;
      const mp = item.multiplicadores.postres || 1;

      const cantSal = Math.max(1, Math.ceil(nuevoPax * ms));
      const cantPos = Math.max(1, Math.ceil(nuevoPax * mp));

      item.referencias.saladas?.forEach(r => { r.cantidad = cantSal; });
      item.referencias.postres?.forEach(r => { r.cantidad = cantPos; });
    }

    actualizarListaMenusAdicionalesCompleta();
  };

})();
