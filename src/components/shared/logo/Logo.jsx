import Image from 'next/image'
import Link from 'next/link'
import clsx from 'clsx'

export default function Logo({
  size = 48,
  withText = true,
  className,
}) {
  return (
    <Link
      href="/"
      aria-label="Go to homepage"
      className={clsx('flex items-center gap-2 group', className)}
    >
      {/* ICON */}
      <div style={{ height: size, width: size }} className="relative shrink-0">
        <Image
          src="/images/logo.png"
          alt="AI Style Generator logo"
          fill
          sizes={`${size}px`}
          priority
          className="object-contain transition-transform duration-300 group-hover:scale-105"
        />
      </div>

      {/* TEXT */}
      {withText && (
        <div className="leading-none">
          <p
            className="font-semibold tracking-tight text-white"
            style={{
              fontSize: size * 0.42, // адаптивно від іконки
            }}
          >
            AI Style Generator
          </p>

          <p
            className="mt-1 font-normal text-white/70"
            style={{
              fontSize: size * 0.22,
            }}
          >
            AI Image Studio
          </p>
        </div>
      )}
    </Link>
  )
}
