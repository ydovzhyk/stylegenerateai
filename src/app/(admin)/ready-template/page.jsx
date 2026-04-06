import ReadyTemplateForm from '@/components/ready-template/ReadyTemplateForm'

export const metadata = {
  title: 'Ready Template | Style Generate AI',
  description: 'Create and manage ready-made image templates',
}

export default function ReadyTemplatePage() {
  return (
    <section className="page-section">
      <div className="container-app">
        <div className="mb-8 md:mb-10">
          <p className="mb-3 text-xs font-semibold uppercase tracking-[0.24em] text-primary-soft md:text-sm">
            Admin · Template Library
          </p>

          <h1 className="section-title">Add image template</h1>

          <p className="section-subtitle mt-4 max-w-3xl">
            Upload a preview image and save a ready-made base prompt for your
            internal library of reusable styles.
          </p>
        </div>

        <ReadyTemplateForm />
      </div>
    </section>
  )
}
