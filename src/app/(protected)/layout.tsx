export const runtime = 'edge'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { LogoutButton } from '@/components/layout/LogoutButton'

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
        <div className="ml-auto flex items-center gap-3">
          <Link href="/perfil" className="text-sm">{user.email ?? 'Perfil'}</Link>
          <LogoutButton />
        </div>
      </nav>
      <main className="container mx-auto px-4 py-6">{children}</main>
    </div>
  )
}
