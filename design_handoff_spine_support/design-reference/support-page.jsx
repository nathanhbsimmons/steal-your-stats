/* /support — feedback form + tip jar */
const PAYPAL_ME_URL = "https://paypal.me/stealyourstats";
const FB_TYPES = ["Bug", "Improvement", "New feature"];
const FB_MIN = 10, FB_MAX = 4000;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function fbValidate(v) {
  const e = {};
  if (!v.type) e.type = "Choose what kind of note this is.";
  const n = v.message.trim().length;
  if (n < FB_MIN) e.message = `Write at least ${FB_MIN} characters (${n} so far).`;
  else if (n > FB_MAX) e.message = `Keep it under ${FB_MAX} characters.`;
  if (v.email.trim() && !EMAIL_RE.test(v.email.trim())) e.email = "That doesn't look like an email address.";
  return e;
}

const FB_SERVER = {
  "400": { title: "Something in the form didn't check out.", body: "Look over the fields and send it again." },
  "429": { title: "Too many notes from this address.", body: "The vault takes five every ten minutes. Try again shortly." },
  "503": { title: "The mail room is closed right now.", body: "Your note wasn't sent. Nothing you wrote has been lost — try again in a few minutes." },
  "fast": { title: "That was quick.", body: "Give it a few seconds and send again." },
};

function FeedbackForm({ simulate, from }) {
  const [v, setV] = React.useState({ type: "", message: "", email: "", website: "" });
  const [errors, setErrors] = React.useState({});
  const [status, setStatus] = React.useState("idle");
  const [serverErr, setServerErr] = React.useState(null);
  const renderedAt = React.useRef(Date.now());
  const statusRef = React.useRef(null);
  const set = (k) => (e) => setV({ ...v, [k]: e.target.value });

  React.useEffect(() => { if ((status === "error" || status === "success") && statusRef.current) statusRef.current.focus(); }, [status]);

  const submit = (e) => {
    e.preventDefault();
    const errs = fbValidate(v);
    setErrors(errs);
    if (Object.keys(errs).length) { setServerErr(null); setStatus("error"); return; }
    setServerErr(null); setStatus("loading");
    const tooFast = Date.now() - renderedAt.current < 3000;
    setTimeout(() => {
      if (v.website) { setStatus("success"); return; }
      const code = tooFast ? "fast" : simulate;
      if (code === "200") setStatus("success");
      else { setServerErr(code); setStatus("error"); }
    }, 1100);
  };
  const reset = () => { setV({ type: "", message: "", email: "", website: "" }); setErrors({}); setServerErr(null); setStatus("idle"); renderedAt.current = Date.now(); };

  if (status === "success") return (
    <div className="fb-done" ref={statusRef} tabIndex={-1} role="status" aria-live="polite">
      <div className="stamp">Received</div>
      <h3>Thanks. <span className="italic">It's in the mailbag.</span></h3>
      <p>{v.email.trim() ? <>If there's a reply, it'll go to <b>{v.email.trim()}</b>.</> : "You didn't leave an email, so there won't be a reply. It will still get read."}</p>
      <button type="button" className="btn" onClick={reset}>Send another</button>
    </div>
  );

  const nErr = Object.keys(errors).length;
  const len = v.message.trim().length;
  const loading = status === "loading";
  return (
    <form className="fb" onSubmit={submit} noValidate aria-busy={loading}>
      <div className="fb-status" ref={statusRef} tabIndex={-1} aria-live="assertive">
        {status === "error" && (serverErr
          ? <div className="fb-alert"><b>{FB_SERVER[serverErr].title}</b> {FB_SERVER[serverErr].body}</div>
          : nErr > 0 && <div className="fb-alert"><b>{nErr === 1 ? "One thing" : nErr + " things"} to fix</b> before this can go out.</div>)}
      </div>

      <fieldset className={"fb-field" + (errors.type ? " invalid" : "")} aria-describedby={errors.type ? "fb-type-err" : undefined}>
        <legend>What kind of note? <span className="req">required</span></legend>
        <div className="fb-types">
          {FB_TYPES.map(t => (
            <label key={t} className={"fb-type" + (v.type === t ? " on" : "")}>
              <input type="radio" name="type" value={t} checked={v.type === t} onChange={set("type")} disabled={loading} />
              <span>{t}</span>
            </label>
          ))}
        </div>
        {errors.type && <div className="fb-err" id="fb-type-err">{errors.type}</div>}
      </fieldset>

      <div className={"fb-field" + (errors.message ? " invalid" : "")}>
        <label htmlFor="fb-message">Message <span className="req">required</span></label>
        <textarea id="fb-message" name="message" rows={8} maxLength={FB_MAX} value={v.message} onChange={set("message")} disabled={loading}
          placeholder="What happened, what you expected, and what page you were on."
          aria-invalid={!!errors.message} aria-describedby={"fb-message-count" + (errors.message ? " fb-message-err" : "")}></textarea>
        <div className="fb-row">
          {errors.message ? <div className="fb-err" id="fb-message-err">{errors.message}</div> : <span></span>}
          <span className="fb-count" id="fb-message-count">{len.toLocaleString()} / {FB_MAX.toLocaleString()}</span>
        </div>
      </div>

      <div className={"fb-field" + (errors.email ? " invalid" : "")}>
        <label htmlFor="fb-email">Email <span className="opt">optional · only if you want a reply</span></label>
        <input id="fb-email" name="email" type="email" autoComplete="email" value={v.email} onChange={set("email")} disabled={loading}
          placeholder="you@example.com" aria-invalid={!!errors.email} aria-describedby={errors.email ? "fb-email-err" : undefined} />
        {errors.email && <div className="fb-err" id="fb-email-err">{errors.email}</div>}
      </div>

      <div className="fb-hp" aria-hidden="true">
        <label htmlFor="fb-website">Website</label>
        <input id="fb-website" name="website" tabIndex={-1} autoComplete="off" value={v.website} onChange={set("website")} />
      </div>
      <input type="hidden" name="page" value={from} />
      <input type="hidden" name="ts" value={renderedAt.current} />

      <div className="fb-submit">
        <button type="submit" className="btn primary" disabled={loading}>{loading ? "Sending…" : "Send feedback"}</button>
      </div>
    </form>
  );
}

