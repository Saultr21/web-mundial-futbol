-- Añadir listas de jugadores por partido (se rellenan desde el admin sync)
alter table matches
  add column if not exists home_players text[] default '{}',
  add column if not exists away_players text[] default '{}';
