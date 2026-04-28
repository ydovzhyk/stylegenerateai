'use client'

import Link from 'next/link'
import { useSelector } from 'react-redux'
import Header from '@/components/header/Header'
import HeaderUserMenu from '@/components/header/HeaderUserMenu'
import GenerationUsageBadge from '@/components/shared/generation/GenerationUsageBadge'
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
        usageSlot={<GenerationUsageBadge />}
        isAuthenticated={isAuthenticated}
      />

      <main className="relative flex-1 min-h-[calc(100svh-76px)] overflow-hidden border-t border-primary/10">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute left-0 top-0 h-[220px] w-[220px] rounded-full bg-primary/10 blur-3xl sm:h-[280px] sm:w-[280px] md:h-[320px] md:w-[320px]" />
          <div className="absolute bottom-0 right-0 h-[180px] w-[180px] rounded-full bg-cyan-400/10 blur-3xl sm:h-[220px] sm:w-[220px] md:h-[260px] md:w-[260px]" />
        </div>

        <div className="relative h-full">{children}</div>
      </main>

      <ScrollToTopButton />
    </div>
  )
}

export default ClientLayout
