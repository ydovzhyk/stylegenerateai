export const AI_MODEL_IDS = ['classic', 'newest']

export const CLASSIC_AI_MODEL = 'classic'
export const NEWEST_AI_MODEL = 'newest'

export const DEFAULT_AI_MODEL = CLASSIC_AI_MODEL

export const OPENAI_IMAGE_MODEL_BY_AI_MODEL = {
  classic: 'gpt-image-1.5',
  newest: 'gpt-image-2',
}

export const AI_MODEL_META = {
  classic: {
    label: 'Classic',
    description:
      'Proven model with Photo likeness control (balanced or closer to original).',
  },
  newest: {
    label: 'Newest',
    description:
      'Latest OpenAI image model. Always uses maximum photo likeness automatically.',
  },
}

export function getAiModelMeta(aiModelId) {
  return AI_MODEL_META[aiModelId] || AI_MODEL_META[DEFAULT_AI_MODEL]
}

export function resolveOpenAIImageModel(aiModelId = DEFAULT_AI_MODEL) {
  return (
    OPENAI_IMAGE_MODEL_BY_AI_MODEL[aiModelId] ||
    OPENAI_IMAGE_MODEL_BY_AI_MODEL[DEFAULT_AI_MODEL]
  )
}

export function isNewestAiModel(aiModelId) {
  return String(aiModelId || '').trim() === NEWEST_AI_MODEL
}

export function resolveEffectiveModelPreset({
  aiModel = DEFAULT_AI_MODEL,
  modelPreset,
  fallbackPreset = 'identity',
}) {
  if (isNewestAiModel(aiModel)) {
    return fallbackPreset
  }

  return modelPreset || fallbackPreset
}
