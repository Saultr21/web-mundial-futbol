// Auto-generated types - will be replaced when running: pnpm supabase:types
export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: { id: string; display_name: string; avatar_url: string | null; created_at: string }
        Insert: { id: string; display_name: string; avatar_url?: string | null; created_at?: string }
        Update: { id?: string; display_name?: string; avatar_url?: string | null; created_at?: string }
      }
      matches: {
        Row: { id: string; api_id: number; home_team: string; away_team: string; kickoff_at: string; stage: string; group_name: string | null; status: string; home_score: number | null; away_score: number | null; home_scorers: string[]; away_scorers: string[]; red_card: boolean; most_fouls_player: string | null; created_at: string }
        Insert: { id?: string; api_id: number; home_team: string; away_team: string; kickoff_at: string; stage: string; group_name?: string | null; status?: string; home_score?: number | null; away_score?: number | null; home_scorers?: string[]; away_scorers?: string[]; red_card?: boolean; most_fouls_player?: string | null; created_at?: string }
        Update: { id?: string; api_id?: number; home_team?: string; away_team?: string; kickoff_at?: string; stage?: string; group_name?: string | null; status?: string; home_score?: number | null; away_score?: number | null; home_scorers?: string[]; away_scorers?: string[]; red_card?: boolean; most_fouls_player?: string | null; created_at?: string }
      }
      predictions: {
        Row: { id: string; user_id: string; match_id: string; pred_home: number; pred_away: number; pred_scorers: string[]; pred_red_card: boolean | null; pred_most_fouls: string | null; submitted_at: string; points_earned: number }
        Insert: { id?: string; user_id: string; match_id: string; pred_home: number; pred_away: number; pred_scorers?: string[]; pred_red_card?: boolean | null; pred_most_fouls?: string | null; submitted_at?: string; points_earned?: number }
        Update: { id?: string; user_id?: string; match_id?: string; pred_home?: number; pred_away?: number; pred_scorers?: string[]; pred_red_card?: boolean | null; pred_most_fouls?: string | null; submitted_at?: string; points_earned?: number }
      }
      brackets: {
        Row: { id: string; user_id: string; champion: string; runner_up: string; third: string; fourth: string; semifinalists: string[]; quarterfinalists: string[]; locked_at: string | null; points_earned: number; created_at: string }
        Insert: { id?: string; user_id: string; champion: string; runner_up: string; third: string; fourth: string; semifinalists?: string[]; quarterfinalists?: string[]; locked_at?: string | null; points_earned?: number; created_at?: string }
        Update: { id?: string; user_id?: string; champion?: string; runner_up?: string; third?: string; fourth?: string; semifinalists?: string[]; quarterfinalists?: string[]; locked_at?: string | null; points_earned?: number; created_at?: string }
      }
      special_predictions: {
        Row: { id: string; user_id: string; top_scorer: string; most_yellows: string; golden_glove: string; golden_ball: string; locked_at: string | null; points_earned: number; created_at: string }
        Insert: { id?: string; user_id: string; top_scorer: string; most_yellows: string; golden_glove: string; golden_ball: string; locked_at?: string | null; points_earned?: number; created_at?: string }
        Update: { id?: string; user_id?: string; top_scorer?: string; most_yellows?: string; golden_glove?: string; golden_ball?: string; locked_at?: string | null; points_earned?: number; created_at?: string }
      }
      leaderboard: {
        Row: { user_id: string; total_points: number; week_points: number; streak: number; updated_at: string }
        Insert: { user_id: string; total_points?: number; week_points?: number; streak?: number; updated_at?: string }
        Update: { user_id?: string; total_points?: number; week_points?: number; streak?: number; updated_at?: string }
      }
      achievements: {
        Row: { id: string; user_id: string; badge_key: string; unlocked_at: string }
        Insert: { id?: string; user_id: string; badge_key: string; unlocked_at?: string }
        Update: { id?: string; user_id?: string; badge_key?: string; unlocked_at?: string }
      }
    }
    Views: {}
    Functions: {}
    Enums: {}
  }
}
