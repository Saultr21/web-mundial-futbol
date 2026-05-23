import { getRequestContext } from '@cloudflare/next-on-pages'
import { NextResponse } from 'next/server'

export const runtime = 'edge'

const FOOTBALL_API = 'https://v3.football.api-sports.io'
const LEAGUE_ID = 1
const SEASON = 2026
const CACHE_TTL_LIVE = 30
const CACHE_TTL_IDLE = 3600

async function fetchFromAPI(path: string, apiKey: string) {
  const res = await fetch(`${FOOTBALL_API}${path}`, {
    headers: { 'x-apisports-key': apiKey },
  })
  if (!res.ok) throw new Error(`API-Football error: ${res.status}`)
  return res.json()
}

export async function GET() {
  const { env } = getRequestContext()
  const kv = (env as { MATCHES_CACHE: KVNamespace }).MATCHES_CACHE
  const apiKey = (env as { FOOTBALL_API_KEY: string }).FOOTBALL_API_KEY

  const cacheKey = `matches:all`
  const cached = await kv.get(cacheKey)
  if (cached) return NextResponse.json(JSON.parse(cached))

  const data = await fetchFromAPI(`/fixtures?league=${LEAGUE_ID}&season=${SEASON}`, apiKey) as {
    response: Array<{ fixture: { status: { short: string } } }>
  }
  const hasLive = data.response?.some((f) =>
    f.fixture.status.short === '1H' || f.fixture.status.short === '2H' || f.fixture.status.short === 'HT'
  )
  const ttl = hasLive ? CACHE_TTL_LIVE : CACHE_TTL_IDLE

  await kv.put(cacheKey, JSON.stringify(data.response), { expirationTtl: ttl })
  return NextResponse.json(data.response)
}
