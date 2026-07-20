const RESEND_API_URL = 'https://api.resend.com/emails'
const NOTIFY_TIMEOUT_MS = 3000
const DEFAULT_FROM = 'Easy Rental <notify@canitdo.com>'

// Treat null/undefined/blank all as "absent" so a missing field never renders
// as the literal string "null"/"undefined" and never leaves a stray empty line.
function clean(value) {
  if (value == null) return null
  const str = String(value).trim()
  return str === '' ? null : str
}

function buildMessage({ inquiry, property }) {
  const type = inquiry?.type
  const name = clean(inquiry?.name)
  const email = clean(inquiry?.email)
  const phone = clean(inquiry?.phone)
  const message = clean(inquiry?.message)

  if (type === 'furnished_interest') {
    const lines = [
      'Someone wants to hear about your furnished stays.',
      '',
      `Reach them at: ${email}`,
    ]
    if (name) lines.push(`Name: ${name}`)
    if (phone) lines.push(`Phone: ${phone}`)
    lines.push(
      '',
      'Tip: just hit Reply — it goes straight to them.',
      '',
      'All inquiries: https://admin.easy-rental.ca',
      '— Easy Rental',
    )
    return { subject: 'New furnished-stay lead', text: lines.join('\n') }
  }

  const title = clean(property?.title) ?? ''
  const address = clean(property?.address) ?? ''
  const subject = type === 'viewing_request'
    ? `New viewing request — ${title}`
    : `New renter inquiry — ${title}`

  const lines = [
    `${name || 'A renter'} just reached out about:`,
    title,
    address,
  ]
  if (message) {
    lines.push('', 'Their message:', `"${message}"`)
  }
  lines.push('', `Reach them at: ${email}`)
  if (phone) lines.push(`Phone: ${phone}`)
  lines.push(
    '',
    'Tip: just hit Reply — it goes straight to them.',
    '',
    'All inquiries: https://admin.easy-rental.ca',
    '— Easy Rental',
  )
  return { subject, text: lines.join('\n') }
}

export async function notifyNewInquiry({ inquiry, property }) {
  try {
    const apiKey = process.env.RESEND_API_KEY
    const to = process.env.INQUIRY_NOTIFY_TO
    const from = process.env.INQUIRY_NOTIFY_FROM || DEFAULT_FROM

    // Fail open: with no key or no recipient there is nothing to send, so dev
    // and any misconfigured deploy stay harmless instead of erroring.
    if (!apiKey || !to) {
      console.warn('inquiry notification skipped: notifier env not configured')
      return
    }

    const { subject, text } = buildMessage({ inquiry, property })

    // reply_to is the renter's own email so Bill just hits Reply to answer a lead.
    const payload = {
      from,
      to,
      reply_to: clean(inquiry?.email),
      subject,
      text,
    }

    // Hard cap the send: this runs awaited inside the request handler, so a slow
    // Resend must not stretch the renter's wait past 3s.
    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), NOTIFY_TIMEOUT_MS)
    let res
    try {
      res = await fetch(RESEND_API_URL, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
        signal: controller.signal,
      })
    } finally {
      clearTimeout(timer)
    }

    if (!res.ok) {
      console.warn(`inquiry notification failed: Resend responded with ${res.status}`)
    }
  } catch (err) {
    // Never throw: a broken email must not break the inquiry submission.
    console.warn(`inquiry notification failed: ${err?.message || err}`)
  }
}
