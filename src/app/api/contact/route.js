import nodemailer from 'nodemailer'
import { NextResponse } from 'next/server'

export const runtime = 'nodejs'

const MAX_NAME_LENGTH = 100
const MAX_EMAIL_LENGTH = 100
const MAX_MESSAGE_LENGTH = 800

function normalizeString(value, maxLength) {
  return String(value || '')
    .trim()
    .slice(0, maxLength)
}

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(email).trim())
}

function escapeHtml(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;')
}

function buildTelegramMessage({ name, email, message }) {
  return [
    'New message from Style Generate AI',
    '',
    `Name: ${name}`,
    `Email: ${email}`,
    '',
    'Message:',
    message,
  ].join('\n')
}

function buildEmailHtml({ name, email, message }) {
  const safeName = escapeHtml(name)
  const safeEmail = escapeHtml(email)
  const safeMessage = escapeHtml(message).replaceAll('\n', '<br />')

  return `
    <div style="font-family: Arial, sans-serif; color: #f8fafc; padding: 24px; background-color: #06070a;">
      <div style="max-width: 640px; margin: 0 auto; background: #11131a; border: 1px solid rgba(255,255,255,0.12); padding: 24px; border-radius: 18px;">
        <p style="margin: 0 0 12px; color: #9ca3af; font-size: 12px; letter-spacing: 0.18em; text-transform: uppercase;">
          Style Generate AI
        </p>

        <h2 style="margin: 0 0 20px; color: #ffffff; font-size: 24px;">
          New Contact Message
        </h2>

        <p style="margin: 0 0 8px;"><strong>Name:</strong> ${safeName}</p>
        <p style="margin: 0 0 20px;"><strong>Email:</strong> ${safeEmail}</p>

        <div style="border-left: 4px solid #7c5cff; padding-left: 14px; color: #d1d5db; line-height: 1.6;">
          ${safeMessage}
        </div>

        <p style="margin-top: 24px; color: #9ca3af; font-size: 12px;">
          Click reply to respond directly to the sender.
        </p>
      </div>
    </div>
  `
}

async function sendTelegramMessage(message) {
  const token = process.env.TELEGRAM_BOT_TOKEN
  const chatId = process.env.TELEGRAM_CHAT_ID

  if (!token || !chatId) return false

  const response = await fetch(
    `https://api.telegram.org/bot${token}/sendMessage`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        chat_id: chatId,
        text: message,
      }),
    },
  )

  return response.ok
}

async function sendEmail(payload, textMessage) {
  const emailAddress = process.env.EMAIL_ADDRESS
  const gmailPasskey = process.env.GMAIL_PASSKEY

  if (!emailAddress || !gmailPasskey) return false

  const transporter = nodemailer.createTransport({
    service: 'gmail',
    host: 'smtp.gmail.com',
    port: 587,
    secure: false,
    auth: {
      user: emailAddress,
      pass: gmailPasskey,
    },
  })

  await transporter.sendMail({
    from: `Style Generate AI <${emailAddress}>`,
    to: emailAddress,
    subject: `New message from ${payload.name}`,
    text: textMessage,
    html: buildEmailHtml(payload),
    replyTo: payload.email,
  })

  return true
}

export async function POST(request) {
  try {
    const body = await request.json()

    const payload = {
      name: normalizeString(body.name, MAX_NAME_LENGTH),
      email: normalizeString(body.email, MAX_EMAIL_LENGTH),
      message: normalizeString(body.message, MAX_MESSAGE_LENGTH),
    }

    if (!payload.name || !payload.email || !payload.message) {
      return NextResponse.json(
        { success: false, message: 'All fields are required.' },
        { status: 400 },
      )
    }

    if (!isValidEmail(payload.email)) {
      return NextResponse.json(
        { success: false, message: 'Please enter a valid email.' },
        { status: 400 },
      )
    }

    const message = buildTelegramMessage(payload)

    const [telegramResult, emailResult] = await Promise.allSettled([
      sendTelegramMessage(message),
      sendEmail(payload, message),
    ])

    const telegramSuccess =
      telegramResult.status === 'fulfilled' && telegramResult.value === true

    const emailSuccess =
      emailResult.status === 'fulfilled' && emailResult.value === true

    if (!telegramSuccess && !emailSuccess) {
      return NextResponse.json(
        { success: false, message: 'Failed to send message.' },
        { status: 500 },
      )
    }

    return NextResponse.json(
      { success: true, message: 'Message sent successfully.' },
      { status: 200 },
    )
  } catch (error) {
    console.error('Contact API error:', error)

    return NextResponse.json(
      { success: false, message: 'Server error occurred.' },
      { status: 500 },
    )
  }
}
