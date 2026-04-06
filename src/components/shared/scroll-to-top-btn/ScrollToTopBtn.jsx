'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import clsx from 'clsx'

export default function ScrollToTopButton() {
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    const toggleVisibility = () => {
      setIsVisible(window.scrollY > 250)
    }

    window.addEventListener('scroll', toggleVisibility, { passive: true })
    toggleVisibility()

    return () => {
      window.removeEventListener('scroll', toggleVisibility)
    }
  }, [])

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth',
    })
  }

  return (
    <button
      type="button"
      onClick={scrollToTop}
      aria-label="Scroll to top"
      className={clsx(
        'group fixed bottom-6 right-5 z-50 rounded-full p-[1px] transition-all duration-300 ease-out',
        'bg-[linear-gradient(135deg,rgba(124,92,255,0.95),rgba(0,213,255,0.8))]',
        'shadow-[0_10px_30px_rgba(124,92,255,0.28),0_0_24px_rgba(0,213,255,0.12)]',
        isVisible
          ? 'pointer-events-auto translate-y-0 opacity-100'
          : 'pointer-events-none translate-y-3 opacity-0',
      )}
    >
      <span
        className={clsx(
          'pointer-events-none absolute left-1/2 top-[-15px] h-0 w-0 -translate-x-1/2',
          'border-l-[9px] border-r-[9px] border-b-[11px] border-l-transparent border-r-transparent',
          'border-b-[#7c5cff] drop-shadow-[0_0_10px_rgba(124,92,255,0.65)]',
          isVisible && 'animate-bounce',
        )}
      />

      <span
        className={clsx(
          'absolute inset-0 rounded-full opacity-0 blur-xl transition-opacity duration-300',
          'bg-[radial-gradient(circle,rgba(124,92,255,0.45)_0%,rgba(0,213,255,0.18)_55%,transparent_75%)]',
          'group-hover:opacity-100',
        )}
      />

      <span className="relative flex h-[54px] w-[54px] items-center justify-center overflow-hidden rounded-full border border-white/10 bg-[linear-gradient(180deg,rgba(20,23,32,0.96),rgba(17,19,26,0.98))]">
        <Image
          src="/images/logo.png"
          alt="Scroll to top"
          width={44}
          height={44}
          className="h-[44px] w-[44px] object-contain transition-transform duration-300 group-hover:scale-105"
          draggable={false}
        />
      </span>
    </button>
  )
}
