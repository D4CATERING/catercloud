// ========== REFERENCIAS FOODBOX/COMIDA (cat 2) y SERVICIOS (cat 3) ==========
// Catálogo completo 2026
// Tipos de cantidad:
//   fijo     → cantidad fija (ej: 2 uds siempre)
//   porPax   → PAX × factor (ej: 15 grs × PAX)
//   cadaXpax → ceil(PAX / divisor) (ej: 1 cada 10 pax)
//   postre   → ceil(PAX × mult_postres del menú)

if (!window.multiplicadores) window.multiplicadores = { saladas: 1, postres: 1 };

// =================== CATÁLOGOS ===================

const CATALOGO_GRIS = [
    { id: 1,  nombre: 'Brocheta capresse',                                       tipo: 'fijo',     cantidad: 1,  unidad: 'ud' },
    { id: 2,  nombre: 'Rollito de primavera con salsa sweet chili',              tipo: 'fijo',     cantidad: 2,  unidad: 'uds' },
    { id: 3,  nombre: 'Croquetas de jamón',                                      tipo: 'fijo',     cantidad: 2,  unidad: 'uds' },
    { id: 4,  nombre: 'Croquetas de boletus',                                    tipo: 'fijo',     cantidad: 2,  unidad: 'uds' },
    { id: 5,  nombre: 'Empanadilla de atún',                                     tipo: 'fijo',     cantidad: 2,  unidad: 'uds' },
    { id: 6,  nombre: 'Tabla de embutidos ibéricos con pan airbag',              tipo: 'porPax',   cantidad: 15, unidad: 'grs' },
    { id: 7,  nombre: 'Falafel con salsa de yogurt',                             tipo: 'fijo',     cantidad: 2,  unidad: 'uds' },
    { id: 8,  nombre: 'Wraps de mortadela trufada',                              tipo: 'fijo',     cantidad: 1,  unidad: 'ud' },
    { id: 9,  nombre: 'Dip de hummus con pan naam',                              tipo: 'cadaXpax', cantidad: 1,  divisor: 10, unidad: 'ud' },
    { id: 10, nombre: 'Tartaleta de nuestra ensaladilla rusa',                   tipo: 'fijo',     cantidad: 2,  unidad: 'uds' },
    { id: 11, nombre: 'Pulguita de tortilla de patata',                          tipo: 'fijo',     cantidad: 1,  unidad: 'ud' },
    { id: 12, nombre: 'Pulguita de verduras asadas',                             tipo: 'fijo',     cantidad: 1,  unidad: 'ud' },
    { id: 13, nombre: 'Pulguita de pollo al curry',                              tipo: 'fijo',     cantidad: 1,  unidad: 'ud' },
    { id: 14, nombre: 'Pulguita de aguacate y tomate',                           tipo: 'fijo',     cantidad: 1,  unidad: 'ud' },
    { id: 15, nombre: 'Quesadilla sincronizada',                                 tipo: 'fijo',     cantidad: 2,  unidad: 'uds' },
    { id: 16, nombre: 'Gyozas con salsa de soja',                                tipo: 'fijo',     cantidad: 2,  unidad: 'uds' },
    { id: 17, nombre: 'Mini croissant mixto',                                    tipo: 'fijo',     cantidad: 1,  unidad: 'ud' },
    { id: 18, nombre: 'Mini croissant de nuestra ensaladilla rusa',              tipo: 'fijo',     cantidad: 1,  unidad: 'ud' },
    { id: 19, nombre: 'Mini sándwich de bacon y mayomostaza',                    tipo: 'fijo',     cantidad: 2,  unidad: 'uds' },
    { id: 20, nombre: 'Mini sándwich de tortilla de patata',                     tipo: 'fijo',     cantidad: 2,  unidad: 'uds' },
    { id: 21, nombre: 'Mini sándwich de crema de aguacate y tomate',             tipo: 'fijo',     cantidad: 2,  unidad: 'uds' },
    { id: 22, nombre: 'Mini sándwich de pollo al curry',                         tipo: 'fijo',     cantidad: 2,  unidad: 'uds' },
    { id: 23, nombre: 'Mini sándwich vegetal',                                   tipo: 'fijo',     cantidad: 2,  unidad: 'uds' },
    { id: 24, nombre: 'Mini sándwich de pechuga de pavo y queso edam',          tipo: 'fijo',     cantidad: 2,  unidad: 'uds' },
    { id: 25, nombre: 'Mini bagel de proteína vegetal',                          tipo: 'fijo',     cantidad: 1,  unidad: 'ud' },
    { id: 26, nombre: 'Mini bagel de mortadela trufada',                         tipo: 'fijo',     cantidad: 1,  unidad: 'ud' },
    { id: 27, nombre: 'Mini bagel de salmón con crema de queso o aguacate',     tipo: 'fijo',     cantidad: 1,  unidad: 'ud' },
    { id: 28, nombre: 'Mini bagel de pastrami y pepinillo agridulce',            tipo: 'fijo',     cantidad: 1,  unidad: 'ud' },
    { id: 29, nombre: 'Mini bagel de roastbeef y cebolla confitada',             tipo: 'fijo',     cantidad: 1,  unidad: 'ud' },
    { id: 30, nombre: 'Mini poke bowl de pollo teriyaki',                        tipo: 'fijo',     cantidad: 1,  unidad: 'ud' },
    { id: 31, nombre: 'Mini ensalada toscana',                                   tipo: 'fijo',     cantidad: 1,  unidad: 'ud' },
    { id: 32, nombre: 'Mini Tabulé de cus cús y garbanzos',                     tipo: 'fijo',     cantidad: 1,  unidad: 'ud' },
    { id: 33, nombre: 'Mini Ensalada griega',                                    tipo: 'fijo',     cantidad: 1,  unidad: 'ud' },
    { id: 34, nombre: 'Mini quiche lorraine tradicional (puerro y bacon)',       tipo: 'fijo',     cantidad: 2,  unidad: 'uds' },
    { id: 35, nombre: 'Mini quiche de tomate seco y verduras',                   tipo: 'fijo',     cantidad: 2,  unidad: 'uds' },
    { id: 36, nombre: 'Bao de pulled pork',                                      tipo: 'fijo',     cantidad: 1,  unidad: 'ud' },
    { id: 37, nombre: 'Tortilla de patata',                                      tipo: 'cadaXpax', cantidad: 1,  divisor: 10, unidad: 'ud' },
    { id: 38, nombre: 'Tortilla de patata con padrón',                           tipo: 'cadaXpax', cantidad: 1,  divisor: 10, unidad: 'ud' },
    { id: 39, nombre: 'Cheese rings con salsa BBQ',                              tipo: 'fijo',     cantidad: 2,  unidad: 'uds' }
];

