'use client'

import Link from 'next/link'
import { useSelector } from 'react-redux'
import Header from '@/components/header/Header'
import HeaderUserMenu from '@/components/header/HeaderUserMenu'
import TranslateMe from '@/utils/translate/translate'
import Button from '@/components/shared/button/Button'
import Logo from '../components/shared/logo/Logo'
import ScrollToTopButton from '@/components/shared/scroll-to-top-btn/ScrollToTopBtn'
import ScrollToTopOnRouteChange from '@/components/shared/scroll-to-top-on-route-change/ScrollToTopOnRouteChange'
import { getLogin, getUser } from '@/store/auth/auth-selectors'

const ClientLayout = ({ children }) => {
  const isAuthenticated = useSelector(getLogin)
  const user = useSelector(getUser)

  const navItems = [
    { href: '/', label: 'Home' },
    { href: '/templates', label: 'Templates' },
    { href: '/pricing', label: 'Pricing' },
    { href: '/about', label: 'About' },
  ]

  return (
    <div className="flex min-h-screen flex-col">
      <ScrollToTopOnRouteChange />

      <Header
        logo={<Logo size={60} />}
        navItems={navItems}
        languageSlot={<TranslateMe />}
        authSlot={
          <div className="flex items-center gap-2">
            <div className="min-w-40">
              <Link href="/login" className="block">
                <Button variant="secondary" size="sm" fullWidth>
                  Login
                </Button>
              </Link>
            </div>

            <div className="min-w-40">
              <Link href="/register" className="block">
                <Button size="sm" fullWidth>
                  Register
                </Button>
              </Link>
            </div>
          </div>
        }
        userSlot={<HeaderUserMenu user={user} />}
        isAuthenticated={isAuthenticated}
      />

      <main className="flex-1">{children}</main>

      <ScrollToTopButton />
    </div>
  )
}

export default ClientLayout
