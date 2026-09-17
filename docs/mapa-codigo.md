# Mapa actual del codigo

Fecha base: 2026-09-17.

Este mapa sirve para orientar la organizacion del proyecto. No describe como deberia quedar el sistema, sino donde esta concentrada la complejidad hoy.

## Archivos JavaScript mas grandes

| Archivo | Lineas | Responsabilidad actual | Riesgo principal |
| --- | ---: | --- | --- |
| `js/dashboard.js` | 4721 | Dashboard, Cocina, Logistica, Rutas, inventario, alertas operativas | Mezcla de modulos que pueden afectarse entre si |
| `js/historial.js` | 2829 | Historial, expedientes, impresion, edicion, adjuntos | Edicion y visualizacion comparten demasiado estado |
| `js/main.js` | 2439 | Flujo principal de guardado, formulario, comanda logistica | Guardado de cocina/logistica acoplado |
| `js/desayunos.js` | 2314 | Menus de desayuno, referencias, popups de seleccion | Estado de seleccion complejo |
| `js/menus-adicionales.js` | 2202 | Menus acumulados, resumen lateral, DIY, material acumulado | Edicion de menus y resumen comparten estado |
| `js/logistics.js` | 1592 | Formulario y selector de material logistico | Material de menus y servicios mezclado en UI |
| `js/storage.js` | 1511 | Supabase `orders`, localStorage, sincronizacion, codigos, sesion y timestamps | Archivo grande, pero ya actua como frontera principal de persistencia |

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
| `dashboard.js` | 264 | 48 | 29 | 6 | 42 |
| `menus-adicionales.js` | 257 | 16 | 17 | 0 | 0 |
| `main.js` | 228 | 0 | 8 | 1 | 0 |
| `historial.js` | 160 | 19 | 32 | 1 | 9 |
| `desayunos.js` | 168 | 32 | 21 | 0 | 2 |
| `storage.js` | 118 | 0 | 0 | 8 | 31 |

Estas metricas no son malas por si solas, pero indican donde hay mas riesgo de regresion.

## Limites que hay que crear

### Persistencia

Todo acceso a comandas debe pasar por un modulo de datos.

Estado actual:

- `orders` en Supabase ya se consulta/actualiza solo desde `js/storage.js`.
- Los historiales locales `historialComandas` y `historialComandasLogistica` ya se leen/escriben solo desde `js/storage.js`.
- `js/storage.js` expone `window.CaterCloudStorage` para accesos locales y helpers de `orders`.
- La sesion Supabase, timestamps y datos del usuario ya estan centralizados dentro de `js/storage.js`.
- `localStorage` sigue existiendo como cache/respaldo y para recuperacion.

Pendiente:

- Separar `js/storage.js` internamente en archivos mas pequenos cuando haya una estrategia de carga segura.
- Crear funciones mas especificas para lectura/actualizacion operativa y reducir wrappers historicos.
- Mantener `tools/check-storage-boundaries.ps1` y `tools/check-supabase-boundaries.ps1` como barandillas.

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

1. `js/storage.js`: seguir reduciendo wrappers historicos sin cambiar contrato publico.
2. `js/dashboard.js`: extraer alertas operativas sin cambiar comportamiento.
3. `js/dashboard.js`: separar helpers de Cocina.
4. `js/dashboard.js`: separar helpers de Logistica.
5. `js/dashboard.js`: separar Rutas.
6. `js/historial.js`: separar impresion/expediente de edicion.
7. `css/forms.css`: dividir despues de estabilizar JS.

## Regla de oro

Antes de mover una funcion, debe existir una verificacion simple que confirme que el comportamiento visible no cambio.
