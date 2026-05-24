'use client'
import { useState } from 'react'
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import type { LeaderboardEntry } from '@/lib/types/app'

interface Props {
  entries: LeaderboardEntry[]
  currentUserId: string
}

const MEDALS = ['🥇', '🥈', '🥉'] as const

function PodiumCard({
  entry,
  rank,
  view,
  isCurrentUser,
}: {
  entry: LeaderboardEntry
  rank: number
  view: 'total' | 'week'
  isCurrentUser: boolean
}) {
  const medal = MEDALS[rank] ?? null
  const points = view === 'total' ? entry.total_points : entry.week_points
  const heights = ['h-28', 'h-20', 'h-16']
  const podiumHeight = heights[rank] ?? 'h-16'

  return (
    <div className="flex flex-col items-center gap-2">
      {/* Avatar + nombre */}
      <div className="flex flex-col items-center gap-1">
        <span className="text-2xl" aria-label={`Posición ${rank + 1}`}>{medal}</span>
        <Avatar
          className="h-12 w-12"
          style={
            isCurrentUser
              ? { outline: '2px solid oklch(0.72 0.22 145)', outlineOffset: '2px' }
              : undefined
          }
        >
          <AvatarImage src={entry.profiles.avatar_url ?? undefined} />
          <AvatarFallback
            style={{
              background: 'oklch(0.16 0.008 255)',
              color: 'oklch(0.72 0.22 145)',
              fontSize: '0.9rem',
              fontWeight: 700,
            }}
          >
            {entry.profiles.display_name[0]}
          </AvatarFallback>
        </Avatar>
        <span
          className="text-xs font-medium text-center max-w-[80px] truncate"
          style={{ color: isCurrentUser ? 'oklch(0.72 0.22 145)' : 'oklch(0.93 0.005 255)' }}
        >
          {entry.profiles.display_name}
        </span>
      </div>

      {/* Barra del podio */}
      <div
        className={`w-16 ${podiumHeight} flex items-center justify-center rounded-t-md`}
        style={{
          background:
            rank === 0
              ? 'linear-gradient(180deg, oklch(0.80 0.18 80) 0%, oklch(0.65 0.18 65) 100%)'
              : rank === 1
              ? 'linear-gradient(180deg, oklch(0.80 0.01 255) 0%, oklch(0.60 0.01 255) 100%)'
              : 'linear-gradient(180deg, oklch(0.72 0.15 45) 0%, oklch(0.55 0.12 35) 100%)',
        }}
      >
        <span
          className="text-sm font-bold"
          style={{
            fontFamily: 'var(--font-bebas), Bebas Neue, sans-serif',
            color: 'oklch(0.07 0 0)',
            fontSize: '1.1rem',
          }}
        >
          {points}
        </span>
      </div>
    </div>
  )
}

export function LeaderboardTable({ entries, currentUserId }: Props) {
  const [view, setView] = useState<'total' | 'week'>('total')
  const sorted = [...entries].sort((a, b) =>
    view === 'total' ? b.total_points - a.total_points : b.week_points - a.week_points
  )

  const top3 = sorted.slice(0, 3)
  const rest = sorted.slice(3)

  return (
    <div className="space-y-8">
      {/* Selector de vista */}
      <Tabs value={view} onValueChange={v => setView(v as 'total' | 'week')}>
        <TabsList
          style={{
            background: 'oklch(0.11 0.008 255)',
            border: '1px solid oklch(0.20 0.01 255)',
          }}
        >
          <TabsTrigger value="total">General</TabsTrigger>
          <TabsTrigger value="week">Esta semana</TabsTrigger>
        </TabsList>
      </Tabs>

      {sorted.length === 0 ? (
        <p
          className="text-center py-12 text-sm"
          style={{ color: 'oklch(0.52 0.01 255)' }}
        >
          Nadie ha puntuado todavía
        </p>
      ) : (
        <>
          {/* Podio top 3 */}
          {top3.length > 0 && (
            <div
              className="rounded-2xl p-6 flex items-end justify-center gap-4"
              style={{
                background: 'oklch(0.11 0.008 255)',
                border: '1px solid oklch(0.20 0.01 255)',
              }}
            >
              {/* Orden visual: 2º, 1º, 3º */}
              {[
                top3[1] ? { entry: top3[1], rank: 1 } : null,
                top3[0] ? { entry: top3[0], rank: 0 } : null,
                top3[2] ? { entry: top3[2], rank: 2 } : null,
              ]
                .filter(Boolean)
                .map((item) => {
                  if (!item) return null
                  return (
                    <PodiumCard
                      key={item.entry.user_id}
                      entry={item.entry}
                      rank={item.rank}
                      view={view}
                      isCurrentUser={item.entry.user_id === currentUserId}
                    />
                  )
                })}
            </div>
          )}

          {/* Resto de la tabla */}
          {rest.length > 0 && (
            <div
              className="rounded-xl overflow-hidden"
              style={{ border: '1px solid oklch(0.20 0.01 255)' }}
            >
              {rest.map((entry, idx) => {
                const rank = idx + 3
                const isCurrentUser = entry.user_id === currentUserId
                const points = view === 'total' ? entry.total_points : entry.week_points
                const isEven = idx % 2 === 0

                return (
                  <div
                    key={entry.user_id}
                    className="flex items-center gap-3 px-4 py-3 transition-colors duration-150"
                    style={{
                      background: isCurrentUser
                        ? 'oklch(0.72 0.22 145 / 0.08)'
                        : isEven
                        ? 'oklch(0.11 0.008 255)'
                        : 'oklch(0.095 0.007 255)',
                      borderLeft: isCurrentUser
                        ? '3px solid oklch(0.72 0.22 145)'
                        : '3px solid transparent',
                    }}
                  >
                    {/* Posición */}
                    <span
                      className="w-7 text-center text-sm font-mono"
                      style={{ color: 'oklch(0.40 0.008 255)' }}
                    >
                      {rank + 1}
                    </span>

                    {/* Avatar */}
                    <Avatar className="h-8 w-8 shrink-0">
                      <AvatarImage src={entry.profiles.avatar_url ?? undefined} />
                      <AvatarFallback
                        style={{
                          background: 'oklch(0.16 0.008 255)',
                          color: isCurrentUser ? 'oklch(0.72 0.22 145)' : 'oklch(0.52 0.01 255)',
                          fontSize: '0.75rem',
                          fontWeight: 700,
                        }}
                      >
                        {entry.profiles.display_name[0]}
                      </AvatarFallback>
                    </Avatar>

                    {/* Nombre */}
                    <span
                      className="flex-1 text-sm font-medium"
                      style={{
                        color: isCurrentUser
                          ? 'oklch(0.72 0.22 145)'
                          : 'oklch(0.93 0.005 255)',
                      }}
                    >
                      {entry.profiles.display_name}
                    </span>

                    {/* Racha */}
                    {entry.streak > 2 && (
                      <span
                        className="text-xs font-semibold"
                        style={{ color: 'oklch(0.75 0.18 60)' }}
                        title={`Racha de ${entry.streak} aciertos`}
                      >
                        🔥 {entry.streak}
                      </span>
                    )}

                    {/* Puntos */}
                    <span
                      className="font-bold text-sm font-mono"
                      style={{
                        color: isCurrentUser
                          ? 'oklch(0.72 0.22 145)'
                          : 'oklch(0.93 0.005 255)',
                      }}
                    >
                      {points} pts
                    </span>
                  </div>
                )
              })}
            </div>
          )}
        </>
      )}
    </div>
  )
}
