import Text from '@/components/shared/text/Text'
import AnimatePreviewTester from '@/components/admin/animate-admin/AnimatePreviewTester'

export const metadata = {
  title: 'Animate Preview | AI Style Generator',
  description: 'Generate Animate preview clips and save them as templates',
}

export default function AnimatePreviewPage() {
  return (
    <div>
      <div className="mb-6 max-w-3xl sm:mb-7 md:mb-8">
        <Text
          as="p"
          variant="caption"
          color="faint"
          className="mb-3 uppercase tracking-[0.24em] text-primary-soft"
        >
          admin · animate
        </Text>

        <Text
          as="h1"
          variant="h1"
          color="white"
          caseMode="sentence"
          className="max-w-[92%] sm:max-w-none"
        >
          Animate preview studio
        </Text>

        <Text
          as="p"
          variant="body"
          color="muted"
          caseMode="sentence"
          className="mt-3 max-w-2xl text-sm leading-6 sm:text-base"
        >
          Test Kling image-to-video here. Save only the good clips as showcase
          templates for the public Animate page.
        </Text>
      </div>

      <AnimatePreviewTester />
    </div>
  )
}
