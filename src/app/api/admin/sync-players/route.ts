export const runtime = 'edge'

import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'
import { headers } from 'next/headers'

const FD_API = 'https://api.football-data.org/v4'

interface FDPlayer {
  name: string
  position: string | null
}

interface FDTeam {
  id: number
  name: string
  shortName: string
  squad: FDPlayer[]
}

interface FDTeamsResponse {
  count: number
  teams: FDTeam[]
}

export async function POST() {
  const headersList = await headers()
  const adminEmail = headersList.get('x-admin-email')
  if (adminEmail !== process.env.ADMIN_EMAIL) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const token = process.env.FOOTBALL_DATA_TOKEN
  if (!token) {
    return NextResponse.json({ error: 'FOOTBALL_DATA_TOKEN no configurada' }, { status: 500 })
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  // 1. Obtener equipos con plantillas del Mundial
  const teamsRes = await fetch(`${FD_API}/competitions/WC/teams?season=2026`, {
    headers: { 'X-Auth-Token': token },
  })

  if (!teamsRes.ok) {
    const body = await teamsRes.text()
    return NextResponse.json({ error: `football-data.org error ${teamsRes.status}`, details: body }, { status: 502 })
  }

  const teamsData = await teamsRes.json() as FDTeamsResponse
  const teams = teamsData.teams ?? []

  if (teams.length === 0) {
    return NextResponse.json({ error: 'No se encontraron equipos' }, { status: 404 })
  }

  // 2. Construir mapa nombre equipo → jugadores
  const playerMap: Record<string, string[]> = {}
  for (const team of teams) {
    const playerNames = (team.squad ?? [])
      .map((p) => p.name)
      .filter(Boolean)
    // Guardar por nombre completo y nombre corto para mayor coincidencia
    playerMap[team.name] = playerNames
    playerMap[team.shortName] = playerNames
  }

  // 3. Obtener todos los partidos de la DB
  const { data: matches, error: matchesError } = await supabase
    .from('matches')
    .select('id, home_team, away_team')

  if (matchesError) {
    return NextResponse.json({ error: matchesError.message }, { status: 500 })
  }

  // 4. Actualizar cada partido con los jugadores de ambos equipos
  let updated = 0
  let skipped = 0

  for (const match of matches ?? []) {
    const homePlayers = playerMap[match.home_team] ?? []
    const awayPlayers = playerMap[match.away_team] ?? []

    if (homePlayers.length === 0 && awayPlayers.length === 0) {
      skipped++
      continue
    }

    const { error } = await supabase
      .from('matches')
      .update({ home_players: homePlayers, away_players: awayPlayers })
      .eq('id', match.id)

    if (!error) updated++
  }

  return NextResponse.json({
    teams: teams.length,
    matches_updated: updated,
    matches_skipped: skipped,
  })
}
