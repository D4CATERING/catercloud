// ========== CALENDARIO ==========
let currentYear = new Date().getFullYear();
let currentMonth = new Date().getMonth();
let selectedDate = new Date();

const MONTH_NAMES = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
];

function formatoFechaLocal(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

function getEventosPorFecha() {
    const historial = JSON.parse(localStorage.getItem('historialComandas') || '[]');
    const historialLogistica = JSON.parse(localStorage.getItem('historialComandasLogistica') || '[]');
    const codigosConLogistica = new Set(historialLogistica.map(item => item.codigo_cocina || item.codigo).filter(Boolean));
    const map = {};

    historial.forEach(c => {
        const fecha = (c.fecha_evento || '').split('T')[0];
        if (!fecha) return;
        if (!map[fecha]) map[fecha] = [];

        map[fecha].push({
            codigo: c.codigo || '',
            empresa: c.empresa || 'Pendiente',
            pax: c.pax || c.pax_total || 0,
            menu: c.menu_principal?.nombre || c.menu_categoria_nombre || (c.tipo_registro === 'solicitud' ? 'Solicitud' : 'Pendiente'),
            hora: c.logistica_inline?.hora_entrega || c.hora_salida || '',
            estado: c.estado || 'creada',
            tipo: c.tipo_registro || 'comanda',
            tieneLogistica: !!c.documentos?.logistica || codigosConLogistica.has(c.codigo || ''),
        });
    });

    Object.values(map).forEach(arr =>
        arr.sort((a, b) => (a.hora || '').localeCompare(b.hora || ''))
    );

    return map;
}

function cargarCalendario() {
    const calendarDays = document.getElementById('calendarDays');
    if (!calendarDays) return;
    calendarDays.innerHTML = '';

    const eventos = getEventosPorFecha();
    const firstDay = new Date(currentYear, currentMonth, 1);
    const lastDay = new Date(currentYear, currentMonth + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startOffset = (firstDay.getDay() + 6) % 7;
    const today = new Date();
    const monthTitle = document.getElementById('calendarMonthTitle');

    if (monthTitle) monthTitle.textContent = `${MONTH_NAMES[currentMonth]} ${currentYear}`;

    for (let i = 0; i < startOffset; i++) {
        const empty = document.createElement('div');
        empty.className = 'calendar-day empty';
        calendarDays.appendChild(empty);
    }

    for (let day = 1; day <= daysInMonth; day++) {
        const date = new Date(currentYear, currentMonth, day);
        const dateStr = formatoFechaLocal(date);
        const evs = eventos[dateStr] || [];
        const el = document.createElement('div');
        el.className = 'calendar-day';

        const isToday = today.getFullYear() === currentYear &&
            today.getMonth() === currentMonth &&
            today.getDate() === day;
        const isSelected = date.toDateString() === selectedDate.toDateString();
        const isPast = date < new Date(today.getFullYear(), today.getMonth(), today.getDate());

        if (isToday) el.classList.add('today');
        if (isSelected) el.classList.add('selected');
        if (isPast && !isToday) el.classList.add('past');
        if (evs.length) el.classList.add('has-events');

        el.innerHTML = `
            <span class="day-number">${day}</span>
            ${evs.length ? `<span class="day-badge">${evs.length}</span>` : ''}
        `;

        el.onclick = () => seleccionarDia(date);
        calendarDays.appendChild(el);
    }

    _renderEventosDia(eventos);
}

function cambiarMes(delta) {
    currentMonth += delta;
    if (currentMonth < 0) { currentMonth = 11; currentYear--; }
    if (currentMonth > 11) { currentMonth = 0; currentYear++; }
    cargarCalendario();
}

function seleccionarDia(date) {
    selectedDate = date;
    cargarCalendario();
}

function _renderEventosDia(eventosPorFecha) {
    const eventList = document.getElementById('eventList');
    const titleEl = document.getElementById('selectedDateTitle');
    if (!eventList) return;

    const dateStr = formatoFechaLocal(selectedDate);
    const evs = eventosPorFecha[dateStr] || [];
    const isToday = selectedDate.toDateString() === new Date().toDateString();
    const label = isToday
        ? 'Hoy'
        : `${selectedDate.getDate()} de ${MONTH_NAMES[selectedDate.getMonth()]}`;

    if (titleEl) titleEl.textContent = label;

    const estadoBadge = {
        creada: { cls: 'badge-creada', label: 'Creada' },
        proceso: { cls: 'badge-proceso', label: 'En proceso' },
        completada: { cls: 'badge-completada', label: 'Completada' },
        negociacion: { cls: 'badge-negociacion', label: 'Negociacion' },
        por_confirmar: { cls: 'badge-por-confirmar', label: 'Por confirmar' },
        confirmado: { cls: 'badge-confirmado', label: 'Confirmado' },
        anulada: { cls: 'badge-anulada', label: 'Anulado' },
    };

    const btnHtml = `
        <div class="event-actions" data-requires-write>
            <button class="event-new-btn" onclick="nuevaComandaEnFecha('${dateStr}')">
                + Crear comanda
            </button>
            <button class="event-service-btn" onclick="nuevoServicioEnFecha('${dateStr}')">
                + Crear servicio
            </button>
            <button class="event-secondary-btn" onclick="nuevaSolicitudEnFecha('${dateStr}')">
                + Crear solicitud
            </button>
        </div>`;

    if (!evs.length) {
        eventList.innerHTML = `
            <div class="event-empty">
                <div class="event-empty-icon">--</div>
                <div>Sin pedidos este dia</div>
            </div>
            ${btnHtml}`;
        if (window.AppPermissions) AppPermissions.applyUI();
        return;
    }

    const itemsHtml = evs.map(ev => {
        const badge = estadoBadge[ev.estado] || estadoBadge.creada;
        return `
        <div class="event-item" onclick="verExpedientePedido('${ev.codigo}')">
            <div class="event-header">
                ${ev.hora ? `<span class="event-time">${ev.hora}</span>` : ''}
                <span class="event-badge ${badge.cls}">${badge.label}</span>
            </div>
            <div class="event-empresa">${ev.empresa}</div>
            <div class="event-meta">
                <span>${ev.menu}</span>
                <span class="event-sep">-</span>
                <span>${ev.pax} pax</span>
            </div>
            <div class="event-codigo">${ev.codigo}</div>
        </div>`;
    }).join('');

    eventList.innerHTML = itemsHtml + btnHtml;
    if (window.AppPermissions) AppPermissions.applyUI();
}

function nuevaComandaEnFecha(dateStr) {
    if (window.AppPermissions && !AppPermissions.requireWrite('Tu usuario solo puede consultar. No puede crear comandas.')) {
        return;
    }

    if (typeof mostrarComandaCocina === 'function') {
        mostrarComandaCocina();
    }

    const fechaInput = document.getElementById('fecha_evento');
    if (fechaInput) fechaInput.value = dateStr;
}

function nuevoServicioEnFecha(dateStr) {
    if (window.AppPermissions && !AppPermissions.requireWrite('Tu usuario solo puede consultar. No puede crear servicios.')) {
        return;
    }

    if (typeof mostrarServicios === 'function') {
        mostrarServicios();
    }

    const fechaInput = document.getElementById('fecha_evento');
    if (fechaInput) fechaInput.value = dateStr;
}

function getOpcionesMenuSolicitud() {
    return [
        { id: 'welcome', nombre: 'Welcome coffee' },
        { id: 'healthy', nombre: 'Healthy' },
        { id: 'classic', nombre: 'Classic' },
        { id: 'premium', nombre: 'Premium' },
        { id: 'veggie_desayuno', nombre: 'Veggie desayuno' },
        { id: 'basic', nombre: 'Basic' },
        { id: 'economico', nombre: 'Económico' },
        { id: 'medio', nombre: 'Medio' },
        { id: 'muytop', nombre: 'MuyTop' },
        { id: 'veggie_foodbox', nombre: 'Veggie foodbox' },
        { id: 'foodbox_lunch', nombre: 'Foodbox Lunch' },
        { id: 'diy_desayunos', nombre: 'Do It Yourself Desayunos' },
        { id: 'diy_foodbox', nombre: 'Do It Yourself Foodbox' },
        { id: 'brindis', nombre: 'Brindis' },
        { id: 'networking', nombre: 'Networking' },
        { id: 'afterwork', nombre: 'Afterwork' },
        { id: 'alucinancia', nombre: 'Alucinancia' },
        { id: 'decuatro', nombre: 'Decuatro' },
        { id: 'atractividad', nombre: 'Atractividad' }
    ];
}

async function nuevaSolicitudEnFecha(dateStr) {
    if (window.AppPermissions && !AppPermissions.requireWrite('Tu usuario solo puede consultar. No puede crear solicitudes.')) {
        return;
    }

    const cont = document.getElementById('solicitudFormCalendario');
    if (!cont) return;

    const opcionesMenu = getOpcionesMenuSolicitud()
        .map(menu => `<option value="${menu.id}">${menu.nombre}</option>`)
        .join('');

    cont.style.display = 'block';
    cont.innerHTML = `
        <div class="calendar-request-title">Solicitud de pedido</div>
        <div class="calendar-request-grid">
            <label>
                <span>Hora de salida</span>
                <input type="time" id="solHoraSalida">
            </label>
            <label>
                <span>Empresa</span>
                <div class="calendar-client-search">
                    <input type="text" id="solEmpresa" placeholder="Buscar empresa" autocomplete="off" oninput="buscarClientesSolicitud(this.value)">
                    <input type="hidden" id="solClienteId">
                    <div id="solClientesSugerencias" class="calendar-client-results"></div>
                </div>
            </label>
            <label>
                <span>Menu</span>
                <select id="solCategoriaMenu">
                    <option value="">Selecciona menú</option>
                    ${opcionesMenu}
                </select>
            </label>
            <label>
                <span>PAX</span>
                <input type="number" id="solPax" min="0" placeholder="0">
            </label>
        </div>
        <div class="calendar-request-status">Estado: <strong>POR CONFIRMAR</strong></div>
        <div class="calendar-request-actions">
            <button type="button" class="event-secondary-btn" onclick="guardarSolicitudDesdeCalendario('${dateStr}')">Crear carpeta</button>
            <button type="button" class="calendar-request-cancel" onclick="cerrarSolicitudCalendario()">Cancelar</button>
        </div>`;
}

function cerrarSolicitudCalendario() {
    const cont = document.getElementById('solicitudFormCalendario');
    if (cont) {
        cont.style.display = 'none';
        cont.innerHTML = '';
    }
}

async function guardarSolicitudDesdeCalendario(dateStr) {
    if (window.AppPermissions && !AppPermissions.requireWrite('Tu usuario solo puede consultar. No puede crear solicitudes.')) {
        return;
    }

    const empresaInput = document.getElementById('solEmpresa');
    const clienteIdInput = document.getElementById('solClienteId');
    const horaInput = document.getElementById('solHoraSalida');
    const categoriaInput = document.getElementById('solCategoriaMenu');
    const paxInput = document.getElementById('solPax');

    const empresa = (empresaInput?.value || '').trim();
    const clienteId = clienteIdInput?.value || '';
    const categoriaId = categoriaInput?.value || '';
    const categoriaNombre = categoriaInput?.selectedOptions?.[0]?.textContent || 'Pendiente';
    const pax = Number(paxInput?.value || 0) || 0;

    if (!empresa || !clienteId) {
        alert('Selecciona una empresa de la base de clientes.');
        empresaInput?.focus();
        return;
    }

    const clienteSeleccionado = window._solicitudClienteSeleccionado || {};
    const usuarioActualNombre = typeof obtenerNombreUsuarioActual === 'function'
        ? obtenerNombreUsuarioActual()
        : (window.currentUser?.email || '');

    const solicitud = {
        tipo_registro: 'solicitud',
        codigo: generarCodigoComanda(),
        empresa,
        cliente_id: clienteId,
        responsable: usuarioActualNombre || 'Pendiente',
        cliente_contacto: clienteSeleccionado.contacto || '',
        cliente_telefono: clienteSeleccionado.telefono || '',
        cliente_direccion: clienteSeleccionado.direccion || '',
        cliente_codigo_postal: clienteSeleccionado.codigo_postal || '',
        creado_por_id: window.currentUser?.id || null,
        creado_por_nombre: usuarioActualNombre,
        creado_por_email: window.currentUser?.email || '',
        pax,
        pax_total: pax,
        fecha_evento: dateStr,
        hora_salida: horaInput?.value || '',
        menu_categoria: categoriaId,
        menu_categoria_nombre: categoriaNombre,
        fecha_creacion: new Date().toISOString(),
        fecha_modificacion: new Date().toISOString(),
        estado: 'por_confirmar',
        version: 1,
        menu_principal: categoriaId ? { id: categoriaId, nombre: categoriaNombre } : null,
        notas: 'Solicitud por confirmar. Comanda pendiente de generar.'
    };

    guardarComandaEnHistorialLocal(solicitud);

    if (typeof sincronizarSolicitudPedido === 'function') {
        await sincronizarSolicitudPedido(solicitud);
    }

    cargarCalendario();

    if (typeof verExpedientePedido === 'function') {
        verExpedientePedido(solicitud.codigo);
    }
}

let _solicitudClientesTimer = null;

function buscarClientesSolicitud(term) {
    const clienteIdInput = document.getElementById('solClienteId');
    const results = document.getElementById('solClientesSugerencias');

    if (clienteIdInput) clienteIdInput.value = '';
    window._solicitudClienteSeleccionado = null;

    clearTimeout(_solicitudClientesTimer);

    const texto = (term || '').trim();
    if (!results) return;

    if (texto.length < 2) {
        results.style.display = 'none';
        results.innerHTML = '';
        return;
    }

    _solicitudClientesTimer = setTimeout(() => cargarClientesSolicitud(texto), 250);
}

async function cargarClientesSolicitud(term) {
    const results = document.getElementById('solClientesSugerencias');
    if (!results || !window.supabaseClient) return;
    window._solicitudTerminoBusqueda = term;

    try {
        const { data, error } = await window.supabaseClient
            .from('clients')
            .select('id, empresa, contacto, telefono, direccion, codigo_postal')
            .ilike('empresa', `%${term}%`)
            .eq('activo', true)
            .order('empresa')
            .limit(8);

        if (error) throw error;

        if (!data || !data.length) {
            results.innerHTML = `
                <div class="calendar-client-empty">No aparece en clientes</div>
                <button type="button" class="calendar-client-create" onclick="crearClienteDesdeSolicitud()">
                    + Crear "${term}" como nuevo cliente
                </button>`;
            results.style.display = 'block';
            return;
        }

        window._solicitudClientesResultados = data;
        results.innerHTML = data.map((cliente, index) => `
            <button type="button" class="calendar-client-option" onclick="seleccionarClienteSolicitud(${index})">
                <strong>${cliente.empresa || ''}</strong>
                <span>${cliente.contacto || 'Sin contacto'}${cliente.telefono ? ' - ' + cliente.telefono : ''}</span>
            </button>
        `).join('') + `
            <button type="button" class="calendar-client-create" onclick="crearClienteDesdeSolicitud()">
                + Crear "${term}" como nuevo cliente
            </button>`;
        results.style.display = 'block';
    } catch (error) {
        console.warn('No se pudo buscar clientes para la solicitud:', error);
        results.innerHTML = '<div class="calendar-client-empty">No se pudo cargar clientes</div>';
        results.style.display = 'block';
    }
}

function seleccionarClienteSolicitud(index) {
    const cliente = (window._solicitudClientesResultados || [])[index];
    if (!cliente) return;

    seleccionarClienteSolicitudData(cliente);
}

function seleccionarClienteSolicitudData(cliente) {
    const empresaInput = document.getElementById('solEmpresa');
    const clienteIdInput = document.getElementById('solClienteId');
    const results = document.getElementById('solClientesSugerencias');

    if (empresaInput) empresaInput.value = cliente.empresa || '';
    if (clienteIdInput) clienteIdInput.value = cliente.id || '';
    if (results) results.style.display = 'none';

    window._solicitudClienteSeleccionado = cliente;
}

function crearClienteDesdeSolicitud() {
    const results = document.getElementById('solClientesSugerencias');
    if (results) results.style.display = 'none';

    if (typeof window.abrirModalCliente !== 'function') {
        alert('No se pudo abrir el formulario de clientes.');
        return;
    }

    window.abrirModalCliente(null, {
        prefillEmpresa: window._solicitudTerminoBusqueda || document.getElementById('solEmpresa')?.value || '',
        onSave: seleccionarClienteSolicitudData
    });
}

function agregarAlCalendario(comandaData) {
    if (document.getElementById('calendarDays')) cargarCalendario();
}

function cargarEventosEjemplo() {}
function cargarEventosDia() { cargarCalendario(); }
