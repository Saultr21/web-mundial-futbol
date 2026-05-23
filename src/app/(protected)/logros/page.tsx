import { createClient } from '@/lib/supabase/server'
import { BadgeGrid } from '@/components/achievements/BadgeGrid'
import type { BadgeKey } from '@/lib/types/app'

export default async function LogrosPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const { data: achievements } = await supabase
    .from('achievements')
    .select('badge_key')
    .eq('user_id', user!.id)

  const unlocked = ((achievements ?? []) as unknown as { badge_key: BadgeKey }[]).map(a => a.badge_key)

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Mis logros</h1>
        <p className="text-sm text-muted-foreground">{unlocked.length} / 8 desbloqueados</p>
      </div>
      <BadgeGrid unlocked={unlocked} />
    </div>
  )
}
