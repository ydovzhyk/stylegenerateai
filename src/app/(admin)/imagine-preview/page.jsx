import Text from '@/components/shared/text/Text'
import ImaginePreviewTester from '@/components/admin/imagine-admin/ImaginePreviewTester'

export const metadata = {
  title: 'Imagine Preview | AI Style Generator',
  description: 'Generate Imagine preview examples and save them as templates',
}

export default function ImaginePreviewPage() {
  return (
    <div>
      <div className="mb-6 max-w-3xl sm:mb-7 md:mb-8">
        <Text
          as="p"
          variant="caption"
          color="faint"
          className="mb-3 uppercase tracking-[0.24em] text-primary-soft"
        >
          admin · imagine
        </Text>

        <Text
          as="h1"
          variant="h1"
          color="white"
          caseMode="sentence"
          className="max-w-[92%] sm:max-w-none"
        >
          Imagine preview studio
        </Text>

        <Text
          as="p"
          variant="body"
          color="muted"
          caseMode="sentence"
          className="mt-3 max-w-2xl text-sm leading-6 sm:text-base"
        >
          Test Imagine modes and save showcase templates for the public preview.
        </Text>
      </div>

      <ImaginePreviewTester />
    </div>
  )
}
