'use client'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

export function LogoutButton() {
  const router = useRouter()

  async function logout() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  return (
    <button
      onClick={logout}
      className="text-xs font-medium px-3 py-1.5 rounded-md transition-colors duration-150 cursor-pointer"
      style={{
        color: 'oklch(0.52 0.01 255)',
        border: '1px solid oklch(0.20 0.01 255)',
        background: 'transparent',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.color = 'oklch(0.93 0.005 255)'
        e.currentTarget.style.borderColor = 'oklch(0.72 0.22 145)'
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.color = 'oklch(0.52 0.01 255)'
        e.currentTarget.style.borderColor = 'oklch(0.20 0.01 255)'
      }}
    >
      Salir
    </button>
  )
}
