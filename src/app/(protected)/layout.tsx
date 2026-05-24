export const runtime = 'edge'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { LogoutButton } from '@/components/layout/LogoutButton'

const NAV_LINKS = [
  { href: '/partidos', label: 'Partidos' },
  { href: '/cuadro', label: 'Cuadro' },
  { href: '/ranking', label: 'Ranking' },
  { href: '/logros', label: 'Logros' },
] as const

export default async function ProtectedLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const emailDisplay = user.email
    ? user.email.length > 22
      ? user.email.slice(0, 20) + '…'
      : user.email
    : 'Perfil'

  return (
    <div className="min-h-screen" style={{ background: 'oklch(0.07 0.006 255)' }}>
      {/* Navbar */}
      <nav
        className="sticky top-0 z-50 flex items-center gap-1 px-4 h-14"
        style={{
          background: 'oklch(0.09 0.007 255)',
          borderBottom: '1px solid oklch(0.20 0.01 255)',
          backdropFilter: 'blur(12px)',
        }}
      >
        {/* Logo */}
        <Link
          href="/partidos"
          className="flex items-center gap-2 mr-4 shrink-0"
          style={{ textDecoration: 'none' }}
        >
          <span className="text-xl leading-none" aria-hidden="true">⚽</span>
          <span
            className="text-xl tracking-widest"
            style={{
              fontFamily: 'var(--font-bebas), Bebas Neue, sans-serif',
              color: 'oklch(0.93 0.005 255)',
            }}
          >
            MUNDIAL&nbsp;26
          </span>
        </Link>

        {/* Links de navegación */}
        <div className="flex items-center gap-1 flex-1">
          {NAV_LINKS.map(({ href, label }) => (
            <Link
              key={href}
              href={href}
              className="px-3 py-1.5 rounded-md text-sm font-medium transition-colors duration-150"
              style={{
                color: 'oklch(0.52 0.01 255)',
              }}
              onMouseEnter={undefined}
            >
              {label}
            </Link>
          ))}
        </div>

        {/* Usuario + logout */}
        <div className="flex items-center gap-3 ml-auto shrink-0">
          <Link
            href="/perfil"
            className="text-xs hidden sm:block transition-colors duration-150"
            style={{ color: 'oklch(0.52 0.01 255)' }}
          >
            {emailDisplay}
          </Link>
          <LogoutButton />
        </div>
      </nav>

      <main className="container mx-auto px-4 py-6">{children}</main>
    </div>
  )
}