function TipJar() {
  if (!PAYPAL_ME_URL) return null;
  return (
    <aside className="tip" aria-labelledby="tip-h">
      <div className="gutter-label"><span>Tip jar</span></div>
      <h3 id="tip-h">Keep the <span className="italic">tapes rolling.</span></h3>
      <p>Steal Your Stats is free, has no ads, and is kept up by one person. If it's earned a place in your rotation, a tip helps pay for hosting and data.</p>
      <a className="btn primary tip-btn" href={PAYPAL_ME_URL} target="_blank" rel="noopener noreferrer">Tip via PayPal <span aria-hidden="true">↗</span><span className="sr">(opens in a new tab)</span></a>
      <p className="tip-note">Opens PayPal in a new tab. You can pay by card without a PayPal account.</p>
    </aside>
  );
}

function SupportPage({ nav, simulate, tipJar, from }) {
  return (
    <section className="col col-wide support">
        <div className="crumbs"><a onClick={() => nav.go("home")}>HOME</a><span className="sep">/</span><span className="cur">SUPPORT</span></div>
        <div className="page-head">
          <div>
            <div className="kicker">Support</div>
            <h2>Found a bug? <span className="italic">Have an idea?</span></h2>
            <div className="lede">Tell us what's broken, what could be better, or what feature you wish existed.</div>
          </div>
        </div>
        <div className={"support-grid" + (tipJar ? "" : " solo")}>
          <FeedbackForm simulate={simulate} from={from} />
          {tipJar && <TipJar />}
        </div>
    </section>
  );
}

Object.assign(window, { SupportPage, PAYPAL_ME_URL });
