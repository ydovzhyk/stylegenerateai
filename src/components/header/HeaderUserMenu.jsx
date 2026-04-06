'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import Link from 'next/link'
import { useDispatch } from 'react-redux'
import clsx from 'clsx'
import Button from '@/components/shared/button/Button'
import Text from '@/components/shared/text/Text'
import { logout } from '@/store/auth/auth-operations'

function getInitials(name = '') {
  return String(name)
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() || '')
    .join('')
}

function Chevron({ open }) {
  return (
    <span
      aria-hidden="true"
      className={clsx(
        'block h-[8px] w-[8px] shrink-0 border-r-2 border-b-2 border-foreground-faint transition-transform duration-200 ease-out',
        open
          ? '-translate-y-[1px] rotate-[225deg]'
          : 'translate-y-[-1px] rotate-45',
      )}
    />
  )
}

export default function HeaderUserMenu({ user }) {
  const dispatch = useDispatch()
  const rootRef = useRef(null)
  const [open, setOpen] = useState(false)

  const safeName = useMemo(() => {
    return String(user?.name || 'User').trim()
  }, [user?.name])

  const safeAvatar = useMemo(() => {
    return String(user?.userAvatar || '').trim()
  }, [user?.userAvatar])

  const initials = useMemo(() => getInitials(safeName), [safeName])

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (!rootRef.current) return
      if (!rootRef.current.contains(event.target)) {
        setOpen(false)
      }
    }

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        setOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    document.addEventListener('keydown', handleKeyDown)

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [])

  const handleLogout = async () => {
    setOpen(false)

    try {
      await dispatch(logout()).unwrap()
      console.log('logout')
    } catch (error) {
      console.error('Logout failed:', error)
    }
  }

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        aria-haspopup="menu"
        aria-expanded={open}
        className={clsx(
          'group flex min-h-[40px] items-center gap-3 rounded-2xl px-3 py-[7px] text-left transition-all duration-200',
          open
            ? 'border border-primary bg-white/[0.04] shadow-[0_0_0_4px_rgba(124,92,255,0.12)]'
            : 'border border-white/8 bg-white/[0.04] hover:border-white/12',
        )}
      >
        <div className="relative flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded-full border border-white/10 bg-primary/15 text-sm font-semibold text-primary-soft shadow-violet-soft">
          {safeAvatar ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={safeAvatar}
              alt={safeName}
              className="h-full w-full object-cover"
              referrerPolicy="no-referrer"
              // crossOrigin="anonymous"
              onError={(e) => {
                e.currentTarget.style.display = 'none'
                const fallback = e.currentTarget.nextElementSibling
                if (fallback) fallback.style.display = 'flex'
              }}
            />
          ) : null}

          <span
            className="absolute inset-0 hidden items-center justify-center"
            style={{ display: safeAvatar ? 'none' : 'flex' }}
          >
            {initials || 'U'}
          </span>
        </div>

        <Text
          as="span"
          variant="body-sm"
          color="white"
          className="block max-w-[120px] truncate font-semibold"
        >
          {safeName}
        </Text>

        <span className="flex h-5 w-5 items-center justify-center">
          <Chevron open={open} />
        </span>
      </button>

      <div
        className={clsx(
          'absolute right-0 top-[calc(100%+10px)] z-[70] w-[260px] origin-top-right rounded-2xl border border-white/8 bg-[linear-gradient(180deg,rgba(20,23,32,0.96),rgba(17,19,26,0.98))] p-3 shadow-[0_18px_40px_rgba(0,0,0,0.38),0_0_0_1px_rgba(124,92,255,0.08)] transition-all duration-200',
          open
            ? 'pointer-events-auto translate-y-0 scale-100 opacity-100'
            : 'pointer-events-none -translate-y-1 scale-[0.98] opacity-0',
        )}
        role="menu"
      >
        <div className="mb-3 flex items-center gap-3 rounded-2xl border border-white/8 bg-white/[0.03] px-3 py-3">
          <div className="relative flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-full border border-white/10 bg-primary/15 text-sm font-semibold text-primary-soft">
            {safeAvatar ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={safeAvatar}
                alt={safeName}
                className="h-full w-full object-cover"
                referrerPolicy="no-referrer"
                // crossOrigin="anonymous"
                onError={(e) => {
                  e.currentTarget.style.display = 'none'
                  const fallback = e.currentTarget.nextElementSibling
                  if (fallback) fallback.style.display = 'flex'
                }}
              />
            ) : null}

            <span
              className="absolute inset-0 hidden items-center justify-center"
              style={{ display: safeAvatar ? 'none' : 'flex' }}
            >
              {initials || 'U'}
            </span>
          </div>

          <div className="min-w-0">
            <Text
              as="p"
              variant="body-sm"
              color="white"
              className="truncate font-semibold"
            >
              {safeName}
            </Text>

            <Text as="p" variant="caption" color="muted" className="truncate">
              {user?.email || 'Signed in'}
            </Text>
          </div>
        </div>

        <nav className="flex flex-col gap-2">
          <Link
            href="/settings"
            onClick={() => setOpen(false)}
            className="flex min-h-10 items-center rounded-2xl border border-white/8 bg-white/[0.03] px-4 transition hover:border-primary/30 hover:bg-white/[0.05]"
            role="menuitem"
          >
            <Text as="span" variant="body-sm" color="soft" caseMode="sentence">
              Settings
            </Text>
          </Link>

          <Link
            href="/my-gallery"
            onClick={() => setOpen(false)}
            className="flex min-h-10 items-center rounded-2xl border border-white/8 bg-white/[0.03] px-4 transition hover:border-primary/30 hover:bg-white/[0.05]"
            role="menuitem"
          >
            <Text as="span" variant="body-sm" color="soft" caseMode="sentence">
              My Gallery
            </Text>
          </Link>
        </nav>

        <div className="mt-3 border-t border-white/10 pt-3">
          <Button
            type="button"
            variant="secondary"
            size="sm"
            fullWidth
            onClick={handleLogout}
          >
            Logout
          </Button>
        </div>
      </div>
    </div>
  )
}
