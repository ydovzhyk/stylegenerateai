'use client'

import AdminRoute from '@/components/guards/AdminRoute'
// import AdminHeader from '@/components/layout/AdminHeader'

export default function AdminLayout({ children }) {
  return (
    <AdminRoute>
      <div className="container-app px-0 py-6 sm:py-8 md:py-10">
        {/* <AdminHeader /> */}
        {children}
      </div>
    </AdminRoute>
  )
}