const CATALOGO_VINO_ESPANOL = [
    { id: 30101, nombre: 'Patatas fritas', tipo: 'fijo', cantidad: 1, unidad: 'ud' },
    { id: 30102, nombre: 'Encurtidos variados', tipo: 'fijo', cantidad: 1, unidad: 'ud' },
    { id: 30103, nombre: 'Dados de queso', tipo: 'fijo', cantidad: 1, unidad: 'ud' },
    { id: 30104, nombre: 'Tortilla de patata', tipo: 'fijo', cantidad: 1, unidad: 'ud' },
    { id: 30105, nombre: 'Tabla de paleta ibérica con picos y pan airbag', tipo: 'fijo', cantidad: 1, unidad: 'ud' },
    { id: 30106, nombre: 'Croquetas de jamón', tipo: 'fijo', cantidad: 1, unidad: 'ud' },
    { id: 30107, nombre: 'Mini bagel de mortadela', tipo: 'fijo', cantidad: 1, unidad: 'ud' },
    { id: 30108, nombre: 'Gilda', tipo: 'fijo', cantidad: 1, unidad: 'ud' },
    { id: 30109, nombre: 'Tabla de quesos internacionales con grissini, dátiles y nueces', tipo: 'fijo', cantidad: 1, unidad: 'ud' },
    { id: 30110, nombre: 'Pulguita de paleta ibérica con tomate', tipo: 'fijo', cantidad: 1, unidad: 'ud' },
    { id: 30111, nombre: 'Croquetas de pollo', tipo: 'fijo', cantidad: 1, unidad: 'ud' },
    { id: 30112, nombre: 'Empanadilla', tipo: 'fijo', cantidad: 1, unidad: 'ud' },
    { id: 30113, nombre: 'Mini wraps de pastrami', tipo: 'fijo', cantidad: 1, unidad: 'ud' },
    { id: 30114, nombre: 'Tortilla de patata con padrón', tipo: 'fijo', cantidad: 1, unidad: 'ud' },
    { id: 30115, nombre: 'Brocheta capresse', tipo: 'fijo', cantidad: 1, unidad: 'ud' },
    { id: 30116, nombre: 'Rollito de primavera con salsa sweet chili', tipo: 'fijo', cantidad: 1, unidad: 'ud' },
    { id: 30117, nombre: 'Croquetas de boletus', tipo: 'fijo', cantidad: 1, unidad: 'ud' },
    { id: 30118, nombre: 'Empanadilla de atún', tipo: 'fijo', cantidad: 1, unidad: 'ud' },
    { id: 30119, nombre: 'Tabla de embutidos ibéricos con pan airbag', tipo: 'fijo', cantidad: 1, unidad: 'ud' },
    { id: 30120, nombre: 'Falafel con salsa de yogurt', tipo: 'fijo', cantidad: 1, unidad: 'ud' },
    { id: 30121, nombre: 'Wraps de mortadela trufada', tipo: 'fijo', cantidad: 1, unidad: 'ud' },
    { id: 30122, nombre: 'Dip de hummus con pan naam', tipo: 'fijo', cantidad: 1, unidad: 'ud' },
    { id: 30123, nombre: 'Tartaleta de nuestra ensaladilla rusa', tipo: 'fijo', cantidad: 1, unidad: 'ud' },
    { id: 30124, nombre: 'Pulguita de tortilla de patata', tipo: 'fijo', cantidad: 1, unidad: 'ud' },
    { id: 30125, nombre: 'Pulguita de verduras asadas', tipo: 'fijo', cantidad: 1, unidad: 'ud' },
    { id: 30126, nombre: 'Quesadilla sincronizada', tipo: 'fijo', cantidad: 1, unidad: 'ud' },
    { id: 30127, nombre: 'Gyozas con salsa de soja', tipo: 'fijo', cantidad: 1, unidad: 'ud' },
    { id: 30128, nombre: 'Mini croissant mixto', tipo: 'fijo', cantidad: 1, unidad: 'ud' },
    { id: 30129, nombre: 'Mini croissant de nuestra ensaladilla rusa', tipo: 'fijo', cantidad: 1, unidad: 'ud' },
    { id: 30130, nombre: 'Mini sándwich de bacon y mayomostaza', tipo: 'fijo', cantidad: 1, unidad: 'ud' },
    { id: 30131, nombre: 'Mini sándwich de tortilla de patata', tipo: 'fijo', cantidad: 1, unidad: 'ud' },
    { id: 30132, nombre: 'Mini sándwich de crema de aguacate y tomate', tipo: 'fijo', cantidad: 1, unidad: 'ud' },
    { id: 30133, nombre: 'Mini sándwich de pollo al curry', tipo: 'fijo', cantidad: 1, unidad: 'ud' },
    { id: 30134, nombre: 'Mini sándwich vegetal', tipo: 'fijo', cantidad: 1, unidad: 'ud' },
    { id: 30135, nombre: 'Mini sándwich de pechuga de pavo y queso edam', tipo: 'fijo', cantidad: 1, unidad: 'ud' },
    { id: 30136, nombre: 'Mini bagel de roastbeef y cebolla confitada', tipo: 'fijo', cantidad: 1, unidad: 'ud' },
    { id: 30137, nombre: 'Mini poke bowl de pollo teriyaki', tipo: 'fijo', cantidad: 1, unidad: 'ud' },
    { id: 30138, nombre: 'Mini ensalada toscana', tipo: 'fijo', cantidad: 1, unidad: 'ud' },
    { id: 30139, nombre: 'Mini Tabulé de cus cús y garbanzos', tipo: 'fijo', cantidad: 1, unidad: 'ud' },
    { id: 30140, nombre: 'Mini Ensalada griega', tipo: 'fijo', cantidad: 1, unidad: 'ud' },
    { id: 30141, nombre: 'Mini quiche lorraine tradicional (puerro y bacon)', tipo: 'fijo', cantidad: 1, unidad: 'ud' },
    { id: 30142, nombre: 'Mini quiche de tomate seco y verduras', tipo: 'fijo', cantidad: 1, unidad: 'ud' },
    { id: 30143, nombre: 'Bao de pulled pork', tipo: 'fijo', cantidad: 1, unidad: 'ud' },
    { id: 30144, nombre: 'Cheese rings con salsa BBQ', tipo: 'fijo', cantidad: 1, unidad: 'ud' }
];

