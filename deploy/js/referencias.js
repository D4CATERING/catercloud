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
    rojo:    { page: 1, perPage: 10, items: [], containerId: 'referenciasRojoGrid',    query: '' },
    postres: { page: 1, perPage: 8,  items: [], containerId: 'referenciasPostresGrid', query: '' }
};

if (!window.referenciasSeleccionadas) {
    window.referenciasSeleccionadas = { gris: [], rojo: [], postres: [] };
}

// Alias de compatibilidad con código que use 'saladas'
Object.defineProperty(window.referenciasSeleccionadas, 'saladas', {
    get() { return this.gris; },
    set(v) { this.gris = v; },
    configurable: true
});

// =================== HELPERS ===================

function calcularCantidad(ref, pax) {
    if (ref.tipo === 'fijo')     return ref.cantidad * pax;       // ej: 2 uds × 20 pax = 40
    if (ref.tipo === 'porPax')   return pax * ref.cantidad;       // ej: 15 grs × 20 pax = 300 grs
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
        saladas: aplicarReglasCantidadServicios(items.filter(item => item.grupo !== 'postre'), servicioTipo),
        postres: items
            .filter(item => item.grupo === 'postre')
            .map(item => ({
                ...item,
                tipo: 'postre',
                cantidad: 1,
                unidad: 'ud'
            }))
    };
}

async function cargarReferencias() {
    window.referenciasSeleccionadas = { gris: [], rojo: [], postres: [] };

    const servicioTipo = document.getElementById('serviciosCategoria')?.value || '';
    const esServicios = !!window.serviciosMode && parseInt(document.getElementById('categoria')?.value) === 3;
    let catalogoGris = esServicios && servicioTipo === 'vino'
        ? CATALOGO_VINO_ESPANOL
        : CATALOGO_GRIS;
    let catalogoRojo = esServicios ? [] : CATALOGO_ROJO;
    let catalogoPostres = CATALOGO_POSTRES;

    if (esServicios) {
        try {
            const catalogosServicios = await cargarCatalogoServiciosDesdeSupabase(servicioTipo);
            catalogoGris = catalogosServicios.saladas;
            catalogoPostres = catalogosServicios.postres.length
                ? catalogosServicios.postres
                : (servicioTipo === 'cocteles' ? CATALOGO_POSTRES : []);
        } catch (error) {
            console.warn('No se pudo cargar Servicios desde Supabase. Usando respaldo local.', error);
        }
    }
    if (esServicios) {
        aplicarReferenciasObligatoriasServicios(catalogoGris);
    }
    if (esServicios) {
        catalogoGris = aplicarReglasCantidadServicios(catalogoGris, servicioTipo);
    }

    const perPageGris = esServicios ? 20 : 10;

    initReferenciasPaginadas('gris',    catalogoGris,     'referenciasGrisGrid',    perPageGris);
    initReferenciasPaginadas('rojo',    catalogoRojo,     'referenciasRojoGrid',    10);
    initReferenciasPaginadas('postres', catalogoPostres,  'referenciasPostresGrid', esServicios ? 20 : 8);

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
    if (document.getElementById(`${st.containerId}__search`)) return;

    const wrapper = document.createElement('div');
    wrapper.className = 'referencias-search';
    wrapper.innerHTML = `
        <input id="${st.containerId}__search" type="text"
            placeholder="Buscar..." value="${st.query || ''}" autocomplete="off"/>
        <button type="button" id="${st.containerId}__clear" class="search-clear hidden">
            <svg viewBox="0 0 24 24" width="16" height="16">
                <path d="M18 6L6 18M6 6l12 12" fill="none" stroke="currentColor"
                    stroke-width="2" stroke-linecap="round"/>
            </svg>
        </button>`;

    container.parentNode.insertBefore(wrapper, container);

    const input = document.getElementById(`${st.containerId}__search`);
    const clear = document.getElementById(`${st.containerId}__clear`);
    const syncClear = () => clear.classList.toggle('hidden', !input.value.trim());
    syncClear();

    input.addEventListener('input', () => {
        st.query = input.value || '';
        st.page = 1;
        syncClear();
        renderReferenciasPagina(tipo);
    });
    clear.addEventListener('click', () => {
        st.query = ''; input.value = '';
        st.page = 1; syncClear();
        renderReferenciasPagina(tipo);
        input.focus();
    });
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
    return (st.items || []).filter(r => normalizarTexto(r.nombre).includes(q));
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
                    oninput="actualizarCantidadReferencia('${String(ref.id).replace(/'/g, "\\'")}', '${tipo}', this.value)">
            </div>`;

        div.onclick = (e) => {
            if (e.target.classList.contains('cantidad-input')) return;
            if (obligatoria) return;
            seleccionarReferenciaPrincipal(ref.id, ref.nombre, tipo, div, cantCalculada, ref.unidad);
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

// =================== SELECCIÓN ===================

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

    if (max > 0 && seleccionadas.length >= max) {
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

    const grisCount    = (window.referenciasSeleccionadas?.gris    || []).length;
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
    if (sel) sel.cantidad = parseFloat(cantidad) || 1;
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
            const ref = catalogo.find(r => String(r.id) === String(sel.id));
            if (ref) {
                sel.cantidad = calcularCantidad(ref, pax);
            }
        });

        renderReferenciasPagina(tipo);
    });
}

function actualizarUnidadReferencia() {}  // ya no se usa, unidad viene del catálogo
