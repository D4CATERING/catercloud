// ============================================================
// GENERADOR DE COMANDAS DOCX — Browser version
// Genera dos DOCX (Cocina + Logística) y los sube a Supabase Storage
// ============================================================


window.generarBlobsComandasDocx = async function(datos) {
    const docx = window.docx;
    if (!docx) { console.error("Librería docx no cargada."); return null; }

    const { Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell,
            AlignmentType, BorderStyle, WidthType, ShadingType } = docx;

    const NEGRO="131B23", ROJO="E1342E", GRIS="475569", GRIS_LT="F1F5F9", BLANCO="FFFFFF";

    function sinBorde() { return { style: BorderStyle.NONE, size: 0, color: "FFFFFF" }; }
    function bordeFino(c) { return { style: BorderStyle.SINGLE, size: 4, color: c||"E2E8F0" }; }
    const BN = { top: sinBorde(), bottom: sinBorde(), left: sinBorde(), right: sinBorde() };

    function txt(text, o={}) {
        return new TextRun({ text: String(text??""), font: o.font||"Roboto", size: o.size||18, ...o });
    }
    function txtLineas(text, o={}) {
        const lineas = String(text ?? "").replace(/\r\n/g, "\n").split("\n");
        return lineas.flatMap((linea, index) => {
            const runs = [];
            if (index > 0) runs.push(new TextRun({ break: 1 }));
            runs.push(txt(linea, o));
            return runs;
        });
    }
    function para(children, o={}) {
        return new Paragraph({ children, spacing: { before:0, after:60 }, ...o });
    }
    function espacio(after=80) { return new Paragraph({ children:[], spacing:{ before:0, after } }); }
    function espacioGrupoDesayuno() { return new Paragraph({ children:[], spacing:{ before:70, after:10 } }); }
    function separador() {
        return new Paragraph({
            border: { bottom: { style: BorderStyle.SINGLE, size:4, color:"E2E8F0" } },
            spacing: { before:60, after:60 }, children:[]
        });
    }
    function formatFecha(s) {
        if (!s) return "";
        try {
            if (typeof window.formatearFechaEventoConDia === 'function') {
                return window.formatearFechaEventoConDia(s);
            }
            const [y,m,d]=s.split("-");
            const date = new Date(Number(y), Number(m) - 1, Number(d));
            const dia = date.toLocaleDateString('es-ES', { weekday: 'long' });
            return `${dia} ${d}/${m}/${y}`;
        } catch { return s; }
    }

    function headerBanda(titulo) {
        return new Table({
            width: { size:9936, type:WidthType.DXA }, columnWidths:[9936],
            rows: [new TableRow({ children: [new TableCell({
                width: { size:9936, type:WidthType.DXA },
                shading: { fill:NEGRO, type:ShadingType.CLEAR },
                borders: { top:{ style:BorderStyle.SINGLE, size:6, color:ROJO },
                           bottom:{ style:BorderStyle.SINGLE, size:6, color:ROJO },
                           left:sinBorde(), right:sinBorde() },
                margins: { top:100, bottom:100, left:160, right:160 },
                children: [para([txt(titulo,{ bold:true, size:20, color:BLANCO, font:"Oswald", allCaps:true })],
                                { spacing:{ before:0, after:0 } })]
            })] })]
        });
    }

    function tablaInfo(filas) {
        const rows = filas.map(([label,valor]) => new TableRow({ children: [
            new TableCell({ width:{ size:2400, type:WidthType.DXA }, borders:BN,
                margins:{ top:50, bottom:30, left:120, right:120 },
                children:[para([txt(label,{ bold:true, size:17, color:GRIS })],{ spacing:{ before:0, after:0 } })] }),
            new TableCell({ width:{ size:7536, type:WidthType.DXA }, borders:BN,
                margins:{ top:50, bottom:30, left:120, right:120 },
                children:[para(txtLineas(valor,{ size:17, color:NEGRO }),{ spacing:{ before:0, after:0 } })] })
        ]}));
        return new Table({ width:{ size:9936, type:WidthType.DXA }, columnWidths:[2400,7536], rows });
    }

    function bloqueMenu(menu, pax, esAdicional) {
        const paras = [];
        const paxFinal = menu.pax || pax || 0;
        const label = `${menu.nombre || ""} — ${paxFinal} pax`;
        paras.push(para([txt(label, { bold:true, size:21, color:NEGRO })], { spacing:{ before:50, after:24 } }));
        const distribuirCantidad = (total, opciones) => {
            const cantidadTotal = Math.max(0, Number(total) || 0);
            const cantidadOpciones = Math.max(1, Number(opciones) || 1);
            const base = Math.floor(cantidadTotal / cantidadOpciones);
            const resto = cantidadTotal % cantidadOpciones;
            return Array.from({ length: cantidadOpciones }, (_, index) => base + (index < resto ? 1 : 0));
        };
        const grupoDesayuno = (ref) => {
            const key = ref?.id || ref?._refKey || '';
            const texto = `${key} ${ref?.tipo || ''} ${ref?.nombre || ''}`.toLowerCase();
            if (/fruta|smoothie|zumo/.test(texto)) return 'fruta';
            if (/sandwich|sándwich|pulguita|tostada/.test(texto)) return 'salado';
            if (/bolleria|bollería|cookie|dulce/.test(texto)) return 'dulce';
            return 'otro';
        };
        const esBebidaSoloLogistica = (ref) => {
            const texto = `${ref?.id || ref?._refKey || ''} ${ref?.tipo || ''} ${ref?.nombre || ''}`.toLowerCase();
            return ref?.tipo === 'zumo' || /\bzumo\b/.test(texto);
        };

        if (menu.referencias_desayuno) {
            // Los termos se muestran sumados en bloque separado — aquí solo el resto
            const ordenDesayuno = {
                healthy_bolleria: 10,
                healthy_sandwich: 20,
                healthy_tostada: 30,
                healthy_fruta: 40,
                classic_bolleria: 10,
                classic_sandwich: 20,
                classic_fruta: 30,
                premium_cookie: 10,
                premium_bolleria: 20,
                premium_sandwich_o_pulguita: 30,
                premium_fruta: 40,
                premium_smoothie: 50,
                veggie_cookie: 10,
                veggie_sandwich_vegetal: 20,
                veggie_sandwich_aguacate: 21,
                veggie_fruta: 30
            };
            let tituloSandwichFijoRenderizado = false;
            let grupoActualDesayuno = '';
            Object.entries(menu.referencias_desayuno)
                .map(([key, ref], index) => ({ key, ref, index }))
                .sort((a, b) => (ordenDesayuno[a.ref?.id || a.key] ?? a.index + 100) - (ordenDesayuno[b.ref?.id || b.key] ?? b.index + 100))
                .map(item => ({ ...item.ref, _refKey: item.key }))
                .forEach(ref => {
                if (!ref || ref.tipo === 'termo' || ref.tipo === 'leche_especial' || esBebidaSoloLogistica(ref)) return;
                if (!ref.cantidad || ref.cantidad === 0) return;
                let detalle = '';
                const refKey = ref.id || ref._refKey || '';
                const grupo = grupoDesayuno(ref);
                if (grupoActualDesayuno && grupoActualDesayuno !== grupo) {
                    paras.push(espacioGrupoDesayuno());
                }
                grupoActualDesayuno = grupo;
                if (ref.tipo === 'bolleria' && ref.opcionesSeleccionadas?.length) {
                    const cantidades = distribuirCantidad(ref.cantidad || paxFinal, ref.opcionesSeleccionadas.length);
                    ref.opcionesSeleccionadas.forEach((opcion, index) => {
                        paras.push(para([
                            txt("    " + opcion + ": ", { bold:true, size:18, color:GRIS }),
                            txt(String(cantidades[index]), { size:18, color:NEGRO }),
                            txt(" " + (ref.unidad||""), { size:18, color:GRIS })
                        ], { spacing:{ before:0, after:24 } }));
                    });
                    return;
                }
                if (ref.tipo === 'sandwich_multiple' && ref.sandwiches?.length) {
                    const sandwiches = ref.sandwiches.filter(s => s.sabor);
                    const cantidades = distribuirCantidad(ref.cantidad || paxFinal, sandwiches.length);
                    sandwiches.forEach((s, index) => {
                        paras.push(para([
                            txt("    " + s.sabor + ": ", { bold:true, size:18, color:GRIS }),
                            txt(String(cantidades[index]), { size:18, color:NEGRO }),
                            txt(" " + (ref.unidad||""), { size:18, color:GRIS })
                        ], { spacing:{ before:0, after:24 } }));
                    });
                    return;
                }
                if (ref.tipo === 'sandwich_o_pulguita' && ref.modo !== 'pulguita' && ref.sandwiches?.length) {
                    const sandwiches = ref.sandwiches.filter(s => s.sabor);
                    const cantidades = distribuirCantidad(ref.cantidad || paxFinal, sandwiches.length);
                    sandwiches.forEach((s, index) => {
                        paras.push(para([
                            txt("    " + s.sabor + ": ", { bold:true, size:18, color:GRIS }),
                            txt(String(cantidades[index]), { size:18, color:NEGRO }),
                            txt(" " + (ref.unidad||""), { size:18, color:GRIS })
                        ], { spacing:{ before:0, after:24 } }));
                    });
                    return;
                }
                if (ref.tipo === 'sandwich' && ref.sabor) {
                    if (refKey === 'premium_cookie' || refKey === 'premium_fruta') {
                        paras.push(para([
                            txt("    " + ref.sabor + ": ", { bold:true, size:18, color:GRIS }),
                            txt(String(ref.cantidad), { size:18, color:NEGRO }),
                            txt(" " + (ref.unidad||""), { size:18, color:GRIS })
                        ], { spacing:{ before:0, after:24 } }));
                        return;
                    }
                    paras.push(para([
                        txt("    " + ref.sabor + ": ", { bold:true, size:18, color:GRIS }),
                        txt(String(ref.cantidad), { size:18, color:NEGRO }),
                        txt(" " + (ref.unidad||""), { size:18, color:GRIS })
                    ], { spacing:{ before:0, after:24 } }));
                    return;
                }
                if (ref.tipo === 'sandwich_fijo') {
                    tituloSandwichFijoRenderizado = true;
                    paras.push(para([
                        txt("    " + (ref.sabor || ref.nombre) + ": ", { bold:true, size:18, color:GRIS }),
                        txt(String(ref.cantidad), { size:18, color:NEGRO }),
                        txt(" " + (ref.unidad||""), { size:18, color:GRIS })
                    ], { spacing:{ before:0, after:24 } }));
                    return;
                }
                if (ref.tipo === 'sandwich_multiple' && ref.sandwiches?.length)
                    detalle = ': ' + ref.sandwiches.filter(s=>s.sabor).map(s=>`${s.sabor} ×${s.cantidad||''}`).join(', ');
                paras.push(para([
                    txt("    " + ref.nombre + detalle + ": ", { bold:true, size:18, color:GRIS }),
                    txt(String(ref.cantidad), { size:18, color:NEGRO }),
                    txt(" " + (ref.unidad||""), { size:18, color:GRIS })
                ], { spacing:{ before:0, after:24 } }));
            });
        }
        if (menu.referencias || Array.isArray(menu.referencias_extras)) {
            const extras = Array.isArray(menu.referencias_extras) ? menu.referencias_extras : [];
            const extrasSaladas = extras.filter(ref => ref.grupo !== 'postre' && ref.tipo !== 'postres');
            const extrasPostres = extras.filter(ref => ref.grupo === 'postre' || ref.tipo === 'postres');
            [
                ...(menu.referencias?.saladas || []),
                ...extrasSaladas,
                ...(menu.referencias?.postres || []),
                ...extrasPostres
            ].forEach(ref => {
                paras.push(para([
                    txt("    "+(ref.nombre || ref.id || "Extra"),{ size:18, color:NEGRO }),
                    txt("   \xd7"+(ref.cantidad||"")+"  "+(ref.unidad||""),{ size:18, color:GRIS })
                ],{ spacing:{ before:0, after:24 } }));
            });
        }
        if (menu.foodbox_lunch) {
            const fl = menu.foodbox_lunch;
            if (fl.ensalada_principal) paras.push(para([txt("    Ensalada: "+fl.ensalada_principal.nombre,{ size:18, color:NEGRO })],{ spacing:{ before:0, after:24 } }));
            if (fl.sandwich_principal) paras.push(para([txt("    S\xe1ndwich: "+fl.sandwich_principal.nombre,{ size:18, color:NEGRO })],{ spacing:{ before:0, after:24 } }));
            if (fl.postre_principal)   paras.push(para([txt("    Postre: "+fl.postre_principal.nombre,{ size:18, color:NEGRO })],{ spacing:{ before:0, after:24 } }));
        }
        return paras;
    }

    function extraerMaterial(logistica) {
        const res = { bebidas:[], menaje:[], extras:[] };
        if (!logistica) return res;
        const normalizarTexto = (valor) => String(valor || '')
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .toLowerCase()
            .replace(/\s+/g, ' ')
            .trim();
        const esZumo = (item) => {
            const nombre = normalizarTexto(item?.nombre || item?.name);
            return Boolean(item?._zumoId) ||
                (nombre.includes('zumo') && (nombre.includes('naranja') || nombre.includes('natural')));
        };
        const unidadVisible = (item) => esZumo(item)
            ? (item?.unidad_comanda || item?.unidad || 'Lt')
            : (item?.unidad_comanda || item?.unidad || 'uds');
        ["bebidas","menaje","extras"].forEach(tipo => {
            (logistica[tipo]||[]).forEach(item => {
                if (item.checked===false) return;
                const esMantelTablero = /mantel\s*(tablero)?/i.test(item.nombre);
                const subs = item.subitems_selected||[];
                if (esMantelTablero && subs.length > 0) {
                    subs.forEach(sub => {
                        const subNombre = (sub.nombre||'').trim();
                        const nombreFinal = /desechable/i.test(subNombre)
                            ? 'Mantel Desechable'
                            : 'Mantel de ' + subNombre;
                        res[tipo].push({ nombre:nombreFinal, cantidad:sub.cantidad??0, unidad:unidadVisible(sub) });
                    });
                } else {
                    res[tipo].push({ nombre:item.nombre, cantidad:item.cantidad??0, unidad:unidadVisible(item), unidad_comanda:item.unidad_comanda });
                    subs.forEach(sub => {
                        res[tipo].push({ nombre:sub.nombre, cantidad:sub.cantidad??0, unidad:unidadVisible(sub), unidad_comanda:sub.unidad_comanda, indent:true });
                    });
                }
            });
        });
        return typeof window.normalizarMaterialLogistica === 'function'
            ? window.normalizarMaterialLogistica(res)
            : res;
    }

    function tablaMaterial(titulo, items) {
        if (!items||!items.length) return [];
        const rows = [
            new TableRow({ children: [new TableCell({
                columnSpan:3, width:{ size:9936, type:WidthType.DXA },
                shading:{ fill:GRIS_LT, type:ShadingType.CLEAR },
                borders:{ top:bordeFino("CBD5E1"), bottom:bordeFino("CBD5E1"), left:sinBorde(), right:sinBorde() },
                margins:{ top:60, bottom:60, left:160, right:160 },
                children:[para([txt(titulo,{ bold:true, size:17, color:GRIS, font:"Oswald", allCaps:true })],{ spacing:{ before:0, after:0 } })]
            })] }),
            ...items.map(it => new TableRow({ children: [
                new TableCell({ width:{ size:7200, type:WidthType.DXA }, borders:BN,
                    margins:{ top:40, bottom:20, left:it.indent?400:120, right:120 },
                    children:[para([txt(it.nombre,{ size:17, color:NEGRO })],{ spacing:{ before:0, after:0 } })] }),
                new TableCell({ width:{ size:1400, type:WidthType.DXA }, borders:BN,
                    margins:{ top:40, bottom:20, left:60, right:60 },
                    children:[para([txt(String(it.cantidad),{ size:17, color:NEGRO })],{ alignment:AlignmentType.CENTER, spacing:{ before:0, after:0 } })] }),
                new TableCell({ width:{ size:1336, type:WidthType.DXA }, borders:BN,
                    margins:{ top:40, bottom:20, left:60, right:120 },
                    children:[para([txt(it.unidad,{ size:17, color:GRIS })],{ spacing:{ before:0, after:0 } })] })
            ]}))
        ];
        return [new Table({ width:{ size:9936, type:WidthType.DXA }, columnWidths:[7200,1400,1336], rows }), espacio(60)];
    }

    // Info básica
    const infoBasica = [
        ["Empresa",     datos.empresa||""],
        ["Responsable", datos.responsable||""],
        ["Fecha",       formatFecha(datos.fecha_evento)],
        ["Hora salida", datos.hora_salida||""],
        ["PAX",         String(datos.pax||"")],
    ];
    const intolerancias = datos.alergias?.intolerancias || {};
    const intoleranciasItems = Array.isArray(intolerancias.items) ? intolerancias.items : [];
    const resumenIntolerancias = intoleranciasItems
        .map(i => `${i.nombre}${i.pax ? ` (${i.pax} pax)` : ''}`)
        .join(', ');
    const detalleIntolerancias = [resumenIntolerancias, intolerancias.notas].filter(Boolean).join('\n');
    if (detalleIntolerancias) infoBasica.push(["Intolerancias / restricciones", detalleIntolerancias]);
    if (datos.alergias?.notas) infoBasica.push(["Notas / alergias", datos.alergias.notas]);

    const propsPagina = { page: { size:{ width:11906, height:16838 }, margin:{ top:520, right:520, bottom:520, left:520 } } };
    const estilos = { default: { document: { run: { font:"Roboto", size:19 } } } };

    // Todos los menús: principal + adicionales, todos al mismo nivel con su PAX
    const hayMenusAdicionales = (datos.menus_adicionales || []).length > 0;
    const todosMenus = [
        { ...datos.menu_principal,
          // Preferir los datos propios del menú principal; caer a nivel raíz solo como fallback
          referencias_desayuno: datos.menu_principal?.referencias_desayuno || datos.referencias_desayuno,
          referencias:          datos.menu_principal?.referencias          || datos.referencias,
          referencias_extras:   datos.menu_principal?.referencias_extras   || datos.referencias_extras || [],
          foodbox_lunch:        datos.menu_principal?.foodbox_lunch        || datos.foodbox_lunch,
          pax:                  datos.menu_principal?.pax || (hayMenusAdicionales ? '' : datos.pax)
        },
        ...(datos.menus_adicionales || [])
    ];

    // ── Sumar termos de desayuno entre todos los menús ──────────────────────
    // Si hay varios menús de desayuno, los termos del mismo nombre se acumulan
    // y se muestran en un bloque único al final en lugar de repetirse por menú.
    const termosTotales = {}; // { "Termo de café": { nombre, cantidad, tipoTermo, unidad } }
    todosMenus.forEach(m => {
        if (!m.referencias_desayuno) return;
        Object.values(m.referencias_desayuno).forEach(ref => {
            if (!ref || (ref.tipo !== 'termo' && ref.tipo !== 'leche_especial')) return;
            if (!ref.cantidad || ref.cantidad <= 0) return;
            if (!termosTotales[ref.nombre]) {
                termosTotales[ref.nombre] = { ...ref, cantidad: 0 };
            }
            termosTotales[ref.nombre].cantidad += ref.cantidad;
        });
    });

    // ── COCINA ──
    const cc = [
        para([txt("CATERCLOUD",{ bold:true, size:28, color:NEGRO, font:"Oswald", allCaps:true }),
              txt("   \u00b7   COMANDA DE COCINA",{ size:20, color:ROJO, font:"Oswald" })],
             { spacing:{ before:0, after:100 } }),
        separador(), espacio(80),
        headerBanda("\ud83d\udccb Informaci\xf3n del evento"), espacio(60),
        tablaInfo(infoBasica), espacio(100), separador(),
        headerBanda("\ud83c\udf7d\ufe0f Men\xfas"), espacio(60),
    ];
    todosMenus.forEach((m, i) => {
        bloqueMenu(m, m.pax, false).forEach(p => cc.push(p));
        if (i < todosMenus.length - 1) cc.push(espacio(40));
    });

    // Termos sumados de todos los menús de desayuno
    const termosList = Object.values(termosTotales);
    if (termosList.length) {
        cc.push(espacio(40));
        const tipoTermo = termosList[0]?.tipoTermo || '';
        const partes = termosList.map(r => {
            const nombreCorto = r.nombre.replace(/^Termo de?\s*/i, '').replace(/^Termo\s*/i, '');
            return `${nombreCorto} ×${r.cantidad}`;
        });
        cc.push(para([
            txt("    Termos: ", { bold:true, size:16, color:GRIS }),
            txt(partes.join('  ·  '), { size:16, color:NEGRO }),
            txt(tipoTermo ? `  (${tipoTermo})` : '', { size:15, color:GRIS, italics:true })
        ], { spacing:{ before:0, after:30 } }));
    }

    // ── LOGÍSTICA ──
    const material = extraerMaterial(datos.material_logistica || datos.logistica);
    const cl = [
        para([txt("CATERCLOUD",{ bold:true, size:28, color:NEGRO, font:"Oswald", allCaps:true }),
              txt("   \u00b7   COMANDA DE LOG\xcdSTICA",{ size:20, color:ROJO, font:"Oswald" })],
             { spacing:{ before:0, after:100 } }),
        separador(), espacio(80),
        headerBanda("\ud83d\udccb Informaci\xf3n del evento"), espacio(60),
        tablaInfo(infoBasica), espacio(100), separador(),
        headerBanda("\ud83c\udf7d\ufe0f Men\xfas"), espacio(60),
    ];
    todosMenus.forEach((m, i) => {
        bloqueMenu(m, m.pax, false).forEach(p => cl.push(p));
        if (i < todosMenus.length - 1) cl.push(espacio(40));
    });

    // Termos sumados (mismos que en cocina)
    if (termosList.length) {
        cl.push(espacio(40));
        const tipoTermo = termosList[0]?.tipoTermo || '';
        const partes = termosList.map(r => {
            const nombreCorto = r.nombre.replace(/^Termo de?\s*/i, '').replace(/^Termo\s*/i, '');
            return `${nombreCorto} ×${r.cantidad}`;
        });
        cl.push(para([
            txt("    Termos: ", { bold:true, size:16, color:GRIS }),
            txt(partes.join('  ·  '), { size:16, color:NEGRO }),
            txt(tipoTermo ? `  (${tipoTermo})` : '', { size:15, color:GRIS, italics:true })
        ], { spacing:{ before:0, after:30 } }));
    }
    if (material.bebidas.length || material.menaje.length || material.extras.length) {
        cl.push(espacio(100), separador(), headerBanda("\ud83d\udce6 Material necesario"), espacio(60));
        tablaMaterial("\ud83e\udd64 Bebidas", material.bebidas).forEach(e=>cl.push(e));
        tablaMaterial("\ud83c\udf7d\ufe0f Menaje",  material.menaje).forEach(e=>cl.push(e));
        tablaMaterial("\u2728 Extras",  material.extras).forEach(e=>cl.push(e));
    }

    const docCocina    = new Document({ styles:estilos, sections:[{ properties:propsPagina, children:cc }] });
    const docLogistica = new Document({ styles:estilos, sections:[{ properties:propsPagina, children:cl }] });

    const [blobCocina, blobLogistica] = await Promise.all([Packer.toBlob(docCocina), Packer.toBlob(docLogistica)]);
    return { blobCocina, blobLogistica };
};

