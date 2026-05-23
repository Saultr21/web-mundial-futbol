'use client'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export default function LoginPage() {
  const supabase = createClient()

  async function loginWithGoogle() {
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/auth/callback?next=/partidos` },
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
