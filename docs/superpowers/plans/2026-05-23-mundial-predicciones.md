# Mundial 2026 Predicciones — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Web app para 20-50 amigos que predicen resultados del Mundial FIFA 2026, con puntuación automática, ranking en tiempo real, bracket pre-torneo y logros.

**Architecture:** Next.js 15 (App Router, TypeScript strict) desplegado en Cloudflare Pages. Las API routes de Next.js actúan como Workers proxy para API-Football con cache en KV. Supabase gestiona Postgres, Google OAuth y Storage de avatares. Supabase Edge Function calcula puntos cuando un partido finaliza.

**Tech Stack:** Next.js 15, TypeScript strict, pnpm, Supabase JS v2 + @supabase/ssr, Cloudflare Pages + KV, @cloudflare/next-on-pages, API-Football (api-sports.io), Zod, shadcn/ui, Vitest

---

## Estructura de archivos

```
mundial/
├── src/
│   ├── app/
│   │   ├── (auth)/login/page.tsx
│   │   ├── (protected)/
│   │   │   ├── layout.tsx              -- auth guard
│   │   │   ├── cuadro/page.tsx
│   │   │   ├── partidos/page.tsx
│   │   │   ├── partidos/[id]/page.tsx
│   │   │   ├── ranking/page.tsx
│   │   │   ├── logros/page.tsx
│   │   │   └── perfil/page.tsx
│   │   ├── admin/page.tsx
│   │   ├── api/matches/route.ts        -- proxy API-Football con KV cache
│   │   ├── api/matches/[id]/route.ts
│   │   ├── api/admin/sync/route.ts
│   │   ├── layout.tsx
│   │   └── page.tsx                   -- redirect a /partidos o /login
│   ├── components/
│   │   ├── bracket/BracketForm.tsx
│   │   ├── predictions/MatchPredictionForm.tsx
│   │   ├── predictions/SpecialPredictionsForm.tsx
│   │   ├── ranking/LeaderboardTable.tsx
│   │   └── achievements/BadgeGrid.tsx
│   ├── lib/
│   │   ├── supabase/client.ts          -- browser client
│   │   ├── supabase/server.ts          -- server client (cookies)
│   │   ├── scoring/calculator.ts       -- pure functions, testables
│   │   ├── scoring/achievements.ts     -- evaluación de logros
│   │   └── types/app.ts               -- tipos de la app
│   └── middleware.ts
├── supabase/
│   ├── migrations/
│   │   ├── 20260523000001_schema.sql
│   │   └── 20260523000002_rls.sql
│   └── functions/score-match/index.ts
├── tests/scoring/calculator.test.ts
├── tests/scoring/achievements.test.ts
├── .env.local
├── next.config.ts
├── wrangler.toml
└── vitest.config.ts
```

---

## Task 1: Scaffolding del proyecto

**Files:**
- Create: `package.json`, `next.config.ts`, `tsconfig.json`, `wrangler.toml`, `vitest.config.ts`

- [ ] **Crear proyecto Next.js**

```bash
cd C:\Users\liags\Desktop\mundial
pnpm create next-app@latest . --typescript --tailwind --eslint --app --src-dir --import-alias "@/*" --no-turbopack
```
Responde: Yes a todo lo que pregunte.

- [ ] **Instalar dependencias**

```bash
pnpm add @supabase/supabase-js @supabase/ssr zod
pnpm add @cloudflare/next-on-pages
pnpm add -D vitest @vitejs/plugin-react @vitest/coverage-v8 wrangler
pnpm dlx shadcn@latest init
```
En shadcn init: New York style, zinc color, yes a CSS variables.

- [ ] **Instalar componentes shadcn necesarios**

```bash
pnpm dlx shadcn@latest add button input label card badge table tabs avatar
```

- [ ] **Actualizar `next.config.ts`**

```typescript
import { setupDevPlatform } from '@cloudflare/next-on-pages/next-config'

const nextConfig = {
  // Required for Cloudflare Pages
}

if (process.env.NODE_ENV === 'development') {
  await setupDevPlatform()
}

export default nextConfig
```

- [ ] **Crear `wrangler.toml`**

```toml
name = "mundial-predicciones"
compatibility_date = "2024-09-23"
compatibility_flags = ["nodejs_compat"]
pages_build_output_dir = ".vercel/output/static"

[[kv_namespaces]]
binding = "MATCHES_CACHE"
id = "placeholder"  # Se rellena tras crear el namespace en Cloudflare Dashboard

[vars]
ADMIN_EMAIL = "saul.trujillo@cognitiatech.com"
```

- [ ] **Crear `vitest.config.ts`**

```typescript
import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'node',
    globals: true,
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
})
```

- [ ] **Añadir scripts a `package.json`**

```json
{
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "preview": "npx @cloudflare/next-on-pages && wrangler pages dev",
    "test": "vitest",
    "test:run": "vitest run",
    "supabase:types": "supabase gen types typescript --project-id $SUPABASE_PROJECT_ID > src/lib/types/database.types.ts"
  }
}
```

- [ ] **Inicializar git y primer commit**

```bash
git init
git add next.config.ts wrangler.toml vitest.config.ts package.json tsconfig.json
git commit -m "chore: scaffolding inicial Next.js 15 + Cloudflare + Vitest"
```

---

## Task 2: Configuración Supabase

**Files:**
- Create: `src/lib/supabase/client.ts`, `src/lib/supabase/server.ts`, `.env.local`

- [ ] **Crear proyecto en Supabase**

1. Ir a supabase.com → New Project → nombre: `mundial-2026`
2. Copiar: Project URL, anon key, service_role key

- [ ] **Crear `.env.local`**

```env
NEXT_PUBLIC_SUPABASE_URL=https://xxxxxxxxxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIs...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIs...
FOOTBALL_API_KEY=tu-key-de-api-football
ADMIN_EMAIL=saul.trujillo@cognitiatech.com
SUPABASE_PROJECT_ID=xxxxxxxxxxxx
```

- [ ] **Crear `src/lib/supabase/client.ts`**

```typescript
import { createBrowserClient } from '@supabase/ssr'
import type { Database } from '@/lib/types/database.types'

export function createClient() {
  return createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}
```

- [ ] **Crear `src/lib/supabase/server.ts`**

```typescript
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import type { Database } from '@/lib/types/database.types'

export async function createClient() {
  const cookieStore = await cookies()
  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return cookieStore.getAll() },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {}
        },
      },
    }
  )
}
```

- [ ] **Crear `src/middleware.ts`**

```typescript
import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return request.cookies.getAll() },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()
  const isProtected = request.nextUrl.pathname.startsWith('/(protected)') ||
    ['/cuadro', '/partidos', '/ranking', '/logros', '/perfil'].some(p =>
      request.nextUrl.pathname.startsWith(p)
    )

  if (!user && isProtected) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  const isAdmin = user?.email === process.env.ADMIN_EMAIL
  if (request.nextUrl.pathname.startsWith('/admin') && !isAdmin) {
    return NextResponse.redirect(new URL('/partidos', request.url))
  }

  return supabaseResponse
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)'],
}
```

- [ ] **Configurar Google OAuth en Supabase**

1. Supabase Dashboard → Authentication → Providers → Google → Enable
2. Crear OAuth app en console.cloud.google.com:
   - APIs & Services → Credentials → OAuth 2.0 Client IDs
   - Authorized redirect URIs: `https://xxxx.supabase.co/auth/v1/callback`
3. Copiar Client ID y Client Secret a Supabase

- [ ] **Commit**

```bash
git add src/lib/supabase/ src/middleware.ts .env.local
git commit -m "feat(auth): configuración Supabase + middleware Google OAuth"
```

