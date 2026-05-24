'use client'
import { useState } from 'react'
import type { Match } from '@/lib/types/app'
import type { PredictionWithProfile } from '@/app/(protected)/partidos/[id]/page'

interface Props {
  predictions: PredictionWithProfile[]
  myUserId: string
  isMatchStarted: boolean
  isFinished: boolean
  match: Match
}

function Avatar({ displayName, avatarUrl, size = 32 }: { displayName: string; avatarUrl: string | null; size?: number }) {
  const [errored, setErrored] = useState(false)
  const initials = displayName
    .split(' ')
    .map(w => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)

  if (avatarUrl && !errored) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={avatarUrl}
        alt={displayName}
        width={size}
        height={size}
        className="rounded-full object-cover shrink-0"
        style={{ width: size, height: size }}
        onError={() => setErrored(true)}
      />
    )
  }

  return (
    <span
      className="inline-flex items-center justify-center rounded-full font-bold shrink-0 text-xs"
      style={{
        width: size,
        height: size,
        background: stringToColor(displayName),
        color: 'oklch(0.07 0.006 255)',
      }}
    >
      {initials}
    </span>
  )
}

function stringToColor(str: string): string {
  // Deterministic hue from string
  let hash = 0
  for (let i = 0; i < str.length; i++) hash = str.charCodeAt(i) + ((hash << 5) - hash)
  const hue = Math.abs(hash % 360)
  // Keep in green/teal range for the app's aesthetic
  const mapped = (hue % 120) + 80 // 80–200
  return `oklch(0.65 0.18 ${mapped})`
}

function ResultBadge({ predHome, predAway, actualHome, actualAway, isFinished }: {
  predHome: number
  predAway: number
  actualHome: number | null
  actualAway: number | null
  isFinished: boolean
}) {
  if (!isFinished || actualHome === null || actualAway === null) return null

  const exactScore = predHome === actualHome && predAway === actualAway
  const correctResult =
    (predHome > predAway && actualHome > actualAway) ||
    (predHome < predAway && actualHome < actualAway) ||
    (predHome === predAway && actualHome === actualAway)

  if (exactScore) {
    return (
      <span
        className="text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider"
        style={{ background: 'oklch(0.72 0.22 145 / 0.15)', color: 'oklch(0.72 0.22 145)', border: '1px solid oklch(0.72 0.22 145 / 0.3)' }}
      >
        Exacto ✦
      </span>
    )
  }
  if (correctResult) {
    return (
      <span
        className="text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider"
        style={{ background: 'oklch(0.65 0.18 200 / 0.15)', color: 'oklch(0.65 0.18 200)', border: '1px solid oklch(0.65 0.18 200 / 0.3)' }}
      >
        Resultado ✓
      </span>
    )
  }
  return (
    <span
      className="text-[10px] px-2 py-0.5 rounded-full uppercase tracking-wider"
      style={{ background: 'oklch(0.14 0.008 255)', color: 'oklch(0.40 0.008 255)' }}
    >
      Fallo ✗
    </span>
  )
}

