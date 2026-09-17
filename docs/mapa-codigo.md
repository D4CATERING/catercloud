# Mapa actual del codigo

Fecha base: 2026-09-17.

Este mapa sirve para orientar la organizacion del proyecto. No describe como deberia quedar el sistema, sino donde esta concentrada la complejidad hoy.

## Archivos JavaScript mas grandes

| Archivo | Lineas | Responsabilidad actual | Riesgo principal |
| --- | ---: | --- | --- |
| `js/dashboard.js` | 4712 | Dashboard, Cocina, Logistica, Rutas, inventario, alertas operativas | Mezcla de modulos que pueden afectarse entre si |
| `js/historial.js` | 2833 | Historial, expedientes, impresion, edicion, adjuntos | Edicion y visualizacion comparten demasiado estado |
| `js/main.js` | 2439 | Flujo principal de guardado, formulario, comanda logistica | Guardado de cocina/logistica acoplado |
| `js/desayunos.js` | 2314 | Menus de desayuno, referencias, popups de seleccion | Estado de seleccion complejo |
| `js/menus-adicionales.js` | 2187 | Menus acumulados, resumen lateral, DIY, material acumulado | Edicion de menus y resumen comparten estado |
| `js/logistics.js` | 1592 | Formulario y selector de material logistico | Material de menus y servicios mezclado en UI |
| `js/storage.js` | 1348 | Supabase, localStorage, sincronizacion y codigos | Fuente de verdad todavia repartida |

## Archivos CSS mas grandes

| Archivo | Lineas | Observacion |
| --- | ---: | --- |
| `css/forms.css` | 9199 | Principal candidato para dividir por zonas del formulario |
| `css/dashboard.css` | 1142 | Dashboard, Cocina, Logistica y Rutas conviven aqui |
| `css/styles.css` | 655 | Estilos globales |
| `css/calendar.css` | 400 | Calendario y expedientes |

## Senales de acoplamiento

Metricas tomadas con `tools/audit-project.ps1`:

| Archivo | `window.*` | handlers inline | `innerHTML` | `localStorage` | Supabase |
| --- | ---: | ---: | ---: | ---: | ---: |
| `dashboard.js` | 268 | 48 | 29 | 13 | 44 |
| `menus-adicionales.js` | 259 | 16 | 17 | 0 | 0 |
| `main.js` | 224 | 0 | 8 | 5 | 0 |
| `storage.js` | 165 | 0 | 0 | 29 | 37 |
| `historial.js` | 154 | 19 | 32 | 16 | 13 |
| `desayunos.js` | 168 | 32 | 21 | 0 | 2 |

Estas metricas no son malas por si solas, pero indican donde hay mas riesgo de regresion.

## Limites que hay que crear

### Persistencia

Todo acceso a comandas debe pasar por un modulo de datos.

Objetivo:

- `orders` en Supabase como fuente principal.
- `localStorage` como cache temporal o recuperacion, no como fuente final.
- Una funcion clara para guardar comanda.
- Una funcion clara para leer comandas.
- Una funcion clara para actualizar estados operativos.

### Cocina

Cocina debe controlar solo:

- Estado de produccion.
- Items producidos.
- Responsable de cocina.
- Alertas de salida relacionadas con produccion.

No debe abrir ni modificar formularios de Logistica salvo en el flujo explicito de servicios.

### Logistica

Logistica debe controlar solo:

- Material logistico.
- Preparacion de material.
- Responsable logistico.
- Estado operativo de salida/evento.

No debe modificar produccion de Cocina.

### Rutas

Rutas debe controlar solo:

- Conductores.
- Vehiculos.
- Paradas.
- Estados de ruta: pendiente, en ruta, entregado.

Rutas no debe marcar material como preparado ni cocina como producida.

### Edicion de comandas

La edicion debe trabajar con un modelo unico en memoria:

- cargar comanda
- modificar seleccion
- recalcular material si aplica
- guardar todo una sola vez

No deberia reconstruir el estado desde el DOM salvo como transicion temporal.

## Orden sugerido de extraccion

1. `js/storage.js`: crear API interna de comandas y dejar wrappers compatibles.
2. `js/dashboard.js`: extraer alertas operativas sin cambiar comportamiento.
3. `js/dashboard.js`: separar helpers de Cocina.
4. `js/dashboard.js`: separar helpers de Logistica.
5. `js/dashboard.js`: separar Rutas.
6. `js/historial.js`: separar impresion/expediente de edicion.
7. `css/forms.css`: dividir despues de estabilizar JS.

## Regla de oro

Antes de mover una funcion, debe existir una verificacion simple que confirme que el comportamiento visible no cambio.
