'use client'
import { useMemo, useState } from 'react'
import type { Match } from '@/lib/types/app'
import { getFlagUrl, getTeamInitials } from '@/lib/utils/flags'

interface Props {
  matches: Match[]
}

const ROUND_LABELS: Record<string, string> = {
  r16: 'Octavos de Final',
  qf: 'Cuartos de Final',
  sf: 'Semifinales',
  final: 'Final',
}

const ROUND_ORDER = ['r16', 'qf', 'sf', 'final']

function FlagTiny({ team }: { team: string }) {
  const url = getFlagUrl(team)
  const initials = getTeamInitials(team)
  const [errored, setErrored] = useState(false)

  if (!url || errored || team === 'Por determinar') {
    return (
      <span
        className="inline-flex items-center justify-center rounded shrink-0 text-[9px] font-bold"
        style={{
          width: 18,
          height: 13,
          background: 'oklch(0.18 0.01 255)',
          color: 'oklch(0.50 0.01 255)',
        }}
      >
        {team === 'Por determinar' ? '?' : initials}
      </span>
    )
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={url}
      alt={team}
      width={18}
      height={13}
      className="rounded-sm shrink-0 object-cover"
      onError={() => setErrored(true)}
      style={{ width: 18, height: 13 }}
    />
  )
}

function MatchCard({ match, isWide }: { match: Match; isWide?: boolean }) {
  const isPending = match.home_team === 'Por determinar' && match.away_team === 'Por determinar'
  const isFinished = match.status === 'finished'
  const isLive = match.status === 'live'

  const homeWon = isFinished && match.home_score !== null && match.away_score !== null && match.home_score > match.away_score
  const awayWon = isFinished && match.home_score !== null && match.away_score !== null && match.away_score > match.home_score

  const cardWidth = isWide ? 200 : 160

  return (
    <div
      className="rounded-lg overflow-hidden flex flex-col"
      style={{
        width: cardWidth,
        background: 'oklch(0.11 0.008 255)',
        border: `1px solid ${isLive ? 'oklch(0.72 0.22 25 / 0.6)' : 'oklch(0.20 0.01 255)'}`,
        boxShadow: isLive ? '0 0 12px oklch(0.72 0.22 25 / 0.15)' : 'none',
      }}
    >
      {/* Live badge */}
      {isLive && (
        <div
          className="px-2 py-0.5 flex items-center gap-1"
          style={{ background: 'oklch(0.65 0.22 25 / 0.15)' }}
        >
          <span
            className="inline-block w-1.5 h-1.5 rounded-full animate-pulse"
            style={{ background: 'oklch(0.75 0.22 25)' }}
          />
          <span className="text-[9px] font-bold uppercase tracking-wider" style={{ color: 'oklch(0.75 0.22 25)' }}>
            En vivo
          </span>
        </div>
      )}

      {/* Home team */}
      <div
        className="flex items-center gap-1.5 px-2 py-1.5"
        style={{
          background: homeWon ? 'oklch(0.72 0.22 145 / 0.08)' : 'transparent',
          borderBottom: '1px solid oklch(0.16 0.01 255)',
        }}
      >
        <FlagTiny team={match.home_team} />
        <span
          className="flex-1 text-xs truncate"
          style={{
            color: isPending ? 'oklch(0.40 0.008 255)' : homeWon ? 'oklch(0.72 0.22 145)' : 'oklch(0.80 0.005 255)',
            fontWeight: homeWon ? 700 : 400,
            fontStyle: isPending ? 'italic' : 'normal',
          }}
        >
          {match.home_team === 'Por determinar' ? 'Por determinar' : match.home_team}
        </span>
        {isFinished && match.home_score !== null && (
          <span
            className="text-xs font-mono font-bold shrink-0"
            style={{ color: homeWon ? 'oklch(0.72 0.22 145)' : 'oklch(0.60 0.005 255)' }}
          >
            {match.home_score}
          </span>
        )}
      </div>

      {/* Away team */}
      <div
        className="flex items-center gap-1.5 px-2 py-1.5"
        style={{
          background: awayWon ? 'oklch(0.72 0.22 145 / 0.08)' : 'transparent',
        }}
      >
        <FlagTiny team={match.away_team} />
        <span
          className="flex-1 text-xs truncate"
          style={{
            color: isPending ? 'oklch(0.40 0.008 255)' : awayWon ? 'oklch(0.72 0.22 145)' : 'oklch(0.80 0.005 255)',
            fontWeight: awayWon ? 700 : 400,
            fontStyle: isPending ? 'italic' : 'normal',
          }}
        >
          {match.away_team === 'Por determinar' ? 'Por determinar' : match.away_team}
        </span>
        {isFinished && match.away_score !== null && (
          <span
            className="text-xs font-mono font-bold shrink-0"
            style={{ color: awayWon ? 'oklch(0.72 0.22 145)' : 'oklch(0.60 0.005 255)' }}
          >
            {match.away_score}
          </span>
        )}
      </div>
    </div>
  )
}

