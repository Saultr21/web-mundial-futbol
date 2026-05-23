import { getRequestContext } from '@cloudflare/next-on-pages'
import { NextResponse } from 'next/server'

export const runtime = 'edge'

const FOOTBALL_API = 'https://v3.football.api-sports.io'

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const { env } = getRequestContext()
  const kv = (env as { MATCHES_CACHE: KVNamespace }).MATCHES_CACHE
  const apiKey = (env as { FOOTBALL_API_KEY: string }).FOOTBALL_API_KEY

  const cacheKey = `match:${id}`
  const cached = await kv.get(cacheKey)
  if (cached) return NextResponse.json(JSON.parse(cached))

  const res = await fetch(`${FOOTBALL_API}/fixtures?id=${id}`, {
    headers: { 'x-apisports-key': apiKey },
  })
  const data = await res.json() as { response?: Array<{ fixture: { status: { short: string } } }> }
  const fixture = data.response?.[0]
  if (!fixture) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const isLive = ['1H', '2H', 'HT'].includes(fixture.fixture.status.short)
  await kv.put(cacheKey, JSON.stringify(fixture), { expirationTtl: isLive ? 30 : 3600 })
  return NextResponse.json(fixture)
}
