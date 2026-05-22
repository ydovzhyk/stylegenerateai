'use client'

import Link from 'next/link'
import Text from '@/components/shared/text/Text'
import Button from '@/components/shared/button/Button'
import { useTranslate } from '@/utils/translate/translate'

export default function NotFound() {
  const tTitle = useTranslate('Oops... this page is on vacation')
  const tDesc = useTranslate(
    'Looks like you are lost. But don’t worry — we will help you find your way back.',
  )
  const tBackHome = useTranslate('Go to homepage')

  return (
    <section className="relative flex flex-1 items-center justify-center overflow-hidden">
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="hero-orb hero-orb--violet absolute left-[-80px] top-[-60px] h-56 w-56 opacity-60 sm:h-72 sm:w-72" />
        <div className="hero-orb hero-orb--cyan absolute bottom-[-80px] right-[-60px] h-64 w-64 opacity-50 sm:h-80 sm:w-80" />
      </div>

      <div className="container-app relative">
        <div className="mx-auto max-w-xl text-center">
          <div className="gradient-border-card p-5 sm:p-6 md:p-8">
            <div className="mb-5 flex justify-center sm:mb-6">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/images/logo.png"
                alt="Logo"
                className="h-10 w-auto opacity-90 md:h-12"
              />
            </div>

            <Text
              as="div"
              variant="h1"
              color="white"
              className="text-[56px] leading-none sm:text-[72px] md:text-[96px]"
            >
              404
            </Text>

            <Text
              as="h2"
              variant="h3"
              color="white"
              className="mt-4 text-balance"
            >
              {tTitle}
            </Text>

            <Text
              as="p"
              variant="body"
              color="muted"
              className="mx-auto mt-4 max-w-md text-sm leading-6 sm:text-base"
            >
              {tDesc}
            </Text>

            <div className="mt-8 flex justify-center">
              <div className="w-full sm:w-auto">
                <Link href="/" className="block">
                  <Button size="md" fullWidth className="sm:w-auto">
                    {tBackHome}
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
