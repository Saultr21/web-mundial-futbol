'use client'
import { useState } from 'react'
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import type { LeaderboardEntry } from '@/lib/types/app'

interface Props {
  entries: LeaderboardEntry[]
  currentUserId: string
}

export function LeaderboardTable({ entries, currentUserId }: Props) {
  const [view, setView] = useState<'total' | 'week'>('total')
  const sorted = [...entries].sort((a, b) =>
    view === 'total' ? b.total_points - a.total_points : b.week_points - a.week_points
  )

  return (
    <div className="space-y-4">
      <Tabs value={view} onValueChange={v => setView(v as 'total' | 'week')}>
        <TabsList>
          <TabsTrigger value="total">General</TabsTrigger>
          <TabsTrigger value="week">Esta semana</TabsTrigger>
        </TabsList>
      </Tabs>
      <div className="space-y-2">
        {sorted.map((entry, i) => (
          <div
            key={entry.user_id}
            className={`flex items-center gap-3 p-3 rounded-lg border ${entry.user_id === currentUserId ? 'bg-accent border-primary' : ''}`}
          >
            <span className="w-6 text-center font-mono text-sm text-muted-foreground">{i + 1}</span>
            <Avatar className="h-8 w-8">
              <AvatarImage src={entry.profiles.avatar_url ?? undefined} />
              <AvatarFallback>{entry.profiles.display_name[0]}</AvatarFallback>
            </Avatar>
            <span className="flex-1 font-medium">{entry.profiles.display_name}</span>
            {entry.streak > 2 && (
              <span className="text-xs text-orange-500">🔥 {entry.streak}</span>
            )}
            <span className="font-mono font-bold">
              {view === 'total' ? entry.total_points : entry.week_points} pts
            </span>
          </div>
        ))}
        {sorted.length === 0 && (
          <p className="text-center text-muted-foreground py-8">Nadie ha puntuado todavía</p>
        )}
      </div>
    </div>
  )
}
