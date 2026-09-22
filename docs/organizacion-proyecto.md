# Organizacion del proyecto CaterCloud

Este documento marca el plan de orden tecnico del proyecto. La prioridad es estabilizar la aplicacion sin cambiar comportamiento de negocio por accidente.

## Objetivo

- Reducir regresiones en Cocina, Logistica, Rutas y edicion de comandas.
- Tener una sola fuente de verdad para comandas.
- Evitar copias manuales incompletas entre raiz y `deploy`.
- Separar responsabilidades antes de agregar mas funciones.

## Estado actual

El proyecto funciona, pero tiene deuda tecnica acumulada:

- Mucha logica aun vive en archivos grandes como `js/dashboard.js`, `js/historial.js`, `js/desayunos.js` y `js/menus-adicionales.js`.
- Rutas ya salio de `js/dashboard.js` hacia `js/routes-dashboard.js`, con reglas puras en `js/routes-module.js`.
- Alertas operativas ya salieron de `js/dashboard.js` hacia `js/operational-alerts.js`.
- Helpers puros de Cocina ya salieron de `js/dashboard.js` hacia `js/kitchen-module.js`.
- Varias zonas leen y escriben `historialComandas` y `historialComandasLogistica` directamente en `localStorage`.
- Supabase `orders` y `localStorage` conviven como fuentes de datos.
- El directorio `deploy` duplica archivos de raiz y requiere copia manual.
- Hay SQL de migraciones, semillas y parches puntuales mezclados en `sql`.
- Hay bastante estado global en `window`, lo que facilita que un modulo afecte otro.

## Reglas para ordenar sin romper

1. Cada cambio debe pasar validacion de sintaxis JS.
2. Si se toca `js`, `css`, `index.html`, `login.html`, `assets`, `vendor` o `sql`, hay que sincronizar `deploy`.
3. Los cambios funcionales deben ser pequenos y verificables.
4. No mezclar refactor con cambios de comportamiento.
5. `localStorage` debe quedar como cache/respaldo, no como verdad principal.
6. Cocina, Logistica y Rutas no deben modificarse entre si salvo por funciones explicitas y documentadas.

## Fases recomendadas

### Fase 1: Barandillas

- Agregar script de validacion del proyecto.
- Agregar script de sincronizacion a `deploy`.
- Documentar convenciones de cambio.
- Mantener comportamiento actual.

### Fase 2: Datos y persistencia

- Centralizar lectura/escritura de comandas en un unico modulo. Estado: `orders` y los historiales locales ya estan protegidos por `js/storage.js`.
- Encapsular `localStorage`. Estado: los historiales principales ya pasan por `window.CaterCloudStorage`.
- Definir claramente que campos pertenecen a Cocina, Logistica, Rutas y Expediente.
- Reducir escrituras directas a Supabase fuera de `js/storage.js` o un modulo equivalente. Estado: `orders` ya tiene guardia automatica.
- Mantener helpers internos de `js/storage.js` para sesion Supabase, timestamps y usuario actual.

### Fase 3: Separacion de modulos

- Extraer de `dashboard.js`:
  - `kitchen-dashboard`
  - `logistics-dashboard`
  - `routes-dashboard`
  - `operational-alerts`
- Mantener una capa fina para cambiar de vistas.

### Fase 4: Edicion de comandas

- Separar creacion y edicion.
- Definir un modelo unico de comanda en memoria.
- Hacer que borrar un menu, cambiar pax o cambiar menaje actualice un solo estado interno.

### Fase 5: Pruebas

- Crear pruebas de flujos criticos:
  - crear comanda menu
  - crear servicio con logistica
  - editar pax
  - eliminar menu al editar
  - marcar items de cocina
  - marcar items de logistica
  - confirmar comanda
  - rutas sin alterar preparacion

## Primeros archivos a vigilar

