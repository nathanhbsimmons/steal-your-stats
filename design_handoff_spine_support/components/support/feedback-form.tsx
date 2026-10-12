'use client'

import React, { useEffect, useRef, useState } from 'react'
import { useSearchParams } from 'next/navigation'

const TYPES = ['Bug', 'Improvement', 'New feature'] as const
type FbType = (typeof TYPES)[number]
const MIN = 10
const MAX = 4000
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

type Values = { type: FbType | ''; message: string; email: string; website: string }
type FieldErrors = Partial<Record<'type' | 'message' | 'email', string>>
type Status = 'idle' | 'loading' | 'error' | 'success'
type ServerErr = '400' | '429' | '503'

const EMPTY: Values = { type: '', message: '', email: '', website: '' }

const SERVER_COPY: Record<ServerErr, { title: string; body: string }> = {
  '400': { title: "Something in the form didn't check out.", body: 'Look over the fields and send it again.' },
  '429': { title: 'Too many notes from this address.', body: 'The vault takes five every ten minutes. Try again shortly.' },
  '503': { title: 'The mail room is closed right now.', body: "Your note wasn't sent. Nothing you wrote has been lost — try again in a few minutes." },
}

function validate(v: Values): FieldErrors {
  const e: FieldErrors = {}
  if (!v.type) e.type = 'Choose what kind of note this is.'
  const n = v.message.trim().length
  if (n < MIN) e.message = `Write at least ${MIN} characters (${n} so far).`
  else if (n > MAX) e.message = `Keep it under ${MAX} characters.`
  if (v.email.trim() && !EMAIL_RE.test(v.email.trim())) e.email = "That doesn't look like an email address."
  return e
}

export function FeedbackForm() {
  const params = useSearchParams()
  const [v, setV] = useState<Values>(EMPTY)
  const [errors, setErrors] = useState<FieldErrors>({})
  const [status, setStatus] = useState<Status>('idle')
  const [serverErr, setServerErr] = useState<ServerErr | null>(null)
  const [page, setPage] = useState('')
  const renderedAt = useRef<number>(0)
  const statusRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    renderedAt.current = Date.now()
    setPage(params.get('from') || document.referrer || '')
  }, [params])

  useEffect(() => {
    if (status === 'error' || status === 'success') statusRef.current?.focus()
  }, [status])

  const set = (k: keyof Values) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setV(prev => ({ ...prev, [k]: e.target.value }))

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    const errs = validate(v)
    setErrors(errs)
    setServerErr(null)
    if (Object.keys(errs).length) { setStatus('error'); return }
    setStatus('loading')
    try {
      const res = await fetch('/api/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: v.type,
          message: v.message.trim(),
          email: v.email.trim() || undefined,
          page,
          website: v.website,
          ts: renderedAt.current,
        }),
      })
      if (res.ok) { setStatus('success'); return }
      if (res.status === 400) {
        const body = await res.json().catch(() => null)
        if (body?.fieldErrors) setErrors(body.fieldErrors)
        setServerErr('400')
      } else if (res.status === 429) setServerErr('429')
      else setServerErr('503')
      setStatus('error')
    } catch {
      setServerErr('503')
      setStatus('error')
    }
  }

  function reset() {
    setV(EMPTY); setErrors({}); setServerErr(null); setStatus('idle')
    renderedAt.current = Date.now()
  }

  if (status === 'success') {
    const email = v.email.trim()
    return (
      <div className="fb-done" ref={statusRef} tabIndex={-1} role="status" aria-live="polite">
        <div className="stamp">Received</div>
        <h3>Thanks. <span className="italic">It&apos;s in the mailbag.</span></h3>
        <p>
          {email
            ? <>If there&apos;s a reply, it&apos;ll go to <b>{email}</b>.</>
            : "You didn't leave an email, so there won't be a reply. It will still get read."}
        </p>
        <button type="button" className="btn" onClick={reset}>Send another</button>
      </div>
    )
  }

  const nErr = Object.keys(errors).length
  const len = v.message.trim().length
  const loading = status === 'loading'

  return (
    <form className="fb" onSubmit={submit} noValidate aria-busy={loading}>
      <div className="fb-status" ref={statusRef} tabIndex={-1} aria-live="assertive">
        {status === 'error' && (serverErr ? (
          <div className="fb-alert"><b>{SERVER_COPY[serverErr].title}</b> {SERVER_COPY[serverErr].body}</div>
        ) : nErr > 0 && (
          <div className="fb-alert"><b>{nErr === 1 ? 'One thing' : `${nErr} things`} to fix</b> before this can go out.</div>
        ))}
      </div>

      <fieldset className={`fb-field${errors.type ? ' invalid' : ''}`} aria-describedby={errors.type ? 'fb-type-err' : undefined}>
        <legend>What kind of note? <span className="req">required</span></legend>
        <div className="fb-types">
          {TYPES.map(t => (
            <label key={t} className="fb-type">
              <input type="radio" name="type" value={t} checked={v.type === t} onChange={set('type')} disabled={loading} required />
              <span>{t}</span>
            </label>
          ))}
        </div>
        {errors.type && <div className="fb-err" id="fb-type-err">{errors.type}</div>}
      </fieldset>

      <div className={`fb-field${errors.message ? ' invalid' : ''}`}>
        <label htmlFor="fb-message">Message <span className="req">required</span></label>
        <textarea
          id="fb-message" name="message" rows={8} maxLength={MAX} required
          value={v.message} onChange={set('message')} disabled={loading}
          placeholder="What happened, what you expected, and what page you were on."
          aria-invalid={!!errors.message}
          aria-describedby={`fb-message-count${errors.message ? ' fb-message-err' : ''}`}
        />
        <div className="fb-row">
          {errors.message ? <div className="fb-err" id="fb-message-err">{errors.message}</div> : <span />}
          <span className="fb-count" id="fb-message-count">{len.toLocaleString()} / {MAX.toLocaleString()}</span>
        </div>
      </div>

      <div className={`fb-field${errors.email ? ' invalid' : ''}`}>
        <label htmlFor="fb-email">Email <span className="opt">optional · only if you want a reply</span></label>
        <input
          id="fb-email" name="email" type="email" autoComplete="email"
          value={v.email} onChange={set('email')} disabled={loading}
          placeholder="you@example.com"
          aria-invalid={!!errors.email}
          aria-describedby={errors.email ? 'fb-email-err' : undefined}
        />
        {errors.email && <div className="fb-err" id="fb-email-err">{errors.email}</div>}
      </div>

      {/* honeypot */}
      <div className="fb-hp" aria-hidden="true">
        <label htmlFor="fb-website">Website</label>
        <input id="fb-website" name="website" tabIndex={-1} autoComplete="off" value={v.website} onChange={set('website')} />
      </div>

      <div className="fb-submit">
        <button type="submit" className="btn primary" disabled={loading}>{loading ? 'Sending…' : 'Send feedback'}</button>
      </div>
    </form>
  )
}
