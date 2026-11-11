'use client'

import { useCallback, useEffect, useState } from 'react'
import { axiosGetAnimateConfig } from '@/services/api/animate'
import {
  DEFAULT_ANIMATE_PROVIDER,
  getAnimateDefaultsFromConfig,
} from '@/constants/animate'

export default function useAnimateGenerationConfig() {
  const [config, setConfig] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const applyConfig = useCallback((data) => {
    if (!data || typeof data !== 'object') {
      setConfig(null)
      return null
    }
    setConfig(data)
    return data
  }, [])

  const reload = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const data = await axiosGetAnimateConfig()
      return applyConfig(data)
    } catch (err) {
      setError(String(err?.message || 'Failed to load Animate config'))
      setConfig(null)
      return null
    } finally {
      setLoading(false)
    }
  }, [applyConfig])

  useEffect(() => {
    reload()
  }, [reload])

  const provider = config?.provider || DEFAULT_ANIMATE_PROVIDER
  const providerLabel =
    config?.providerLabel ||
    (provider === 'minimax' ? 'MiniMax' : 'Kling')
  const defaults = getAnimateDefaultsFromConfig(config)

  return {
    config,
    loading,
    error,
    reload,
    applyConfig,
    provider,
    providerLabel,
    defaults,
  }
}
