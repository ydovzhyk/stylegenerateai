export const getReadyTemplateError = ({ readyTemplate }) => readyTemplate.error
export const getReadyTemplateMessage = ({ readyTemplate }) =>
  readyTemplate.message
export const getReadyTemplateLoading = ({ readyTemplate }) =>
  readyTemplate.loading

export const getReadyTemplateCategories = ({ readyTemplate }) =>
  readyTemplate.categories

// resolve-prompt-metadata
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

// create-your-look
export const getYourLookPreviewTemplates = ({ readyTemplate }) =>
  readyTemplate.yourLookPreviewTemplates

// create-your-look search
export const getYourLookSearchTemplates = ({ readyTemplate }) =>
  readyTemplate.yourLookSearchTemplates

export const getCreateYourLookSearchParams = ({ readyTemplate }) =>
  readyTemplate.createYourLookSearchParams

export const getHasMoreSearchResults = ({ readyTemplate }) =>
  readyTemplate.hasMoreSearchResults

export const getYourLookSearchLoading = ({ readyTemplate }) =>
  readyTemplate.yourLookSearchLoading
