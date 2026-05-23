'use client'
import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import type { SpecialPrediction } from '@/lib/types/app'

interface Props {
  userId: string
  existing: SpecialPrediction | null
  isLocked: boolean
}

export function SpecialPredictionsForm({ userId, existing, isLocked }: Props) {
  const supabase = createClient()
  const [topScorer, setTopScorer] = useState(existing?.top_scorer ?? '')
  const [mostYellows, setMostYellows] = useState(existing?.most_yellows ?? '')
  const [goldenGlove, setGoldenGlove] = useState(existing?.golden_glove ?? '')
  const [goldenBall, setGoldenBall] = useState(existing?.golden_ball ?? '')
  const [saving, setSaving] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function save() {
    if (isLocked) return
    if (!topScorer || !mostYellows || !goldenGlove || !goldenBall) {
      setError('Rellena todos los campos'); return
    }
    setSaving(true)
    setError(null)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error: dbError } = await (supabase.from('special_predictions') as any).upsert({
      user_id: userId, top_scorer: topScorer, most_yellows: mostYellows,
      golden_glove: goldenGlove, golden_ball: goldenBall
    }, { onConflict: 'user_id' })
    setSaving(false)
    if (dbError) { setError(dbError.message) } else { setSuccess(true) }
  }

  if (isLocked) return <p className="text-center text-muted-foreground py-8">Predicciones especiales cerradas.</p>

  const fields = [
    { label: '⚽ Bota de Oro (máximo goleador)', value: topScorer, set: setTopScorer, pts: '40 pts' },
    { label: '🟨 Más tarjetas amarillas del torneo', value: mostYellows, set: setMostYellows, pts: '20 pts' },
    { label: '🧤 Guante de Oro (mejor portero)', value: goldenGlove, set: setGoldenGlove, pts: '20 pts' },
    { label: '🏆 Balón de Oro (MVP del torneo)', value: goldenBall, set: setGoldenBall, pts: '20 pts' },
  ]

  return (
    <div className="space-y-4">
      {fields.map(f => (
        <div key={f.label} className="space-y-1">
          <Label className="flex justify-between">
            <span>{f.label}</span>
            <span className="text-green-600 font-mono text-xs">{f.pts}</span>
          </Label>
          <Input value={f.value} onChange={e => f.set(e.target.value)} placeholder="Nombre del jugador" />
        </div>
      ))}
      {error && <p className="text-sm text-destructive">{error}</p>}
      {success && <p className="text-sm text-green-600">Guardado correctamente</p>}
      <Button onClick={save} disabled={saving} className="w-full">
        {saving ? 'Guardando...' : 'Guardar predicciones especiales'}
      </Button>
    </div>
  )
}
