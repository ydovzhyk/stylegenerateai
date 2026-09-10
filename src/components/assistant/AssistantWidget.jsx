'use client'

import { useEffect, useId, useLayoutEffect, useRef, useState } from 'react'
import { usePathname } from 'next/navigation'
import { useDispatch, useSelector } from 'react-redux'
import Image from 'next/image'
import clsx from 'clsx'
import { Menu, SendHorizontal, Trash2, X } from 'lucide-react'
import Text from '@/components/shared/text/Text'
import { useTranslate, translateTextTo } from '@/utils/translate/translate'
import languagesAndCodes from '@/utils/translate/languagesAndCodes'
import { useLanguage } from '@/providers/languageContext'
import { getLogin, getUser } from '@/store/auth/auth-selectors'
import { sendAssistantMessage } from '@/store/assistant/assistant-operations'
import {
  addAssistantLocalMessage,
  clearAssistantChat,
  hideProactiveHint,
  readAssistantHintsEnabled,
  setAssistantHintsEnabled,
  setAssistantChatLanguage,
  setAssistantOpen,
  showProactiveHint,
  toggleAssistantOpen,
  writeAssistantHintsEnabled,
  writeAssistantChatLanguage,
} from '@/store/assistant/assistant-slice'
import {
  getAssistantError,
  getAssistantHasOpenedChat,
  getAssistantHasSentMessage,
  getAssistantHintsEnabled,
  getAssistantIsOpen,
  getAssistantLastGenerationAt,
  getAssistantMessages,
  getAssistantPhotoLabModeId,
  getAssistantProactive,
  getAssistantChatLanguage,
  getAssistantSending,
} from '@/store/assistant/assistant-selectors'
import {
  ASSISTANT_CONTENT,
  getDirectIntroText,
  getGreetingText,
  getIntroText,
  getPageBubbleText,
  detectChatLanguage,
  hasPageIntro,
  isAssistantHiddenPath,
  normalizeAssistantPath,
} from './assistant-content'
import AssistantMarkdown from './AssistantMarkdown'

const WELCOME_DELAY_MS = 2 * 60 * 1000
const PAGE_HINT_DELAY_MS = 30 * 1000
const WELCOME_VISIBLE_MS = 30 * 1000
const SHORT_VISIBLE_MS = 10 * 1000
const CHAT_SCRIPT_DELAY_MS = 3000

function getLanguageCodeByIndex(index) {
  return String(
    languagesAndCodes?.languages?.[index]?.code || 'en',
  ).toLowerCase()
}

function AssistantBubble({ text, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="gradient-border-card block w-max max-w-[240px] rounded-2xl px-3 py-2 text-left shadow-[0_12px_30px_rgba(0,0,0,0.35)]"
    >
      <Text
        as="span"
        variant="caption"
        color="white"
        className="block leading-5"
        translate={false}
      >
        {text}
      </Text>
    </button>
  )
}

function AssistantHintsRadios({
  enabled,
  onChange,
  label,
  onLabel,
  offLabel,
  name,
}) {
  return (
    <fieldset className="min-w-0" autoComplete="off">
      <legend className="sr-only">{label}</legend>
      <Text
        as="span"
        variant="caption"
        color="faint"
        translate={false}
        className="mb-2 block text-[10px] uppercase tracking-[0.16em]"
      >
        {label}
      </Text>
      <div className="flex flex-col gap-2">
        {[
          { value: true, text: onLabel },
          { value: false, text: offLabel },
        ].map((option) => {
          const active = enabled === option.value
          return (
            <label
              key={String(option.value)}
              className={clsx(
                'flex cursor-pointer items-center gap-2 rounded-xl border px-2.5 py-2 text-xs transition',
                active
                  ? 'border-primary/35 bg-primary/10 text-white'
                  : 'border-white/10 text-foreground-faint hover:border-white/20 hover:text-foreground-soft',
              )}
            >
              <input
                type="radio"
                name={name}
                checked={active}
                onChange={() => onChange(option.value)}
                className="h-3.5 w-3.5 accent-[var(--primary)]"
              />
              <span>{option.text}</span>
            </label>
          )
        })}
      </div>
    </fieldset>
  )
}

