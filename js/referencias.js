// ========== REFERENCIAS (Foodbox/Comida y Servicios - cat 2/3) ==========
// Paginación:
// - Saladas: 10 por página
// - Postres: 6 por página
// Mantiene selección y cantidades al cambiar de página.

if (!window.multiplicadores) window.multiplicadores = { saladas: 1, postres: 1 };
if (!window.referenciasSeleccionadas) window.referenciasSeleccionadas = { saladas: [], postres: [] };

// Estado de paginación
window.referenciasPaginacion = window.referenciasPaginacion || {
  saladas: { page: 1, perPage: 10, items: [], containerId: 'referenciasSaladasGrid', query: '' },
  postres: { page: 1, perPage: 6, items: [], containerId: 'referenciasPostresGrid', query: '' }
};

// =================== API PRINCIPAL ===================

/**
 * Carga las referencias (saladas y postres)
 * Puedes ampliar los arrays sin tocar la paginación.
 */
async function cargarReferencias() {
  // 🔹 SALADAS (ejemplo ampliado)
  const referenciasSaladas = [
    { id: 1, nombre: 'Tabla de Embutidos Ibéricos con Picos', unidad: 'bandeja' },
    { id: 2, nombre: 'Tabla de Quesos con Uva y Frutos Secos', unidad: 'bandeja' },
    { id: 3, nombre: 'Croquetas de Jamón', unidad: 'uds' },
    { id: 4, nombre: 'Mini Croissant de Salmón Ahumado', unidad: 'uds' },
    { id: 5, nombre: 'Mini Burguer con Queso', unidad: 'uds' },
    { id: 6, nombre: 'Hummus con Pan de Pita', unidad: 'bandeja' },
    { id: 7, nombre: 'Brocheta Caprese con Pesto', unidad: 'uds' },
    { id: 8, nombre: 'Tortilla de Patata con Chistorra y Padrón', unidad: 'bandeja' },
    { id: 9, nombre: 'Mini Bocadito de Tortilla Trufada', unidad: 'uds' },
    { id: 10, nombre: 'Pincho de Pollo Teriyaki', unidad: 'uds' },
    { id: 11, nombre: 'Mini Wrap de Pollo César', unidad: 'uds' },
    { id: 12, nombre: 'Mini Wrap Vegetal', unidad: 'uds' },
    { id: 13, nombre: 'Ensalada de Quinoa (bandeja)', unidad: 'bandeja' },
    { id: 14, nombre: 'Ensalada de Pasta (bandeja)', unidad: 'bandeja' },
    { id: 15, nombre: 'Gazpacho (botella)', unidad: 'uds' },
    { id: 16, nombre: 'Salmorejo (botella)', unidad: 'uds' },
    { id: 17, nombre: 'Empanadillas Variadas', unidad: 'uds' },
    { id: 18, nombre: 'Mini Sándwich Mixto', unidad: 'uds' },
    { id: 19, nombre: 'Mini Sándwich Vegetal', unidad: 'uds' },
    { id: 20, nombre: 'Mini Sándwich Pollo Curry', unidad: 'uds' },
    { id: 21, nombre: 'Cucharitas de Ensaladilla', unidad: 'uds' },
    { id: 22, nombre: 'Cucharitas de Salpicón de Marisco', unidad: 'uds' },
    { id: 23, nombre: 'Tosta de Anchoa y Tomate', unidad: 'uds' },
    { id: 24, nombre: 'Tosta de Queso de Cabra y Cebolla', unidad: 'uds' },
    { id: 25, nombre: 'Mini Bagel de Salmón', unidad: 'uds' },
    { id: 26, nombre: 'Bruschetta de Tomate y Albahaca', unidad: 'uds' },
    { id: 27, nombre: 'Brochetas de Mozzarella y Cherry', unidad: 'uds' },
    { id: 28, nombre: 'Rollitos de Primavera', unidad: 'uds' },
    { id: 29, nombre: 'Mini Tacos de Cochinita', unidad: 'uds' },
    { id: 30, nombre: 'Mini Tacos Veggie', unidad: 'uds' }
  ];

  // 🔹 POSTRES (ejemplo ampliado)
  const referenciasPostres = [
    { id: 101, nombre: 'Brocheta de Fruta Natural', unidad: 'uds' },
    { id: 102, nombre: 'Mousse de Chocolate', unidad: 'uds' },
    { id: 103, nombre: 'Macarons', unidad: 'uds' },
    { id: 104, nombre: 'Cremoso de Cheese Cake', unidad: 'uds' },
    { id: 105, nombre: 'Arroz con Leche', unidad: 'uds' },
    { id: 106, nombre: 'Brownie', unidad: 'uds' },
    { id: 107, nombre: 'Mini Tartaleta de Limón', unidad: 'uds' },
    { id: 108, nombre: 'Mini Carrot Cake', unidad: 'uds' },
    { id: 109, nombre: 'Vasito Tiramisú', unidad: 'uds' },
    { id: 110, nombre: 'Mini Donuts', unidad: 'uds' },
    { id: 111, nombre: 'Cookies', unidad: 'uds' },
    { id: 112, nombre: 'Mini Napolitana de Chocolate', unidad: 'uds' },
    { id: 113, nombre: 'Mini Ensaimada', unidad: 'uds' },
    { id: 114, nombre: 'Mini Cupcake', unidad: 'uds' },
    { id: 115, nombre: 'Fruta cortada (bandeja)', unidad: 'bandeja' },
    { id: 116, nombre: 'Yogur con Granola', unidad: 'uds' },
    { id: 117, nombre: 'Panna Cotta', unidad: 'uds' },
    { id: 118, nombre: 'Mini Profiteroles', unidad: 'uds' }
  ];

  // Inicializa paginación y renderiza página 1
  initReferenciasPaginadas('saladas', referenciasSaladas, 'referenciasSaladasGrid', 10);
  initReferenciasPaginadas('postres', referenciasPostres, 'referenciasPostresGrid', 6);
}

