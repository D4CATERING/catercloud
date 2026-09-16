-- Activa Supabase Realtime para que los cambios en comandas lleguen a otros dispositivos.
-- Ejecutar en Supabase SQL Editor. Es seguro repetirlo.

do $$
begin
  if not exists (
    select 1
    from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'orders'
  ) then
    alter publication supabase_realtime add table public.orders;
  end if;
end $$;
