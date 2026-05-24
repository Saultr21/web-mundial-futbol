export const runtime = 'edge'

import { getRequestContext } from '@cloudflare/next-on-pages'
import { NextResponse } from 'next/server'

const FD_API = 'https://api.football-data.org/v4'
const CACHE_TTL_LIVE = 30
const CACHE_TTL_IDLE = 3600

export async function GET() {
  const { env } = getRequestContext()
  const kv = (env as { MATCHES_CACHE: KVNamespace }).MATCHES_CACHE
  const token = (env as { FOOTBALL_DATA_TOKEN: string }).FOOTBALL_DATA_TOKEN

  const cacheKey = 'matches:all'
  const cached = await kv.get(cacheKey)
  if (cached) return NextResponse.json(JSON.parse(cached))

  const res = await fetch(`${FD_API}/competitions/WC/matches`, {
    headers: { 'X-Auth-Token': token },
  })
  if (!res.ok) return NextResponse.json({ error: `football-data.org error: ${res.status}` }, { status: 502 })

  const data = await res.json() as { matches: Array<{ status: string }> }
  const hasLive = data.matches?.some(m => ['IN_PLAY', 'PAUSED'].includes(m.status))
  const ttl = hasLive ? CACHE_TTL_LIVE : CACHE_TTL_IDLE

  await kv.put(cacheKey, JSON.stringify(data.matches), { expirationTtl: ttl })
  return NextResponse.json(data.matches)
}