function ensureBuscador(tipo) {
  const st = window.referenciasPaginacion[tipo];
  const container = document.getElementById(st.containerId);
  if (!container) return;

  // Evita duplicarlo
  if (document.getElementById(`${st.containerId}__search`)) return;

  const wrapper = document.createElement('div');
  wrapper.className = 'referencias-search';
  wrapper.innerHTML = `
    <input
      id="${st.containerId}__search"
      type="text"
      placeholder="Buscar ${tipo === 'saladas' ? 'saladas' : 'dulces'}…"
      value="${st.query || ''}"
      autocomplete="off"
    />
    <button type="button" id="${st.containerId}__clear" class="search-clear hidden" aria-label="Limpiar búsqueda">
      <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true">
        <path d="M18 6L6 18M6 6l12 12" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
      </svg>
    </button>
  `;

  // Insertar arriba del grid (sin romper layout)
  container.parentNode.insertBefore(wrapper, container);

  const input = document.getElementById(`${st.containerId}__search`);
  const clear = document.getElementById(`${st.containerId}__clear`);

  const syncClearVisibility = () => {
    if (!clear) return;
    const hasText = !!(input && input.value && input.value.trim().length > 0);
    clear.classList.toggle('hidden', !hasText);
  };

  syncClearVisibility();

  if (input) {
    input.addEventListener('input', () => {
      st.query = input.value || '';
      st.page = 1;
      syncClearVisibility();
      renderReferenciasPagina(tipo);
    });
  }

  if (clear) {
    clear.addEventListener('click', () => {
      st.query = '';
      if (input) input.value = '';
      st.page = 1;
      syncClearVisibility();
      renderReferenciasPagina(tipo);
      input?.focus();
    });
  }
}

function normalizarTexto(s) {
  return (s || '')
    .toString()
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
}

function getItemsFiltrados(tipo) {
  const st = window.referenciasPaginacion[tipo];
  const q = normalizarTexto(st.query || '');
  if (!q) return st.items || [];
  return (st.items || []).filter(ref => normalizarTexto(ref.nombre).includes(q));
}


/**
 * Actualiza cantidades de referencias (se ejecuta al cambiar PAX o multiplicadores)
 */
function actualizarCantidadesReferencias() {
  const cantidadSaladas = Math.ceil((window.pax || 0) * (window.multiplicadores.saladas || 1));
  const cantidadPostres = Math.ceil((window.pax || 0) * (window.multiplicadores.postres || 1));

  // Solo inputs visibles (página actual)
  document.querySelectorAll('.referencia-option[data-tipo="saladas"] .cantidad-input').forEach(input => {
    input.value = cantidadSaladas;
  });
  document.querySelectorAll('.referencia-option[data-tipo="postres"] .cantidad-input').forEach(input => {
    input.value = cantidadPostres;
  });

  // Y también sincroniza seleccionadas (todas las páginas)
  window.referenciasSeleccionadas.saladas.forEach(ref => { ref.cantidad = cantidadSaladas; });
  window.referenciasSeleccionadas.postres.forEach(ref => { ref.cantidad = cantidadPostres; });
}

function actualizarCantidadReferencia(refId, tipo, cantidad) {
  const ref = window.referenciasSeleccionadas[tipo].find(r => String(r.id) === String(refId));
  if (ref) ref.cantidad = parseInt(cantidad) || 1;
}

function actualizarUnidadReferencia(refId, tipo, unidad) {
  const ref = window.referenciasSeleccionadas[tipo].find(r => String(r.id) === String(refId));
  if (ref) ref.unidad = unidad || 'uds';
}

