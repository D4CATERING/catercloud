# Plan de organizacion de bases de datos

## Decision principal

La fuente principal debe ser Supabase.

Supabase debe guardar:
- comandas
- empresas
- contactos/clientes
- catalogos de menus
- materiales de logistica
- bandejas DIY
- documentos generados o referencias a documentos

El navegador (`localStorage`) debe quedar solo como respaldo temporal o borrador.

La base local `catercloud.db` debe quedar archivada como version antigua o entorno de pruebas. No debe ser la fuente principal para comandas reales.

## Estado actual observado

### Supabase

La app usa estas tablas remotas:

- `orders`
- `companies`
- `clients`
- `foodbox_opciones`
- `logistics_materials`
- `menu_materials`
- `diy_bandejas_desayunos`
- `diy_bandejas_desayunos_variantes`
- `diy_bandejas_foodbox`
- `diy_bandejas_foodbox_variantes`

Algunas tablas pueden parecer vacias desde una consulta anonima por permisos/RLS. Eso no significa necesariamente que esten vacias.

### localStorage

La app guarda respaldos locales en:

- `historialComandas`
- `historialComandasLogistica`
- `contadorComandas`
- `calendarioEventos`
- `empresas_frecuentes`

Esto es util como respaldo, pero no es seguro como base principal porque depende del navegador y del equipo.

### SQLite local

Existe `catercloud.db`, pero parece de una version anterior:

- tiene menus antiguos
- incluye Servicios como categoria
- no tiene comandas reales
- su estructura no coincide completamente con los modelos actuales de Python

Recomendacion: no usarla para produccion.

## Estructura recomendada para comandas

### Tabla principal: `orders`

Estado actual:

```sql
create table public.orders (
  id uuid not null default gen_random_uuid (),
  created_at timestamp with time zone not null default now(),
  created_by uuid not null,
  company_id uuid null,
  company_name text null,
  responsable_name text not null,
  payload jsonb not null,
  constraint orders_pkey primary key (id),
  constraint orders_company_id_fkey foreign KEY (company_id) references companies (id),
  constraint orders_created_by_fkey foreign KEY (created_by) references auth.users (id)
);
```

Esta estructura es valida para desarrollo porque guarda toda la comanda dentro de `payload`.

Lo que falta es sacar algunos datos importantes a columnas propias para poder buscar, filtrar, ordenar y proteger mejor las comandas.

Debe tener columnas faciles de buscar:

- `id`
- `codigo`
- `created_by`
- `company_id`
- `company_name`
- `responsable_name`
- `fecha_evento`
- `hora_salida`
- `pax_total`
- `estado`
- `version`
- `payload`
- `created_at`
- `updated_at`

El campo `payload` puede guardar el detalle completo de la comanda mientras el software sigue en desarrollo.

Migracion recomendada, sin borrar datos:

```sql
alter table public.orders
  add column if not exists codigo text,
  add column if not exists fecha_evento date,
  add column if not exists hora_salida text,
  add column if not exists pax_total integer,
  add column if not exists estado text not null default 'creada',
  add column if not exists version integer not null default 1,
  add column if not exists updated_at timestamp with time zone not null default now();

create index if not exists orders_codigo_idx
  on public.orders (codigo);

create index if not exists orders_fecha_evento_idx
  on public.orders (fecha_evento);

create index if not exists orders_company_id_idx
  on public.orders (company_id);

create index if not exists orders_created_by_idx
  on public.orders (created_by);
```

Despues de crear estas columnas, el frontend debe guardar esos datos dos veces:

- en columnas, para busqueda y filtros
- dentro de `payload`, como respaldo completo de la comanda

### Mas adelante

Cuando el sistema este mas estable, se pueden separar tablas:

- `order_menus`
- `order_items`
- `order_logistics`
- `order_documents`

Pero no conviene hacerlo demasiado pronto si el formulario sigue cambiando.

## Seguridad recomendada

Supabase debe tener:

- login obligatorio
- RLS activado
- cada usuario solo ve sus comandas o las de su equipo
- buckets de documentos privados
- backups activados

`localStorage` no debe considerarse seguro para datos finales.

## Storage recomendado

La app genera documentos DOCX de cocina y logistica.

Estado actual del codigo:

- bucket usado: `comandas`
- archivos generados:
  - `{fecha}/{codigo}_cocina_{empresa}.docx`
  - `{fecha}/{codigo}_logistica_{empresa}.docx`
- actualmente se usan URLs publicas con `getPublicUrl`

Recomendacion:

- mantener un bucket llamado `comandas`
- configurarlo como privado
- guardar en `orders` las rutas internas de los documentos, no solo URLs publicas
- usar enlaces firmados temporales para descargar documentos

Rutas recomendadas:

```text
orders/{created_by}/{codigo}/cocina.docx
orders/{created_by}/{codigo}/logistica.docx
```

Esto ayuda a que las politicas de Storage puedan validar que el usuario solo acceda a sus propios archivos.

SQL inicial recomendado para Storage:

```sql
insert into storage.buckets (id, name, public)
values ('comandas', 'comandas', false)
on conflict (id) do update
set public = false;
```

Politicas recomendadas para empezar, por usuario propietario de carpeta:

```sql
create policy "Usuarios pueden leer sus documentos de comandas"
on storage.objects
for select
to authenticated
using (
  bucket_id = 'comandas'
  and (storage.foldername(name))[1] = 'orders'
  and (storage.foldername(name))[2] = auth.uid()::text
);

create policy "Usuarios pueden subir sus documentos de comandas"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'comandas'
  and (storage.foldername(name))[1] = 'orders'
  and (storage.foldername(name))[2] = auth.uid()::text
);

create policy "Usuarios pueden actualizar sus documentos de comandas"
on storage.objects
for update
to authenticated
using (
  bucket_id = 'comandas'
  and (storage.foldername(name))[1] = 'orders'
  and (storage.foldername(name))[2] = auth.uid()::text
)
with check (
  bucket_id = 'comandas'
  and (storage.foldername(name))[1] = 'orders'
  and (storage.foldername(name))[2] = auth.uid()::text
);
```

Despues de aplicar esto, el frontend debe cambiar:

- dejar de usar `getPublicUrl`
- usar `createSignedUrl`
- guardar rutas como `doc_cocina_path` y `doc_logistica_path`

## Primeros pasos

1. Confirmar en Supabase que `orders` guarda comandas correctamente.
2. Revisar politicas RLS de `orders`, `companies` y `clients`.
3. Decidir si `payload` sigue siendo el formato principal durante desarrollo.
4. Crear columnas importantes en `orders` para busqueda y filtros.
5. Migrar o completar catalogos faltantes en Supabase.
6. Dejar `localStorage` como respaldo, no como fuente principal.
7. Archivar `catercloud.db` para evitar confusion.

## Regla de trabajo

Antes de tocar datos reales:

- hacer backup
- probar en una tabla o proyecto de pruebas
- no borrar `localStorage` hasta confirmar que Supabase guarda y recupera bien
- no eliminar `catercloud.db` hasta que se archive una copia
