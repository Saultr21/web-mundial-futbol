export const runtime = 'edge'

import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import type { Match, Prediction } from '@/lib/types/app'
import { MatchDetailClient } from '@/components/predictions/MatchDetailClient'

export interface PredictionWithProfile extends Prediction {
  profiles: {
    display_name: string
    avatar_url: string | null
  } | null
}

export default async function MatchPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const [{ data: matchData }, { data: predictionsData }] = await Promise.all([
    supabase.from('matches').select('*').eq('id', id).single(),
    supabase
      .from('predictions')
      .select('*, profiles(display_name, avatar_url)')
      .eq('match_id', id),
  ])

  const match = matchData as Match | null
  if (!match) notFound()

  const predictions = (predictionsData ?? []) as PredictionWithProfile[]
  const myPrediction = predictions.find(p => p.user_id === user!.id) ?? null

  return (
    <MatchDetailClient
      match={match}
      predictions={predictions}
      myPrediction={myPrediction}
      userId={user!.id}
    />
  )
}
