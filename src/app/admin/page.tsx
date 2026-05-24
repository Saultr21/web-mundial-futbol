'use client'
import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'

type ActionState = { loading: boolean; result: string | null }

function useAdminAction(endpoint: string) {
  const [state, setState] = useState<ActionState>({ loading: false, result: null })

  async function run() {
    const supabase = createClient()
    setState({ loading: true, result: null })
    const { data: { user } } = await supabase.auth.getUser()
    const res = await fetch(endpoint, {
      method: 'POST',
      headers: { 'x-admin-email': user?.email ?? '' },
    })
    const data = await res.json() as Record<string, unknown>
    if (res.ok) {
      setState({ loading: false, result: JSON.stringify(data, null, 2) })
    } else {
      const detail = data.details ? JSON.stringify(data.details) : String(data.error ?? 'Error desconocido')
      setState({ loading: false, result: `❌ ${detail}` })
    }
  }

  return { ...state, run }
}

const cardStyle = {
  background: 'oklch(0.11 0.008 255)',
  border: '1px solid oklch(0.20 0.01 255)',
  borderRadius: '0.75rem',
  padding: '1.25rem',
} as React.CSSProperties

const btnStyle = {
  background: 'oklch(0.72 0.22 145)',
  color: 'oklch(0.07 0.006 255)',
  border: 'none',
  borderRadius: '0.5rem',
  padding: '0.5rem 1.25rem',
  fontSize: '0.875rem',
  fontWeight: 700,
  cursor: 'pointer',
  transition: 'background 0.15s',
  opacity: 1,
} as React.CSSProperties

export default function AdminPage() {
  const fixtures = useAdminAction('/api/admin/sync')
  const players = useAdminAction('/api/admin/sync-players')

  return (
    <div className="max-w-lg mx-auto space-y-6 py-8">
      <h1
        className="text-4xl tracking-widest"
        style={{ fontFamily: 'var(--font-bebas), Bebas Neue, sans-serif', color: 'oklch(0.93 0.005 255)' }}
      >
        Admin
      </h1>

      {/* Fixtures */}
      <div style={cardStyle} className="space-y-3">
        <div>
          <h2 className="text-sm font-semibold" style={{ color: 'oklch(0.93 0.005 255)' }}>Fixtures</h2>
          <p className="text-xs mt-1" style={{ color: 'oklch(0.52 0.01 255)' }}>
            Sincroniza los 104 partidos del Mundial 2026 desde football-data.org.
          </p>
        </div>
        <button
          style={{ ...btnStyle, opacity: fixtures.loading ? 0.6 : 1, cursor: fixtures.loading ? 'not-allowed' : 'pointer' }}
          onClick={fixtures.run}
          disabled={fixtures.loading}
        >
          {fixtures.loading ? 'Sincronizando...' : 'Sincronizar fixtures'}
        </button>
        {fixtures.result && (
          <pre
            className="text-xs p-3 rounded-lg overflow-x-auto"
            style={{
              background: 'oklch(0.09 0.007 255)',
              color: fixtures.result.startsWith('❌') ? 'oklch(0.75 0.22 25)' : 'oklch(0.72 0.22 145)',
              border: '1px solid oklch(0.16 0.01 255)',
            }}
          >
            {fixtures.result}
          </pre>
        )}
      </div>

      {/* Players */}
      <div style={cardStyle} className="space-y-3">
        <div>
          <h2 className="text-sm font-semibold" style={{ color: 'oklch(0.93 0.005 255)' }}>Plantillas de jugadores</h2>
          <p className="text-xs mt-1" style={{ color: 'oklch(0.52 0.01 255)' }}>
            Descarga las plantillas de los 48 equipos para habilitar el autocompletado en las predicciones de goleadores.
          </p>
        </div>
        <button
          style={{ ...btnStyle, opacity: players.loading ? 0.6 : 1, cursor: players.loading ? 'not-allowed' : 'pointer' }}
          onClick={players.run}
          disabled={players.loading}
        >
          {players.loading ? 'Sincronizando...' : 'Sincronizar jugadores'}
        </button>
        {players.result && (
          <pre
            className="text-xs p-3 rounded-lg overflow-x-auto"
            style={{
              background: 'oklch(0.09 0.007 255)',
              color: players.result.startsWith('❌') ? 'oklch(0.75 0.22 25)' : 'oklch(0.72 0.22 145)',
              border: '1px solid oklch(0.16 0.01 255)',
            }}
          >
            {players.result}
          </pre>
        )}
      </div>
    </div>
  )
}
