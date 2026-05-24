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
            className="flex flex-col items-center gap-3 p-5 rounded-xl text-center transition-all duration-200"
            style={
              isUnlocked
                ? {
                    background:
                      'linear-gradient(135deg, oklch(0.18 0.04 80 / 0.6) 0%, oklch(0.14 0.02 255 / 0.8) 100%)',
                    border: '1px solid oklch(0.75 0.18 70 / 0.4)',
                    boxShadow: '0 0 20px oklch(0.75 0.18 70 / 0.1)',
                  }
                : {
                    background: 'oklch(0.11 0.008 255)',
                    border: '1px solid oklch(0.20 0.01 255)',
                    opacity: 0.45,
                    filter: 'grayscale(1)',
                  }
            }
          >
            {/* Icono */}
            <div
              className="text-4xl leading-none"
              style={
                isUnlocked
                  ? { filter: 'drop-shadow(0 0 12px oklch(0.75 0.18 70 / 0.6))' }
                  : undefined
              }
              aria-hidden="true"
            >
              {meta.emoji}
            </div>

            {/* Nombre */}
            <span
              className="text-sm font-semibold leading-tight"
              style={{
                color: isUnlocked ? 'oklch(0.93 0.005 255)' : 'oklch(0.60 0.005 255)',
              }}
            >
              {meta.label}
            </span>

            {/* Descripción */}
            <span
              className="text-xs leading-snug"
              style={{ color: 'oklch(0.52 0.01 255)' }}
            >
              {meta.description}
            </span>

            {/* Estado desbloqueado */}
            {isUnlocked && (
              <span
                className="text-xs font-bold uppercase tracking-wider px-2 py-0.5 rounded-full"
                style={{
                  background: 'oklch(0.75 0.18 70 / 0.2)',
                  color: 'oklch(0.85 0.16 75)',
                }}
              >
                ✓ Desbloqueado
              </span>
            )}
          </div>
        )
      })}
    </div>
  )
}