---

## Task 3: Esquema de base de datos

**Files:**
- Create: `supabase/migrations/20260523000001_schema.sql`, `supabase/migrations/20260523000002_rls.sql`

- [ ] **Instalar Supabase CLI y vincular proyecto**

```bash
pnpm add -D supabase
pnpm supabase login
pnpm supabase init
pnpm supabase link --project-ref $SUPABASE_PROJECT_ID
```

- [ ] **Crear `supabase/migrations/20260523000001_schema.sql`**

```sql
-- Perfil público (extiende auth.users)
create table profiles (
  id uuid primary key references auth.users on delete cascade,
  display_name text not null,
  avatar_url text,
  created_at timestamptz default now() not null
);

-- Partidos del Mundial
create table matches (
  id uuid primary key default gen_random_uuid(),
  api_id integer unique not null,
  home_team text not null,
  away_team text not null,
  kickoff_at timestamptz not null,
  stage text not null check (stage in ('group','r16','qf','sf','final')),
  group_name text,
  status text not null default 'scheduled' check (status in ('scheduled','live','finished')),
  home_score integer,
  away_score integer,
  home_scorers text[] default '{}',
  away_scorers text[] default '{}',
  red_card boolean default false,
  most_fouls_player text,
  created_at timestamptz default now() not null
);

-- Predicciones por partido
create table predictions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles on delete cascade,
  match_id uuid not null references matches on delete cascade,
  pred_home integer not null,
  pred_away integer not null,
  pred_scorers text[] default '{}',
  pred_red_card boolean,
  pred_most_fouls text,
  submitted_at timestamptz default now() not null,
  points_earned integer default 0,
  unique (user_id, match_id)
);

-- Cuadro pre-torneo
create table brackets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references profiles on delete cascade,
  champion text not null,
  runner_up text not null,
  third text not null,
  fourth text not null,
  semifinalists text[] not null default '{}',
  quarterfinalists text[] not null default '{}',
  locked_at timestamptz,
  points_earned integer default 0,
  created_at timestamptz default now() not null
);

-- Predicciones especiales pre-torneo
create table special_predictions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references profiles on delete cascade,
  top_scorer text not null,
  most_yellows text not null,
  golden_glove text not null,
  golden_ball text not null,
  locked_at timestamptz,
  points_earned integer default 0,
  created_at timestamptz default now() not null
);

-- Leaderboard
create table leaderboard (
  user_id uuid primary key references profiles on delete cascade,
  total_points integer default 0 not null,
  week_points integer default 0 not null,
  streak integer default 0 not null,
  updated_at timestamptz default now() not null
);

-- Logros
create table achievements (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles on delete cascade,
  badge_key text not null,
  unlocked_at timestamptz default now() not null,
  unique (user_id, badge_key)
);

-- Auto-crear perfil y entrada en leaderboard al registrarse
create or replace function handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into profiles (id, display_name, avatar_url)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)),
    new.raw_user_meta_data->>'avatar_url'
  );
  insert into leaderboard (user_id) values (new.id);
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure handle_new_user();
```

- [ ] **Crear `supabase/migrations/20260523000002_rls.sql`**

```sql
-- Habilitar RLS en todas las tablas
alter table profiles enable row level security;
alter table matches enable row level security;
alter table predictions enable row level security;
alter table brackets enable row level security;
alter table special_predictions enable row level security;
alter table leaderboard enable row level security;
alter table achievements enable row level security;

-- profiles: cualquier usuario autenticado puede leer, solo el propio puede actualizar
create policy "profiles_select" on profiles for select to authenticated using (true);
create policy "profiles_update" on profiles for update to authenticated using (auth.uid() = id);

-- matches: solo lectura para autenticados, escritura solo service_role (admin)
create policy "matches_select" on matches for select to authenticated using (true);

-- predictions: lectura global autenticada, escritura solo del propio usuario
create policy "predictions_select" on predictions for select to authenticated using (true);
create policy "predictions_insert" on predictions for insert to authenticated with check (auth.uid() = user_id);
create policy "predictions_update" on predictions for update to authenticated using (auth.uid() = user_id);

-- brackets y special_predictions: ídem
create policy "brackets_select" on brackets for select to authenticated using (true);
create policy "brackets_insert" on brackets for insert to authenticated with check (auth.uid() = user_id);
create policy "brackets_update" on brackets for update to authenticated
  using (auth.uid() = user_id and locked_at is null);

create policy "special_select" on special_predictions for select to authenticated using (true);
create policy "special_insert" on special_predictions for insert to authenticated with check (auth.uid() = user_id);
create policy "special_update" on special_predictions for update to authenticated
  using (auth.uid() = user_id and locked_at is null);

-- leaderboard y achievements: solo lectura
create policy "leaderboard_select" on leaderboard for select to authenticated using (true);
create policy "achievements_select" on achievements for select to authenticated using (true);

-- Storage bucket para avatares
insert into storage.buckets (id, name, public) values ('avatars', 'avatars', true);

create policy "avatars_select" on storage.objects for select using (bucket_id = 'avatars');
create policy "avatars_insert" on storage.objects for insert to authenticated
  with check (bucket_id = 'avatars' and name = auth.uid()::text);
create policy "avatars_update" on storage.objects for update to authenticated
  using (bucket_id = 'avatars' and name = auth.uid()::text);
```

- [ ] **Aplicar migraciones**

```bash
pnpm supabase db push
```
Esperado: "Migrations applied successfully"

- [ ] **Generar tipos TypeScript**

```bash
pnpm supabase:types
```
Esto crea `src/lib/types/database.types.ts`.

- [ ] **Crear `src/lib/types/app.ts`**

```typescript
export type Stage = 'group' | 'r16' | 'qf' | 'sf' | 'final'
export type MatchStatus = 'scheduled' | 'live' | 'finished'

export interface Match {
  id: string
  api_id: number
  home_team: string
  away_team: string
  kickoff_at: string
  stage: Stage
  group_name: string | null
  status: MatchStatus
  home_score: number | null
  away_score: number | null
  home_scorers: string[]
  away_scorers: string[]
  red_card: boolean
  most_fouls_player: string | null
}

export interface Prediction {
  id: string
  user_id: string
  match_id: string
  pred_home: number
  pred_away: number
  pred_scorers: string[]
  pred_red_card: boolean | null
  pred_most_fouls: string | null
  submitted_at: string
  points_earned: number
}

export interface LeaderboardEntry {
  user_id: string
  total_points: number
  week_points: number
  streak: number
  profiles: {
    display_name: string
    avatar_url: string | null
  }
}

export const BADGE_KEYS = [
  'profeta', 'madrugador', 'underdog', 'hat_trick',
  'vidente_cuadro', 'constante', 'goleador', 'campeon'
] as const
export type BadgeKey = typeof BADGE_KEYS[number]

export const BADGE_META: Record<BadgeKey, { label: string; description: string; emoji: string }> = {
  profeta:       { label: 'Profeta',              description: '5 marcadores exactos en el torneo', emoji: '🔮' },
  madrugador:    { label: 'Madrugador',            description: 'Predice >24h antes en 10 partidos', emoji: '⏰' },
  underdog:      { label: 'Underdog',              description: 'Acierta resultado de una sorpresa', emoji: '🐉' },
  hat_trick:     { label: 'Hat-trick',             description: '3 marcadores exactos consecutivos', emoji: '🎩' },
  vidente_cuadro:{ label: 'Vidente del Cuadro',    description: 'Bracket ≥80% correcto hasta semis', emoji: '🏆' },
  constante:     { label: 'Constante',             description: 'Predice los 48 partidos de grupos', emoji: '📋' },
  goleador:      { label: 'Goleador',              description: '10 goleadores acertados en el torneo', emoji: '⚽' },
  campeon:       { label: 'Campeón de Campeones',  description: 'Acertó el ganador del Mundial', emoji: '👑' },
}
```

