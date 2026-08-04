const { useState, useMemo, useEffect, useRef } = React;

/* ---------------------------------------------------------------- facet data */
const CATS = [
  { id: "audio", name: "Audio", cc: "var(--cat-audio)", cols: 2, groups: [
    { key: "has", sub: "availability", single: true, opts: [["audio", "has audio", 120]] },
    { key: "rec", sub: "recording type", single: true, opts: [["sbd", "Soundboard", 55], ["aud", "Audience", 11], ["mtx", "Matrix", 7]] },
  ]},
  { id: "release", name: "Release", cc: "var(--cat-rel)", cols: 2, wide: true, groups: [
    { key: "off", sub: "availability", single: true, opts: [["official", "official release", 124]] },
    { key: "series", sub: "series", opts: [["dp", "Dick's Picks", 60], ["dvp", "Dave's Picks", 91], ["rt", "Road Trips", 47], ["ds", "Download Series", 22], ["ftv", "From the Vault", 11], ["studio", "Studio/Compilation", 301]] },
  ]},
  { id: "time", name: "Time", cc: "var(--cat-time)", cols: 2, wide: true, groups: [
    { key: "decade", sub: "decade", single: true, opts: [["1960", "1960s", 11], ["1970", "1970s", 80], ["1980", "1980s", 21], ["1990", "1990s", 12]] },
    { key: "era", sub: "era", single: true, opts: [["primal", "Primal Dead", 34], ["e72", "Europe '72", 27], ["hiatus", "Hiatus & Return", 30], ["brent", "Brent Years", 30], ["final", "Final Tours", 3]] },
  ]},
  { id: "place", name: "Place", cc: "var(--cat-place)", cols: 2, groups: [
    { key: "country", sub: "country", single: true, opts: [["us", "United States", 122], ["fr", "France", 1], ["uk", "United Kingdom", 1]] },
    { key: "state", sub: "state", single: true, find: true, opts: [["ca", "California", 30], ["ny", "New York", 20], ["pa", "Pennsylvania", 14], ["il", "Illinois", 7], ["mo", "Missouri", 4], ["or", "Oregon", 4], ["va", "Virginia", 4], ["nm", "New Mexico", 3], ["mi", "Michigan", 3], ["nj", "New Jersey", 3], ["md", "Maryland", 3], ["ma", "Massachusetts", 3], ["ct", "Connecticut", 3], ["hi", "Hawaii", 2], ["wa", "Washington", 2], ["fl", "Florida", 2], ["dc", "Washington, D.C.", 2], ["in", "Indiana", 2], ["tx", "Texas", 1], ["ok", "Oklahoma", 1]] },
  ]},
  { id: "tour", name: "Tour", cc: "var(--cat-tour)", cols: 2, groups: [
    { key: "tour", sub: "tagged shows only", single: true, find: true, opts: [["st90", "Summer Tour 1990", 7], ["st74", "Summer Tour 1974", 5], ["st91", "Summer Tour 1991", 3], ["sp87", "Spring Tour 1987", 2], ["dyl", "Dylan & The Dead", 2], ["sp89", "Spring Tour 1989", 2], ["e90", "Europe '90", 2], ["sp74", "Spring Tour 1974", 1], ["f87", "Fall Tour 1987", 1], ["sp88", "Spring Tour 1988", 1]] },
  ]},
];
const CAT = Object.fromEntries(CATS.map(c => [c.id, c]));

function useFacets() {
  const [sel, setSel] = useState([
    { cat: "release", key: "series", v: "dp", label: "Dick's Picks", n: 60 },
    { cat: "time", key: "decade", v: "1970", label: "1970s", n: 80 },
  ]);
  const has = (cat, key, v) => sel.some(s => s.cat === cat && s.key === key && s.v === v);
  const toggle = (cat, group, opt) => {
    const [v, label, n] = opt;
    setSel(prev => {
      if (prev.some(s => s.cat === cat.id && s.key === group.key && s.v === v))
        return prev.filter(s => !(s.cat === cat.id && s.key === group.key && s.v === v));
      const base = group.single ? prev.filter(s => !(s.cat === cat.id && s.key === group.key)) : prev;
      return [...base, { cat: cat.id, key: group.key, v, label, n }];
    });
  };
  const remove = s => setSel(prev => prev.filter(x => x !== s));
  const clearCat = id => setSel(prev => prev.filter(s => s.cat !== id));
  const clearAll = () => setSel([]);
  const count = sel.length ? Math.max(1, Math.min(...sel.map(s => s.n)) - sel.length * 3) : 2333;
  return { sel, has, toggle, remove, clearCat, clearAll, count };
}

function Chip({ s, onRemove, showKey }) {
  const c = CAT[s.cat];
  return (
    <button className="fx-chip" style={{ "--cc": c.cc }} onClick={onRemove} title={`Remove ${c.name}: ${s.label}`}>
      {showKey ? <span className="k">{c.name}</span> : null}
      <span>{s.label}</span>
      <span className="x">×</span>
    </button>
  );
}

