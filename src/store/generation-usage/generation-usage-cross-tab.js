import { createListenerMiddleware } from '@reduxjs/toolkit'
import { getGenerationUsage } from './generation-usage-operations'
import { setGenerationUsage } from './generation-usage-slice'
import {
  publishGenerationUsage,
  subscribeGenerationUsage,
} from '@/utils/cross-tab/generation-usage-sync'

export const generationUsageCrossTabMiddleware =
  createListenerMiddleware()

generationUsageCrossTabMiddleware.startListening({
  actionCreator: getGenerationUsage.fulfilled,
  effect: (action) => {
    publishGenerationUsage(action.payload)
  },
})

/** Apply usage snapshots from other tabs without another API round-trip. */
export function setupGenerationUsageCrossTabSync(store) {
  if (typeof window === 'undefined' || !store) return () => {}

  return subscribeGenerationUsage((payload) => {
    store.dispatch(setGenerationUsage(payload))
  })
}