- [ ] **Commit**

```bash
git add supabase/ src/lib/types/
git commit -m "feat(db): esquema Supabase + RLS + tipos TypeScript"
```

---

## Task 4: Lógica de puntuación (TDD)

**Files:**
- Create: `src/lib/scoring/calculator.ts`, `tests/scoring/calculator.test.ts`
- Create: `src/lib/scoring/achievements.ts`, `tests/scoring/achievements.test.ts`

- [ ] **Escribir tests de la calculadora (primero)**

`tests/scoring/calculator.test.ts`:
```typescript
import { describe, it, expect } from 'vitest'
import { calculateMatchPoints, calculateBracketPoints, calculateSpecialPoints } from '@/lib/scoring/calculator'
import type { Match, Prediction } from '@/lib/types/app'

const baseMatch: Match = {
  id: 'm1', api_id: 1, home_team: 'España', away_team: 'Francia',
  kickoff_at: '2026-06-14T18:00:00Z', stage: 'group', group_name: 'A',
  status: 'finished', home_score: 2, away_score: 1,
  home_scorers: ['Morata', 'Yamal'], away_scorers: ['Mbappe'],
  red_card: false, most_fouls_player: 'Tchouameni'
}

const basePrediction: Prediction = {
  id: 'p1', user_id: 'u1', match_id: 'm1',
  pred_home: 2, pred_away: 1,
  pred_scorers: ['Morata', 'Mbappe'],
  pred_red_card: false, pred_most_fouls: 'Tchouameni',
  submitted_at: '2026-06-13T10:00:00Z', points_earned: 0
}

describe('calculateMatchPoints - fase de grupos', () => {
  it('acierta resultado y marcador exacto', () => {
    const pts = calculateMatchPoints(baseMatch, basePrediction)
    // marcador exacto (8) + goleador Morata (2) + goleador Mbappe (2) + sin tarjeta (4) + faltas (5) = 21
    expect(pts).toBe(21)
  })

  it('acierta solo resultado (1/X/2), no marcador exacto', () => {
    const pred = { ...basePrediction, pred_home: 3, pred_away: 1 }
    const pts = calculateMatchPoints(baseMatch, pred)
    // resultado (3) + Mbappe (2) + sin tarjeta (4) + faltas (5) = 14
    expect(pts).toBe(14)
  })

  it('falla resultado completamente', () => {
    const pred = { ...basePrediction, pred_home: 0, pred_away: 2, pred_scorers: [] }
    const pts = calculateMatchPoints(baseMatch, pred)
    // 0 resultado + 0 goleadores + sin tarjeta (4) + faltas (5) = 9
    expect(pts).toBe(9)
  })

  it('predice tarjeta roja correctamente', () => {
    const match = { ...baseMatch, red_card: true }
    const pred = { ...basePrediction, pred_red_card: true }
    const pts = calculateMatchPoints(match, pred)
    // marcador (8) + Morata (2) + Mbappe (2) + tarjeta roja (4) + faltas (5) = 21
    expect(pts).toBe(21)
  })

  it('falla predicción de tarjeta roja', () => {
    const match = { ...baseMatch, red_card: true }
    const pred = { ...basePrediction, pred_red_card: false }
    const pts = calculateMatchPoints(match, pred)
    // marcador (8) + Morata (2) + Mbappe (2) + tarjeta FALLO (0) + faltas (5) = 17
    expect(pts).toBe(17)
  })

  it('empate predicho y acertado', () => {
    const match = { ...baseMatch, home_score: 1, away_score: 1, home_scorers: ['Morata'], away_scorers: ['Mbappe'], red_card: false, most_fouls_player: null }
    const pred = { ...basePrediction, pred_home: 1, pred_away: 1, pred_scorers: ['Morata'], pred_red_card: null, pred_most_fouls: null }
    const pts = calculateMatchPoints(match, pred)
    // marcador exacto (8) + Morata (2) = 10
    expect(pts).toBe(10)
  })
})

describe('calculateMatchPoints - eliminatorias (x2)', () => {
  it('dobla los puntos en r16', () => {
    const match = { ...baseMatch, stage: 'r16' as const }
    const pts = calculateMatchPoints(match, basePrediction)
    // marcador (16) + Morata (4) + Mbappe (4) + tarjeta (8) + faltas (5 fijo) = 37... hmm
    // Nota: tarjetas y faltas se doblan también en eliminatorias
    // resultado (6) → marcador exacto pasa a (16) + goleador x2 (4 c/u) + tarjeta (8) + faltas (10) = 42... 
    // Según spec: marcador exacto 16, goleador 4, tarjeta 4 (no se dobla), faltas 5 (no se dobla)
    // Re-leyendo spec: "tarjeta roja: 4 pts | 4 pts" y "faltas: 5 pts | 5 pts" — estos NO se doblan
    // Marcador (16) + Morata (4) + Mbappe (4) + tarjeta NO roja OK (4) + faltas (5) = 33
    expect(pts).toBe(33)
  })
})

describe('calculateBracketPoints', () => {
  it('acierta campeón y finalista', () => {
    const bracket = {
      champion: 'España', runner_up: 'Francia',
      third: 'Brasil', fourth: 'Argentina',
      semifinalists: ['Alemania', 'Portugal'],
      quarterfinalists: ['Inglaterra', 'Italia', 'Países Bajos', 'Marruecos'],
    }
    const results = {
      champion: 'España', runner_up: 'Francia',
      third: 'Brasil', fourth: 'Argentina',
      semifinalists: ['Alemania', 'Portugal'],
      quarterfinalists: ['Inglaterra', 'Italia', 'Países Bajos', 'Marruecos'],
    }
    const pts = calculateBracketPoints(bracket, results)
    // 50 + 25 + 25 + 10 + 10 + 10 + 10 + 5x4 + 30 bonus = 190
    expect(pts).toBe(190)
  })

  it('solo acierta campeón', () => {
    const bracket = {
      champion: 'España', runner_up: 'Brasil',
      third: 'Alemania', fourth: 'Portugal',
      semifinalists: ['Francia', 'Argentina'],
      quarterfinalists: ['México', 'Japón', 'Senegal', 'Australia'],
    }
    const results = {
      champion: 'España', runner_up: 'Francia',
      third: 'Países Bajos', fourth: 'Marruecos',
      semifinalists: ['Brasil', 'Portugal'],
      quarterfinalists: ['Inglaterra', 'Italia', 'Argentina', 'Croacia'],
    }
    const pts = calculateBracketPoints(bracket, results)
    expect(pts).toBe(50)
  })
})
```

- [ ] **Verificar que los tests fallan**

```bash
pnpm test:run tests/scoring/calculator.test.ts
```
Esperado: FAIL con "Cannot find module"

- [ ] **Implementar `src/lib/scoring/calculator.ts`**

