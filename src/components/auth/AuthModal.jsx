'use client'

import Text from '@/components/shared/text/Text'
import { MODAL_OVERLAY_CLASS } from '@/constants/modal-overlay'

export default function AuthModal({
  open,
  title,
  description,
  children,
  maxWidth = 'max-w-[460px]',
}) {
  if (!open) return null

  return (
    <div className={MODAL_OVERLAY_CLASS}>
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