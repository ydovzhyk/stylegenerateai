'use client'

import ProtectedRoute from '@/components/guards/ProtectedRoute'

export default function ProtectedLayout({ children }) {
  return (
    <ProtectedRoute>
      <div className="container-app px-0 py-6 sm:py-8 md:py-10">{children}</div>
    </ProtectedRoute>
  )
}
