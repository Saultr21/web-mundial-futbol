import { createClient } from '@/lib/supabase/server'
import { MatchPredictionForm } from '@/components/predictions/MatchPredictionForm'
import { notFound } from 'next/navigation'
import type { Match, Prediction } from '@/lib/types/app'

export default async function MatchPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const matchRes = await supabase.from('matches').select('*').eq('id', id).single()
  const predRes = await supabase.from('predictions').select('*').eq('match_id', id).eq('user_id', user!.id).maybeSingle()

  const match = matchRes.data as Match | null
  const prediction = predRes.data as Prediction | null

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
