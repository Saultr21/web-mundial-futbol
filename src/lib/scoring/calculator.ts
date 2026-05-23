import type { Match, Prediction, Stage } from '@/lib/types/app'

type BracketResult = {
  champion: string
  runner_up: string
  third: string
  fourth: string
  semifinalists: string[]
  quarterfinalists: string[]
}

function getResult(home: number, away: number): 'home' | 'draw' | 'away' {
  if (home > away) return 'home'
  if (home < away) return 'away'
  return 'draw'
}

function isElimination(stage: Stage): boolean {
  return stage !== 'group'
}

export function calculateMatchPoints(match: Match, prediction: Prediction): number {
  if (match.home_score === null || match.away_score === null) return 0

  const multiplier = isElimination(match.stage) ? 2 : 1
  let points = 0

  const actualResult = getResult(match.home_score, match.away_score)
  const predResult = getResult(prediction.pred_home, prediction.pred_away)
  const exactScore = prediction.pred_home === match.home_score && prediction.pred_away === match.away_score

  if (exactScore) {
    points += 8 * multiplier
  } else if (actualResult === predResult) {
    points += 3 * multiplier
  }

  // Scorers only count for teams whose goal count was predicted correctly
  const homeGoalsCorrect = prediction.pred_home === match.home_score
  const awayGoalsCorrect = prediction.pred_away === match.away_score

  const eligibleScorers: string[] = [
    ...(homeGoalsCorrect ? match.home_scorers : []),
    ...(awayGoalsCorrect ? match.away_scorers : []),
  ]
  const remainingScorers = [...eligibleScorers]
  for (const scorer of prediction.pred_scorers) {
    const idx = remainingScorers.findIndex(s => s.toLowerCase() === scorer.toLowerCase())
    if (idx !== -1) {
      points += 2 * multiplier
      remainingScorers.splice(idx, 1)
    }
  }

  // Red card and most fouls do NOT double in elimination rounds
  if (prediction.pred_red_card !== null && prediction.pred_red_card === match.red_card) {
    points += 4
  }

  if (prediction.pred_most_fouls && match.most_fouls_player &&
      prediction.pred_most_fouls.toLowerCase() === match.most_fouls_player.toLowerCase()) {
    points += 5
  }

  return points
}

export function calculateBracketPoints(bracket: BracketResult, results: BracketResult): number {
  let points = 0

  if (bracket.champion === results.champion) points += 50
  if (bracket.runner_up === results.runner_up) points += 25
  if (bracket.third === results.third) points += 25
  if (bracket.fourth === results.fourth) points += 10

  for (const team of bracket.semifinalists) {
    if (results.semifinalists.includes(team)) points += 10
  }
  for (const team of bracket.quarterfinalists) {
    if (results.quarterfinalists.includes(team)) points += 5
  }

  // Bonus: perfect bracket through semis
  const allSemis = [results.champion, results.runner_up, ...results.semifinalists]
  const predictedSemis = [bracket.champion, bracket.runner_up, ...bracket.semifinalists]
  const perfectSemis = allSemis.every(t => predictedSemis.includes(t))
  if (perfectSemis) points += 30

  return points
}

export function calculateSpecialPoints(predictions: {
  top_scorer: string
  most_yellows: string
  golden_glove: string
  golden_ball: string
}, results: {
  top_scorer: string
  most_yellows: string
  golden_glove: string
  golden_ball: string
}): number {
  let points = 0
  if (predictions.top_scorer.toLowerCase() === results.top_scorer.toLowerCase()) points += 40
  if (predictions.most_yellows.toLowerCase() === results.most_yellows.toLowerCase()) points += 20
  if (predictions.golden_glove.toLowerCase() === results.golden_glove.toLowerCase()) points += 20
  if (predictions.golden_ball.toLowerCase() === results.golden_ball.toLowerCase()) points += 20
  return points
}
