# Usuarios y roles

## Flujo recomendado

1. Crear o invitar usuario en Supabase.
   - Ir a Authentication > Users.
   - Usar Invite user o Add user, segun prefieras.

2. Ejecutar el SQL de seguridad por roles si aun no esta aplicado:

```text
outputs/seguridad/seguridad_roles_equipo.sql
```

3. Consultar usuarios y asignar rol con:

```text
outputs/seguridad/asignar_usuarios_roles.sql
```

## Roles

- `admin`: ve todo, crea, edita, elimina y gestiona roles.
- `editor`: ve todo, crea y edita.
- `viewer`: ve dashboard, historial, comandas y archivos, pero no crea ni edita.
- `cocina`: ve dashboard, historial y comandas; solo puede editar el modulo de cocina.
- `logistica`: ve dashboard, historial y comandas; solo puede editar logistica e inventario.

## Recomendacion inicial

Crear primero:

- 1 usuario `admin`
- 3 usuarios operativos como `editor`
- 1 usuario de cocina como `cocina`
- 1 usuario de logistica como `logistica`
- usuarios de consulta como `viewer`

## Importante

Si un usuario no tiene rol en `app_user_roles`, la app puede funcionar provisionalmente como editor mientras se termina la configuracion, pero la idea final es que todos tengan un rol asignado.

La seguridad real se aplica en Supabase con RLS. La interfaz solo oculta botones para que el uso sea mas claro.
