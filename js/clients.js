// ============================================================
// CLIENTS.JS — Gestión de clientes desde la app
// Buscador en el campo empresa + modal para crear/editar
// ============================================================

(function () {
    'use strict';

    // ID del cliente seleccionado actualmente
    window._clienteSeleccionadoId = null;

    // ── BUSCADOR DE CONTACTO ──────────────────────────────────
    window.inicializarBuscadorContacto = function () {
        const input = document.getElementById('log_inline_nombre_contacto');
        if (!input) return;

        const wrapper = input.parentElement;
        wrapper.style.position = 'relative';

        const dropdown = document.createElement('div');
        dropdown.id = 'contactosSugerencias';
        dropdown.style.cssText = `
            display:none; position:absolute; top:100%; left:0; right:0; z-index:1001;
            background:#fff; border:1px solid #e2e8f0; border-radius:8px;
            box-shadow:0 4px 16px rgba(0,0,0,0.12); max-height:200px; overflow-y:auto;
            margin-top:4px;
        `;
        wrapper.appendChild(dropdown);

        let timer;
        input.addEventListener('input', function () {
            clearTimeout(timer);
            const term = this.value.trim();
            if (term.length < 2) { dropdown.style.display = 'none'; return; }
            timer = setTimeout(() => buscarContactos(term, dropdown, input), 300);
        });

        document.addEventListener('click', function (e) {
            if (!wrapper.contains(e.target)) dropdown.style.display = 'none';
        });
    };

    async function buscarContactos(term, dropdown, input) {
        if (!window.supabaseClient) return;

        // Buscar en clients por contacto que coincida
        // Si hay empresa seleccionada, filtrar por ella primero
        try {
            let query = window.supabaseClient
                .from('clients')
                .select('id, empresa, contacto, telefono')
                .ilike('contacto', `%${term}%`)
                .eq('activo', true)
                .order('contacto')
                .limit(8);

            // Si hay empresa vinculada, priorizar sus contactos
            const empresaActual = document.getElementById('empresa')?.value.trim();
            if (window._clienteSeleccionadoId) {
                // Mostrar primero los de la empresa seleccionada
                query = window.supabaseClient
                    .from('clients')
                    .select('id, empresa, contacto, telefono')
                    .ilike('contacto', `%${term}%`)
                    .eq('activo', true)
                    .order('empresa')
                    .limit(8);
            }

            const { data, error } = await query;
            if (error) throw error;

            dropdown.innerHTML = '';

            if (data && data.length > 0) {
                // Separar: primero los de la empresa actual, luego el resto
                const deEstaEmpresa = data.filter(c => c.id === window._clienteSeleccionadoId);
                const deOtras = data.filter(c => c.id !== window._clienteSeleccionadoId);
                const ordenados = [...deEstaEmpresa, ...deOtras];

                ordenados.forEach(cliente => {
                    if (!cliente.contacto) return;
                    const item = document.createElement('div');
                    const esEmpresaActual = cliente.id === window._clienteSeleccionadoId;
                    item.style.cssText = `
                        padding:10px 14px; cursor:pointer; border-bottom:1px solid #f1f5f9;
                        font-size:.9rem; ${esEmpresaActual ? 'background:#f0f9ff;' : ''}
                    `;
                    item.innerHTML = `
                        <div style="font-weight:600;color:#131B23;">${cliente.contacto}</div>
                        <div style="color:#64748b;font-size:.82rem;">
                            ${cliente.empresa}${cliente.telefono ? ' · ' + cliente.telefono : ''}
                            ${esEmpresaActual ? ' <span style="color:#0ea5e9;">✓ Esta empresa</span>' : ''}
                        </div>
                    `;
                    item.addEventListener('mouseenter', () => item.style.background = '#f8fafc');
                    item.addEventListener('mouseleave', () => item.style.background = esEmpresaActual ? '#f0f9ff' : '');
                    item.addEventListener('click', () => {
                        input.value = cliente.contacto;
                        // Autorrellenar teléfono si está vacío
                        const telInput = document.getElementById('log_inline_telefono_contacto');
                        if (telInput && !telInput.value && cliente.telefono) {
                            telInput.value = cliente.telefono;
                        }
                        // Si el cliente es diferente al seleccionado, actualizar empresa también
                        if (cliente.id !== window._clienteSeleccionadoId) {
                            const empresaInput = document.getElementById('empresa');
                            if (empresaInput) empresaInput.value = cliente.empresa;
                            window._clienteSeleccionadoId = cliente.id;
                            _mostrarBadgeCliente(cliente);
                        }
                        dropdown.style.display = 'none';
                    });
                    dropdown.appendChild(item);
                });
            }

            // Opción de guardar nuevo contacto bajo la empresa actual
            const textoEscrito = input.value.trim();
            const btnNuevoContacto = document.createElement('div');
            btnNuevoContacto.style.cssText = `
                padding:10px 14px; cursor:pointer; font-size:.9rem;
                color:#E1342E; font-weight:600; border-top:1px solid #e2e8f0;
                background:#fff8f8; border-radius:0 0 8px 8px;
            `;

            if (window._clienteSeleccionadoId) {
                btnNuevoContacto.textContent = `+ Guardar "${textoEscrito}" como contacto de esta empresa`;
                btnNuevoContacto.addEventListener('mouseenter', () => btnNuevoContacto.style.background = '#fee2e2');
                btnNuevoContacto.addEventListener('mouseleave', () => btnNuevoContacto.style.background = '#fff8f8');
                btnNuevoContacto.addEventListener('click', () => {
                    dropdown.style.display = 'none';
                    _guardarNuevoContacto(textoEscrito);
                });
            } else {
                btnNuevoContacto.textContent = `+ Crear nuevo cliente con contacto "${textoEscrito}"`;
                btnNuevoContacto.addEventListener('click', () => {
                    dropdown.style.display = 'none';
                    abrirModalCliente();
                    setTimeout(() => {
                        const mc = document.getElementById('mc_contacto');
                        if (mc) mc.value = textoEscrito;
                    }, 100);
                });
            }
            btnNuevoContacto.addEventListener('mouseenter', () => btnNuevoContacto.style.background = '#fee2e2');
            btnNuevoContacto.addEventListener('mouseleave', () => btnNuevoContacto.style.background = '#fff8f8');
            dropdown.appendChild(btnNuevoContacto);

            dropdown.style.display = 'block';
        } catch (err) {
            console.error('Error buscando contactos:', err);
        }
    }

    async function _guardarNuevoContacto(nombreContacto) {
        if (!window._clienteSeleccionadoId || !nombreContacto) return;

        const telefono = document.getElementById('log_inline_telefono_contacto')?.value.trim() || null;

        // Abrir mini modal para confirmar datos del contacto
        const modal = document.createElement('div');
        modal.style.cssText = `
            position:fixed; inset:0; background:rgba(0,0,0,0.5); z-index:9999;
            display:flex; align-items:center; justify-content:center; padding:20px;
        `;
        modal.innerHTML = `
            <div style="background:#fff; border-radius:14px; padding:24px; width:100%; max-width:380px;
                        box-shadow:0 20px 50px rgba(0,0,0,0.3);">
                <h3 style="margin:0 0 16px; font-family:'Oswald',sans-serif;">Nuevo contacto</h3>
                <p style="font-size:.85rem; color:#64748b; margin:0 0 16px;">
                    Se añadirá a la ficha del cliente existente.
                </p>
                <div style="margin-bottom:12px;">
                    <label style="font-size:.85rem;font-weight:600;display:block;margin-bottom:4px;">Nombre</label>
                    <input id="nc_nombre" value="${nombreContacto}" type="text"
                        style="width:100%;padding:10px;border:1px solid #e2e8f0;border-radius:8px;font-size:.9rem;box-sizing:border-box;">
                </div>
                <div style="margin-bottom:20px;">
                    <label style="font-size:.85rem;font-weight:600;display:block;margin-bottom:4px;">Teléfono</label>
                    <input id="nc_telefono" value="${telefono || ''}" type="tel"
                        style="width:100%;padding:10px;border:1px solid #e2e8f0;border-radius:8px;font-size:.9rem;box-sizing:border-box;">
                </div>
                <div style="display:flex;gap:10px;">
                    <button type="button" onclick="this.closest('div[style*=fixed]').remove()"
                        style="flex:1;padding:10px;border:1px solid #e2e8f0;border-radius:8px;background:#fff;cursor:pointer;">
                        Cancelar
                    </button>
                    <button type="button" id="nc_guardar"
                        style="flex:2;padding:10px;border:none;border-radius:8px;background:#E1342E;
                               color:#fff;font-family:'Oswald',sans-serif;cursor:pointer;font-size:.95rem;">
                        Guardar contacto
                    </button>
                </div>
            </div>
        `;
        document.body.appendChild(modal);

        modal.querySelector('#nc_guardar').addEventListener('click', async () => {
            const nombre   = modal.querySelector('#nc_nombre').value.trim();
            const telefono = modal.querySelector('#nc_telefono').value.trim();
            if (!nombre) return;

            try {
                // Guardar como nuevo registro en clients con la misma empresa
                const { data: clienteActual } = await window.supabaseClient
                    .from('clients')
                    .select('empresa, direccion, codigo_postal')
                    .eq('id', window._clienteSeleccionadoId)
                    .single();

                const { data: nuevoCliente, error } = await window.supabaseClient
                    .from('clients')
                    .insert({
                        empresa:       clienteActual.empresa,
                        contacto:      nombre,
                        telefono:      telefono || null,
                        direccion:     clienteActual.direccion,
                        codigo_postal: clienteActual.codigo_postal,
                        created_by:    window.currentUser?.id || null
                    })
                    .select()
                    .single();

                if (error) throw error;

                // Autorrellenar campos
                document.getElementById('log_inline_nombre_contacto').value = nombre;
                if (telefono) document.getElementById('log_inline_telefono_contacto').value = telefono;
                window._clienteSeleccionadoId = nuevoCliente.id;

                modal.remove();
            } catch (err) {
                console.error('Error guardando contacto:', err);
                alert('Error al guardar el contacto');
            }
        });
    }

    // ── BUSCADOR ───────────────────────────────────────────────
    window.inicializarBuscadorClientes = function () {
        const input = document.getElementById('empresa');
        if (!input) return;

        // Crear contenedor de sugerencias
        const wrapper = input.parentElement;
        wrapper.style.position = 'relative';

        const dropdown = document.createElement('div');
        dropdown.id = 'clientesSugerencias';
        dropdown.style.cssText = `
            display:none; position:absolute; top:100%; left:0; right:0; z-index:1000;
            background:#fff; border:1px solid #e2e8f0; border-radius:8px;
            box-shadow:0 4px 16px rgba(0,0,0,0.12); max-height:220px; overflow-y:auto;
            margin-top:4px;
        `;
        wrapper.appendChild(dropdown);

        // Buscar al escribir
        let timer;
        input.addEventListener('input', function () {
            clearTimeout(timer);
            window._clienteSeleccionadoId = null;
            const term = this.value.trim();
            if (term.length < 2) { dropdown.style.display = 'none'; return; }
            timer = setTimeout(() => buscarClientes(term, dropdown, input), 300);
        });

        // Cerrar al hacer clic fuera
        document.addEventListener('click', function (e) {
            if (!wrapper.contains(e.target)) dropdown.style.display = 'none';
        });
    };

    async function buscarClientes(term, dropdown, input) {
        if (!window.supabaseClient) return;
        try {
            const { data, error } = await window.supabaseClient
                .from('clients')
                .select('*')
                .ilike('empresa', `%${term}%`)
                .eq('activo', true)
                .order('empresa')
                .limit(10);

            if (error) throw error;

            dropdown.innerHTML = '';

            if (!data || data.length === 0) {
                dropdown.innerHTML = '';
            } else {
                data.forEach(cliente => {
                    const item = document.createElement('div');
                    item.style.cssText = `
                        padding:10px 14px; cursor:pointer; border-bottom:1px solid #f1f5f9;
                        font-size:.9rem;
                    `;
                    item.innerHTML = `
                        <div style="font-weight:600;color:#131B23;">${cliente.empresa}</div>
                        ${cliente.contacto ? `<div style="color:#64748b;font-size:.82rem;">${cliente.contacto}${cliente.telefono ? ' · ' + cliente.telefono : ''}</div>` : ''}
                    `;
                    item.addEventListener('mouseenter', () => item.style.background = '#f8fafc');
                    item.addEventListener('mouseleave', () => item.style.background = '');
                    item.addEventListener('click', () => {
                        seleccionarCliente(cliente);
                        dropdown.style.display = 'none';
                    });
                    dropdown.appendChild(item);
                });
            }

            // Siempre mostrar opción de crear nuevo al final
            const btnNuevo = document.createElement('div');
            const textoEscrito = input.value.trim();
            btnNuevo.style.cssText = `
                padding:10px 14px; cursor:pointer; font-size:.9rem;
                color:#E1342E; font-weight:600; border-top:1px solid #e2e8f0;
                background:#fff8f8; border-radius:0 0 8px 8px;
            `;
            btnNuevo.textContent = textoEscrito ? `+ Crear "${textoEscrito}" como nuevo cliente` : '+ Crear nuevo cliente';
            btnNuevo.addEventListener('mouseenter', () => btnNuevo.style.background = '#fee2e2');
            btnNuevo.addEventListener('mouseleave', () => btnNuevo.style.background = '#fff8f8');
            btnNuevo.addEventListener('click', () => {
                dropdown.style.display = 'none';
                abrirModalCliente();
            });
            dropdown.appendChild(btnNuevo);

            dropdown.style.display = 'block';
        } catch (err) {
            console.error('Error buscando clientes:', err);
        }
    }

    function seleccionarCliente(cliente) {
        window._clienteSeleccionadoId = cliente.id;

        // Rellenar campo empresa
        const inputEmpresa = document.getElementById('empresa');
        if (inputEmpresa) inputEmpresa.value = cliente.empresa;

        // Autorrellenar campos de logística inline
        _setVal('log_inline_nombre_contacto', cliente.contacto);
        _setVal('log_inline_telefono_contacto', cliente.telefono);
        _setVal('log_inline_direccion', cliente.direccion);
        _setVal('log_inline_codigo_postal', cliente.codigo_postal);

        // También rellenar si están en el formulario de logística separado
        _setVal('log_nombre_contacto', cliente.contacto);
        _setVal('log_telefono_contacto', cliente.telefono);
        _setVal('log_direccion', cliente.direccion);
        _setVal('log_codigo_postal', cliente.codigo_postal);

        // Mostrar badge de cliente vinculado
        _mostrarBadgeCliente(cliente);
    }

    function _setVal(id, valor) {
        const el = document.getElementById(id);
        if (el && valor) el.value = valor;
    }

    function _mostrarBadgeCliente(cliente) {
        let badge = document.getElementById('clienteVinculadoBadge');
        if (!badge) {
            badge = document.createElement('div');
            badge.id = 'clienteVinculadoBadge';
            badge.style.cssText = `
                margin-top:4px; padding:4px 10px; background:#e8f5e9; border:1px solid #a5d6a7;
                border-radius:6px; font-size:.8rem; color:#2e7d32; display:flex;
                align-items:center; gap:8px;
            `;
            const input = document.getElementById('empresa');
            input?.parentElement?.appendChild(badge);
        }
        badge.innerHTML = `
            ✅ Cliente vinculado
            <button type="button" onclick="editarClienteActual()" 
                style="background:none;border:none;color:#1565c0;cursor:pointer;font-size:.8rem;padding:0;">
                Editar
            </button>
        `;
        badge.style.display = 'flex';
    }

    // ── MODAL CREAR / EDITAR CLIENTE ───────────────────────────
    window.abrirModalCliente = function (clienteId = null) {
        const modal = _crearModal();
        document.body.appendChild(modal);

        if (clienteId) {
            _cargarClienteEnModal(clienteId, modal);
        } else {
            // Prerellenar empresa con lo que hay escrito
            const empresa = document.getElementById('empresa')?.value || '';
            modal.querySelector('#mc_empresa').value = empresa;
        }
    };

    window.editarClienteActual = function () {
        if (window._clienteSeleccionadoId) {
            abrirModalCliente(window._clienteSeleccionadoId);
        }
    };

    function _crearModal() {
        // Quitar modal previo si existe
        document.getElementById('modalCliente')?.remove();

        const modal = document.createElement('div');
        modal.id = 'modalCliente';
        modal.style.cssText = `
            position:fixed; inset:0; background:rgba(0,0,0,0.5); z-index:9999;
            display:flex; align-items:center; justify-content:center; padding:20px;
        `;
        modal.innerHTML = `
            <div style="background:#fff; border-radius:14px; padding:28px; width:100%;
                        max-width:480px; box-shadow:0 20px 50px rgba(0,0,0,0.3);">
                <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:20px;">
                    <h3 id="mc_titulo" style="margin:0; font-family:'Oswald',sans-serif;">Nuevo Cliente</h3>
                    <button type="button" onclick="document.getElementById('modalCliente').remove()"
                        style="background:none;border:none;font-size:1.4rem;cursor:pointer;color:#64748b;">✕</button>
                </div>

                <input type="hidden" id="mc_id">

                <div style="margin-bottom:14px;">
                    <label style="font-size:.85rem;font-weight:600;display:block;margin-bottom:5px;">
                        Empresa <span style="color:#E1342E">*</span>
                    </label>
                    <input id="mc_empresa" type="text" placeholder="Nombre de la empresa"
                        style="width:100%;padding:10px;border:1px solid #e2e8f0;border-radius:8px;font-size:.95rem;box-sizing:border-box;">
                </div>

                <div style="margin-bottom:14px;">
                    <label style="font-size:.85rem;font-weight:600;display:block;margin-bottom:5px;">Persona de contacto</label>
                    <input id="mc_contacto" type="text" placeholder="Nombre completo"
                        style="width:100%;padding:10px;border:1px solid #e2e8f0;border-radius:8px;font-size:.95rem;box-sizing:border-box;">
                </div>

                <div style="margin-bottom:14px;">
                    <label style="font-size:.85rem;font-weight:600;display:block;margin-bottom:5px;">Teléfono</label>
                    <input id="mc_telefono" type="tel" placeholder="+34 600 000 000"
                        style="width:100%;padding:10px;border:1px solid #e2e8f0;border-radius:8px;font-size:.95rem;box-sizing:border-box;">
                </div>

                <div style="margin-bottom:14px;">
                    <label style="font-size:.85rem;font-weight:600;display:block;margin-bottom:5px;">Dirección completa</label>
                    <input id="mc_direccion" type="text" placeholder="Calle, número, piso..."
                        style="width:100%;padding:10px;border:1px solid #e2e8f0;border-radius:8px;font-size:.95rem;box-sizing:border-box;">
                </div>

                <div style="margin-bottom:20px;">
                    <label style="font-size:.85rem;font-weight:600;display:block;margin-bottom:5px;">Código postal</label>
                    <input id="mc_cp" type="text" placeholder="28001" maxlength="10"
                        style="width:100%;padding:10px;border:1px solid #e2e8f0;border-radius:8px;font-size:.95rem;box-sizing:border-box;">
                </div>

                <div id="mc_error" style="color:#dc2626;font-size:.85rem;margin-bottom:10px;display:none;"></div>

                <div style="display:flex;gap:10px;">
                    <button type="button" onclick="document.getElementById('modalCliente').remove()"
                        style="flex:1;padding:11px;border:1px solid #e2e8f0;border-radius:8px;background:#fff;cursor:pointer;">
                        Cancelar
                    </button>
                    <button type="button" onclick="guardarCliente()"
                        style="flex:2;padding:11px;border:none;border-radius:8px;background:#E1342E;
                               color:#fff;font-family:'Oswald',sans-serif;letter-spacing:.5px;cursor:pointer;font-size:1rem;">
                        Guardar Cliente
                    </button>
                </div>
            </div>
        `;
        return modal;
    }

    async function _cargarClienteEnModal(clienteId, modal) {
        try {
            const { data, error } = await window.supabaseClient
                .from('clients')
                .select('*')
                .eq('id', clienteId)
                .single();
            if (error) throw error;
            modal.querySelector('#mc_titulo').textContent = 'Editar Cliente';
            modal.querySelector('#mc_id').value = data.id;
            modal.querySelector('#mc_empresa').value  = data.empresa || '';
            modal.querySelector('#mc_contacto').value = data.contacto || '';
            modal.querySelector('#mc_telefono').value = data.telefono || '';
            modal.querySelector('#mc_direccion').value = data.direccion || '';
            modal.querySelector('#mc_cp').value        = data.codigo_postal || '';
        } catch (err) {
            console.error('Error cargando cliente:', err);
        }
    }

    window.guardarCliente = async function () {
        const empresa = document.getElementById('mc_empresa')?.value.trim();
        const errEl   = document.getElementById('mc_error');

        if (!empresa) {
            errEl.textContent = 'El nombre de la empresa es obligatorio';
            errEl.style.display = 'block';
            return;
        }
        errEl.style.display = 'none';

        const clienteData = {
            empresa:       empresa,
            contacto:      document.getElementById('mc_contacto')?.value.trim() || null,
            telefono:      document.getElementById('mc_telefono')?.value.trim() || null,
            direccion:     document.getElementById('mc_direccion')?.value.trim() || null,
            codigo_postal: document.getElementById('mc_cp')?.value.trim() || null,
            created_by:    window.currentUser?.id || null
        };

        const clienteId = document.getElementById('mc_id')?.value;

        try {
            let savedCliente;
            if (clienteId) {
                // Editar
                const { data, error } = await window.supabaseClient
                    .from('clients')
                    .update(clienteData)
                    .eq('id', clienteId)
                    .select()
                    .single();
                if (error) throw error;
                savedCliente = data;
            } else {
                // Crear
                const { data, error } = await window.supabaseClient
                    .from('clients')
                    .insert(clienteData)
                    .select()
                    .single();
                if (error) throw error;
                savedCliente = data;
            }

            // Seleccionar el cliente guardado y cerrar modal
            seleccionarCliente(savedCliente);
            document.getElementById('modalCliente')?.remove();

        } catch (err) {
            console.error('Error guardando cliente:', err);
            errEl.textContent = 'Error al guardar: ' + (err.message || 'inténtalo de nuevo');
            errEl.style.display = 'block';
        }
    };

    // ── OBTENER ID PARA LA COMANDA ─────────────────────────────
    window.obtenerClienteIdParaComanda = function () {
        return window._clienteSeleccionadoId || null;
    };

    // ── LIMPIAR AL RESETEAR FORMULARIO ─────────────────────────
    window.limpiarBuscadorClientes = function () {
        window._clienteSeleccionadoId = null;
        document.getElementById('clienteVinculadoBadge')?.remove();
        const dropdown = document.getElementById('clientesSugerencias');
        if (dropdown) dropdown.style.display = 'none';
    };

    // ── INICIALIZAR AL CARGAR ──────────────────────────────────
    document.addEventListener('DOMContentLoaded', function () {
        inicializarBuscadorClientes();
        inicializarBuscadorContacto();
    });

})();

