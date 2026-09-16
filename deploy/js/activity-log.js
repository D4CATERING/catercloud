(function () {
    function getActivityActorName(user = window.currentUser) {
        return user?.user_metadata?.full_name
            || user?.email
            || 'Usuario local';
    }

    async function asegurarUsuarioAuditoria() {
        if (window.currentUser?.id) return window.currentUser;
        if (window.AuthReady) await window.AuthReady;
        if (window.Auth?.getUser) {
            const user = await window.Auth.getUser();
            if (user?.id) window.currentUser = user;
        }
        return window.currentUser || null;
    }

    async function registrarActividadApp(action, options = {}) {
        const user = await asegurarUsuarioAuditoria();
        if (!action || !window.supabaseClient || !user?.id) {
            console.warn('Auditoria no registrada: falta accion, Supabase o usuario activo.', {
                action,
                tieneSupabase: !!window.supabaseClient,
                usuario: user?.email || null
            });
            return false;
        }

        const payload = {
            user_id: user.id,
            user_email: user.email || '',
            user_name: getActivityActorName(user),
            action,
            area: options.area || null,
            entity_type: options.entityType || 'pedido',
            entity_code: options.entityCode || options.codigo || null,
            entity_id: options.entityId || null,
            details: options.details || {}
        };

        try {
            const { error: rpcError } = await window.supabaseClient.rpc('register_app_activity', {
                p_action: payload.action,
                p_area: payload.area,
                p_entity_type: payload.entity_type,
                p_entity_code: payload.entity_code,
                p_entity_id: payload.entity_id,
                p_details: payload.details
            });
            if (rpcError) {
                console.warn('RPC de auditoria no disponible, intentando insert directo:', rpcError);
                const { error } = await window.supabaseClient
                    .from('app_activity_log')
                    .insert(payload);
                if (error) throw error;
            }
            return true;
        } catch (error) {
            console.warn('No se pudo registrar actividad de auditoria:', error);
            return false;
        }
    }

    window.registrarActividadApp = registrarActividadApp;

    async function registrarLoginActual(options = {}) {
        const user = await asegurarUsuarioAuditoria();
        if (!user?.id || !window.supabaseClient) return;

        const key = `catercloud_login_logged_${user.id}`;
        if (!options.force && sessionStorage.getItem(key) === '1') return;

        const registrado = await registrarActividadApp('login', {
            area: 'auth',
            entityType: 'usuario',
            entityCode: user.email || user.id,
            entityId: user.id,
            details: {
                email: user.email || '',
                metodo: options.metodo || 'sesion_activa',
                at: new Date().toISOString()
            }
        });
        if (registrado) sessionStorage.setItem(key, '1');
    }

    window.registrarLoginActual = registrarLoginActual;

    document.addEventListener('user:changed', () => {
        registrarLoginActual();
    });

    window.verificarAuditoriaApp = async function () {
        const user = await asegurarUsuarioAuditoria();
        const resultado = {
            usuario: user?.email || null,
            userId: user?.id || null,
            tieneSupabase: !!window.supabaseClient,
            insercionOk: false,
            lecturaOk: false,
            errorInsercion: null,
            errorLectura: null,
            ultimoRegistro: null
        };

        if (!user?.id || !window.supabaseClient) return resultado;

        const insert = await window.supabaseClient.rpc('register_app_activity', {
            p_action: 'diagnostico_auditoria',
            p_area: 'sistema',
            p_entity_type: 'usuario',
            p_entity_code: user.email || user.id,
            p_entity_id: user.id,
            p_details: { at: new Date().toISOString() }
        });

        resultado.insercionOk = !insert.error;
        resultado.errorInsercion = insert.error || null;
        resultado.ultimoRegistro = insert.data || null;

        const lectura = await window.supabaseClient
            .from('app_activity_log')
            .select('*')
            .eq('user_id', user.id)
            .order('created_at', { ascending: false })
            .limit(5);

        resultado.lecturaOk = !lectura.error;
        resultado.errorLectura = lectura.error || null;
        resultado.ultimosRegistros = lectura.data || [];
        console.log('Diagnostico auditoria:', resultado);
        return resultado;
    };

    if (window.AuthReady) {
        window.AuthReady.then(() => registrarLoginActual());
    } else {
        setTimeout(registrarLoginActual, 0);
    }
})();
