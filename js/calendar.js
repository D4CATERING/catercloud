// ========== CALENDARIO ==========
let currentYear = new Date().getFullYear();
let currentMonth = new Date().getMonth();
let selectedDate = new Date();
let calendarioEventos = {};

/**
 * Carga y muestra el calendario
 */
function cargarCalendario() {
    const calendarDays = document.getElementById('calendarDays');
    calendarDays.innerHTML = '';
    
    const firstDay = new Date(currentYear, currentMonth, 1);
    const lastDay = new Date(currentYear, currentMonth + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDay = firstDay.getDay();
    const startOffset = startingDay === 0 ? 6 : startingDay - 1;
    
    // Días vacíos al inicio
    for (let i = 0; i < startOffset; i++) {
        const emptyDay = document.createElement('div');
        emptyDay.className = 'calendar-day';
        calendarDays.appendChild(emptyDay);
    }
    
    const today = new Date();
    const isCurrentMonth = currentYear === today.getFullYear() && currentMonth === today.getMonth();
    
    // Días del mes
    for (let day = 1; day <= daysInMonth; day++) {
        const dayElement = document.createElement('div');
        dayElement.className = 'calendar-day';
        const date = new Date(currentYear, currentMonth, day);
        const dateStr = date.toISOString().split('T')[0];
        
        if (isCurrentMonth && day === today.getDate()) {
            dayElement.classList.add('today');
        }
        
        if (date.toDateString() === selectedDate.toDateString()) {
            dayElement.classList.add('selected');
        }
        
        if (calendarioEventos[dateStr]) {
            dayElement.classList.add('has-events');
            const eventCount = document.createElement('div');
            eventCount.className = 'event-count';
            eventCount.textContent = calendarioEventos[dateStr].length;
            dayElement.appendChild(eventCount);
        }
        
        const dayNumber = document.createElement('div');
        dayNumber.className = 'day-number';
        dayNumber.textContent = day;
        dayElement.appendChild(dayNumber);
        
        dayElement.onclick = () => seleccionarDia(date);
        calendarDays.appendChild(dayElement);
    }
    
    const monthNames = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
                       'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
    
    document.getElementById('selectedDateTitle').textContent = 
        `Pedidos para ${selectedDate.getDate()} de ${monthNames[selectedDate.getMonth()]}`;
    
    cargarEventosDia();
}

/**
 * Cambia el mes del calendario
 * @param {number} delta - Número de meses a mover (-1 para anterior, 1 para siguiente)
 */
function cambiarMes(delta) {
    currentMonth += delta;
    
    if (currentMonth < 0) {
        currentMonth = 11;
        currentYear--;
    } else if (currentMonth > 11) {
        currentMonth = 0;
        currentYear++;
    }
    
    cargarCalendario();
}

/**
 * Selecciona un día en el calendario
 * @param {Date} date - Fecha a seleccionar
 */
function seleccionarDia(date) {
    selectedDate = date;
    cargarCalendario();
}

/**
 * Carga eventos de ejemplo (puedes reemplazar con datos reales)
 */
function cargarEventosEjemplo() {
    const hoy = new Date();
    const manana = new Date();
    manana.setDate(hoy.getDate() + 1);
    const pasado = new Date();
    pasado.setDate(hoy.getDate() + 2);
    
    const eventos = {
        [hoy.toISOString().split('T')[0]]: [
            { hora: '10:00', empresa: 'TechCorp', pax: 25, menu: 'ELECONÓMICO', tipo: 'comanda' },
            { hora: '14:00', empresa: 'MarketingPro', pax: 15, menu: 'AFTERWORK', tipo: 'comanda' }
        ],
        [manana.toISOString().split('T')[0]]: [
            { hora: '09:00', empresa: 'StartUpXYZ', pax: 40, menu: 'DESAYUNO PREMIUM', tipo: 'comanda' },
            { hora: '13:00', empresa: 'ConsultingCo', pax: 30, menu: 'ELMUYTOP', tipo: 'comanda' }
        ],
        [pasado.toISOString().split('T')[0]]: [
            { hora: '12:00', empresa: 'University', pax: 150, menu: 'FOODBOX LUNCH', tipo: 'comanda' }
        ]
    };
    
    calendarioEventos = eventos;
}

/**
 * Carga los eventos del día seleccionado
 */
function cargarEventosDia() {
    const eventList = document.getElementById('eventList');
    const dateStr = selectedDate.toISOString().split('T')[0];
    const eventos = calendarioEventos[dateStr] || [];
    
    if (eventos.length === 0) {
        eventList.innerHTML = '<p style="color: #94a3b8; text-align: center; font-size: 0.9rem;">No hay pedidos para este día</p>';
        return;
    }
    
    let html = '';
    eventos.forEach(evento => {
        html += `
        <div class="event-item">
            <div class="event-time">${evento.hora}</div>
            <div class="event-info">
                <strong>${evento.empresa}</strong><br>
                ${evento.pax} PAX - ${evento.menu}<br>
                <small style="font-size: 0.8rem;">Tipo: ${evento.tipo}</small>
            </div>
        </div>
        `;
    });
    
    eventList.innerHTML = html;
}

/**
 * Agrega una comanda al calendario
 * @param {Object} comandaData - Datos de la comanda
 */
function agregarAlCalendario(comandaData) {
    const fecha = comandaData.fecha_evento;
    
    if (!calendarioEventos[fecha]) {
        calendarioEventos[fecha] = [];
    }
    
    calendarioEventos[fecha].push({
        hora: comandaData.hora_salida,
        empresa: comandaData.empresa,
        pax: comandaData.pax,
        menu: comandaData.menu_principal.nombre,
        tipo: 'comanda'
    });
    
    calendarioEventos[fecha].sort((a, b) => a.hora.localeCompare(b.hora));
}