// ============================================================
// PANEL DE GESTIÓN DE CLIENTES
// ============================================================

let _todosLosClientes = [];

window.mostrarClientes = async function () {
    // Ocultar otras secciones
    document.getElementById('dashboard').style.display    = 'none';
    document.getElementById('comandaForm').style.display  = 'none';
    document.getElementById('historialSection') && (document.getElementById('historialSection').style.display = 'none');
    document.getElementById('clientesPanel').style.display = 'block';

    await cargarTablaClientes();
};

async function cargarTablaClientes() {
    const tbody = document.getElementById('clientesTablaBody');
    if (!tbody) return;

    tbody.innerHTML = '<tr><td colspan="6" style="padding:40px;text-align:center;color:#94a3b8;">Cargando...</td></tr>';

    try {
        const { data, error } = await window.supabaseClient
            .from('clients')
            .select('*')
            .eq('activo', true)
            .order('empresa');

        if (error) throw error;

        _todosLosClientes = data || [];
        renderizarTablaClientes(_todosLosClientes);

    } catch (err) {
        console.error('Error cargando clientes:', err);
        tbody.innerHTML = '<tr><td colspan="6" style="padding:40px;text-align:center;color:#dc2626;">Error al cargar clientes</td></tr>';
    }
}

function renderizarTablaClientes(clientes) {
    const tbody = document.getElementById('clientesTablaBody');
    const pag   = document.getElementById('clientesPaginacion');
    if (!tbody) return;

    if (!clientes || clientes.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" style="padding:40px;text-align:center;color:#94a3b8;">No hay clientes. Crea el primero con el botón de arriba.</td></tr>';
        if (pag) pag.textContent = '';
        return;
    }

    if (pag) pag.textContent = `${clientes.length} cliente${clientes.length !== 1 ? 's' : ''}`;

    tbody.innerHTML = clientes.map((c, i) => `
        <tr style="border-bottom:1px solid #f1f5f9; ${i % 2 === 0 ? '' : 'background:#fafafa;'}">
            <td style="padding:14px 16px; font-weight:600; color:#131B23;">${c.empresa || '—'}</td>
            <td style="padding:14px 16px; color:#475569;">${c.contacto || '—'}</td>
            <td style="padding:14px 16px; color:#475569;">${c.telefono || '—'}</td>
            <td style="padding:14px 16px; color:#475569; max-width:200px; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;"
                title="${c.direccion || ''}">${c.direccion || '—'}</td>
            <td style="padding:14px 16px; color:#475569;">${c.codigo_postal || '—'}</td>
            <td style="padding:14px 16px; text-align:center;">
                <button onclick="editarClienteDesdePanel('${c.id}')" type="button"
                    style="padding:6px 12px; background:#3b82f6; color:#fff; border:none;
                           border-radius:6px; cursor:pointer; font-size:.82rem; margin-right:6px;">
                    ✏️ Editar
                </button>
                <button onclick="eliminarCliente('${c.id}', '${c.empresa.replace(/'/g, "\\'")}' )" type="button"
                    style="padding:6px 12px; background:#fee2e2; color:#dc2626; border:1px solid #fca5a5;
                           border-radius:6px; cursor:pointer; font-size:.82rem;">
                    🗑️
                </button>
            </td>
        </tr>
    `).join('');
}

