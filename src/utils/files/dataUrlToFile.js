export function dataUrlToFile(dataUrl, filename = 'generated-preview.png') {
  const [meta, content] = String(dataUrl || '').split(',')
  const mimeMatch = meta?.match(/data:(.*?);base64/)
  const mime = mimeMatch?.[1] || 'image/png'
  const binary = atob(content || '')
  const len = binary.length
  const bytes = new Uint8Array(len)

  for (let i = 0; i < len; i += 1) {
    bytes[i] = binary.charCodeAt(i)
  }

  return new File([bytes], filename, { type: mime })
}
