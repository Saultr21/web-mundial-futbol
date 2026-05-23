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
          <div
            key={key}
            className={`flex flex-col items-center gap-2 p-4 rounded-lg border text-center transition-all ${isUnlocked ? 'bg-yellow-50 border-yellow-300 dark:bg-yellow-950 dark:border-yellow-700' : 'opacity-40 grayscale'}`}
          >
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
