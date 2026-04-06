'use client'

import ProtectedRoute from '@/components/guards/ProtectedRoute'

export default function ProtectedLayout({ children }) {
  return (
    <ProtectedRoute>
      <section className="page-section relative overflow-hidden border-t border-primary/10">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute left-0 top-0 h-[220px] w-[220px] rounded-full bg-primary/10 blur-3xl sm:h-[280px] sm:w-[280px] md:h-[320px] md:w-[320px]" />
          <div className="absolute bottom-0 right-0 h-[180px] w-[180px] rounded-full bg-cyan-400/10 blur-3xl sm:h-[220px] sm:w-[220px] md:h-[260px] md:w-[260px]" />
        </div>

        <div className="container-app relative px-0 py-6 sm:py-8 md:py-10">
          {children}
        </div>
      </section>
    </ProtectedRoute>
  )
}
