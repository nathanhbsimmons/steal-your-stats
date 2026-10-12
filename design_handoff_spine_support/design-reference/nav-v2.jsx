/* THE VAULT OPERATOR v2 — spine navigation */

function useCmdK(ref) {
  React.useEffect(() => {
    const h = (e) => { if ((e.metaKey || e.ctrlKey) && e.key === "k") { e.preventDefault(); ref.current && ref.current.focus(); } };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, []);
}

function NavSearch({ nav, search, setSearch, placeholder = "search songs, shows, venues…" }) {
  const ref = React.useRef(null);
  useCmdK(ref);
  const onKey = (e) => { if (e.key === "Enter" && search.trim()) nav.go("search", { q: search.trim() }); };
  return (
    <label className="nv-search">
      <span className="g">⌕</span>
      <input ref={ref} value={search} onChange={e => setSearch(e.target.value)} onKeyDown={onKey} placeholder={placeholder} aria-label="Search songs, shows, venues" />
      <span className="kbd">⌘K</span>
    </label>
  );
}

function Wordmark({ nav, mono }) {
  return (
    <div className="nv-wm" onClick={() => nav.go("home")} role="link" aria-label="Steal Your Stats — home">
      {mono ? <>S<span className="your">y</span>S</> : <>Steal<span className="your">your</span>Stats</>}
    </div>
  );
}

function NavSpine({ nav, search, setSearch, folded, setFolded }) {
  const cur = ROUTE_TO_CHAPTER[nav.route] || nav.route;
  React.useEffect(() => {
    const h = (e) => { if ((e.metaKey || e.ctrlKey) && (e.key === "b" || e.key === "B")) { e.preventDefault(); setFolded(!folded); } };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [folded]);
  return (
    <div className="nv-spine-wrap">
      <aside className="nv-spine" aria-label="Chapter navigation">
        <div className="head"><Wordmark nav={nav} mono={folded} /></div>
        {folded
          ? <button className="nv-iconbtn" title="Search (⌘K)" onClick={() => nav.go("search")}>⌕</button>
          : <NavSearch nav={nav} search={search} setSearch={setSearch} placeholder="search…" />}
        <nav className="list">
          {CATALOG_NAV.filter(c => c.id !== "support").map(c => (
            <button key={c.id} className={cur === c.id ? "active" : ""} onClick={() => nav.go(c.id)} title={folded ? c.label : undefined} aria-current={cur === c.id ? "page" : undefined}>
              <span className="num">{c.num}</span>
              {!folded && <span className="label">{c.label}</span>}
              {!folded && c.badge && c.id !== "search" && <span className="badge">{c.badge}</span>}
            </button>
          ))}
        </nav>
        <div className="foot">
          <a className={"sup" + (cur === "support" ? " active" : "")} onClick={() => nav.go("support")} title={folded ? "Support & feedback" : undefined} aria-current={cur === "support" ? "page" : undefined} role="link" tabIndex={0}>
            {folded ? "✉" : "Support & feedback"}
          </a>
        </div>
      </aside>
      <button className="nv-notch" onClick={() => setFolded(!folded)} aria-label={folded ? "Expand sidebar" : "Fold sidebar"} aria-keyshortcuts="Meta+B">
        <span aria-hidden="true">{folded ? "›" : "‹"}</span>
        <span className="tip" role="tooltip">{folded ? "Expand" : "Fold"} <kbd>⌘B</kbd></span>
      </button>
    </div>
  );
}

function NavMast({ nav }) {
  return (
    <header className="nv-mast">
      <span className="wx l">49°F</span>
      <div className="sub">The <span className="bl">Grateful Dead</span> Archive</div>
      <span className="wx r">clear sky and a Sunshine Daydream</span>
    </header>
  );
}

Object.assign(window, { NavMast, NavSpine, NavSearch, Wordmark });
