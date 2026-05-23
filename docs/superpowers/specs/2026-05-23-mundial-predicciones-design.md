# Mundial 2026 — Web de Predicciones con Amigos

**Fecha:** 2026-05-23
**Autor:** Saúl Trujillo Rodríguez
**Deadline MVP:** 2026-06-11 (partido inaugural)

---

## 1. Contexto y objetivo

Aplicación web privada para un grupo de 20-50 amigos que compiten prediciendo resultados del Mundial FIFA 2026 (USA/Canadá/México, 11 jun – 19 jul 2026). El sistema premia la participación con puntos, mantiene un ranking en tiempo real y desbloquea logros. Los resultados y estadísticas se obtienen automáticamente de la API de fútbol.

---

## 2. Stack tecnológico

| Capa | Tecnología | Justificación |
|---|---|---|
| Frontend | Next.js 15 (App Router, TypeScript strict, Zod) | SSR + edge deploy, tipado fuerte |
| Hosting | Cloudflare Pages | Bandwidth ilimitado, gratis |
| API proxy / cache | Cloudflare Worker + KV | Oculta API key, cachea resultados |
| Base de datos | Supabase (Postgres) + RLS | SQL real, gratis hasta 500 MB |
| Auth | Supabase Auth + Google OAuth | Login Google en 2 clicks, sin gestión de contraseñas |
| Storage avatares | Supabase Storage | Bucket `avatars/{user_id}`, 1 GB gratis |
| API fútbol | API-Football (api-sports.io) free | Única con Mundial 2026 + live scores + 100 req/día sin tarjeta |
| Lógica de puntos | Supabase Edge Functions | Trigger al marcar partido como finalizado |

**Gestión de dependencias:** `pnpm`. **Deploy:** push a GitHub → Cloudflare Pages auto-deploy.

---

## 3. Arquitectura

```
Browser
  └─ Next.js 15 (App Router)
       ├─ /app/(auth)            → login Google
       ├─ /app/cuadro            → bracket pre-torneo
       ├─ /app/partidos          → lista + formularios predicción
       │    └─ /app/partidos/[id]
       ├─ /app/ranking           → clasificación global + semanal
       ├─ /app/logros            → galería de badges
       └─ /app/admin             → panel sincronización fixtures

Cloudflare Pages                 → sirve el front
Cloudflare Worker                → proxy API-Football
  └─ KV store                    → cache TTL 30s (live) / 1h (reposo)

Supabase Postgres
  ├─ profiles                    → datos usuario + avatar personalizado
  ├─ matches                     → fixtures sincronizados desde API-Football
  ├─ predictions                 → predicciones por partido por usuario
  ├─ special_predictions         → predicciones pre-torneo y especiales por partido
  ├─ brackets                    → cuadro eliminatorio pre-torneo
  ├─ leaderboard                 → puntos calculados (vista materializada)
  └─ achievements                → logros desbloqueados

API-Football
  └─ /fixtures, /livescores, /players → vía Worker con cache KV
```

---

## 4. Modelo de datos