export function PredictionsViewer({ predictions, myUserId, isMatchStarted, isFinished, match }: Props) {
  const [sortBy, setSortBy] = useState<'points' | 'submitted'>('points')

  // Antes del inicio: no revelar predicciones
  if (!isMatchStarted) {
    return (
      <div
        className="flex flex-col items-center justify-center py-14 gap-3 rounded-xl text-center"
        style={{
          background: 'oklch(0.09 0.007 255)',
          border: '1px solid oklch(0.16 0.01 255)',
        }}
      >
        <span className="text-4xl">🔒</span>
        <p className="text-base font-semibold" style={{ color: 'oklch(0.80 0.005 255)' }}>
          {predictions.length} {predictions.length === 1 ? 'participante ha predicho' : 'participantes han predicho'}
        </p>
        <p className="text-sm max-w-xs" style={{ color: 'oklch(0.52 0.01 255)' }}>
          Las predicciones se revelan cuando empiece el partido para que nadie copie.
        </p>
      </div>
    )
  }

  if (predictions.length === 0) {
    return (
      <div
        className="flex flex-col items-center justify-center py-14 gap-2 rounded-xl"
        style={{
          background: 'oklch(0.09 0.007 255)',
          border: '1px solid oklch(0.16 0.01 255)',
        }}
      >
        <span className="text-3xl opacity-40">📭</span>
        <p className="text-sm" style={{ color: 'oklch(0.52 0.01 255)' }}>
          Nadie ha predicho este partido aún.
        </p>
      </div>
    )
  }

  // Ordenar
  const sorted = [...predictions].sort((a, b) => {
    if (sortBy === 'points') return (b.points_earned ?? 0) - (a.points_earned ?? 0)
    return new Date(a.submitted_at).getTime() - new Date(b.submitted_at).getTime()
  })

  // Mover la predicción propia al inicio
  const mine = sorted.find(p => p.user_id === myUserId)
  const others = sorted.filter(p => p.user_id !== myUserId)
  const ordered = mine ? [mine, ...others] : others

  return (
    <div className="space-y-3">
      {/* Controls */}
      <div className="flex items-center justify-between">
        <span className="text-xs" style={{ color: 'oklch(0.52 0.01 255)' }}>
          {predictions.length} {predictions.length === 1 ? 'predicción' : 'predicciones'}
        </span>
        {isFinished && (
          <div className="flex gap-1">
            {(['points', 'submitted'] as const).map(s => (
              <button
                key={s}
                onClick={() => setSortBy(s)}
                className="text-xs px-2.5 py-1 rounded-md transition-colors duration-150 cursor-pointer"
                style={{
                  background: sortBy === s ? 'oklch(0.72 0.22 145 / 0.12)' : 'transparent',
                  color: sortBy === s ? 'oklch(0.72 0.22 145)' : 'oklch(0.52 0.01 255)',
                  border: `1px solid ${sortBy === s ? 'oklch(0.72 0.22 145 / 0.3)' : 'oklch(0.20 0.01 255)'}`,
                }}
              >
                {s === 'points' ? 'Por puntos' : 'Por orden'}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Cards */}
      <div className="space-y-2">
        {ordered.map((pred, i) => {
          const isMe = pred.user_id === myUserId
          const name = pred.profiles?.display_name ?? 'Usuario'
          const avatarUrl = pred.profiles?.avatar_url ?? null

          return (
            <div
              key={pred.id}
              className="rounded-xl overflow-hidden transition-colors duration-150"
              style={{
                background: isMe ? 'oklch(0.72 0.22 145 / 0.05)' : 'oklch(0.09 0.007 255)',
                border: isMe
                  ? '1px solid oklch(0.72 0.22 145 / 0.35)'
                  : '1px solid oklch(0.16 0.01 255)',
              }}
            >
              {/* Header row */}
              <div className="flex items-center gap-3 px-4 py-3">
                {/* Rank */}
                {isFinished && (
                  <span
                    className="text-xs font-mono w-5 text-center shrink-0"
                    style={{ color: i === 0 ? 'oklch(0.85 0.18 85)' : 'oklch(0.40 0.008 255)' }}
                  >
                    {i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `${i + 1}`}
                  </span>
                )}

                {/* Avatar + name */}
                <Avatar displayName={name} avatarUrl={avatarUrl} size={30} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span
                      className="text-sm font-semibold truncate"
                      style={{ color: isMe ? 'oklch(0.72 0.22 145)' : 'oklch(0.88 0.005 255)' }}
                    >
                      {name}
                      {isMe && <span className="text-xs font-normal ml-1" style={{ color: 'oklch(0.72 0.22 145 / 0.7)' }}>(tú)</span>}
                    </span>
                    <ResultBadge
                      predHome={pred.pred_home}
                      predAway={pred.pred_away}
                      actualHome={match.home_score}
                      actualAway={match.away_score}
                      isFinished={isFinished}
                    />
                  </div>
                </div>

                {/* Score + points */}
                <div className="flex items-center gap-3 shrink-0">
                  <span
                    className="text-base font-bold font-mono"
                    style={{ color: 'oklch(0.93 0.005 255)' }}
                  >
                    {pred.pred_home} – {pred.pred_away}
                  </span>
                  {isFinished && (
                    <span
                      className="text-sm font-bold font-mono min-w-[36px] text-right"
                      style={{ color: pred.points_earned > 0 ? 'oklch(0.72 0.22 145)' : 'oklch(0.40 0.008 255)' }}
                    >
                      +{pred.points_earned}
                    </span>
                  )}
                </div>
              </div>

              {/* Scorers + extras (si los hay) */}
              {(pred.pred_scorers?.length > 0 || pred.pred_red_card !== null || pred.pred_most_fouls) && (
                <div
                  className="px-4 pb-3 flex flex-wrap gap-x-4 gap-y-1.5"
                  style={{ borderTop: '1px solid oklch(0.14 0.008 255)' }}
                >
                  {pred.pred_scorers?.length > 0 && (
                    <div className="flex items-center gap-1.5 flex-wrap pt-2">
                      <span className="text-[10px] uppercase tracking-wider" style={{ color: 'oklch(0.40 0.008 255)' }}>⚽</span>
                      {pred.pred_scorers.map(s => (
                        <span
                          key={s}
                          className="text-[11px] px-1.5 py-0.5 rounded"
                          style={{
                            background: 'oklch(0.13 0.009 255)',
                            color: 'oklch(0.65 0.005 255)',
                          }}
                        >
                          {s}
                        </span>
                      ))}
                    </div>
                  )}
                  {pred.pred_red_card !== null && (
                    <div className="flex items-center gap-1 pt-2">
                      <span className="text-[10px] uppercase tracking-wider" style={{ color: 'oklch(0.40 0.008 255)' }}>Roja:</span>
                      <span className="text-[11px]" style={{ color: 'oklch(0.65 0.005 255)' }}>
                        {pred.pred_red_card ? 'Sí 🟥' : 'No'}
                      </span>
                    </div>
                  )}
                  {pred.pred_most_fouls && (
                    <div className="flex items-center gap-1 pt-2">
                      <span className="text-[10px] uppercase tracking-wider" style={{ color: 'oklch(0.40 0.008 255)' }}>Faltas:</span>
                      <span className="text-[11px]" style={{ color: 'oklch(0.65 0.005 255)' }}>{pred.pred_most_fouls}</span>
                    </div>
                  )}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