```typescript
import type { Match, Prediction, Stage } from '@/lib/types/app'

type BracketResult = {
  champion: string
  runner_up: string
  third: string
  fourth: string
  semifinalists: string[]
  quarterfinalists: string[]
}

function getResult(home: number, away: number): 'home' | 'draw' | 'away' {
  if (home > away) return 'home'
  if (home < away) return 'away'
  return 'draw'
}

function isElimination(stage: Stage): boolean {
  return stage !== 'group'
}

export function calculateMatchPoints(match: Match, prediction: Prediction): number {
  if (match.home_score === null || match.away_score === null) return 0

  const multiplier = isElimination(match.stage) ? 2 : 1
  let points = 0

  const actualResult = getResult(match.home_score, match.away_score)
  const predResult = getResult(prediction.pred_home, prediction.pred_away)
  const exactScore = prediction.pred_home === match.home_score && prediction.pred_away === match.away_score

  if (exactScore) {
    points += 8 * multiplier
  } else if (actualResult === predResult) {
    points += 3 * multiplier
  }

  const allScorers = [...match.home_scorers, ...match.away_scorers]
  const remainingScorers = [...allScorers]
  for (const scorer of prediction.pred_scorers) {
    const idx = remainingScorers.findIndex(s => s.toLowerCase() === scorer.toLowerCase())
    if (idx !== -1) {
      points += 2 * multiplier
      remainingScorers.splice(idx, 1)
    }
  }

  if (prediction.pred_red_card !== null && prediction.pred_red_card === match.red_card) {
    points += 4
  }

  if (prediction.pred_most_fouls && match.most_fouls_player &&
      prediction.pred_most_fouls.toLowerCase() === match.most_fouls_player.toLowerCase()) {
    points += 5
  }

  return points
}

export function calculateBracketPoints(bracket: BracketResult, results: BracketResult): number {
  let points = 0

  if (bracket.champion === results.champion) points += 50
  if (bracket.runner_up === results.runner_up) points += 25
  if (bracket.third === results.third) points += 25
  if (bracket.fourth === results.fourth) points += 10

  for (const team of bracket.semifinalists) {
    if (results.semifinalists.includes(team)) points += 10
  }
  for (const team of bracket.quarterfinalists) {
    if (results.quarterfinalists.includes(team)) points += 5
  }

  const allSemis = [results.champion, results.runner_up, ...results.semifinalists]
  const predictedSemis = [bracket.champion, bracket.runner_up, ...bracket.semifinalists]
  const perfectSemis = allSemis.every(t => predictedSemis.includes(t))
  if (perfectSemis) points += 30

  return points
}

export function calculateSpecialPoints(predictions: {
  top_scorer: string
  most_yellows: string
  golden_glove: string
  golden_ball: string
}, results: {
  top_scorer: string
  most_yellows: string
  golden_glove: string
  golden_ball: string
}): number {
  let points = 0
  if (predictions.top_scorer.toLowerCase() === results.top_scorer.toLowerCase()) points += 40
  if (predictions.most_yellows.toLowerCase() === results.most_yellows.toLowerCase()) points += 20
  if (predictions.golden_glove.toLowerCase() === results.golden_glove.toLowerCase()) points += 20
  if (predictions.golden_ball.toLowerCase() === results.golden_ball.toLowerCase()) points += 20
  return points
}
```

- [ ] **Verificar que los tests pasan**

```bash
pnpm test:run tests/scoring/calculator.test.ts
```
Esperado: PASS todos los tests. Si algún test falla por un cálculo incorrecto, revisar la lógica en `calculator.ts`.

- [ ] **Commit**

```bash
git add src/lib/scoring/calculator.ts tests/scoring/calculator.test.ts
git commit -m "feat(scoring): calculadora de puntos con tests"
```

---

## Task 5: Lógica de logros (TDD)

**Files:**
- Create: `src/lib/scoring/achievements.ts`, `tests/scoring/achievements.test.ts`

- [ ] **Escribir tests de logros**

`tests/scoring/achievements.test.ts`:
```typescript
import { describe, it, expect } from 'vitest'
import { evaluateAchievements } from '@/lib/scoring/achievements'

describe('evaluateAchievements', () => {
  it('desbloquea profeta con 5 marcadores exactos', () => {
    const stats = { exact_scores: 5, early_predictions: 0, consecutive_exact: 0, total_scorers_correct: 0, all_group_predicted: false, champion_correct: false, bracket_accuracy: 0 }
    const unlocked = ['constante']
    const result = evaluateAchievements(stats, unlocked)
    expect(result).toContain('profeta')
  })

  it('no desbloquea profeta si ya está desbloqueado', () => {
    const stats = { exact_scores: 5, early_predictions: 0, consecutive_exact: 0, total_scorers_correct: 0, all_group_predicted: false, champion_correct: false, bracket_accuracy: 0 }
    const unlocked = ['profeta']
    const result = evaluateAchievements(stats, unlocked)
    expect(result).not.toContain('profeta')
  })

  it('desbloquea hat_trick con 3 consecutivos', () => {
    const stats = { exact_scores: 3, early_predictions: 0, consecutive_exact: 3, total_scorers_correct: 0, all_group_predicted: false, champion_correct: false, bracket_accuracy: 0 }
    const result = evaluateAchievements(stats, [])
    expect(result).toContain('hat_trick')
  })

  it('desbloquea campeon si acertó el campeón', () => {
    const stats = { exact_scores: 0, early_predictions: 0, consecutive_exact: 0, total_scorers_correct: 0, all_group_predicted: false, champion_correct: true, bracket_accuracy: 0 }
    const result = evaluateAchievements(stats, [])
    expect(result).toContain('campeon')
  })
})
```

- [ ] **Verificar que fallan**

```bash
pnpm test:run tests/scoring/achievements.test.ts
```

- [ ] **Implementar `src/lib/scoring/achievements.ts`**

```typescript
import type { BadgeKey } from '@/lib/types/app'

interface AchievementStats {
  exact_scores: number
  early_predictions: number
  consecutive_exact: number
  total_scorers_correct: number
  all_group_predicted: boolean
  champion_correct: boolean
  bracket_accuracy: number
}

export function evaluateAchievements(stats: AchievementStats, alreadyUnlocked: string[]): BadgeKey[] {
  const newBadges: BadgeKey[] = []

  function check(key: BadgeKey, condition: boolean) {
    if (condition && !alreadyUnlocked.includes(key)) newBadges.push(key)
  }

  check('profeta', stats.exact_scores >= 5)
  check('madrugador', stats.early_predictions >= 10)
  check('hat_trick', stats.consecutive_exact >= 3)
  check('goleador', stats.total_scorers_correct >= 10)
  check('constante', stats.all_group_predicted)
  check('campeon', stats.champion_correct)
  check('vidente_cuadro', stats.bracket_accuracy >= 0.8)

  return newBadges
}
```

- [ ] **Verificar que pasan**

```bash
pnpm test:run tests/scoring/achievements.test.ts
```

- [ ] **Commit**

```bash
git add src/lib/scoring/achievements.ts tests/scoring/achievements.test.ts
git commit -m "feat(scoring): evaluación de logros con tests"
```

---

## Task 6: API route — proxy API-Football con cache KV

**Files:**
- Create: `src/app/api/matches/route.ts`, `src/app/api/matches/[id]/route.ts`
- Create: `src/app/api/admin/sync/route.ts`

- [ ] **Crear `src/app/api/matches/route.ts`**

```typescript
import { getRequestContext } from '@cloudflare/next-on-pages'
import { NextResponse } from 'next/server'

export const runtime = 'edge'

const FOOTBALL_API = 'https://v3.football.api-sports.io'
const LEAGUE_ID = 1    // FIFA World Cup
const SEASON = 2026
const CACHE_TTL_LIVE = 30     // segundos durante partido en vivo
const CACHE_TTL_IDLE = 3600   // 1 hora fuera de partido

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

  const data = await fetchFromAPI(`/fixtures?league=${LEAGUE_ID}&season=${SEASON}`, apiKey)
  const hasLive = data.response?.some((f: { fixture: { status: { short: string } } }) =>
    f.fixture.status.short === '1H' || f.fixture.status.short === '2H' || f.fixture.status.short === 'HT'
  )
  const ttl = hasLive ? CACHE_TTL_LIVE : CACHE_TTL_IDLE

  await kv.put(cacheKey, JSON.stringify(data.response), { expirationTtl: ttl })
  return NextResponse.json(data.response)
}
```

