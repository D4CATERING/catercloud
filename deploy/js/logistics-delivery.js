// ========== LOGISTICS DELIVERY: datos de entrega y validacion ==========

(function initCaterCloudLogisticsDelivery() {
    const CONTACT_TEXT_LIMIT = 25;
    const ADDRESS_TEXT_LIMIT = 60;
    const REQUIRED_FIELDS = Object.freeze([
        { key: 'hora_entrega', suffix: 'hora_entrega', label: 'Hora de entrega' },
        { key: 'hora_evento', suffix: 'hora_evento', label: 'Hora del evento' },
        { key: 'nombre_contacto', suffix: 'nombre_contacto', label: 'Nombre de contacto' },
        { key: 'telefono_contacto', suffix: 'telefono_contacto', label: 'Telefono de contacto' },
        { key: 'duracion_evento', suffix: 'duracion_evento', label: 'Duracion evento' },
        { key: 'cantidad_camareros', suffix: 'cantidad_camareros', label: 'Cantidad camareros' },
        { key: 'calle', suffix: 'calle', label: 'Direccion' },
        { key: 'codigo_postal', suffix: 'codigo_postal', label: 'Codigo postal' }
    ]);

    function getInput(prefix, suffix) {
        return document.getElementById(`${prefix}_${suffix}`);
    }

    function getValue(prefix, suffix) {
        return getInput(prefix, suffix)?.value?.trim() || '';
    }

    function limitDeliveryText(value, max = CONTACT_TEXT_LIMIT) {
        return String(value || '').trim().slice(0, max);
    }

    function setFieldState(prefix, suffix, ok, message = '') {
        const input = getInput(prefix, suffix);
        const errEl = document.getElementById(`${prefix}_${suffix}_err`);
        if (input) input.style.borderColor = ok ? '#cbd5e1' : '#dc2626';
        if (errEl) errEl.textContent = ok ? '' : message;
    }

    function composeAddress(calle, numero) {
        return [calle, numero].map(v => (v || '').trim()).filter(Boolean).join(', ');
    }

    function splitAddress(direccion) {
        if (typeof window.separarDireccionLogistica === 'function') {
            return window.separarDireccionLogistica(direccion || '');
        }
        return { calle: direccion || '', numero: '' };
    }

    function getCategoriesFromContext(ctx = {}) {
        return [
            Number(ctx.categoriaId || 0),
            Number(ctx.catPrincipal || 0),
            Number(ctx.menuPrincipal?.categoriaOriginalId || ctx.menuPrincipal?.categoriaId || ctx.menuPrincipal?._cat || 0),
            ...(ctx.menusAcumulados || []).map(menu => Number(menu?.categoriaOriginalId || menu?.categoriaId || menu?._cat || 0))
        ].filter(Boolean);
    }

    function requiresInlineDelivery(ctx = {}) {
        const categorias = getCategoriesFromContext(ctx);
        if (categorias.includes(3)) return false;
        if (ctx.serviciosMode && !categorias.length) return false;
        return categorias.some(cat => [1, 2, 4, 5, 6].includes(cat));
    }

    function readFromDom(prefix) {
        const calle = limitDeliveryText(getValue(prefix, 'calle'), ADDRESS_TEXT_LIMIT);
        const numero = getValue(prefix, 'numero');
        return {
            hora_entrega: getValue(prefix, 'hora_entrega'),
            hora_evento: getValue(prefix, 'hora_evento'),
            fecha_recogida: getValue(prefix, 'fecha_recogida'),
            hora_recogida: getValue(prefix, 'hora_recogida'),
            nombre_contacto: limitDeliveryText(getValue(prefix, 'nombre_contacto'), CONTACT_TEXT_LIMIT),
            telefono_contacto: getValue(prefix, 'telefono_contacto'),
            montaje: getValue(prefix, 'montaje'),
            duracion_evento: getValue(prefix, 'duracion_evento'),
            cantidad_camareros: getValue(prefix, 'cantidad_camareros'),
            calle,
            numero,
            direccion: composeAddress(calle, numero),
            codigo_postal: getValue(prefix, 'codigo_postal'),
            notas_logistica: getValue(prefix, prefix === 'log' ? 'page_notas' : 'notas')
        };
    }

    function hasAnyDeliveryData(data = {}) {
        return [
            'hora_entrega', 'hora_evento', 'fecha_recogida', 'hora_recogida',
            'nombre_contacto', 'telefono_contacto', 'montaje', 'duracion_evento',
            'cantidad_camareros', 'calle', 'numero', 'direccion', 'codigo_postal',
            'notas_logistica'
        ].some(key => String(data[key] || '').trim());
    }

    function minutesFromTime(value) {
        if (!value || !/^\d{2}:\d{2}$/.test(value)) return null;
        const [hours, minutes] = value.split(':').map(Number);
        return (hours * 60) + minutes;
    }

    function validateTimes(prefix, horaSalidaValor) {
        const entrega = getInput(prefix, 'hora_entrega');
        const evento = getInput(prefix, 'hora_evento');
        const salidaMin = minutesFromTime(horaSalidaValor);
        const entregaMin = minutesFromTime(entrega?.value || '');
        const eventoMin = minutesFromTime(evento?.value || '');
        let valid = true;

        if (entrega && salidaMin !== null && entregaMin !== null && entregaMin < salidaMin) {
            setFieldState(prefix, 'hora_entrega', false, 'La hora de entrega no puede ser inferior a la hora de salida');
            valid = false;
        }

        if (evento && eventoMin !== null) {
            const beforeDeparture = salidaMin !== null && eventoMin < salidaMin;
            const beforeDelivery = entregaMin !== null && eventoMin < entregaMin;
            if (beforeDeparture || beforeDelivery) {
                setFieldState(prefix, 'hora_evento', false, 'La hora del evento no puede ser menor que salida o entrega');
                valid = false;
            }
        }

        return valid;
    }

    function validateOptionalPickup(prefix) {
        const fecha = getInput(prefix, 'fecha_recogida');
        const hora = getInput(prefix, 'hora_recogida');
        if (!fecha || !hora) return true;

        const fechaValue = fecha.value.trim();
        const horaValue = hora.value.trim();
        const valid = (!fechaValue && !horaValue) || (fechaValue && horaValue);

        setFieldState(prefix, 'fecha_recogida', valid, !fechaValue ? 'Fecha requerida' : '');
        setFieldState(prefix, 'hora_recogida', valid, !horaValue ? 'Hora requerida' : '');
        return valid;
    }

    function validateDom(prefix, options = {}) {
        if (!options.required) return true;

        let valid = true;
        REQUIRED_FIELDS.forEach(({ suffix, label }) => {
            const input = getInput(prefix, suffix);
            if (!input) return;
            if (!input.value.trim()) {
                setFieldState(prefix, suffix, false, `${label} es obligatorio`);
                valid = false;
            } else {
                setFieldState(prefix, suffix, true);
            }
        });

        const phone = getInput(prefix, 'telefono_contacto');
        if (phone && phone.value.trim() && !/^[0-9\s\+\-]{6,20}$/.test(phone.value.trim())) {
            setFieldState(prefix, 'telefono_contacto', false, 'Formato de telefono no valido');
            valid = false;
        }

        if (!validateTimes(prefix, options.horaSalida || '')) valid = false;
        if (!validateOptionalPickup(prefix)) valid = false;
        return valid;
    }

    function getFromOrder(order = {}) {
        const sources = [
            order.logistica_inline,
            order.logistica,
            order.datos_entrega,
            order.entrega,
            order.payload?.logistica_inline,
            order.payload?.logistica,
            order.payload?.datos_entrega
        ].filter(Boolean);

        const merged = sources.reduce((acc, source) => ({ ...acc, ...source }), {});
        const direccionTexto = merged.direccion || composeAddress(merged.calle, merged.numero);
        const direccion = !merged.calle && direccionTexto ? splitAddress(direccionTexto) : { calle: '', numero: '' };
        const calle = limitDeliveryText(direccionTexto || merged.calle || direccion.calle || '', ADDRESS_TEXT_LIMIT);
        const numero = merged.numero || direccion.numero || '';
        return {
            ...merged,
            nombre_contacto: limitDeliveryText(merged.nombre_contacto || '', CONTACT_TEXT_LIMIT),
            calle,
            numero: direccionTexto ? '' : numero,
            direccion: calle
        };
    }

    window.CaterCloudLogisticsDelivery = Object.assign(window.CaterCloudLogisticsDelivery || {}, {
        requiredFields: REQUIRED_FIELDS,
        requiresInlineDelivery,
        readFromDom,
        hasAnyDeliveryData,
        validateDom,
        getFromOrder
    });
})();
