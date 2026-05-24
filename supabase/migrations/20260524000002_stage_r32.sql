-- El Mundial 2026 tiene una Ronda de 32 previa a Octavos.
-- Ampliar el constraint de stage para incluir 'r32'.
alter table matches
  drop constraint if exists matches_stage_check;

alter table matches
  add constraint matches_stage_check
  check (stage in ('group', 'r32', 'r16', 'qf', 'sf', 'final'));

-- Reclasificar los partidos que cayeron a 'group' siendo en realidad r32
-- (los que no tienen group_name y su stage es 'group' pero son eliminatorios)
-- Nota: tras re-sync los fixtures se actualizarán correctamente.
