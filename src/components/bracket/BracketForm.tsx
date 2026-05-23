'use client'
import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { WORLD_CUP_2026_TEAMS } from '@/lib/teams'
import type { Bracket } from '@/lib/types/app'

interface Props {
  userId: string
  existing: Bracket | null
  isLocked: boolean
}

function TeamSelect({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <div className="space-y-1">
      <Label className="text-xs text-muted-foreground">{label}</Label>
      <select value={value} onChange={e => onChange(e.target.value)}
        className="w-full rounded-md border px-2 py-1.5 text-sm bg-background">
        <option value="">Seleccionar...</option>
        {WORLD_CUP_2026_TEAMS.map(t => <option key={t} value={t}>{t}</option>)}
      </select>
    </div>
  )
}

export function BracketForm({ userId, existing, isLocked }: Props) {
  const supabase = createClient()
  const [champion, setChampion] = useState(existing?.champion ?? '')
  const [runnerUp, setRunnerUp] = useState(existing?.runner_up ?? '')
  const [third, setThird] = useState(existing?.third ?? '')
  const [fourth, setFourth] = useState(existing?.fourth ?? '')
  const [semis, setSemis] = useState<string[]>(existing?.semifinalists ?? ['', ''])
  const [quarters, setQuarters] = useState<string[]>(existing?.quarterfinalists ?? ['','','',''])
  const [saving, setSaving] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function save() {
    if (isLocked) return
    if (!champion || !runnerUp || !third || !fourth) {
      setError('Rellena todos los campos obligatorios (campeón, finalista, 3º y 4º)'); return
    }
    setSaving(true)
    setError(null)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error: dbError } = await (supabase.from('brackets') as any).upsert({
      user_id: userId, champion, runner_up: runnerUp, third, fourth,
      semifinalists: semis, quarterfinalists: quarters
    }, { onConflict: 'user_id' })
    setSaving(false)
    if (dbError) { setError(dbError.message) } else { setSuccess(true) }
  }

  if (isLocked) {
    return <p className="text-muted-foreground text-center py-8">El cuadro está cerrado. No se pueden modificar las predicciones.</p>
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4">
        <TeamSelect label="🥇 Campeón" value={champion} onChange={setChampion} />
        <TeamSelect label="🥈 Finalista" value={runnerUp} onChange={setRunnerUp} />
        <TeamSelect label="🥉 3er lugar" value={third} onChange={setThird} />
        <TeamSelect label="4º lugar" value={fourth} onChange={setFourth} />
      </div>

      <div>
        <h3 className="text-sm font-medium mb-2">Semifinalistas adicionales</h3>
        <div className="grid grid-cols-2 gap-2">
          {semis.map((v, i) => (
            <TeamSelect key={i} label={`Semifinalista ${i + 1}`} value={v}
              onChange={val => { const n = [...semis]; n[i] = val; setSemis(n) }} />
          ))}
        </div>
      </div>

      <div>
        <h3 className="text-sm font-medium mb-2">Cuartofinalistas adicionales</h3>
        <div className="grid grid-cols-2 gap-2">
          {quarters.map((v, i) => (
            <TeamSelect key={i} label={`Cuartofinalista ${i + 1}`} value={v}
              onChange={val => { const n = [...quarters]; n[i] = val; setQuarters(n) }} />
          ))}
        </div>
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}
      {success && <p className="text-sm text-green-600">Cuadro guardado correctamente</p>}
      <Button onClick={save} disabled={saving} className="w-full">
        {saving ? 'Guardando...' : 'Guardar cuadro'}
      </Button>
    </div>
  )
}
