export function TipJar({ url }: { url: string }) {
  if (!url) return null
  return (
    <aside className="tip" aria-labelledby="tip-h">
      <div className="gutter-label"><span>Tip jar</span></div>
      <h3 id="tip-h">Keep the <span className="italic">tapes rolling.</span></h3>
      <p>
        Steal Your Stats is free, has no ads, and is kept up by one person. If it&apos;s earned a place in
        your rotation, a tip helps pay for hosting and data.
      </p>
      <a className="btn primary tip-btn" href={url} target="_blank" rel="noopener noreferrer">
        Tip via PayPal <span aria-hidden="true">↗</span>
        <span className="sr-only">(opens in a new tab)</span>
      </a>
      <p className="tip-note">Opens PayPal in a new tab. You can pay by card without a PayPal account.</p>
    </aside>
  )
}
