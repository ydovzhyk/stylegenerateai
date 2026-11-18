const CHANNEL_NAME = 'sg-generation-usage'
const STORAGE_KEY = 'sg-generation-usage-sync'
const MESSAGE_TYPE = 'generation-usage/updated'

let tabId = ''

function getTabId() {
  if (tabId) return tabId

  try {
    tabId =
      typeof crypto !== 'undefined' && crypto.randomUUID
        ? crypto.randomUUID()
        : `tab-${Date.now()}-${Math.random().toString(16).slice(2)}`
  } catch {
    tabId = `tab-${Date.now()}-${Math.random().toString(16).slice(2)}`
  }

  return tabId
}

function buildMessage(payload) {
  return {
    type: MESSAGE_TYPE,
    tabId: getTabId(),
    payload,
    ts: Date.now(),
  }
}

function parseMessage(raw) {
  if (!raw || typeof raw !== 'object') return null
  if (raw.type !== MESSAGE_TYPE) return null
  if (raw.tabId === getTabId()) return null
  return raw
}

/** Notify other same-origin tabs that generation usage changed. */
export function publishGenerationUsage(payload) {
  if (typeof window === 'undefined') return

  const message = buildMessage(payload)

  try {
    if (typeof BroadcastChannel !== 'undefined') {
      const channel = new BroadcastChannel(CHANNEL_NAME)
      channel.postMessage(message)
      channel.close()
    }
  } catch {
    // Ignore channel failures; storage fallback may still work.
  }

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(message))
  } catch {
    // Private mode / blocked storage — cross-tab sync is best-effort.
  }
}

/**
 * Subscribe to usage updates from other tabs.
 * Returns an unsubscribe function.
 */
export function subscribeGenerationUsage(onPayload) {
  if (typeof window === 'undefined' || typeof onPayload !== 'function') {
    return () => {}
  }

  const handleParsed = (raw) => {
    const message = parseMessage(raw)
    if (!message) return
    onPayload(message.payload)
  }

  let channel = null

  const onChannelMessage = (event) => {
    handleParsed(event?.data)
  }

  const onStorage = (event) => {
    if (event.key !== STORAGE_KEY || !event.newValue) return

    try {
      handleParsed(JSON.parse(event.newValue))
    } catch {
      // Ignore malformed sync payloads.
    }
  }

  try {
    if (typeof BroadcastChannel !== 'undefined') {
      channel = new BroadcastChannel(CHANNEL_NAME)
      channel.addEventListener('message', onChannelMessage)
    }
  } catch {
    channel = null
  }

  window.addEventListener('storage', onStorage)

  return () => {
    window.removeEventListener('storage', onStorage)

    if (channel) {
      channel.removeEventListener('message', onChannelMessage)
      channel.close()
    }
  }
}
