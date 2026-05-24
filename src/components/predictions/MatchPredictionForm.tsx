'use client'
import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { Match, Prediction } from '@/lib/types/app'
import { z } from 'zod'

const PredictionSchema = z.object({
  pred_home: z.number().min(0).max(20),
  pred_away: z.number().min(0).max(20),
  pred_scorers: z.array(z.string()),
  pred_red_card: z.boolean().nullable(),
  pred_most_fouls: z.string().nullable(),
})

interface Props {
  match: Match
  existing: Prediction | null
  userId: string
  isLocked: boolean
}

// ── Componente interno: selector de goles ──────────────────────────────────

function ScoreButton({
  value, onChange,
}: {
  value: number
  onChange: (v: number) => void
}) {
  return (
    <div className="flex items-center gap-2">
      <button
        type="button"
        onClick={() => onChange(Math.max(0, value - 1))}
        className="w-8 h-8 rounded-lg flex items-center justify-center text-lg font-bold transition-all duration-150 cursor-pointer"
        style={{
          background: 'oklch(0.16 0.01 255)',
          color: 'oklch(0.60 0.01 255)',
          border: '1px solid oklch(0.22 0.01 255)',
        }}
        onMouseEnter={e => { e.currentTarget.style.borderColor = 'oklch(0.72 0.22 145 / 0.5)'; e.currentTarget.style.color = 'oklch(0.93 0.005 255)' }}
        onMouseLeave={e => { e.currentTarget.style.borderColor = 'oklch(0.22 0.01 255)'; e.currentTarget.style.color = 'oklch(0.60 0.01 255)' }}
      >
        −
      </button>
      <span
        className="text-2xl font-bold font-mono w-10 text-center"
        style={{ color: 'oklch(0.93 0.005 255)' }}
      >
        {value}
      </span>
      <button
        type="button"
        onClick={() => onChange(Math.min(20, value + 1))}
        className="w-8 h-8 rounded-lg flex items-center justify-center text-lg font-bold transition-all duration-150 cursor-pointer"
        style={{
          background: 'oklch(0.16 0.01 255)',
          color: 'oklch(0.60 0.01 255)',
          border: '1px solid oklch(0.22 0.01 255)',
        }}
        onMouseEnter={e => { e.currentTarget.style.borderColor = 'oklch(0.72 0.22 145 / 0.5)'; e.currentTarget.style.color = 'oklch(0.93 0.005 255)' }}
        onMouseLeave={e => { e.currentTarget.style.borderColor = 'oklch(0.22 0.01 255)'; e.currentTarget.style.color = 'oklch(0.60 0.01 255)' }}
      >
        +
      </button>
    </div>
  )
}

// ── Componente interno: selector de jugadores ──────────────────────────────

