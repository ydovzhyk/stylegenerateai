import { createSlice } from '@reduxjs/toolkit'
import {
  autogenerateReadyTemplates,
  createReadyTemplate,
  deleteReadyTemplate,
  editReadyTemplate,
  generateReadyTemplatePreview,
  getCategories,
  resolvePromptMetadata,
  getYourLookPreviewTemplates,
  getYourLookSearchTemplates,
} from './ready-template-operations'

const initialState = {
  error: null,
  message: null,
  loading: false,

  categories: [],
  readyTemplates: null,

  autoGenerationLoading: false,

  // resolve-prompt-metadata
  promptCategory: null,
  suggestedTitle: null,
  suggestedTags: null,
  resolveMetadataLoading: false,

  // create-your-look
  yourLookPreviewTemplates: {
    man: [],
    woman: [],
  },
  yourLookFeaturedTemplates: [],

  // create-your-look search
  yourLookSearchTemplates: [],
  createYourLookSearchParams: {
    query: '',
    selectedCategory: 'All',
    page: 1,
    limit: 10,
  },
  hasMoreSearchResults: false,
  yourLookSearchLoading: false,
  isEmptyResultsSearch: false,
  isManualSearch: false,
}

const errMsg = (payload) =>
  payload?.data?.message ||
  payload?.message ||
  'Oops, something went wrong, try again'

const okMsg = (payload, fallback) => payload?.message || fallback

