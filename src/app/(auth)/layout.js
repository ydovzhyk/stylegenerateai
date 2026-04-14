'use client'
export default function AuthLayout({ children }) {
  return (
    <div className="relative">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute left-1/2 top-0 h-[280px] w-[280px] -translate-x-1/2 rounded-full bg-primary/15 blur-3xl" />
      </div>

      <div className="container-app relative flex min-h-[calc(100svh-var(--header-h))] items-center justify-center py-6 sm:py-8 md:py-10">
        <div className="w-full max-w-md">{children}</div>
      </div>
    </div>
  )
}
