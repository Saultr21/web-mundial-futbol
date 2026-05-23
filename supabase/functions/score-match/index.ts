import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

interface Match {
  id: string
  stage: string
  home_score: number
  away_score: number
  home_scorers: string[]
  away_scorers: string[]
  red_card: boolean
  most_fouls_player: string | null
}

interface Prediction {
  id: string
  user_id: string
  pred_home: number
  pred_away: number
  pred_scorers: string[]
  pred_red_card: boolean | null
  pred_most_fouls: string | null
}

function getResult(h: number, a: number): 'home' | 'draw' | 'away' {
  return h > a ? 'home' : h < a ? 'away' : 'draw'
}

function calcPoints(match: Match, pred: Prediction): number {
  const mult = match.stage !== 'group' ? 2 : 1
  let pts = 0

  const exact = pred.pred_home === match.home_score && pred.pred_away === match.away_score
  if (exact) {
    pts += 8 * mult
  } else if (getResult(pred.pred_home, pred.pred_away) === getResult(match.home_score, match.away_score)) {
    pts += 3 * mult
  }

  const homeGoalsCorrect = pred.pred_home === match.home_score
  const awayGoalsCorrect = pred.pred_away === match.away_score
  const eligibleScorers = [
    ...(homeGoalsCorrect ? match.home_scorers : []),
    ...(awayGoalsCorrect ? match.away_scorers : []),
  ]
  const remaining = [...eligibleScorers]
  for (const s of pred.pred_scorers) {
    const i = remaining.findIndex(r => r.toLowerCase() === s.toLowerCase())
    if (i !== -1) { pts += 2 * mult; remaining.splice(i, 1) }
  }

  if (pred.pred_red_card !== null && pred.pred_red_card === match.red_card) pts += 4
  if (pred.pred_most_fouls && match.most_fouls_player &&
      pred.pred_most_fouls.toLowerCase() === match.most_fouls_player.toLowerCase()) pts += 5

  return pts
}

serve(async (req) => {
  let match_id: string
  try {
    const body = await req.json() as { match_id?: string }
    if (!body.match_id) throw new Error('missing match_id')
    match_id = body.match_id
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid request body' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' }
    })
  }

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  )

  const { data: match, error: matchError } = await supabase
    .from('matches')
    .select('*')
    .eq('id', match_id)
    .single()

  if (matchError || !match) {
    return new Response(JSON.stringify({ error: 'Match not found' }), { status: 404 })
  }

  const { data: predictions } = await supabase
    .from('predictions')
    .select('*')
    .eq('match_id', match_id)

  if (!predictions?.length) {
    return new Response(JSON.stringify({ scored: 0 }), { status: 200 })
  }

  let scored = 0
  for (const pred of predictions) {
    const pts = calcPoints(match as Match, pred as Prediction)

    const { error: updateError } = await supabase
      .from('predictions')
      .update({ points_earned: pts })
      .eq('id', pred.id)

    if (updateError) continue

    const { error: rpcError } = await supabase.rpc('add_points', {
      p_user_id: pred.user_id,
      p_points: pts,
      p_week_points: pts,
    })
    if (rpcError) {
      console.error('add_points failed for user', pred.user_id, rpcError.message)
      continue
    }

    scored++
  }

  return new Response(JSON.stringify({ scored }), {
    headers: { 'Content-Type': 'application/json' },
  })
})
