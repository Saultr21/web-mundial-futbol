export const runtime = 'edge'

import { getRequestContext } from '@cloudflare/next-on-pages'
import { NextResponse } from 'next/server'

const FD_API = 'https://api.football-data.org/v4'

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const { env } = getRequestContext()
  const kv = (env as { MATCHES_CACHE: KVNamespace }).MATCHES_CACHE
  const token = (env as { FOOTBALL_DATA_TOKEN: string }).FOOTBALL_DATA_TOKEN

  const cacheKey = `match:${id}`
  const cached = await kv.get(cacheKey)
  if (cached) return NextResponse.json(JSON.parse(cached))

  const res = await fetch(`${FD_API}/matches/${id}`, {
    headers: { 'X-Auth-Token': token },
  })
  if (!res.ok) return NextResponse.json({ error: `football-data.org error: ${res.status}` }, { status: 502 })

  const match = await res.json() as { status: string }
  const isLive = ['IN_PLAY', 'PAUSED'].includes(match.status)
  await kv.put(cacheKey, JSON.stringify(match), { expirationTtl: isLive ? 30 : 3600 })
  return NextResponse.json(match)
}