function RoundColumn({
  label,
  matches,
  isWide,
  isFinal,
}: {
  label: string
  matches: Match[]
  isWide?: boolean
  isFinal?: boolean
}) {
  const cardWidth = isWide ? 200 : 160

  return (
    <div className="flex flex-col items-center" style={{ minWidth: cardWidth + 32 }}>
      {/* Column header */}
      <div
        className="text-[10px] font-bold uppercase tracking-widest mb-4 text-center"
        style={{ color: 'oklch(0.52 0.01 255)' }}
      >
        {label}
      </div>

      {/* Match cards */}
      <div
        className="flex flex-col"
        style={{
          gap: isFinal ? 0 : matches.length <= 2 ? 48 : matches.length <= 4 ? 24 : 12,
          alignItems: 'center',
          justifyContent: 'center',
          flex: 1,
        }}
      >
        {matches.map(m => (
          <MatchCard key={m.id} match={m} isWide={isWide} />
        ))}
      </div>
    </div>
  )
}

// Separator with connecting lines concept (CSS only)
function RoundSeparator() {
  return (
    <div
      className="self-stretch flex items-center"
      style={{ width: 24, flexShrink: 0 }}
    >
      <div
        className="w-full"
        style={{
          height: 1,
          background: 'oklch(0.20 0.01 255)',
        }}
      />
    </div>
  )
}

export function BracketView({ matches }: Props) {
  const byRound = useMemo(() => {
    const rounds: Record<string, Match[]> = { r16: [], qf: [], sf: [], final: [] }
    matches.forEach(m => {
      if (m.stage in rounds) {
        rounds[m.stage as keyof typeof rounds].push(m)
      }
    })
    // Sort by kickoff within each round
    Object.values(rounds).forEach(arr => arr.sort((a, b) => a.kickoff_at.localeCompare(b.kickoff_at)))
    return rounds
  }, [matches])

  const hasKnockout = ROUND_ORDER.some(r => byRound[r].length > 0)

  if (!hasKnockout) {
    return (
      <div
        className="flex flex-col items-center justify-center py-20 gap-3"
        style={{ color: 'oklch(0.52 0.01 255)' }}
      >
        <span className="text-4xl">🏆</span>
        <p className="text-sm text-center max-w-xs">
          El cuadro eliminatorio estará disponible cuando avancen los grupos.
          <br />
          <span style={{ color: 'oklch(0.40 0.008 255)', fontSize: 12 }}>
            Fase de grupos: 11 jun – 2 jul · Octavos: 3 jul
          </span>
        </p>
      </div>
    )
  }

  return (
    <div className="overflow-x-auto pb-4">
      <div className="flex items-start gap-0" style={{ minWidth: 'max-content', paddingBottom: 16 }}>
        {ROUND_ORDER.map((round, i) => {
          const roundMatches = byRound[round]
          if (roundMatches.length === 0 && round !== 'final') return null

          const isFinal = round === 'final'

          return (
            <div key={round} className="flex items-center">
              {i > 0 && <RoundSeparator />}
              <RoundColumn
                label={ROUND_LABELS[round]}
                matches={roundMatches}
                isWide={isFinal}
                isFinal={isFinal}
              />
            </div>
          )
        })}
      </div>
    </div>
  )
}
