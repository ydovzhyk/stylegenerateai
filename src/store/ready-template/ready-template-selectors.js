export const getReadyTemplateError = ({ readyTemplate }) => readyTemplate.error
export const getReadyTemplateMessage = ({ readyTemplate }) =>
  readyTemplate.message
export const getReadyTemplateLoading = ({ readyTemplate }) =>
  readyTemplate.loading

export const getReadyTemplateCategories = ({ readyTemplate }) =>
  readyTemplate.categories

//resolve-prompt-metadata
export const getReadyTemplatePromtCategory = ({ readyTemplate }) =>
  readyTemplate.promptCategory
export const getReadyTemplateSuggestedTitle = ({ readyTemplate }) =>
  readyTemplate.suggestedTitle
export const getReadyTemplateSuggestedTags = ({ readyTemplate }) =>
  readyTemplate.suggestedTags
export const getReadyTemplateResolveMetadataLoading = ({ readyTemplate }) =>
  readyTemplate.resolveMetadataLoading

// autogenerate
export const getReadyTemplateAutoGenerationLoading = ({ readyTemplate }) =>
  readyTemplate.autoGenerationLoading
