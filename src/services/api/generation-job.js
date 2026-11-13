import { instance } from './instance'

const DEFAULT_POLL_MS = 2000
const MAX_POLL_MS = 5000
const DEFAULT_MAX_WAIT_MS = 10 * 60 * 1000

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

function resolvePollContext(context) {
  if (!context) {
    return { visitorId: '', maxWaitMs: DEFAULT_MAX_WAIT_MS }
  }

  if (typeof context.get === 'function') {
    return {
      visitorId: String(context.get('visitorId') || '').trim(),
      maxWaitMs: DEFAULT_MAX_WAIT_MS,
    }
  }

  return {
    visitorId: String(context.visitorId || '').trim(),
    maxWaitMs:
      Number.isFinite(Number(context.maxWaitMs)) && Number(context.maxWaitMs) > 0
        ? Number(context.maxWaitMs)
        : DEFAULT_MAX_WAIT_MS,
  }
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

export const axiosDiscardGenerationJob = async (jobId, visitorId) => {
  const params = {
    _ts: Date.now(),
  }

  if (visitorId) {
    params.visitorId = visitorId
  }

  const { data } = await instance.delete(`/generation-jobs/${jobId}`, {
    params,
  })

  return data
}

export const axiosExportGenerationJob = async (
  jobId,
  { photoQuality, fileFormat, title, visitorId } = {},
) => {
  // Large Premium/Print PNG (~10MB+) often fails with axios ERR_NETWORK in the
  // browser even when the server returns 200. Use fetch for the binary body.
  const API_URL = process.env.NEXT_PUBLIC_API_URL
  const response = await fetch(
    `${API_URL}/api/generation-jobs/${encodeURIComponent(jobId)}/export`,
    {
      method: 'POST',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json, image/*, */*',
      },
      body: JSON.stringify({
        photoQuality,
        fileFormat: fileFormat || undefined,
        title: title || undefined,
        visitorId: visitorId || undefined,
      }),
    },
  )

  const contentType = String(response.headers.get('content-type') || '')

  if (response.status === 202 || contentType.includes('application/json')) {
    const payload = await response.json().catch(() => ({}))

    if (!response.ok && response.status !== 202) {
      const error = new Error(
        payload?.message || `Export failed (${response.status})`,
      )
      error.status = response.status
      error.data = payload
      throw error
    }

    return payload
  }

  if (!response.ok) {
    const error = new Error(`Export failed (${response.status})`)
    error.status = response.status
    throw error
  }

  const blob = await response.blob()

  if (!blob || blob.size < 1) {
    throw new Error('Export file is missing')
  }

  return {
    blob,
    contentType,
    fileFormat: response.headers.get('x-generated-image-format'),
  }
}

function discardGenerationJobInBackground(jobId, visitorId = '') {
  if (!jobId) return

  void axiosDiscardGenerationJob(jobId, visitorId).catch(() => {
    // TTL still cleans up if discard fails.
  })
}

export async function waitForGenerationJob(
  jobId,
  visitorId = '',
  maxWaitMs = DEFAULT_MAX_WAIT_MS,
) {
  const startedAt = Date.now()
  let delayMs = DEFAULT_POLL_MS

  while (Date.now() - startedAt < maxWaitMs) {
    const status = await axiosGetGenerationJob(jobId, visitorId)

    if (status?.status === 'ready') {
      // Keep the job until download/export or TTL - master buffer is needed for Export size.
      return status
    }

    if (status?.status === 'failed') {
      discardGenerationJobInBackground(jobId, visitorId)
      const error = new Error(
        status?.errorMessage || 'Generation failed. Please try again.',
      )
      error.response = {
        status: status?.errorCode === 'IMAGE_SAFETY_BLOCKED' ? 400 : 500,
        data: {
          message:
            status?.errorMessage || 'Generation failed. Please try again.',
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

export async function resolveGenerationResponse(data, context) {
  if (!data?.jobId) {
    return data
  }

  if (data?.status === 'ready') {
    // Keep the job for deferred export/download; TTL still cleans up.
    return data
  }

  if (data?.status && data.status !== 'processing') {
    return data
  }

  const { visitorId, maxWaitMs } = resolvePollContext(context)
  return waitForGenerationJob(data.jobId, visitorId, maxWaitMs)
}
