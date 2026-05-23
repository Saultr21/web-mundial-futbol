# Setup y Deploy — Mundial 2026 Predicciones

Guía de pasos manuales para poner la app en producción antes del **11 de junio de 2026**.

---

## 1. Supabase (base de datos + auth)

### 1.1 Crear proyecto

1. Ir a [supabase.com](https://supabase.com) → New Project → nombre: `mundial-2026`
2. Copiar las claves del proyecto:
   - **Project URL**: `https://xxxxxxxxxxxx.supabase.co`
   - **anon key**: en Project Settings → API
   - **service_role key**: en Project Settings → API (secreto, nunca exponer)
   - **Project ID**: en Project Settings → General

### 1.2 Rellenar `.env.local`

```env
NEXT_PUBLIC_SUPABASE_URL=https://xxxxxxxxxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIs...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIs...
FOOTBALL_API_KEY=tu-key-de-api-football
ADMIN_EMAIL=saul.trujillo@cognitiatech.com
SUPABASE_PROJECT_ID=xxxxxxxxxxxx
```

### 1.3 Aplicar migraciones

```bash
pnpm add -D supabase
pnpm supabase login
pnpm supabase link --project-ref $SUPABASE_PROJECT_ID
pnpm supabase db push
```

Alternativamente, copiar el contenido de los archivos SQL al **SQL Editor** de Supabase Dashboard:
- `supabase/migrations/20260523000001_schema.sql`
- `supabase/migrations/20260523000002_rls.sql`
- `supabase/migrations/20260523000003_functions.sql`

### 1.4 Generar tipos TypeScript

Tras aplicar las migraciones, regenerar los tipos para TypeScript estricto:

```bash
pnpm supabase:types
```

Esto reemplaza `src/lib/types/database.types.ts` con los tipos reales del esquema.

### 1.5 Google OAuth

1. Ir a [console.cloud.google.com](https://console.cloud.google.com) → APIs & Services → Credentials → Create OAuth 2.0 Client ID
2. Application type: **Web application**
3. Authorized redirect URIs:
   - `https://xxxxxxxxxxxx.supabase.co/auth/v1/callback` (para desarrollo)
   - `https://tu-proyecto.pages.dev/auth/callback` (para producción, añadir después del deploy)
4. Copiar **Client ID** y **Client Secret**

5. En Supabase Dashboard → Authentication → Providers → Google:
   - Enable Google provider
   - Pegar Client ID y Client Secret

6. En Supabase Dashboard → Authentication → URL Configuration:
   - **Site URL**: `https://tu-proyecto.pages.dev`
   - **Redirect URLs**: `https://tu-proyecto.pages.dev/auth/callback`

### 1.6 Storage bucket avatares

Las migraciones crean el bucket automáticamente. Si no, manualmente:

Supabase Dashboard → Storage → New bucket → nombre: `avatars` → Public: ✓

---

## 2. API-Football

1. Registrarse en [api-sports.io](https://api-sports.io)
2. Copiar la API key (100 req/día gratis)
3. Añadir al `.env.local` y al panel de Cloudflare Pages (ver paso 3.4)

**Verificar cobertura:** La API debe tener el Mundial 2026 con `league=1&season=2026`.

---

## 3. Cloudflare Pages

### 3.1 Crear KV namespace

1. Cloudflare Dashboard → Workers & Pages → KV → Create namespace
2. Nombre: `MATCHES_CACHE`
3. Copiar el **Namespace ID**
4. Actualizar `wrangler.toml`:

```toml
[[kv_namespaces]]
binding = "MATCHES_CACHE"
id = "EL_ID_REAL_DEL_NAMESPACE"
```

5. Commit y push:
```bash
git add wrangler.toml
git commit -m "chore: Cloudflare KV namespace ID real"
git push
```

### 3.2 Subir a GitHub

```bash
git remote add origin https://github.com/tu-usuario/mundial-2026.git
git push -u origin main
```

### 3.3 Conectar a Cloudflare Pages

1. Cloudflare Dashboard → Workers & Pages → Create → Pages → Connect to Git
2. Seleccionar repositorio `mundial-2026`
3. Configuración de build:
   - **Framework preset**: Next.js
   - **Build command**: `pnpm run build`
   - **Build output directory**: `.vercel/output/static`

### 3.4 Variables de entorno en Cloudflare Pages

Settings → Environment variables → Add variable (tipo **Secret** para las sensibles):

| Variable | Tipo | Valor |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Text | URL de tu proyecto Supabase |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Text | Anon key de Supabase |
| `SUPABASE_SERVICE_ROLE_KEY` | **Secret** | Service role key (nunca exponer) |
| `FOOTBALL_API_KEY` | **Secret** | API key de api-sports.io |
| `ADMIN_EMAIL` | Text | `saul.trujillo@cognitiatech.com` |

### 3.5 KV namespace binding en Pages

Settings → Functions → KV namespace bindings → Add:
- Variable name: `MATCHES_CACHE`
- KV namespace: seleccionar el que creaste

### 3.6 Verificar deploy

```bash
# Trigger rebuild si hace falta
git commit --allow-empty -m "chore: trigger deploy"
git push
```

Abrir `https://tu-proyecto.pages.dev` y probar login con Google.

---

## 4. Sincronización inicial de fixtures

1. Ir a `https://tu-proyecto.pages.dev/admin` (necesitas estar logueado con `saul.trujillo@cognitiatech.com`)
2. Clic en **Sincronizar fixtures**
3. Debe mostrar: ✅ 104 partidos sincronizados
4. Ir a `/partidos` y verificar que aparecen los partidos del Mundial

---

## 5. Tests

```bash
pnpm test:run
```

Esperado: **23/23 tests PASS**

---

## 6. Checklist pre-torneo (antes del 11 junio)

- [ ] Login con Google funciona desde móvil
- [ ] Cuadro se puede guardar y se bloquea al llegar la fecha
- [ ] Predicciones por partido se guardan correctamente
- [ ] Predicciones se bloquean 5 min antes del partido
- [ ] Ranking muestra puntos (puede estar vacío hasta que haya partidos)
- [ ] Logros aparecen en la galería (todos bloqueados hasta que se ganen)
- [ ] Panel admin sincroniza fixtures correctamente
- [ ] Avatar se sube y se muestra en perfil
- [ ] Funciona en mobile

---

## Problemas comunes

**"Cannot find module KVNamespace"** → Está excluido del TS compiler por diseño (Cloudflare runtime); ignorar.

**"Supabase types returning never"** → Regenerar con `pnpm supabase:types` después de aplicar migraciones.

**Login no funciona (redirect loop)** → Verificar que la URL de callback en Google Console y Supabase URL Configuration están correctamente configuradas con el dominio de Pages.

**Avatar upload falla** → Verificar que el bucket `avatars` es público y que las políticas de storage están aplicadas.
