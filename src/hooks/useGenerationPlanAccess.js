import { useCallback, useEffect, useMemo, useState } from 'react'
import { useSelector } from 'react-redux'
import { getLogin, getUser } from '@/store/auth/auth-selectors'

import {
  DEFAULT_OUTPUT_FORMAT,
  OUTPUT_FORMATS,
} from '@/constants/output-formats'

import {
  DEFAULT_PHOTO_QUALITY,
  PHOTO_QUALITIES,
} from '@/constants/photo-quality'

import {
  DEFAULT_GENERATED_IMAGE_FORMAT,
  GENERATED_IMAGE_FORMATS,
} from '@/constants/generated-image-formats'

import {
  getAvailableOptionIds,
  getOptionCredits,
  getPlanDefinition,
  listPlanOptions,
  quoteGeneration,
  resolveFrontendPlanKey,
} from '@/config/generation-pricing'

import {
  CLIENT_MODEL_PRESET_IDS,
  DEFAULT_MODEL_PRESET,
  getClientPresetMeta,
} from '@/constants/model-presets'

export function getLockedText({ planKey, isLogin, lockedReason }) {
  if (lockedReason === 'sign_in_required' || (!isLogin && planKey === 'visitor')) {
    return 'Sign in to unlock this option.'
  }

  if (lockedReason === 'plan_pro_required') {
    return 'Upgrade to Pro to unlock this option.'
  }

  if (lockedReason === 'plan_basic_required') {
    return 'Upgrade to a paid plan to unlock this option.'
  }

  if (planKey === 'free') {
    return 'Upgrade to a paid plan to unlock this option.'
  }

  return 'This option is not available for your plan.'
}

export function getPlanHint({ planKey, activePlan, creditCost }) {
  if (planKey === 'admin') {
    return 'Admin mode has no generation limits.'
  }

  if (planKey === 'pro') {
    return `Pro plan includes ${activePlan.totalCredits} credits for ${activePlan.durationDays} days. Premium and Print modes are unlocked.`
  }

  if (planKey === 'basic') {
    return `Basic plan includes ${activePlan.totalCredits} credits for ${activePlan.durationDays} days.`
  }

  if (creditCost != null) {
    return `Your plan includes ${activePlan.totalCredits} credits. This generation costs ${creditCost} credit${creditCost === 1 ? '' : 's'}.`
  }

  return `Your plan includes ${activePlan.totalCredits} credits.`
}

function resolveAllowedValue(value, allowedValues = [], fallbackValue) {
  if (!allowedValues.length) return fallbackValue
  if (allowedValues.includes(value)) return value
  if (allowedValues.includes(fallbackValue)) return fallbackValue
  return allowedValues[0] || fallbackValue
}

function buildPresetOptions(planOptions = {}) {
  const presets = planOptions.modelPreset || {}

  return CLIENT_MODEL_PRESET_IDS.filter((id) => presets[id]).map((id) => {
    const option = presets[id] || {}
    const clientMeta = getClientPresetMeta(id)

    return {
      id,
      label: clientMeta.label,
      description: clientMeta.description,
      credits: option.available ? Number(option.credits || 0) : null,
      available: Boolean(option.available),
      lockedReason: option.lockedReason || null,
    }
  })
}