```sql
-- Perfil de usuario (extiende auth.users)
profiles (
  id            uuid PK FK auth.users,
  display_name  text NOT NULL,
  avatar_url    text,              -- Storage URL si subió foto propia, si no Google foto
  created_at    timestamptz DEFAULT now()
)

-- Partidos (sincronizados desde API-Football, solo admin escribe)
matches (
  id            uuid PK DEFAULT gen_random_uuid(),
  api_id        int UNIQUE NOT NULL,
  home_team     text NOT NULL,
  away_team     text NOT NULL,
  kickoff_at    timestamptz NOT NULL,
  stage         text NOT NULL,    -- 'group' | 'r16' | 'qf' | 'sf' | 'final'
  group_name    text,             -- 'A'..'L' para fase de grupos
  status        text DEFAULT 'scheduled', -- 'scheduled' | 'live' | 'finished'
  home_score    int,
  away_score    int,
  home_scorers  text[],
  away_scorers  text[],
  red_card      boolean DEFAULT false,
  most_fouls_player text
)

-- Predicciones por partido
predictions (
  id            uuid PK DEFAULT gen_random_uuid(),
  user_id       uuid NOT NULL FK profiles,
  match_id      uuid NOT NULL FK matches,
  pred_home     int NOT NULL,
  pred_away     int NOT NULL,
  pred_scorers  text[],           -- goleadores predichos
  pred_red_card boolean,          -- ¿habrá tarjeta roja?
  pred_most_fouls text,           -- jugador con más faltas
  submitted_at  timestamptz DEFAULT now(),
  points_earned int DEFAULT 0,
  UNIQUE (user_id, match_id)
)

-- Predicciones especiales pre-torneo
special_predictions (
  id            uuid PK DEFAULT gen_random_uuid(),
  user_id       uuid NOT NULL FK profiles UNIQUE, -- una por usuario
  top_scorer    text NOT NULL,    -- Bota de Oro
  most_yellows  text NOT NULL,    -- más amarillas del torneo
  golden_glove  text NOT NULL,    -- Guante de Oro
  golden_ball   text NOT NULL,    -- Balón de Oro
  locked_at     timestamptz,      -- NULL hasta bloqueo en partido inaugural
  points_earned int DEFAULT 0
)

-- Cuadro pre-torneo
brackets (
  id               uuid PK DEFAULT gen_random_uuid(),
  user_id          uuid NOT NULL FK profiles UNIQUE,
  champion         text NOT NULL,
  runner_up        text NOT NULL,
  third            text NOT NULL,
  fourth           text NOT NULL,
  semifinalists    text[] NOT NULL, -- 2 equipos adicionales (total 4 semis)
  quarterfinalists text[] NOT NULL, -- 4 equipos adicionales (total 8 cuartos)
  locked_at        timestamptz,
  points_earned    int DEFAULT 0
)

-- Leaderboard (actualizado por Edge Function tras cada partido)
leaderboard (
  user_id       uuid PK FK profiles,
  total_points  int DEFAULT 0,
  week_points   int DEFAULT 0,
  streak        int DEFAULT 0,    -- partidos acertados consecutivos
  updated_at    timestamptz DEFAULT now()
)

-- Logros desbloqueados
achievements (
  id            uuid PK DEFAULT gen_random_uuid(),
  user_id       uuid NOT NULL FK profiles,
  badge_key     text NOT NULL,
  unlocked_at   timestamptz DEFAULT now(),
  UNIQUE (user_id, badge_key)
)
```

**RLS policies:**
- `predictions`, `brackets`, `special_predictions`: INSERT/UPDATE solo si `user_id = auth.uid()`
- `matches`, `leaderboard`: SELECT para todos los usuarios autenticados
- `profiles`: UPDATE solo si `id = auth.uid()`

---

## 5. Sistema de puntuación

### Predicciones por partido

| Acierto | Fase de grupos | Eliminatorias |
|---|---|---|
| Resultado 1/X/2 correcto | 3 pts | 6 pts |
| Marcador exacto (incluye resultado) | 8 pts | 16 pts |
| Cada goleador acertado | 2 pts | 4 pts |
| Tarjeta roja (Sí/No) acertada | 4 pts | 4 pts |
| Jugador con más faltas acertado | 5 pts | 5 pts |

### Predicciones especiales pre-torneo

| Predicción | Puntos |
|---|---|
| Bota de Oro (máximo goleador del torneo) | 40 pts |
| Jugador con más amarillas del torneo | 20 pts |
| Guante de Oro (mejor portero) | 20 pts |
| Balón de Oro (MVP del torneo) | 20 pts |

### Cuadro pre-torneo

| Acierto | Puntos |
|---|---|
| Campeón | 50 pts |
| Finalista | 25 pts |
| Cada semifinalista acertado (hasta 4) | 10 pts c/u |
| Cada cuartofinalista acertado (hasta 8) | 5 pts c/u |
| Bonus: bracket perfecto hasta semis | +30 pts |

### Cálculo

Supabase Edge Function `score-match` se dispara cuando `matches.status` cambia a `'finished'`:
1. Lee `home_score`, `away_score`, `home_scorers`, `away_scorers`, `red_card`, `most_fouls_player` del partido.
2. Para cada `prediction` del partido, calcula puntos según tabla y actualiza `points_earned`.
3. Actualiza `leaderboard.total_points`, `week_points`, `streak`.
4. Evalúa condiciones de logros y escribe en `achievements`.

---

## 6. Modos de predicción

### Modo cuadro (bracket pre-torneo)
- Disponible desde apertura de la app hasta 5 min antes del partido inaugural.
- El usuario selecciona campeón, finalista, semis y cuartos desde listas de las 48 selecciones clasificadas.
- También incluye las 4 predicciones especiales (Bota de Oro, amarillas, Guante, Balón).
- Se bloquea permanentemente en `kickoff_at` del primer partido.

