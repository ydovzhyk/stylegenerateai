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
import CreateYourLookGenerateClientImage from '@/components/create-your-look/CreateYourLookGenerateClientImage'
import Text from '@/components/shared/text/Text'

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
      const headerOffset = 120
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
      const headerOffset = 120
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

      <div ref={railRef}>
        <CreateYourLookDefaultTemplatesRail />
      </div>

      <CreateYourLookSearch />

      <div ref={generateRef}>
        <CreateYourLookGenerateClientImage template={selectedTemplate} />
      </div>
    </div>
  )
}