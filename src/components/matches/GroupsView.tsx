'use client'
import { useMemo, useState } from 'react'
import { format } from 'date-fns'
import Link from 'next/link'
import type { Match } from '@/lib/types/app'
import { getFlagUrl, getTeamInitials } from '@/lib/utils/flags'

interface Props {
  matches: Match[]
  predictedMatchIds: Set<string>
}

function TeamFlagSmall({ team }: { team: string }) {
  const url = getFlagUrl(team)
  const initials = getTeamInitials(team)
  const [errored, setErrored] = useState(false)

  if (!url || errored) {
    return (
      <span
        className="inline-flex items-center justify-center rounded shrink-0 text-[10px] font-bold"
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

function MatchRow({ match, predicted }: { match: Match; predicted: boolean }) {
  const isFinished = match.status === 'finished'
  const isLive = match.status === 'live'
  const isLocked = match.status !== 'scheduled'

  const homeWon = isFinished && match.home_score !== null && match.away_score !== null && match.home_score > match.away_score
  const awayWon = isFinished && match.home_score !== null && match.away_score !== null && match.away_score > match.home_score

  return (
    <Link
      href={`/partidos/${match.id}`}
      className="flex items-center gap-2 py-1 px-1.5 rounded-md text-xs transition-colors duration-100"
      style={{
        background: isLive ? 'oklch(0.14 0.01 25)' : 'transparent',
        borderLeft: isLive ? '2px solid oklch(0.72 0.22 25)' : '2px solid transparent',
        textDecoration: 'none',
      }}
      onMouseEnter={e => { e.currentTarget.style.background = isLive ? 'oklch(0.16 0.01 25)' : 'oklch(0.13 0.01 255)' }}
      onMouseLeave={e => { e.currentTarget.style.background = isLive ? 'oklch(0.14 0.01 25)' : 'transparent' }}
    >
      {/* Home team — right-aligned */}
      <div className="flex items-center gap-1 flex-1 min-w-0 justify-end">
        <span
          className="truncate text-right"
          style={{
            color: homeWon ? 'oklch(0.72 0.22 145)' : 'oklch(0.75 0.005 255)',
            fontWeight: homeWon ? 700 : 400,
          }}
        >
          {match.home_team === 'Por determinar' ? '?' : match.home_team.split(' ').slice(-1)[0]}
        </span>
        <TeamFlagSmall team={match.home_team} />
      </div>

      {/* Score / time — fixed width center */}
      <div
        className="shrink-0 font-mono font-bold text-center tabular-nums"
        style={{
          minWidth: 50,
          color: isLive ? 'oklch(0.75 0.22 25)' : 'oklch(0.88 0.005 255)',
          fontSize: isLive ? 11 : 10,
        }}
      >
        {isFinished
          ? `${match.home_score}–${match.away_score}`
          : isLive
          ? '● VIVO'
          : format(new Date(match.kickoff_at), 'd/M HH:mm')}
      </div>

      {/* Away team — left-aligned */}
      <div className="flex items-center gap-1 flex-1 min-w-0 justify-start">
        <TeamFlagSmall team={match.away_team} />
        <span
          className="truncate"
          style={{
            color: awayWon ? 'oklch(0.72 0.22 145)' : 'oklch(0.75 0.005 255)',
            fontWeight: awayWon ? 700 : 400,
          }}
        >
          {match.away_team === 'Por determinar' ? '?' : match.away_team.split(' ').slice(-1)[0]}
        </span>
      </div>

      {/* Prediction indicator */}
      {isLocked ? (
        <span
          title={predicted ? 'Predicción enviada' : 'Sin predicción'}
          className="shrink-0 inline-flex items-center justify-center rounded-full text-[8px] font-bold"
          style={{
            width: 14,
            height: 14,
            background: predicted ? 'oklch(0.72 0.22 145 / 0.15)' : 'oklch(0.65 0.22 25 / 0.10)',
            color: predicted ? 'oklch(0.72 0.22 145)' : 'oklch(0.65 0.22 25)',
            border: `1px solid ${predicted ? 'oklch(0.72 0.22 145 / 0.3)' : 'oklch(0.65 0.22 25 / 0.2)'}`,
          }}
        >
          {predicted ? '✓' : '✗'}
        </span>
      ) : (
        <span
          title={predicted ? 'Predicción enviada' : 'Pendiente'}
          className="shrink-0 rounded-full"
          style={{
            width: 6,
            height: 6,
            background: predicted ? 'oklch(0.72 0.22 145)' : 'oklch(0.28 0.01 255)',
            boxShadow: predicted ? '0 0 4px oklch(0.72 0.22 145 / 0.5)' : 'none',
            display: 'inline-block',
          }}
        />
      )}
    </Link>
  )
}

function GroupCard({
  groupName,
  matches,
  predictedMatchIds,
}: {
  groupName: string
  matches: Match[]
  predictedMatchIds: Set<string>
}) {
  const teams = useMemo(() => {
    const teamSet = new Set<string>()
    matches.forEach(m => {
      if (m.home_team !== 'Por determinar') teamSet.add(m.home_team)
      if (m.away_team !== 'Por determinar') teamSet.add(m.away_team)
    })
    return Array.from(teamSet)
  }, [matches])

  const standings = useMemo(() => {
    const table: Record<string, { pts: number; gf: number; ga: number; played: number }> = {}
    teams.forEach(t => { table[t] = { pts: 0, gf: 0, ga: 0, played: 0 } })
    matches.forEach(m => {
      if (m.status !== 'finished' || m.home_score === null || m.away_score === null) return
      const h = m.home_team, a = m.away_team
      if (!table[h] || !table[a]) return
      table[h].gf += m.home_score; table[h].ga += m.away_score; table[h].played++
      table[a].gf += m.away_score; table[a].ga += m.home_score; table[a].played++
      if (m.home_score > m.away_score) { table[h].pts += 3 }
      else if (m.home_score < m.away_score) { table[a].pts += 3 }
      else { table[h].pts++; table[a].pts++ }
    })
    return Object.entries(table)
      .sort(([, a], [, b]) => b.pts - a.pts || (b.gf - b.ga) - (a.gf - a.ga) || b.gf - a.gf)
      .map(([team, s]) => ({ team, ...s }))
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
        className="px-3 py-2 flex items-center justify-between"
        style={{ borderBottom: '1px solid oklch(0.16 0.01 255)', background: 'oklch(0.09 0.007 255)' }}
      >
        <span className="text-xs font-bold tracking-widest uppercase" style={{ color: 'oklch(0.72 0.22 145)' }}>
          Grupo {groupName}
        </span>
        <span className="text-[10px]" style={{ color: 'oklch(0.40 0.008 255)' }}>
          {teams.length} equipos
        </span>
      </div>

      <div className="flex flex-col flex-1">
        {/* Standings — con clasificados resaltados */}
        {hasStandings ? (
          <div className="px-3 pt-2 pb-1">
            <table className="w-full text-[10px]" style={{ color: 'oklch(0.55 0.008 255)' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid oklch(0.16 0.01 255)' }}>
                  <th className="pb-1 font-medium text-center w-4">#</th>
                  <th className="pb-1 font-medium text-left pl-1">Equipo</th>
                  <th className="pb-1 font-medium text-center w-6">PJ</th>
                  <th className="pb-1 font-medium text-center w-7 font-bold" style={{ color: 'oklch(0.72 0.005 255)' }}>Pts</th>
                  <th className="pb-1 font-medium text-center w-8">DG</th>
                </tr>
              </thead>
              <tbody>
                {standings.map((row, i) => (
                  <tr
                    key={row.team}
                    style={{
                      opacity: row.played === 0 ? 0.45 : 1,
                      borderLeft: i < 2 ? '2px solid oklch(0.72 0.22 145 / 0.4)' : '2px solid transparent',
                    }}
                  >
                    <td className="py-0.5 text-center" style={{ color: i < 2 ? 'oklch(0.72 0.22 145)' : 'oklch(0.35 0.008 255)' }}>
                      {i + 1}
                    </td>
                    <td className="py-0.5 pl-1">
                      <div className="flex items-center gap-1">
                        <TeamFlagSmall team={row.team} />
                        <span className="truncate max-w-[72px]" style={{ color: 'oklch(0.82 0.005 255)' }}>
                          {row.team.split(' ').slice(-1)[0]}
                        </span>
                      </div>
                    </td>
                    <td className="text-center py-0.5">{row.played}</td>
                    <td className="text-center py-0.5 font-bold" style={{ color: 'oklch(0.93 0.005 255)' }}>{row.pts}</td>
                    <td className="text-center py-0.5">{row.gf - row.ga > 0 ? '+' : ''}{row.gf - row.ga}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          /* Teams list cuando no hay resultados aún */
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', padding: '12px 12px 8px' }}>
            {teams.map(team => (
              <div key={team} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, minWidth: 0 }}>
                <TeamFlagSmall team={team} />
                <span className="text-[11px] font-medium" style={{ color: 'oklch(0.82 0.005 255)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 72 }}>
                  {team}
                </span>
              </div>
            ))}
          </div>
        )}

        {/* Divider */}
        <div style={{ height: 1, background: 'oklch(0.15 0.01 255)', margin: '4px 8px' }} />

        {/* Matches */}
        <div className="px-1 pb-2 flex flex-col gap-0.5">
          {matches.map(m => (
            <MatchRow key={m.id} match={m} predicted={predictedMatchIds.has(m.id)} />
          ))}
        </div>
      </div>
    </div>
  )
}

export function GroupsView({ matches, predictedMatchIds }: Props) {
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
      style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(268px, 1fr))' }}
    >
      {groupNames.map(g => (
        <GroupCard key={g} groupName={g} matches={grouped[g]} predictedMatchIds={predictedMatchIds} />
      ))}
    </div>
  )
}
