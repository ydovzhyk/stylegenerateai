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
  generateYourLookClientImage,
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
  yourLookPreviewLoading: false,
  yourLookPreviewHasMore: {
    man: true,
    woman: true,
  },

  // create-your-look search
  yourLookSearchTemplates: [],
  createYourLookSearchParams: {
    query: '',
    selectedCategory: 'All',
    page: 1,
    limit: 10,
    railMode: 'latest',
  },
  hasMoreSearchResults: false,
  yourLookSearchLoading: false,
  isEmptyResultsSearch: false,
  isManualSearch: false,
  yourLookSearchInitialized: false,

  // selected template for create image from client image
  selectedYourLookTemplate: null,
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
      state.yourLookSearchInitialized = false
      state.createYourLookSearchParams = {
        query: '',
        selectedCategory: 'All',
        page: 1,
        limit: 10,
        railMode: 'latest',
      }
    },
    setIsManualSearch: (state, action) => {
      state.isManualSearch = action.payload
    },
    setSelectedYourLookTemplate: (state, action) => {
      state.selectedYourLookTemplate = action.payload
    },
    clearSelectedYourLookTemplate: (state) => {
      state.selectedYourLookTemplate = null
    },
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

        const deletedId = payload?.id

        if (deletedId) {
          state.yourLookSearchTemplates = state.yourLookSearchTemplates.filter(
            (item) => String(item?._id) !== String(deletedId),
          )

          state.yourLookPreviewTemplates.man =
            state.yourLookPreviewTemplates.man.filter(
              (item) => String(item?._id) !== String(deletedId),
            )

          state.yourLookPreviewTemplates.woman =
            state.yourLookPreviewTemplates.woman.filter(
              (item) => String(item?._id) !== String(deletedId),
            )

          if (
            state.selectedYourLookTemplate &&
            String(state.selectedYourLookTemplate.id) === String(deletedId)
          ) {
            state.selectedYourLookTemplate = null
          }
        }
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
        state.yourLookPreviewLoading = true
      })
      .addCase(
        getYourLookPreviewTemplates.fulfilled,
        (state, { payload, meta }) => {
          const mode = meta.arg?.mode || 'replace'

          const nextMan = payload?.values?.man || []
          const nextWoman = payload?.values?.woman || []

          state.yourLookPreviewLoading = false
          state.yourLookPreviewHasMore = {
            man: payload?.meta?.hasMoreMan ?? nextMan.length > 0,
            woman: payload?.meta?.hasMoreWoman ?? nextWoman.length > 0,
          }

          if (mode === 'append') {
            const existingIds = new Set([
              ...state.yourLookPreviewTemplates.man.map((item) =>
                String(item?._id),
              ),
              ...state.yourLookPreviewTemplates.woman.map((item) =>
                String(item?._id),
              ),
            ])

            state.yourLookPreviewTemplates.man = [
              ...state.yourLookPreviewTemplates.man,
              ...nextMan.filter((item) => !existingIds.has(String(item?._id))),
            ]

            state.yourLookPreviewTemplates.woman = [
              ...state.yourLookPreviewTemplates.woman,
              ...nextWoman.filter(
                (item) => !existingIds.has(String(item?._id)),
              ),
            ]

            return
          }

          state.yourLookPreviewTemplates = {
            man: nextMan,
            woman: nextWoman,
          }
        },
      )
      .addCase(getYourLookPreviewTemplates.rejected, (state, { payload }) => {
        state.yourLookPreviewLoading = false
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
          state.yourLookSearchInitialized = true
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
        state.yourLookSearchInitialized = true
        state.isManualSearch = false
        state.error = errMsg(payload)
      })

      // GENERATE YOUR LOOK CLIENT IMAGE
      .addCase(generateYourLookClientImage.pending, (state) => {
        state.error = null
        state.message = null
      })
      .addCase(generateYourLookClientImage.fulfilled, (state, { payload }) => {
        state.message = payload?.message || 'Image generated successfully'
      })
      .addCase(generateYourLookClientImage.rejected, (state, { payload }) => {
        state.error = errMsg(payload)
        state.message = null
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
  setSelectedYourLookTemplate,
  clearSelectedYourLookTemplate,
} = readyTemplate.actions