const CATALOGO_ROJO = [
    { id: 101, nombre: 'Totopos con guacamole',                                         tipo: 'cadaXpax', cantidad: 1,  divisor: 10, unidad: 'ud' },
    { id: 102, nombre: 'Empanadilla de calabaza y bacon',                               tipo: 'fijo',     cantidad: 2,  unidad: 'uds' },
    { id: 103, nombre: 'Empanadilla criolla',                                           tipo: 'fijo',     cantidad: 2,  unidad: 'uds' },
    { id: 104, nombre: 'Empanadilla de espinaca y pasas',                               tipo: 'fijo',     cantidad: 2,  unidad: 'uds' },
    { id: 105, nombre: 'Croqueta de pollo',                                             tipo: 'fijo',     cantidad: 2,  unidad: 'uds' },
    { id: 106, nombre: 'Mini sándwich de salmón y queso crema',                        tipo: 'fijo',     cantidad: 2,  unidad: 'uds' },
    { id: 107, nombre: 'Mini sándwich de paleta ibérica con tomate',                   tipo: 'fijo',     cantidad: 2,  unidad: 'uds' },
    { id: 108, nombre: 'Mini sándwich de mortadela, ricotta, tomate y pesto',          tipo: 'fijo',     cantidad: 2,  unidad: 'uds' },
    { id: 109, nombre: 'Mini sándwich de pastrami',                                    tipo: 'fijo',     cantidad: 2,  unidad: 'uds' },
    { id: 110, nombre: 'Mini sándwich de queso gorgonzola y nueces',                  tipo: 'fijo',     cantidad: 2,  unidad: 'uds' },
    { id: 111, nombre: 'Tabla de paleta ibérica con pan airbag',                       tipo: 'porPax',   cantidad: 15, unidad: 'grs' },
    { id: 112, nombre: 'Tabla de quesos internacionales con grissini, dátil y nueces', tipo: 'porPax',   cantidad: 15, unidad: 'grs' },
    { id: 113, nombre: 'Wraps de salmón con aguacate',                                 tipo: 'fijo',     cantidad: 1,  unidad: 'ud' },
    { id: 114, nombre: 'Wraps de pastrami',                                            tipo: 'fijo',     cantidad: 1,  unidad: 'ud' },
    { id: 115, nombre: 'Focaccia de mortadela y queso ricotta',                        tipo: 'fijo',     cantidad: 1,  unidad: 'ud' },
    { id: 116, nombre: 'Mini poke bowl de salmón',                                     tipo: 'fijo',     cantidad: 1,  unidad: 'ud' },
    { id: 117, nombre: 'Mini ensalada cesar',                                          tipo: 'fijo',     cantidad: 1,  unidad: 'ud' },
    { id: 118, nombre: 'Mini ensalada de pasta y pesto con bacon y mozarella',         tipo: 'fijo',     cantidad: 1,  unidad: 'ud' },
    { id: 119, nombre: 'Mini Ensalada L.A.',                                           tipo: 'fijo',     cantidad: 1,  unidad: 'ud' },
    { id: 120, nombre: 'Pollo estilo kentucky con BBQ',                                tipo: 'fijo',     cantidad: 2,  unidad: 'uds' },
    { id: 121, nombre: 'Mini croissant de salmón con crema de queso',                 tipo: 'fijo',     cantidad: 1,  unidad: 'ud' },
    { id: 122, nombre: 'Mini tartaleta de crema de salmón',                           tipo: 'fijo',     cantidad: 2,  unidad: 'uds' },
    { id: 123, nombre: 'Mini quiche de bacalao con cebolla caramelizada',              tipo: 'fijo',     cantidad: 2,  unidad: 'uds' },
    { id: 124, nombre: 'Pulguita de proteína vegetal',                                 tipo: 'fijo',     cantidad: 1,  unidad: 'ud' },
    { id: 125, nombre: 'Pulguita de lomo y pimientos',                                 tipo: 'fijo',     cantidad: 1,  unidad: 'ud' },
    { id: 126, nombre: 'Pulguita de paleta ibérica con tomate',                       tipo: 'fijo',     cantidad: 1,  unidad: 'ud' },
    { id: 127, nombre: 'Pulguita de nuestra ensaladilla rusa',                        tipo: 'fijo',     cantidad: 1,  unidad: 'ud' },
    { id: 128, nombre: 'Mini burger DECUATRO',                                         tipo: 'fijo',     cantidad: 1,  unidad: 'ud' },
    { id: 129, nombre: 'Taco al pastor',                                               tipo: 'fijo',     cantidad: 2,  unidad: 'uds' },
    { id: 130, nombre: 'Taco de tinga de pollo',                                      tipo: 'fijo',     cantidad: 2,  unidad: 'uds' },
    { id: 131, nombre: 'Tortilla de patata con chistorra',                             tipo: 'cadaXpax', cantidad: 1,  divisor: 10, unidad: 'ud' },
    { id: 132, nombre: 'Tortilla rellena de morcilla y piquillo',                      tipo: 'cadaXpax', cantidad: 1,  divisor: 10, unidad: 'ud' },
    { id: 133, nombre: 'Tortilla rellena de ensalada de langostinos',                  tipo: 'cadaXpax', cantidad: 1,  divisor: 10, unidad: 'ud' },
    { id: 134, nombre: 'Tortilla rellena de sobrasada y brie',                         tipo: 'cadaXpax', cantidad: 1,  divisor: 10, unidad: 'ud' }
];

const CATALOGO_POSTRES = [
    { id: 201, nombre: 'Brocheta de fruta',              tipo: 'postre', unidad: 'ud' },
    { id: 202, nombre: 'Mini cheescake',                  tipo: 'postre', unidad: 'ud' },
    { id: 203, nombre: 'Mini brownie con crema inglesa',  tipo: 'postre', unidad: 'ud' },
    { id: 204, nombre: 'Mini arroz con leche',            tipo: 'postre', unidad: 'ud' },
    { id: 205, nombre: 'Mini natillas con galleta',       tipo: 'postre', unidad: 'ud' },
    { id: 206, nombre: 'Mini oreo sweet',                 tipo: 'postre', unidad: 'ud' },
    { id: 207, nombre: 'Mini kitkat shot',                tipo: 'postre', unidad: 'ud' },
    { id: 208, nombre: 'Mini tiramisú',                   tipo: 'postre', unidad: 'ud' }
];

// =================== ESTADO ===================

window.referenciasPaginacion = window.referenciasPaginacion || {
    gris:    { page: 1, perPage: 10, items: [], containerId: 'referenciasGrisGrid',    query: '' },
    rojo:    { page: 1, perPage: 12, items: [], containerId: 'referenciasRojoGrid',    query: '' },
    postres: { page: 1, perPage: 10, items: [], containerId: 'referenciasPostresGrid', query: '' }
};

if (!window.referenciasSeleccionadas) {
    window.referenciasSeleccionadas = { gris: [], rojo: [], postres: [] };
}
if (!window.referenciasExtras) {
    window.referenciasExtras = [];
}

// Alias de compatibilidad con código que use 'saladas'
Object.defineProperty(window.referenciasSeleccionadas, 'saladas', {
    get() { return this.gris; },
    set(v) { this.gris = v; },
    configurable: true
});

// =================== HELPERS ===================

function calcularCantidad(ref, pax) {
    if (ref.fuera_carta) {
        const tipo = ref.grupo === 'postre' ? 'postres' : 'saladas';
        const mult = tipo === 'postres'
            ? (window.multiplicadores?.postres ?? window.menuSeleccionado?.mult_postres ?? 1)
            : (window.multiplicadores?.saladas ?? 1);
        return Math.max(1, Math.ceil((Number(pax) || 0) * mult));
    }
    if (ref.tipo === 'fijo')     return ref.cantidad * pax;       // ej: 2 uds x 20 pax = 40
    if (ref.tipo === 'porPax')   return pax * ref.cantidad;       // ej: 15 grs x 20 pax = 300 grs
    if (ref.tipo === 'cadaXpax') return Math.ceil(pax / (ref.divisor || 15)); // ej: ceil(20/15) = 2
    if (ref.tipo === 'postre') {
        const mult = window.menuSeleccionado?.mult_postres ?? 1;
        return Math.ceil(pax * mult);
    }
    return ref.cantidad || 1;
}