// Sube los DOCX a Storage privado y devuelve rutas + URLs temporales.
window.subirComandasAStorage = async function(codigo, datos) {
    try {
        if (!window.supabaseClient || !window.currentUser?.id) {
            return { cocinaPath:null, logisticaPath:null, urlCocina:null, urlLogistica:null };
        }

        const blobs = await window.generarBlobsComandasDocx(datos);
        if (!blobs) return { cocinaPath:null, logisticaPath:null, urlCocina:null, urlLogistica:null };
        const { blobCocina, blobLogistica } = blobs;

        const bucket = "comandas";
        const userId = window.currentUser.id;
        const pC     = `orders/${userId}/${codigo}/cocina.docx`;
        const pL     = `orders/${userId}/${codigo}/logistica.docx`;
        const ct     = "application/vnd.openxmlformats-officedocument.wordprocessingml.document";

        const [upC, upL] = await Promise.all([
            window.supabaseClient.storage.from(bucket).upload(pC, blobCocina,    { contentType:ct, upsert:true }),
            window.supabaseClient.storage.from(bucket).upload(pL, blobLogistica, { contentType:ct, upsert:true })
        ]);

        if (upC.error) console.error("Error subiendo cocina:", upC.error);
        if (upL.error) console.error("Error subiendo logística:", upL.error);

        const [signedC, signedL] = await Promise.all([
            upC.error ? Promise.resolve({ data:null }) : window.supabaseClient.storage.from(bucket).createSignedUrl(pC, 60 * 60),
            upL.error ? Promise.resolve({ data:null }) : window.supabaseClient.storage.from(bucket).createSignedUrl(pL, 60 * 60)
        ]);

        return {
            cocinaPath: upC.error ? null : pC,
            logisticaPath: upL.error ? null : pL,
            urlCocina: signedC.data?.signedUrl || null,
            urlLogistica: signedL.data?.signedUrl || null
        };
    } catch(e) {
        console.error("Error generando/subiendo comandas:", e);
        return { cocinaPath:null, logisticaPath:null, urlCocina:null, urlLogistica:null };
    }
};