function PlayerPicker({
  label,
  players,
  selected,
  onAdd,
  onRemove,
  singleMode = false,
}: {
  label: string
  players: string[]
  selected: string[]
  onAdd: (name: string) => void
  onRemove: (name: string) => void
  singleMode?: boolean
}) {
  const [query, setQuery] = useState('')
  const [focused, setFocused] = useState(false)

  const suggestions = query.length > 0
    ? players.filter(p => p.toLowerCase().includes(query.toLowerCase()) && !selected.includes(p)).slice(0, 8)
    : []

  const hasPlayers = players.length > 0

  function handleSelect(name: string) {
    if (singleMode) {
      // Replace instead of add
      if (selected.length > 0) onRemove(selected[0])
      onAdd(name)
    } else {
      onAdd(name)
    }
    setQuery('')
    setFocused(false)
  }

  return (
    <div className="space-y-2">
      <label className="text-xs font-medium uppercase tracking-widest" style={{ color: 'oklch(0.52 0.01 255)' }}>
        {label}
      </label>

      {/* Selected chips */}
      {selected.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {selected.map(name => (
            <span
              key={name}
              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-medium"
              style={{
                background: 'oklch(0.72 0.22 145 / 0.12)',
                color: 'oklch(0.72 0.22 145)',
                border: '1px solid oklch(0.72 0.22 145 / 0.25)',
              }}
            >
              {name}
              <button
                type="button"
                onClick={() => onRemove(name)}
                className="cursor-pointer opacity-60 hover:opacity-100 transition-opacity"
                aria-label={`Eliminar ${name}`}
              >
                ×
              </button>
            </span>
          ))}
        </div>
      )}

      {/* Input */}
      {(!singleMode || selected.length === 0) && (
        <div className="relative">
          <input
            type="text"
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder={hasPlayers ? 'Buscar jugador...' : 'Nombre del jugador'}
            className="w-full rounded-lg px-3 py-2 text-sm outline-none transition-colors duration-150"
            style={{
              background: 'oklch(0.09 0.007 255)',
              border: '1px solid oklch(0.20 0.01 255)',
              color: 'oklch(0.93 0.005 255)',
            }}
            onFocus={e => { e.currentTarget.style.borderColor = 'oklch(0.72 0.22 145)'; setFocused(true) }}
            onBlur={e => { e.currentTarget.style.borderColor = 'oklch(0.20 0.01 255)'; setTimeout(() => setFocused(false), 150) }}
            onKeyDown={e => {
              if (e.key === 'Enter' && query.trim()) {
                e.preventDefault()
                if (suggestions.length > 0) {
                  handleSelect(suggestions[0])
                } else {
                  handleSelect(query.trim())
                }
              }
            }}
          />
          {/* Dropdown suggestions */}
          {focused && suggestions.length > 0 && (
            <div
              className="absolute top-full left-0 right-0 mt-1 rounded-lg overflow-hidden z-10"
              style={{
                background: 'oklch(0.13 0.009 255)',
                border: '1px solid oklch(0.22 0.01 255)',
                boxShadow: '0 8px 24px oklch(0 0 0 / 0.5)',
              }}
            >
              {suggestions.map(name => (
                <button
                  key={name}
                  type="button"
                  onMouseDown={() => handleSelect(name)}
                  className="w-full text-left px-3 py-2 text-sm transition-colors duration-100 cursor-pointer"
                  style={{ color: 'oklch(0.80 0.005 255)' }}
                  onMouseEnter={e => { e.currentTarget.style.background = 'oklch(0.72 0.22 145 / 0.10)'; e.currentTarget.style.color = 'oklch(0.72 0.22 145)' }}
                  onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'oklch(0.80 0.005 255)' }}
                >
                  {name}
                </button>
              ))}
            </div>
          )}
          {/* Free text hint when no player data */}
          {!hasPlayers && query.trim() && (
            <button
              type="button"
              className="absolute right-2 top-1/2 -translate-y-1/2 text-xs px-2 py-0.5 rounded cursor-pointer transition-opacity"
              style={{ background: 'oklch(0.72 0.22 145 / 0.15)', color: 'oklch(0.72 0.22 145)' }}
              onMouseDown={() => { if (query.trim()) { handleSelect(query.trim()); } }}
            >
              Añadir ↵
            </button>
          )}
        </div>
      )}

      {/* Team player quick-chips */}
      {hasPlayers && !focused && (
        <div className="flex flex-wrap gap-1 mt-1">
          {players
            .filter(p => !selected.includes(p))
            .map(name => (
              <button
                key={name}
                type="button"
                onClick={() => handleSelect(name)}
                className="text-[10px] px-1.5 py-0.5 rounded transition-all duration-100 cursor-pointer"
                style={{
                  background: 'oklch(0.14 0.008 255)',
                  color: 'oklch(0.50 0.01 255)',
                  border: '1px solid oklch(0.18 0.01 255)',
                }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = 'oklch(0.72 0.22 145 / 0.4)'; e.currentTarget.style.color = 'oklch(0.72 0.22 145)' }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = 'oklch(0.18 0.01 255)'; e.currentTarget.style.color = 'oklch(0.50 0.01 255)' }}
              >
                {name}
              </button>
            ))}
        </div>
      )}
    </div>
  )
}

// ── Vista de predicción sellada ────────────────────────────────────────────

