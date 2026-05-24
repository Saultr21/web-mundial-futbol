export const runtime = 'edge'

import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'
import { headers } from 'next/headers'

const FD_API = 'https://api.football-data.org/v4'

interface FDMatch {
  id: number
  utcDate: string
  status: string
  stage: string
  group: string | null
  homeTeam: { name: string }
  awayTeam: { name: string }
  score: { fullTime: { home: number | null; away: number | null } }
}

export async function POST() {
  const headersList = await headers()
  const adminEmail = headersList.get('x-admin-email')

  if (adminEmail !== process.env.ADMIN_EMAIL) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const token = process.env.FOOTBALL_DATA_TOKEN
  if (!token) {
    return NextResponse.json({ error: 'FOOTBALL_DATA_TOKEN no configurada en Cloudflare Secrets' }, { status: 500 })
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const res = await fetch(`${FD_API}/competitions/WC/matches`, {
    headers: { 'X-Auth-Token': token },
  })

  if (!res.ok) {
    const body = await res.text()
    return NextResponse.json({ error: `football-data.org error ${res.status}`, details: body }, { status: 502 })
  }

  const data = await res.json() as { count: number; matches: FDMatch[] }
  const matches = data.matches ?? []

  if (matches.length === 0) {
    return NextResponse.json({ synced: 0, debug: { count: data.count } })
  }

  const records = matches.map(m => ({
    api_id: m.id,
    home_team: m.homeTeam.name,
    away_team: m.awayTeam.name,
    kickoff_at: m.utcDate,
    stage: mapStage(m.stage),
    group_name: m.group ? m.group.replace('GROUP_', '') : null,
    status: mapStatus(m.status),
    home_score: m.score.fullTime.home,
    away_score: m.score.fullTime.away,
  }))

  const { error: upsertError } = await supabase.from('matches').upsert(records, { onConflict: 'api_id' })
  if (upsertError) return NextResponse.json({ error: upsertError.message }, { status: 500 })

  return NextResponse.json({ synced: records.length })
}

function mapStage(stage: string): string {
  if (stage === 'GROUP_STAGE') return 'group'
  if (stage === 'ROUND_OF_16' || stage === 'LAST_16') return 'r16'
  if (stage === 'QUARTER_FINALS') return 'qf'
  if (stage === 'SEMI_FINALS') return 'sf'
  if (stage === 'FINAL' || stage === 'THIRD_PLACE') return 'final'
  return 'group'
}

function mapStatus(status: string): string {
  if (['IN_PLAY', 'PAUSED'].includes(status)) return 'live'
  if (status === 'FINISHED') return 'finished'
  return 'scheduled'
}
