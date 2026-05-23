'use client'
import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
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
}

export function MatchPredictionForm({ match, existing, userId }: Props) {
  const supabase = createClient()
  const deadline = new Date(match.kickoff_at).getTime() - 5 * 60 * 1000
  const isLocked = Date.now() >= deadline || match.status !== 'scheduled'

  const [predHome, setPredHome] = useState(existing?.pred_home ?? 0)
  const [predAway, setPredAway] = useState(existing?.pred_away ?? 0)
  const [scorers, setScorers] = useState(existing?.pred_scorers?.join(', ') ?? '')
  const [redCard, setRedCard] = useState<boolean | null>(existing?.pred_red_card ?? null)
  const [mostFouls, setMostFouls] = useState(existing?.pred_most_fouls ?? '')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    if (isLocked) return
    setSaving(true)
    setError(null)
    setSuccess(false)

    const parsed = PredictionSchema.safeParse({
      pred_home: predHome, pred_away: predAway,
      pred_scorers: scorers.split(',').map(s => s.trim()).filter(Boolean),
      pred_red_card: redCard,
      pred_most_fouls: mostFouls || null,
    })
    if (!parsed.success) { setError('Datos inválidos'); setSaving(false); return }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error: dbError } = await (supabase.from('predictions') as any).upsert({
      user_id: userId,
      match_id: match.id,
      ...parsed.data,
    }, { onConflict: 'user_id,match_id' })

    if (dbError) { setError(dbError.message) } else { setSuccess(true) }
    setSaving(false)
  }

  if (isLocked) {
    return (
      <div className="p-4 rounded-lg bg-muted text-center text-muted-foreground">
        {match.status === 'finished'
          ? `Resultado final: ${match.home_score} - ${match.away_score}`
          : 'Predicciones cerradas (faltan menos de 5 minutos)'}
      </div>
    )
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      <div className="flex items-center gap-4">
        <div className="flex-1 text-right font-medium">{match.home_team}</div>
        <div className="flex items-center gap-2">
          <Input type="number" min={0} max={20} value={predHome}
            onChange={e => setPredHome(Number(e.target.value))} className="w-16 text-center" />
          <span className="text-muted-foreground">-</span>
          <Input type="number" min={0} max={20} value={predAway}
            onChange={e => setPredAway(Number(e.target.value))} className="w-16 text-center" />
        </div>
        <div className="flex-1 font-medium">{match.away_team}</div>
      </div>

      <div className="space-y-2">
        <Label>Goleadores (separados por coma)</Label>
        <Input value={scorers} onChange={e => setScorers(e.target.value)}
          placeholder="Morata, Mbappe, Vinicius" />
      </div>

      <div className="flex items-center gap-4">
        <div className="space-y-2 flex-1">
          <Label>¿Habrá tarjeta roja?</Label>
          <div className="flex gap-2">
            {([true, false, null] as const).map(v => (
              <Button key={String(v)} type="button" size="sm"
                variant={redCard === v ? 'default' : 'outline'}
                onClick={() => setRedCard(v)}>
                {v === null ? 'No sé' : v ? 'Sí' : 'No'}
              </Button>
            ))}
          </div>
        </div>

        <div className="space-y-2 flex-1">
          <Label>Jugador con más faltas</Label>
          <Input value={mostFouls} onChange={e => setMostFouls(e.target.value)}
            placeholder="Nombre del jugador" />
        </div>
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}
      {success && <p className="text-sm text-green-600">Predicción guardada correctamente</p>}
      <Button type="submit" disabled={saving} className="w-full">
        {saving ? 'Guardando...' : existing ? 'Actualizar predicción' : 'Guardar predicción'}
      </Button>
    </form>
  )
}
