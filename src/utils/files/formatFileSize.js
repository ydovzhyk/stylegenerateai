export function formatFileSize(bytes) {
  const value = Number(bytes)

  if (!Number.isFinite(value) || value <= 0) {
    return ''
  }

  const units = ['B', 'KB', 'MB', 'GB']
  let size = value
  let unitIndex = 0

  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024
    unitIndex += 1
  }

  const digits = unitIndex === 0 || size >= 10 ? 0 : 1

  return `${size.toFixed(digits)} ${units[unitIndex]}`
}