- `js/storage.js`: persistencia y sincronizacion.
- `js/dashboard.js`: Cocina, Logistica, Rutas y alertas.
- `js/historial.js`: expediente, impresion y edicion.
- `js/main.js`: guardado y flujo principal.
- `js/logistics.js`: formulario y material logistico.
- `js/menus-adicionales.js`: resumen, seleccion y edicion de menus.

Ver tambien `docs/mapa-codigo.md` para el inventario actual y las zonas de mayor riesgo.

## Herramientas de apoyo

- `tools/check-project.ps1`: valida sintaxis JavaScript en `js` y `deploy/js`, codificacion y limites de persistencia.
- `tools/sync-deploy.ps1`: sincroniza archivos fuente hacia `deploy`; usa `-IncludeSql` cuando tambien deban copiarse cambios SQL.
- `tools/audit-project.ps1`: muestra metricas locales de tamano y acoplamiento.
- `tools/check-storage-boundaries.ps1`: evita que los historiales locales se usen fuera de `storage.js`, tanto en `js` como en `deploy/js`.
- `tools/check-supabase-boundaries.ps1`: evita que `orders` de Supabase se use fuera de `storage.js`, tanto en `js` como en `deploy/js`.

## Estado de avance

Completado el 2026-09-17:

- Guardias de codificacion, limites de historiales locales y limites de Supabase `orders`.
- Sincronizacion reproducible hacia `deploy` con `tools/sync-deploy.ps1`.
- `window.CaterCloudStorage` como API compartida para historiales locales y helpers de `orders`.
- Acceso directo a `orders` de Supabase centralizado en `js/storage.js`.
- Acceso directo a `historialComandas` y `historialComandasLogistica` centralizado en `js/storage.js`.
- Helpers internos en `js/storage.js` para sesion Supabase, timestamps y usuario actual.
- Sincronizacion de acciones operativas expuesta desde `js/storage.js`.
- Primer ajuste del reparto automatico de Rutas para aprovechar rutas vacias compatibles antes de seguir cargando una sola ruta.
- Creado `js/routes-module.js` para sacar del dashboard las decisiones del planning automatico de Rutas.
- Movidas a `js/routes-module.js` utilidades puras de hora, duracion y estado de parada.

Siguiente frontera recomendada:

- Crear una prueba/diagnostico simple para Rutas y seguir moviendo reglas del planning a `js/routes-module.js`.
- Extraer o aislar alertas operativas de `js/dashboard.js`, porque Cocina y Logistica han mostrado regresiones visuales de tarjetas y estados.
- Cuando los cambios actuales de Rutas esten validados y guardados, la siguiente tarea tecnica recomendada es crear un diagnostico de planning automatico con escenarios conocidos de jornadas y pedidos.

Actualizado el 2026-09-22:

- `js/dashboard.js` queda en 3235 lineas; Rutas ya no vive alli.
- `js/routes-dashboard.js` queda como superficie principal de UI/datos de Rutas.
- `js/routes-module.js` contiene reglas puras de puntuacion y seleccion del planning automatico.
- Hay cambios recientes de Rutas pendientes de validacion de usuario: formato de compartir, cabecera visual y scoring por jornada. No conviene mezclar otro refactor funcional hasta guardarlos.

Actualizado despues:

- `js/dashboard.js` queda en 2841 lineas tras extraer alertas operativas.
- `js/operational-alerts.js` concentra avisos de cambios/revisiones, sonido, tarjetas y marcas vistas.

Actualizado despues:

- `js/dashboard.js` queda en 2463 lineas tras extraer helpers puros de Cocina.
- `js/kitchen-module.js` concentra estados, totales, items de produccion e intolerancias de Cocina sin tocar Supabase, `localStorage` ni render principal.

## Criterio de exito

Un cambio en Rutas no debe cambiar estados de Cocina o Logistica.
Un cambio en Cocina no debe abrir formularios de Logistica salvo en servicios y solo cuando el flujo lo pida.
Un cambio en un menu editado debe persistir exactamente igual al volver a abrir la comanda.
