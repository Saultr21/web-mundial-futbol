import { describe, it, expect } from 'vitest'
import { evaluateAchievements } from '@/lib/scoring/achievements'
import type { BadgeKey } from '@/lib/types/app'

describe('evaluateAchievements', () => {
  it('desbloquea profeta con 5 marcadores exactos', () => {
    const stats = { exact_scores: 5, early_predictions: 0, consecutive_exact: 0, total_scorers_correct: 0, all_group_predicted: false, champion_correct: false, bracket_accuracy: 0 }
    const unlocked: BadgeKey[] = ['constante']
    const result = evaluateAchievements(stats, unlocked)
    expect(result).toContain('profeta')
  })

  it('no desbloquea profeta si ya está desbloqueado', () => {
    const stats = { exact_scores: 5, early_predictions: 0, consecutive_exact: 0, total_scorers_correct: 0, all_group_predicted: false, champion_correct: false, bracket_accuracy: 0 }
    const unlocked: BadgeKey[] = ['profeta']
    const result = evaluateAchievements(stats, unlocked)
    expect(result).not.toContain('profeta')
  })

  it('desbloquea hat_trick con 3 consecutivos', () => {
    const stats = { exact_scores: 3, early_predictions: 0, consecutive_exact: 3, total_scorers_correct: 0, all_group_predicted: false, champion_correct: false, bracket_accuracy: 0 }
    const result = evaluateAchievements(stats, [])
    expect(result).toContain('hat_trick')
  })

  it('desbloquea campeon si acertó el campeón', () => {
    const stats = { exact_scores: 0, early_predictions: 0, consecutive_exact: 0, total_scorers_correct: 0, all_group_predicted: false, champion_correct: true, bracket_accuracy: 0 }
    const result = evaluateAchievements(stats, [])
    expect(result).toContain('campeon')
  })

  it('desbloquea madrugador con 10 predicciones tempranas', () => {
    const stats = { exact_scores: 0, early_predictions: 10, consecutive_exact: 0, total_scorers_correct: 0, all_group_predicted: false, champion_correct: false, bracket_accuracy: 0 }
    const result = evaluateAchievements(stats, [])
    expect(result).toContain('madrugador')
  })

  it('desbloquea goleador con 10 goleadores acertados', () => {
    const stats = { exact_scores: 0, early_predictions: 0, consecutive_exact: 0, total_scorers_correct: 10, all_group_predicted: false, champion_correct: false, bracket_accuracy: 0 }
    const result = evaluateAchievements(stats, [])
    expect(result).toContain('goleador')
  })

  it('desbloquea constante si predijo todos los partidos de grupos', () => {
    const stats = { exact_scores: 0, early_predictions: 0, consecutive_exact: 0, total_scorers_correct: 0, all_group_predicted: true, champion_correct: false, bracket_accuracy: 0 }
    const result = evaluateAchievements(stats, [])
    expect(result).toContain('constante')
  })

  it('desbloquea vidente_cuadro con accuracy >= 0.8', () => {
    const stats = { exact_scores: 0, early_predictions: 0, consecutive_exact: 0, total_scorers_correct: 0, all_group_predicted: false, champion_correct: false, bracket_accuracy: 0.85 }
    const result = evaluateAchievements(stats, [])
    expect(result).toContain('vidente_cuadro')
  })

  it('no desbloquea vidente_cuadro con accuracy < 0.8', () => {
    const stats = { exact_scores: 0, early_predictions: 0, consecutive_exact: 0, total_scorers_correct: 0, all_group_predicted: false, champion_correct: false, bracket_accuracy: 0.75 }
    const result = evaluateAchievements(stats, [])
    expect(result).not.toContain('vidente_cuadro')
  })

  it('retorna array vacío si no se cumplen condiciones', () => {
    const stats = { exact_scores: 0, early_predictions: 0, consecutive_exact: 0, total_scorers_correct: 0, all_group_predicted: false, champion_correct: false, bracket_accuracy: 0 }
    const result = evaluateAchievements(stats, [])
    expect(result).toHaveLength(0)
  })

  it('no desbloquea underdog (condición externa, siempre false aquí)', () => {
    // underdog badge is awarded by external logic (match result surprise), not by stats
    const stats = { exact_scores: 999, early_predictions: 999, consecutive_exact: 999, total_scorers_correct: 999, all_group_predicted: true, champion_correct: true, bracket_accuracy: 1.0 }
    const result = evaluateAchievements(stats, [])
    expect(result).not.toContain('underdog')
  })
})
