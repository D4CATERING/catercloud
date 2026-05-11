// ========== CALENDARIO ==========
let currentYear  = new Date().getFullYear();
let currentMonth = new Date().getMonth();
let selectedDate = new Date();

const MONTH_NAMES = [
    'Enero','Febrero','Marzo','Abril','Mayo','Junio',
    'Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'
];

function formatoFechaLocal(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

// ── Fuente de verdad: lee siempre del localStorage ───────────────────────────
function getEventosPorFecha() {
    const historial = JSON.parse(localStorage.getItem('historialComandas') || '[]');
    const map = {};
    historial.forEach(c => {
        const fecha = (c.fecha_evento || '').split('T')[0];
        if (!fecha) return;
        if (!map[fecha]) map[fecha] = [];
        map[fecha].push({
            codigo:  c.codigo  || '',
            empresa: c.empresa || '—',
            pax:     c.pax     || 0,
            menu:    c.menu_principal?.nombre || '—',
            hora:    c.logistica_inline?.hora_entrega || c.hora_salida || '',
            estado:  c.estado  || 'creada',
        });
    });
    Object.values(map).forEach(arr =>
        arr.sort((a, b) => (a.hora || '').localeCompare(b.hora || ''))
    );
    return map;
}

// ── Render principal ──────────────────────────────────────────────────────────
function cargarCalendario() {
    const calendarDays = document.getElementById('calendarDays');
    if (!calendarDays) return;
    calendarDays.innerHTML = '';

    const eventos = getEventosPorFecha();

    const firstDay    = new Date(currentYear, currentMonth, 1);
    const lastDay     = new Date(currentYear, currentMonth + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startOffset = (firstDay.getDay() + 6) % 7; // lunes = 0

    const today = new Date();

    const monthTitle = document.getElementById('calendarMonthTitle');
    if (monthTitle) monthTitle.textContent = `${MONTH_NAMES[currentMonth]} ${currentYear}`;

    // Días vacíos
    for (let i = 0; i < startOffset; i++) {
        const empty = document.createElement('div');
        empty.className = 'calendar-day empty';
        calendarDays.appendChild(empty);
    }

    // Días del mes
    for (let day = 1; day <= daysInMonth; day++) {
        const date    = new Date(currentYear, currentMonth, day);
        const dateStr = formatoFechaLocal(date);
        const evs     = eventos[dateStr] || [];

        const el = document.createElement('div');
        el.className = 'calendar-day';

        const isToday    = today.getFullYear() === currentYear &&
                           today.getMonth()    === currentMonth &&
                           today.getDate()     === day;
        const isSelected = date.toDateString() === selectedDate.toDateString();
        const isPast     = date < new Date(today.getFullYear(), today.getMonth(), today.getDate());

        if (isToday)    el.classList.add('today');
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

// ── Cambiar mes ───────────────────────────────────────────────────────────────
function cambiarMes(delta) {
    currentMonth += delta;
    if (currentMonth < 0)  { currentMonth = 11; currentYear--; }
    if (currentMonth > 11) { currentMonth = 0;  currentYear++; }
    cargarCalendario();
}

// ── Seleccionar día ───────────────────────────────────────────────────────────
function seleccionarDia(date) {
    selectedDate = date;
    cargarCalendario();
}

// ── Panel de eventos del día ──────────────────────────────────────────────────
function _renderEventosDia(eventosPorFecha) {
    const eventList = document.getElementById('eventList');
    const titleEl   = document.getElementById('selectedDateTitle');
    if (!eventList) return;

    const dateStr = formatoFechaLocal(selectedDate);
    const evs     = eventosPorFecha[dateStr] || [];

    const isToday = selectedDate.toDateString() === new Date().toDateString();
    const label   = isToday
        ? 'Hoy'
        : `${selectedDate.getDate()} de ${MONTH_NAMES[selectedDate.getMonth()]}`;

    if (titleEl) titleEl.textContent = label;

    const estadoBadge = {
        creada:     { cls: 'badge-creada',     label: 'Creada'     },
        proceso:    { cls: 'badge-proceso',    label: 'En proceso' },
        completada: { cls: 'badge-completada', label: 'Completada' },
    };

    // Botón nueva comanda siempre visible al pie del panel
    const btnHtml = `
        <button class="event-new-btn" onclick="nuevaComandaEnFecha('${dateStr}')">
            + Nueva comanda para este día
        </button>`;

    if (!evs.length) {
        eventList.innerHTML = `
            <div class="event-empty">
                <div class="event-empty-icon">📭</div>
                <div>Sin pedidos este día</div>
            </div>
            ${btnHtml}`;
        return;
    }

    const itemsHtml = evs.map(ev => {
        const badge = estadoBadge[ev.estado] || estadoBadge.creada;
        return `
        <div class="event-item" onclick="verDetalleComandaPorCodigo('${ev.codigo}')">
            <div class="event-header">
                ${ev.hora ? `<span class="event-time">🕐 ${ev.hora}</span>` : ''}
                <span class="event-badge ${badge.cls}">${badge.label}</span>
            </div>
            <div class="event-empresa">${ev.empresa}</div>
            <div class="event-meta">
                <span>🍽 ${ev.menu}</span>
                <span class="event-sep">·</span>
                <span>👥 ${ev.pax} pax</span>
            </div>
            <div class="event-codigo">${ev.codigo}</div>
        </div>`;
    }).join('');

    eventList.innerHTML = itemsHtml + btnHtml;
}

// ── Nueva comanda con fecha preseleccionada ───────────────────────────────────
function nuevaComandaEnFecha(dateStr) {
    // Navegar al formulario
    if (typeof mostrarComandaCocina === 'function') {
        mostrarComandaCocina();
    }
    // Sobrescribir la fecha con la del día seleccionado
    const fechaInput = document.getElementById('fecha_evento');
    if (fechaInput) fechaInput.value = dateStr;
}

// ── Llamado desde main.js tras guardar ───────────────────────────────────────
function agregarAlCalendario(comandaData) {
    if (document.getElementById('calendarDays')) cargarCalendario();
}

// Stubs de compatibilidad
function cargarEventosEjemplo() {}
function cargarEventosDia() { cargarCalendario(); }
