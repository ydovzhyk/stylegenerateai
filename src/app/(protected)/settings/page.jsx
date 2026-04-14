'use client'

import { useEffect, useMemo, useState } from 'react'
import { useForm } from 'react-hook-form'
import { useDispatch, useSelector } from 'react-redux'

import Input from '@/components/shared/input/Input'
import Button from '@/components/shared/button/Button'
import Text from '@/components/shared/text/Text'
import { useTranslate } from '@/utils/translate/translate'

import { editUser, deleteUser } from '@/store/auth/auth-operations'
import { getUser } from '@/store/auth/auth-selectors'

function buildPayload(values) {
  const formData = new FormData()

  formData.append('name', String(values.name || '').trim())

  if (values.avatarFile) {
    formData.append('avatar', values.avatarFile)
  }

  const hasPasswordChange =
    values.currentPassword || values.newPassword || values.confirmNewPassword

  if (hasPasswordChange) {
    formData.append('currentPassword', values.currentPassword || '')
    formData.append('newPassword', values.newPassword || '')
    formData.append('confirmNewPassword', values.confirmNewPassword || '')
  }

  return formData
}

export default function SettingsPage() {
  const dispatch = useDispatch()
  const user = useSelector(getUser)

  const [avatarPreview, setAvatarPreview] = useState('')
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  const tAvatarAlt = useTranslate('User avatar preview', {
    caseMode: 'sentence',
  })

  const defaultAvatar = useMemo(
    () => user?.userAvatar || user?.avatarURL || '',
    [user],
  )

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    getValues,
    trigger,
    setError,
    formState: { errors, isSubmitting, isDirty },
  } = useForm({
    mode: 'onSubmit',
    reValidateMode: 'onChange',
    defaultValues: {
      name: user?.name || '',
      avatarFile: null,
      currentPassword: '',
      newPassword: '',
      confirmNewPassword: '',
    },
  })

  const avatarFile = watch('avatarFile')

  useEffect(() => {
    reset({
      name: user?.name || '',
      avatarFile: null,
      currentPassword: '',
      newPassword: '',
      confirmNewPassword: '',
    })
  }, [user, reset])

  useEffect(() => {
    if (!avatarFile) {
      setAvatarPreview('')
      return
    }

    const objectUrl = URL.createObjectURL(avatarFile)
    setAvatarPreview(objectUrl)

    return () => URL.revokeObjectURL(objectUrl)
  }, [avatarFile])

  const previewSrc = avatarPreview || defaultAvatar || ''

  const onAvatarChange = async (e) => {
    const file = e.target.files?.[0] || null

    setValue('avatarFile', file, {
      shouldDirty: true,
      shouldValidate: true,
    })

    await trigger('avatarFile')
  }

  const onSubmit = async (values) => {
    try {
      const formData = buildPayload(values)

      await dispatch(editUser(formData)).unwrap()

      reset({
        name: String(values.name || '').trim(),
        avatarFile: null,
        currentPassword: '',
        newPassword: '',
        confirmNewPassword: '',
      })
    } catch (error) {
      const message =
        error?.data?.message || error?.message || 'Failed to update profile'

      if (message === 'Current password is incorrect') {
        setError('currentPassword', {
          type: 'server',
          message,
        })
        return
      }

      if (message === 'Passwords do not match') {
        setError('confirmNewPassword', {
          type: 'server',
          message,
        })
        return
      }

      if (message === 'New password must be different from current password') {
        setError('newPassword', {
          type: 'server',
          message,
        })
        return
      }

      setError('name', {
        type: 'server',
        message,
      })
    }
  }

  const handleReset = () => {
    reset({
      name: user?.name || '',
      avatarFile: null,
      currentPassword: '',
      newPassword: '',
      confirmNewPassword: '',
    })
  }

  const openDeleteModal = () => setIsDeleteModalOpen(true)

  const closeDeleteModal = () => {
    if (isDeleting) return
    setIsDeleteModalOpen(false)
  }

  const handleDeleteProfile = async () => {
    if (!user?.id) return

    try {
      setIsDeleting(true)
      await dispatch(deleteUser(user.id)).unwrap()
      setIsDeleteModalOpen(false)
    } catch (error) {
      console.error(error)
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <div>
      <div className="mb-6 max-w-3xl sm:mb-7 md:mb-8">
        <Text
          as="p"
          variant="caption"
          color="faint"
          className="mb-3 uppercase tracking-[0.24em] text-primary-soft"
        >
          user · settings
        </Text>

        <Text
          as="h1"
          variant="h1"
          color="white"
          caseMode="sentence"
          className="max-w-[92%] sm:max-w-none"
        >
          Settings
        </Text>

        <Text
          as="p"
          variant="body"
          color="muted"
          caseMode="sentence"
          className="mt-3 max-w-2xl text-sm leading-6 sm:text-base"
        >
          Manage your profile information, avatar, and password.
        </Text>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} noValidate className="grid gap-8">
        <section className="gradient-border-card p-4 sm:p-5 md:p-6 lg:p-7">
          <div className="grid gap-4 lg:grid-cols-[280px_minmax(0,620px)] lg:items-start lg:gap-12 xl:grid-cols-[320px_minmax(0,640px)]">
            <div className="mx-auto w-full max-w-[320px] lg:mx-0 ">
              <div className="mb-4 max-w-[540px]">
                <Text as="h3" variant="h3" color="white" caseMode="sentence">
                  Avatar
                </Text>
              </div>

              <label className="flex min-h-[260px] w-full cursor-pointer flex-col items-center justify-center rounded-[24px] border border-dashed border-white/15 bg-background-soft/70 p-5 text-center transition hover:border-primary/60 hover:bg-background-soft sm:min-h-[300px] lg:min-h-[340px]">
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={onAvatarChange}
                />

                <div className="mb-5 overflow-hidden rounded-full border border-white/10 bg-background-soft">
                  {previewSrc ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={previewSrc}
                      alt={tAvatarAlt}
                      className="h-28 w-28 object-cover sm:h-32 sm:w-32 md:h-36 md:w-36"
                    />
                  ) : (
                    <div className="flex h-28 w-28 items-center justify-center text-4xl text-foreground-faint sm:h-32 sm:w-32 md:h-36 md:w-36 md:text-5xl">
                      👤
                    </div>
                  )}
                </div>

                <Text
                  as="p"
                  variant="body"
                  color="white"
                  caseMode="sentence"
                  className="max-w-[220px]"
                >
                  {previewSrc
                    ? 'Click to upload another image'
                    : 'Upload profile image'}
                </Text>

                <Text
                  as="p"
                  variant="caption"
                  color="muted"
                  caseMode="sentence"
                  className="mt-3 max-w-[220px] leading-5"
                >
                  Upload JPG, PNG, or WEBP image.
                </Text>
              </label>

              <input
                type="hidden"
                {...register('avatarFile', {
                  validate: (file) => {
                    if (!file) return true
                    if (!String(file.type || '').startsWith('image/')) {
                      return 'Only image files are allowed'
                    }
                    return true
                  },
                })}
              />

              <div className="mt-2 min-h-5 text-center text-xs leading-5 text-danger lg:text-left">
                {errors.avatarFile?.message || '\u00A0'}
              </div>
            </div>

            <div className="grid gap-4">
              <div className="grid gap-4">
                <div className="max-w-2xl">
                  <Text as="h3" variant="h3" color="white" caseMode="sentence">
                    Change name
                  </Text>

                  <Text
                    as="p"
                    variant="body-sm"
                    color="muted"
                    caseMode="sentence"
                    className="mt-2"
                  >
                    Update the name shown in your account.
                  </Text>
                </div>

                <div className="w-full max-w-[540px]">
                  <Input
                    id="settings-name"
                    label="Name"
                    type="text"
                    autoComplete="name"
                    placeholder="Your name"
                    hint="2–25 characters."
                    required
                    caseMode="sentence"
                    {...register('name', {
                      validate: (value) => {
                        const normalized = String(value || '').trim()
                        if (!normalized) return 'Name is required'
                        if (normalized.length < 2) {
                          return 'Name must be at least 2 characters'
                        }
                        if (normalized.length > 25) {
                          return 'Name must be at most 25 characters'
                        }
                        return true
                      },
                    })}
                    error={errors.name?.message}
                    inputClassName="h-12"
                  />
                </div>
              </div>

              <div className="h-px w-full max-w-[560px] bg-white/8" />

              <div className="grid gap-4">
                <div className="max-w-2xl">
                  <Text as="h3" variant="h3" color="white" caseMode="sentence">
                    Change password
                  </Text>

                  <Text
                    as="p"
                    variant="body-sm"
                    color="muted"
                    caseMode="sentence"
                    className="mt-2"
                  >
                    Leave these fields empty if you do not want to change your
                    password.
                  </Text>
                </div>

                <div className="w-full max-w-[540px]">
                  <Input
                    id="settings-current-password"
                    label="Current password"
                    type="password"
                    autoComplete="current-password"
                    placeholder="Enter current password"
                    caseMode="sentence"
                    {...register('currentPassword', {
                      validate: (value) => {
                        const newPassword = getValues('newPassword')
                        const confirmNewPassword =
                          getValues('confirmNewPassword')
                        const wantsChange =
                          String(newPassword || '').trim() ||
                          String(confirmNewPassword || '').trim()

                        if (wantsChange && !String(value || '').trim()) {
                          return 'Current password is required to change password'
                        }

                        return true
                      },
                    })}
                    error={errors.currentPassword?.message}
                    inputClassName="h-12"
                  />
                </div>

                <div className="w-full max-w-[540px]">
                  <Input
                    id="settings-new-password"
                    label="New password"
                    type="password"
                    autoComplete="new-password"
                    placeholder="Create new password"
                    caseMode="sentence"
                    {...register('newPassword', {
                      validate: (value) => {
                        const normalized = String(value || '')
                        const currentPassword = String(
                          getValues('currentPassword') || '',
                        )
                        const confirmPassword = String(
                          getValues('confirmNewPassword') || '',
                        )

                        const wantsChange =
                          currentPassword.trim() ||
                          normalized.trim() ||
                          confirmPassword.trim()

                        if (!wantsChange) return true
                        if (normalized.length < 6) {
                          return 'New password must be at least 6 characters'
                        }
                        if (normalized.length > 64) {
                          return 'New password must be at most 64 characters'
                        }
                        if (normalized && normalized === currentPassword) {
                          return 'New password must be different from current password'
                        }

                        return true
                      },
                    })}
                    error={errors.newPassword?.message}
                    inputClassName="h-12"
                  />
                </div>

                <div className="w-full max-w-[540px]">
                  <Input
                    id="settings-confirm-new-password"
                    label="Confirm new password"
                    type="password"
                    autoComplete="new-password"
                    placeholder="Repeat new password"
                    caseMode="sentence"
                    {...register('confirmNewPassword', {
                      validate: (value) => {
                        const currentPassword = getValues('currentPassword')
                        const newPassword = getValues('newPassword')
                        const wantsChange =
                          String(currentPassword || '').trim() ||
                          String(newPassword || '').trim() ||
                          String(value || '').trim()

                        if (!wantsChange) return true
                        if (!String(value || '').trim()) {
                          return 'Please confirm your new password'
                        }
                        if (value !== newPassword) {
                          return 'Passwords do not match'
                        }

                        return true
                      },
                    })}
                    error={errors.confirmNewPassword?.message}
                    inputClassName="h-12"
                  />
                </div>
              </div>
            </div>
          </div>
        </section>

        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <Button
              type="submit"
              loading={isSubmitting}
              disabled={isSubmitting || !isDirty}
              fullWidth
              className="min-h-12 rounded-2xl sm:w-auto"
            >
              Save changes
            </Button>

            <Button
              type="button"
              variant="secondary"
              onClick={handleReset}
              fullWidth
              className="min-h-12 rounded-2xl sm:w-auto"
            >
              Reset
            </Button>
          </div>

          <div className="flex sm:justify-end">
            <Button
              type="button"
              variant="secondary"
              onClick={openDeleteModal}
              fullWidth
              className="min-h-12 rounded-2xl sm:w-auto"
            >
              Delete profile
            </Button>
          </div>
        </div>
      </form>

      {isDeleteModalOpen ? (
        <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/70 px-4">
          <div className="w-full max-w-md rounded-[28px] border border-white/10 bg-background p-5 shadow-2xl sm:p-6">
            <Text as="h3" variant="h3" color="white" caseMode="sentence">
              Delete profile?
            </Text>

            <Text
              as="p"
              variant="body-sm"
              color="muted"
              caseMode="sentence"
              className="mt-3"
            >
              Are you sure you want to delete your profile? This action cannot
              be undone.
            </Text>

            <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-end">
              <Button
                type="button"
                variant="secondary"
                onClick={closeDeleteModal}
                disabled={isDeleting}
                fullWidth
                className="min-h-12 rounded-2xl sm:w-auto"
              >
                Cancel
              </Button>

              <Button
                type="button"
                onClick={handleDeleteProfile}
                loading={isDeleting}
                disabled={isDeleting}
                fullWidth
                className="min-h-12 rounded-2xl sm:w-auto"
              >
                Delete profile
              </Button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  )
}