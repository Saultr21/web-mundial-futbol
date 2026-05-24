'use client'
import { useState, useEffect, useMemo } from 'react'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import Link from 'next/link'
import type { Match } from '@/lib/types/app'
import type { PredictionWithProfile } from '@/app/(protected)/partidos/[id]/page'
import { getFlagUrl, getTeamInitials } from '@/lib/utils/flags'
import { MatchPredictionForm } from './MatchPredictionForm'
import { PredictionsViewer } from './PredictionsViewer'

interface Props {
  match: Match
  predictions: PredictionWithProfile[]
  myPrediction: PredictionWithProfile | null
  userId: string
}

function TeamFlag({ team, size = 40 }: { team: string; size?: number }) {
  const url = getFlagUrl(team)
  const initials = getTeamInitials(team)
  const [errored, setErrored] = useState(false)

  if (!url || errored) {
    return (
      <span
        className="inline-flex items-center justify-center font-bold rounded"
        style={{
          width: size * 1.4,
          height: size,
          background: 'oklch(0.20 0.01 255)',
          color: 'oklch(0.72 0.22 145)',
          fontSize: size * 0.32,
          letterSpacing: '0.04em',
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
      width={size * 1.4}
      height={size}
      className="rounded object-cover shadow-md"
      onError={() => setErrored(true)}
      style={{ width: size * 1.4, height: size }}
    />
  )
}

function useCountdown(kickoffAt: string) {
  const [now, setNow] = useState(() => new Date())

  useEffect(() => {
    const iv = setInterval(() => setNow(new Date()), 1000)
    return () => clearInterval(iv)
  }, [])

  const kickoff = useMemo(() => new Date(kickoffAt), [kickoffAt])
  const msLeft = kickoff.getTime() - now.getTime()

  const isLocked = msLeft <= 0

  const countdown = useMemo(() => {
    if (msLeft <= 0) return null
    const totalSec = Math.floor(msLeft / 1000)
    const d = Math.floor(totalSec / 86400)
    const h = Math.floor((totalSec % 86400) / 3600)
    const m = Math.floor((totalSec % 3600) / 60)
    const s = totalSec % 60

    if (d > 0) return `${d}d ${h}h ${m}m`
    if (h > 0) return `${h}h ${m}m ${s}s`
    return `${m}m ${s}s`
  }, [msLeft])

  const isUrgent = msLeft > 0 && msLeft < 60 * 60 * 1000 // < 1h

  return { isLocked, countdown, isUrgent }
}

export function MatchDetailClient({ match, predictions, myPrediction, userId }: Props) {
  const [tab, setTab] = useState<'mine' | 'community'>('mine')
  const { isLocked, countdown, isUrgent } = useCountdown(match.kickoff_at)

  const isStatusLocked = match.status !== 'scheduled'
  const fullyLocked = isLocked || isStatusLocked
  const isFinished = match.status === 'finished'

  const kickoffFormatted = format(new Date(match.kickoff_at), "EEEE d 'de' MMMM · HH:mm 'UTC'", { locale: es })

  const stageLabel: Record<string, string> = {
    group: match.group_name ? `Grupo ${match.group_name}` : 'Fase de grupos',
    r16: 'Octavos de Final',
    qf: 'Cuartos de Final',
    sf: 'Semifinal',
    final: 'Gran Final',
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Back */}
      <Link
        href="/partidos"
        className="inline-flex items-center gap-1.5 text-xs transition-colors duration-150"
        style={{ color: 'oklch(0.52 0.01 255)' }}
        onMouseEnter={e => { e.currentTarget.style.color = 'oklch(0.72 0.22 145)' }}
        onMouseLeave={e => { e.currentTarget.style.color = 'oklch(0.52 0.01 255)' }}
      >
        ← Volver a partidos
      </Link>

      {/* Match header */}
      <div
        className="rounded-2xl overflow-hidden"
        style={{
          background: 'oklch(0.11 0.008 255)',
          border: '1px solid oklch(0.20 0.01 255)',
        }}
      >
        {/* Stage + status bar */}
        <div
          className="flex items-center justify-between px-5 py-2.5"
          style={{
            background: 'oklch(0.09 0.007 255)',
            borderBottom: '1px solid oklch(0.16 0.01 255)',
          }}
        >
          <span className="text-xs uppercase tracking-widest font-medium" style={{ color: 'oklch(0.52 0.01 255)' }}>
            {stageLabel[match.stage] ?? match.stage}
          </span>
          <StatusPill status={match.status} />
        </div>

        {/* Teams + score */}
        <div className="px-5 py-8">
          <div className="flex items-center justify-between gap-4">
            {/* Home */}
            <div className="flex flex-col items-center gap-2 flex-1 min-w-0">
              <TeamFlag team={match.home_team} size={44} />
              <span
                className="text-sm font-semibold text-center leading-tight"
                style={{ color: 'oklch(0.93 0.005 255)' }}
              >
                {match.home_team}
              </span>
            </div>

            {/* Central */}
            <div className="flex flex-col items-center gap-1 shrink-0">
              {isFinished ? (
                <span
                  className="text-4xl font-bold font-mono tracking-widest"
                  style={{ color: 'oklch(0.93 0.005 255)' }}
                >
                  {match.home_score} – {match.away_score}
                </span>
              ) : match.status === 'live' ? (
                <span className="text-4xl font-bold font-mono" style={{ color: 'oklch(0.72 0.22 25)' }}>
                  {match.home_score ?? 0} – {match.away_score ?? 0}
                </span>
              ) : (
                <span className="text-2xl font-mono font-bold" style={{ color: 'oklch(0.72 0.22 145)' }}>
                  vs
                </span>
              )}
              {/* Kickoff time */}
              <span className="text-[11px] capitalize text-center mt-1" style={{ color: 'oklch(0.40 0.008 255)' }}>
                {kickoffFormatted}
              </span>
              {/* Countdown */}
              {!fullyLocked && countdown && (
                <div
                  className="mt-2 px-3 py-1 rounded-full text-xs font-mono font-bold"
                  style={{
                    background: isUrgent ? 'oklch(0.72 0.22 25 / 0.12)' : 'oklch(0.72 0.22 145 / 0.10)',
                    color: isUrgent ? 'oklch(0.72 0.22 25)' : 'oklch(0.72 0.22 145)',
                    border: `1px solid ${isUrgent ? 'oklch(0.72 0.22 25 / 0.3)' : 'oklch(0.72 0.22 145 / 0.2)'}`,
                  }}
                >
                  ⏱ {countdown}
                </div>
              )}
              {fullyLocked && !isFinished && match.status !== 'live' && (
                <div
                  className="mt-2 px-3 py-1 rounded-full text-xs font-medium"
                  style={{
                    background: 'oklch(0.14 0.008 255)',
                    color: 'oklch(0.52 0.01 255)',
                    border: '1px solid oklch(0.20 0.01 255)',
                  }}
                >
                  🔒 Predicciones cerradas
                </div>
              )}
            </div>

            {/* Away */}
            <div className="flex flex-col items-center gap-2 flex-1 min-w-0">
              <TeamFlag team={match.away_team} size={44} />
              <span
                className="text-sm font-semibold text-center leading-tight"
                style={{ color: 'oklch(0.93 0.005 255)' }}
              >
                {match.away_team}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div
        className="flex rounded-xl overflow-hidden"
        style={{ border: '1px solid oklch(0.20 0.01 255)', background: 'oklch(0.09 0.007 255)' }}
      >
        {([
          { id: 'mine', label: 'Mi predicción' },
          { id: 'community', label: `Comunidad (${predictions.length})` },
        ] as const).map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className="flex-1 py-2.5 text-sm font-medium transition-all duration-150 cursor-pointer"
            style={{
              background: tab === t.id ? 'oklch(0.14 0.01 255)' : 'transparent',
              color: tab === t.id ? 'oklch(0.93 0.005 255)' : 'oklch(0.52 0.01 255)',
              borderBottom: tab === t.id ? '2px solid oklch(0.72 0.22 145)' : '2px solid transparent',
            }}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {tab === 'mine' && (
        <MatchPredictionForm
          match={match}
          existing={myPrediction}
          userId={userId}
          isLocked={fullyLocked}
        />
      )}

      {tab === 'community' && (
        <PredictionsViewer
          predictions={predictions}
          myUserId={userId}
          isMatchStarted={fullyLocked}
          isFinished={isFinished}
          match={match}
        />
      )}
    </div>
  )
}

function StatusPill({ status }: { status: string }) {
  if (status === 'live') {
    return (
      <span
        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider"
        style={{ background: 'oklch(0.65 0.22 25 / 0.15)', color: 'oklch(0.75 0.22 25)' }}
      >
        <span className="inline-block w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: 'oklch(0.75 0.22 25)' }} />
        En vivo
      </span>
    )
  }
  if (status === 'finished') {
    return (
      <span
        className="px-2.5 py-1 rounded-full text-xs font-medium uppercase tracking-wider"
        style={{ background: 'oklch(0.16 0.008 255)', color: 'oklch(0.52 0.01 255)' }}
      >
        Finalizado
      </span>
    )
  }
  return (
    <span
      className="px-2.5 py-1 rounded-full text-xs font-medium uppercase tracking-wider"
      style={{ background: 'oklch(0.72 0.22 145 / 0.10)', color: 'oklch(0.72 0.22 145)' }}
    >
      Programado
    </span>
  )
}