- [ ] **Crear `src/app/api/matches/[id]/route.ts`**

```typescript
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
  const data = await res.json()
  const fixture = data.response?.[0]
  if (!fixture) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const isLive = ['1H', '2H', 'HT'].includes(fixture.fixture.status.short)
  await kv.put(cacheKey, JSON.stringify(fixture), { expirationTtl: isLive ? 30 : 3600 })
  return NextResponse.json(fixture)
}
```

- [ ] **Crear `src/app/api/admin/sync/route.ts`**

```typescript
import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'
import { headers } from 'next/headers'

export const runtime = 'nodejs'

const FOOTBALL_API = 'https://v3.football.api-sports.io'

export async function POST() {
  const headersList = await headers()
  const adminEmail = headersList.get('x-admin-email')

  if (adminEmail !== process.env.ADMIN_EMAIL) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const res = await fetch(`${FOOTBALL_API}/fixtures?league=1&season=2026`, {
    headers: { 'x-apisports-key': process.env.FOOTBALL_API_KEY! },
  })
  const data = await res.json()
  const fixtures = data.response

  for (const f of fixtures) {
    await supabase.from('matches').upsert({
      api_id: f.fixture.id,
      home_team: f.teams.home.name,
      away_team: f.teams.away.name,
      kickoff_at: f.fixture.date,
      stage: mapStatus(f.league.round),
      group_name: f.league.round.includes('Group') ? f.league.round.split(' ').pop() : null,
      status: mapStatus(f.fixture.status.short) === 'finished' ? 'finished' :
               ['1H','2H','HT'].includes(f.fixture.status.short) ? 'live' : 'scheduled',
      home_score: f.goals.home,
      away_score: f.goals.away,
    }, { onConflict: 'api_id' })
  }

  return NextResponse.json({ synced: fixtures.length })
}

function mapStatus(round: string): string {
  if (round.includes('Group')) return 'group'
  if (round === 'Round of 16') return 'r16'
  if (round === 'Quarter-finals') return 'qf'
  if (round === 'Semi-finals') return 'sf'
  if (round === 'Final') return 'final'
  return 'group'
}
```

- [ ] **Configurar secrets de Cloudflare (desarrollo local)**

Crear `.dev.vars`:
```
FOOTBALL_API_KEY=tu-api-key-de-api-football
ADMIN_EMAIL=saul.trujillo@cognitiatech.com
```

- [ ] **Commit**

```bash
git add src/app/api/ .dev.vars
git commit -m "feat(api): proxy API-Football con cache KV + sync admin"
```

---

## Task 7: Supabase Edge Function — score-match

**Files:**
- Create: `supabase/functions/score-match/index.ts`

- [ ] **Crear la Edge Function**

`supabase/functions/score-match/index.ts`:
```typescript
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

interface Match {
  id: string; stage: string; home_score: number; away_score: number
  home_scorers: string[]; away_scorers: string[]; red_card: boolean; most_fouls_player: string | null
}

interface Prediction {
  id: string; user_id: string; pred_home: number; pred_away: number
  pred_scorers: string[]; pred_red_card: boolean | null; pred_most_fouls: string | null
}

function getResult(h: number, a: number) {
  return h > a ? 'home' : h < a ? 'away' : 'draw'
}

function calcPoints(match: Match, pred: Prediction): number {
  const mult = match.stage !== 'group' ? 2 : 1
  let pts = 0
  const exact = pred.pred_home === match.home_score && pred.pred_away === match.away_score
  if (exact) {
    pts += 8 * mult
  } else if (getResult(pred.pred_home, pred.pred_away) === getResult(match.home_score, match.away_score)) {
    pts += 3 * mult
  }
  const scorers = [...match.home_scorers, ...match.away_scorers]
  const remaining = [...scorers]
  for (const s of pred.pred_scorers) {
    const i = remaining.findIndex(r => r.toLowerCase() === s.toLowerCase())
    if (i !== -1) { pts += 2 * mult; remaining.splice(i, 1) }
  }
  if (pred.pred_red_card !== null && pred.pred_red_card === match.red_card) pts += 4
  if (pred.pred_most_fouls && match.most_fouls_player &&
      pred.pred_most_fouls.toLowerCase() === match.most_fouls_player.toLowerCase()) pts += 5
  return pts
}

serve(async (req) => {
  const { match_id } = await req.json()
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  )

  const { data: match } = await supabase.from('matches').select('*').eq('id', match_id).single()
  if (!match) return new Response('Match not found', { status: 404 })

  const { data: predictions } = await supabase.from('predictions').select('*').eq('match_id', match_id)
  if (!predictions?.length) return new Response('No predictions', { status: 200 })

  for (const pred of predictions) {
    const pts = calcPoints(match, pred)
    await supabase.from('predictions').update({ points_earned: pts }).eq('id', pred.id)
    await supabase.from('leaderboard').upsert({
      user_id: pred.user_id,
      total_points: supabase.rpc('increment', { row_id: pred.user_id, amount: pts }),
    })
  }

  // Actualizar leaderboard total (uso RPC para incremento atómico)
  for (const pred of predictions) {
    const pts = calcPoints(match, pred)
    await supabase.rpc('add_points', { p_user_id: pred.user_id, p_points: pts, p_week_points: pts })
  }

  return new Response('OK')
})
```

- [ ] **Añadir función SQL de incremento de puntos**

En Supabase Dashboard → SQL Editor:
```sql
create or replace function add_points(p_user_id uuid, p_points int, p_week_points int)
returns void language plpgsql security definer as $$
begin
  insert into leaderboard (user_id, total_points, week_points)
  values (p_user_id, p_points, p_week_points)
  on conflict (user_id) do update set
    total_points = leaderboard.total_points + excluded.total_points,
    week_points = leaderboard.week_points + excluded.week_points,
    updated_at = now();
end;
$$;
```

- [ ] **Desplegar Edge Function**

```bash
pnpm supabase functions deploy score-match --project-ref $SUPABASE_PROJECT_ID
```

- [ ] **Commit**

```bash
git add supabase/functions/
git commit -m "feat(scoring): Edge Function score-match"
```

---

## Task 8: Auth — Login y perfil

**Files:**
- Create: `src/app/(auth)/login/page.tsx`, `src/app/(protected)/layout.tsx`
- Create: `src/app/(protected)/perfil/page.tsx`

- [ ] **Crear `src/app/(auth)/login/page.tsx`**

```tsx
'use client'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export default function LoginPage() {
  const supabase = createClient()

  async function loginWithGoogle() {
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/partidos` },
    })
  }

  return (
    <main className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-900 to-green-700">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="text-6xl mb-2">⚽</div>
          <CardTitle className="text-2xl">Mundial 2026</CardTitle>
          <p className="text-muted-foreground">Predicciones con amigos</p>
        </CardHeader>
        <CardContent>
          <Button onClick={loginWithGoogle} className="w-full" size="lg">
            Entrar con Google
          </Button>
        </CardContent>
      </Card>
    </main>
  )
}
```

- [ ] **Crear `src/app/(protected)/layout.tsx`**

```tsx
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'

