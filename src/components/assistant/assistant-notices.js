import {
  PHOTO_CHECK_FAILED_MESSAGE,
  PHOTO_FLAGGED_MESSAGE,
} from '@/utils/moderation/moderate-image'

export const ASSISTANT_NOTICE_BUBBLE =
  'Oh, something went wrong. Take a look - I will tell you what to do.'

const NOTICE_GUIDES = [
  {
    match: PHOTO_FLAGGED_MESSAGE,
    guidance:
      'This photo did not pass the safety check, so Generate stays off. Upload a different photo. A normal clothed portrait or reference shot is fine. Explicit photos are blocked.',
  },
  {
    match: PHOTO_CHECK_FAILED_MESSAGE,
    guidance:
      'The safety check did not finish, so this photo cannot be used yet. Upload it again. If it still fails, try a smaller JPG or PNG.',
  },
  {
    includes: "doesn't meet OpenAI's content safety guidelines",
    guidance:
      'The image service refused this generation. Try another photo, or change the extra prompt so it does not ask for a blocked result. Credits are not spent on this block.',
  },
  {
    includes: 'Not enough credits',
    guidance:
      'This run costs more credits than you have left. Open Pricing to add credits, or choose a smaller export size when that option is available.',
  },
  {
    includes: 'Daily generation limit reached',
    guidance:
      'You have used today’s generation limit. Wait until tomorrow, or open Pricing if a larger plan raises the daily limit.',
  },
  {
    includes: 'Monthly generation limit reached',
    guidance:
      'You have used this month’s generation limit. It resets with the monthly window, or open Pricing if a larger plan raises the limit.',
  },
  {
    includes: 'Your plan has expired',
    guidance:
      'The paid plan period has ended. Open Pricing and renew a plan to keep generating.',
  },
  {
    includes: 'Your plan is not active',
    guidance:
      'This account does not have an active plan for that option. Open Pricing and choose a plan that includes it.',
  },
  {
    includes: 'Smart Edit requires a short edit prompt',
    guidance:
      'Smart Edit needs a short description of the change. Write what to edit, then press Generate again.',
  },
  {
    includes: 'Identity Transfer requires exactly two photos',
    guidance:
      'Upload the Reference photo first, then the Face photo. Generate stays off until both are in place.',
  },
  {
    includes: 'Remove Objects requires exactly one source photo',
    guidance:
      'Remove Objects works on a single photo. Remove the extra photo and try again.',
  },
  {
    includes: 'Remove Objects requires',
    guidance:
      'Paint a mask over what to remove, or describe it in the prompt. You need at least one of those before Generate.',
  },
  {
    includes: 'At least one source photo is required',
    guidance: 'Upload a photo first, then press Generate.',
  },
  {
    includes: 'visitorId is required',
    guidance:
      'The guest session was not ready. Refresh the page and try again. Signing in also avoids this.',
  },
  {
    includes: 'Invalid email or password',
    guidance:
      'Check the email and password, then try again. If you forgot the password, use the reset link.',
  },
  {
    includes: 'Email in use',
    guidance:
      'An account with this email already exists. Sign in, or reset the password if you do not remember it.',
  },
  {
    includes: 'Verification code',
    guidance:
      'Enter the latest code from the email. If it expired, request a new code and use that one.',
  },
  {
    includes: 'Reset link is invalid',
    guidance:
      'This reset link is no longer valid. Request a new password email and open the newest link.',
  },
  {
    includes: 'Only JPG, PNG, and WEBP',
    guidance:
      'This file type is not accepted. Save the photo as JPG, PNG, or WEBP and upload it again.',
  },
  {
    includes: 'not available for your plan',
    guidance:
      'That file format needs a paid plan. Choose PNG, or open Pricing to unlock JPG and WEBP.',
  },
  {
    includes: 'Failed to send message',
    guidance:
      'The contact form did not go through. Check your connection and send it again.',
  },
  {
    includes: 'Email is required',
    guidance: 'Enter your email address, then try again.',
  },
  {
    includes: 'Current password is incorrect',
    guidance:
      'The current password does not match. Enter the password you use to sign in, then save again.',
  },
  {
    includes: 'Print export failed',
    guidance:
      'The print file was not created. Try the export again. If it keeps failing, generate the photo once more and export that result.',
  },
  {
    includes: 'Generation failed',
    guidance:
      'The generation did not finish. Check your connection and press Generate again. If it keeps failing, try another photo.',
  },
  {
    includes: 'Could not get a reply',
    guidance:
      'I could not answer just now. Send the same message again in a moment.',
  },
]

const FALLBACK_GUIDANCE =
  'Read the message above and change that one thing, then try again. If you are not sure what it means, ask me here.'

export function explainAssistantNotice(message) {
  const text = String(message || '').trim()
  const guide = NOTICE_GUIDES.find((item) => {
    if (item.match) return text === item.match
    return item.includes && text.includes(item.includes)
  })

  return {
    bubble: ASSISTANT_NOTICE_BUBBLE,
    detail: text,
    guidance: guide?.guidance || FALLBACK_GUIDANCE,
  }
}
