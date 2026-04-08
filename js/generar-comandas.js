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
    function para(children, o={}) {
        return new Paragraph({ children, spacing: { before:0, after:60 }, ...o });
    }
    function espacio(after=80) { return new Paragraph({ children:[], spacing:{ before:0, after } }); }
    function separador() {
        return new Paragraph({
            border: { bottom: { style: BorderStyle.SINGLE, size:4, color:"E2E8F0" } },
            spacing: { before:60, after:60 }, children:[]
        });
    }
    function formatFecha(s) {
        if (!s) return "";
        try { const [y,m,d]=s.split("-"); return d+"/"+m+"/"+y; } catch { return s; }
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
                children:[para([txt(valor,{ size:17, color:NEGRO })],{ spacing:{ before:0, after:0 } })] })
        ]}));
        return new Table({ width:{ size:9936, type:WidthType.DXA }, columnWidths:[2400,7536], rows });
    }

    function bloqueMenu(menu, pax, esAdicional) {
        const paras = [];
        const label = esAdicional
            ? `+ ${menu.nombre||""} (${menu.pax||pax} pax)`
            : `${menu.nombre||""} \u2014 ${pax} pax`;
        paras.push(para([txt(label,{ bold:true, size:19, color:NEGRO })],{ spacing:{ before:60, after:30 } }));

        if (menu.referencias_desayuno) {
            Object.values(menu.referencias_desayuno).forEach(ref => {
                if (!ref || (ref.cantidad===0 && ref.tipo!=="leche_especial")) return;
                paras.push(para([
                    txt("    "+ref.nombre+": ",{ bold:true, size:16, color:GRIS }),
                    txt(String(ref.cantidad),{ size:16, color:NEGRO }),
                    txt(" "+(ref.unidad||""),{ size:16, color:GRIS })
                ],{ spacing:{ before:0, after:30 } }));
            });
        }
        if (menu.referencias) {
            [...(menu.referencias.saladas||[]),...(menu.referencias.postres||[])].forEach(ref => {
                paras.push(para([
                    txt("    "+ref.nombre,{ size:16, color:NEGRO }),
                    txt("   \xd7"+(ref.cantidad||"")+"  "+(ref.unidad||""),{ size:16, color:GRIS })
                ],{ spacing:{ before:0, after:30 } }));
            });
        }
        if (menu.foodbox_lunch) {
            const fl = menu.foodbox_lunch;
            if (fl.ensalada_principal) paras.push(para([txt("    Ensalada: "+fl.ensalada_principal.nombre,{ size:16, color:NEGRO })],{ spacing:{ before:0, after:30 } }));
            if (fl.sandwich_principal) paras.push(para([txt("    S\xe1ndwich: "+fl.sandwich_principal.nombre,{ size:16, color:NEGRO })],{ spacing:{ before:0, after:30 } }));
            if (fl.postre_principal)   paras.push(para([txt("    Postre: "+fl.postre_principal.nombre,{ size:16, color:NEGRO })],{ spacing:{ before:0, after:30 } }));
        }
        return paras;
    }

    function extraerMaterial(logistica) {
        const res = { bebidas:[], menaje:[], extras:[] };
        if (!logistica) return res;
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
                        res[tipo].push({ nombre:nombreFinal, cantidad:sub.cantidad??0, unidad:sub.unidad||"uds" });
                    });
                } else {
                    res[tipo].push({ nombre:item.nombre, cantidad:item.cantidad??0, unidad:item.unidad||"uds" });
                    subs.forEach(sub => {
                        res[tipo].push({ nombre:sub.nombre, cantidad:sub.cantidad??0, unidad:sub.unidad||"uds", indent:true });
                    });
                }
            });
        });
        return res;
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
    if (datos.alergias?.notas) infoBasica.push(["Notas / alergias", datos.alergias.notas]);

    const propsPagina = { page: { size:{ width:11906, height:16838 }, margin:{ top:720, right:720, bottom:720, left:720 } } };
    const estilos = { default: { document: { run: { font:"Roboto", size:18 } } } };

    // ── COCINA ──
    const cc = [
        para([txt("CATERCLOUD",{ bold:true, size:28, color:NEGRO, font:"Oswald", allCaps:true }),
              txt("   \u00b7   COMANDA DE COCINA",{ size:20, color:ROJO, font:"Oswald" })],
             { spacing:{ before:0, after:100 } }),
        separador(), espacio(80),
        headerBanda("\ud83d\udccb Informaci\xf3n del evento"), espacio(60),
        tablaInfo(infoBasica), espacio(100), separador(),
        headerBanda("\ud83c\udf7d\ufe0f Men\xfa seleccionado"), espacio(60),
        ...bloqueMenu({ ...datos.menu_principal, referencias_desayuno:datos.referencias_desayuno, referencias:datos.referencias, foodbox_lunch:datos.foodbox_lunch }, datos.pax, false),
    ];
    if (datos.menus_adicionales?.length) {
        cc.push(espacio(60), headerBanda("\u2795 Men\xfas adicionales"), espacio(60));
        datos.menus_adicionales.forEach(m => { bloqueMenu(m,datos.pax,true).forEach(p=>cc.push(p)); cc.push(espacio(40)); });
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
        headerBanda("\ud83c\udf7d\ufe0f Men\xfa seleccionado"), espacio(60),
        ...bloqueMenu({ ...datos.menu_principal, referencias_desayuno:datos.referencias_desayuno, referencias:datos.referencias, foodbox_lunch:datos.foodbox_lunch }, datos.pax, false),
    ];
    if (datos.menus_adicionales?.length) {
        cl.push(espacio(60), headerBanda("\u2795 Men\xfas adicionales"), espacio(60));
        datos.menus_adicionales.forEach(m => { bloqueMenu(m,datos.pax,true).forEach(p=>cl.push(p)); cl.push(espacio(40)); });
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

// ── Sube los DOCX a Supabase Storage y devuelve URLs públicas ──
window.subirComandasAStorage = async function(codigo, datos) {
    try {
        const blobs = await window.generarBlobsComandasDocx(datos);
        if (!blobs) return { urlCocina:null, urlLogistica:null };
        const { blobCocina, blobLogistica } = blobs;

        const bucket = "comandas";
        const fecha  = (datos.fecha_evento||"").replace(/-/g,"");
        const emp    = (datos.empresa||"comanda").replace(/[^a-zA-Z0-9]/g,"_").substring(0,20);
        const pC     = `${fecha}/${codigo}_cocina_${emp}.docx`;
        const pL     = `${fecha}/${codigo}_logistica_${emp}.docx`;
        const ct     = "application/vnd.openxmlformats-officedocument.wordprocessingml.document";

        const [upC, upL] = await Promise.all([
            window.supabaseClient.storage.from(bucket).upload(pC, blobCocina,    { contentType:ct, upsert:true }),
            window.supabaseClient.storage.from(bucket).upload(pL, blobLogistica, { contentType:ct, upsert:true })
        ]);

        if (upC.error) console.error("Error subiendo cocina:", upC.error);
        if (upL.error) console.error("Error subiendo logística:", upL.error);

        const { data:urlC } = window.supabaseClient.storage.from(bucket).getPublicUrl(pC);
        const { data:urlL } = window.supabaseClient.storage.from(bucket).getPublicUrl(pL);

        return { urlCocina:urlC?.publicUrl||null, urlLogistica:urlL?.publicUrl||null };
    } catch(e) {
        console.error("Error generando/subiendo comandas:", e);
        return { urlCocina:null, urlLogistica:null };
    }
};