export default async function ProtectedLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  return (
    <div className="min-h-screen bg-background">
      <nav className="border-b px-4 py-3 flex items-center gap-4">
        <Link href="/partidos" className="font-bold">⚽ Mundial 2026</Link>
        <Link href="/cuadro" className="text-sm text-muted-foreground hover:text-foreground">Cuadro</Link>
        <Link href="/ranking" className="text-sm text-muted-foreground hover:text-foreground">Ranking</Link>
        <Link href="/logros" className="text-sm text-muted-foreground hover:text-foreground">Logros</Link>
        <div className="ml-auto">
          <Link href="/perfil" className="text-sm">{user.email}</Link>
        </div>
      </nav>
      <main className="container mx-auto px-4 py-6">{children}</main>
    </div>
  )
}
```

- [ ] **Crear `src/app/(protected)/perfil/page.tsx`**

```tsx
'use client'
import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar'

export default function PerfilPage() {
  const supabase = createClient()
  const [displayName, setDisplayName] = useState('')
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null)
  const [userId, setUserId] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) return
      setUserId(user.id)
      supabase.from('profiles').select('*').eq('id', user.id).single().then(({ data }) => {
        if (data) { setDisplayName(data.display_name); setAvatarUrl(data.avatar_url) }
      })
    })
  }, [])

  async function uploadAvatar(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file || !userId) return
    const { data, error } = await supabase.storage.from('avatars').upload(userId, file, { upsert: true })
    if (error) return alert('Error subiendo avatar: ' + error.message)
    const { data: { publicUrl } } = supabase.storage.from('avatars').getPublicUrl(data.path)
    setAvatarUrl(publicUrl)
    await supabase.from('profiles').update({ avatar_url: publicUrl }).eq('id', userId)
  }

  async function save() {
    setSaving(true)
    await supabase.from('profiles').update({ display_name: displayName }).eq('id', userId)
    setSaving(false)
    alert('Guardado')
  }

  return (
    <div className="max-w-md mx-auto space-y-6">
      <h1 className="text-2xl font-bold">Mi perfil</h1>
      <div className="flex items-center gap-4">
        <Avatar className="h-20 w-20">
          <AvatarImage src={avatarUrl ?? undefined} />
          <AvatarFallback>{displayName[0]?.toUpperCase()}</AvatarFallback>
        </Avatar>
        <div>
          <Label htmlFor="avatar" className="cursor-pointer text-sm text-blue-600 hover:underline">
            Cambiar foto
          </Label>
          <input id="avatar" type="file" accept="image/*" className="hidden" onChange={uploadAvatar} />
        </div>
      </div>
      <div className="space-y-2">
        <Label>Nombre</Label>
        <Input value={displayName} onChange={e => setDisplayName(e.target.value)} />
      </div>
      <Button onClick={save} disabled={saving}>{saving ? 'Guardando...' : 'Guardar'}</Button>
    </div>
  )
}
```

- [ ] **Crear `src/app/page.tsx` (redirect)**

```tsx
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export default async function Home() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  redirect(user ? '/partidos' : '/login')
}
```

- [ ] **Commit**

```bash
git add src/app/
git commit -m "feat(auth): login Google + perfil + avatar upload"
```

---

## Task 9: Lista de partidos + formulario de predicción

**Files:**
- Create: `src/app/(protected)/partidos/page.tsx`
- Create: `src/app/(protected)/partidos/[id]/page.tsx`
- Create: `src/components/predictions/MatchPredictionForm.tsx`

- [ ] **Crear `src/app/(protected)/partidos/page.tsx`**

```tsx
import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { Badge } from '@/components/ui/badge'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'

export const revalidate = 60

