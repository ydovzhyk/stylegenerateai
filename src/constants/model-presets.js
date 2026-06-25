export const CLIENT_MODEL_PRESET_IDS = ['balanced', 'identity']

export const DEFAULT_MODEL_PRESET = 'balanced'

export const ENHANCE_QUALITY_DEFAULT_MODEL_PRESET = 'identity'

export const CLIENT_MODEL_PRESET_META = {
  balanced: {
    label: 'More enhancement',
    description:
      'Stronger cleanup, but small scene or face details may shift slightly.',
  },
  identity: {
    label: 'Closer to original',
    description:
      'Maximum likeness to your uploaded photo. Safer for face and background.',
  },
}

export function getClientPresetMeta(presetId) {
  return (
    CLIENT_MODEL_PRESET_META[presetId] ||
    CLIENT_MODEL_PRESET_META[DEFAULT_MODEL_PRESET]
  )
}

export function resolveDefaultModelPreset(modeKey, allowedPresets = []) {
  const preferredPreset =
    modeKey === 'enhance_quality'
      ? ENHANCE_QUALITY_DEFAULT_MODEL_PRESET
      : DEFAULT_MODEL_PRESET

  if (allowedPresets.includes(preferredPreset)) {
    return preferredPreset
  }

  if (allowedPresets.includes(DEFAULT_MODEL_PRESET)) {
    return DEFAULT_MODEL_PRESET
  }

  return allowedPresets[0] || DEFAULT_MODEL_PRESET
}
