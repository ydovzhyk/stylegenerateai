'use client'

import Text from '@/components/shared/text/Text'

export default function AuthModal({
  open,
  title,
  description,
  children,
  maxWidth = 'max-w-[460px]',
}) {
  if (!open) return null

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 px-4 backdrop-blur-md">
      <div className={`gradient-border-card w-full ${maxWidth} p-5 sm:p-6`}>
        {title ? (
          <Text as="h2" variant="h2" color="white" caseMode="sentence">
            {title}
          </Text>
        ) : null}

        {description ? (
          <Text
            as="p"
            variant="body-sm"
            color="muted"
            caseMode="sentence"
            className="mt-3"
          >
            {description}
          </Text>
        ) : null}

        <div className="mt-5">{children}</div>
      </div>
    </div>
  )
}