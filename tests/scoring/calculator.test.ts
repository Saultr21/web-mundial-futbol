import { describe, it, expect } from 'vitest'
import { calculateMatchPoints, calculateBracketPoints, calculateSpecialPoints } from '@/lib/scoring/calculator'
import type { Match, Prediction } from '@/lib/types/app'

const baseMatch: Match = {
  id: 'm1', api_id: 1, home_team: 'España', away_team: 'Francia',
  kickoff_at: '2026-06-14T18:00:00Z', stage: 'group', group_name: 'A',
  status: 'finished', home_score: 2, away_score: 1,
  home_scorers: ['Morata', 'Yamal'], away_scorers: ['Mbappe'],
  red_card: false, most_fouls_player: 'Tchouameni'
}

const basePrediction: Prediction = {
  id: 'p1', user_id: 'u1', match_id: 'm1',
  pred_home: 2, pred_away: 1,
  pred_scorers: ['Morata', 'Mbappe'],
  pred_red_card: false, pred_most_fouls: 'Tchouameni',
  submitted_at: '2026-06-13T10:00:00Z', points_earned: 0
}

describe('calculateMatchPoints - fase de grupos', () => {
  it('acierta resultado y marcador exacto', () => {
    const pts = calculateMatchPoints(baseMatch, basePrediction)
    // marcador exacto (8) + goleador Morata (2) + goleador Mbappe (2) + sin tarjeta (4) + faltas (5) = 21
    expect(pts).toBe(21)
  })

  it('acierta solo resultado (1/X/2), no marcador exacto', () => {
    const pred = { ...basePrediction, pred_home: 3, pred_away: 1 }
    const pts = calculateMatchPoints(baseMatch, pred)
    // resultado (3) + Mbappe (2) + sin tarjeta (4) + faltas (5) = 14
    expect(pts).toBe(14)
  })

  it('falla resultado completamente', () => {
    const pred = { ...basePrediction, pred_home: 0, pred_away: 2, pred_scorers: [] }
    const pts = calculateMatchPoints(baseMatch, pred)
    // 0 resultado + 0 goleadores + sin tarjeta (4) + faltas (5) = 9
    expect(pts).toBe(9)
  })

  it('predice tarjeta roja correctamente', () => {
    const match = { ...baseMatch, red_card: true }
    const pred = { ...basePrediction, pred_red_card: true }
    const pts = calculateMatchPoints(match, pred)
    // marcador (8) + Morata (2) + Mbappe (2) + tarjeta roja (4) + faltas (5) = 21
    expect(pts).toBe(21)
  })

  it('falla predicción de tarjeta roja', () => {
    const match = { ...baseMatch, red_card: true }
    const pred = { ...basePrediction, pred_red_card: false }
    const pts = calculateMatchPoints(match, pred)
    // marcador (8) + Morata (2) + Mbappe (2) + tarjeta FALLO (0) + faltas (5) = 17
    expect(pts).toBe(17)
  })

  it('empate predicho y acertado', () => {
    const match = { ...baseMatch, home_score: 1, away_score: 1, home_scorers: ['Morata'], away_scorers: ['Mbappe'], red_card: false, most_fouls_player: null }
    const pred = { ...basePrediction, pred_home: 1, pred_away: 1, pred_scorers: ['Morata'], pred_red_card: null, pred_most_fouls: null }
    const pts = calculateMatchPoints(match, pred)
    // marcador exacto (8) + Morata (2) = 10
    expect(pts).toBe(10)
  })
})

describe('calculateMatchPoints - eliminatorias (x2)', () => {
  it('dobla puntos de resultado/marcador/goleadores pero NO tarjeta/faltas en r16', () => {
    const match = { ...baseMatch, stage: 'r16' as const }
    const pts = calculateMatchPoints(match, basePrediction)
    // marcador exacto (16) + Morata (4) + Mbappe (4) + tarjeta NO roja acertada (4) + faltas (5) = 33
    // Nota: tarjeta roja y faltas NO se doblan según spec
    expect(pts).toBe(33)
  })
})

describe('calculateBracketPoints', () => {
  it('bracket perfecto hasta semis: bonus +30', () => {
    const bracket = {
      champion: 'España', runner_up: 'Francia',
      third: 'Brasil', fourth: 'Argentina',
      semifinalists: ['Alemania', 'Portugal'],
      quarterfinalists: ['Inglaterra', 'Italia', 'Países Bajos', 'Marruecos'],
    }
    const results = {
      champion: 'España', runner_up: 'Francia',
      third: 'Brasil', fourth: 'Argentina',
      semifinalists: ['Alemania', 'Portugal'],
      quarterfinalists: ['Inglaterra', 'Italia', 'Países Bajos', 'Marruecos'],
    }
    const pts = calculateBracketPoints(bracket, results)
    // 50 + 25 + 25 + 10 + 10 + 10 + 5*4 + 30 bonus = 190
    expect(pts).toBe(190)
  })

  it('solo acierta campeón', () => {
    const bracket = {
      champion: 'España', runner_up: 'Brasil',
      third: 'Alemania', fourth: 'Portugal',
      semifinalists: ['Francia', 'Argentina'],
      quarterfinalists: ['México', 'Japón', 'Senegal', 'Australia'],
    }
    const results = {
      champion: 'España', runner_up: 'Francia',
      third: 'Países Bajos', fourth: 'Marruecos',
      semifinalists: ['Brasil', 'Portugal'],
      quarterfinalists: ['Inglaterra', 'Italia', 'Argentina', 'Croacia'],
    }
    const pts = calculateBracketPoints(bracket, results)
    expect(pts).toBe(50)
  })
})

describe('calculateSpecialPoints', () => {
  it('acierta todos: 100 pts', () => {
    const pred = { top_scorer: 'Mbappe', most_yellows: 'Busquets', golden_glove: 'Courtois', golden_ball: 'Mbappe' }
    const results = { top_scorer: 'Mbappe', most_yellows: 'Busquets', golden_glove: 'Courtois', golden_ball: 'Mbappe' }
    expect(calculateSpecialPoints(pred, results)).toBe(100)
  })

  it('falla todos: 0 pts', () => {
    const pred = { top_scorer: 'Mbappe', most_yellows: 'Busquets', golden_glove: 'Courtois', golden_ball: 'Mbappe' }
    const results = { top_scorer: 'Kane', most_yellows: 'Modric', golden_glove: 'Alisson', golden_ball: 'Pedri' }
    expect(calculateSpecialPoints(pred, results)).toBe(0)
  })

  it('case-insensitive comparison', () => {
    const pred = { top_scorer: 'mbappe', most_yellows: 'busquets', golden_glove: 'courtois', golden_ball: 'mbappe' }
    const results = { top_scorer: 'Mbappe', most_yellows: 'Busquets', golden_glove: 'Courtois', golden_ball: 'Mbappe' }
    expect(calculateSpecialPoints(pred, results)).toBe(100)
  })
})
