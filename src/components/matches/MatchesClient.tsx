'use client'
import { useState, useMemo } from 'react'
import Link from 'next/link'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import type { Match, Stage, MatchStatus } from '@/lib/types/app'
import { getFlagUrl, getTeamInitials } from '@/lib/utils/flags'

interface Props {
  matches: Match[]
}

const STAGE_LABELS: Record<Stage | 'all', string> = {
  all: 'Todos',
  group: 'Fase de grupos',
  r16: 'Octavos',
  qf: 'Cuartos',
  sf: 'Semifinal',
  final: 'Final',
}

const STATUS_LABELS: Record<MatchStatus | 'all', string> = {
  all: 'Todos',
  scheduled: 'Próximos',
  live: 'En vivo',
  finished: 'Finalizados',
}

function TeamFlag({ team }: { team: string }) {
  const url = getFlagUrl(team)
  const initials = getTeamInitials(team)
  const [errored, setErrored] = useState(false)

  if (!url || errored) {
    return (
      <span
        className="inline-flex items-center justify-center text-xs font-bold rounded shrink-0"
        style={{
          width: 28,
          height: 20,
          background: 'oklch(0.20 0.01 255)',
          color: 'oklch(0.72 0.22 145)',
          letterSpacing: '0.05em',
        }}
        aria-label={team}
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
      width={28}
      height={20}
      className="rounded-sm shrink-0 object-cover"
      onError={() => setErrored(true)}
      style={{ width: 28, height: 20 }}
    />
  )
}

function StatusBadge({ status, kickoffAt }: { status: MatchStatus; kickoffAt: string }) {
  if (status === 'live') {
    return (
      <span
        className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider"
        style={{ background: 'oklch(0.65 0.22 25 / 0.2)', color: 'oklch(0.75 0.22 25)' }}
      >
        <span
          className="inline-block w-1.5 h-1.5 rounded-full animate-pulse"
          style={{ background: 'oklch(0.75 0.22 25)' }}
        />
        Live
      </span>
    )
  }
  if (status === 'finished') {
    return (
      <span
        className="text-xs px-2 py-0.5 rounded-full uppercase tracking-wider"
        style={{ background: 'oklch(0.16 0.008 255)', color: 'oklch(0.52 0.01 255)' }}
      >
        FIN
      </span>
    )
  }
  return (
    <span
      className="text-sm font-mono font-bold"
      style={{ color: 'oklch(0.72 0.22 145)' }}
    >
      {format(new Date(kickoffAt), 'HH:mm')}
    </span>
  )
}

export function MatchesClient({ matches }: Props) {
  const [search, setSearch] = useState('')
  const [stageFilter, setStageFilter] = useState<Stage | 'all'>('all')
  const [statusFilter, setStatusFilter] = useState<MatchStatus | 'all'>('all')

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim()
    return matches.filter((m) => {
      if (q && !m.home_team.toLowerCase().includes(q) && !m.away_team.toLowerCase().includes(q)) {
        return false
      }
      if (stageFilter !== 'all' && m.stage !== stageFilter) return false
      if (statusFilter !== 'all' && m.status !== statusFilter) return false
      return true
    })
  }, [matches, search, stageFilter, statusFilter])

  // Agrupar por día
  const grouped = useMemo(() => {
    return filtered.reduce((acc, m) => {
      const day = format(new Date(m.kickoff_at), 'EEEE d MMMM', { locale: es })
      if (!acc[day]) acc[day] = []
      acc[day].push(m)
      return acc
    }, {} as Record<string, Match[]>)
  }, [filtered])

  const selectStyle = {
    background: 'oklch(0.11 0.008 255)',
    border: '1px solid oklch(0.20 0.01 255)',
    color: 'oklch(0.93 0.005 255)',
    borderRadius: '0.5rem',
    padding: '0.5rem 0.75rem',
    fontSize: '0.875rem',
    cursor: 'pointer',
    outline: 'none',
  } as React.CSSProperties

  return (
    <div className="space-y-6">
      {/* Barra de filtros */}
      <div className="flex flex-wrap gap-3">
        <input
          type="search"
          placeholder="Buscar equipo..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="flex-1 min-w-[180px] rounded-lg px-3 py-2 text-sm transition-colors duration-150"
          style={{
            background: 'oklch(0.11 0.008 255)',
            border: '1px solid oklch(0.20 0.01 255)',
            color: 'oklch(0.93 0.005 255)',
            outline: 'none',
          }}
          onFocus={(e) => { e.currentTarget.style.borderColor = 'oklch(0.72 0.22 145)' }}
          onBlur={(e) => { e.currentTarget.style.borderColor = 'oklch(0.20 0.01 255)' }}
        />
        <select
          value={stageFilter}
          onChange={(e) => setStageFilter(e.target.value as Stage | 'all')}
          style={selectStyle}
          onFocus={(e) => { e.currentTarget.style.borderColor = 'oklch(0.72 0.22 145)' }}
          onBlur={(e) => { e.currentTarget.style.borderColor = 'oklch(0.20 0.01 255)' }}
        >
          {(Object.entries(STAGE_LABELS) as [Stage | 'all', string][]).map(([val, label]) => (
            <option key={val} value={val}>{label}</option>
          ))}
        </select>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as MatchStatus | 'all')}
          style={selectStyle}
          onFocus={(e) => { e.currentTarget.style.borderColor = 'oklch(0.72 0.22 145)' }}
          onBlur={(e) => { e.currentTarget.style.borderColor = 'oklch(0.20 0.01 255)' }}
        >
          {(Object.entries(STATUS_LABELS) as [MatchStatus | 'all', string][]).map(([val, label]) => (
            <option key={val} value={val}>{label}</option>
          ))}
        </select>
      </div>

      {/* Resultados */}
      {filtered.length === 0 ? (
        <div
          className="text-center py-16 text-sm"
          style={{ color: 'oklch(0.52 0.01 255)' }}
        >
          No se encontraron partidos
        </div>
      ) : (
        Object.entries(grouped).map(([day, dayMatches]) => (
          <div key={day}>
            <h2
              className="text-xs font-medium uppercase tracking-widest mb-3 capitalize"
              style={{ color: 'oklch(0.52 0.01 255)' }}
            >
              {day}
            </h2>
            <div className="grid gap-2">
              {dayMatches.map((m) => (
                <Link
                  key={m.id}
                  href={`/partidos/${m.id}`}
                  className="group flex items-center gap-4 px-4 py-3 rounded-xl transition-all duration-200"
                  style={{
                    background: 'oklch(0.11 0.008 255)',
                    border: '1px solid oklch(0.20 0.01 255)',
                    textDecoration: 'none',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = 'oklch(0.72 0.22 145 / 0.5)'
                    e.currentTarget.style.background = 'oklch(0.13 0.01 255)'
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = 'oklch(0.20 0.01 255)'
                    e.currentTarget.style.background = 'oklch(0.11 0.008 255)'
                  }}
                >
                  {/* Equipo local */}
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    <TeamFlag team={m.home_team} />
                    <span
                      className="font-semibold text-sm truncate"
                      style={{ color: 'oklch(0.93 0.005 255)' }}
                    >
                      {m.home_team}
                    </span>
                  </div>

                  {/* Marcador / hora central */}
                  <div className="flex flex-col items-center gap-1 shrink-0 min-w-[80px]">
                    {m.status === 'finished' ? (
                      <span
                        className="text-base font-bold font-mono tracking-wider"
                        style={{ color: 'oklch(0.93 0.005 255)' }}
                      >
                        {m.home_score} – {m.away_score}
                      </span>
                    ) : (
                      <StatusBadge status={m.status} kickoffAt={m.kickoff_at} />
                    )}
                    {/* Fase / grupo */}
                    <span
                      className="text-[10px] uppercase tracking-widest"
                      style={{ color: 'oklch(0.40 0.008 255)' }}
                    >
                      {m.group_name ?? STAGE_LABELS[m.stage]}
                    </span>
                  </div>

                  {/* Equipo visitante */}
                  <div className="flex items-center gap-2 flex-1 min-w-0 justify-end">
                    <span
                      className="font-semibold text-sm truncate text-right"
                      style={{ color: 'oklch(0.93 0.005 255)' }}
                    >
                      {m.away_team}
                    </span>
                    <TeamFlag team={m.away_team} />
                  </div>

                  {/* Flecha */}
                  <span
                    className="text-sm shrink-0 transition-transform duration-200 group-hover:translate-x-0.5"
                    style={{ color: 'oklch(0.40 0.008 255)' }}
                    aria-hidden="true"
                  >
                    →
                  </span>
                </Link>
              ))}
            </div>
          </div>
        ))
      )}
    </div>
  )
}
