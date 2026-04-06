'use client'

import { Provider } from 'react-redux'
import { PersistGate } from 'redux-persist/integration/react'
import { persistor, store } from '@/store/store'

export default function StoreProvider({ children }) {
  return (
    <Provider store={store}>
      <PersistGate loading={null} persistor={persistor}>
        {children}
      </PersistGate>
    </Provider>
  )
}
// 'use client'

// import { Provider } from 'react-redux'
// import { store } from '@/store/store'

// export default function StoreProvider({ children }) {
//   return <Provider store={store}>{children}</Provider>
// }
