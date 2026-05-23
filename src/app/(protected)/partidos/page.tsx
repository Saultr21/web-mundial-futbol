import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { Badge } from '@/components/ui/badge'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import type { Match } from '@/lib/types/app'

export const revalidate = 60

export default async function PartidosPage() {
  const supabase = await createClient()
  const { data: matches } = await supabase
    .from('matches')
    .select('*')
    .order('kickoff_at', { ascending: true })

  const grouped = ((matches ?? []) as Match[]).reduce((acc, m) => {
    const day = format(new Date(m.kickoff_at), 'EEEE d MMMM', { locale: es })
    if (!acc[day]) acc[day] = []
    acc[day].push(m)
    return acc
  }, {} as Record<string, Match[]>)

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Partidos</h1>
      {Object.entries(grouped).map(([day, dayMatches]) => (
        <div key={day}>
          <h2 className="text-sm font-medium text-muted-foreground mb-2 capitalize">{day}</h2>
          <div className="grid gap-2">
            {dayMatches?.map(m => (
              <Link key={m.id} href={`/partidos/${m.id}`}
                className="flex items-center justify-between p-4 rounded-lg border hover:bg-accent transition-colors">
                <div className="flex items-center gap-3 font-medium">
                  <span>{m.home_team}</span>
                  <span className="text-muted-foreground">vs</span>
                  <span>{m.away_team}</span>
                </div>
                <div className="flex items-center gap-2">
                  {m.status === 'live' && (
                    <Badge variant="destructive" className="animate-pulse">EN VIVO</Badge>
                  )}
                  {m.status === 'finished' && (
                    <span className="text-sm font-mono">{m.home_score} - {m.away_score}</span>
                  )}
                  {m.status === 'scheduled' && (
                    <span className="text-sm text-muted-foreground">
                      {format(new Date(m.kickoff_at), 'HH:mm')}
                    </span>
                  )}
                </div>
              </Link>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}
