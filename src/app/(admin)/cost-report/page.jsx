import Text from '@/components/shared/text/Text'
import CostReportPanel from '@/components/admin/cost-report/CostReportPanel'

export const metadata = {
  title: 'Cost Report | AI Style Generator',
  description: 'Provider balances and generation cost averages',
}

export default function CostReportPage() {
  return (
    <div>
      <div className="mb-5 max-w-3xl sm:mb-6">
        <Text
          as="p"
          variant="caption"
          color="faint"
          className="mb-3 uppercase tracking-[0.24em] text-primary-soft"
        >
          admin · cost
        </Text>

        <Text
          as="h1"
          variant="h1"
          color="white"
          caseMode="sentence"
          className="max-w-[92%] sm:max-w-none"
        >
          Generation cost report
        </Text>

        <Text
          as="p"
          variant="body"
          color="muted"
          caseMode="sentence"
          className="mt-3 max-w-2xl text-sm leading-6 sm:text-base"
        >
          Log provider wallet balances and compare them with generation counts
          to estimate average cost per mode.
        </Text>
      </div>

      <CostReportPanel />
    </div>
  )
}
