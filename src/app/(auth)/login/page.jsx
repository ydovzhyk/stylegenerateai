'use client'

import { useEffect, useMemo, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { useForm } from 'react-hook-form'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'

import { login, forgotPassword } from '@/store/auth/auth-operations'
import { getVisitorId } from '@/store/visitor/visitor-selectors'

import Input from '@/components/shared/input/Input'
import Button from '@/components/shared/button/Button'
import Text from '@/components/shared/text/Text'
import AuthCard from '@/components/auth/AuthCard'
import ResetPasswordModal from '@/components/auth/ResetPasswordModal'

function validateEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(value || '').trim())
}

export default function LoginPage() {
  const dispatch = useDispatch()
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const visitorId = useSelector(getVisitorId)
  const safeVisitorId = encodeURIComponent(visitorId || '')

  const API_URL = process.env.NEXT_PUBLIC_API_URL

  const resetToken = searchParams.get('resetToken') || ''
  const [isResetModalOpen, setIsResetModalOpen] = useState(false)

  const {
    register,
    handleSubmit,
    getValues,
    setError,
    clearErrors,
    formState: { errors, isSubmitting },
    reset,
  } = useForm({
    mode: 'onSubmit',
    reValidateMode: 'onChange',
    defaultValues: {
      email: '',
      password: '',
    },
  })

  useEffect(() => {
    setIsResetModalOpen(Boolean(resetToken))
  }, [resetToken])

  const cleanedLoginUrl = useMemo(() => pathname || '/login', [pathname])

  const closeResetModal = () => {
    setIsResetModalOpen(false)
    router.replace(cleanedLoginUrl)
  }

  const handleResetSuccess = () => {
    setIsResetModalOpen(false)
    router.replace(cleanedLoginUrl)
  }

  const onSubmit = async (data) => {
    try {
      await dispatch(
        login({
          email: data.email.trim(),
          password: data.password,
          visitorId: visitorId || '',
        }),
      ).unwrap()

      reset()
      router.push('/')
    } catch (error) {
      // no-op, error is handled by the slice and toast notifications
    }
  }

  const onForgotPassword = async () => {
    const email = String(getValues('email') || '').trim()

    if (!email) {
      setError('email', {
        type: 'manual',
        message: 'Email is required',
      })
      return
    }

    if (!validateEmail(email)) {
      setError('email', {
        type: 'manual',
        message: 'Enter a valid email',
      })
      return
    }

    clearErrors('email')

    try {
      await dispatch(forgotPassword({ email })).unwrap()
    } catch (error) {
      // no-op, error is handled by the slice and toast notifications
    }
  }

  const onGoogleClick = (e) => {
    e.preventDefault()
    if (!API_URL) return

    const currentOrigin = encodeURIComponent(window.location.origin)
    window.location.href = `${API_URL}/api/google?origin=${currentOrigin}&visitorId=${safeVisitorId}`
  }

  const form = (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="grid gap-4">
      <Input
        id="login-email"
        label="Email"
        type="email"
        autoComplete="email"
        inputMode="email"
        placeholder="you@example.com"
        hint="Enter the email you used during registration."
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
        id="login-password"
        label="Password"
        type="password"
        autoComplete="current-password"
        placeholder="Enter your password"
        hint="At least 6 characters."
        required
        caseMode="sentence"
        {...register('password', {
          required: 'Password is required',
          minLength: {
            value: 6,
            message: 'Password must be at least 6 characters',
          },
        })}
        error={errors.password?.message}
        inputClassName="h-12"
      />

      <div className="-mt-1 flex justify-end">
        <button
          type="button"
          onClick={onForgotPassword}
          className="inline-flex"
        >
          <Text
            as="span"
            variant="caption"
            color="faint"
            className="text-right transition-opacity hover:opacity-80"
            caseMode="sentence"
          >
            Forgot password?
          </Text>
        </button>
      </div>

      <Button
        type="submit"
        fullWidth
        loading={isSubmitting}
        disabled={isSubmitting}
        className="mt-1 min-h-12 rounded-2xl"
      >
        Sign in
      </Button>
    </form>
  )

  return (
    <>
      <AuthCard
        title="Welcome back"
        subtitle="Sign in to your account to continue creating and managing AI image styles."
        form={form}
        footerText="Don’t have an account?"
        footerLinkHref="/register"
        footerLinkText="Sign up"
        googleEnabled={Boolean(API_URL)}
        onGoogleClick={onGoogleClick}
        googleText="Continue with Google"
        orText="or"
      />

      <ResetPasswordModal
        open={isResetModalOpen}
        token={resetToken}
        onClose={closeResetModal}
        onSuccess={handleResetSuccess}
      />
    </>
  )
}
