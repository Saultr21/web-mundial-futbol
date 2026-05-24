'use client'
import { useMemo, useState } from 'react'
import type { Match } from '@/lib/types/app'
import { getFlagUrl, getTeamInitials } from '@/lib/utils/flags'

interface Props {
  matches: Match[]
}

// El Mundial 2026 tiene: R32 → R16 → QF → SF → 3er puesto + Final
const ROUND_ORDER = ['r32', 'r16', 'qf', 'sf']

const ROUND_LABELS: Record<string, string> = {
  r32: 'Ronda de 32',
  r16: 'Octavos de Final',
  qf: 'Cuartos de Final',
  sf: 'Semifinales',
  third: 'Tercer Puesto',
  final: 'Final',
}

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

function MatchCard({ match, isWide, isThird }: { match: Match; isWide?: boolean; isThird?: boolean }) {
  const isPending = match.home_team === 'Por determinar' && match.away_team === 'Por determinar'
  const isFinished = match.status === 'finished'
  const isLive = match.status === 'live'

  const homeWon = isFinished && match.home_score !== null && match.away_score !== null && match.home_score > match.away_score
  const awayWon = isFinished && match.home_score !== null && match.away_score !== null && match.away_score > match.home_score

  const cardWidth = isWide ? 200 : 160

  const borderColor = isLive
    ? 'oklch(0.72 0.22 25 / 0.6)'
    : isWide && !isThird
    ? 'oklch(0.72 0.22 145 / 0.4)'
    : 'oklch(0.20 0.01 255)'

  return (
    <div
      className="rounded-lg overflow-hidden flex flex-col"
      style={{
        width: cardWidth,
        background: isWide && !isThird ? 'oklch(0.13 0.01 255)' : 'oklch(0.11 0.008 255)',
        border: `1px solid ${borderColor}`,
        boxShadow: isLive
          ? '0 0 12px oklch(0.72 0.22 25 / 0.15)'
          : isWide && !isThird
          ? '0 0 20px oklch(0.72 0.22 145 / 0.08)'
          : 'none',
      }}
    >
      {isLive && (
        <div className="px-2 py-0.5 flex items-center gap-1" style={{ background: 'oklch(0.65 0.22 25 / 0.15)' }}>
          <span className="inline-block w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: 'oklch(0.75 0.22 25)' }} />
          <span className="text-[9px] font-bold uppercase tracking-wider" style={{ color: 'oklch(0.75 0.22 25)' }}>En vivo</span>
        </div>
      )}

      {/* Home */}
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
          {match.home_team}
        </span>
        {isFinished && match.home_score !== null && (
          <span className="text-xs font-mono font-bold shrink-0" style={{ color: homeWon ? 'oklch(0.72 0.22 145)' : 'oklch(0.60 0.005 255)' }}>
            {match.home_score}
          </span>
        )}
      </div>

      {/* Away */}
      <div
        className="flex items-center gap-1.5 px-2 py-1.5"
        style={{ background: awayWon ? 'oklch(0.72 0.22 145 / 0.08)' : 'transparent' }}
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
          {match.away_team}
        </span>
        {isFinished && match.away_score !== null && (
          <span className="text-xs font-mono font-bold shrink-0" style={{ color: awayWon ? 'oklch(0.72 0.22 145)' : 'oklch(0.60 0.005 255)' }}>
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
  isThird,
}: {
  label: string
  matches: Match[]
  isWide?: boolean
  isThird?: boolean
}) {
  const cardWidth = isWide ? 200 : 160
  const gap = matches.length <= 1 ? 0 : matches.length <= 2 ? 48 : matches.length <= 4 ? 24 : 12

  return (
    <div className="flex flex-col items-center" style={{ minWidth: cardWidth + 32 }}>
      <div
        className="text-[10px] font-bold uppercase tracking-widest mb-4 text-center"
        style={{ color: isWide && !isThird ? 'oklch(0.72 0.22 145 / 0.8)' : 'oklch(0.52 0.01 255)' }}
      >
        {label}
      </div>
      <div className="flex flex-col items-center justify-center flex-1" style={{ gap }}>
        {matches.map(m => (
          <MatchCard key={m.id} match={m} isWide={isWide} isThird={isThird} />
        ))}
      </div>
    </div>
  )
}

function RoundSeparator() {
  return (
    <div className="self-stretch flex items-center" style={{ width: 24, flexShrink: 0 }}>
      <div className="w-full" style={{ height: 1, background: 'oklch(0.20 0.01 255)' }} />
    </div>
  )
}

export function BracketView({ matches }: Props) {
  const { byRound, thirdPlace, theFinal } = useMemo(() => {
    const rounds: Record<string, Match[]> = { r32: [], r16: [], qf: [], sf: [] }

    // Los partidos con stage='final' en la DB pueden ser tanto la final como
    // el partido por el tercer puesto (ambos se sincronizaron con stage='final').
    // Los separamos por kickoff_at: el anterior = tercer puesto, el posterior = final.
    const finalMatches: Match[] = []

    matches.forEach(m => {
      if (m.stage === 'final') {
        finalMatches.push(m)
      } else if (m.stage in rounds) {
        rounds[m.stage].push(m)
      }
    })

    // Sort by kickoff
    Object.values(rounds).forEach(arr => arr.sort((a, b) => a.kickoff_at.localeCompare(b.kickoff_at)))
    finalMatches.sort((a, b) => a.kickoff_at.localeCompare(b.kickoff_at))

    // Si hay 2 partidos "final": el primero en el calendario es el tercer puesto
    let thirdPlace: Match | null = null
    let theFinal: Match | null = null

    if (finalMatches.length === 2) {
      thirdPlace = finalMatches[0]
      theFinal = finalMatches[1]
    } else if (finalMatches.length === 1) {
      theFinal = finalMatches[0]
    }

    return { byRound: rounds, thirdPlace, theFinal }
  }, [matches])

  const hasKnockout = ROUND_ORDER.some(r => byRound[r].length > 0) || !!theFinal

  if (!hasKnockout) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-3" style={{ color: 'oklch(0.52 0.01 255)' }}>
        <span className="text-4xl">🏆</span>
        <p className="text-sm text-center max-w-xs">
          El cuadro eliminatorio estará disponible cuando avancen los grupos.
          <br />
          <span style={{ color: 'oklch(0.40 0.008 255)', fontSize: 12 }}>
            Fase de grupos: 11 jun – 2 jul · Ronda de 32: 3 jul
          </span>
        </p>
      </div>
    )
  }

  // Columnas visibles: solo las que tienen partidos
  const visibleRounds = ROUND_ORDER.filter(r => byRound[r].length > 0)

  return (
    <div className="space-y-6">
      <div className="overflow-x-auto pb-2">
        <div className="flex items-start gap-0" style={{ minWidth: 'max-content', paddingBottom: 8 }}>
          {visibleRounds.map((round, i) => (
            <div key={round} className="flex items-center">
              {i > 0 && <RoundSeparator />}
              <RoundColumn label={ROUND_LABELS[round]} matches={byRound[round]} />
            </div>
          ))}

          {/* Tercer puesto + Final en columnas separadas */}
          {thirdPlace && (
            <>
              <RoundSeparator />
              <RoundColumn label={ROUND_LABELS.third} matches={[thirdPlace]} isThird />
            </>
          )}

          {theFinal && (
            <>
              <RoundSeparator />
              <RoundColumn label={ROUND_LABELS.final} matches={[theFinal]} isWide />
            </>
          )}
        </div>
      </div>

      {/* Leyenda inferior */}
      {(thirdPlace || theFinal) && (
        <div className="flex items-center justify-center gap-6 text-[11px]" style={{ color: 'oklch(0.40 0.008 255)' }}>
          {thirdPlace && <span>🥉 Partido por el tercer puesto</span>}
          {theFinal && <span>🏆 Gran Final</span>}
        </div>
      )}
    </div>
  )
}
