import { createClient } from '@/lib/supabase/server'
import { BracketForm } from '@/components/bracket/BracketForm'
import { SpecialPredictionsForm } from '@/components/predictions/SpecialPredictionsForm'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import type { Bracket, SpecialPrediction } from '@/lib/types/app'

const TOURNAMENT_START = new Date('2026-06-11T20:00:00Z')

export default async function CuadroPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const supabaseAny = supabase as any
  const [{ data: bracketRaw }, { data: specialRaw }] = await Promise.all([
    supabaseAny.from('brackets').select('*').eq('user_id', user!.id).maybeSingle(),
    supabaseAny.from('special_predictions').select('*').eq('user_id', user!.id).maybeSingle(),
  ])

  const bracket = bracketRaw as Bracket | null
  const special = specialRaw as SpecialPrediction | null

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
