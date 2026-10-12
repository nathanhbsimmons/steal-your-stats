import type { Metadata } from 'next'
import { Suspense } from 'react'
import Link from 'next/link'
import { PAYPAL_ME_URL } from '@/lib/site-config'
import { FeedbackForm } from '@/components/support/feedback-form'
import { TipJar } from '@/components/support/tip-jar'

export const metadata: Metadata = {
  title: 'Support — StealyourStats',
  description: 'Report a bug, suggest an improvement, or request a feature.',
}

export default function SupportPage() {
  const showTip = Boolean(PAYPAL_ME_URL)
  return (
    <section className="col col-wide support">
      <div className="crumbs">
        <Link href="/">HOME</Link><span className="sep">/</span><span className="cur">SUPPORT</span>
      </div>
      <div className="page-head">
        <div>
          <div className="kicker">Support</div>
          <h2>Found a bug? <span className="italic">Have an idea?</span></h2>
          <div className="lede">Tell us what&apos;s broken, what could be better, or what feature you wish existed.</div>
        </div>
      </div>
      <div className={`support-grid${showTip ? '' : ' solo'}`}>
        <Suspense fallback={null}>
          <FeedbackForm />
        </Suspense>
        {showTip && <TipJar url={PAYPAL_ME_URL} />}
      </div>
    </section>
  )
}
