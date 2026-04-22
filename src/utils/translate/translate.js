'use client'

import { useMemo, useState, useEffect } from 'react'
import { useLanguage } from '@/providers/languageContext'
import Select from '@/components/shared/select/Select'
import Image from 'next/image'
import languagesAndCodes from './languagesAndCodes'

const STORAGE_KEY = 'style-generate-ai.settings'

function writeSettings(patch) {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    const prev = raw ? JSON.parse(raw) : {}
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...prev, ...patch }))
  } catch {}
}

function Flag({ src, alt }) {
  return (
    <Image
      src={src}
      alt={alt}
      width={18}
      height={18}
      className="h-[18px] w-[18px] shrink-0 object-cover"
      draggable={false}
    />
  )
}

function renderLanguageOption(option) {
  return (
    <div className="flex items-center gap-2">
      <Flag src={option.flag} alt={option.lang} />
      <span className="text-md font-medium leading-none">{option.ui}</span>
    </div>
  )
}

export default function TranslateMe() {
  const { languageIndex, hydrated, updateLanguageIndex } = useLanguage()

  const options = useMemo(() => {
    const langs = languagesAndCodes?.languages ?? []

    return langs.map((lang, idx) => ({
      value: idx,
      label: lang.ui,
      ...lang,
    }))
  }, [])

  if (!hydrated) return null
  if (!options.length) return null

  const value = options[languageIndex] || options[0]

  return (
    <div className="lang-select">
      <Select
        id="language-select"
        className="w-[110px] h-[40px]"
        classNamePrefix="langrs"
        options={options}
        value={value}
        onChange={(opt) => {
          const idx = Number(opt?.value)
          if (!Number.isFinite(idx)) return

          updateLanguageIndex(idx)
          writeSettings({ selectedIndex: idx })
        }}
        placeholder="Language"
        isSearchable={false}
        isClearable={false}
        menuPlacement="bottom"
        formatOptionLabel={(option) => renderLanguageOption(option)}
        hideHelp={true}
      />
    </div>
  )
}

const _cache = new Map() // key: `${to}::${text}`

function capitalizeFirst(text = '') {
  if (!text) return ''
  return text.charAt(0).toUpperCase() + text.slice(1)
}

function toSentenceCase(text = '') {
  const trimmed = String(text ?? '')
  if (!trimmed) return ''
  return capitalizeFirst(trimmed)
}

function toLowerCaseSafe(text = '') {
  return String(text ?? '').toLowerCase()
}

function toTitleCase(text = '') {
  return String(text ?? '').replace(/\p{L}[\p{L}\p{M}'’-]*/gu, (word) =>
    capitalizeFirst(word.toLowerCase()),
  )
}

export function applyCaseMode(text = '', mode = 'none') {
  const value = String(text ?? '')
  if (!value) return ''

  switch (mode) {
    case 'sentence':
      return toSentenceCase(value)
    case 'lower':
      return toLowerCaseSafe(value)
    case 'title':
      return toTitleCase(value)
    default:
      return value
  }
}

function detectCaseModeFromSource(source = '') {
  const value = String(source ?? '').trim()
  if (!value) return 'none'

  if (value === value.toLowerCase()) return 'none'

  const firstChar = value.charAt(0)
  const hasUpperFirst =
    firstChar &&
    firstChar === firstChar.toUpperCase() &&
    firstChar !== firstChar.toLowerCase()

  if (hasUpperFirst) return 'sentence'

  return 'none'
}

export async function translateMyText(text = '', languageIndex) {
  const { languages } = languagesAndCodes
  const lang = languages?.[languageIndex]

  const str = Array.isArray(text) ? text.join('') : String(text ?? '')
  if (!str.trim()) return ''
  if (!lang) return str
  if (lang.code === 'en') return str

  const key = `${lang.code}::${str}`
  if (_cache.has(key)) return _cache.get(key)

  try {
    const res = await fetch('/api/translate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: str, to: lang.code }),
    })

    if (!res.ok) return str

    const data = await res.json()
    const out = data?.result ?? str

    _cache.set(key, out)
    return out
  } catch {
    return str
  }
}

//User text to English
export async function translateTextTo(text = '', to = 'en', from = '') {
  const str = Array.isArray(text) ? text.join('') : String(text ?? '')
  if (!str.trim()) return ''

  if (from && from === to) return str

  const key = `${from || 'auto'}::${to}::${str}`
  if (_cache.has(key)) return _cache.get(key)

  try {
    const res = await fetch('/api/translate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: str, to, from }),
    })

    if (!res.ok) return str

    const data = await res.json()
    const out = data?.result ?? str

    _cache.set(key, out)
    return out
  } catch {
    return str
  }
}

export const useTranslate = (text, options = {}) => {
  const [translatedText, setTranslatedText] = useState(String(text ?? ''))
  const { languageIndex } = useLanguage()

  const caseMode = options.caseMode || 'auto'

  useEffect(() => {
    let cancelled = false
    const sourceText = Array.isArray(text) ? text.join('') : String(text ?? '')

    translateMyText(sourceText, languageIndex)
      .then((res) => {
        if (cancelled) return

        const resolvedCaseMode =
          caseMode === 'auto' ? detectCaseModeFromSource(sourceText) : caseMode

        setTranslatedText(applyCaseMode(res, resolvedCaseMode))
      })
      .catch((err) => console.error(err))

    return () => {
      cancelled = true
    }
  }, [text, languageIndex, caseMode])

  return translatedText
}