function normalizarTexto(s) {
    return (s || '').toString().trim().toLowerCase()
        .normalize('NFD').replace(/[\u0300-\u036f]/g, '');
}

function textoBusquedaReferencia(ref) {
    return normalizarTexto([
        ref?.nombre,
        ref?.name,
        ref?.descripcion,
        ref?.description,
        ref?.tipo,
        ref?.grupo,
        ref?.categoria,
        ref?.categoria_nombre,
        ref?.unidad,
        ...(ref?.variantes || []).map(v => v?.nombre || v?.name || '')
    ].filter(Boolean).join(' '));
}

function esReferenciaTablaServicio(nombre) {
    const n = normalizarTexto(nombre);
    return n.includes('tabla');
}

function esReferenciaServicioEstipulada(nombre) {
    const n = normalizarTexto(nombre);
    return n.includes('tortilla') || n.includes('dip ');
}

function aplicarReglasCantidadServicios(catalogo, servicioTipo = '') {
    const cantidadNormal = servicioTipo === 'cocteles' ? 1.2 : 1.5;

    return (catalogo || []).map(ref => {
        if ((ref.grupo || 'salado') === 'postre') return ref;

        if (esReferenciaTablaServicio(ref.nombre)) {
            return {
                ...ref,
                tipo: 'porPax',
                cantidad: 15,
                divisor: undefined,
                unidad: 'grs'
            };
        }

        if (esReferenciaServicioEstipulada(ref.nombre)) {
            return {
                ...ref,
                tipo: 'cadaXpax',
                cantidad: 1,
                divisor: 15,
                unidad: 'ud'
            };
        }

        return {
            ...ref,
            tipo: 'fijo',
            cantidad: cantidadNormal,
            divisor: undefined,
            unidad: 'uds'
        };
    });
}

// =================== API PRINCIPAL ===================

async function cargarCatalogoServiciosDesdeSupabase(servicioTipo) {
    if (!window.supabaseClient) throw new Error('Supabase no inicializado');

    const { data, error } = await window.supabaseClient
        .from('service_menu_items')
        .select('id, name, item_group, quantity_type, quantity, divisor, unit, display_order')
        .eq('service_category', servicioTipo)
        .eq('active', true)
        .order('display_order', { ascending: true });

    if (error) throw error;
    if (!data || !data.length) throw new Error(`Sin items activos para ${servicioTipo}`);

    const items = data.map(item => ({
        id: item.id,
        nombre: item.name,
        grupo: item.item_group || 'salado',
        tipo: item.quantity_type || 'fijo',
        cantidad: Number(item.quantity ?? 1),
        divisor: item.quantity_type === 'cadaXpax'
            ? Number(item.divisor || 15)
            : (item.divisor ? Number(item.divisor) : undefined),
        unidad: item.unit || 'ud',
        orden: item.display_order
    }));

    return {
        saladas: items.filter(item => item.grupo !== 'postre'),
        postres: items
            .filter(item => item.grupo === 'postre')
            .map(item => ({
                ...item,
                tipo: item.tipo || 'postre',
                cantidad: Number(item.cantidad ?? 1),
                unidad: item.unidad || 'ud'
            }))
    };
}

async function cargarCatalogoReferenciasMenuDesdeSupabase(categoriaId) {
    if (!window.supabaseClient) throw new Error('Supabase no inicializado');

    const { data, error } = await window.supabaseClient
        .from('menu_reference_items')
        .select('*')
        .eq('category_id', Number(categoriaId))
        .eq('active', true)
        .order('display_order', { ascending: true });

    if (error) throw error;

    const items = (data || []).map(item => ({
        id: item.legacy_id || item.id,
        nombre: item.name,
        grupo: item.item_group || 'gris',
        tipo: item.quantity_type || 'fijo',
        cantidad: Number(item.quantity ?? 1),
        divisor: item.quantity_type === 'cadaXpax'
            ? Number(item.divisor || 15)
            : (item.divisor ? Number(item.divisor) : undefined),
        unidad: item.unit || 'ud',
        orden: item.display_order
    }));

    return {
        gris: items.filter(item => item.grupo === 'gris'),
        rojo: items.filter(item => item.grupo === 'rojo'),
        postres: items.filter(item => item.grupo === 'postre')
    };
}

window.verificarCatalogosMenusSupabase = async function () {
    if (!window.supabaseClient) {
        return { ok: false, error: 'Supabase no inicializado' };
    }

    const consultar = async (tabla, columnas = '*', filtros = []) => {
        let query = window.supabaseClient.from(tabla).select(columnas);
        filtros.forEach(([campo, valor]) => {
            query = query.eq(campo, valor);
        });
        const { data, error } = await query;
        return { data: data || [], error: error || null };
    };

    const [
        menus,
        referenciasMenu,
        servicios,
        foodboxLunch,
        diyDesayunos,
        diyDesayunosVariantes,
        diyFoodbox,
        diyFoodboxVariantes,
        materialesLogistica,
        materialesPorMenu
    ] = await Promise.all([
        consultar('menu_menus', 'id, legacy_id, category_id, name, service_category, active, display_order', [['active', true]]),
        consultar('menu_reference_items', 'id, legacy_id, category_id, menu_legacy_id, item_group, name, active, display_order', [['active', true]]),
        consultar('service_menu_items', 'id, service_category, item_group, name, active, display_order', [['active', true]]),
        consultar('foodbox_opciones', 'id, tipo, nombre, activo, orden', [['activo', true]]),
        consultar('diy_bandejas_desayunos', 'id, categoria, tipo, nombre, activo, orden', [['activo', true]]),
        consultar('diy_bandejas_desayunos_variantes', 'id, opcion_id, nombre, activo, orden', [['activo', true]]),
        consultar('diy_bandejas_foodbox', 'id, tipo, nombre, activo, orden', [['activo', true]]),
        consultar('diy_bandejas_foodbox_variantes', 'id, opcion_id, nombre, activo, orden', [['activo', true]]),
        consultar('logistics_materials', 'id, parent_id, tipo, nombre, activo, orden', [['activo', true]]),
        consultar('menu_materials', 'menu_tipo, material_id, cantidad_base')
    ]);

    const resultado = {
        ok: ![
            menus, referenciasMenu, servicios, foodboxLunch, diyDesayunos,
            diyDesayunosVariantes, diyFoodbox, diyFoodboxVariantes,
            materialesLogistica, materialesPorMenu
        ].some(r => r.error),
        errores: {
            menu_menus: menus.error,
            menu_reference_items: referenciasMenu.error,
            service_menu_items: servicios.error,
            foodbox_opciones: foodboxLunch.error,
            diy_bandejas_desayunos: diyDesayunos.error,
            diy_bandejas_desayunos_variantes: diyDesayunosVariantes.error,
            diy_bandejas_foodbox: diyFoodbox.error,
            diy_bandejas_foodbox_variantes: diyFoodboxVariantes.error,
            logistics_materials: materialesLogistica.error,
            menu_materials: materialesPorMenu.error
        },
        totales: {
            menus: menus.data.length,
            referenciasMenu: referenciasMenu.data.length,
            servicios: servicios.data.length,
            foodboxLunch: foodboxLunch.data.length,
            diyDesayunos: diyDesayunos.data.length,
            diyDesayunosVariantes: diyDesayunosVariantes.data.length,
            diyFoodbox: diyFoodbox.data.length,
            diyFoodboxVariantes: diyFoodboxVariantes.data.length,
            materialesLogistica: materialesLogistica.data.length,
            materialesPorMenu: materialesPorMenu.data.length
        },
        datos: {
            menus: menus.data,
            referenciasMenu: referenciasMenu.data,
            servicios: servicios.data,
            foodboxLunch: foodboxLunch.data,
            diyDesayunos: diyDesayunos.data,
            diyDesayunosVariantes: diyDesayunosVariantes.data,
            diyFoodbox: diyFoodbox.data,
            diyFoodboxVariantes: diyFoodboxVariantes.data,
            materialesLogistica: materialesLogistica.data,
            materialesPorMenu: materialesPorMenu.data
        }
    };

    console.table(resultado.totales);
    return resultado;
};

