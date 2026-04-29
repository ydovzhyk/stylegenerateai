'use client'

import { useState } from 'react'
import { useDispatch } from 'react-redux'
import { useForm } from 'react-hook-form'
import { useRouter } from 'next/navigation'

import { registration, sendRegisterCode } from '@/store/auth/auth-operations'

import Input from '@/components/shared/input/Input'
import Button from '@/components/shared/button/Button'
import AuthCard from '@/components/auth/AuthCard'
import AuthModal from '@/components/auth/AuthModal'

import { useTranslate } from '@/utils/translate/translate'

function validateEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(value || '').trim())
}

export default function RegisterPage() {
  const dispatch = useDispatch()
  const router = useRouter()

  const API_URL = process.env.NEXT_PUBLIC_API_URL
  const DEFAULT_AVATAR = process.env.NEXT_PUBLIC_AVATARS_API_URL || ''

  const [pendingPayload, setPendingPayload] = useState(null)
  const [code, setCode] = useState('')
  const [isCodeModalOpen, setIsCodeModalOpen] = useState(false)
  const [codeSubmitting, setCodeSubmitting] = useState(false)

  const tLinkAction = useTranslate('Sign in')

  const {
    register,
    handleSubmit,
    getValues,
    formState: { errors, isSubmitting },
    reset,
  } = useForm({
    mode: 'onSubmit',
    reValidateMode: 'onChange',
    defaultValues: {
      name: '',
      email: '',
      password: '',
      confirmPassword: '',
    },
  })

  const onSubmit = async (data) => {
    try {
      const payload = {
        name: data.name.trim(),
        email: data.email.trim().toLowerCase(),
        password: data.password,
        userAvatar: DEFAULT_AVATAR,
      }

      await dispatch(sendRegisterCode({ email: payload.email })).unwrap()

      setPendingPayload(payload)
      setCode('')
      setIsCodeModalOpen(true)
    } catch {
      // handled by ToastListener
    }
  }

  const handleConfirmCode = async () => {
    const safeCode = String(code || '').trim()

    if (!pendingPayload || safeCode.length !== 6) return

    setCodeSubmitting(true)

    try {
      await dispatch(
        registration({
          ...pendingPayload,
          code: safeCode,
        }),
      ).unwrap()

      setIsCodeModalOpen(false)
      setPendingPayload(null)
      setCode('')
      reset()
      router.push('/')
    } catch {
      // handled by ToastListener
    } finally {
      setCodeSubmitting(false)
    }
  }

  const handleCloseCodeModal = () => {
    if (codeSubmitting) return

    setIsCodeModalOpen(false)
    setCode('')
  }

  const onGoogleClick = (e) => {
    e.preventDefault()
    if (!API_URL) return

    const currentOrigin = encodeURIComponent(window.location.origin)
    window.location.href = `${API_URL}/api/google?origin=${currentOrigin}`
  }

  const form = (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="grid gap-4">
      <Input
        id="register-name"
        label="Name"
        type="text"
        autoComplete="name"
        placeholder="Your name"
        hint="Enter your name."
        required
        caseMode="sentence"
        {...register('name', {
          validate: (value) => {
            const normalized = String(value || '').trim()
            if (!normalized) return 'Name is required'
            if (normalized.length < 2)
              return 'Name must be at least 2 characters'
            if (normalized.length > 25)
              return 'Name must be at most 25 characters'
            return true
          },
        })}
        error={errors.name?.message}
        inputClassName="h-12"
      />

      <Input
        id="register-email"
        label="Email"
        type="email"
        autoComplete="email"
        inputMode="email"
        placeholder="you@example.com"
        hint="We’ll use this email for your account."
        required
        caseMode="sentence"
        {...register('email', {
          required: 'Email is required',
          validate: (value) => validateEmail(value) || 'Enter a valid email',
        })}
        error={errors.email?.message}
        inputClassName="h-12"
      />

      <Input
        id="register-password"
        label="Password"
        type="password"
        autoComplete="new-password"
        placeholder="Create password"
        hint="At least 6 characters."
        required
        caseMode="sentence"
        {...register('password', {
          required: 'Password is required',
          minLength: {
            value: 6,
            message: 'Password must be at least 6 characters',
          },
          maxLength: {
            value: 64,
            message: 'Password must be at most 64 characters',
          },
        })}
        error={errors.password?.message}
        inputClassName="h-12"
      />

      <Input
        id="register-confirm-password"
        label="Confirm password"
        type="password"
        autoComplete="new-password"
        placeholder="Repeat password"
        hint="Repeat the same password."
        required
        caseMode="sentence"
        {...register('confirmPassword', {
          required: 'Please confirm your password',
          validate: (value) =>
            value === getValues('password') || 'Passwords do not match',
        })}
        error={errors.confirmPassword?.message}
        inputClassName="h-12"
      />

      <Button
        type="submit"
        fullWidth
        loading={isSubmitting}
        disabled={isSubmitting || isCodeModalOpen}
        className="mt-1 min-h-12 rounded-2xl"
      >
        Create account
      </Button>
    </form>
  )

  return (
    <>
      <AuthCard
        title="Create account"
        subtitle="Start generating styled images, save your results, and build your personal gallery."
        form={form}
        footerText="Already have an account?"
        footerLinkHref="/login"
        footerLinkText={tLinkAction}
        googleEnabled={Boolean(API_URL)}
        onGoogleClick={onGoogleClick}
        googleText="Continue with Google"
        orText="or"
      />

      <AuthModal
        open={isCodeModalOpen}
        title="Verify your email"
        description="We sent a 6-digit verification code to your email. Enter it below to finish creating your account."
      >
        <Input
          id="register-code"
          label="Verification code"
          type="text"
          inputMode="numeric"
          autoComplete="one-time-code"
          placeholder="123456"
          value={code}
          onChange={(e) => {
            const next = e.target.value.replace(/\D/g, '').slice(0, 6)
            setCode(next)
          }}
          inputClassName="h-12 text-center tracking-[0.35em]"
        />

        <div className="mt-6 grid gap-3 sm:grid-cols-2">
          <Button
            type="button"
            variant="secondary"
            fullWidth
            disabled={codeSubmitting}
            onClick={handleCloseCodeModal}
            className="min-h-12 rounded-2xl"
          >
            Cancel
          </Button>

          <Button
            type="button"
            fullWidth
            loading={codeSubmitting}
            disabled={code.length !== 6 || codeSubmitting}
            onClick={handleConfirmCode}
            className="min-h-12 rounded-2xl"
          >
            Verify
          </Button>
        </div>
      </AuthModal>
    </>
  )
}
