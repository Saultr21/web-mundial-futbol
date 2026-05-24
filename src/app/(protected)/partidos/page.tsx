export const runtime = 'edge'

import { createClient } from '@/lib/supabase/server'
import type { Match } from '@/lib/types/app'
import { MatchesClient } from '@/components/matches/MatchesClient'

export const revalidate = 60

export default async function PartidosPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const [{ data: matches }, { data: predictions }] = await Promise.all([
    supabase
      .from('matches')
      .select('*')
      .order('kickoff_at', { ascending: true }),
    supabase
      .from('predictions')
      .select('match_id')
      .eq('user_id', user!.id),
  ])

  const allMatches = (matches ?? []) as unknown as Match[]
  const predictedMatchIds = new Set((predictions ?? []).map(p => p.match_id as string))

  return (
    <div className="space-y-6">
      <div className="flex items-baseline gap-3">
        <h1
          className="text-5xl"
          style={{
            fontFamily: 'var(--font-bebas), Bebas Neue, sans-serif',
            color: 'oklch(0.93 0.005 255)',
            letterSpacing: '0.04em',
          }}
        >
          Partidos
        </h1>
        <span className="text-sm" style={{ color: 'oklch(0.52 0.01 255)' }}>
          {allMatches.length} encuentros
        </span>
      </div>
      <MatchesClient matches={allMatches} predictedMatchIds={predictedMatchIds} />
    </div>
  )
}
