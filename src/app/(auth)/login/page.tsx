'use client'
import { createClient } from '@/lib/supabase/client'

export default function LoginPage() {
  async function loginWithGoogle() {
    const supabase = createClient()
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/auth/callback?next=/partidos` },
    })
  }

  return (
    <main
      style={{
        background:
          'radial-gradient(ellipse at 50% 0%, oklch(0.20 0.12 145 / 0.4) 0%, oklch(0.07 0.006 255) 70%)',
        minHeight: '100vh',
      }}
      className="flex items-center justify-center relative overflow-hidden"
    >
      {/* Decoración SVG — líneas de campo de fútbol */}
      <svg
        className="absolute inset-0 w-full h-full opacity-[0.04]"
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 800 600"
        preserveAspectRatio="xMidYMid slice"
        aria-hidden="true"
      >
        {/* Borde del campo */}
        <rect x="40" y="40" width="720" height="520" fill="none" stroke="white" strokeWidth="3" />
        {/* Línea central */}
        <line x1="400" y1="40" x2="400" y2="560" stroke="white" strokeWidth="2" />
        {/* Círculo central */}
        <circle cx="400" cy="300" r="80" fill="none" stroke="white" strokeWidth="2" />
        {/* Punto central */}
        <circle cx="400" cy="300" r="4" fill="white" />
        {/* Área penal izquierda */}
        <rect x="40" y="175" width="110" height="250" fill="none" stroke="white" strokeWidth="2" />
        {/* Área pequeña izquierda */}
        <rect x="40" y="230" width="45" height="140" fill="none" stroke="white" strokeWidth="2" />
        {/* Área penal derecha */}
        <rect x="650" y="175" width="110" height="250" fill="none" stroke="white" strokeWidth="2" />
        {/* Área pequeña derecha */}
        <rect x="715" y="230" width="45" height="140" fill="none" stroke="white" strokeWidth="2" />
        {/* Punto penal izquierdo */}
        <circle cx="125" cy="300" r="4" fill="white" />
        {/* Punto penal derecho */}
        <circle cx="675" cy="300" r="4" fill="white" />
        {/* Arcos de área izquierda */}
        <path d="M 150 220 A 80 80 0 0 1 150 380" fill="none" stroke="white" strokeWidth="2" />
        {/* Arcos de área derecha */}
        <path d="M 650 220 A 80 80 0 0 0 650 380" fill="none" stroke="white" strokeWidth="2" />
      </svg>

      <div className="relative z-10 flex flex-col items-center gap-8 p-8 max-w-sm w-full">
        {/* Balón con glow verde */}
        <div
          style={{ filter: 'drop-shadow(0 0 40px oklch(0.72 0.22 145 / 0.6))' }}
          className="text-8xl select-none"
          aria-hidden="true"
        >
          ⚽
        </div>

        {/* Título */}
        <div className="text-center">
          <h1
            className="text-[7rem] leading-none"
            style={{
              fontFamily: 'var(--font-bebas), Bebas Neue, sans-serif',
              background: 'linear-gradient(180deg, #ffffff 0%, oklch(0.72 0.22 145) 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
            }}
          >
            MUNDIAL
            <br />
            2026
          </h1>
          <p
            className="mt-3 text-xs tracking-[0.3em] uppercase"
            style={{ color: 'oklch(0.52 0.01 255)' }}
          >
            Predicciones&nbsp;·&nbsp;Competición&nbsp;·&nbsp;Gloria
          </p>
        </div>

        {/* Botón Google */}
        <button
          onClick={loginWithGoogle}
          className="w-full flex items-center justify-center gap-3 px-6 py-4 rounded-xl text-sm font-medium transition-all duration-200 cursor-pointer"
          style={{
            background: 'oklch(0.16 0.008 255)',
            border: '1px solid oklch(0.25 0.01 255)',
            color: 'oklch(0.93 0.005 255)',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.borderColor = 'oklch(0.72 0.22 145)'
            e.currentTarget.style.boxShadow = '0 0 20px oklch(0.72 0.22 145 / 0.15)'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = 'oklch(0.25 0.01 255)'
            e.currentTarget.style.boxShadow = 'none'
          }}
        >
          {/* Google G logo */}
          <svg viewBox="0 0 24 24" className="w-5 h-5 shrink-0" aria-hidden="true">
            <path
              fill="#4285F4"
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            />
            <path
              fill="#34A853"
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            />
            <path
              fill="#FBBC05"
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
            />
            <path
              fill="#EA4335"
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
            />
          </svg>
          Continuar con Google
        </button>

        {/* Nota de pie */}
        <p className="text-center text-xs" style={{ color: 'oklch(0.40 0.008 255)' }}>
          Solo para participantes del grupo · Mundial 2026
        </p>
      </div>
    </main>
  )
}
