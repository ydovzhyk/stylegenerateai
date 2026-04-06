import AdminRoute from '@/components/guards/AdminRoute'
// import AdminHeader from '@/components/layout/WorkspaceHeader'

export default function AdminLayout({ children }) {
  return (
    <AdminRoute>
      <section className="page-section">
        {/* <AdminHeader /> */}
        <div className="container-app">{children}</div>
      </section>
    </AdminRoute>
  )
}