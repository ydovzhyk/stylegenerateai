'use client'

import { useEffect, useRef } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import CreateYourLookAnimatedPreview from '@/components/create-your-look/CreateYourLookAnimatedPreview'
import CreateYourLookSearch from '@/components/create-your-look/CreateYourLookSearch'
import CreateYourLookDefaultTemplatesRail from '@/components/create-your-look/CreateYourLookDefaultTemplatesRail'
import {
  getIsEmptyResultsSearch,
  getYourLookSearchLoading,
  getIsManualSearch,
  getSelectedYourLookTemplate,
} from '@/store/ready-template/ready-template-selectors'
import { setIsManualSearch } from '@/store/ready-template/ready-template-slice'
import AiImageWorkspace from '@/components/shared/ai-image-workspace/AiImageWorkspace'
import Text from '@/components/shared/text/Text'
import { Sparkles } from 'lucide-react'

export default function CreateYourLookPage() {
  const dispatch = useDispatch()

  const loading = useSelector(getYourLookSearchLoading)
  const isEmptyResultsSearch = useSelector(getIsEmptyResultsSearch)
  const isManualSearch = useSelector(getIsManualSearch)
  const selectedTemplate = useSelector(getSelectedYourLookTemplate)

  const railRef = useRef(null)
  const prevLoadingRef = useRef(false)

  const generateRef = useRef(null)
  const prevSelectedTemplateIdRef = useRef(null)

  useEffect(() => {
    const justFinishedSearch = prevLoadingRef.current && !loading

    if (justFinishedSearch && isManualSearch && !isEmptyResultsSearch) {
      const headerOffset = 140
      const elementTop =
        (railRef.current?.getBoundingClientRect().top || 0) + window.scrollY

      window.scrollTo({
        top: elementTop - headerOffset,
        behavior: 'smooth',
      })

      dispatch(setIsManualSearch(false))
    }

    if (justFinishedSearch && isManualSearch && isEmptyResultsSearch) {
      dispatch(setIsManualSearch(false))
    }

    prevLoadingRef.current = loading
  }, [loading, isManualSearch, isEmptyResultsSearch, dispatch])

  useEffect(() => {
    if (!selectedTemplate?.id) return

    const isNewSelection =
      prevSelectedTemplateIdRef.current !== selectedTemplate.id
    prevSelectedTemplateIdRef.current = selectedTemplate.id

    if (!isNewSelection) return

    requestAnimationFrame(() => {
      const headerOffset = 140
      const elementTop =
        (generateRef.current?.getBoundingClientRect().top || 0) + window.scrollY

      window.scrollTo({
        top: elementTop - headerOffset,
        behavior: 'smooth',
      })
    })
  }, [selectedTemplate?.id])

  return (
    <div className="flex flex-col gap-12">
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

      <CreateYourLookAnimatedPreview />

      <div className="gradient-border-card flex items-start gap-4 p-5 sm:items-center sm:p-6">
        <span className="inline-flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border border-primary/20 bg-primary/10 text-primary-soft">
          <Sparkles size={24} />
        </span>

        <div>
          <Text as="h2" variant="h3" color="white" caseMode="sentence">
            Pick a look. Upload your photo. Transform yourself.
          </Text>

          <Text
            as="p"
            variant="body"
            color="muted"
            caseMode="sentence"
            className="mt-2 max-w-2xl text-sm leading-6 sm:text-base"
          >
            Click a template you like, upload your photo, and generate a
            personalized AI image in just a few clicks.
          </Text>
        </div>
      </div>

      <div ref={railRef}>
        <CreateYourLookDefaultTemplatesRail />
      </div>

      <CreateYourLookSearch />

      <div ref={generateRef}>
        <AiImageWorkspace template={selectedTemplate} />
      </div>
    </div>
  )
}