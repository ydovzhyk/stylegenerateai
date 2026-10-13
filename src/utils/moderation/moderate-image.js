export const PHOTO_FLAGGED_MESSAGE =
  'This photo was flagged as suspicious. Please upload a different photo.'

export const PHOTO_CHECK_FAILED_MESSAGE =
  'We could not check this photo. Please upload it again.'

export const PHOTO_CHECK_PENDING_MESSAGE = 'Checking your photo...'

export function imageCheckKey(file) {
  return `${file.name}:${file.size}:${file.lastModified}`
}

export async function moderateUploadedImage(file) {
  const formData = new FormData()
  formData.append('image', file)

  const response = await fetch('/api/moderate-image', {
    method: 'POST',
    body: formData,
  })

  const data = await response.json().catch(() => null)

  if (!response.ok) {
    throw new Error(data?.error || 'MODERATION_FAILED')
  }

  return {
    flagged: Boolean(data?.flagged),
  }
}
