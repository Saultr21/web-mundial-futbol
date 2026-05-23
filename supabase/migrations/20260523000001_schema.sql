-- Perfil público (extiende auth.users)
create table profiles (
  id uuid primary key references auth.users on delete cascade,
  display_name text not null,
  avatar_url text,
  created_at timestamptz default now() not null
);

-- Partidos del Mundial
create table matches (
  id uuid primary key default gen_random_uuid(),
  api_id integer unique not null,
  home_team text not null,
  away_team text not null,
  kickoff_at timestamptz not null,
  stage text not null check (stage in ('group','r16','qf','sf','final')),
  group_name text,
  status text not null default 'scheduled' check (status in ('scheduled','live','finished')),
  home_score integer,
  away_score integer,
  home_scorers text[] default '{}',
  away_scorers text[] default '{}',
  red_card boolean default false,
  most_fouls_player text,
  created_at timestamptz default now() not null
);

-- Predicciones por partido
create table predictions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles on delete cascade,
  match_id uuid not null references matches on delete cascade,
  pred_home integer not null,
  pred_away integer not null,
  pred_scorers text[] default '{}',
  pred_red_card boolean,
  pred_most_fouls text,
  submitted_at timestamptz default now() not null,
  points_earned integer default 0,
  unique (user_id, match_id)
);

-- Cuadro pre-torneo
create table brackets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references profiles on delete cascade,
  champion text not null,
  runner_up text not null,
  third text not null,
  fourth text not null,
  semifinalists text[] not null default '{}',
  quarterfinalists text[] not null default '{}',
  locked_at timestamptz,
  points_earned integer default 0,
  created_at timestamptz default now() not null
);

-- Predicciones especiales pre-torneo
create table special_predictions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references profiles on delete cascade,
  top_scorer text not null,
  most_yellows text not null,
  golden_glove text not null,
  golden_ball text not null,
  locked_at timestamptz,
  points_earned integer default 0,
  created_at timestamptz default now() not null
);

-- Leaderboard
create table leaderboard (
  user_id uuid primary key references profiles on delete cascade,
  total_points integer default 0 not null,
  week_points integer default 0 not null,
  streak integer default 0 not null,
  updated_at timestamptz default now() not null
);

-- Logros
create table achievements (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles on delete cascade,
  badge_key text not null,
  unlocked_at timestamptz default now() not null,
  unique (user_id, badge_key)
);

-- Auto-crear perfil y entrada en leaderboard al registrarse
create or replace function handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into profiles (id, display_name, avatar_url)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)),
    new.raw_user_meta_data->>'avatar_url'
  );
  insert into leaderboard (user_id) values (new.id);
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure handle_new_user();
