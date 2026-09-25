-- Datos de DEMOSTRACIÓN (ficticios). Opcional: solo para probar la plataforma.
-- Ejecutar después de schema.sql. Para quitarlos, ver el bloque final comentado.

insert into public.institutions (id, name, initials, coach) values
  ('d0000000-0000-4000-8000-000000000001', 'Instituto Tecnológico Superior', 'ITS', 'Alan Turing'),
  ('d0000000-0000-4000-8000-000000000002', 'Escuela Politécnica Nacional', 'EPN', 'Ada Lovelace'),
  ('d0000000-0000-4000-8000-000000000003', 'Universidad Central', 'UC', 'Nikola Tesla')
on conflict (id) do nothing;

insert into public.participants (id, name, email, whatsapp, grade, institution_id) values
  ('d1000000-0000-4000-8000-000000000001', 'Carlos Mendoza', 'carlos@test.com', '555-0001', 'Universidad', 'd0000000-0000-4000-8000-000000000001'),
  ('d1000000-0000-4000-8000-000000000002', 'Ana Silva', 'ana@test.com', '555-0002', 'Universidad', 'd0000000-0000-4000-8000-000000000002'),
  ('d1000000-0000-4000-8000-000000000003', 'Luis Pérez', 'luis@test.com', '555-0003', 'Universidad', 'd0000000-0000-4000-8000-000000000003'),
  ('d1000000-0000-4000-8000-000000000004', 'Maria Gomez', 'maria@test.com', '555-0004', 'Universidad', 'd0000000-0000-4000-8000-000000000001')
on conflict (id) do nothing;

insert into public.robots (id, name, participant_id, category_ids)
select v.id::uuid, v.name, v.participant_id::uuid, array(select c.id from public.categories c where c.slug = any(v.slugs))
from (values
  ('d2000000-0000-4000-8000-000000000001', 'Veloz ITS', 'd1000000-0000-4000-8000-000000000001', array['seguidor-de-linea']),
  ('d2000000-0000-4000-8000-000000000002', 'Destructor', 'd1000000-0000-4000-8000-000000000001', array['minisumo', 'sumo']),
  ('d2000000-0000-4000-8000-000000000003', 'EPN Bot', 'd1000000-0000-4000-8000-000000000002', array['seguidor-de-linea', 'minisumo']),
  ('d2000000-0000-4000-8000-000000000004', 'Tesla Strike', 'd1000000-0000-4000-8000-000000000003', array['sumo', 'circuito-dron']),
  ('d2000000-0000-4000-8000-000000000005', 'Soccer Bot 1', 'd1000000-0000-4000-8000-000000000001', array['futbolito']),
  ('d2000000-0000-4000-8000-000000000006', 'Soccer Bot 2', 'd1000000-0000-4000-8000-000000000002', array['futbolito']),
  ('d2000000-0000-4000-8000-000000000007', 'Dron X', 'd1000000-0000-4000-8000-000000000004', array['circuito-dron']),
  ('d2000000-0000-4000-8000-000000000008', 'Sumo Team A', 'd1000000-0000-4000-8000-000000000002', array['sumo-rc']),
  ('d2000000-0000-4000-8000-000000000009', 'Sumo Team B', 'd1000000-0000-4000-8000-000000000003', array['sumo-rc']),
  ('d2000000-0000-4000-8000-000000000010', 'Dron Y', 'd1000000-0000-4000-8000-000000000004', array['circuito-dron']),
  ('d2000000-0000-4000-8000-000000000011', 'Dron Z', 'd1000000-0000-4000-8000-000000000004', array['circuito-dron']),
  ('d2000000-0000-4000-8000-000000000012', 'Globo Hunter', 'd1000000-0000-4000-8000-000000000001', array['explotaglobos']),
  ('d2000000-0000-4000-8000-000000000013', 'Pinchazo EPN', 'd1000000-0000-4000-8000-000000000002', array['explotaglobos']),
  ('d2000000-0000-4000-8000-000000000014', 'Aguijón RC', 'd1000000-0000-4000-8000-000000000003', array['explotaglobos'])
) as v(id, name, participant_id, slugs)
on conflict (id) do nothing;

-- Para eliminar los datos de demostración:
-- delete from public.robots where id::text like 'd2000000-%';
-- delete from public.participants where id::text like 'd1000000-%';
-- delete from public.institutions where id::text like 'd0000000-%';
