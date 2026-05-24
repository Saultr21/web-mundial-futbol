'use client'
import { useMemo, useState } from 'react'
import { format } from 'date-fns'
import type { Match } from '@/lib/types/app'
import { getFlagUrl, getTeamInitials } from '@/lib/utils/flags'

interface Props {
  matches: Match[]
}

function TeamFlagSmall({ team }: { team: string }) {
  const url = getFlagUrl(team)
  const initials = getTeamInitials(team)
  const [errored, setErrored] = useState(false)

  if (!url || errored) {
    return (
      <span
        className="inline-flex items-center justify-center text-[10px] font-bold rounded shrink-0"
        style={{
          width: 22,
          height: 16,
          background: 'oklch(0.20 0.01 255)',
          color: 'oklch(0.72 0.22 145)',
        }}
      >
        {initials}
      </span>
    )
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={url}
      alt={team}
      width={22}
      height={16}
      className="rounded-sm shrink-0 object-cover"
      onError={() => setErrored(true)}
      style={{ width: 22, height: 16 }}
    />
  )
}

function MatchRow({ match }: { match: Match }) {
  const isFinished = match.status === 'finished'
  const isLive = match.status === 'live'

  return (
    <div
      className="flex items-center gap-2 py-1.5 px-2 rounded-md text-xs"
      style={{
        background: isLive ? 'oklch(0.14 0.01 25)' : 'transparent',
        borderLeft: isLive ? '2px solid oklch(0.72 0.22 25)' : '2px solid transparent',
      }}
    >
      {/* Home team */}
      <div className="flex items-center gap-1 flex-1 min-w-0 justify-end">
        <span
          className="truncate text-right font-medium"
          style={{
            color: isFinished && match.home_score !== null && match.away_score !== null && match.home_score > match.away_score
              ? 'oklch(0.72 0.22 145)'
              : 'oklch(0.80 0.005 255)',
          }}
        >
          {match.home_team === 'Por determinar' ? '?' : match.home_team.split(' ').pop()}
        </span>
        <TeamFlagSmall team={match.home_team} />
      </div>

      {/* Score / time */}
      <div
        className="shrink-0 font-mono font-bold text-center"
        style={{ minWidth: 44, color: isLive ? 'oklch(0.75 0.22 25)' : 'oklch(0.93 0.005 255)' }}
      >
        {isFinished
          ? `${match.home_score} - ${match.away_score}`
          : isLive
          ? 'EN VIVO'
          : format(new Date(match.kickoff_at), 'd/M HH:mm')}
      </div>

      {/* Away team */}
      <div className="flex items-center gap-1 flex-1 min-w-0">
        <TeamFlagSmall team={match.away_team} />
        <span
          className="truncate font-medium"
          style={{
            color: isFinished && match.home_score !== null && match.away_score !== null && match.away_score > match.home_score
              ? 'oklch(0.72 0.22 145)'
              : 'oklch(0.80 0.005 255)',
          }}
        >
          {match.away_team === 'Por determinar' ? '?' : match.away_team.split(' ').pop()}
        </span>
      </div>
    </div>
  )
}