/* ---------------------------------------------------------------- desktop */
function OptRow({ cat, group, opt, on, toggle }) {
  return (
    <div className={"fx-opt" + (on ? " on" : "")} onClick={() => toggle(cat, group, opt)}>
      <span className="box">✓</span>
      <span className="lb">{opt[1]}</span>
      <span className="ct">{opt[2]}</span>
    </div>
  );
}

function Popover({ cat, f, onClose }) {
  const [q, setQ] = useState("");
  return (
    <div className={"fx-pop" + (cat.wide ? " wide" : "")} style={{ "--cc": cat.cc }} onClick={e => e.stopPropagation()}>
      <div className="ph">
        <div className="t"><span className="cd"></span>{cat.name}</div>
        <button onClick={() => f.clearCat(cat.id)}>reset</button>
      </div>
      {cat.groups.map(g => {
        const opts = g.find && q ? g.opts.filter(o => o[1].toLowerCase().includes(q.toLowerCase())) : g.opts;
        return (
          <div key={g.key}>
            <div className="fx-sub">{g.sub}</div>
            {g.find ? (
              <div className="fx-search find">
                <span className="gl">⌕</span>
                <input value={q} onChange={e => setQ(e.target.value)} placeholder={`filter ${g.sub}…`} />
              </div>
            ) : null}
            <div className={"fx-opts" + (g.find ? " scroll" : "")} style={{ "--cols": cat.cols }}>
              {opts.map(o => (
                <OptRow key={o[0]} cat={cat} group={g} opt={o} on={f.has(cat.id, g.key, o[0])} toggle={f.toggle} />
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function DesktopFilters({ f }) {
  const [open, setOpen] = useState(null);
  const wrap = useRef(null);
  useEffect(() => {
    const h = e => { if (wrap.current && !wrap.current.contains(e.target)) setOpen(null); };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);
  const [query, setQuery] = useState("dicks picks");
  return (
    <div className="fx-bar" ref={wrap}>
      <div className="fx-search">
        <span className="gl">⌕</span>
        <input value={query} onChange={e => setQuery(e.target.value)} placeholder="song, show, venue, date…" />
        {query ? <button className="clear" onClick={() => setQuery("")}>clear</button> : null}
        <span className="kbd">⌘K</span>
      </div>
      <div className="fx-line">
        {CATS.map(c => {
          const n = f.sel.filter(s => s.cat === c.id).length;
          return (
            <div key={c.id} className={"fx-cat" + (n ? " has" : "") + (open === c.id ? " open" : "")} style={{ "--cc": c.cc }}>
              <button onClick={() => setOpen(open === c.id ? null : c.id)}>
                <span className="sw"></span>{c.name}
                <span className="cv">{n}</span>
                <span className="car">▾</span>
              </button>
              {open === c.id ? <Popover cat={c} f={f} onClose={() => setOpen(null)} /> : null}
            </div>
          );
        })}
        <div className="fx-tail">
          <span className="fx-count">shows · <b>{f.count}</b></span>
        </div>
      </div>
      <div className="fx-line">
        {f.sel.length ? (
          <div className="fx-chips">
            {f.sel.map((s, i) => <Chip key={i} s={s} showKey onRemove={() => f.remove(s)} />)}
            <button className="fx-clear" onClick={f.clearAll}>clear all</button>
          </div>
        ) : (
          <span className="fx-empty">No filters applied — the whole catalog.</span>
        )}
      </div>
    </div>
  );
}

/* ---------------------------------------------------------------- mobile */
function MobileFilters({ f }) {
  const [sheet, setSheet] = useState(false);
  const [openG, setOpenG] = useState("release");
  const [query, setQuery] = useState("dicks picks 1976");
  return (
    <div className="phone mfx">
      <div className="pstat"><span>9:41</span><span>▮▮▮ ⌁</span></div>
      <div className="ptitle"><span><span className="num">VI.</span> Search · Catalog</span><span>{f.count}</span></div>
      <div className="mfx-bar">
        <div className="fx-search">
          <span className="gl">⌕</span>
          <input value={query} onChange={e => setQuery(e.target.value)} placeholder="search the vault…" />
          {query ? <button className="clear" onClick={() => setQuery("")}>clear</button> : null}
        </div>
        <div className="mfx-scroll">
          <button className="mfx-open" onClick={() => setSheet(true)}>
            Filters{f.sel.length ? <span className="n">{f.sel.length}</span> : null} <span>▾</span>
          </button>
          {f.sel.map((s, i) => <Chip key={i} s={s} onRemove={() => f.remove(s)} />)}
          {f.sel.length ? <button className="fx-clear" onClick={f.clearAll}>clear</button> : null}
        </div>
      </div>
      <div className="mfx-meta">
        <span className="fx-count">shows · <b>{f.count}</b></span>
        <span className="fx-count">sorted by date</span>
      </div>
      <div className="pbody">
        {[["Carousel Ballroom", "1968-03-17 · San Francisco, CA"], ["Fillmore East", "1970-02-13 · New York, NY"], ["Harpur College", "1970-05-02 · Binghamton, NY"], ["Winterland Arena", "1974-10-18 · San Francisco, CA"], ["Cornell / Barton Hall", "1977-05-08 · Ithaca, NY"], ["Cameron Indoor", "1978-04-12 · Durham, NC"], ["Nassau Coliseum", "1980-05-15 · Uniondale, NY"], ["Alpine Valley", "1989-07-17 · East Troy, WI"], ["Cal Expo", "1993-05-26 · Sacramento, CA"]].map(r => (
          <div className="mres" key={r[0]}>
            <div className="t">{r[0]}</div>
            <div className="m">{r[1]}</div>
          </div>
        ))}
      </div>
      {sheet ? (
        <React.Fragment>
          <div className="mfx-scrim" onClick={() => setSheet(false)}></div>
          <div className="mfx-sheet">
            <div className="grab"></div>
            <div className="sh">
              <div className="t">Filters</div>
              <button onClick={() => setSheet(false)}>close ×</button>
            </div>
            <div className="mfx-body">
              {CATS.map(c => {
                const n = f.sel.filter(s => s.cat === c.id).length;
                const o = openG === c.id;
                return (
                  <div className="mfx-group" key={c.id} style={{ "--cc": c.cc }}>
                    <button className="gh" onClick={() => setOpenG(o ? null : c.id)}>
                      <span className="sw"></span>{c.name}
                      {n ? <span className="n">{n}</span> : null}
                      <span className="car">{o ? "▲" : "▼"}</span>
                    </button>
                    {o ? (
                      <div className="gb">
                        {c.groups.map(g => (
                          <div key={g.key}>
                            <div className="fx-sub">{g.sub}</div>
                            <div className="mfx-pills">
                              {g.opts.map(op => (
                                <button
                                  key={op[0]}
                                  className={"mfx-pill" + (f.has(c.id, g.key, op[0]) ? " on" : "")}
                                  onClick={() => f.toggle(c, g, op)}
                                >
                                  {op[1]} <span className="ct">{op[2]}</span>
                                </button>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : null}
                  </div>
                );
              })}
            </div>
            <div className="mfx-foot">
              <button className="reset" onClick={f.clearAll}>reset</button>
              <button className="apply" onClick={() => setSheet(false)}>Show {f.count} shows</button>
            </div>
          </div>
        </React.Fragment>
      ) : null}
    </div>
  );
}

/* ---------------------------------------------------------------- doc */
function Doc() {
  const f = useFacets();
  return (
    <div className="fxdoc">
      <div className="page-head">
        <div>
          <div className="kicker">Component study · vi. search · catalog</div>
          <h2>Filters &amp; <span className="italic">chips</span></h2>
          <div className="lede">One compact bar: five category menus, colour-coded chips, and the result count. Both views share the same tokens, chip colours, and copy.</div>
        </div>
        <div className="toolbar">shared state — edits in either view update both</div>
      </div>

      <div className="dh"><span className="n">A</span><h3>Desktop</h3><span className="note">Two rows, ~92px total. Menus open in place; chips carry the category name.</span></div>
      <div className="stage">
        <div>
          <DesktopFilters f={f} />
          <div style={{ paddingTop: 14 }}>
            {[["Carousel Ballroom", "1968-03-17 · San Francisco, California", "Download Series Vol. 6"], ["Fillmore East", "1970-02-13 · New York, New York", "Dick's Picks Vol. 4"], ["Harpur College", "1970-05-02 · Binghamton, New York", null], ["Winterland Arena", "1974-10-18 · San Francisco, California", "Dave's Picks Vol. 13"], ["Barton Hall, Cornell", "1977-05-08 · Ithaca, New York", "Get Shown the Light"]].map(r => (
              <div className="res" key={r[0]}>
                <div className="t">{r[0]}{r[2] ? <span className="tag">⇩ {r[2]}</span> : null}</div>
                <div className="m">{r[1]}</div>
              </div>
            ))}
          </div>
        </div>
        <div>
          <div className="dh" style={{ margin: "0 0 18px" }}><span className="n">B</span><h3>Mobile</h3></div>
          <MobileFilters f={f} />
          <div className="fx-empty" style={{ display: "block", marginTop: 12 }}>Chips scroll horizontally beside the Filters button; the sheet holds the same five groups.</div>
        </div>
      </div>

      <div className="dh"><span className="n">C</span><h3>Chip palette</h3><span className="note">One hue per category, all at ledger darkness so paper-white type stays legible.</span></div>
      <div className="fx-chips">
        {CATS.map(c => (
          <Chip key={c.id} s={{ cat: c.id, label: { audio: "Soundboard", release: "Dave's Picks", time: "Europe '72", place: "California", tour: "Summer Tour 1990" }[c.id] }} showKey onRemove={() => {}} />
        ))}
      </div>
    </div>
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(<Doc />);