function LockedPredictionView({ prediction, match }: { prediction: Prediction | null; match: Match }) {
  if (!prediction) {
    return (
      <div
        className="flex flex-col items-center justify-center py-16 gap-4 rounded-2xl text-center"
        style={{
          background: 'oklch(0.09 0.007 255)',
          border: '2px dashed oklch(0.20 0.01 255)',
        }}
      >
        <span style={{ fontSize: 40, opacity: 0.25 }}>🔒</span>
        <div className="space-y-1">
          <p className="text-sm font-semibold" style={{ color: 'oklch(0.50 0.01 255)' }}>
            Sin predicción registrada
          </p>
          <p className="text-xs" style={{ color: 'oklch(0.35 0.008 255)' }}>
            No enviaste una predicción antes del inicio del partido.
          </p>
        </div>
      </div>
    )
  }

  const isFinished = match.status === 'finished'
  const isLive = match.status === 'live'
  const pts = prediction.points_earned ?? 0

  // Determinar resultado relativo al marcador real
  const resultTag = (() => {
    if (!isFinished || match.home_score === null || match.away_score === null) return null
    const exact = prediction.pred_home === match.home_score && prediction.pred_away === match.away_score
    const correct =
      (prediction.pred_home > prediction.pred_away && match.home_score > match.away_score) ||
      (prediction.pred_home < prediction.pred_away && match.home_score < match.away_score) ||
      (prediction.pred_home === prediction.pred_away && match.home_score === match.away_score)
    if (exact) return 'exact'
    if (correct) return 'result'
    return 'miss'
  })()

  const accentColor = resultTag === 'exact'
    ? 'oklch(0.72 0.22 145)'
    : resultTag === 'result'
    ? 'oklch(0.65 0.18 200)'
    : isFinished
    ? 'oklch(0.65 0.22 25)'
    : 'oklch(0.72 0.22 145)'

  return (
    <div
      className="rounded-2xl overflow-hidden"
      style={{
        background: 'oklch(0.09 0.007 255)',
        border: `1px solid ${accentColor}33`,
        boxShadow: `0 0 30px ${accentColor}0d`,
      }}
    >
      {/* ── Banner de estado ── */}
      <div
        className="flex items-center justify-between px-4 py-2.5"
        style={{
          background: `${accentColor}12`,
          borderBottom: `1px solid ${accentColor}22`,
        }}
      >
        <div className="flex items-center gap-2">
          <span
            className="inline-flex items-center justify-center w-5 h-5 rounded-full text-xs font-bold"
            style={{ background: `${accentColor}25`, color: accentColor }}
          >
            {isLive ? '●' : '✓'}
          </span>
          <span className="text-xs font-bold uppercase tracking-widest" style={{ color: accentColor }}>
            {isLive ? 'Predicción enviada · En curso' : isFinished ? 'Predicción cerrada' : 'Predicción enviada'}
          </span>
        </div>

        {/* Puntos si terminó */}
        {isFinished && (
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] uppercase tracking-wider" style={{ color: 'oklch(0.45 0.008 255)' }}>pts</span>
            <span
              className="text-xl font-bold font-mono leading-none"
              style={{ color: pts > 0 ? accentColor : 'oklch(0.40 0.008 255)' }}
            >
              {pts > 0 ? `+${pts}` : '0'}
            </span>
          </div>
        )}
      </div>

      {/* ── Marcador predicho ── */}
      <div className="px-5 py-6">
        <p
          className="text-[9px] uppercase tracking-[0.2em] text-center mb-5 font-medium"
          style={{ color: 'oklch(0.40 0.008 255)' }}
        >
          Tu resultado predicho
        </p>

        <div className="flex items-center justify-between gap-3">
          {/* Local */}
          <div className="flex flex-col items-center gap-1.5 flex-1 min-w-0">
            <span className="text-xs text-center font-medium leading-tight" style={{ color: 'oklch(0.60 0.005 255)' }}>
              {match.home_team}
            </span>
          </div>

          {/* Marcador */}
          <div
            className="flex items-center gap-0 shrink-0 rounded-xl overflow-hidden"
            style={{
              border: `1px solid ${accentColor}35`,
              background: 'oklch(0.12 0.01 255)',
            }}
          >
            <span
              className="px-5 py-3 font-mono font-black leading-none"
              style={{
                fontSize: 36,
                color: 'oklch(0.96 0.005 255)',
                fontFamily: 'var(--font-bebas), Bebas Neue, monospace',
                letterSpacing: '0.04em',
                borderRight: `1px solid ${accentColor}20`,
              }}
            >
              {prediction.pred_home}
            </span>
            <span
              className="px-3 font-mono font-bold"
              style={{ fontSize: 20, color: 'oklch(0.30 0.008 255)' }}
            >
              –
            </span>
            <span
              className="px-5 py-3 font-mono font-black leading-none"
              style={{
                fontSize: 36,
                color: 'oklch(0.96 0.005 255)',
                fontFamily: 'var(--font-bebas), Bebas Neue, monospace',
                letterSpacing: '0.04em',
                borderLeft: `1px solid ${accentColor}20`,
              }}
            >
              {prediction.pred_away}
            </span>
          </div>

          {/* Visitante */}
          <div className="flex flex-col items-center gap-1.5 flex-1 min-w-0">
            <span className="text-xs text-center font-medium leading-tight" style={{ color: 'oklch(0.60 0.005 255)' }}>
              {match.away_team}
            </span>
          </div>
        </div>

        {/* Badge resultado si terminó */}
        {resultTag && (
          <div className="flex justify-center mt-4">
            <span
              className="text-xs font-bold px-3 py-1 rounded-full uppercase tracking-widest"
              style={{
                background: `${accentColor}15`,
                color: accentColor,
                border: `1px solid ${accentColor}30`,
              }}
            >
              {resultTag === 'exact' ? '✦ Marcador exacto' : resultTag === 'result' ? '✓ Resultado correcto' : '✗ Resultado fallado'}
            </span>
          </div>
        )}
      </div>

      {/* ── Separador de ticket ── */}
      <div className="flex items-center gap-0 px-0 relative">
        <div
          className="w-4 h-4 rounded-full shrink-0"
          style={{ background: 'oklch(0.07 0.006 255)', marginLeft: -8, border: '1px solid oklch(0.16 0.01 255)' }}
        />
        <div
          className="flex-1"
          style={{
            borderTop: '1px dashed oklch(0.20 0.01 255)',
          }}
        />
        <div
          className="w-4 h-4 rounded-full shrink-0"
          style={{ background: 'oklch(0.07 0.006 255)', marginRight: -8, border: '1px solid oklch(0.16 0.01 255)' }}
        />
      </div>

      {/* ── Detalles adicionales ── */}
      <div className="px-5 pt-4 pb-5 space-y-4">
        {/* Goleadores */}
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span style={{ fontSize: 13 }}>⚽</span>
            <span className="text-[10px] uppercase tracking-widest font-bold" style={{ color: 'oklch(0.45 0.008 255)' }}>
              Goleadores
            </span>
          </div>
          {prediction.pred_scorers && prediction.pred_scorers.length > 0 ? (
            <div className="flex flex-wrap gap-1.5">
              {prediction.pred_scorers.map(s => (
                <span
                  key={s}
                  className="text-xs px-2.5 py-1 rounded-lg font-medium"
                  style={{
                    background: `${accentColor}12`,
                    color: 'oklch(0.82 0.005 255)',
                    border: `1px solid ${accentColor}25`,
                  }}
                >
                  {s}
                </span>
              ))}
            </div>
          ) : (
            <span className="text-xs italic" style={{ color: 'oklch(0.35 0.008 255)' }}>No predichos</span>
          )}
        </div>

        {/* Tarjeta roja + más faltas */}
        <div className="grid grid-cols-2 gap-3">
          <div
            className="rounded-lg px-3 py-2.5"
            style={{
              background: prediction.pred_red_card === true
                ? 'oklch(0.65 0.22 25 / 0.10)'
                : 'oklch(0.11 0.008 255)',
              border: prediction.pred_red_card === true
                ? '1px solid oklch(0.65 0.22 25 / 0.30)'
                : '1px solid oklch(0.18 0.01 255)',
            }}
          >
            <p className="text-[9px] uppercase tracking-widest mb-1" style={{ color: 'oklch(0.40 0.008 255)' }}>
              🟥 Tarjeta roja
            </p>
            <p
              className="text-sm font-bold"
              style={{
                color: prediction.pred_red_card === true
                  ? 'oklch(0.75 0.22 25)'
                  : prediction.pred_red_card === false
                  ? 'oklch(0.72 0.22 145)'
                  : 'oklch(0.50 0.01 255)',
              }}
            >
              {prediction.pred_red_card === null ? '¿?' : prediction.pred_red_card ? 'Sí habrá' : 'No habrá'}
            </p>
          </div>

          <div
            className="rounded-lg px-3 py-2.5"
            style={{
              background: prediction.pred_most_fouls ? 'oklch(0.65 0.18 200 / 0.08)' : 'oklch(0.11 0.008 255)',
              border: prediction.pred_most_fouls ? '1px solid oklch(0.65 0.18 200 / 0.25)' : '1px solid oklch(0.18 0.01 255)',
            }}
          >
            <p className="text-[9px] uppercase tracking-widest mb-1" style={{ color: 'oklch(0.40 0.008 255)' }}>
              🦵 Más faltas
            </p>
            <p
              className="text-sm font-bold truncate"
              style={{ color: prediction.pred_most_fouls ? 'oklch(0.82 0.005 255)' : 'oklch(0.35 0.008 255)' }}
            >
              {prediction.pred_most_fouls ?? 'No predicho'}
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

// ── Componente principal ───────────────────────────────────────────────────

export function MatchPredictionForm({ match, existing, userId, isLocked }: Props) {
  const supabase = createClient()

  const allPlayers = [...(match.home_players ?? []), ...(match.away_players ?? [])]
  const hasPlayers = allPlayers.length > 0

  const [predHome, setPredHome] = useState(existing?.pred_home ?? 0)
  const [predAway, setPredAway] = useState(existing?.pred_away ?? 0)
  const [scorers, setScorers] = useState<string[]>(existing?.pred_scorers ?? [])
  const [redCard, setRedCard] = useState<boolean | null>(existing?.pred_red_card ?? null)
  const [mostFouls, setMostFouls] = useState<string[]>(existing?.pred_most_fouls ? [existing.pred_most_fouls] : [])
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  if (isLocked) {
    return <LockedPredictionView prediction={existing} match={match} />
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    if (isLocked) return
    setSaving(true)
    setError(null)
    setSuccess(false)

    const parsed = PredictionSchema.safeParse({
      pred_home: predHome,
      pred_away: predAway,
      pred_scorers: scorers,
      pred_red_card: redCard,
      pred_most_fouls: mostFouls[0] ?? null,
    })
    if (!parsed.success) {
      setError('Datos inválidos')
      setSaving(false)
      return
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error: dbError } = await (supabase.from('predictions') as any).upsert(
      { user_id: userId, match_id: match.id, ...parsed.data },
      { onConflict: 'user_id,match_id' }
    )

    if (dbError) {
      setError(dbError.message)
    } else {
      setSuccess(true)
      setTimeout(() => setSuccess(false), 4000)
    }
    setSaving(false)
  }

  const inputStyle = {
    background: 'oklch(0.09 0.007 255)',
    border: '1px solid oklch(0.20 0.01 255)',
    color: 'oklch(0.93 0.005 255)',
    borderRadius: '0.5rem',
    outline: 'none',
  } as React.CSSProperties

  return (
    <form onSubmit={submit} className="space-y-5">
      {/* Score picker */}
      <div
        className="rounded-xl p-5"
        style={{ background: 'oklch(0.09 0.007 255)', border: '1px solid oklch(0.16 0.01 255)' }}
      >
        <p className="text-xs uppercase tracking-widest mb-4 text-center" style={{ color: 'oklch(0.52 0.01 255)' }}>
          Resultado predicho
        </p>
        <div className="flex items-center justify-center gap-4">
          <div className="flex flex-col items-center gap-2 flex-1">
            <span className="text-xs text-center truncate w-full text-center" style={{ color: 'oklch(0.70 0.005 255)' }}>
              {match.home_team}
            </span>
            <ScoreButton value={predHome} onChange={setPredHome} />
          </div>
          <span className="text-2xl font-mono" style={{ color: 'oklch(0.30 0.008 255)' }}>–</span>
          <div className="flex flex-col items-center gap-2 flex-1">
            <span className="text-xs text-center truncate w-full text-center" style={{ color: 'oklch(0.70 0.005 255)' }}>
              {match.away_team}
            </span>
            <ScoreButton value={predAway} onChange={setPredAway} />
          </div>
        </div>
      </div>

      {/* Goleadores */}
      <div
        className="rounded-xl p-5 space-y-4"
        style={{ background: 'oklch(0.09 0.007 255)', border: '1px solid oklch(0.16 0.01 255)' }}
      >
        {hasPlayers ? (
          <div className="space-y-4">
            {/* Home scorers */}
            <PlayerPicker
              label={`Goleadores de ${match.home_team}`}
              players={match.home_players ?? []}
              selected={scorers.filter(s => (match.home_players ?? []).includes(s))}
              onAdd={name => setScorers(prev => [...prev, name])}
              onRemove={name => setScorers(prev => prev.filter(s => s !== name))}
            />
            {/* Away scorers */}
            <PlayerPicker
              label={`Goleadores de ${match.away_team}`}
              players={match.away_players ?? []}
              selected={scorers.filter(s => (match.away_players ?? []).includes(s))}
              onAdd={name => setScorers(prev => [...prev, name])}
              onRemove={name => setScorers(prev => prev.filter(s => s !== name))}
            />
          </div>
        ) : (
          <div className="space-y-2">
            <label className="text-xs font-medium uppercase tracking-widest" style={{ color: 'oklch(0.52 0.01 255)' }}>
              Goleadores
            </label>
            <input
              type="text"
              value={scorers.join(', ')}
              onChange={e => setScorers(e.target.value.split(',').map(s => s.trim()).filter(Boolean))}
              placeholder="Morata, Mbappe, Vinicius"
              className="w-full px-3 py-2 text-sm"
              style={inputStyle}
            />
            <p className="text-[11px]" style={{ color: 'oklch(0.40 0.008 255)' }}>
              Separados por coma. Sincroniza plantillas desde el panel admin para autocompletar.
            </p>
          </div>
        )}
      </div>

      {/* Tarjeta roja + más faltas */}
      <div
        className="rounded-xl p-5 space-y-4"
        style={{ background: 'oklch(0.09 0.007 255)', border: '1px solid oklch(0.16 0.01 255)' }}
      >
        {/* Red card */}
        <div className="space-y-2">
          <p className="text-xs font-medium uppercase tracking-widest" style={{ color: 'oklch(0.52 0.01 255)' }}>
            ¿Habrá tarjeta roja? <span style={{ color: 'oklch(0.40 0.008 255)', fontWeight: 400 }}>+4 pts si aciertas</span>
          </p>
          <div className="flex gap-2">
            {([true, false, null] as const).map(v => (
              <button
                key={String(v)}
                type="button"
                onClick={() => setRedCard(v)}
                className="flex-1 py-2 rounded-lg text-sm font-medium transition-all duration-150 cursor-pointer"
                style={{
                  background: redCard === v
                    ? v === true ? 'oklch(0.65 0.22 25 / 0.20)' : v === false ? 'oklch(0.72 0.22 145 / 0.15)' : 'oklch(0.22 0.01 255)'
                    : 'oklch(0.13 0.009 255)',
                  color: redCard === v
                    ? v === true ? 'oklch(0.75 0.22 25)' : v === false ? 'oklch(0.72 0.22 145)' : 'oklch(0.70 0.01 255)'
                    : 'oklch(0.50 0.01 255)',
                  border: `1px solid ${redCard === v
                    ? v === true ? 'oklch(0.65 0.22 25 / 0.4)' : v === false ? 'oklch(0.72 0.22 145 / 0.3)' : 'oklch(0.30 0.01 255)'
                    : 'oklch(0.18 0.01 255)'}`,
                }}
              >
                {v === null ? '¿?' : v ? '🟥 Sí' : '✅ No'}
              </button>
            ))}
          </div>
        </div>

        {/* Most fouls */}
        <PlayerPicker
          label={`Jugador con más faltas (+5 pts)`}
          players={allPlayers}
          selected={mostFouls}
          onAdd={name => setMostFouls([name])}
          onRemove={() => setMostFouls([])}
          singleMode
        />
      </div>

      {/* Feedback */}
      {error && (
        <p className="text-sm px-3 py-2 rounded-lg" style={{ background: 'oklch(0.65 0.22 25 / 0.1)', color: 'oklch(0.75 0.22 25)' }}>
          {error}
        </p>
      )}
      {success && (
        <p className="text-sm px-3 py-2 rounded-lg" style={{ background: 'oklch(0.72 0.22 145 / 0.1)', color: 'oklch(0.72 0.22 145)' }}>
          ✓ Predicción guardada correctamente
        </p>
      )}

      {/* Submit */}
      <button
        type="submit"
        disabled={saving}
        className="w-full py-3 rounded-xl text-sm font-bold tracking-wide transition-all duration-150 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
        style={{
          background: 'oklch(0.72 0.22 145)',
          color: 'oklch(0.07 0.006 255)',
        }}
        onMouseEnter={e => { if (!saving) e.currentTarget.style.background = 'oklch(0.65 0.22 145)' }}
        onMouseLeave={e => { e.currentTarget.style.background = 'oklch(0.72 0.22 145)' }}
      >
        {saving ? 'Guardando...' : existing ? 'Actualizar predicción' : 'Guardar predicción'}
      </button>
    </form>
  )
}
