import { createClient } from '@/lib/supabase/server'
import { MatchPredictionForm } from '@/components/predictions/MatchPredictionForm'
import { notFound } from 'next/navigation'
import type { Match, Prediction } from '@/lib/types/app'

export default async function MatchPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const [{ data: matchData }, { data: predictionData }] = await Promise.all([
    supabase.from('matches').select('*').eq('id', id).single(),
    supabase.from('predictions').select('*').eq('match_id', id).eq('user_id', user!.id).maybeSingle(),
  ])

  const match = matchData as Match | null
  const prediction = predictionData as Prediction | null

  if (!match) notFound()

  return (
    <div className="max-w-lg mx-auto space-y-6">
      <h1 className="text-2xl font-bold text-center">
        {match.home_team} vs {match.away_team}
      </h1>
      <MatchPredictionForm
        match={match}
        existing={prediction}
        userId={user!.id}
      />
    </div>
  )
}