export default function useGenerationPlanAccess({
  productKey = 'ready_template',
  modeKey = null,
  resetKey = null,
} = {}) {
  const isLogin = useSelector(getLogin)
  const user = useSelector(getUser)

  const planKey = useMemo(
    () => resolveFrontendPlanKey(user, isLogin),
    [user, isLogin],
  )

  const activePlan = useMemo(() => getPlanDefinition(planKey), [planKey])

  const planOptions = useMemo(() => {
    try {
      return listPlanOptions({ productKey, modeKey, planKey })
    } catch {
      return {
        modeAccess: { available: false },
        pricing: {},
        options: {},
      }
    }
  }, [productKey, modeKey, planKey])

  const allowedQualities = useMemo(
    () => getAvailableOptionIds(planOptions.options, 'photoQuality'),
    [planOptions.options],
  )

  const allowedFormats = useMemo(
    () => getAvailableOptionIds(planOptions.options, 'outputFormat'),
    [planOptions.options],
  )

  const allowedModelPresets = useMemo(
    () => getAvailableOptionIds(planOptions.options, 'modelPreset'),
    [planOptions.options],
  )

  const allowedGeneratedImageFormats = useMemo(() => {
    const fromLibrary = getAvailableOptionIds(
      planOptions.options,
      'generatedImageFormat',
    )

    return fromLibrary.length
      ? fromLibrary
      : Object.keys(GENERATED_IMAGE_FORMATS)
  }, [planOptions.options])

  const defaultPhotoQuality = allowedQualities.includes('draft')
    ? 'draft'
    : allowedQualities.includes(DEFAULT_PHOTO_QUALITY)
      ? DEFAULT_PHOTO_QUALITY
      : allowedQualities[0] || DEFAULT_PHOTO_QUALITY

  const defaultOutputFormat = allowedFormats.includes(DEFAULT_OUTPUT_FORMAT)
    ? DEFAULT_OUTPUT_FORMAT
    : allowedFormats[0] || DEFAULT_OUTPUT_FORMAT

  const defaultModelPreset = allowedModelPresets.includes(DEFAULT_MODEL_PRESET)
    ? DEFAULT_MODEL_PRESET
    : allowedModelPresets[0] || DEFAULT_MODEL_PRESET

  const [selectedOutputFormat, setSelectedOutputFormat] = useState(
    defaultOutputFormat,
  )
  const [selectedPhotoQuality, setSelectedPhotoQuality] = useState(
    defaultPhotoQuality,
  )
  const [selectedModelPreset, setSelectedModelPreset] = useState(
    defaultModelPreset,
  )
  const [selectedGeneratedImageFormat, setSelectedGeneratedImageFormat] =
    useState(DEFAULT_GENERATED_IMAGE_FORMAT)

  useEffect(() => {
    setSelectedPhotoQuality(defaultPhotoQuality)
    setSelectedOutputFormat(defaultOutputFormat)
    setSelectedModelPreset(defaultModelPreset)
    setSelectedGeneratedImageFormat(
      allowedGeneratedImageFormats.includes(DEFAULT_GENERATED_IMAGE_FORMAT)
        ? DEFAULT_GENERATED_IMAGE_FORMAT
        : allowedGeneratedImageFormats[0] || DEFAULT_GENERATED_IMAGE_FORMAT,
    )
  }, [
    resetKey,
    productKey,
    modeKey,
    planKey,
    defaultPhotoQuality,
    defaultOutputFormat,
    defaultModelPreset,
    allowedGeneratedImageFormats,
  ])

  const outputFormat = useMemo(() => {
    return resolveAllowedValue(
      selectedOutputFormat,
      allowedFormats,
      defaultOutputFormat,
    )
  }, [
    selectedOutputFormat,
    allowedFormats,
    defaultOutputFormat,
  ])

  const photoQuality = useMemo(() => {
    return resolveAllowedValue(
      selectedPhotoQuality,
      allowedQualities,
      defaultPhotoQuality,
    )
  }, [
    selectedPhotoQuality,
    allowedQualities,
    defaultPhotoQuality,
  ])

  const modelPreset = useMemo(() => {
    return resolveAllowedValue(
      selectedModelPreset,
      allowedModelPresets,
      defaultModelPreset,
    )
  }, [
    selectedModelPreset,
    allowedModelPresets,
    defaultModelPreset,
  ])

  const generatedImageFormat = useMemo(() => {
    return resolveAllowedValue(
      selectedGeneratedImageFormat,
      allowedGeneratedImageFormats,
      DEFAULT_GENERATED_IMAGE_FORMAT,
    )
  }, [selectedGeneratedImageFormat, allowedGeneratedImageFormats])

  const generationQuote = useMemo(() => {
    const selections = {
      photoQuality,
      outputFormat,
      modelPreset,
    }

    return quoteGeneration({
      planKey,
      productKey,
      modeKey,
      selections,
    })
  }, [
    planKey,
    productKey,
    modeKey,
    photoQuality,
    outputFormat,
    modelPreset,
  ])

  const closerPresetCreditDelta = useMemo(() => {
    if (
      !allowedModelPresets.includes('balanced') ||
      !allowedModelPresets.includes('identity')
    ) {
      return 0
    }

    const baseSelections = {
      photoQuality,
      outputFormat,
      modelPreset: 'balanced',
    }

    const closerSelections = {
      photoQuality,
      outputFormat,
      modelPreset: 'identity',
    }

    const defaultQuote = quoteGeneration({
      planKey,
      productKey,
      modeKey,
      selections: baseSelections,
    })

    const closerQuote = quoteGeneration({
      planKey,
      productKey,
      modeKey,
      selections: closerSelections,
    })

    return Math.max(
      (closerQuote.totalCredits || 0) - (defaultQuote.totalCredits || 0),
      0,
    )
  }, [
    allowedModelPresets,
    planKey,
    productKey,
    modeKey,
    photoQuality,
    outputFormat,
  ])

  const getOptionLockedReason = useCallback(
    (groupKey, optionId) => {
      return planOptions.options?.[groupKey]?.[optionId]?.lockedReason || null
    },
    [planOptions.options],
  )

  const isFormatAllowed = useCallback(
    (id) => allowedFormats.includes(id),
    [allowedFormats],
  )

  const isQualityAllowed = useCallback(
    (id) => allowedQualities.includes(id),
    [allowedQualities],
  )

  const isModelPresetAllowed = useCallback(
    (id) => allowedModelPresets.includes(id),
    [allowedModelPresets],
  )

  const isGeneratedImageFormatAllowed = useCallback(
    (id) => allowedGeneratedImageFormats.includes(id),
    [allowedGeneratedImageFormats],
  )

  const getQualityCredits = useCallback(
    (id) =>
      getOptionCredits({
        planKey,
        productKey,
        modeKey,
        groupKey: 'photoQuality',
        optionId: id,
      }),
    [planKey, productKey, modeKey],
  )

  const getFormatCredits = useCallback(
    (id) =>
      getOptionCredits({
        planKey,
        productKey,
        modeKey,
        groupKey: 'outputFormat',
        optionId: id,
      }),
    [planKey, productKey, modeKey],
  )

  const getPresetCredits = useCallback(
    (id) =>
      getOptionCredits({
        planKey,
        productKey,
        modeKey,
        groupKey: 'modelPreset',
        optionId: id,
      }),
    [planKey, productKey, modeKey],
  )

  const setOutputFormat = useCallback(
    (id) => {
      if (!allowedFormats.includes(id)) return
      setSelectedOutputFormat(id)
    },
    [allowedFormats],
  )

  const setPhotoQuality = useCallback(
    (id) => {
      if (!allowedQualities.includes(id)) return
      setSelectedPhotoQuality(id)
    },
    [allowedQualities],
  )

  const setModelPreset = useCallback(
    (id) => {
      if (!allowedModelPresets.includes(id)) return
      setSelectedModelPreset(id)
    },
    [allowedModelPresets],
  )

  const setGeneratedImageFormat = useCallback(
    (id) => {
      if (!allowedGeneratedImageFormats.includes(id)) return
      setSelectedGeneratedImageFormat(id)
    },
    [allowedGeneratedImageFormats],
  )

  return {
    isLogin,
    user,
    planKey,
    activePlan,
    productKey,
    modeKey,
    modeAccess: planOptions.modeAccess,

    outputFormat,
    setOutputFormat,
    outputFormats: Object.values(OUTPUT_FORMATS),

    photoQuality,
    setPhotoQuality,
    photoQualities: Object.values(PHOTO_QUALITIES),

    modelPreset,
    setModelPreset,
    modelPresets: buildPresetOptions(planOptions.options),
    showModelPreset: allowedModelPresets.length > 0,

    generatedImageFormat,
    setGeneratedImageFormat,
    generatedImageFormats: Object.values(GENERATED_IMAGE_FORMATS),

    creditCost: generationQuote.totalCredits,
    creditBreakdown: generationQuote.breakdown,
    generationQuote,
    closerPresetCreditDelta,
    canGenerate: generationQuote.allowed === true,

    lockedText: getLockedText({ planKey, isLogin }),
    planHint: getPlanHint({
      planKey,
      activePlan,
      creditCost: generationQuote.totalCredits,
    }),

    isFormatAllowed,
    isQualityAllowed,
    isModelPresetAllowed,
    isGeneratedImageFormatAllowed,
    getOptionLockedReason,
    getQualityCredits,
    getFormatCredits,
    getPresetCredits,
  }
}
