(function () {
    function getActivityActorName() {
        return window.currentUser?.user_metadata?.full_name
            || window.currentUser?.email
            || 'Usuario local';
    }

    async function registrarActividadApp(action, options = {}) {
        if (!action || !window.supabaseClient || !window.currentUser?.id) return false;

        const payload = {
            user_id: window.currentUser.id,
            user_email: window.currentUser.email || '',
            user_name: getActivityActorName(),
            action,
            area: options.area || null,
            entity_type: options.entityType || 'pedido',
            entity_code: options.entityCode || options.codigo || null,
            entity_id: options.entityId || null,
            details: options.details || {}
        };

        try {
            const { error } = await window.supabaseClient
                .from('app_activity_log')
                .insert(payload);
            if (error) throw error;
            return true;
        } catch (error) {
            console.warn('No se pudo registrar actividad de auditoria:', error);
            return false;
        }
    }

    window.registrarActividadApp = registrarActividadApp;
})();
