'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import clsx from 'clsx'
import Text from '../shared/text/Text'

function BurgerButton({ open, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={open ? 'Close menu' : 'Open menu'}
      aria-expanded={open}
      className="inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-white/10 bg-white/5 text-white transition hover:border-primary/40 hover:bg-white/8 lg:hidden"
    >
      <span className="relative block h-4 w-5">
        <span
          className={clsx(
            'absolute left-0 top-0 h-[2px] w-5 rounded-full bg-current transition-all duration-300',
            open && 'top-[7px] rotate-45',
          )}
        />
        <span
          className={clsx(
            'absolute left-0 top-[7px] h-[2px] w-5 rounded-full bg-current transition-all duration-300',
            open && 'opacity-0',
          )}
        />
        <span
          className={clsx(
            'absolute left-0 top-[14px] h-[2px] w-5 rounded-full bg-current transition-all duration-300',
            open && 'top-[7px] -rotate-45',
          )}
        />
      </span>
    </button>
  )
}

function DesktopNav({ items = [] }) {
  if (!items.length) return null

  return (
    <nav className="hidden items-center gap-1 lg:flex">
      {items.map((item) => (
        <Link
          key={item.href}
          href={item.href}
          className="rounded-full px-4 py-2 text-md font-medium text-foreground-muted transition hover:bg-white/5 hover:text-white"
        >
          <Text as="span" variant="body">
            {item.label}
          </Text>
        </Link>
      ))}
    </nav>
  )
}

function MobileMenu({
  open,
  onClose,
  items = [],
  languageSlot,
  authSlot,
  userSlot,
  usageSlot = null,
  isAuthenticated = false,
}) {
  useEffect(() => {
    if (!open) return

    const onKeyDown = (e) => {
      if (e.key === 'Escape') onClose()
    }

    document.addEventListener('keydown', onKeyDown)
    document.body.style.overflow = 'hidden'

    return () => {
      document.removeEventListener('keydown', onKeyDown)
      document.body.style.overflow = ''
    }
  }, [open, onClose])

  if (!open) return null

  return (
    <>
      <button
        type="button"
        aria-label="Close mobile menu overlay"
        onClick={onClose}
        className="fixed inset-0 z-[90] bg-black/55 backdrop-blur-[2px]"
      />

      <aside className="fixed right-0 top-0 z-[100] flex h-dvh w-full max-w-sm flex-col border-l border-white/10 bg-[linear-gradient(180deg,rgba(20,23,32,0.98),rgba(17,19,26,0.99))] shadow-[0_0_0_1px_rgba(124,92,255,0.12),0_24px_64px_rgba(0,0,0,0.45)]">
        <div className="flex items-center justify-between border-b border-white/10 px-4 py-4">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-foreground-faint">
            Menu
          </p>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close menu"
            className="inline-flex h-10 w-10 items-center justify-center rounded-2xl border border-white/10 bg-white/5 text-white transition hover:border-primary/40 hover:bg-white/8"
          >
            ✕
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-4 py-5">
          {items.length > 0 ? (
            <nav className="mb-6 flex flex-col gap-2">
              {items.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={onClose}
                  className="rounded-2xl border border-white/8 bg-white/[0.03] px-4 py-3 text-base font-medium text-foreground-soft transition hover:border-primary/30 hover:bg-white/[0.05] hover:text-white"
                >
                  {item.label}
                </Link>
              ))}
            </nav>
          ) : null}

          <div className="space-y-4">
            {usageSlot ? (
              <div className="gradient-border-card p-4">
                <p className="mb-3 text-xs font-semibold uppercase tracking-[0.18em] text-foreground-faint">
                  Generations
                </p>
                {usageSlot}
              </div>
            ) : null}

            {languageSlot ? (
              <div className="gradient-border-card p-4">
                <p className="mb-3 text-xs font-semibold uppercase tracking-[0.18em] text-foreground-faint">
                  Language
                </p>
                {languageSlot}
              </div>
            ) : null}

            <div className="gradient-border-card p-4">
              <p className="mb-3 text-xs font-semibold uppercase tracking-[0.18em] text-foreground-faint">
                Account
              </p>

              {isAuthenticated ? userSlot : authSlot}
            </div>
          </div>
        </div>
      </aside>
    </>
  )
}

export default function Header({
  logo,
  navItems = [],
  languageSlot = null,
  authSlot = null,
  userSlot = null,
  usageSlot = null,
  isAuthenticated = false,
  className,
}) {
  const [mobileOpen, setMobileOpen] = useState(false)

  const desktopAccountSlot = useMemo(() => {
    return isAuthenticated ? userSlot : authSlot
  }, [isAuthenticated, userSlot, authSlot])

  return (
    <>
      <header
        className={clsx(
          'sticky top-0 z-50 border-b border-white/10 bg-black/30 backdrop-blur-xl',
          className,
        )}
      >
        <div className="pointer-events-none absolute inset-x-0 top-0 overflow-hidden">
          <div className="hero-orb hero-orb--violet absolute -left-10 top-[-42px] h-28 w-28 opacity-70" />
          <div className="hero-orb hero-orb--cyan absolute right-16 top-[-56px] h-32 w-32 opacity-50" />
        </div>

        <div className="container-app relative grid min-h-[76px] grid-cols-[auto_1fr_auto] items-center gap-4 py-2">
          <div className="min-w-0 justify-self-start">
            <div className="shrink-0">{logo}</div>
          </div>

          <div className="hidden min-w-0 justify-self-center lg:flex">
            <DesktopNav items={navItems} />
          </div>

          <div className="hidden items-center gap-3 justify-self-end lg:flex">
            {usageSlot}
            {languageSlot ? (
              <div className="min-w-[132px]">{languageSlot}</div>
            ) : null}
            {desktopAccountSlot}
          </div>

          <div className="flex items-center gap-2 justify-self-end lg:hidden">
            {usageSlot ? (
              <div className="max-w-[132px]">{usageSlot}</div>
            ) : null}

            <BurgerButton
              open={mobileOpen}
              onClick={() => setMobileOpen((prev) => !prev)}
            />
          </div>
        </div>
      </header>

      <MobileMenu
        open={mobileOpen}
        onClose={() => setMobileOpen(false)}
        items={navItems}
        languageSlot={languageSlot}
        authSlot={authSlot}
        userSlot={userSlot}
        usageSlot={usageSlot}
        isAuthenticated={isAuthenticated}
      />
    </>
  )
}