export default function AssistantWidget() {
  const pathname = normalizeAssistantPath(usePathname() || '/')
  const dispatch = useDispatch()
  const openLabel = useTranslate(ASSISTANT_CONTENT.open)
  const clearChatLabel = useTranslate(ASSISTANT_CONTENT.clearChat)
  const closeLabel = useTranslate(ASSISTANT_CONTENT.close)
  const sendLabel = useTranslate(ASSISTANT_CONTENT.send)
  const placeholder = useTranslate(ASSISTANT_CONTENT.placeholder)
  const thinkingLabel = useTranslate(ASSISTANT_CONTENT.thinking)
  const titleLabel = useTranslate(ASSISTANT_CONTENT.title)
  const menuLabel = useTranslate(ASSISTANT_CONTENT.menu)
  const hintsLabel = useTranslate(ASSISTANT_CONTENT.hintsLabel)
  const hintsOnLabel = useTranslate(ASSISTANT_CONTENT.hintsOn)
  const hintsOffLabel = useTranslate(ASSISTANT_CONTENT.hintsOff)
  const hintsGroupName = useId()
  const { languageIndex, hydrated } = useLanguage()
  const siteLangCode = getLanguageCodeByIndex(languageIndex)

  const isOpen = useSelector(getAssistantIsOpen)
  const messages = useSelector(getAssistantMessages)
  const sending = useSelector(getAssistantSending)
  const error = useSelector(getAssistantError)
  const proactive = useSelector(getAssistantProactive)
  const hintsEnabled = useSelector(getAssistantHintsEnabled)
  const hasOpenedChat = useSelector(getAssistantHasOpenedChat)
  const hasSentMessage = useSelector(getAssistantHasSentMessage)
  const photoLabModeId = useSelector(getAssistantPhotoLabModeId)
  const lastGenerationAt = useSelector(getAssistantLastGenerationAt)
  const chatLanguage = useSelector(getAssistantChatLanguage)
  const user = useSelector(getUser)
  const isAuthenticated = useSelector(getLogin)

  const [draft, setDraft] = useState('')
  const [menuOpen, setMenuOpen] = useState(false)
  const listRef = useRef(null)
  const lastItemRef = useRef(null)
  const menuRef = useRef(null)
  const prevPathRef = useRef(pathname)
  const hintsEnabledRef = useRef(true)
  const welcomeTimerRef = useRef(null)
  const pageTimerRef = useRef(null)
  const hideTimerRef = useRef(null)
  const scriptTimersRef = useRef([])
  const introducedPathsRef = useRef(new Set())
  const lastOpenPathRef = useRef(pathname)
  const chatLanguageRef = useRef(chatLanguage)

  const hidden = isAssistantHiddenPath(pathname)
  const showBotAvatar = Boolean(proactive?.text) && !isOpen
  const hintsOn = hintsEnabled !== false

  if (hydrated && !hasSentMessage) {
    chatLanguageRef.current = siteLangCode
  }

  const localizeText = async (text) => {
    const source = String(text || '').trim()
    const lang = String(chatLanguageRef.current || 'en').toLowerCase()
    if (!source || lang === 'en') return source

    const chunks = source.split(/(\n\n+)/)
    const translated = []
    for (const chunk of chunks) {
      if (!chunk.trim()) {
        translated.push(chunk)
        continue
      }
      translated.push(await translateTextTo(chunk, lang))
    }
    return translated.join('')
  }

  const pushLocalMessage = async (text) => {
    const localized = await localizeText(text)
    if (!localized) return
    dispatch(addAssistantLocalMessage(localized))
  }

  const showHintRef = useRef(() => {})
  showHintRef.current = (payload, visibleMs) => {
    if (hidden || isOpen || !hintsOn) return
    localizeText(payload?.text).then((text) => {
      if (!text) return
      dispatch(showProactiveHint({ ...payload, text }))
      window.clearTimeout(hideTimerRef.current)
      hideTimerRef.current = window.setTimeout(() => {
        dispatch(hideProactiveHint())
      }, visibleMs)
    })
  }

  const skipLanguagePersistRef = useRef(true)

  useEffect(() => {
    const storedHints = readAssistantHintsEnabled()
    if (storedHints !== hintsOn) {
      dispatch(setAssistantHintsEnabled(storedHints))
    }
    // Hydrate once from localStorage.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dispatch])

  useLayoutEffect(() => {
    if (!hydrated || hasSentMessage) return
    chatLanguageRef.current = siteLangCode
    if (chatLanguage !== siteLangCode) {
      dispatch(setAssistantChatLanguage(siteLangCode))
    }
  }, [hydrated, siteLangCode, hasSentMessage, chatLanguage, dispatch])

  useEffect(() => {
    if (hasSentMessage) {
      chatLanguageRef.current = chatLanguage
    }
    if (skipLanguagePersistRef.current) {
      skipLanguagePersistRef.current = false
      return
    }
    writeAssistantChatLanguage(chatLanguage)
  }, [chatLanguage, hasSentMessage])

  useEffect(() => {
    const wasEnabled = hintsEnabledRef.current
    hintsEnabledRef.current = hintsOn
    if (wasEnabled !== false && !hintsOn) {
      window.clearTimeout(welcomeTimerRef.current)
      window.clearTimeout(pageTimerRef.current)
      window.clearTimeout(hideTimerRef.current)
      dispatch(hideProactiveHint())
    }
  }, [hintsOn, dispatch])

  useEffect(() => {
    if (hidden || hasOpenedChat || hasSentMessage || !hintsOn || !hydrated) {
      return undefined
    }

    welcomeTimerRef.current = window.setTimeout(() => {
      showHintRef.current(
        {
          kind: 'welcome',
          text: ASSISTANT_CONTENT.welcomeBubble,
          showAvatar: true,
        },
        WELCOME_VISIBLE_MS,
      )
    }, WELCOME_DELAY_MS)

    return () => window.clearTimeout(welcomeTimerRef.current)
  }, [hidden, hasOpenedChat, hasSentMessage, hintsOn, hydrated])

  useEffect(() => {
    const pathChanged = prevPathRef.current !== pathname
    if (pathChanged) {
      prevPathRef.current = pathname
      dispatch(hideProactiveHint())
      window.clearTimeout(hideTimerRef.current)
    }

    if (hidden || !hintsOn || !hydrated) return undefined

    const pageText = getPageBubbleText(pathname)
    if (!pageText) return undefined

    const visibleMs =
      pathname === '/create-your-look' || pathname === '/'
        ? WELCOME_VISIBLE_MS
        : SHORT_VISIBLE_MS

    pageTimerRef.current = window.setTimeout(() => {
      showHintRef.current(
        { kind: 'page', text: pageText, showAvatar: true },
        visibleMs,
      )
    }, PAGE_HINT_DELAY_MS)

    return () => window.clearTimeout(pageTimerRef.current)
  }, [pathname, hidden, hintsOn, hydrated, dispatch])

  useEffect(() => {
    if (!photoLabModeId || hidden || isOpen || !hintsOn || !hydrated) return
    showHintRef.current(
      { kind: 'mode', text: ASSISTANT_CONTENT.modeBubble },
      SHORT_VISIBLE_MS,
    )
  }, [photoLabModeId, hidden, isOpen, hintsOn, hydrated])

  useEffect(() => {
    if (!lastGenerationAt || hidden || isOpen || !hintsOn || !hydrated) return
    showHintRef.current(
      { kind: 'generation', text: ASSISTANT_CONTENT.generationBubble },
      SHORT_VISIBLE_MS,
    )
  }, [lastGenerationAt, hidden, isOpen, hintsOn, hydrated])

  useEffect(() => {
    if (!isOpen) return undefined

    const frame = window.requestAnimationFrame(() => {
      const container = listRef.current
      const target = lastItemRef.current
      if (!container || !target) return

      const paddingTop =
        Number.parseFloat(window.getComputedStyle(container).paddingTop) || 0
      const delta =
        target.getBoundingClientRect().top -
        container.getBoundingClientRect().top -
        paddingTop
      container.scrollTop += delta
    })

    return () => window.cancelAnimationFrame(frame)
  }, [messages, sending, isOpen])

  useEffect(() => {
    if (!isOpen) setMenuOpen(false)
  }, [isOpen])

  useEffect(() => {
    if (!menuOpen) return undefined

    const handleClickOutside = (event) => {
      if (!menuRef.current) return
      if (!menuRef.current.contains(event.target)) {
        setMenuOpen(false)
      }
    }

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') setMenuOpen(false)
    }

    document.addEventListener('mousedown', handleClickOutside)
    document.addEventListener('keydown', handleKeyDown)

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [menuOpen])

  useEffect(() => {
    if (!isOpen || hidden) {
      lastOpenPathRef.current = pathname
      return undefined
    }

    const pathChanged = lastOpenPathRef.current !== pathname
    lastOpenPathRef.current = pathname

    if (!pathChanged || !hasPageIntro(pathname)) return undefined
    if (introducedPathsRef.current.has(pathname)) return undefined

    introducedPathsRef.current.add(pathname)
    const text = getDirectIntroText(pathname)
    const timer = window.setTimeout(() => {
      pushLocalMessage(text)
    }, CHAT_SCRIPT_DELAY_MS)

    return () => window.clearTimeout(timer)
  }, [pathname, isOpen, hidden, dispatch])

  useEffect(() => {
    return () => {
      scriptTimersRef.current.forEach((id) => window.clearTimeout(id))
      scriptTimersRef.current = []
    }
  }, [])

  if (hidden) return null

  const clearChatScript = () => {
    scriptTimersRef.current.forEach((id) => window.clearTimeout(id))
    scriptTimersRef.current = []
  }

  const queueChatMessages = (texts) => {
    clearChatScript()
    texts.filter(Boolean).forEach((text, index) => {
      const id = window.setTimeout(() => {
        pushLocalMessage(text)
      }, (index + 1) * CHAT_SCRIPT_DELAY_MS)
      scriptTimersRef.current.push(id)
    })
  }

  const openWithGreeting = () => {
    const openedFromBubble = Boolean(proactive?.text)

    if (!isOpen && messages.length === 0) {
      introducedPathsRef.current.add(pathname)
      const greeting = getGreetingText(isAuthenticated ? user?.name : '')
      const intro = openedFromBubble
        ? getIntroText(pathname)
        : getDirectIntroText(pathname)

      pushLocalMessage(greeting)

      if (openedFromBubble) {
        queueChatMessages([proactive.text, intro])
      } else {
        queueChatMessages([intro])
      }
    } else if (!isOpen && !introducedPathsRef.current.has(pathname)) {
      introducedPathsRef.current.add(pathname)
      if (openedFromBubble) {
        queueChatMessages([proactive.text, getIntroText(pathname)])
      } else if (hasPageIntro(pathname)) {
        pushLocalMessage(getDirectIntroText(pathname))
      }
    }

    dispatch(setAssistantOpen(true))
  }

  const handleHintsChange = (enabled) => {
    writeAssistantHintsEnabled(enabled)
    dispatch(setAssistantHintsEnabled(enabled))
  }

  const handleClearChat = () => {
    clearChatScript()
    setDraft('')
    setMenuOpen(false)
    introducedPathsRef.current = new Set()
    dispatch(clearAssistantChat())
  }

  const handleToggle = () => {
    if (isOpen) {
      dispatch(toggleAssistantOpen())
      return
    }
    openWithGreeting()
  }

  const handleSend = async (event) => {
    event.preventDefault()
    const message = draft.trim()
    if (!message || sending) return

    setDraft('')
    if (!isOpen) dispatch(setAssistantOpen(true))
    clearChatScript()
    const nextLang = detectChatLanguage(message, chatLanguageRef.current)
    chatLanguageRef.current = nextLang
    writeAssistantChatLanguage(nextLang)
    dispatch(setAssistantChatLanguage(nextLang))

    await dispatch(
      sendAssistantMessage({
        message,
        history: messages.map((item) => ({
          role: item.role,
          text: item.text,
        })),
        page: pathname,
        photoLabModeId,
      }),
    )
  }

  return (
    <>
      {isOpen && (
        <div
          className={clsx(
            'pointer-events-auto gradient-border-card fixed z-[60] flex flex-col',
            'inset-x-3 bottom-0 h-[var(--assistant-panel-h)]',
            'md:inset-x-auto md:bottom-auto md:left-auto md:top-1/2 md:-translate-y-1/2',
            'md:right-[calc(var(--assistant-right)+var(--assistant-fab-size)+var(--assistant-stack-gap))]',
            'md:h-[var(--assistant-panel-h)] md:w-[min(calc(100vw-2rem),360px)]',
          )}
        >
          <div className="relative border-b border-white/10 px-3 py-3 sm:px-4">
            <div className="flex items-center justify-between gap-2">
              <div className="flex min-w-0 items-center gap-2">
                <Image
                  src="/images/assistant-bot.png"
                  alt=""
                  width={36}
                  height={36}
                  className="h-9 w-9 shrink-0 object-contain"
                />
                <Text
                  variant="caption"
                  className="truncate font-semibold"
                  translate={false}
                >
                  {titleLabel}
                </Text>
              </div>
              <div ref={menuRef} className="relative shrink-0">
                <button
                  type="button"
                  onClick={() => setMenuOpen((open) => !open)}
                  aria-label={menuLabel}
                  aria-haspopup="menu"
                  aria-expanded={menuOpen}
                  className={clsx(
                    'inline-flex h-8 w-8 items-center justify-center rounded-full border transition',
                    menuOpen
                      ? 'border-primary/40 bg-primary/10 text-white'
                      : 'border-white/10 bg-white/[0.04] text-foreground-faint hover:border-white/20 hover:text-white',
                  )}
                >
                  {menuOpen ? (
                    <X className="h-4 w-4" />
                  ) : (
                    <Menu className="h-4 w-4" />
                  )}
                </button>
                {menuOpen && (
                  <div
                    role="menu"
                    className="absolute right-0 top-[calc(100%+0.5rem)] z-20 w-[min(220px,calc(100vw-2rem))] rounded-2xl border border-white/10 bg-[#151821] p-3 shadow-[0_16px_40px_rgba(0,0,0,0.45)]"
                  >
                    <AssistantHintsRadios
                      enabled={hintsOn}
                      onChange={handleHintsChange}
                      label={hintsLabel}
                      onLabel={hintsOnLabel}
                      offLabel={hintsOffLabel}
                      name={hintsGroupName}
                    />
                    <button
                      type="button"
                      role="menuitem"
                      onClick={handleClearChat}
                      className="mt-3 flex w-full items-center gap-2 rounded-xl border border-white/10 px-2.5 py-2 text-left text-xs text-foreground-soft transition hover:border-white/20 hover:bg-white/[0.04] hover:text-white"
                    >
                      <Trash2 className="h-3.5 w-3.5 shrink-0" />
                      <span>{clearChatLabel}</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div
            ref={listRef}
            className="relative flex-1 space-y-3 overflow-y-auto px-4 py-3"
          >
            {messages.map((item, index) => {
              const isLatest = index === messages.length - 1 && !sending
              return (
                <div
                  key={item.id}
                  ref={isLatest ? lastItemRef : undefined}
                  className={clsx(
                    'max-w-[92%] rounded-2xl px-3 py-2 text-sm leading-6',
                    item.role === 'user'
                      ? 'ml-auto bg-primary/25 text-white'
                      : 'bg-white/5 text-foreground-soft',
                  )}
                >
                  {item.role === 'assistant' ? (
                    <AssistantMarkdown text={item.text} />
                  ) : (
                    item.text
                  )}
                </div>
              )
            })}
            {sending && (
              <div
                ref={lastItemRef}
                className="max-w-[92%] rounded-2xl bg-white/5 px-3 py-2 text-sm text-foreground-faint"
              >
                {thinkingLabel}
              </div>
            )}
            {error && <div className="text-sm text-danger">{error}</div>}
          </div>

          <form
            onSubmit={handleSend}
            className="flex items-end gap-2 border-t border-white/10 p-3"
          >
            <textarea
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === 'Enter' && !event.shiftKey) {
                  event.preventDefault()
                  handleSend(event)
                }
              }}
              rows={1}
              placeholder={placeholder}
              className="max-h-28 min-h-12 flex-1 resize-none rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm leading-6 text-white outline-none placeholder:text-foreground-faint focus:border-primary/50"
            />
            <button
              type="submit"
              disabled={sending || !draft.trim()}
              className="flex h-11 w-11 items-center justify-center rounded-full bg-[linear-gradient(135deg,rgba(124,92,255,0.95),rgba(0,213,255,0.8))] text-white disabled:opacity-40"
              aria-label={sendLabel}
            >
              <SendHorizontal className="h-4 w-4" />
            </button>
          </form>
        </div>
      )}

      {proactive?.text && !isOpen && (
        <div
          className="pointer-events-auto fixed right-[var(--assistant-right)] z-[70] w-max max-w-[min(16rem,calc(100vw-2rem))]"
          style={{
            bottom:
              'calc(50% + (var(--assistant-fab-size) / 2) + var(--assistant-stack-gap))',
          }}
        >
          <AssistantBubble text={proactive.text} onClick={openWithGreeting} />
        </div>
      )}

      <div
        className={clsx(
          'pointer-events-auto fixed right-[var(--assistant-right)] z-[70] transition-[top,bottom,transform] duration-300',
          isOpen
            ? 'top-auto bottom-[calc(var(--assistant-panel-h)+var(--assistant-fab-bottom))] translate-y-0 md:top-1/2 md:bottom-auto md:-translate-y-1/2'
            : 'top-1/2 bottom-auto -translate-y-1/2',
        )}
      >
        <button
          type="button"
          onClick={handleToggle}
          aria-label={isOpen ? closeLabel : openLabel}
          className={clsx(
            'group rounded-full p-[1px] transition-all duration-300',
            'bg-[linear-gradient(135deg,rgba(124,92,255,0.95),rgba(0,213,255,0.8))]',
            'shadow-[0_10px_30px_rgba(124,92,255,0.28),0_0_24px_rgba(0,213,255,0.12)]',
          )}
        >
          <span className="relative flex h-[54px] w-[54px] items-center justify-center overflow-hidden rounded-full border border-white/10 bg-[linear-gradient(180deg,rgba(20,23,32,0.96),rgba(17,19,26,0.98))]">
            {isOpen ? (
              <X className="h-5 w-5 text-white" />
            ) : showBotAvatar ? (
              <Image
                src="/images/assistant-bot.png"
                alt=""
                width={40}
                height={40}
                className="h-10 w-10 object-contain"
              />
            ) : (
              <Image
                src="/images/chat-bot-message_v2.png"
                alt=""
                width={44}
                height={44}
                className="animate-assistant-message-shake h-11 w-11 object-contain"
              />
            )}
          </span>
        </button>
      </div>
    </>
  )
}
