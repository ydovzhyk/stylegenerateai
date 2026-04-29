'use client'

import { useSelector } from 'react-redux'
import clsx from 'clsx'
import { Sparkles, Infinity } from 'lucide-react'
import Text from '@/components/shared/text/Text'
import { getGenerationUsageData } from '@/store/generation-usage/generation-usage-selectors'

function getEffectiveValues(usage) {
  const remainingDaily = Number(usage?.remainingDaily ?? 0)
  const remainingMonthly = Number(usage?.remainingMonthly ?? 0)

  const dailyLimit = Number(usage?.dailyLimit ?? 0)
  const monthlyLimit = Number(usage?.monthlyLimit ?? 0)

  const remaining = Math.max(Math.min(remainingDaily, remainingMonthly), 0)

  const limit = Math.max(Math.min(dailyLimit, monthlyLimit), 0)

  return { remaining, limit }
}

function getUsageLabel(usage) {
  if (usage?.isUnlimited) {
    return (
      <Text as="span" variant="caption" color="white" caseMode="sentence">
        Unlimited
      </Text>
    )
  }

  const { remaining, limit } = getEffectiveValues(usage)

  return `${remaining}/${limit}`
}

function getPlanLabel(planKey = '') {
  if (planKey === 'visitor') return 'Demo'
  if (planKey === 'free') return 'Free'
  if (planKey === 'basic') return 'Basic'
  if (planKey === 'pro') return 'Pro'
  if (planKey === 'admin') return 'Admin'
  return 'Plan'
}

export default function GenerationUsageBadge({ compact = false, className }) {
  const usage = useSelector(getGenerationUsageData)

  const hasUsage = usage?.planKey || usage?.isUnlimited
  if (!hasUsage) return null

  const { remaining, limit } = getEffectiveValues(usage)

  const isLow =
    !usage?.isUnlimited && limit > 0 && remaining <= Math.ceil(limit * 0.25)

  return (
    <div
      className={clsx(
        'inline-flex h-[40px] items-center gap-2 rounded-2xl border px-3',
        'bg-white/[0.04] text-white shadow-[0_0_0_1px_rgba(124,92,255,0.08)] backdrop-blur-sm',
        isLow ? 'border-amber-300/30' : 'border-white/10',
        className,
      )}
      title={
        usage?.isUnlimited
          ? 'Unlimited generations'
          : `${remaining} available now. Daily left: ${usage?.remainingDaily}, monthly left: ${usage?.remainingMonthly}`
      }
    >
      <span
        className={clsx(
          'flex h-7 w-7 shrink-0 items-center justify-center rounded-full border',
          isLow
            ? 'border-amber-300/25 bg-amber-300/10 text-amber-200'
            : 'border-primary/25 bg-primary/15 text-primary-soft',
        )}
      >
        {usage?.isUnlimited ? <Infinity size={15} /> : <Sparkles size={15} />}
      </span>

      <span className="min-w-0">
        <Text
          as="span"
          variant="caption"
          color="muted"
          className="block leading-none"
        >
          {getPlanLabel(usage.planKey)}
        </Text>

        <span className="block whitespace-nowrap text-sm font-semibold leading-tight text-white md:text-base">
          {compact ? (
            getUsageLabel(usage)
          ) : (
            <>
              {getUsageLabel(usage)}{' '}
              <Text as="span" variant="caption" color="white" caseMode="lower">
                left today
              </Text>
            </>
          )}
        </span>
      </span>
    </div>
  )
}
