# Organizacion del proyecto CaterCloud

Este documento marca el plan de orden tecnico del proyecto. La prioridad es estabilizar la aplicacion sin cambiar comportamiento de negocio por accidente.

## Objetivo

- Reducir regresiones en Cocina, Logistica, Rutas y edicion de comandas.
- Tener una sola fuente de verdad para comandas.
- Evitar copias manuales incompletas entre raiz y `deploy`.
- Separar responsabilidades antes de agregar mas funciones.

## Estado actual

El proyecto funciona, pero tiene deuda tecnica acumulada:

- Mucha logica vive en archivos grandes como `js/dashboard.js`, `js/main.js`, `js/historial.js`, `js/desayunos.js` y `js/menus-adicionales.js`.
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

- Centralizar lectura/escritura de comandas en un unico modulo.
- Encapsular `localStorage`.
- Definir claramente que campos pertenecen a Cocina, Logistica, Rutas y Expediente.
- Reducir escrituras directas a Supabase fuera de `js/storage.js` o un modulo equivalente.

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

- `tools/check-project.ps1`: valida sintaxis JavaScript y codificacion.
- `tools/sync-deploy.ps1`: sincroniza archivos fuente hacia `deploy`; usa `-IncludeSql` cuando tambien deban copiarse cambios SQL.
- `tools/audit-project.ps1`: muestra metricas locales de tamano y acoplamiento.
- `tools/check-storage-boundaries.ps1`: evita que los historiales locales se usen fuera de `js/storage.js`.

## Criterio de exito

Un cambio en Rutas no debe cambiar estados de Cocina o Logistica.
Un cambio en Cocina no debe abrir formularios de Logistica salvo en servicios y solo cuando el flujo lo pida.
Un cambio en un menu editado debe persistir exactamente igual al volver a abrir la comanda.