async function cargarReferencias() {
    window.referenciasSeleccionadas = { gris: [], rojo: [], postres: [] };
    window.referenciasFueraCarta = [];
    window.referenciasExtras = [];

    const servicioTipo = document.getElementById('serviciosCategoria')?.value || '';
    const esServicios = !!window.serviciosMode && parseInt(document.getElementById('categoria')?.value) === 3;
    let catalogoGris = esServicios && servicioTipo === 'vino'
        ? CATALOGO_VINO_ESPANOL
        : CATALOGO_GRIS;
    let catalogoRojo = esServicios ? [] : CATALOGO_ROJO;
    let catalogoPostres = CATALOGO_POSTRES;
    let serviciosDesdeSupabase = false;

    if (esServicios) {
        try {
            const catalogosServicios = await cargarCatalogoServiciosDesdeSupabase(servicioTipo);
            serviciosDesdeSupabase = true;
            catalogoGris = catalogosServicios.saladas;
            catalogoPostres = catalogosServicios.postres.length
                ? catalogosServicios.postres
                : (servicioTipo === 'cocteles' ? CATALOGO_POSTRES : []);
        } catch (error) {
            console.warn('No se pudo cargar Servicios desde Supabase. Usando respaldo local.', error);
        }
    }
    if (!esServicios && parseInt(document.getElementById('categoria')?.value) === 2) {
        try {
            const catalogosMenu = await cargarCatalogoReferenciasMenuDesdeSupabase(2);
            if (catalogosMenu.gris.length) catalogoGris = catalogosMenu.gris;
            if (catalogosMenu.rojo.length) catalogoRojo = catalogosMenu.rojo;
            if (catalogosMenu.postres.length) catalogoPostres = catalogosMenu.postres;
        } catch (error) {
            console.warn('No se pudieron cargar referencias de menú desde Supabase. Usando respaldo local.', error);
        }
    }
    if (esServicios) {
        aplicarReferenciasObligatoriasServicios(catalogoGris);
    }
    if (esServicios && !serviciosDesdeSupabase) {
        catalogoGris = aplicarReglasCantidadServicios(catalogoGris, servicioTipo);
    }

    const perPageGris = esServicios ? 20 : 10;

    initReferenciasPaginadas('gris',    catalogoGris,     'referenciasGrisGrid',    perPageGris);
    initReferenciasPaginadas('rojo',    catalogoRojo,     'referenciasRojoGrid',    12);
    initReferenciasPaginadas('postres', catalogoPostres,  'referenciasPostresGrid', esServicios ? 20 : 10);

    asegurarReferenciasFueraCartaSection();
    renderReferenciasFueraCarta();
    actualizarContadoresSeleccion();
}

function getReferenciasObligatoriasServicios() {
    if (!window.serviciosMode) return [];
    const servicioTipo = document.getElementById('serviciosCategoria')?.value || '';
    if (servicioTipo !== 'vino') return [];

    const menu = normalizarTexto(window.menuSeleccionado?.nombre || '');
    if (menu === 'brindis' || menu === 'networking') {
        return ['Patatas fritas', 'Encurtidos variados'];
    }
    if (menu === 'afterwork') {
        return ['Patatas fritas'];
    }
    return [];
}

function aplicarReferenciasObligatoriasServicios(catalogo) {
    const obligatorias = getReferenciasObligatoriasServicios();
    if (!obligatorias.length) return;

    const obligatoriasNorm = obligatorias.map(normalizarTexto);
    catalogo.forEach(ref => {
        ref.obligatoria = obligatoriasNorm.includes(normalizarTexto(ref.nombre));
    });

    if (!window.referenciasSeleccionadas.gris) window.referenciasSeleccionadas.gris = [];

    catalogo
        .filter(ref => ref.obligatoria)
        .forEach(ref => {
            const existe = window.referenciasSeleccionadas.gris.some(sel => String(sel.id) === String(ref.id));
            if (!existe) {
                window.referenciasSeleccionadas.gris.push({
                    id: String(ref.id),
                    nombre: ref.nombre,
                    cantidad: calcularCantidad(ref, window.pax || 0),
                    unidad: ref.unidad || 'uds',
                    obligatoria: true
                });
            }
        });
}

// =================== BUSCADOR ===================

function ensureBuscador(tipo) {
    const st = window.referenciasPaginacion[tipo];
    const container = document.getElementById(st.containerId);
    if (!container) return;
    const searchId = `${st.containerId}__search`;
    const clearId = `${st.containerId}__clear`;
    const enlazarBuscador = () => {
        const input = document.getElementById(searchId);
        const clear = document.getElementById(clearId);
        if (!input || !clear) return;

        const getEstadoActual = () => window.referenciasPaginacion?.[tipo] || st;
        const syncClear = () => clear.classList.toggle('hidden', !input.value.trim());
        input.value = getEstadoActual().query || '';
        syncClear();

        input.oninput = () => {
            const estadoActual = getEstadoActual();
            estadoActual.query = input.value || '';
            estadoActual.page = 1;
            syncClear();
            renderReferenciasPagina(tipo);
        };
        clear.onclick = () => {
            const estadoActual = getEstadoActual();
            estadoActual.query = '';
            input.value = '';
            estadoActual.page = 1;
            syncClear();
            renderReferenciasPagina(tipo);
            input.focus();
        };
    };

    if (document.getElementById(searchId)) {
        enlazarBuscador();
        return;
    }

    const wrapper = document.createElement('div');
    wrapper.className = 'referencias-search';
    wrapper.innerHTML = `
        <input id="${searchId}" type="text"
            placeholder="Buscar..." value="${st.query || ''}" autocomplete="off"/>
        <button type="button" id="${clearId}" class="search-clear hidden">
            <svg viewBox="0 0 24 24" width="16" height="16">
                <path d="M18 6L6 18M6 6l12 12" fill="none" stroke="currentColor"
                    stroke-width="2" stroke-linecap="round"/>
            </svg>
        </button>`;

    container.parentNode.insertBefore(wrapper, container);
    enlazarBuscador();
}