const readyTemplate = createSlice({
  name: 'readyTemplate',
  initialState,
  reducers: {
    clearReadyTemplateError: (state) => {
      state.error = null
    },
    clearReadyTemplateMessage: (state) => {
      state.message = null
    },
    setReadyTemplateError: (state, action) => {
      state.error = action.payload
    },
    clearResolvePromptMetadata: (state) => {
      state.promptCategory = null
      state.suggestedTitle = null
      state.suggestedTags = null
    },
    setCreateYourLookSearchParams: (state, action) => {
      state.createYourLookSearchParams = {
        ...state.createYourLookSearchParams,
        ...action.payload,
      }
    },
    clearCreateYourLookSearchTemplates: (state) => {
      state.yourLookSearchTemplates = []
      state.hasMoreSearchResults = false
    },
    resetCreateYourLookSearchState: (state) => {
      state.yourLookSearchTemplates = []
      state.hasMoreSearchResults = false
      state.yourLookSearchLoading = false
      state.isEmptyResultsSearch = false
      state.createYourLookSearchParams = {
        query: '',
        selectedCategory: 'All',
        page: 1,
        limit: 10,
      }
    },
    setIsManualSearch: (state, action) => {
      state.isManualSearch = action.payload
    }
  },

  extraReducers: (builder) => {
    builder
      // GET CATEGORIES
      .addCase(getCategories.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(getCategories.fulfilled, (state, { payload }) => {
        state.loading = false
        state.categories = payload.values || []
      })
      .addCase(getCategories.rejected, (state, { payload }) => {
        state.loading = false
        state.error = errMsg(payload)
      })

      // RESOLVE PROMPT METADATA
      .addCase(resolvePromptMetadata.pending, (state) => {
        state.resolveMetadataLoading = true
        state.error = null
        state.message = null
        state.promptCategory = null
        state.suggestedTitle = null
        state.suggestedTags = null
      })
      .addCase(resolvePromptMetadata.fulfilled, (state, { payload }) => {
        state.resolveMetadataLoading = false
        state.promptCategory = payload.promptCategory || null
        state.suggestedTitle = payload.suggestedTitle || null
        state.suggestedTags = payload.suggestedTags || null
        state.categories = payload.values || state.categories
        state.message = payload.message || null
      })
      .addCase(resolvePromptMetadata.rejected, (state, { payload }) => {
        state.resolveMetadataLoading = false
        state.error = errMsg(payload)
      })

      // GENERATE PREVIEW
      .addCase(generateReadyTemplatePreview.pending, (state) => {
        state.error = null
        state.message = null
      })
      .addCase(generateReadyTemplatePreview.fulfilled, (state, { payload }) => {
        state.message = okMsg(payload, 'Preview generated successfully')
      })
      .addCase(generateReadyTemplatePreview.rejected, (state, { payload }) => {
        state.error = errMsg(payload)
      })

      // CREATE TEMPLATE
      .addCase(createReadyTemplate.pending, (state) => {
        state.error = null
        state.message = null
      })
      .addCase(createReadyTemplate.fulfilled, (state, { payload }) => {
        state.message = okMsg(payload, 'Template added successfully')
      })
      .addCase(createReadyTemplate.rejected, (state, { payload }) => {
        state.error = errMsg(payload)
      })

      // EDIT TEMPLATE
      .addCase(editReadyTemplate.pending, (state) => {
        state.loading = true
        state.error = null
        state.message = null
      })
      .addCase(editReadyTemplate.fulfilled, (state, { payload }) => {
        state.loading = false
        state.message = okMsg(payload, 'Template updated successfully')
      })
      .addCase(editReadyTemplate.rejected, (state, { payload }) => {
        state.loading = false
        state.error = errMsg(payload)
      })

      // DELETE TEMPLATE
      .addCase(deleteReadyTemplate.pending, (state) => {
        state.loading = true
        state.error = null
        state.message = null
      })
      .addCase(deleteReadyTemplate.fulfilled, (state, { payload }) => {
        state.loading = false
        state.message = okMsg(payload, 'Template deleted successfully')
      })
      .addCase(deleteReadyTemplate.rejected, (state, { payload }) => {
        state.loading = false
        state.error = errMsg(payload)
      })

      // AUTOGENERATE READY TEMPLATES
      .addCase(autogenerateReadyTemplates.pending, (state) => {
        state.autoGenerationLoading = true
        state.error = null
        state.message = null
      })
      .addCase(autogenerateReadyTemplates.fulfilled, (state, { payload }) => {
        state.autoGenerationLoading = false
        state.message = okMsg(payload, 'Templates autogenerated successfully')
      })
      .addCase(autogenerateReadyTemplates.rejected, (state, { payload }) => {
        state.autoGenerationLoading = false
        state.error = errMsg(payload)
      })

      // GET YOUR LOOK PREVIEW TEMPLATES
      .addCase(getYourLookPreviewTemplates.pending, (state) => {
        state.error = null
      })
      .addCase(getYourLookPreviewTemplates.fulfilled, (state, { payload }) => {
        state.yourLookPreviewTemplates = {
          man: payload?.values?.man || [],
          woman: payload?.values?.woman || [],
        }
      })
      .addCase(getYourLookPreviewTemplates.rejected, (state, { payload }) => {
        state.error = errMsg(payload)
      })

      // GET YOUR LOOK SEARCH TEMPLATES
      .addCase(getYourLookSearchTemplates.pending, (state) => {
        state.yourLookSearchLoading = true
        state.error = null
        state.isEmptyResultsSearch = false
      })
      .addCase(
        getYourLookSearchTemplates.fulfilled,
        (state, { payload, meta }) => {
          const mode = meta.arg?.mode || 'replace'
          const nextTemplates = payload?.templates || []

          state.yourLookSearchLoading = false
          state.hasMoreSearchResults = payload?.hasMore || false

          if (mode === 'append') {
            state.yourLookSearchTemplates = [
              ...state.yourLookSearchTemplates,
              ...nextTemplates,
            ]
            return
          }

          if (nextTemplates.length > 0) {
            state.yourLookSearchTemplates = nextTemplates
            state.isEmptyResultsSearch = false
          } else {
            state.isEmptyResultsSearch = true
            state.isManualSearch = false
          }
        },
      )
      .addCase(getYourLookSearchTemplates.rejected, (state, { payload }) => {
        state.yourLookSearchLoading = false
        state.isManualSearch = false
        state.error = errMsg(payload)
      })
  },
})

export default readyTemplate.reducer

export const {
  clearReadyTemplateError,
  clearReadyTemplateMessage,
  setReadyTemplateError,
  clearResolvePromptMetadata,
  setCreateYourLookSearchParams,
  clearCreateYourLookSearchTemplates,
  resetCreateYourLookSearchState,
  setIsManualSearch,
} = readyTemplate.actions
