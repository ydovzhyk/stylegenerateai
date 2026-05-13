'use client'

import { useState } from 'react'
import { toast } from 'react-toastify'
import Input from '@/components/shared/input/Input'
import Button from '@/components/shared/button/Button'

const initialForm = {
  name: '',
  email: '',
  message: '',
}

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(email).trim())
}

export default function ContactForm() {
  const [form, setForm] = useState(initialForm)
  const [errors, setErrors] = useState({})
  const [isLoading, setIsLoading] = useState(false)

  const updateField = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }))

    setErrors((prev) => {
      if (!prev[field]) return prev

      return {
        ...prev,
        [field]: '',
      }
    })
  }

  const validateForm = () => {
    const nextErrors = {}

    if (!form.name.trim()) {
      nextErrors.name = 'Please enter your name.'
    }

    if (!form.email.trim()) {
      nextErrors.email = 'Please enter your email.'
    } else if (!isValidEmail(form.email)) {
      nextErrors.email = 'Please enter a valid email.'
    }

    if (!form.message.trim()) {
      nextErrors.message = 'Please enter your message.'
    }

    setErrors(nextErrors)

    return Object.keys(nextErrors).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!validateForm()) return

    try {
      setIsLoading(true)

      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: form.name.trim(),
          email: form.email.trim(),
          message: form.message.trim(),
        }),
      })

      const data = await res.json().catch(() => null)

      if (!res.ok) {
        throw new Error(data?.message || 'Failed to send message.')
      }

      toast.success('Message sent successfully!')

      setForm(initialForm)
      setErrors({})
    } catch (error) {
      toast.error(error?.message || 'Something went wrong.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="gradient-border-card flex h-full flex-col p-5 sm:p-6"
    >
      <div className="flex flex-col gap-1">
        <Input
          id="contact-name"
          label="Your name"
          placeholder="Enter your name"
          inputClassName="h-[40px]"
          value={form.name}
          maxLength={100}
          required
          error={errors.name}
          onChange={(e) => updateField('name', e.target.value)}
        />

        <Input
          id="contact-email"
          label="Your email"
          placeholder="Enter your email"
          inputClassName="h-[40px]"
          type="email"
          value={form.email}
          maxLength={100}
          required
          error={errors.email}
          onChange={(e) => updateField('email', e.target.value)}
        />

        <Input
          id="contact-message"
          label="Your message"
          placeholder="Tell us what you need"
          as="textarea"
          rows={2}
          inputClassName="min-h-[80px]"
          value={form.message}
          maxLength={800}
          required
          error={errors.message}
          onChange={(e) => updateField('message', e.target.value)}
        />
      </div>

      <Button
        type="submit"
        variant="primary"
        loading={isLoading}
        loadingText="Sending message..."
        className="self-start"
      >
        Send Message
      </Button>
    </form>
  )
}
