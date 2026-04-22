'use client'

import { useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import CreateYourLookAnimatedPreview from '@/components/create-your-look/CreateYourLookAnimatedPreview'
import CreateYourLookSearch from '@/components/create-your-look/CreateYourLookSearch'
import { getYourLookPreviewTemplates } from '@/store/ready-template/ready-template-operations'
import { getYourLookPreviewTemplates as selectYourLookPreviewTemplates } from '@/store/ready-template/ready-template-selectors'

import Text from '@/components/shared/text/Text'

export default function CreateYourLookPage() {
  const dispatch = useDispatch()
  const previewGroups = useSelector(selectYourLookPreviewTemplates)

  useEffect(() => {
    dispatch(getYourLookPreviewTemplates())
  }, [dispatch])

  return (
    <div className='flex flex-col gap-12'>
      <div className="max-w-3xl">
        <Text
          as="p"
          variant="caption"
          color="faint"
          className="mb-3 uppercase tracking-[0.24em] text-primary-soft"
        >
          site · CREATE YOUR LOOK
        </Text>

        <Text
          as="h1"
          variant="h1"
          color="white"
          caseMode="sentence"
          className="max-w-[92%] sm:max-w-none"
        >
          Create Your Look
        </Text>

        <Text
          as="p"
          variant="body"
          color="muted"
          caseMode="sentence"
          className="mt-3 max-w-2xl text-sm leading-6 sm:text-base"
        >
          Transform your photo into a new visual identity with curated AI
          styles. Explore cinematic, fantasy, artistic, and modern looks, then
          generate a polished result in just a few clicks.
        </Text>
      </div>
      <CreateYourLookAnimatedPreview previewGroups={previewGroups} />
      <CreateYourLookSearch />
    </div>
  )
}