// =================== PAGINACIÓN ===================

function initReferenciasPaginadas(tipo, referencias, containerId, perPage) {
    window.referenciasPaginacion[tipo] = {
        page: 1, perPage, items: referencias, containerId,
        query: window.referenciasPaginacion?.[tipo]?.query || ''
    };
    ensureBuscador(tipo);
    renderReferenciasPagina(tipo);
}

function getItemsFiltrados(tipo) {
    const st = window.referenciasPaginacion[tipo];
    const q = normalizarTexto(st.query || '');
    if (!q) return st.items || [];
    return (st.items || []).filter(r => textoBusquedaReferencia(r).includes(q));
}

function renderReferenciasPagina(tipo) {
    const st = window.referenciasPaginacion[tipo];
    const container = document.getElementById(st.containerId);
    if (!container) return;

    container.classList.add('referencias-grid');

    const items = getItemsFiltrados(tipo);
    const totalPages = Math.max(1, Math.ceil(items.length / st.perPage));
    if (st.page > totalPages) st.page = totalPages;
    if (st.page < 1) st.page = 1;

    const slice = items.slice((st.page - 1) * st.perPage, st.page * st.perPage);
    const pax   = window.pax || 0;
    container.innerHTML = '';

    slice.forEach(ref => {
        const seleccionadas   = window.referenciasSeleccionadas[tipo] || [];
        const selected        = seleccionadas.find(r => String(r.id) === String(ref.id));
        const obligatoria     = !!ref.obligatoria || !!selected?.obligatoria;
        const cantCalculada   = calcularCantidad(ref, pax);
        const cantMostrar     = selected ? selected.cantidad : cantCalculada;

        const div = document.createElement('div');
        div.className = 'referencia-option' + (tipo === 'rojo' ? ' referencia-roja' : '');
        div.dataset.id   = String(ref.id);
        div.dataset.tipo = tipo;
        if (selected) div.classList.add('selected');
        if (obligatoria) div.classList.add('obligatoria');

        // Badge fijo (cantidad base de la carta, no cambia con PAX)
        let badgeLabel = '';
        if (ref.tipo === 'porPax') {
            badgeLabel = `${ref.cantidad} grs/pax`;
        } else if (ref.tipo === 'cadaXpax') {
            badgeLabel = `1 c/${ref.divisor || 15}pax`;
        } else if (ref.tipo === 'postre') {
            badgeLabel = `${window.menuSeleccionado?.mult_postres ?? 1}/pax`;
        } else {
            badgeLabel = `${ref.cantidad} ${ref.unidad}`;
        }

        div.innerHTML = `
            <span style="flex:1; font-size:0.82rem;">${ref.nombre}</span>
            <div class="cantidad-control" style="gap:4px; align-items:center;">
                ${obligatoria ? '<span class="ref-required-badge">Incluido</span>' : ''}
                <span class="ref-cant-badge" style="font-size:0.75rem;color:#64748b;white-space:nowrap;">${badgeLabel}</span>
                <input type="number" class="cantidad-input" value="${cantMostrar}" min="0.1" step="0.5"
                    style="width:52px;"
                    onfocus="this.select()"
                    oninput="actualizarCantidadReferencia('${String(ref.id).replace(/'/g, "\\'")}', '${tipo}', this.value)">
            </div>`;

        div.onclick = (e) => {
            if (e.target.classList.contains('cantidad-input')) return;
            if (obligatoria) return;
            seleccionarReferenciaPrincipal(ref.id, ref.nombre, tipo, div, cantCalculada, ref.unidad);
            enfocarCantidadReferencia(div);
        };

        container.appendChild(div);
    });

    // Paginador
    const pager = document.createElement('div');
    pager.className = 'pager-sutil';
    pager.innerHTML = `
        <button type="button" class="pager-btn" data-dir="-1">‹</button>
        <span class="pager-text">${st.page} / ${totalPages}</span>
        <button type="button" class="pager-btn" data-dir="1">›</button>`;
    pager.querySelector('[data-dir="-1"]').disabled = st.page <= 1;
    pager.querySelector('[data-dir="1"]').disabled  = st.page >= totalPages;
    pager.querySelector('[data-dir="-1"]').onclick  = () => { st.page--; renderReferenciasPagina(tipo); };
    pager.querySelector('[data-dir="1"]').onclick   = () => { st.page++; renderReferenciasPagina(tipo); };
    container.appendChild(pager);
}

function enfocarCantidadReferencia(element) {
    setTimeout(() => {
        const input = element?.querySelector?.('.cantidad-input');
        if (!input) return;
        input.focus();
        input.select();
    }, 0);
}

// =================== SELECCIÓN ===================

function asegurarReferenciasFueraCartaSection() {
    const section = document.getElementById('referenciasSection');
    const body = section?.querySelector('.dc-section-body');
    if (!body || document.getElementById('referenciasFueraCartaSection')) return;

    body.insertAdjacentHTML('beforeend', `
        <div id="referenciasFueraCartaSection" class="referencias-group referencias-fuera-carta">
            <div class="referencias-group-header">
                <label class="referencias-group-title">Fuera de carta</label>
                <span id="contadorFueraCarta" class="referencias-counter">0</span>
            </div>
            <div class="fuera-carta-form">
                <input type="text" id="fueraCartaNombre" class="dc-input" placeholder="Nombre de la referencia">
                <select id="fueraCartaTipo" class="dc-input">
                    <option value="saladas">Salada</option>
                    <option value="postres">Postre</option>
                </select>
                <input type="number" id="fueraCartaCantidad" class="dc-input" min="0.1" step="0.5" placeholder="Auto">
                <select id="fueraCartaUnidad" class="dc-input">
                    <option value="uds">uds</option>
                    <option value="ud">ud</option>
                    <option value="grs">grs</option>
                    <option value="kg">kg</option>
                    <option value="bandeja">bandeja</option>
                    <option value="porción">porción</option>
                </select>
                <button type="button" class="btn-fuera-carta" onclick="agregarReferenciaFueraCarta()">+ Añadir</button>
            </div>
            <div id="referenciasFueraCartaList" class="fuera-carta-list"></div>
        </div>
        <div id="referenciasExtrasSection" class="referencias-group referencias-extras-carta">
            <div class="referencias-group-header">
                <label class="referencias-group-title">Extras</label>
                <span id="contadorExtrasCarta" class="referencias-counter">0</span>
            </div>
            <div class="fuera-carta-form">
                <input type="text" id="extraCartaNombre" class="dc-input" placeholder="Nombre del extra">
                <select id="extraCartaTipo" class="dc-input">
                    <option value="saladas">Salada</option>
                    <option value="postres">Postre</option>
                </select>
                <input type="number" id="extraCartaCantidad" class="dc-input" min="0.1" step="0.5" placeholder="Cantidad">
                <select id="extraCartaUnidad" class="dc-input">
                    <option value="uds">uds</option>
                    <option value="ud">ud</option>
                    <option value="grs">grs</option>
                    <option value="kg">kg</option>
                    <option value="bandeja">bandeja</option>
                    <option value="porción">porción</option>
                </select>
                <button type="button" class="btn-fuera-carta btn-extra-carta" onclick="agregarReferenciaExtraCarta()">+ Añadir</button>
            </div>
            <div id="referenciasExtrasList" class="fuera-carta-list"></div>
        </div>
    `);
}

