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
          Upload one to three photos of your room walls, pick a picture from
          your gallery (or upload one), place and resize it on the wall. Next
          we will blend it into the room and stitch multi-wall shots into a
          prism-style view.
        </Text>
      </div>

      <OnTheWallWorkspace />
    </div>
  )
}