// =================== PAGINACIÓN ===================

function initReferenciasPaginadas(tipo, referencias, containerId, perPage) {
  window.referenciasPaginacion[tipo] = {
    page: 1,
    perPage,
    items: referencias,
    containerId,
    query: window.referenciasPaginacion?.[tipo]?.query || '' // conserva si ya existía
  };

  ensureBuscador(tipo);
  renderReferenciasPagina(tipo);
}

function renderReferenciasPagina(tipo) {
  const st = window.referenciasPaginacion[tipo];
  const container = document.getElementById(st.containerId);
  if (!container) return;

  // Asegura que conserve el layout tipo "grid" de tu diseño anterior
  container.classList.add('referencias-grid');

const items = getItemsFiltrados(tipo);
const total = items.length;
const totalPages = Math.max(1, Math.ceil(total / st.perPage));

if (st.page > totalPages) st.page = totalPages;
if (st.page < 1) st.page = 1;

const start = (st.page - 1) * st.perPage;
const end = start + st.perPage;
const slice = items.slice(start, end);

  // Limpia el contenedor, pero pintamos las cards DIRECTO dentro (sin wrappers)
  container.innerHTML = '';

  const cantidadBase = Math.ceil((window.pax || 0) * (window.multiplicadores[tipo] || 1));

  slice.forEach(ref => {
    const div = document.createElement('div');
    div.className = 'referencia-option';
    div.dataset.id = String(ref.id);
    div.dataset.nombre = ref.nombre;
    div.dataset.tipo = tipo;

    const selected = window.referenciasSeleccionadas[tipo].find(r => String(r.id) === String(ref.id));
    const cantidad = selected ? (selected.cantidad || cantidadBase) : cantidadBase;
    const unidad = selected ? (selected.unidad || ref.unidad) : ref.unidad;

    div.innerHTML = `
      <span style="flex:1;">${ref.nombre}</span>
      <div class="cantidad-control">
        <input type="number" class="cantidad-input" value="${cantidad}" min="1"
               onchange="actualizarCantidadReferencia(${ref.id}, '${tipo}', this.value)">
        <select class="unidad-select" onchange="actualizarUnidadReferencia(${ref.id}, '${tipo}', this.value)">
          <option value="uds" ${unidad === 'uds' ? 'selected' : ''}>uds</option>
          <option value="kg" ${unidad === 'kg' ? 'selected' : ''}>kg</option>
          <option value="l" ${unidad === 'l' ? 'selected' : ''}>l</option>
          <option value="bandeja" ${unidad === 'bandeja' ? 'selected' : ''}>bandeja</option>
          <option value="caja" ${unidad === 'caja' ? 'selected' : ''}>caja</option>
        </select>
      </div>
    `;

    div.onclick = (e) => {
      if (!e.target.classList.contains('cantidad-input') && !e.target.classList.contains('unidad-select')) {
        seleccionarReferenciaPrincipal(ref.id, ref.nombre, tipo, div);
      }
    };

    if (selected) div.classList.add('selected');
    container.appendChild(div);
  });

  // Paginador sutil abajo (uno por contenedor)
  const pager = document.createElement('div');
  pager.className = 'pager-sutil';
  pager.innerHTML = `
    <button type="button" class="pager-btn" data-dir="-1" aria-label="Anterior">‹</button>
    <span class="pager-text">${st.page} / ${totalPages}</span>
    <button type="button" class="pager-btn" data-dir="1" aria-label="Siguiente">›</button>
  `;

  const prev = pager.querySelector('[data-dir="-1"]');
  const next = pager.querySelector('[data-dir="1"]');

  if (prev) {
    prev.disabled = (st.page <= 1);
    prev.onclick = () => { st.page -= 1; renderReferenciasPagina(tipo); };
  }
  if (next) {
    next.disabled = (st.page >= totalPages);
    next.onclick = () => { st.page += 1; renderReferenciasPagina(tipo); };
  }

  container.appendChild(pager);
}

// =================== SELECCIÓN (mantiene estado entre páginas) ===================

function seleccionarReferenciaPrincipal(refId, refNombre, tipo, element) {
  const max = tipo === 'saladas' ? (window.menuSeleccionado?.items_salados_max || 0) : (window.menuSeleccionado?.items_postres_max || 0);
  const seleccionadas = window.referenciasSeleccionadas[tipo];

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

  const cantidadInput = element?.querySelector('.cantidad-input')?.value;
  const unidadSelect = element?.querySelector('.unidad-select')?.value;

  seleccionadas.push({
    id: String(refId),
    nombre: refNombre,
    cantidad: parseInt(cantidadInput) || 1,
    unidad: unidadSelect || 'uds'
  });

  if (element) element.classList.add('selected');
}