function getTipoSeleccionFueraCarta(tipo) {
    return tipo === 'postres' ? 'postres' : 'gris';
}

function getMaxReferenciasPorTipoSeleccion(tipoSeleccion) {
    if (tipoSeleccion === 'postres') return window.menuSeleccionado?.items_postres_max || 0;
    return (window.menuSeleccionado?.items_gris_max || window.menuSeleccionado?.items_salados_max || 0)
        + (window.menuSeleccionado?.items_rojo_max || 0);
}

function contarReferenciasSeleccionadas(tipoGrupo) {
    if (tipoGrupo === 'postres') return (window.referenciasSeleccionadas?.postres || []).length;

    const ids = new Set();
    ['gris', 'rojo'].forEach(tipo => {
        (window.referenciasSeleccionadas?.[tipo] || []).forEach(ref => ids.add(String(ref.id)));
    });
    return ids.size;
}

function calcularCantidadFueraCarta(tipo) {
    return calcularCantidad({
        fuera_carta: true,
        grupo: tipo === 'postres' ? 'postre' : 'salado'
    }, window.pax || 0);
}

function agregarReferenciaFueraCarta() {
    asegurarReferenciasFueraCartaSection();

    const nombreEl = document.getElementById('fueraCartaNombre');
    const tipoEl = document.getElementById('fueraCartaTipo');
    const cantidadEl = document.getElementById('fueraCartaCantidad');
    const unidadEl = document.getElementById('fueraCartaUnidad');

    const nombre = (nombreEl?.value || '').trim();
    const tipo = tipoEl?.value || 'saladas';
    const tipoSeleccion = getTipoSeleccionFueraCarta(tipo);
    const unidad = unidadEl?.value || 'uds';
    const cantidadManual = cantidadEl?.value !== '';
    const cantidad = cantidadManual
        ? Math.max(0.1, parseFloat(cantidadEl.value) || 1)
        : calcularCantidadFueraCarta(tipo);

    if (!nombre) {
        alert('Escribe el nombre de la referencia fuera de carta.');
        nombreEl?.focus();
        return;
    }

    const max = getMaxReferenciasPorTipoSeleccion(tipoSeleccion);
    if (tipoSeleccion === 'postres' && max <= 0) {
        alert('Este menú no requiere postres.');
        return;
    }
    const totalActual = contarReferenciasSeleccionadas(tipoSeleccion === 'postres' ? 'postres' : 'saladas');
    if (max > 0 && totalActual >= max) {
        alert(`Ya tienes seleccionadas las ${max} referencias permitidas para este grupo.`);
        return;
    }

    if (!window.referenciasSeleccionadas[tipoSeleccion]) window.referenciasSeleccionadas[tipoSeleccion] = [];

    const ref = {
        id: `fuera_carta_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
        nombre,
        cantidad,
        unidad,
        fuera_carta: true,
        cantidad_manual: cantidadManual,
        grupo: tipo === 'postres' ? 'postre' : 'salado'
    };

    window.referenciasSeleccionadas[tipoSeleccion].push(ref);
    window.referenciasFueraCarta = [...(window.referenciasFueraCarta || []), { ...ref, tipoSeleccion }];

    if (nombreEl) nombreEl.value = '';
    if (cantidadEl) cantidadEl.value = '';
    renderReferenciasFueraCarta();
    actualizarContadoresSeleccion();
}

function eliminarReferenciaFueraCarta(refId) {
    ['gris', 'rojo', 'postres'].forEach(tipo => {
        const arr = window.referenciasSeleccionadas?.[tipo] || [];
        const idx = arr.findIndex(ref => String(ref.id) === String(refId));
        if (idx >= 0) arr.splice(idx, 1);
    });
    window.referenciasFueraCarta = (window.referenciasFueraCarta || []).filter(ref => String(ref.id) !== String(refId));
    renderReferenciasFueraCarta();
    actualizarContadoresSeleccion();
}

function actualizarCantidadFueraCarta(refId, cantidad) {
    const valor = Math.max(0.1, parseFloat(cantidad) || 1);
    ['gris', 'rojo', 'postres'].forEach(tipo => {
        const ref = (window.referenciasSeleccionadas?.[tipo] || []).find(item => String(item.id) === String(refId));
        if (ref) {
            ref.cantidad = valor;
            ref.cantidad_manual = true;
        }
    });
    const refLista = (window.referenciasFueraCarta || []).find(item => String(item.id) === String(refId));
    if (refLista) {
        refLista.cantidad = valor;
        refLista.cantidad_manual = true;
    }
}

function renderReferenciasFueraCarta() {
    asegurarReferenciasFueraCartaSection();
    const list = document.getElementById('referenciasFueraCartaList');
    const contador = document.getElementById('contadorFueraCarta');
    if (!list) return;

    const items = [
        ...(window.referenciasSeleccionadas?.gris || []),
        ...(window.referenciasSeleccionadas?.rojo || []),
        ...(window.referenciasSeleccionadas?.postres || [])
    ].filter(ref => ref.fuera_carta);

    window.referenciasFueraCarta = items.map(ref => ({
        ...ref,
        tipoSeleccion: ref.grupo === 'postre' ? 'postres' : 'gris'
    }));

    if (contador) contador.textContent = String(items.length);
    if (!items.length) {
        list.innerHTML = '<div class="fuera-carta-empty">Sin referencias fuera de carta.</div>';
        return;
    }

    list.innerHTML = items.map(ref => `
        <div class="fuera-carta-item">
            <div class="fuera-carta-name">
                <strong>${ref.nombre}</strong>
                <span>${ref.grupo === 'postre' ? 'Postre' : 'Salada'}</span>
            </div>
            <input type="number" min="0.1" step="0.5" value="${ref.cantidad || 1}"
                oninput="actualizarCantidadFueraCarta('${String(ref.id).replace(/'/g, "\\'")}', this.value)">
            <span class="fuera-carta-unit">${ref.unidad || 'uds'}</span>
            <button type="button" class="fuera-carta-delete"
                onclick="eliminarReferenciaFueraCarta('${String(ref.id).replace(/'/g, "\\'")}')">×</button>
        </div>
    `).join('');
}

function agregarReferenciaExtraCarta() {
    asegurarReferenciasFueraCartaSection();

    const nombreEl = document.getElementById('extraCartaNombre');
    const tipoEl = document.getElementById('extraCartaTipo');
    const cantidadEl = document.getElementById('extraCartaCantidad');
    const unidadEl = document.getElementById('extraCartaUnidad');

    const nombre = (nombreEl?.value || '').trim();
    const tipo = tipoEl?.value || 'saladas';
    const cantidad = Math.max(0.1, parseFloat(cantidadEl?.value) || 1);
    const unidad = unidadEl?.value || 'uds';

    if (!nombre) {
        alert('Escribe el nombre del extra.');
        nombreEl?.focus();
        return;
    }

    window.referenciasExtras = [
        ...(window.referenciasExtras || []),
        {
            id: `extra_carta_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
            nombre,
            cantidad,
            unidad,
            tipo,
            grupo: tipo === 'postres' ? 'postre' : 'salado',
            extra_carta: true
        }
    ];

    if (nombreEl) nombreEl.value = '';
    if (cantidadEl) cantidadEl.value = '';
    renderReferenciasExtras();
}

