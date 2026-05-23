export type Stage = 'group' | 'r16' | 'qf' | 'sf' | 'final'
export type MatchStatus = 'scheduled' | 'live' | 'finished'

export interface Match {
  id: string
  api_id: number
  home_team: string
  away_team: string
  kickoff_at: string
  stage: Stage
  group_name: string | null
  status: MatchStatus
  home_score: number | null
  away_score: number | null
  home_scorers: string[]
  away_scorers: string[]
  red_card: boolean
  most_fouls_player: string | null
}

export interface Prediction {
  id: string
  user_id: string
  match_id: string
  pred_home: number
  pred_away: number
  pred_scorers: string[]
  pred_red_card: boolean | null
  pred_most_fouls: string | null
  submitted_at: string
  points_earned: number
}

export interface LeaderboardEntry {
  user_id: string
  total_points: number
  week_points: number
  streak: number
  profiles: {
    display_name: string
    avatar_url: string | null
  }
}

export const BADGE_KEYS = [
  'profeta', 'madrugador', 'underdog', 'hat_trick',
  'vidente_cuadro', 'constante', 'goleador', 'campeon'
] as const
export type BadgeKey = typeof BADGE_KEYS[number]

export const BADGE_META: Record<BadgeKey, { label: string; description: string; emoji: string }> = {
  profeta:        { label: 'Profeta',              description: '5 marcadores exactos en el torneo', emoji: '🔮' },
  madrugador:     { label: 'Madrugador',            description: 'Predice >24h antes en 10 partidos', emoji: '⏰' },
  underdog:       { label: 'Underdog',              description: 'Acierta resultado de una sorpresa', emoji: '🐉' },
  hat_trick:      { label: 'Hat-trick',             description: '3 marcadores exactos consecutivos', emoji: '🎩' },
  vidente_cuadro: { label: 'Vidente del Cuadro',    description: 'Bracket ≥80% correcto hasta semis', emoji: '🏆' },
  constante:      { label: 'Constante',             description: 'Predice los 48 partidos de grupos', emoji: '📋' },
  goleador:       { label: 'Goleador',              description: '10 goleadores acertados en el torneo', emoji: '⚽' },
  campeon:        { label: 'Campeón de Campeones',  description: 'Acertó el ganador del Mundial', emoji: '👑' },
}