function GroupCard({ groupName, matches }: { groupName: string; matches: Match[] }) {
  // Derive teams from matches
  const teams = useMemo(() => {
    const teamSet = new Set<string>()
    matches.forEach(m => {
      if (m.home_team !== 'Por determinar') teamSet.add(m.home_team)
      if (m.away_team !== 'Por determinar') teamSet.add(m.away_team)
    })
    return Array.from(teamSet)
  }, [matches])

  // Build a simple standings table from finished matches
  const standings = useMemo(() => {
    const table: Record<string, { pts: number; gf: number; ga: number; w: number; d: number; l: number; played: number }> = {}
    teams.forEach(t => { table[t] = { pts: 0, gf: 0, ga: 0, w: 0, d: 0, l: 0, played: 0 } })
    matches.forEach(m => {
      if (m.status !== 'finished' || m.home_score === null || m.away_score === null) return
      const h = m.home_team
      const a = m.away_team
      if (!table[h] || !table[a]) return
      table[h].gf += m.home_score
      table[h].ga += m.away_score
      table[a].gf += m.away_score
      table[a].ga += m.home_score
      table[h].played++
      table[a].played++
      if (m.home_score > m.away_score) {
        table[h].pts += 3; table[h].w++; table[a].l++
      } else if (m.home_score < m.away_score) {
        table[a].pts += 3; table[a].w++; table[h].l++
      } else {
        table[h].pts++; table[h].d++; table[a].pts++; table[a].d++
      }
    })
    return Object.entries(table)
      .sort(([, a], [, b]) => b.pts - a.pts || (b.gf - b.ga) - (a.gf - a.ga) || b.gf - a.gf)
      .map(([team, stats]) => ({ team, ...stats }))
  }, [matches, teams])

  const hasStandings = standings.some(s => s.played > 0)

  return (
    <div
      className="rounded-xl overflow-hidden flex flex-col"
      style={{
        background: 'oklch(0.11 0.008 255)',
        border: '1px solid oklch(0.20 0.01 255)',
      }}
    >
      {/* Header */}
      <div
        className="px-3 py-2 flex items-center gap-2"
        style={{ borderBottom: '1px solid oklch(0.16 0.01 255)', background: 'oklch(0.09 0.007 255)' }}
      >
        <span
          className="text-xs font-bold tracking-widest uppercase"
          style={{ color: 'oklch(0.72 0.22 145)' }}
        >
          Grupo {groupName}
        </span>
        <span className="text-xs" style={{ color: 'oklch(0.40 0.008 255)' }}>
          · {teams.length} equipos
        </span>
      </div>

      <div className="flex flex-col flex-1">
        {/* Standings mini-table */}
        {hasStandings && (
          <div className="px-3 pt-2 pb-1">
            <table className="w-full text-[10px]" style={{ color: 'oklch(0.60 0.008 255)' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid oklch(0.16 0.01 255)' }}>
                  <th className="text-left pb-1 font-medium" colSpan={2}>Equipo</th>
                  <th className="text-center pb-1 font-medium w-6">PJ</th>
                  <th className="text-center pb-1 font-medium w-6">Pts</th>
                  <th className="text-center pb-1 font-medium w-8">GD</th>
                </tr>
              </thead>
              <tbody>
                {standings.map((row, i) => (
                  <tr key={row.team} style={{ opacity: row.played === 0 ? 0.5 : 1 }}>
                    <td className="py-0.5 pr-1 text-center" style={{ color: i < 2 ? 'oklch(0.72 0.22 145)' : 'oklch(0.40 0.008 255)' }}>
                      {i + 1}
                    </td>
                    <td className="py-0.5 flex items-center gap-1 max-w-[80px]">
                      <TeamFlagSmall team={row.team} />
                      <span className="truncate" style={{ color: 'oklch(0.80 0.005 255)' }}>
                        {row.team.length > 10 ? row.team.split(' ').pop() : row.team}
                      </span>
                    </td>
                    <td className="text-center py-0.5">{row.played}</td>
                    <td className="text-center py-0.5 font-bold" style={{ color: 'oklch(0.93 0.005 255)' }}>{row.pts}</td>
                    <td className="text-center py-0.5">{row.gf - row.ga > 0 ? '+' : ''}{row.gf - row.ga}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Teams list (no standings yet) */}
        {!hasStandings && teams.length > 0 && (
          <div className="px-3 pt-2 pb-1 flex flex-col gap-1">
            {teams.map(team => (
              <div key={team} className="flex items-center gap-2">
                <TeamFlagSmall team={team} />
                <span className="text-xs" style={{ color: 'oklch(0.80 0.005 255)' }}>{team}</span>
              </div>
            ))}
          </div>
        )}

        {/* Divider */}
        <div style={{ height: 1, background: 'oklch(0.16 0.01 255)', margin: '4px 0' }} />

        {/* Matches */}
        <div className="px-1 pb-2 flex flex-col gap-0.5">
          {matches.map(m => (
            <MatchRow key={m.id} match={m} />
          ))}
        </div>
      </div>
    </div>
  )
}

export function GroupsView({ matches }: Props) {
  const grouped = useMemo(() => {
    const groupMatches = matches.filter(m => m.stage === 'group' && m.group_name)
    return groupMatches.reduce((acc, m) => {
      const g = m.group_name!
      if (!acc[g]) acc[g] = []
      acc[g].push(m)
      return acc
    }, {} as Record<string, Match[]>)
  }, [matches])

  const groupNames = Object.keys(grouped).sort()

  if (groupNames.length === 0) {
    return (
      <div className="text-center py-16 text-sm" style={{ color: 'oklch(0.52 0.01 255)' }}>
        No hay datos de grupos disponibles
      </div>
    )
  }

  return (
    <div
      className="grid gap-4"
      style={{
        gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
      }}
    >
      {groupNames.map(g => (
        <GroupCard key={g} groupName={g} matches={grouped[g]} />
      ))}
    </div>
  )
}
