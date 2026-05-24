'use client'
import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export default function AdminPage() {
  const [syncing, setSyncing] = useState(false)
  const [result, setResult] = useState<string | null>(null)

  async function syncFixtures() {
    const supabase = createClient()
    setSyncing(true)
    setResult(null)
    const { data: { user } } = await supabase.auth.getUser()
    const res = await fetch('/api/admin/sync', {
      method: 'POST',
      headers: { 'x-admin-email': user?.email ?? '' },
    })
    const data = await res.json() as { synced?: number; error?: string; details?: Record<string, string> }
    if (res.ok) {
      setResult(`✅ ${data.synced} partidos sincronizados`)
    } else {
      const detail = data.details ? JSON.stringify(data.details) : data.error
      setResult(`❌ Error: ${detail}`)
    }
    setSyncing(false)
  }

  return (
    <div className="max-w-lg mx-auto space-y-6 py-8">
      <h1 className="text-2xl font-bold">Panel de administración</h1>
      <Card>
        <CardHeader><CardTitle>Fixtures</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-muted-foreground">
            Sincroniza los 104 partidos del Mundial desde API-Football a la base de datos.
          </p>
          <Button onClick={syncFixtures} disabled={syncing}>
            {syncing ? 'Sincronizando...' : 'Sincronizar fixtures'}
          </Button>
          {result && <p className="text-sm mt-2">{result}</p>}
        </CardContent>
      </Card>
    </div>
  )
}
