// ========== PERMISOS DE APP ==========

(function () {
    const state = {
        role: null,
        loaded: false
    };

    function normalizeRole(role) {
        return ['admin', 'editor', 'eventos', 'viewer', 'cocina', 'logistica'].includes(role) ? role : 'viewer';
    }

    function inferRoleFromUser() {
        const email = String(window.currentUser?.email || '').toLowerCase();
        if (email.includes('cocina')) return 'cocina';
        if (email.includes('logistica') || email.includes('logística')) return 'logistica';
        if (email.includes('eventos')) return 'eventos';
        return null;
    }

    window.AppPermissions = {
        get role() {
            return normalizeRole(state.role || inferRoleFromUser());
        },

        canRead() {
            return ['admin', 'editor', 'eventos', 'viewer', 'cocina', 'logistica'].includes(this.role);
        },

        canWrite() {
            return ['admin', 'editor', 'eventos'].includes(this.role);
        },

        canCreateOrders() {
            return ['admin', 'editor'].includes(this.role);
        },

        canEditOrders() {
            return ['admin', 'editor', 'eventos'].includes(this.role);
        },

        canEditKitchen() {
            return ['admin', 'editor', 'cocina'].includes(this.role);
        },

        canEditLogistics() {
            return ['admin', 'editor', 'logistica'].includes(this.role);
        },

        canCreateServiceLogistics() {
            return ['admin', 'editor'].includes(this.role);
        },

        canManageLogisticsInventory() {
            return ['admin', 'logistica'].includes(this.role);
        },

        isAdmin() {
            return this.role === 'admin';
        },

        async load() {
            if (!window.supabaseClient || !window.currentUser?.id) {
                state.role = 'viewer';
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
                state.role = inferRoleFromUser() || 'viewer';
            }

            state.loaded = true;
            this.applyUI();
            return state.role;
        },

        applyUI() {
            document.body.dataset.appRole = this.role;
            document.body.classList.toggle('role-viewer', !this.canWrite());

            document.querySelectorAll('[data-requires-write]').forEach(el => {
                el.style.display = this.canEditOrders() ? '' : 'none';
            });

            document.querySelectorAll('[data-requires-create-order]').forEach(el => {
                el.style.display = this.canCreateOrders() ? '' : 'none';
            });

            document.querySelectorAll('[data-requires-order-write]').forEach(el => {
                el.style.display = this.canEditOrders() ? '' : 'none';
            });

            document.querySelectorAll('[data-requires-kitchen-write]').forEach(el => {
                el.style.display = this.canEditKitchen() ? '' : 'none';
            });

            document.querySelectorAll('[data-requires-logistics-write]').forEach(el => {
                el.style.display = this.canEditLogistics() ? '' : 'none';
            });

            document.querySelectorAll('[data-requires-service-logistics-create]').forEach(el => {
                el.style.display = this.canCreateServiceLogistics() ? '' : 'none';
            });

            document.querySelectorAll('[data-requires-logistics-inventory]').forEach(el => {
                el.style.display = this.canManageLogisticsInventory() ? '' : 'none';
            });

            document.querySelectorAll('[data-requires-admin]').forEach(el => {
                el.style.display = this.isAdmin() ? '' : 'none';
            });
        },

        requireWrite(message = 'Tu usuario solo tiene permiso de consulta.') {
            if (this.canEditOrders()) return true;
            alert(message);
            return false;
        },

        requireCreateOrders(message = 'Tu usuario no tiene permiso para crear comandas.') {
            if (this.canCreateOrders()) return true;
            alert(message);
            return false;
        },

        requireKitchen(message = 'Tu usuario no tiene permiso para editar cocina.') {
            if (this.canEditKitchen()) return true;
            alert(message);
            return false;
        },

        requireLogistics(message = 'Tu usuario no tiene permiso para editar logistica.') {
            if (this.canEditLogistics()) return true;
            alert(message);
            return false;
        },

        requireServiceLogisticsCreate(message = 'Tu usuario no tiene permiso para crear comandas de logistica de servicios.') {
            if (this.canCreateServiceLogistics()) return true;
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
