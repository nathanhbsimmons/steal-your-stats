import { NextResponse } from 'next/server'
import { z } from 'zod'

const MIN_FILL_MS = 3000
const RATE_LIMIT = 5
const RATE_WINDOW_MS = 10 * 60 * 1000

// Best-effort, per-instance on serverless.
const hits = new Map<string, number[]>()

function rateLimited(ip: string): boolean {
  const now = Date.now()
  const recent = (hits.get(ip) ?? []).filter(t => now - t < RATE_WINDOW_MS)
  if (recent.length >= RATE_LIMIT) { hits.set(ip, recent); return true }
  recent.push(now)
  hits.set(ip, recent)
  if (hits.size > 5000) {
    for (const [k, ts] of hits) if (!ts.some(t => now - t < RATE_WINDOW_MS)) hits.delete(k)
  }
  return false
}

const schema = z.object({
  type: z.enum(['Bug', 'Improvement', 'New feature'], { message: 'Choose what kind of note this is.' }),
  message: z.string().trim()
    .min(10, 'Write at least 10 characters.')
    .max(4000, 'Keep it under 4000 characters.'),
  email: z.string().trim().pipe(z.email("That doesn't look like an email address.")).optional(),
  page: z.string().max(500).optional().default(''),
  website: z.string().optional().default(''),
  ts: z.number().int().nonnegative(),
})

export async function POST(req: Request) {
  const ip = (req.headers.get('x-forwarded-for') ?? '').split(',')[0].trim() || 'unknown'

  let json: unknown
  try { json = await req.json() } catch { return NextResponse.json({ ok: false }, { status: 400 }) }

  const parsed = schema.safeParse(json)
  if (!parsed.success) {
    const fe = z.flattenError(parsed.error).fieldErrors
    const fieldErrors: Record<string, string> = {}
    for (const k of ['type', 'message', 'email'] as const) if (fe[k]?.[0]) fieldErrors[k] = fe[k]![0]
    return NextResponse.json({ ok: false, fieldErrors }, { status: 400 })
  }
  const { type, message, email, page, website, ts } = parsed.data

  // Honeypot: pretend success, send nothing.
  if (website) return NextResponse.json({ ok: true })

  // Too fast to be human.
  if (Date.now() - ts < MIN_FILL_MS) return NextResponse.json({ ok: false }, { status: 400 })

  if (rateLimited(ip)) return NextResponse.json({ ok: false }, { status: 429 })

  const { RESEND_API_KEY, FEEDBACK_FROM_EMAIL, FEEDBACK_TO_EMAIL } = process.env
  if (!RESEND_API_KEY || !FEEDBACK_FROM_EMAIL || !FEEDBACK_TO_EMAIL) {
    return NextResponse.json({ ok: false }, { status: 503 })
  }

  const ua = req.headers.get('user-agent') ?? 'unknown'
  const first60 = message.replace(/\s+/g, ' ').slice(0, 60)
  const text = [
    `Type: ${type}`,
    `Page: ${page || '(unknown)'}`,
    `Reply-to: ${email ?? '(none)'}`,
    `User agent: ${ua}`,
    '',
    message,
  ].join('\n')

  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${RESEND_API_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        from: FEEDBACK_FROM_EMAIL,
        to: FEEDBACK_TO_EMAIL,
        ...(email ? { reply_to: email } : {}),
        subject: `[SYS ${type}] ${first60}`,
        text,
      }),
    })
    if (!res.ok) return NextResponse.json({ ok: false }, { status: 503 })
  } catch {
    return NextResponse.json({ ok: false }, { status: 503 })
  }

  return NextResponse.json({ ok: true })
}
