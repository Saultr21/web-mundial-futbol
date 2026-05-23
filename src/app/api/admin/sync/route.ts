import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'
import { headers } from 'next/headers'

export const runtime = 'nodejs'

const FOOTBALL_API = 'https://v3.football.api-sports.io'

export async function POST() {
  const headersList = await headers()
  const adminEmail = headersList.get('x-admin-email')

  if (adminEmail !== process.env.ADMIN_EMAIL) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const res = await fetch(`${FOOTBALL_API}/fixtures?league=1&season=2026`, {
    headers: { 'x-apisports-key': process.env.FOOTBALL_API_KEY! },
  })
  const data = await res.json() as {
    response: Array<{
      fixture: { id: number; date: string; status: { short: string } }
      teams: { home: { name: string }; away: { name: string } }
      league: { round: string }
      goals: { home: number | null; away: number | null }
    }>
  }
  const fixtures = data.response

  for (const f of fixtures) {
    await supabase.from('matches').upsert({
      api_id: f.fixture.id,
      home_team: f.teams.home.name,
      away_team: f.teams.away.name,
      kickoff_at: f.fixture.date,
      stage: mapStage(f.league.round),
      group_name: f.league.round.includes('Group') ? f.league.round.split(' ').pop() : null,
      status: mapMatchStatus(f.fixture.status.short),
      home_score: f.goals.home,
      away_score: f.goals.away,
    }, { onConflict: 'api_id' })
  }

  return NextResponse.json({ synced: fixtures.length })
}

function mapStage(round: string): string {
  if (round.includes('Group')) return 'group'
  if (round === 'Round of 16') return 'r16'
  if (round === 'Quarter-finals') return 'qf'
  if (round === 'Semi-finals') return 'sf'
  if (round === 'Final') return 'final'
  return 'group'
}

function mapMatchStatus(short: string): string {
  if (['1H', '2H', 'HT', 'ET', 'P'].includes(short)) return 'live'
  if (['FT', 'AET', 'PEN'].includes(short)) return 'finished'
  return 'scheduled'
}
