import ReadyTemplateForm from '@/components/ready-template/ReadyTemplateForm'
import Text from '@/components/shared/text/Text'

export const metadata = {
  title: 'Ready Template | AI Style Generator',
  description: 'Create and manage ready-made image templates',
}

export default function ReadyTemplatePage() {
  return (
    <div>
      <div className="mb-6 max-w-3xl sm:mb-7 md:mb-8">
        <Text
          as="p"
          variant="caption"
          color="faint"
          className="mb-3 uppercase tracking-[0.24em] text-primary-soft"
        >
          admin · ready-template
        </Text>

        <Text
          as="h1"
          variant="h1"
          color="white"
          caseMode="sentence"
          className="max-w-[92%] sm:max-w-none"
        >
          Add new template
        </Text>

        <Text
          as="p"
          variant="body"
          color="muted"
          caseMode="sentence"
          className="mt-3 max-w-2xl text-sm leading-6 sm:text-base"
        >
          Upload a preview image and save a ready-made base prompt for your
          internal library of reusable styles.
        </Text>
      </div>

      <ReadyTemplateForm />
    </div>
  )
}