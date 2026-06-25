'use client'

import clsx from 'clsx'
import { useTranslate } from '@/utils/translate/translate'

const variantClasses = {
  hero: 'text-4xl font-extrabold leading-tight md:text-5xl xl:text-6xl',
  h1: 'text-3xl font-bold leading-tight md:text-4xl',
  h2: 'text-2xl font-bold leading-tight md:text-3xl',
  h3: 'text-xl font-semibold leading-snug md:text-2xl',
  body: 'text-base font-normal leading-7 md:text-lg',
  'body-sm': 'text-sm font-normal leading-6 md:text-base',
  caption: 'text-sm font-medium leading-5',
  label: 'text-sm font-medium leading-5',
  'sub-block-label': 'text-base font-medium leading-6',
  'section-title': 'text-lg font-semibold leading-snug md:text-xl',
  button: 'text-sm font-semibold leading-none',
}

const colorClasses = {
  default: 'text-foreground',
  soft: 'text-foreground-soft',
  faint: 'text-foreground-faint',
  muted: 'text-foreground-faint',
  danger: 'text-danger',
  white: 'text-white',
}

export default function Text({
  as: Tag = 'p',
  variant = 'body',
  color = 'default',
  className,
  children,
  translate = true,
  caseMode = 'auto',
}) {
  const isPrimitive =
    typeof children === 'string' || typeof children === 'number'

  const translated = useTranslate(
    translate && isPrimitive ? String(children) : '',
    { caseMode },
  )

  return (
    <Tag
      className={clsx(
        variantClasses[variant] || variantClasses.body,
        colorClasses[color] || colorClasses.default,
        className,
      )}
    >
      {translate && isPrimitive ? translated : children}
    </Tag>
  )
}
