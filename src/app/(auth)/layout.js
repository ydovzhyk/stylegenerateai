export default function AuthLayout({ children }) {
  return (
    <section className="page-section relative overflow-hidden border-t border-primary/20">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute left-1/2 top-0 h-[280px] w-[280px] -translate-x-1/2 rounded-full bg-primary/10 blur-3xl sm:h-[320px] sm:w-[320px] md:h-[360px] md:w-[360px]" />
        <div className="absolute bottom-0 right-0 h-[220px] w-[220px] rounded-full bg-cyan-400/10 blur-3xl sm:h-[260px] sm:w-[260px] md:h-[300px] md:w-[300px]" />
      </div>

      <div className="container-app relative flex min-h-full items-center justify-center py-6 sm:py-8 md:py-10">
        <div className="w-full max-w-md">{children}</div>
      </div>
    </section>
  )
}
