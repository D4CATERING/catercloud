// ============================================================
// FOODBOX LUNCH - CON SUPABASE
// ============================================================

console.log('🟢 Foodbox Lunch cargado (con Supabase)');

async function cargarOpcionesDesdeSupabase() {
    try {
        // Verificar que supabaseClient existe
        if (!window.supabaseClient) {
            throw new Error('Supabase client no está inicializado');
        }
        
        const { data, error } = await window.supabaseClient
            .from('foodbox_opciones')
            .select('*')
            .eq('activo', true)
            .order('orden', { ascending: true });
        
        if (error) throw error;
        
        const opciones = {
            ensaladas: data.filter(item => item.tipo === 'ensalada'),
            sandwiches: data.filter(item => item.tipo === 'sandwich'),
            postres: data.filter(item => item.tipo === 'postre')
        };
        
        console.log('✅ Opciones cargadas desde Supabase:', opciones);
        return opciones;
        
    } catch (error) {
        console.error('❌ Error cargando opciones de Supabase:', error);
        console.log('⚠️ Usando opciones de fallback');
        
        // Fallback a opciones hardcodeadas
        return {
            ensaladas: [
                { id: 'ens1', nombre: 'Poke bowl de salmón' },
                { id: 'ens2', nombre: 'Ensalada caprese' },
                { id: 'ens3', nombre: 'Ensalada de pasta & pesto con bacon crujiente' }
            ],
            sandwiches: [
                { id: 'san1', nombre: 'Sandwich x3' },
                { id: 'san2', nombre: 'Fajitas de pollo y verdura' },
                { id: 'san3', nombre: 'Bagel pastrami' }
            ],
            postres: [
                { id: 'pos1', nombre: 'Vaso de fruta natural' },
                { id: 'pos2', nombre: 'Cremoso de cheese cake' },
                { id: 'pos3', nombre: 'Brownie con natillas' }
            ]
        };
    }
}

function cargarOpcionesFoodboxLunch() {
    console.log('📦 Iniciando Foodbox Lunch');
    
    const categoriaId = parseInt(document.getElementById('categoria').value);
    if (categoriaId !== 4) return;
    
    if (document.getElementById('multiplicadorSection')) 
        document.getElementById('multiplicadorSection').style.display = 'none';
    if (document.getElementById('referenciasSection')) 
        document.getElementById('referenciasSection').style.display = 'none';
    if (document.getElementById('desayunoReferencesSection')) 
        document.getElementById('desayunoReferencesSection').style.display = 'none';
    
    const old = document.getElementById('foodboxLunchSection');
    if (old) old.remove();
    
    const ref = document.querySelector('#referenciasSection');
    if (!ref) {
        console.error('❌ No se encontró #referenciasSection');
        return;
    }
    
    ref.insertAdjacentHTML('afterend', `
        <div class="form-section dc-section" id="foodboxLunchSection">
            <div class="dc-section-header"><h3>🥗 Foodbox Lunch</h3></div>
            <p style="font-size: 0.75rem; color: #64748b; margin-bottom: 15px;">Selecciona las opciones</p>
            
            <div style="margin-bottom: 15px;">
                <h4 class="foodbox-titulo">🥗 Ensaladas</h4>
                <div id="foodboxEnsaladasGrid" class="foodbox-grid"></div>
            </div>
            
            <div style="margin-bottom: 15px;">
                <h4 class="foodbox-titulo">🥪 Sandwiches</h4>
                <div id="foodboxSandwichesGrid" class="foodbox-grid"></div>
            </div>
            
            <div style="margin-bottom: 15px;">
                <h4 class="foodbox-titulo">🍰 Postres</h4>
                <div id="foodboxPostresGrid" class="foodbox-grid"></div>
            </div>
        </div>
    `);
    
    setTimeout(async () => {
        const eg = document.getElementById('foodboxEnsaladasGrid');
        const sg = document.getElementById('foodboxSandwichesGrid');
        const pg = document.getElementById('foodboxPostresGrid');
        
        if (!eg) return;
        
        window.foodboxSelecciones = { ensaladas: [], sandwiches: [], postres: [] };
        
        const opciones = await cargarOpcionesDesdeSupabase();
        
        renderFB(eg, opciones.ensaladas, 'ensaladas');
        renderFB(sg, opciones.sandwiches, 'sandwiches');
        renderFB(pg, opciones.postres, 'postres');
        
        console.log('✅ Foodbox cargado con', 
            opciones.ensaladas.length, 'ensaladas,',
            opciones.sandwiches.length, 'sandwiches,',
            opciones.postres.length, 'postres');
    }, 100);
}

function renderFB(cont, lista, tipo) {
    let h = '';
    lista.forEach(o => {
        const itemId = o.id || o.nombre.toLowerCase().replace(/\s+/g, '_').substring(0, 50);
        h += `<div class="foodbox-item" data-id="${itemId}">
            <span style="font-size:0.75rem;">${o.nombre}</span>
            <div style="display:flex;gap:4px;">
                <button type="button" onclick="fbChg('${itemId}','${tipo}',-1)" style="width:24px;height:24px;padding:0;">−</button>
                <input type="number" id="fb_${itemId}" value="0" min="0" onchange="fbUpd('${itemId}','${tipo}',this.value)" style="width:45px;height:24px;text-align:center;font-size:0.75rem;">
                <button type="button" onclick="fbChg('${itemId}','${tipo}',1)" style="width:24px;height:24px;padding:0;">+</button>
            </div>
        </div>`;
    });
    cont.innerHTML = h;
}

function fbChg(id, tipo, d) {
    const inp = document.getElementById('fb_' + id);
    if (!inp) return;
    let v = parseInt(inp.value) || 0;
    v += d;
    if (v < 0) v = 0;
    inp.value = v;
    fbUpd(id, tipo, v);
}

function fbUpd(id, tipo, val) {
    const c = parseInt(val) || 0;
    if (!window.foodboxSelecciones) window.foodboxSelecciones = { ensaladas: [], sandwiches: [], postres: [] };
    
    const idx = window.foodboxSelecciones[tipo].findIndex(i => i.id === id);
    
    if (c > 0) {
        const elem = document.querySelector(`[data-id="${id}"]`);
        const nombre = elem ? elem.querySelector('span').textContent : id;
        
        if (idx >= 0) {
            window.foodboxSelecciones[tipo][idx].cantidad = c;
        } else {
            window.foodboxSelecciones[tipo].push({ id, nombre, cantidad: c });
        }
    } else {
        if (idx >= 0) window.foodboxSelecciones[tipo].splice(idx, 1);
    }
}

function obtenerSeleccionesFoodboxLunch() {
    return window.foodboxSelecciones || { ensaladas: [], sandwiches: [], postres: [] };
}

window.cargarOpcionesFoodboxLunch = cargarOpcionesFoodboxLunch;
window.obtenerSeleccionesFoodboxLunch = obtenerSeleccionesFoodboxLunch;

console.log('✅ Módulo Foodbox Lunch listo');
