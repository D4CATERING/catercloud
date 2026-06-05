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

## Recomendacion inicial

Crear primero:

- 1 usuario `admin`
- usuarios operativos como `editor`
- usuarios de consulta como `viewer`

## Importante

Si un usuario no tiene rol en `app_user_roles`, la app puede funcionar provisionalmente como editor mientras se termina la configuracion, pero la idea final es que todos tengan un rol asignado.

La seguridad real se aplica en Supabase con RLS. La interfaz solo oculta botones para que el uso sea mas claro.
