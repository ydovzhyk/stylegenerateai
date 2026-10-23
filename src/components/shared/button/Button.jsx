'use client'

import clsx from 'clsx'
import { useTranslate } from '@/utils/translate/translate'

const baseClasses =
  'inline-flex items-center justify-center gap-2 border font-semibold transition-[background-color,border-color,color,box-shadow,transform] duration-300 disabled:cursor-not-allowed disabled:opacity-55'

const shapeClasses = {
  pill: 'rounded-full',
  soft: 'rounded-2xl',
}

const variantClasses = {
  primary:
    'border-transparent text-white bg-[linear-gradient(135deg,#6c4df2_0%,#7c5cff_55%,#8d72ff_100%)] shadow-[0_10px_30px_rgba(124,92,255,0.28)] hover:translate-y-[-1px] hover:bg-[linear-gradient(135deg,#7a5bff_0%,#8b72ff_55%,#a18dff_100%)] hover:shadow-[0_14px_34px_rgba(124,92,255,0.34)]',
  secondary:
    'border-white/12 text-white bg-white/4 hover:border-cyan-400/40 hover:bg-white/6 hover:shadow-[0_0_0_1px_rgba(0,213,255,0.14)]',
  ghost:
    'border-transparent text-[var(--text-soft)] bg-transparent hover:bg-white/6 hover:text-white',
}

const activeVariantClasses = {
  primary: '',
  secondary:
    'border-primary/35 bg-primary/10 text-white hover:border-primary/45 hover:bg-primary/15 hover:shadow-none',
  ghost:
    'border-white/10 bg-white/[0.06] text-white hover:bg-white/[0.08]',
}

const sizeClasses = {
  sm: 'min-h-9 px-3.5 text-xs',
  md: 'min-h-10 px-4 text-sm',
  lg: 'min-h-11 px-5 text-sm',
}

const iconOnlySizeClasses = {
  sm: 'h-9 w-9 min-h-9 min-w-9 p-0',
  md: 'h-10 w-10 min-h-10 min-w-10 p-0',
  lg: 'h-11 w-11 min-h-11 min-w-11 p-0',
}

function SideVisual({ icon, image, alt = '' }) {
  if (image) {
    return (
      <img src={image} alt={alt} className="h-4 w-4 shrink-0 object-contain" />
    )
  }

  if (icon) {
    return <span className="flex shrink-0 items-center">{icon}</span>
  }

  return null
}

function isPrimitiveText(value) {
  return typeof value === 'string' || typeof value === 'number'
}

export default function Button({
  children,
  type = 'button',
  variant = 'primary',
  size = 'md',
  shape = 'pill',
  iconOnly = false,
  active = false,
  fullWidth = false,
  loading = false,
  disabled = false,
  translate = true,
  loadingText = 'Loading...',
  className,
  leftIcon,
  rightIcon,
  leftImage,
  rightImage,
  leftImageAlt = '',
  rightImageAlt = '',
  ...props
}) {
  const isDisabled = disabled || loading
  const resolvedVariant = variantClasses[variant] ? variant : 'primary'
  const resolvedShape = shapeClasses[shape] ? shape : 'pill'
  const resolvedSize = sizeClasses[size] ? size : 'md'

  const textToTranslate =
    translate && isPrimitiveText(children) ? String(children) : ''

  const translatedChildren = useTranslate(textToTranslate)
  const translatedLoadingText = useTranslate(translate ? loadingText : '')

  const content =
    translate && isPrimitiveText(children) ? translatedChildren : children

  const resolvedLoadingText = translate
    ? translatedLoadingText || loadingText
    : loadingText

  return (
    <button
      type={type}
      disabled={isDisabled}
      aria-pressed={active ? true : undefined}
      className={clsx(
        baseClasses,
        shapeClasses[resolvedShape],
        active && activeVariantClasses[resolvedVariant]
          ? activeVariantClasses[resolvedVariant]
          : variantClasses[resolvedVariant],
        iconOnly
          ? iconOnlySizeClasses[resolvedSize]
          : sizeClasses[resolvedSize],
        fullWidth && 'w-full',
        className,
      )}
      {...props}
    >
      {loading ? (
        <>
          <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
          {!iconOnly ? <span>{resolvedLoadingText}</span> : null}
        </>
      ) : (
        <>
          <SideVisual icon={leftIcon} image={leftImage} alt={leftImageAlt} />
          {content ? <span>{content}</span> : null}
          <SideVisual icon={rightIcon} image={rightImage} alt={rightImageAlt} />
        </>
      )}
    </button>
  )
}
