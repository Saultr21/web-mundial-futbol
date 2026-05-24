'use client'
export const runtime = 'edge'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { Database } from '@/lib/types/database.types'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar'

type Profile = Database['public']['Tables']['profiles']['Row']

export default function PerfilPage() {
  const supabase = createClient()
  const [displayName, setDisplayName] = useState('')
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null)
  const [userId, setUserId] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      setUserId(user.id)
      const { data } = await supabase.from('profiles').select('*').eq('id', user.id).single<Profile>()
      if (data) { setDisplayName(data.display_name); setAvatarUrl(data.avatar_url) }
    }
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function uploadAvatar(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file || !userId) return
    const path = `${userId}/${file.name}`
    const { data, error } = await supabase.storage.from('avatars').upload(path, file, { upsert: true })
    if (error) { alert('Error subiendo avatar: ' + error.message); return }
    const { data: { publicUrl } } = supabase.storage.from('avatars').getPublicUrl(data.path)
    setAvatarUrl(publicUrl)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (supabase.from('profiles') as any).update({ avatar_url: publicUrl }).eq('id', userId)
  }

  async function save() {
    setSaving(true)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (supabase.from('profiles') as any).update({ display_name: displayName }).eq('id', userId)
    setSaving(false)
    if (error) { alert('Error guardando: ' + error.message); return }
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
