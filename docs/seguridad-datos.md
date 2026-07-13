# Seguridad de datos y archivos

## Objetivo

Proteger informacion de clientes, solicitudes, comandas y archivos cargados.

## Regla base

La seguridad no debe depender del frontend. La `anon key` de Supabase puede vivir en el navegador, pero las tablas y Storage deben estar protegidos con RLS.

## Estado recomendado inicial

- Login obligatorio.
- RLS activado en:
  - `orders`
  - `clients`
  - `companies`
- Bucket `comandas` privado.
- Archivos guardados en rutas privadas:
  - `orders/{user_id}/{codigo}/cocina.docx`
  - `orders/{user_id}/{codigo}/logistica.docx`
  - `orders/{user_id}/{codigo}/adjuntos/...`
- Guardar en la base la ruta privada, no enlaces publicos permanentes.
- Crear enlaces firmados temporales solo cuando se abre un archivo.

## SQL preparado

Si cada usuario debe ver solo lo suyo, ejecutar:

```text
outputs/seguridad/seguridad_rls_storage.sql
```

Si el equipo debe ver todo el historial, clientes, comandas y archivos, usar este en su lugar:

```text
outputs/seguridad/seguridad_roles_equipo.sql
```

## Importante sobre equipos

El SQL de roles crea cinco permisos:

- `admin`: ve todo, crea, edita, elimina y gestiona roles.
- `editor`: ve todo, crea y edita.
- `viewer`: ve dashboard, historial, comandas y archivos, pero no crea ni edita.
- `cocina`: ve dashboard, historial y comandas; solo puede editar cocina.
- `logistica`: ve dashboard, historial y comandas; solo puede editar logistica e inventario.

Antes de activar los roles, hay que insertar al menos un usuario `admin` en `app_user_roles`.

La interfaz tambien oculta acciones de escritura para usuarios `viewer`, pero la proteccion importante esta en Supabase/RLS.
