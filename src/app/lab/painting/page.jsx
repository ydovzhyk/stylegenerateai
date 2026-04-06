'use client'

import { useState } from 'react'

export default function PaintingLabPage() {
  const [file, setFile] = useState(null)
  const [style, setStyle] = useState('oil painting')
  const [prompt, setPrompt] = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState(null)

  const handleGenerate = async () => {
    if (!file) return

    const formData = new FormData()
    formData.append('image', file)
    formData.append('style', style)
    formData.append('prompt', prompt)

    try {
      setLoading(true)

      console.log('Намагаємося відправити')

      const res = await fetch('http://localhost:4000/api/generate-painting', {
        method: 'POST',
        body: formData,
      })

      console.log('Отримали відповідь', res)

      const data = await res.json()
      setResult(data.image)
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-neutral-100 p-6">
      <div className="mx-auto max-w-5xl space-y-6">
        <h1 className="text-2xl font-semibold">🎨 Painting Lab</h1>

        {/* Upload */}
        <div className="rounded-xl bg-white p-4">
          <input type="file" onChange={(e) => setFile(e.target.files[0])} />
        </div>

        {/* Controls */}
        <div className="rounded-xl bg-white p-4 space-y-3">
          <input
            className="w-full border p-2 rounded"
            value={style}
            onChange={(e) => setStyle(e.target.value)}
            placeholder="Style"
          />

          <textarea
            className="w-full border p-2 rounded"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="Additional prompt"
          />

          <button
            onClick={handleGenerate}
            className="bg-black text-white px-4 py-2 rounded"
          >
            {loading ? 'Generating...' : 'Generate'}
          </button>
        </div>

        {/* Result */}
        <div className="rounded-xl bg-white p-4">
          {result && (
            <img src={result} alt="result" className="w-full rounded" />
          )}
        </div>
      </div>
    </div>
  )
}