function eliminarReferenciaExtraCarta(refId) {
    window.referenciasExtras = (window.referenciasExtras || []).filter(ref => String(ref.id) !== String(refId));
    renderReferenciasExtras();
}

function actualizarCantidadExtraCarta(refId, cantidad) {
    const ref = (window.referenciasExtras || []).find(item => String(item.id) === String(refId));
    if (ref) ref.cantidad = Math.max(0.1, parseFloat(cantidad) || 1);
}

function renderReferenciasExtras() {
    asegurarReferenciasFueraCartaSection();
    const list = document.getElementById('referenciasExtrasList');
    const contador = document.getElementById('contadorExtrasCarta');
    if (!list) return;

    const items = window.referenciasExtras || [];
    if (contador) contador.textContent = String(items.length);
    if (!items.length) {
        list.innerHTML = '<div class="fuera-carta-empty">Sin extras añadidos.</div>';
        return;
    }

    list.innerHTML = items.map(ref => `
        <div class="fuera-carta-item fuera-carta-item--extra">
            <div class="fuera-carta-name">
                <strong>${ref.nombre}</strong>
                <span>${ref.grupo === 'postre' ? 'Postre extra' : 'Salada extra'}</span>
            </div>
            <input type="number" min="0.1" step="0.5" value="${ref.cantidad || 1}"
                oninput="actualizarCantidadExtraCarta('${String(ref.id).replace(/'/g, "\\'")}', this.value)">
            <span class="fuera-carta-unit">${ref.unidad || 'uds'}</span>
            <button type="button" class="fuera-carta-delete"
                onclick="eliminarReferenciaExtraCarta('${String(ref.id).replace(/'/g, "\\'")}')">×</button>
        </div>
    `).join('');
}

function seleccionarReferenciaPrincipal(refId, refNombre, tipo, element, cantidad, unidad) {
    const max = tipo === 'gris'
        ? (window.menuSeleccionado?.items_gris_max || window.menuSeleccionado?.items_salados_max || 0)
        : tipo === 'rojo'
            ? (window.menuSeleccionado?.items_rojo_max || 0)
            : (window.menuSeleccionado?.items_postres_max || 0);

    if (!window.referenciasSeleccionadas[tipo]) window.referenciasSeleccionadas[tipo] = [];
    const seleccionadas = window.referenciasSeleccionadas[tipo];
    const index = seleccionadas.findIndex(r => String(r.id) === String(refId));

    if (index > -1) {
        if (seleccionadas[index].obligatoria) {
            alert('Este item es obligatorio para el servicio seleccionado.');
            return;
        }
        seleccionadas.splice(index, 1);
        if (element) element.classList.remove('selected');
        actualizarContadoresSeleccion();
        return;
    }

    const totalActual = tipo === 'postres'
        ? contarReferenciasSeleccionadas('postres')
        : (tipo === 'rojo' ? seleccionadas.length : contarReferenciasSeleccionadas('saladas'));
    if (max > 0 && totalActual >= max) {
        const label = tipo === 'gris' ? 'grises' : tipo === 'rojo' ? 'rojas' : 'postres';
        alert(`Solo puedes seleccionar hasta ${max} referencias ${label}`);
        return;
    }

    const cantInput = parseFloat(element?.querySelector('.cantidad-input')?.value) || cantidad || 1;
    seleccionadas.push({ id: String(refId), nombre: refNombre, cantidad: cantInput, unidad: unidad || 'uds' });
    if (element) element.classList.add('selected');
    actualizarContadoresSeleccion();
}

function actualizarContadoresSeleccion() {
    const grisMax    = window.menuSeleccionado?.items_gris_max || window.menuSeleccionado?.items_salados_max || 0;
    const rojoMax    = window.menuSeleccionado?.items_rojo_max    || 0;
    const postresMax = window.menuSeleccionado?.items_postres_max || 0;

    const grisCount    = contarReferenciasSeleccionadas('saladas');
    const rojoCount    = (window.referenciasSeleccionadas?.rojo    || []).length;
    const postresCount = (window.referenciasSeleccionadas?.postres || []).length;

    const elGris    = document.getElementById('contadorGris');
    const elRojo    = document.getElementById('contadorRojo');
    const elPostres = document.getElementById('contadorPostres');

    if (elGris)    elGris.textContent    = `${grisCount} / ${grisMax}`;
    if (elRojo)    elRojo.textContent    = `${rojoCount} / ${rojoMax}`;
    if (elPostres) elPostres.textContent = `${postresCount} / ${postresMax}`;
}

function actualizarCantidadReferencia(refId, tipo, cantidad) {
    const sel = (window.referenciasSeleccionadas[tipo] || []).find(r => String(r.id) === String(refId));
    if (sel) {
        sel.cantidad = parseFloat(cantidad) || 1;
        sel.cantidad_manual = true;
    }
}

// Compatibilidad con código antiguo
function actualizarCantidadesReferencias() {
    const pax = window.pax || 0;

    // Recalcular cantidades de referencias ya seleccionadas según nuevo PAX
    ['gris', 'rojo', 'postres'].forEach(tipo => {
        const catalogo = window.referenciasPaginacion?.[tipo]?.items
                       || (tipo === 'gris' ? CATALOGO_GRIS
                       : tipo === 'rojo' ? CATALOGO_ROJO
                       : CATALOGO_POSTRES);

        (window.referenciasSeleccionadas[tipo] || []).forEach(sel => {
            if (sel.cantidad_manual || sel._cantidad_guardada_edicion) return;
            const ref = catalogo.find(r => String(r.id) === String(sel.id));
            if (sel.fuera_carta && !sel.cantidad_manual) {
                sel.cantidad = calcularCantidad(sel, pax);
            } else if (ref) {
                sel.cantidad = calcularCantidad(ref, pax);
            }
        });

        renderReferenciasPagina(tipo);
    });
    renderReferenciasFueraCarta();
    renderReferenciasExtras();
}

function actualizarUnidadReferencia() {}  // ya no se usa, unidad viene del catálogo

window.agregarReferenciaFueraCarta = agregarReferenciaFueraCarta;
window.eliminarReferenciaFueraCarta = eliminarReferenciaFueraCarta;
window.actualizarCantidadFueraCarta = actualizarCantidadFueraCarta;
window.agregarReferenciaExtraCarta = agregarReferenciaExtraCarta;
window.eliminarReferenciaExtraCarta = eliminarReferenciaExtraCarta;
window.actualizarCantidadExtraCarta = actualizarCantidadExtraCarta;
window.renderReferenciasExtras = renderReferenciasExtras;
window.contarReferenciasSeleccionadas = contarReferenciasSeleccionadas;
