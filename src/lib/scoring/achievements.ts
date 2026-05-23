import type { BadgeKey } from '@/lib/types/app'

export interface AchievementStats {
  exact_scores: number
  early_predictions: number
  consecutive_exact: number
  total_scorers_correct: number
  all_group_predicted: boolean
  champion_correct: boolean
  bracket_accuracy: number
}

export function evaluateAchievements(stats: AchievementStats, alreadyUnlocked: BadgeKey[]): BadgeKey[] {
  const newBadges: BadgeKey[] = []

  function check(key: BadgeKey, condition: boolean) {
    if (condition && !alreadyUnlocked.includes(key)) newBadges.push(key)
  }

  check('profeta', stats.exact_scores >= 5)
  check('madrugador', stats.early_predictions >= 10)
  check('hat_trick', stats.consecutive_exact >= 3)
  check('goleador', stats.total_scorers_correct >= 10)
  check('constante', stats.all_group_predicted)
  check('campeon', stats.champion_correct)
  check('vidente_cuadro', stats.bracket_accuracy >= 0.8)
  // 'underdog' is awarded by external logic when a surprise result is detected

  return newBadges
}
