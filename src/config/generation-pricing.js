import GENERATION_PRICING_LIBRARY from './generation-pricing.library.json'

function resolveProductConfig({ productKey, modeKey = null }) {
  const product = GENERATION_PRICING_LIBRARY.products?.[productKey]

  if (!product) {
    throw new Error(`Unknown pricing product: ${productKey}`)
  }

  if (productKey === 'photo_lab') {
    const mode = product.modes?.[modeKey]

    if (!mode) {
      throw new Error(`Unknown Photo Lab pricing mode: ${modeKey}`)
    }

    return { product, mode, modeKey }
  }

  return { product, mode: null, modeKey: null }
}

function resolvePlanConfig({ productKey, modeKey = null, planKey }) {
  const { product, mode } = resolveProductConfig({ productKey, modeKey })
  const planConfig =
    productKey === 'photo_lab'
      ? mode.plans?.[planKey]
      : product.plans?.[planKey]

  if (!planConfig) {
    throw new Error(`Unknown pricing plan: ${planKey}`)
  }

  return {
    product,
    mode,
    planConfig,
    wallet: GENERATION_PRICING_LIBRARY.plans?.[planKey]?.wallet || null,
  }
}

function normalizeSelections(planConfig, selections = {}) {
  const pricing = planConfig.pricing || {}
  const fixedSelections = pricing.fixedSelections || {}
  const forcedSelections = pricing.forcedSelections || {}

  return {
    ...selections,
    ...fixedSelections,
    ...forcedSelections,
  }
}

function getOptionEntry(planConfig, groupKey, optionId) {
  return planConfig.options?.[groupKey]?.[optionId] || null
}

export function getPlanDefinition(planKey) {
  const plan =
    GENERATION_PRICING_LIBRARY.plans?.[planKey] ||
    GENERATION_PRICING_LIBRARY.plans?.free

  const wallet = plan?.wallet || {}

  return {
    planKey,
    title: plan?.title || planKey,
    totalCredits: wallet.totalCredits ?? null,
    dailyLimit: wallet.dailyGenerations ?? null,
    monthlyLimit: wallet.monthlyGenerations ?? null,
    durationDays: wallet.durationDays ?? null,
    priceUsd: wallet.priceUsd ?? null,
    priceUah: wallet.priceUah ?? null,
    unlimited: Boolean(wallet.unlimited),
  }
}

export function getAvailableOptionIds(options = {}, groupKey) {
  const group = options[groupKey] || {}

  return Object.entries(group)
    .filter(([, option]) => option?.available)
    .map(([optionId]) => optionId)
}

export function getAllowedGeneratedImageFormats({
  planKey,
  productKey = 'ready_template',
  modeKey = null,
}) {
  try {
    const { options } = listPlanOptions({ productKey, modeKey, planKey })

    return getAvailableOptionIds(options, 'generatedImageFormat')
  } catch {
    return ['png']
  }
}

export function getOptionCredits({
  planKey,
  productKey,
  modeKey = null,
  groupKey,
  optionId,
}) {
  try {
    const { options } = listPlanOptions({ productKey, modeKey, planKey })
    const option = options?.[groupKey]?.[optionId]

    if (!option?.available) return null

    return Number(option.credits || 0)
  } catch {
    return null
  }
}

export function resolveFrontendPlanKey(user, isLogin) {
  if (!isLogin) return 'visitor'

  if (user?.role === 'admin') return 'admin'

  const generationPlan = user?.generationPlan || {}
  const planKey = generationPlan.planKey || 'free'
  const status = generationPlan.status || 'free'

  if ((planKey === 'basic' || planKey === 'pro') && status === 'active') {
    return planKey
  }

  return 'free'
}

export function quoteGeneration({
  planKey,
  productKey,
  modeKey = null,
  selections = {},
}) {
  if (planKey === 'admin') {
    return {
      allowed: true,
      totalCredits: 0,
      breakdown: [],
      selections,
      isUnlimited: true,
    }
  }

  const { planConfig, wallet } = resolvePlanConfig({
    productKey,
    modeKey,
    planKey,
  })

  if (planConfig.modeAccess?.available === false) {
    return {
      allowed: false,
      totalCredits: null,
      breakdown: [],
      selections,
      reason: planConfig.modeAccess.lockedReason || 'mode_not_available',
    }
  }

  const normalizedSelections = normalizeSelections(planConfig, selections)
  const pricing = planConfig.pricing || {}
  const components = Array.isArray(pricing.components) ? pricing.components : []
  const breakdown = []
  let totalCredits = Number(pricing.baseCredits || 0)

  if (pricing.baseCredits) {
    breakdown.push({
      group: 'base',
      id: 'base',
      label: 'Base generation',
      credits: pricing.baseCredits,
    })
  }

  for (const groupKey of components) {
    const optionId = normalizedSelections[groupKey]

    if (!optionId) {
      return {
        allowed: false,
        totalCredits: null,
        breakdown,
        selections: normalizedSelections,
        reason: `missing_selection:${groupKey}`,
      }
    }

    const option = getOptionEntry(planConfig, groupKey, optionId)

    if (!option?.available) {
      return {
        allowed: false,
        totalCredits: null,
        breakdown,
        selections: normalizedSelections,
        reason: option?.lockedReason || `locked_option:${groupKey}:${optionId}`,
      }
    }

    const credits = Number(option.credits || 0)

    breakdown.push({
      group: groupKey,
      id: optionId,
      label: option.label || optionId,
      credits,
    })

    totalCredits += credits
  }

  return {
    allowed: true,
    totalCredits,
    breakdown,
    selections: normalizedSelections,
    wallet,
    isUnlimited: false,
  }
}

export function listPlanOptions({ productKey, modeKey = null, planKey }) {
  const { planConfig } = resolvePlanConfig({ productKey, modeKey, planKey })

  return {
    modeAccess: planConfig.modeAccess || { available: true },
    pricing: planConfig.pricing || {},
    options: planConfig.options || {},
  }
}

export { GENERATION_PRICING_LIBRARY }
