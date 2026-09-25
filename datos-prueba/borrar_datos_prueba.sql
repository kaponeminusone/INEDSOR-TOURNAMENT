-- Borra SOLO los datos de prueba generados por generar_inscritos.py (correos @correo.test).
-- Ejecutar en Supabase → SQL Editor cuando termines de probar. Desde el SQL Editor no aplica el
-- bloqueo de resultados, así que también elimina competencias ya reveladas o finalizadas.

create temporary table test_robots on commit drop as
  select r.id::text as id from public.robots r
  join public.participants p on p.id = r.participant_id
  where p.email like '%@correo.test';

-- Competencias y podios donde participó algún robot de prueba.
delete from public.category_results cr
where exists (select 1 from test_robots t where cr.places::text like '%' || t.id || '%');

delete from public.competitions c
where exists (select 1 from test_robots t where c.entrants::text like '%' || t.id || '%');

delete from public.robots where id::text in (select id from test_robots);
delete from public.participants where email like '%@correo.test';

-- Instituciones que quedaron sin participantes (las de la prueba).
delete from public.institutions i where not exists (select 1 from public.participants p where p.institution_id = i.id);
