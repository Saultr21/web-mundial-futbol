'use client'
import { useEffect, useState } from 'react'
import { Badge } from '@/components/ui/badge'

interface Props {
  matchApiId: number
  initialStatus: string
}

interface FixtureData {
  goals?: { home: number | null; away: number | null }
  fixture?: { status?: { short?: string } }
}

export function LiveMatchBadge({ matchApiId, initialStatus }: Props) {
  const [score, setScore] = useState<{ home: number | null; away: number | null }>({ home: null, away: null })
  const [isLive, setIsLive] = useState(initialStatus === 'live')

  useEffect(() => {
    if (!isLive) return
    const interval = setInterval(async () => {
      try {
        const res = await fetch(`/api/matches/${matchApiId}`)
        if (!res.ok) return
        const data = await res.json() as FixtureData
        if (data?.goals) {
          setScore({ home: data.goals.home, away: data.goals.away })
          const short = data.fixture?.status?.short ?? ''
          setIsLive(['1H','2H','HT'].includes(short))
        }
      } catch {
        // network error, try again next interval
      }
    }, 30000)
    return () => clearInterval(interval)
  }, [isLive, matchApiId])

  if (!isLive) return null

  return (
    <div className="flex items-center gap-2">
      <Badge variant="destructive" className="animate-pulse">EN VIVO</Badge>
      {score.home !== null && (
        <span className="font-mono font-bold">{score.home} - {score.away}</span>
      )}
    </div>
  )
}
