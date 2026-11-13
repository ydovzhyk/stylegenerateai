import Text from '@/components/shared/text/Text'
import ErrorLogsPanel from '@/components/admin/error-logs/ErrorLogsPanel'

export const metadata = {
  title: 'Error Logs | AI Style Generator',
  description: 'Failed generation usage logs for admin debugging',
}

export default function ErrorLogsPage() {
  return (
    <div>
      <div className="mb-5 max-w-3xl sm:mb-6">
        <Text
          as="p"
          variant="caption"
          color="faint"
          className="mb-3 uppercase tracking-[0.24em] text-primary-soft"
        >
          admin · errors
        </Text>

        <Text
          as="h1"
          variant="h1"
          color="white"
          caseMode="sentence"
          className="max-w-[92%] sm:max-w-none"
        >
          Generation error logs
        </Text>

        <Text
          as="p"
          variant="body"
          color="muted"
          caseMode="sentence"
          className="mt-3 max-w-2xl text-sm leading-6 sm:text-base"
        >
          Failed generation usage entries from the cost log. Filter by provider,
          product, mode, or error text, then delete noise when needed.
        </Text>
      </div>

      <ErrorLogsPanel />
    </div>
  )
}
