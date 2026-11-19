'use client'

import Text from '@/components/shared/text/Text'
import OnTheWallWorkspace from '@/components/on-the-wall/OnTheWallWorkspace'

export default function OnTheWallPage() {
  return (
    <div className="flex flex-col gap-10">
      <div className="max-w-3xl">
        <Text
          as="p"
          variant="caption"
          color="faint"
          className="mb-3 uppercase tracking-[0.24em] text-primary-soft"
        >
          site · on the wall
        </Text>

        <Text as="h1" variant="h1" color="white" caseMode="sentence">
          See your art on your walls
        </Text>

        <Text
          as="p"
          variant="body"
          color="muted"
          caseMode="sentence"
          className="mt-3 max-w-2xl text-sm leading-6 sm:text-base"
        >
          Upload any wall photos, confirm Build room for a stitched room view,
          then preview artwork on it. AI blend into lighting and gallery pick
          come next.
        </Text>
      </div>

      <OnTheWallWorkspace />
    </div>
  )
}
