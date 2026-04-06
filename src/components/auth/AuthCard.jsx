'use client'

import Link from 'next/link'
import { FaGoogle } from 'react-icons/fa'
import { HiSparkles } from 'react-icons/hi2'

import Button from '@/components/shared/button/Button'
import Text from '@/components/shared/text/Text'

export default function AuthCard({
  title,
  subtitle,
  form,
  footerText,
  footerLinkHref,
  footerLinkText,
  googleEnabled = false,
  onGoogleClick,
  googleText = 'Continue with Google',
  orText = 'or',
}) {
  return (
    <div className="mx-auto w-full max-w-[460px]">
      <div className="gradient-border-card p-5 md:p-7">
        <div className="mb-6 text-center md:mb-8">
          <div className="mb-4 inline-flex h-14 w-14 items-center justify-center rounded-[20px] border border-primary/20 bg-primary/15 text-2xl text-primary-soft shadow-violet-soft">
            <HiSparkles />
          </div>

          <Text
            as="h1"
            variant="h2"
            color="white"
            className="mb-2"
            caseMode="sentence"
          >
            {title}
          </Text>

          <Text
            as="p"
            variant="body-sm"
            color="muted"
            className="mx-auto max-w-[320px]"
            caseMode="sentence"
          >
            {subtitle}
          </Text>
        </div>

        {googleEnabled ? (
          <div className="mb-5">
            <Button
              type="button"
              variant="secondary"
              fullWidth
              className="min-h-12 rounded-2xl"
              leftIcon={<FaGoogle size={18} />}
              onClick={onGoogleClick}
            >
              {googleText}
            </Button>

            <div className="mt-4 flex items-center gap-3">
              <span className="h-px flex-1 bg-white/10" />
              <Text
                as="span"
                variant="caption"
                color="faint"
                className="uppercase tracking-[0.18em]"
                caseMode="lower"
              >
                {orText}
              </Text>
              <span className="h-px flex-1 bg-white/10" />
            </div>
          </div>
        ) : null}

        {form}

        <div className="mt-6 flex flex-row items-center justify-center gap-2 border-t border-white/10 pt-5 text-center">
          <Text as="span" variant="body-sm" color="muted" caseMode="sentence">
            {footerText}
          </Text>

          <Link
            href={footerLinkHref}
            className="text-sm font-medium text-primary-soft transition hover:text-white"
          >
            {footerLinkText}
          </Link>
        </div>
      </div>
    </div>
  )
}
