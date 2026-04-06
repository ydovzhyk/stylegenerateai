import { Nunito_Sans } from 'next/font/google'
import './globals.css'
import { LanguageProvider } from '@/providers/languageContext'
import ClientLayout from './client-layout'
import StoreProvider from '@/providers/StoreProvider'
import AuthProvider from '@/providers/AuthProvider'
import ToastListener from '../providers/ToastListener'
import { ToastContainer } from 'react-toastify'
import 'react-toastify/dist/ReactToastify.css'

const nunitoSans = Nunito_Sans({
  subsets: ['latin', 'cyrillic'],
  weight: ['400', '500', '600', '700', '800'],
  variable: '--font-nunito-sans',
  display: 'swap',
})

export const metadata = {
  title: 'Style Generate AI',
  description: 'AI painting and interior visualization platform',
}

export default function RootLayout({ children }) {
  return (
    <html lang="en" data-scroll-behavior="smooth">
      <body className={`${nunitoSans.variable} min-h-screen`}>
        <StoreProvider>
          <LanguageProvider>
            <AuthProvider />
            <ToastListener />
            <ToastContainer
              position="top-right"
              autoClose={3200}
              closeOnClick
              pauseOnHover
              draggable
              newestOnTop
              theme="dark"
            />
            <ClientLayout>{children}</ClientLayout>
            <div id="modal-root" />
          </LanguageProvider>
        </StoreProvider>
      </body>
    </html>
  )
}
