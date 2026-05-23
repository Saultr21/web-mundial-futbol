import { createClient } from '@/lib/supabase/server'
import { LeaderboardTable } from '@/components/ranking/LeaderboardTable'
import type { LeaderboardEntry } from '@/lib/types/app'

export const revalidate = 30

export default async function RankingPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const { data: entries } = await supabase
    .from('leaderboard')
    .select('*, profiles(display_name, avatar_url)')
    .order('total_points', { ascending: false })

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold">Clasificación</h1>
      <LeaderboardTable
        entries={(entries ?? []) as unknown as LeaderboardEntry[]}
        currentUserId={user!.id}
      />
    </div>
  )
}
