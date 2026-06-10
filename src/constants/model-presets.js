export const CLIENT_MODEL_PRESET_IDS = ['balanced', 'identity']

export const DEFAULT_MODEL_PRESET = 'balanced'

export const CLIENT_MODEL_PRESET_META = {
  balanced: {
    label: 'Default',
    description: 'Balanced improvement for most photos.',
  },
  identity: {
    label: 'Closer to original',
    description: 'Stronger likeness to your uploaded photo.',
  },
}

export function getClientPresetMeta(presetId) {
  return (
    CLIENT_MODEL_PRESET_META[presetId] ||
    CLIENT_MODEL_PRESET_META[DEFAULT_MODEL_PRESET]
  )
}