window.filtrarTablaClientes = function (term) {
    if (!term.trim()) {
        renderizarTablaClientes(_todosLosClientes);
        return;
    }
    const t = term.toLowerCase();
    const filtrados = _todosLosClientes.filter(c =>
        (c.empresa   || '').toLowerCase().includes(t) ||
        (c.contacto  || '').toLowerCase().includes(t) ||
        (c.telefono  || '').toLowerCase().includes(t) ||
        (c.direccion || '').toLowerCase().includes(t)
    );
    renderizarTablaClientes(filtrados);
};

window.editarClienteDesdePanel = function (clienteId) {
    abrirModalCliente(clienteId);
    // Al guardar, recargar tabla
    const btnGuardar = document.querySelector('#modalCliente button[onclick="guardarCliente()"]');
    // Override guardarCliente para recargar tabla tras guardar
    window._guardarClienteCallback = cargarTablaClientes;
};

window.eliminarCliente = async function (clienteId, empresa) {
    if (!confirm(`¿Eliminar el cliente "${empresa}"? Esta acción no se puede deshacer.`)) return;

    try {
        const { error } = await window.supabaseClient
            .from('clients')
            .update({ activo: false })
            .eq('id', clienteId);

        if (error) throw error;
        await cargarTablaClientes();
    } catch (err) {
        console.error('Error eliminando cliente:', err);
        alert('Error al eliminar el cliente');
    }
};

// Recargar tabla tras guardar desde el panel
const _guardarClienteOriginal = window.guardarCliente;
window.guardarCliente = async function () {
    await _guardarClienteOriginal();
    // Si el panel está visible, recargar tabla
    if (document.getElementById('clientesPanel')?.style.display !== 'none') {
        await cargarTablaClientes();
    }
};
