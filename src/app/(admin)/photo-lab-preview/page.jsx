import Text from '@/components/shared/text/Text'
import AdminImageProviderSwitch from '@/components/admin/AdminImageProviderSwitch'
import PhotoLabPreviewTester from '@/components/admin/photo-lab-admin/PhotoLabPreviewTester'

export const metadata = {
  title: 'Photo Lab Preview | AI Style Generator',
  description: 'Test Photo Lab modes and generate preview examples',
}

export default function PhotoLabPreviewPage() {
  return (
    <div>
      <div className="mb-5 max-w-3xl sm:mb-6">
        <Text
          as="p"
          variant="caption"
          color="faint"
          className="mb-3 uppercase tracking-[0.24em] text-primary-soft"
        >
          admin · photo-lab
        </Text>

        <Text
          as="h1"
          variant="h1"
          color="white"
          caseMode="sentence"
          className="max-w-[92%] sm:max-w-none"
        >
          Photo Lab preview studio
        </Text>

        <Text
          as="p"
          variant="body"
          color="muted"
          caseMode="sentence"
          className="mt-3 max-w-2xl text-sm leading-6 sm:text-base"
        >
          Test Photo Lab modes, prompts, source images, and quality settings
          before using them on the public page.
        </Text>
      </div>

      <AdminImageProviderSwitch className="mb-5 sm:mb-6 md:mb-7" />

      <PhotoLabPreviewTester />
    </div>
  )
}
