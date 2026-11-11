'use client'

import { useEffect, useState } from 'react'
import Button from '@/components/shared/button/Button'
import Text from '@/components/shared/text/Text'
import {
  axiosGetPhotoLabImageSettings,
  axiosUpdatePhotoLabImageSettings,
} from '@/services/api/photo-lab'

export default function AdminImageProviderSwitch({ className = '' }) {
  const [provider, setProvider] = useState('openai')
  const [providerLabel, setProviderLabel] = useState('OpenAI')
  const [providerOptions, setProviderOptions] = useState([
    { id: 'openai', label: 'OpenAI' },
    { id: 'gemini', label: 'Gemini' },
  ])
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    let cancelled = false
    axiosGetPhotoLabImageSettings()
      .then((data) => {
        if (cancelled || !data) return
        if (data.provider) setProvider(data.provider)
        if (data.providerLabel) setProviderLabel(data.providerLabel)
        if (Array.isArray(data.providers) && data.providers.length) {
          setProviderOptions(data.providers)
        }
      })
      .catch(() => {})
    return () => {
      cancelled = true
    }
  }, [])

  const handleProviderChange = async (nextProvider) => {
    if (!nextProvider || nextProvider === provider || isSaving) return
    setIsSaving(true)
    setError('')
    try {
      const data = await axiosUpdatePhotoLabImageSettings({
        provider: nextProvider,
      })
      setProvider(data.provider || nextProvider)
      setProviderLabel(data.providerLabel || nextProvider)
      if (Array.isArray(data.providers) && data.providers.length) {
        setProviderOptions(data.providers)
      }
    } catch (err) {
      setError(String(err?.message || 'Failed to update image provider'))
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div
      className={`w-full max-w-sm rounded-2xl border border-white/10 bg-white/[0.03] p-3 sm:p-3.5 ${className}`.trim()}
    >
      <Text as="p" variant="caption" color="soft" caseMode="sentence">
        Image provider
      </Text>
      <Text
        as="p"
        variant="caption"
        color="muted"
        caseMode="sentence"
        className="mt-1 leading-5"
      >
        Active: {providerLabel}. Photo Lab, Create Your Look, Imagine. Masked
        edits stay on OpenAI.
      </Text>
      <div className="mt-2.5 grid grid-cols-2 gap-2">
        {providerOptions.map((item) => (
          <Button
            key={item.id}
            type="button"
            variant="secondary"
            shape="soft"
            active={provider === item.id}
            disabled={isSaving}
            onClick={() => handleProviderChange(item.id)}
            className="h-9 min-h-9 justify-center px-3 text-sm font-medium"
          >
            {item.label}
          </Button>
        ))}
      </div>
      {error ? (
        <Text
          as="p"
          variant="caption"
          color="muted"
          caseMode="sentence"
          className="mt-2 text-red-300"
        >
          {error}
        </Text>
      ) : null}
    </div>
  )
}
