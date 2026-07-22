import { instance } from './instance'

const DEFAULT_POLL_MS = 2000
const MAX_POLL_MS = 5000
const MAX_WAIT_MS = 10 * 60 * 1000

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

function resolveVisitorIdFromFormData(formData) {
  if (!formData || typeof formData.get !== 'function') return ''
  return String(formData.get('visitorId') || '').trim()
}

export const axiosGetGenerationJob = async (jobId, visitorId) => {
  const params = {
    _ts: Date.now(),
  }

  if (visitorId) {
    params.visitorId = visitorId
  }

  const { data } = await instance.get(`/generation-jobs/${jobId}`, {
    params,
    headers: {
      'Cache-Control': 'no-cache',
      Pragma: 'no-cache',
    },
  })

  return data
}

export async function waitForGenerationJob(jobId, visitorId = '') {
  const startedAt = Date.now()
  let delayMs = DEFAULT_POLL_MS

  while (Date.now() - startedAt < MAX_WAIT_MS) {
    const status = await axiosGetGenerationJob(jobId, visitorId)

    if (status?.status === 'ready' && status?.previewUrl) {
      return status
    }

    if (status?.status === 'failed') {
      const error = new Error(
        status?.errorMessage || 'Generation failed. Please try again.',
      )
      error.response = {
        status: status?.errorCode === 'IMAGE_SAFETY_BLOCKED' ? 400 : 500,
        data: {
          message: status?.errorMessage || 'Generation failed. Please try again.',
          code: status?.errorCode || 'GENERATION_FAILED',
        },
      }
      throw error
    }

    const nextDelay = Number(status?.pollAfterMs)
    delayMs = Number.isFinite(nextDelay)
      ? Math.min(MAX_POLL_MS, Math.max(1000, nextDelay))
      : DEFAULT_POLL_MS

    await sleep(delayMs)
  }

  const timeoutError = new Error(
    'Generation is taking too long. Please try again in a moment.',
  )
  timeoutError.response = {
    status: 504,
    data: {
      message: 'Generation is taking too long. Please try again in a moment.',
      code: 'GENERATION_TIMEOUT',
    },
  }
  throw timeoutError
}

export async function resolveGenerationResponse(data, formData) {
  if (!data?.jobId) {
    return data
  }

  if (data?.status === 'ready' && data?.previewUrl) {
    return data
  }

  if (data?.status && data.status !== 'processing') {
    return data
  }

  const visitorId = resolveVisitorIdFromFormData(formData)
  return waitForGenerationJob(data.jobId, visitorId)
}