export default async function PartidosPage() {
  const supabase = await createClient()
  const { data: matches } = await supabase
    .from('matches')
    .select('*')
    .order('kickoff_at', { ascending: true })

  const grouped = (matches ?? []).reduce((acc, m) => {
    const day = format(new Date(m.kickoff_at), 'EEEE d MMMM', { locale: es })
    if (!acc[day]) acc[day] = []
    acc[day].push(m)
    return acc
  }, {} as Record<string, typeof matches>)

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Partidos</h1>
      {Object.entries(grouped).map(([day, dayMatches]) => (
        <div key={day}>
          <h2 className="text-sm font-medium text-muted-foreground mb-2 capitalize">{day}</h2>
          <div className="grid gap-2">
            {dayMatches?.map(m => (
              <Link key={m.id} href={`/partidos/${m.id}`}
                className="flex items-center justify-between p-4 rounded-lg border hover:bg-accent transition-colors">
                <div className="flex items-center gap-3 font-medium">
                  <span>{m.home_team}</span>
                  <span className="text-muted-foreground">vs</span>
                  <span>{m.away_team}</span>
                </div>
                <div className="flex items-center gap-2">
                  {m.status === 'live' && (
                    <Badge variant="destructive" className="animate-pulse">EN VIVO</Badge>
                  )}
                  {m.status === 'finished' && (
                    <span className="text-sm font-mono">{m.home_score} - {m.away_score}</span>
                  )}
                  {m.status === 'scheduled' && (
                    <span className="text-sm text-muted-foreground">
                      {format(new Date(m.kickoff_at), 'HH:mm')}
                    </span>
                  )}
                </div>
              </Link>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}
```

- [ ] **Instalar date-fns**

```bash
pnpm add date-fns
```

- [ ] **Crear `src/components/predictions/MatchPredictionForm.tsx`**

```tsx
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

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    if (isLocked) return
    setSaving(true)
    setError(null)

    const parsed = PredictionSchema.safeParse({
      pred_home: predHome, pred_away: predAway,
      pred_scorers: scorers.split(',').map(s => s.trim()).filter(Boolean),
      pred_red_card: redCard,
      pred_most_fouls: mostFouls || null,
    })
    if (!parsed.success) { setError('Datos inválidos'); setSaving(false); return }

    const { error: dbError } = await supabase.from('predictions').upsert({
      user_id: userId,
      match_id: match.id,
      ...parsed.data,
    }, { onConflict: 'user_id,match_id' })

    if (dbError) setError(dbError.message)
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
            {[true, false, null].map(v => (
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
      <Button type="submit" disabled={saving} className="w-full">
        {saving ? 'Guardando...' : existing ? 'Actualizar predicción' : 'Guardar predicción'}
      </Button>
    </form>
  )
}
```

- [ ] **Crear `src/app/(protected)/partidos/[id]/page.tsx`**

```tsx
import { createClient } from '@/lib/supabase/server'
import { MatchPredictionForm } from '@/components/predictions/MatchPredictionForm'
import { notFound } from 'next/navigation'
import type { Match, Prediction } from '@/lib/types/app'

export default async function MatchPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const [{ data: match }, { data: prediction }] = await Promise.all([
    supabase.from('matches').select('*').eq('id', id).single(),
    supabase.from('predictions').select('*').eq('match_id', id).eq('user_id', user!.id).single(),
  ])

  if (!match) notFound()

  return (
    <div className="max-w-lg mx-auto space-y-6">
      <h1 className="text-2xl font-bold text-center">
        {match.home_team} vs {match.away_team}
      </h1>
      <MatchPredictionForm
        match={match as Match}
        existing={prediction as Prediction | null}
        userId={user!.id}
      />
    </div>
  )
}
```

- [ ] **Commit**

```bash
git add src/app/\(protected\)/partidos/ src/components/predictions/
git commit -m "feat(predictions): lista partidos + formulario predicción por partido"
```

---

## Task 10: Cuadro pre-torneo + predicciones especiales

**Files:**
- Create: `src/app/(protected)/cuadro/page.tsx`
- Create: `src/components/bracket/BracketForm.tsx`
- Create: `src/components/predictions/SpecialPredictionsForm.tsx`

- [ ] **Crear lista de selecciones**

`src/lib/teams.ts`:
```typescript
export const WORLD_CUP_2026_TEAMS = [
  'Argentina','Australia','Brasil','Canadá','España','Estados Unidos','Francia',
  'Alemania','Ghana','Inglaterra','Iran','Japón','México','Marruecos','Países Bajos',
  'Nigeria','Polonia','Portugal','Arabia Saudí','Senegal','Serbia','Suiza','Uruguay',
  'Gales','Ecuador','Costa Rica','Túnez','Camerún','Corea del Sur','Qatar',
  'Costa de Marfil','Turquía','Colombia','Chile','Bolivia','Panamá','Jamaica','Honduras',
  'El Salvador','Perú','Venezuela','Irak','Emiratos Árabes','Jordania','Omán',
  'Nueva Zelanda','Vanuatu','Guatemala'
].sort()
```

- [ ] **Crear `src/components/bracket/BracketForm.tsx`**

```tsx
'use client'
import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { WORLD_CUP_2026_TEAMS } from '@/lib/teams'

interface Props {
  userId: string
  existing: {
    champion: string; runner_up: string; third: string; fourth: string
    semifinalists: string[]; quarterfinalists: string[]
  } | null
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

  async function save() {
    if (isLocked) return
    setSaving(true)
    await supabase.from('brackets').upsert({
      user_id: userId, champion, runner_up: runnerUp, third, fourth,
      semifinalists: semis, quarterfinalists: quarters
    }, { onConflict: 'user_id' })
    setSaving(false)
    alert('Cuadro guardado')
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

      <Button onClick={save} disabled={saving} className="w-full">
        {saving ? 'Guardando...' : 'Guardar cuadro'}
      </Button>
    </div>
  )
}
```

- [ ] **Crear `src/app/(protected)/cuadro/page.tsx`**

```tsx
import { createClient } from '@/lib/supabase/server'
import { BracketForm } from '@/components/bracket/BracketForm'
import { SpecialPredictionsForm } from '@/components/predictions/SpecialPredictionsForm'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

const TOURNAMENT_START = new Date('2026-06-11T20:00:00Z')

export default async function CuadroPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const [{ data: bracket }, { data: special }] = await Promise.all([
    supabase.from('brackets').select('*').eq('user_id', user!.id).single(),
    supabase.from('special_predictions').select('*').eq('user_id', user!.id).single(),
  ])

  const isLocked = new Date() >= TOURNAMENT_START || !!bracket?.locked_at

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Cuadro del Mundial</h1>
        <p className="text-sm text-muted-foreground mt-1">
          {isLocked ? 'Predicciones cerradas — el torneo ha comenzado.' :
            `Se cierra el ${TOURNAMENT_START.toLocaleDateString('es-ES')}`}
        </p>
      </div>

      <Tabs defaultValue="bracket">
        <TabsList className="w-full">
          <TabsTrigger value="bracket" className="flex-1">Cuadro eliminatorio</TabsTrigger>
          <TabsTrigger value="special" className="flex-1">Predicciones especiales</TabsTrigger>
        </TabsList>
        <TabsContent value="bracket" className="mt-4">
          <BracketForm userId={user!.id} existing={bracket} isLocked={isLocked} />
        </TabsContent>
        <TabsContent value="special" className="mt-4">
          <SpecialPredictionsForm userId={user!.id} existing={special} isLocked={isLocked} />
        </TabsContent>
      </Tabs>
    </div>
  )
}
```

- [ ] **Crear `src/components/predictions/SpecialPredictionsForm.tsx`**

```tsx
'use client'
import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

interface Props {
  userId: string
  existing: { top_scorer: string; most_yellows: string; golden_glove: string; golden_ball: string } | null
  isLocked: boolean
}

export function SpecialPredictionsForm({ userId, existing, isLocked }: Props) {
  const supabase = createClient()
  const [topScorer, setTopScorer] = useState(existing?.top_scorer ?? '')
  const [mostYellows, setMostYellows] = useState(existing?.most_yellows ?? '')
  const [goldenGlove, setGoldenGlove] = useState(existing?.golden_glove ?? '')
  const [goldenBall, setGoldenBall] = useState(existing?.golden_ball ?? '')
  const [saving, setSaving] = useState(false)

  async function save() {
    if (isLocked) return
    setSaving(true)
    await supabase.from('special_predictions').upsert({
      user_id: userId, top_scorer: topScorer, most_yellows: mostYellows,
      golden_glove: goldenGlove, golden_ball: goldenBall
    }, { onConflict: 'user_id' })
    setSaving(false)
    alert('Guardado')
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
      <Button onClick={save} disabled={saving} className="w-full">
        {saving ? 'Guardando...' : 'Guardar predicciones especiales'}
      </Button>
    </div>
  )
}
```

- [ ] **Commit**

```bash
git add src/app/\(protected\)/cuadro/ src/components/bracket/ src/components/predictions/SpecialPredictionsForm.tsx src/lib/teams.ts
git commit -m "feat(bracket): cuadro pre-torneo + predicciones especiales"
```

---

## Task 11: Ranking + Logros

**Files:**
- Create: `src/app/(protected)/ranking/page.tsx`
- Create: `src/components/ranking/LeaderboardTable.tsx`
- Create: `src/app/(protected)/logros/page.tsx`
- Create: `src/components/achievements/BadgeGrid.tsx`

- [ ] **Crear `src/components/ranking/LeaderboardTable.tsx`**

```tsx
'use client'
import { useState } from 'react'
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import type { LeaderboardEntry } from '@/lib/types/app'

interface Props {
  entries: LeaderboardEntry[]
  currentUserId: string
}

export function LeaderboardTable({ entries, currentUserId }: Props) {
  const [view, setView] = useState<'total' | 'week'>('total')
  const sorted = [...entries].sort((a, b) =>
    view === 'total' ? b.total_points - a.total_points : b.week_points - a.week_points
  )

  return (
    <div className="space-y-4">
      <Tabs value={view} onValueChange={v => setView(v as 'total' | 'week')}>
        <TabsList>
          <TabsTrigger value="total">General</TabsTrigger>
          <TabsTrigger value="week">Esta semana</TabsTrigger>
        </TabsList>
      </Tabs>
      <div className="space-y-2">
        {sorted.map((entry, i) => (
          <div key={entry.user_id}
            className={`flex items-center gap-3 p-3 rounded-lg border ${entry.user_id === currentUserId ? 'bg-accent border-primary' : ''}`}>
            <span className="w-6 text-center font-mono text-sm text-muted-foreground">{i + 1}</span>
            <Avatar className="h-8 w-8">
              <AvatarImage src={entry.profiles.avatar_url ?? undefined} />
              <AvatarFallback>{entry.profiles.display_name[0]}</AvatarFallback>
            </Avatar>
            <span className="flex-1 font-medium">{entry.profiles.display_name}</span>
            {entry.streak > 2 && <span className="text-xs text-orange-500">🔥 {entry.streak}</span>}
            <span className="font-mono font-bold">
              {view === 'total' ? entry.total_points : entry.week_points} pts
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}
```

- [ ] **Crear `src/app/(protected)/ranking/page.tsx`**

```tsx
import { createClient } from '@/lib/supabase/server'
import { LeaderboardTable } from '@/components/ranking/LeaderboardTable'

export const revalidate = 30

export default async function RankingPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const { data: entries } = await supabase
    .from('leaderboard')
    .select('*, profiles(display_name, avatar_url)')
    .order('total_points', { ascending: false })

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold">Clasificación</h1>
      <LeaderboardTable entries={(entries ?? []) as any} currentUserId={user!.id} />
    </div>
  )
}
```

- [ ] **Crear `src/components/achievements/BadgeGrid.tsx`**

```tsx
import { BADGE_META, type BadgeKey } from '@/lib/types/app'

interface Props {
  unlocked: BadgeKey[]
}

export function BadgeGrid({ unlocked }: Props) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
      {(Object.entries(BADGE_META) as [BadgeKey, typeof BADGE_META[BadgeKey]][]).map(([key, meta]) => {
        const isUnlocked = unlocked.includes(key)
        return (
          <div key={key}
            className={`flex flex-col items-center gap-2 p-4 rounded-lg border text-center transition-all ${isUnlocked ? 'bg-yellow-50 border-yellow-300 dark:bg-yellow-950 dark:border-yellow-700' : 'opacity-40 grayscale'}`}>
            <span className="text-3xl">{meta.emoji}</span>
            <span className="font-medium text-sm">{meta.label}</span>
            <span className="text-xs text-muted-foreground">{meta.description}</span>
            {isUnlocked && <span className="text-xs text-yellow-600 font-medium">Desbloqueado ✓</span>}
          </div>
        )
      })}
    </div>
  )
}
```

- [ ] **Crear `src/app/(protected)/logros/page.tsx`**

```tsx
import { createClient } from '@/lib/supabase/server'
import { BadgeGrid } from '@/components/achievements/BadgeGrid'
import type { BadgeKey } from '@/lib/types/app'

export default async function LogrosPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const { data: achievements } = await supabase
    .from('achievements')
    .select('badge_key')
    .eq('user_id', user!.id)

  const unlocked = (achievements ?? []).map(a => a.badge_key as BadgeKey)

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Mis logros</h1>
        <p className="text-sm text-muted-foreground">{unlocked.length} / 8 desbloqueados</p>
      </div>
      <BadgeGrid unlocked={unlocked} />
    </div>
  )
}
```

- [ ] **Commit**

```bash
git add src/app/\(protected\)/ranking/ src/app/\(protected\)/logros/ src/components/ranking/ src/components/achievements/
git commit -m "feat(ui): ranking con tabs general/semana + galería de logros"
```

---

## Task 12: Panel admin + polling live scores

**Files:**
- Create: `src/app/admin/page.tsx`
- Modify: `src/app/(protected)/partidos/page.tsx` (añadir polling)

- [ ] **Crear `src/app/admin/page.tsx`**

```tsx
'use client'
import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export default function AdminPage() {
  const [syncing, setSyncing] = useState(false)
  const [result, setResult] = useState<string | null>(null)
  const supabase = createClient()

  async function syncFixtures() {
    setSyncing(true)
    setResult(null)
    const { data: { user } } = await supabase.auth.getUser()
    const res = await fetch('/api/admin/sync', {
      method: 'POST',
      headers: { 'x-admin-email': user?.email ?? '' },
    })
    const data = await res.json()
    setResult(res.ok ? `✅ ${data.synced} partidos sincronizados` : `❌ Error: ${data.error}`)
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
          {result && <p className="text-sm">{result}</p>}
        </CardContent>
      </Card>
    </div>
  )
}
```

- [ ] **Añadir polling live en la página de partidos**

Crear `src/components/live/LiveMatchBadge.tsx`:
```tsx
'use client'
import { useEffect, useState } from 'react'
import { Badge } from '@/components/ui/badge'

interface Props {
  matchApiId: number
  initialStatus: string
}

export function LiveMatchBadge({ matchApiId, initialStatus }: Props) {
  const [score, setScore] = useState<{ home: number | null; away: number | null }>({ home: null, away: null })
  const [isLive, setIsLive] = useState(initialStatus === 'live')

  useEffect(() => {
    if (!isLive) return
    const interval = setInterval(async () => {
      const res = await fetch(`/api/matches/${matchApiId}`)
      const data = await res.json()
      if (data?.goals) {
        setScore({ home: data.goals.home, away: data.goals.away })
        setIsLive(['1H','2H','HT'].includes(data.fixture?.status?.short))
      }
    }, 30000)
    return () => clearInterval(interval)
  }, [isLive, matchApiId])

  if (!isLive) return null

  return (
    <div className="flex items-center gap-2">
      <Badge variant="destructive" className="animate-pulse">EN VIVO</Badge>
      {score.home !== null && (
        <span className="font-mono font-bold">{score.home} - {score.away}</span>
      )}
    </div>
  )
}
```

- [ ] **Commit**

```bash
git add src/app/admin/ src/components/live/
git commit -m "feat(admin): panel sync fixtures + componente live score polling"
```

---

## Task 13: Deploy a Cloudflare Pages

- [ ] **Crear KV namespace en Cloudflare**

1. Ir a Cloudflare Dashboard → Workers & Pages → KV
2. Crear namespace: `MATCHES_CACHE`
3. Copiar el ID y actualizar `wrangler.toml`:
   ```toml
   [[kv_namespaces]]
   binding = "MATCHES_CACHE"
   id = "el-id-real-del-namespace"
   ```

- [ ] **Subir proyecto a GitHub**

```bash
git remote add origin https://github.com/tu-usuario/mundial-2026.git
git push -u origin main
```

- [ ] **Conectar a Cloudflare Pages**

1. Cloudflare Dashboard → Workers & Pages → Create → Pages → Connect to Git
2. Seleccionar repositorio `mundial-2026`
3. Framework preset: **Next.js**
4. Build command: `pnpm run build`
5. Build output: `.vercel/output/static`

- [ ] **Añadir variables de entorno en Cloudflare Pages**

En el dashboard del Pages project → Settings → Environment variables:
```
NEXT_PUBLIC_SUPABASE_URL = https://xxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY = eyJ...
SUPABASE_SERVICE_ROLE_KEY = eyJ...
FOOTBALL_API_KEY = tu-key
ADMIN_EMAIL = saul.trujillo@cognitiatech.com
```

- [ ] **Añadir binding KV al Pages project**

Settings → Functions → KV namespace bindings → Añadir `MATCHES_CACHE`

- [ ] **Actualizar redirect URI de Google OAuth**

En Google Cloud Console → OAuth credentials → añadir:
`https://tu-proyecto.pages.dev/auth/callback`

Y en Supabase → Authentication → URL Configuration:
- Site URL: `https://tu-proyecto.pages.dev`
- Redirect URLs: `https://tu-proyecto.pages.dev/auth/callback`

- [ ] **Verificar deploy**

```bash
# Forzar rebuild
git commit --allow-empty -m "chore: trigger deploy"
git push
```
Abrir `https://tu-proyecto.pages.dev` y verificar login con Google.

- [ ] **Commit final**

```bash
git add wrangler.toml
git commit -m "chore: configuración Cloudflare Pages + KV bindings"
```

---

## Task 14: Sincronización inicial de fixtures

- [ ] **Acceder al panel admin y sincronizar**

1. Ir a `https://tu-proyecto.pages.dev/admin`
2. Hacer clic en "Sincronizar fixtures"
3. Verificar: debe mostrar "104 partidos sincronizados"
4. Ir a `/partidos` y verificar que aparecen los partidos

- [ ] **Ejecutar test suite final**

```bash
pnpm test:run
```
Esperado: todos los tests PASS.

- [ ] **Tag de release**

```bash
git tag v1.0.0
git push origin v1.0.0
```

---

## Checklist de verificación antes del 11 junio

- [ ] Login con Google funciona desde móvil
- [ ] Cuadro se puede guardar y se bloquea al llegar la fecha
- [ ] Predicciones por partido se guardan correctamente
- [ ] Predicciones se bloquean 5 min antes del partido
- [ ] Ranking muestra puntos correctos
- [ ] Logros aparecen en la galería
- [ ] Panel admin sincroniza fixtures
- [ ] Live badge aparece en partidos en vivo (probar con un partido de prueba en la BD)
- [ ] Avatar personalizado se sube y se muestra
- [ ] Funciona en mobile (probar desde el móvil)
