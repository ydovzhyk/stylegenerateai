export const GENERATION_CREDIT_COST = {
  draft: 1,
  standard: 3,
  premium: 8,
  print: 20,
}

export const GENERATION_PLANS = {
  visitor: {
    planKey: 'visitor',
    title: 'Visitor',
    priceUsd: 0,
    dailyLimit: 3,
    monthlyLimit: 3,
    durationDays: null,
    totalCredits: 3,
    allowedQualities: ['draft'],
    allowedFormats: ['portrait_2_3'],
    allowedGeneratedImageFormats: ['png'],
  },

  free: {
    planKey: 'free',
    title: 'Free',
    priceUsd: 0,
    dailyLimit: 5,
    monthlyLimit: 30,
    durationDays: null,
    totalCredits: 30,
    allowedQualities: ['draft', 'standard'],
    allowedFormats: ['portrait_2_3', 'square_1_1', 'landscape_3_2'],
    allowedGeneratedImageFormats: ['png'],
  },

  basic: {
    planKey: 'basic',
    title: 'Basic',
    priceUsd: 10,
    dailyLimit: null,
    monthlyLimit: null,
    durationDays: 30,
    totalCredits: 120,
    allowedQualities: ['draft', 'standard'],
    allowedFormats: ['portrait_2_3', 'square_1_1', 'landscape_3_2'],
    allowedGeneratedImageFormats: ['png', 'jpeg', 'webp'],
  },

  pro: {
    planKey: 'pro',
    title: 'Pro',
    priceUsd: 20,
    dailyLimit: null,
    monthlyLimit: null,
    durationDays: 30,
    totalCredits: 500,
    allowedQualities: ['draft', 'standard', 'premium', 'print'],
    allowedFormats: ['portrait_2_3', 'square_1_1', 'landscape_3_2'],
    allowedGeneratedImageFormats: ['png', 'jpeg', 'webp'],
  },

  admin: {
    planKey: 'admin',
    title: 'Admin',
    priceUsd: 0,
    dailyLimit: null,
    monthlyLimit: null,
    durationDays: null,
    totalCredits: null,
    allowedQualities: ['draft', 'standard', 'premium', 'print'],
    allowedFormats: ['portrait_2_3', 'square_1_1', 'landscape_3_2'],
    allowedGeneratedImageFormats: ['png', 'jpeg', 'webp'],
  },
}

export function getGenerationPlan(planKey) {
  return GENERATION_PLANS[planKey] || GENERATION_PLANS.free
}

export function getGenerationCreditCost(generationType) {
  return (
    GENERATION_CREDIT_COST[generationType] || GENERATION_CREDIT_COST.standard
  )
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