### Modo por partido
- Visible para todos los partidos desde 48h antes del kickoff.
- Formulario: marcador (dos inputs numéricos) + lista de goleadores (multiselect de jugadores del partido) + toggle tarjeta roja + select jugador más faltas.
- Se deshabilita 5 min antes del `kickoff_at`.
- En eliminatorias, los puntos se doblan automáticamente.

---

## 7. Resultados en tiempo real

- **Cloudflare Worker** expone `/api/matches` y `/api/match/:id`.
- Durante partido (`status = 'live'`): Worker consulta KV. Si TTL expirado (30s), llama a API-Football `/fixtures?live=all&league=1&season=2026`, actualiza KV.
- Fuera de partido: TTL de 1h. Máximo estimado ~40 req/día (muy por debajo del límite de 100).
- Cliente hace polling cada 30s solo si hay un partido en estado `live`.
- Al detectar `status = 'finished'`, el Worker actualiza `matches` en Supabase y dispara la Edge Function de puntuación.

---

## 8. Páginas y rutas

| Ruta | Descripción | Auth |
|---|---|---|
| `/` | Landing con CTA "Entrar con Google" | No |
| `/cuadro` | Bracket interactivo + predicciones especiales pre-torneo | Sí |
| `/partidos` | Lista de partidos agrupados por fecha y fase | Sí |
| `/partidos/[id]` | Formulario predicción de un partido específico | Sí |
| `/ranking` | Tabla global + toggle semana + tarjetas usuario | Sí |
| `/logros` | Grid de badges desbloqueados/bloqueados | Sí |
| `/perfil` | Cambiar nombre y foto de avatar | Sí |
| `/admin` | Sincronizar fixtures, recalcular puntos | Solo admin |

---

## 9. Logros (badges)

| Badge key | Nombre | Condición |
|---|---|---|
| `profeta` | Profeta | 5 marcadores exactos en el torneo |
| `madrugador` | Madrugador | Predice >24h antes del kickoff en 10 partidos |
| `underdog` | Underdog | Acierta resultado de un partido considerado sorpresa |
| `hat_trick` | Hat-trick | 3 marcadores exactos consecutivos |
| `vidente_cuadro` | Vidente del Cuadro | Bracket con ≥80% de acierto al llegar a semis |
| `constante` | Constante | Predice todos los partidos de fase de grupos (48) |
| `goleador` | Goleador | 10 goleadores acertados en el torneo |
| `campeon` | Campeón de los Campeones | Acertó el ganador del torneo |

---

## 10. Panel de administración (`/admin`)

Solo accesible para el usuario con email `saul.trujillo@cognitiatech.com` (hardcodeado en middleware de Next.js o RLS policy):
- **Sincronizar fixtures:** llama al Worker que obtiene todos los partidos del Mundial y los upserta en `matches`.
- **Marcar partido finalizado:** útil si la API tarda en actualizar; admin puede forzar el cierre y disparar el scoring.
- **Recalcular puntos:** re-ejecuta la Edge Function para un partido dado (por si hay corrección de datos).

---

## 11. Consideraciones de seguridad

- API-Football key solo en Cloudflare Worker como secret (nunca en el cliente).
- Supabase RLS garantiza que cada usuario solo edite sus propias predicciones.
- Deadline de predicciones se valida en servidor (Edge Function rechaza writes si `now() > kickoff_at - 5min`).
- Supabase Storage bucket `avatars` con policy: solo el propietario puede subir/actualizar su archivo.
- Auth con Google OAuth — sin gestión de contraseñas.

---

## 12. Fases de desarrollo (19 días hasta el 11 de junio)

| Fase | Días | Contenido |
|---|---|---|
| 1. Setup | 1-2 | Repo, Next.js, Cloudflare Pages, Supabase, Google OAuth, deploy vacío |
| 2. Core BD + Auth | 3-4 | Esquema SQL, RLS, login Google, perfil + avatar |
| 3. API Worker + Fixtures | 5-7 | Worker con cache KV, sincronización de los 104 partidos |
| 4. Predicciones por partido | 8-11 | Formularios, validación deadline, guardado en Supabase |
| 5. Cuadro + Especiales | 12-13 | Bracket interactivo, predicciones pre-torneo |
| 6. Scoring + Logros | 14-16 | Edge Function scoring, achievements, leaderboard |
| 7. Ranking + Live UI | 17-18 | Ranking global/semanal, polling live scores, badges |
| 8. QA + Deploy final | 19 | Testing con amigos, fix bugs, deploy producción |
