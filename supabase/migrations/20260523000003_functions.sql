create or replace function add_points(p_user_id uuid, p_points int, p_week_points int)
returns void language plpgsql security definer as $$
begin
  insert into leaderboard (user_id, total_points, week_points)
  values (p_user_id, p_points, p_week_points)
  on conflict (user_id) do update set
    total_points = leaderboard.total_points + excluded.total_points,
    week_points = leaderboard.week_points + excluded.week_points,
    updated_at = now();
end;
$$;
