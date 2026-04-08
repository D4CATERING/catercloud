// =====================================================
// BANDEJAS PREPARADAS (Cat 5)
// - Saladas y Dulces
// - Grid 2 columnas (referencias-grid)
// - Cards iguales a Comida / Servicios (referencia-option)
// - Buscador por sección
// - Paginador abajo
// =====================================================

(function () {

  // ---------------- ESTADO ----------------
  window.BandejasState = window.BandejasState || {
    saladas: { page: 1, perPage: 10, items: [], selected: [], query: '' },
    dulces:  { page: 1, perPage: 6,  items: [], selected: [], query: '' }
  };

  const $ = (id) => document.getElementById(id);

  // ---------------- DATA (SIN PRECIOS) ----------------
  function getBandejasData() {
    return {
      saladas: [
        { id: 501, nombre: "Tabla de Jamón Ibérico con picos 500 gr" },
        { id: 502, nombre: "Tabla de Paletilla Ibérica con picos 500 gr" },
        { id: 503, nombre: "Tabla de Quesos con Uva y Frutos Secos 500 gr" },
        { id: 504, nombre: "Croquetas de Jamón / Pollo 24 uds" },
        { id: 505, nombre: "Tortilla de Patata con Chistorra y/o Padrón" },
        { id: 506, nombre: "Quiche Lorraine puerro y bacon 8 raciones" },
        { id: 507, nombre: "Quiche de Queso con Tomate y Verduras 8 raciones" },
        { id: 508, nombre: "Quiche de Jamón Ibérico con Cebolla Caramelizada" },
        { id: 509, nombre: "Mini Croissant Mixto 24 uds" },
        { id: 510, nombre: "Mini Croissant Paletilla con Tomate 24 uds" },
        { id: 511, nombre: "Mini Croissant con Salmón Ahumado 24 uds" },
        { id: 512, nombre: "Mini Bagel de Salmón / Pastrami / RoastBeef 24 uds" },
        { id: 513, nombre: "Mini Burguer con Queso 24 uds" },
        { id: 514, nombre: "Mini Empanadilla Criolla 36 uds" },
        { id: 515, nombre: "Mini Empanadilla Calabaza & Bacon 36 uds" },
        { id: 516, nombre: "Mini Empanadilla Espinaca con Pasas 36 uds" },
        { id: 517, nombre: "Mini Quesadillas Sincronizadas 24 uds" },
        { id: 518, nombre: "Mini Taco Cochinita Pibil 24 uds" },
        { id: 519, nombre: "Mini Bao de Costilla BBQ 24 uds" },
        { id: 520, nombre: "Mini Sandwich Variado 36 uds" }
      ],
      dulces: [
        { id: 601, nombre: "Mini bollería 30 uds" },
        { id: 602, nombre: "Mini carrot cakes 30 uds" },
        { id: 603, nombre: "Mini tarta Idiazabal 30 uds" }
      ]
    };
  }

  // ---------------- HELPERS ----------------
  function normalizar(txt) {
    return (txt || '')
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '');
  }

  function getFiltrados(tipo) {
    const st = window.BandejasState[tipo];
    if (!st.query) return st.items;
    const q = normalizar(st.query);
    return st.items.filter(i => normalizar(i.nombre).includes(q));
  }

  function getSelected(tipo, id) {
    return window.BandejasState[tipo].selected.find(x => x.id === id);
  }

  // ---------------- BUSCADOR ----------------
  function ensureBuscador(tipo, gridId) {
    const st = window.BandejasState[tipo];
    const grid = $(gridId);
    if (!grid || $(gridId + '__search')) return;

    const wrap = document.createElement('div');
    wrap.className = 'referencias-search';
    wrap.innerHTML = `
      <input id="${gridId}__search" type="text" placeholder="Buscar ${tipo}…" />
      <button type="button" id="${gridId}__clear" class="search-clear hidden">
        <svg viewBox="0 0 24 24" width="16" height="16">
          <path d="M18 6L6 18M6 6l12 12"
                fill="none" stroke="currentColor" stroke-width="2"
                stroke-linecap="round"/>
        </svg>
      </button>
    `;

    grid.parentNode.insertBefore(wrap, grid);

    const input = $(gridId + '__search');
    const clear = $(gridId + '__clear');

    const sync = () => {
      clear.classList.toggle('hidden', !input.value);
    };

    input.addEventListener('input', () => {
      st.query = input.value;
      st.page = 1;
      sync();
      render(tipo);
    });

    clear.addEventListener('click', () => {
      st.query = '';
      input.value = '';
      st.page = 1;
      sync();
      render(tipo);
      input.focus();
    });

    sync();
  }

  // ---------------- RENDER ----------------
  function render(tipo) {
    const st = window.BandejasState[tipo];
    const gridId = tipo === 'saladas' ? 'bandejasSaladasGrid' : 'bandejasDulcesGrid';
    const grid = $(gridId);
    if (!grid) return;

    ensureBuscador(tipo, gridId);
    grid.classList.add('referencias-grid');
    grid.innerHTML = '';

    const items = getFiltrados(tipo);
    const totalPages = Math.max(1, Math.ceil(items.length / st.perPage));
    if (st.page > totalPages) st.page = totalPages;

    const slice = items.slice(
      (st.page - 1) * st.perPage,
      st.page * st.perPage
    );

    slice.forEach(item => {
      const sel = getSelected(tipo, item.id);
      const qty = sel ? sel.cantidad : 1;

      const card = document.createElement('div');
      card.className = 'referencia-option';
      if (sel) card.classList.add('selected');

      card.innerHTML = `
        <span style="flex:1">${item.nombre}</span>
        <div class="cantidad-control">
          <input class="cantidad-input" type="number" min="1" value="${qty}">
          <span style="font-size:.85rem;color:#64748b">bandeja</span>
        </div>
      `;

      card.onclick = (e) => {
        if (e.target.classList.contains('cantidad-input')) return;
        if (sel) {
          st.selected = st.selected.filter(x => x.id !== item.id);
          card.classList.remove('selected');
        } else {
          st.selected.push({ id: item.id, nombre: item.nombre, cantidad: qty });
          card.classList.add('selected');
        }
      };

      card.querySelector('input').onchange = (e) => {
        if (sel) sel.cantidad = parseInt(e.target.value) || 1;
      };

      grid.appendChild(card);
    });

    // ---------- PAGER ----------
    const pager = document.createElement('div');
    pager.className = 'pager-sutil';
    pager.innerHTML = `
      <button ${st.page === 1 ? 'disabled' : ''}>‹</button>
      <span>${st.page} / ${totalPages}</span>
      <button ${st.page === totalPages ? 'disabled' : ''}>›</button>
    `;

    const [prev, , next] = pager.children;
    prev.onclick = () => { st.page--; render(tipo); };
    next.onclick = () => { st.page++; render(tipo); };

    grid.appendChild(pager);
  }

  // ---------------- UI ----------------
  function ensureSection() {
    if ($('bandejasPreparadasSection')) return;

    const ref = $('referenciasSection') || document.body;
    const div = document.createElement('div');
    div.className = 'form-section';
    div.id = 'bandejasPreparadasSection';
    div.style.display = 'none';
    div.innerHTML = `
      <h3>🍽️ Bandejas Preparadas</h3>

      <h4>🥪 Saladas</h4>
      <div id="bandejasSaladasGrid"></div>

      <h4 style="margin-top:20px">🍰 Dulces</h4>
      <div id="bandejasDulcesGrid"></div>
    `;
    ref.insertAdjacentElement('afterend', div);
  }

  // ---------------- API ----------------
  window.cargarBandejasPreparadas = function () {
    ensureSection();
    const sec = $('bandejasPreparadasSection');
    sec.style.display = 'block';

    const data = getBandejasData();
    window.BandejasState.saladas.items = data.saladas;
    window.BandejasState.dulces.items = data.dulces;

    render('saladas');
    render('dulces');
  };

})();
