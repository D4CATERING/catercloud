// ========== PERMISOS DE APP ==========

(function () {
    const state = {
        role: null,
        loaded: false
    };

    function normalizeRole(role) {
        return ['admin', 'editor', 'viewer'].includes(role) ? role : 'editor';
    }

    window.AppPermissions = {
        get role() {
            return normalizeRole(state.role);
        },

        canRead() {
            return ['admin', 'editor', 'viewer'].includes(this.role);
        },

        canWrite() {
            return ['admin', 'editor'].includes(this.role);
        },

        isAdmin() {
            return this.role === 'admin';
        },

        async load() {
            if (!window.supabaseClient || !window.currentUser?.id) {
                state.role = 'editor';
                state.loaded = true;
                this.applyUI();
                return state.role;
            }

            try {
                const { data, error } = await window.supabaseClient
                    .from('app_user_roles')
                    .select('role, active')
                    .eq('user_id', window.currentUser.id)
                    .eq('active', true)
                    .maybeSingle();

                if (error) throw error;
                state.role = normalizeRole(data?.role);
            } catch (error) {
                console.warn('No se pudo cargar el rol de usuario:', error);
                state.role = 'editor';
            }

            state.loaded = true;
            this.applyUI();
            return state.role;
        },

        applyUI() {
            document.body.dataset.appRole = this.role;
            document.body.classList.toggle('role-viewer', !this.canWrite());

            document.querySelectorAll('[data-requires-write]').forEach(el => {
                el.style.display = this.canWrite() ? '' : 'none';
            });

            document.querySelectorAll('[data-requires-admin]').forEach(el => {
                el.style.display = this.isAdmin() ? '' : 'none';
            });
        },

        requireWrite(message = 'Tu usuario solo tiene permiso de consulta.') {
            if (this.canWrite()) return true;
            alert(message);
            return false;
        }
    };

    document.addEventListener('user:changed', () => {
        window.AppPermissions.load();
    });

    document.addEventListener('DOMContentLoaded', () => {
        window.AppPermissions.applyUI();
    });
})();
