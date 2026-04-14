import { configureStore } from '@reduxjs/toolkit'
import {
  FLUSH,
  PAUSE,
  PERSIST,
  persistReducer,
  persistStore,
  PURGE,
  REGISTER,
  REHYDRATE,
} from 'redux-persist'

import authReducer from './auth/auth-slice'
import technicalReducer from './technical/technical-slice'
import visitorReducer from './visitor/visitor-slice'
import readyTemplateReducer from './ready-template/ready-template-slice'
import { setupInterceptors } from '../services/api/instance'
// import logger from 'redux-logger'

const isServer = typeof window === 'undefined'

const createPersistedAuthReducer = () => {
  if (isServer) return authReducer
  const storage = require('redux-persist/lib/storage').default
  const cfg = {
    key: 'auth-local',
    storage,
    whitelist: [],
  }
  return persistReducer(cfg, authReducer)
}

const finalAuthReducer = createPersistedAuthReducer()

export const store = configureStore({
  reducer: {
    auth: finalAuthReducer,
    technical: technicalReducer,
    visitor: visitorReducer,
    readyTemplate: readyTemplateReducer,
  },
  middleware: (getDefaultMiddleware) => {
    const middlewares = getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: [FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER],
      },
    })

    // if (!isServer && process.env.NODE_ENV === 'development') {
    //   middlewares.push(logger)
    // }

    return middlewares
  },
})

export const persistor = isServer ? null : persistStore(store)

if (!isServer) {
  setupInterceptors(store)
}
