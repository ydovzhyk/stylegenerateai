'use client'

import { useDispatch } from 'react-redux'
import { useForm } from 'react-hook-form'
import { useRouter } from 'next/navigation'

import { registration } from '@/store/auth/auth-operations'

import Input from '@/components/shared/input/Input'
import Button from '@/components/shared/button/Button'
import AuthCard from '@/components/auth/AuthCard'

function validateEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(value || '').trim())
}

export default function RegisterPage() {
  const dispatch = useDispatch()
  const router = useRouter()

  const API_URL = process.env.NEXT_PUBLIC_API_URL
  const DEFAULT_AVATAR = process.env.NEXT_PUBLIC_AVATARS_API_URL || ''

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
        email: data.email.trim(),
        password: data.password,
        userAvatar: DEFAULT_AVATAR,
      }

      await dispatch(registration(payload)).unwrap()

      reset()
      router.push('/')
    } catch (error) {
      //no-op, error is handled by the slice and toast notifications
    }
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
        disabled={isSubmitting}
        className="mt-1 min-h-12 rounded-2xl"
      >
        Create account
      </Button>
    </form>
  )

  return (
    <AuthCard
      title="Create account"
      subtitle="Start generating styled images, save your results, and build your personal gallery."
      form={form}
      footerText="Already have an account?"
      footerLinkHref="/login"
      footerLinkText="Sign in"
      googleEnabled={Boolean(API_URL)}
      onGoogleClick={onGoogleClick}
      googleText="Continue with Google"
      orText="or"
    />
  )
}
