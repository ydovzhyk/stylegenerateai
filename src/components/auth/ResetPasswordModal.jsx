'use client'

import { useEffect } from 'react'
import { useDispatch } from 'react-redux'
import { useForm } from 'react-hook-form'
import clsx from 'clsx'

import { resetPassword } from '@/store/auth/auth-operations'

import Input from '@/components/shared/input/Input'
import Button from '@/components/shared/button/Button'
import Text from '@/components/shared/text/Text'

export default function ResetPasswordModal({
  open,
  token,
  onClose,
  onSuccess,
}) {
  const dispatch = useDispatch()

  const {
    register,
    handleSubmit,
    watch,
    reset,
    formState: { errors, isSubmitting },
  } = useForm({
    mode: 'onSubmit',
    reValidateMode: 'onChange',
    defaultValues: {
      password: '',
      confirmPassword: '',
    },
  })

  const passwordValue = watch('password')

  useEffect(() => {
    if (!open) {
      reset({
        password: '',
        confirmPassword: '',
      })
    }
  }, [open, reset])

  useEffect(() => {
    if (!open) return

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        onClose?.()
      }
    }

    document.addEventListener('keydown', handleKeyDown)

    return () => {
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [open, onClose])

  const onSubmit = async (data) => {
    try {
      await dispatch(
        resetPassword({
          token,
          password: data.password,
          confirmPassword: data.confirmPassword,
        }),
      ).unwrap()

      reset({
        password: '',
        confirmPassword: '',
      })

      onSuccess?.()
    } catch (error) {
      // no-op
    }
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center p-4">
      <button
        type="button"
        aria-label="Close modal overlay"
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={onClose}
      />

      <div
        className={clsx(
          'relative z-[121] w-full max-w-md rounded-[28px] border border-white/10 bg-[linear-gradient(180deg,rgba(20,23,32,0.98),rgba(17,19,26,0.99))] p-6 shadow-[0_24px_80px_rgba(0,0,0,0.45),0_0_0_1px_rgba(124,92,255,0.08)]',
        )}
        role="dialog"
        aria-modal="true"
        aria-labelledby="reset-password-modal-title"
      >
        <div className="mb-5">
          <Text
            id="reset-password-modal-title"
            as="h2"
            variant="h3"
            color="white"
            className="mb-2"
          >
            Create a new password
          </Text>

          <Text as="p" variant="body-sm" color="muted">
            Enter your new password below to restore access to your account.
          </Text>
        </div>

        <form
          onSubmit={handleSubmit(onSubmit)}
          noValidate
          className="grid gap-4"
        >
          <Input
            id="reset-password"
            label="New password"
            type="password"
            autoComplete="new-password"
            placeholder="Enter your new password"
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

          <Input
            id="reset-confirm-password"
            label="Confirm password"
            type="password"
            autoComplete="new-password"
            placeholder="Repeat your new password"
            hint="Both passwords must match."
            required
            caseMode="sentence"
            {...register('confirmPassword', {
              required: 'Please confirm your password',
              validate: (value) =>
                value === passwordValue || 'Passwords do not match',
            })}
            error={errors.confirmPassword?.message}
            inputClassName="h-12"
          />

          <div className="mt-2 grid grid-cols-1 gap-3 sm:grid-cols-2">
            <Button
              type="button"
              variant="secondary"
              onClick={onClose}
              disabled={isSubmitting}
              className="min-h-12 rounded-2xl"
            >
              Cancel
            </Button>

            <Button
              type="submit"
              loading={isSubmitting}
              disabled={isSubmitting}
              className="min-h-12 rounded-2xl"
            >
              Save password
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
