'use client'

import clsx from 'clsx'
import Text from '@/components/shared/text/Text'

export default function PhotoLabModes({ modes, selectedModeId, onSelectMode }) {
  return (
    <section>
      <div className="mb-5 max-w-2xl">
        <Text as="h2" variant="h2" color="white" caseMode="sentence">
          Choose what you want to improve
        </Text>

        <Text
          as="p"
          variant="body-sm"
          color="muted"
          caseMode="sentence"
          className="mt-2"
        >
          Start with a ready-made AI mode. Each mode changes the workspace,
          prompt suggestions, and generation behavior.
        </Text>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {modes.map((mode) => {
          const Icon = mode.icon
          const active = selectedModeId === mode.id

          return (
            <button
              key={mode.id}
              type="button"
              onClick={() => onSelectMode(mode.id)}
              className={clsx(
                'group relative overflow-hidden rounded-[28px] border p-5 text-left transition duration-300',
                active
                  ? 'border-primary/50 bg-white/[0.06] shadow-[0_0_0_1px_rgba(124,92,255,0.18),0_18px_50px_rgba(0,0,0,0.32)]'
                  : 'border-white/10 bg-white/[0.025] hover:border-cyan-400/30 hover:bg-white/[0.045]',
              )}
            >
              <div
                className={clsx(
                  'absolute inset-0 opacity-0 blur-2xl transition duration-300 group-hover:opacity-100',
                  active && 'opacity-100',
                  `bg-gradient-to-br ${mode.accent}`,
                )}
              />

              <div className="relative z-[1]">
                <span className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.06] text-primary-soft">
                  <Icon size={22} />
                </span>

                <Text
                  as="p"
                  variant="caption"
                  color="soft"
                  caseMode="sentence"
                  className="mb-1"
                >
                  {mode.label}
                </Text>

                <Text as="h3" variant="body" color="white" caseMode="sentence">
                  {mode.title}
                </Text>

                <Text
                  as="p"
                  variant="caption"
                  color="muted"
                  caseMode="sentence"
                  className="mt-2 leading-6"
                >
                  {mode.description}
                </Text>
              </div>
            </button>
          )
        })}
      </div>
    </section>
  )
}
