export const GENERATION_PLANS = {
  visitor: {
    planKey: 'visitor',
    title: 'Visitor',
    dailyLimit: 3,
    monthlyLimit: 3,
    allowedQualities: ['draft'],
    allowedFormats: ['portrait_2_3'],
  },

  free: {
    planKey: 'free',
    title: 'Free',
    dailyLimit: 5,
    monthlyLimit: 30,
    allowedQualities: ['draft', 'standard'],
    allowedFormats: ['portrait_2_3'],
  },

  basic: {
    planKey: 'basic',
    title: 'Basic',
    dailyLimit: 20,
    monthlyLimit: 300,
    allowedQualities: ['draft', 'standard'],
    allowedFormats: ['portrait_2_3', 'square_1_1', 'landscape_3_2'],
  },

  pro: {
    planKey: 'pro',
    title: 'Pro',
    dailyLimit: 40,
    monthlyLimit: 800,
    allowedQualities: ['draft', 'standard', 'premium'],
    allowedFormats: ['portrait_2_3', 'square_1_1', 'landscape_3_2'],
  },

  admin: {
    planKey: 'admin',
    title: 'Admin',
    dailyLimit: null,
    monthlyLimit: null,
    allowedQualities: ['draft', 'standard', 'premium', 'print'],
    allowedFormats: ['portrait_2_3', 'square_1_1', 'landscape_3_2'],
  },
}

export function getGenerationPlan(planKey) {
  return GENERATION_PLANS[planKey] || GENERATION_PLANS.free
}

export function resolveFrontendPlanKey(user, isLogin) {
  if (!isLogin) return 'visitor'

  if (user?.role === 'admin') return 'admin'

  const planKey = user?.subscription?.planKey || 'free'
  const status = user?.subscription?.status || 'free'

  if ((planKey === 'basic' || planKey === 'pro') && status === 'active') {
    return planKey
  }

  return 'free'
}
