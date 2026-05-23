-- Habilitar RLS en todas las tablas
alter table profiles enable row level security;
alter table matches enable row level security;
alter table predictions enable row level security;
alter table brackets enable row level security;
alter table special_predictions enable row level security;
alter table leaderboard enable row level security;
alter table achievements enable row level security;

-- profiles: cualquier usuario autenticado puede leer, solo el propio puede actualizar
create policy "profiles_select" on profiles for select to authenticated using (true);
create policy "profiles_update" on profiles for update to authenticated using (auth.uid() = id);

-- matches: solo lectura para autenticados, escritura solo service_role (admin)
create policy "matches_select" on matches for select to authenticated using (true);

-- predictions: lectura global autenticada, escritura solo del propio usuario
create policy "predictions_select" on predictions for select to authenticated using (true);
create policy "predictions_insert" on predictions for insert to authenticated with check (auth.uid() = user_id);
create policy "predictions_update" on predictions for update to authenticated
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- brackets y special_predictions: ídem
create policy "brackets_select" on brackets for select to authenticated using (true);
create policy "brackets_insert" on brackets for insert to authenticated with check (auth.uid() = user_id);
create policy "brackets_update" on brackets for update to authenticated
  using (auth.uid() = user_id and locked_at is null);

create policy "special_select" on special_predictions for select to authenticated using (true);
create policy "special_insert" on special_predictions for insert to authenticated with check (auth.uid() = user_id);
create policy "special_update" on special_predictions for update to authenticated
  using (auth.uid() = user_id and locked_at is null);

-- leaderboard y achievements: solo lectura
create policy "leaderboard_select" on leaderboard for select to authenticated using (true);
create policy "achievements_select" on achievements for select to authenticated using (true);

-- Escritura de leaderboard y achievements solo para service_role (Edge Functions)
create policy "leaderboard_insert" on leaderboard for insert to service_role with check (true);
create policy "leaderboard_update" on leaderboard for update to service_role using (true);
create policy "achievements_insert" on achievements for insert to service_role with check (true);

-- Storage bucket para avatares
insert into storage.buckets (id, name, public) values ('avatars', 'avatars', true);

create policy "avatars_select" on storage.objects for select using (bucket_id = 'avatars');
create policy "avatars_insert" on storage.objects for insert to authenticated
  with check (bucket_id = 'avatars' and name like auth.uid()::text || '/%');
create policy "avatars_update" on storage.objects for update to authenticated
  using (bucket_id = 'avatars' and name like auth.uid()::text || '/%');
