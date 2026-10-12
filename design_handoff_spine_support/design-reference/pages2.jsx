/* THE VAULT OPERATOR — pages part 2 */
/* eslint-disable */
const { useState: useStateP2, useMemo: useMemoP2 } = React;

// ==================================================================
// STATS PAGE
// ==================================================================
function StatsPage({ nav }) {
  const maxShows = Math.max(...SHOWS_PER_YEAR.map(s => s[1]));
  const peakYear = SHOWS_PER_YEAR.find(s => s[1] === maxShows)[0];

  // donut paths
  const donut = useMemoP2(() => {
    const r = 60, cx = 70, cy = 70;
    const total = DARK_STAR_POSITIONS.reduce((n, p) => n + p.count, 0);
    let acc = 0;
    const colors = ["var(--rust)", "var(--forest)", "var(--ledger-blue)", "var(--ink)"];
    return DARK_STAR_POSITIONS.map((p, i) => {
      const start = (acc / total) * Math.PI * 2 - Math.PI / 2;
      acc += p.count;
      const end = (acc / total) * Math.PI * 2 - Math.PI / 2;
      const large = (end - start) > Math.PI ? 1 : 0;
      const x1 = cx + r * Math.cos(start), y1 = cy + r * Math.sin(start);
      const x2 = cx + r * Math.cos(end), y2 = cy + r * Math.sin(end);
      return { ...p, d: `M ${cx} ${cy} L ${x1} ${y1} A ${r} ${r} 0 ${large} 1 ${x2} ${y2} Z`, color: colors[i] };
    });
  }, []);

  return (
    <section className="col col-wide">
      <div className="crumbs"><a onClick={() => nav.go("home")}>HOME</a><span className="sep">/</span><span className="cur">STATS</span></div>

      <div className="page-head">
        <div>
          <div className="kicker">Statistics · thirty years on the road</div>
          <h2>The big numbers, <span className="italic">through the years.</span></h2>
          <div className="lede">Every show, every song, every hour of hand-filed tape.</div>
        </div>
      </div>

      <div className="kpi-row">
        {STATS_KPI.map((k, i) => (
          <div className="kpi" key={k.label}>
            <div className="label">{k.label}</div>
            <div className={"val " + (i === 0 || i === 2 ? "rust" : "")}>{k.value}</div>
            <div className="annot">{k.annot}</div>
          </div>
        ))}
      </div>

      <div className="section-head">
        <h3>Shows per year <span style={{fontFamily:"var(--mono)",fontSize:"12px",color:"var(--rust)",marginLeft:"10px"}}>1965 — 1995</span></h3>
        <div className="descr">peak year highlighted</div>
        <span className="meta">N = 2,333</span>
      </div>

      <div className="barchart">
        {SHOWS_PER_YEAR.map(([y, n]) => (
          <div key={y} className={"bar" + (n === maxShows ? " peak" : "")} style={{height: ((n / maxShows) * 100) + "%"}}>
            <span className="val">{n}</span>
          </div>
        ))}
      </div>
      <div className="barchart-axis">
        <span>’65</span><span>’70</span><span>’75</span><span>’80</span><span>’85</span><span>’90</span><span>’95</span>
      </div>
      <div style={{marginTop:6,fontFamily:"var(--serif-body)",fontStyle:"italic",fontSize:"13px",color:"var(--ink-3)"}}>
        Peak — {peakYear}, {maxShows} shows. The longest stretches off-road came in 1975 (the studio year) and 1986 (Garcia's coma).
      </div>

      <div style={{display:"grid",gridTemplateColumns:"1fr 1.2fr",gap:28,marginTop:24}}>
        <div>
          <div className="section-head" style={{marginTop:0}}>
            <h3>Position breakdown</h3>
            <div className="descr">Dark Star — where it landed</div>
            <span className="meta">N = 232</span>
          </div>

          <div className="donut-block">
            <svg width="140" height="140" viewBox="0 0 140 140" style={{flexShrink:0}}>
              {donut.map((p, i) => (
                <path key={i} d={p.d} fill={p.color} stroke="var(--paper)" strokeWidth="2" />
              ))}
              <circle cx="70" cy="70" r="32" fill="var(--paper)" stroke="var(--ink)" strokeWidth="1" />
              <text x="70" y="68" textAnchor="middle" fontFamily="var(--serif-display)" fontSize="22" fill="var(--ink)">232</text>
              <text x="70" y="84" textAnchor="middle" fontFamily="var(--mono)" fontSize="8" letterSpacing="0.1em" fill="var(--ink-3)">DARK STAR</text>
            </svg>
            <div className="legend">
              {donut.map((p, i) => (
                <div key={i} className="row">
                  <span className="sw" style={{background: p.color}}></span>
                  <span className="lbl">{p.label}</span>
                  <span className="num">{p.count} <span style={{color:"var(--ink-3)"}}>· {p.pct}%</span></span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div>
          <div className="section-head" style={{marginTop:0}}>
            <h3>All-Time leaderboard</h3>
            <div className="descr">top {MOST_PLAYED.length} most-played</div>
            <span className="meta">N=442 songs</span>
          </div>
          <ul className="toptable">
            {MOST_PLAYED.map(m => (
              <li key={m.rank} onClick={() => nav.go("song", {slug: "drums"})}>
                <div className="row1"><span className="rank">{m.rank}.</span><span>{m.title}</span><span className="plays">{m.plays}</span></div>
                <div className="bar"><div className="fill" style={{width: m.pct + "%"}}></div></div>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}

// ==================================================================
// VENUES PAGE
// ==================================================================
function VenuesPage({ nav }) {
  const [q, setQ] = useStateP2("");
  const filtered = VENUES.filter(v =>
    v.name.toLowerCase().includes(q.toLowerCase()) ||
    v.city.toLowerCase().includes(q.toLowerCase()) ||
    v.country.toLowerCase().includes(q.toLowerCase())
  );
  const top = [...VENUES].sort((a,b) => b.shows - a.shows)[0];

  return (
    <section className="col col-wide">
      <div className="crumbs"><a onClick={() => nav.go("home")}>HOME</a><span className="sep">/</span><span className="cur">VENUES</span></div>

      <div className="page-head">
        <div>
          <div className="kicker">Atlas · every stage they ever crossed</div>
          <h2>Where they <span className="italic">played.</span></h2>
          <div className="lede">{VENUES.length} unique venues to truck through.</div>
        </div>
        <div className="filter-input">
          <span>⌕</span>
          <input value={q} onChange={e => setQ(e.target.value)} placeholder="filter by venue, city, country…" />
          {q && <span className="clear" onClick={() => setQ("")}>×</span>}
        </div>
      </div>

      <div className="kpi-row">
        <div className="kpi"><div className="label">Unique Venues</div><div className="val">{VENUES.length}</div><div className="annot">indexed in this volume</div></div>
        <div className="kpi"><div className="label">Most-played venue</div><div className="val" style={{fontSize:24}}>{top.name}</div><div className="annot">{top.shows} shows · {top.first}–{top.last}</div></div>
        <div className="kpi"><div className="label">Showing</div><div className="val rust">{filtered.length}</div><div className="annot">of {VENUES.length} after filter</div></div>
        <div className="kpi"><div className="label">Top city</div><div className="val" style={{fontSize:24}}>New York</div><div className="annot">85+ shows across boroughs</div></div>
      </div>

      <table className="tbl">
        <thead>
          <tr>
            <th>#</th>
            <th>Venue</th>
            <th>City · Country</th>
            <th className="r">Shows</th>
            <th className="r">First</th>
            <th className="r">Last</th>
            <th className="r">Span</th>
          </tr>
        </thead>
        <tbody>
          {filtered.map((v, i) => (
            <tr key={v.name} className={v.shows >= 30 ? "hi" : ""}>
              <td className="num">{String(i + 1).padStart(2, "0")}</td>
              <td><span className="title">{v.name}</span></td>
              <td><span style={{fontFamily:"var(--serif-body)",fontStyle:"italic"}}>{v.city}, {v.state}</span><span className="sub">{v.country}</span></td>
              <td className="r" style={{color: v.shows >= 30 ? "var(--rust)" : ""}}>{v.shows}</td>
              <td className="r">{v.first}</td>
              <td className="r">{v.last}</td>
              <td className="r">{v.last - v.first} yr</td>
            </tr>
          ))}
        </tbody>
      </table>
      <div style={{marginTop:8,fontFamily:"var(--serif-body)",fontStyle:"italic",fontSize:"12.5px",color:"var(--ink-3)"}}>
        ▸ Venues with 30+ shows highlighted. The full atlas runs 382 entries; showing top {filtered.length} after filter.
      </div>
    </section>
  );
}

// ==================================================================
// ERAS PAGE
// ==================================================================
function ErasPage({ nav }) {
  const [focusId, setFocusId] = useStateP2("europe72");
  const focus = ERAS_DATA.find(e => e.id === focusId);

  return (
    <section className="col col-wide">
      <div className="crumbs"><a onClick={() => nav.go("home")}>HOME</a><span className="sep">/</span><span className="cur">ERAS</span></div>

      <div className="page-head">
        <div>
          <div className="kicker">Eras · five movements, one long strange trip</div>
          <h2>The band's <span className="italic">five lives.</span></h2>
          <div className="lede">From the Acid Tests to Soldier Field — three decades, in five chapters.</div>
        </div>
        <div className="toolbar"><span className="mono">2,328 shows · 1965–1995</span></div>
      </div>

      <div className="timeline-axis">
        <span>1965</span><span>1970</span><span>1975</span><span>1980</span><span>1985</span><span>1990</span><span>1995</span>
      </div>
      <div className="timeline">
        {ERAS_DATA.map(e => {
          const w = ((e.to - e.from + 1) / 31) * 100;
          return <div key={e.id} className={"seg " + e.id} style={{flexBasis: w + "%"}}><span className="label">{e.id.toUpperCase()}</span></div>;
        })}
      </div>

      <div className="era-grid">
        {ERAS_DATA.map(e => (
          <div key={e.id} className={"era-card" + (focusId === e.id ? " active" : "")} onClick={() => setFocusId(e.id)}>
            <div className="tag">{e.tag}</div>
            <h4>{e.name}</h4>
            <div className="years">{e.years}</div>
            <div className="shows">Shows<span className="n">{e.shows}</span></div>
            <div className="sigs">{e.signature.join(", ")}</div>
            <div className="explore" onClick={(ev) => { ev.stopPropagation(); nav.go("era", {id: e.id}); }}>Explore ⟶</div>
          </div>
        ))}
      </div>

      <div className="section-head">
        <h3>Focus · {focus.name}</h3>
        <div className="descr">{focus.tag} · {focus.shows} shows · 22 countries</div>
        <span className="meta">{focus.years}</span>
      </div>

      <div className="era-focus">
        <div className="cell">
          <div className="label">Signature jam</div>
          <div className="signature">Dark Star — Lyceum ’72</div>
          <div className="dur">47:18</div>
          <button className="btn primary" style={{marginTop:10}}>▶ Play</button>
        </div>
        <div className="cell">
          <div className="label">Songs debuted in this era</div>
          <div className="pills" style={{marginTop:6}}>
            {["Brown-Eyed Women","He's Gone","Tennessee Jed","Ramble On Rose","Jack Straw","Mr. Charlie","Bertha","Wharf Rat"].map(p => <span key={p} className="pill" onClick={() => nav.go("song", {slug: "scarlet"})}>{p}</span>)}
          </div>
        </div>
        <div className="cell">
          <div className="label">Avg. show length</div>
          <div className="signature" style={{color:"var(--rust)",fontSize:38,letterSpacing:"-0.01em"}}>3:11:42</div>
          <div className="sub" style={{fontFamily:"var(--serif-body)",fontStyle:"italic",fontSize:13,color:"var(--ink-3)",marginTop:4}}>~28% longer than the all-time average. Wall-of-Sound era.</div>
        </div>
      </div>
    </section>
  );
}

// ==================================================================
// ERA DETAIL PAGE
// ==================================================================
function EraDetailPage({ nav, params }) {
  const era = ERAS_DATA.find(e => e.id === params.id) || ERAS_DATA[1];
  const eraShows = SHOWS.filter(s => s.era === era.id);
  const [page, setPage] = useStateP2(0);
  const perPage = 8;
  const shown = eraShows.slice(page * perPage, page * perPage + perPage);

  return (
    <>
      <section className="col">
        <div className="crumbs"><a onClick={() => nav.go("home")}>HOME</a><span className="sep">/</span><a onClick={() => nav.go("eras")}>ERAS</a><span className="sep">/</span><span className="cur">{era.name.toUpperCase()}</span></div>

        <div className="page-head">
          <div>
            <div className="kicker">{era.tag}</div>
            <h2>{era.name}</h2>
            <div className="lede" style={{maxWidth:"72ch"}}>
              {era.id === "europe72" && "The Wall-of-Sound era — Garcia's most expansive jams. 198 shows across 22 countries, an unprecedented sonic experiment, and a tape lineage that still defines the canon."}
              {era.id === "primal"   && "From Acid Test ballrooms to electric arenas — the Pigpen years. Blues-soaked, ragged, and totemic. Where the band found its first voice."}
              {era.id === "hiatus"   && "Off the road, into the studio, and back again. Terrapin Station arrives. Brent waits in the wings. The most underrated stretch in the canon."}
              {era.id === "brent"    && "Arena Dead. A new keyboardist, a new bottom-end, eleven years of road dogs delivering night after night. Throwing Stones country."}
              {era.id === "final"    && "Vince Welnick, Bruce Hornsby. Garcia's diminishing returns. Beauty in the cracks. Lazy River Road and Days Between, late grace notes."}
            </div>
          </div>
          <div className="toolbar"><span className="mono">{era.years} · {era.shows} shows</span></div>
        </div>

        <div className="section-head">
          <h3>Signature songs</h3>
          <div className="descr">— the ones the era is known for</div>
          <span className="meta">click to open</span>
        </div>
        <div className="era-focus" style={{borderTop:0,borderBottom:0,padding:0,marginTop:0,gridTemplateColumns:"1fr"}}>
          <div className="cell">
            <div className="pills">
              {era.signature.map(p => <span key={p} className="pill" onClick={() => nav.go("song", {slug: "scarlet"})}>{p}</span>)}
            </div>
          </div>
        </div>

        <div className="section-head">
          <h3>Shows of the era</h3>
          <div className="descr">paginated · {era.shows} total</div>
          <span className="meta">page {page + 1} of {Math.max(1, Math.ceil(eraShows.length / perPage))}</span>
        </div>

        <table className="tbl">
          <thead><tr><th>#</th><th>Date</th><th>Venue · City</th><th className="r">Songs</th><th></th></tr></thead>
          <tbody>
            {shown.map((s, i) => (
              <tr key={s.date} onClick={() => nav.go("show", {date: s.date})}>
                <td className="num">{String(page * perPage + i + 1).padStart(2, "0")}</td>
                <td><span className="title">{s.date}</span></td>
                <td><span style={{fontFamily:"var(--serif-body)",fontStyle:"italic",fontSize:14}}>{s.venue}</span><span className="sub">{s.city}</span></td>
                <td className="r">{s.songs}</td>
                <td className="r" style={{color:"var(--ink-3)"}}>→</td>
              </tr>
            ))}
          </tbody>
        </table>

        <div style={{display:"flex",justifyContent:"space-between",marginTop:10,fontFamily:"var(--mono)",fontSize:"11px",color:"var(--ink-3)",letterSpacing:"0.08em",textTransform:"uppercase"}}>
          <a className={page === 0 ? "muted" : "rust"} style={{cursor: page === 0 ? "default" : "pointer"}} onClick={() => page > 0 && setPage(page - 1)}>⟵ prev</a>
          <a className={(page + 1) * perPage >= eraShows.length ? "muted" : "rust"} style={{cursor:"pointer"}} onClick={() => (page + 1) * perPage < eraShows.length && setPage(page + 1)}>next ⟶</a>
        </div>
      </section>

      <aside className="col">
        <div className="gutter-label"><span>Most-Played · this era</span><span className="mono">N={era.shows}</span></div>
        <ul className="toptable">
          {MOST_PLAYED.map(m => (
            <li key={m.rank} onClick={() => nav.go("song", {slug: "drums"})}>
              <div className="row1"><span className="rank">{m.rank}.</span><span>{m.title}</span><span className="plays">{Math.round(m.plays * 0.3)}</span></div>
              <div className="bar"><div className="fill" style={{width: m.pct + "%"}}></div></div>
            </li>
          ))}
        </ul>
        <div className="margin-note" style={{marginTop:18}}>
          <span className="head">Era Notes</span>
          {era.signature.length} signature songs. {era.shows} shows logged.
          Tape availability: <strong style={{fontStyle:"normal",color:"var(--forest)"}}>HIGH</strong> for SBD, mixed for AUD.
        </div>
      </aside>
    </>
  );
}

// ==================================================================
// BAND MEMBERS PAGE
// ==================================================================
function MembersPage({ nav }) {
  return (
    <section className="col col-wide">
      <div className="crumbs"><a onClick={() => nav.go("home")}>HOME</a><span className="sep">/</span><span className="cur">BAND MEMBERS</span></div>

      <div className="page-head">
        <div>
          <div className="kicker">Lineup · every iteration of the band</div>
          <h2>The band, <span className="italic">in every iteration.</span></h2>
          <div className="lede">Ten people sat in a Grateful Dead lineup between 1965 and 1995. Six core, four just passing through.</div>
        </div>
      </div>

      <div className="section-head">
        <h3>The core six</h3>
        <div className="descr">— the founding lineup</div>
        <span className="meta">1965 — 1995</span>
      </div>

      <div className="member-grid">
        {MEMBERS.filter(m => m.core).map(m => (
          <div key={m.id} className="member-card" onClick={() => nav.go("member", {id: m.id})}>
            <div className="portrait">
              <span className="mark">{m.mark}</span>
              <span className="lbl">PORTRAIT · PLACEHOLDER</span>
            </div>
            <div className="name">{m.name}</div>
            <div className="role">{m.role}</div>
            <div className="stats">
              <div>Shows<span className="n">{m.shows.toLocaleString()}</span></div>
              <div style={{textAlign:"right"}}>Years<span className="n">{m.years}</span></div>
            </div>
          </div>
        ))}
      </div>

      <div className="section-head">
        <h3>Passing through</h3>
        <div className="descr">— keyboardists and harmony singers</div>
        <span className="meta">1971 — 1995</span>
      </div>

      <div className="member-grid">
        {MEMBERS.filter(m => !m.core).map(m => (
          <div key={m.id} className="member-card minor" onClick={() => nav.go("member", {id: m.id})}>
            <div className="portrait">
              <span className="mark" style={{fontSize:54}}>{m.mark}</span>
              <span className="lbl">PORTRAIT · PLACEHOLDER</span>
            </div>
            <div className="name">{m.name}</div>
            <div className="role">{m.role}</div>
            <div className="stats">
              <div>Shows<span className="n">{m.shows.toLocaleString()}</span></div>
              <div style={{textAlign:"right"}}>Years<span className="n">{m.years}</span></div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

// ==================================================================
// MEMBER DETAIL PAGE
// ==================================================================
function MemberDetailPage({ nav, params, player }) {
  const member = MEMBERS.find(m => m.id === params.id) || MEMBERS[0];
  const detail = MEMBER_DETAIL[member.id] || MEMBER_DETAIL.garcia;
  const era = ERAS_DATA.find(e => e.id === detail.eraId) || ERAS_DATA[0];

  // active years
  const yrs = member.years.split(/[–-]/).map(s => parseInt(s, 10));
  const fromY = yrs[0], toY = yrs[1] || yrs[0];
  const yearData = SHOWS_PER_YEAR.filter(([y]) => y >= fromY && y <= toY);
  const years = yearData.map(([y]) => y);
  const maxN = Math.max(...yearData.map(d => d[1]));
  const memberTotal = yearData.reduce((n, [, c]) => n + c, 0);

  const [selectedYear, setSelectedYear] = useStateP2(years[Math.floor(years.length / 2)] || fromY);
  const yi = years.indexOf(selectedYear);
  const prevYear = yi > 0 ? years[yi - 1] : null;
  const nextYear = yi >= 0 && yi < years.length - 1 ? years[yi + 1] : null;

  const yearShowCount = (yearData.find(([y]) => y === selectedYear) || [0, 0])[1];
  const browseShows = useMemoP2(
    () => browseShowsForYear(member.id, selectedYear, yearShowCount),
    [member.id, selectedYear, yearShowCount]
  );

  // resolve a song title to a song slug, fall back to first letter match
  const slugFor = (title) => {
    const t = title.toLowerCase().replace(/[^a-z\s]/g, "").trim();
    const found = SONGS.find(s =>
      s.title.toLowerCase() === title.toLowerCase() ||
      s.aliases.some(a => a.toLowerCase() === title.toLowerCase()) ||
      s.title.toLowerCase().includes(t)
    );
    return found ? found.slug : "scarlet";
  };

  const jumpToYear = (y) => {
    setSelectedYear(y);
    setTimeout(() => {
      const el = document.getElementById("browse-shows");
      if (el) window.scrollTo({ top: el.getBoundingClientRect().top + window.scrollY - 40, behavior: "smooth" });
    }, 30);
  };

  return (
    <section className="col col-wide">
      <div className="crumbs">
        <a onClick={() => nav.go("home")}>HOME</a><span className="sep">/</span>
        <a onClick={() => nav.go("members")}>BAND MEMBERS</a><span className="sep">/</span>
        <span className="cur">{member.name.toUpperCase()}</span>
      </div>

      <div className="member-hero">
        <div className="portrait-lg">
          <span className="mark">{member.mark}</span>
          <span className="lbl">PORTRAIT · PLACEHOLDER</span>
        </div>
        <div className="title-block">
          <div className="kicker">Band member · {member.core ? "core" : "passing through"}</div>
          <h2>{member.name}</h2>
          <div className="role">{member.role}</div>
          <div className="facts">
            <div><span className="k">Years</span><span className="v">{member.years}</span></div>
            <div><span className="k">Shows</span><span className="v rust">{member.shows.toLocaleString()}</span></div>
            <div><span className="k">Born</span><span className="v">{member.born}{member.died ? <span style={{color:"var(--ink-3)",fontFamily:"var(--mono)",fontSize:11,paddingLeft:6}}>† {member.died}</span> : null}</span></div>
            <div><span className="k">Mark</span><span className="v" style={{fontFamily:"var(--serif-display)",color:"var(--rust)"}}>{member.mark}</span></div>
          </div>
          <div className="actions">
            <button className="btn primary" onClick={() => nav.go("era", {id: detail.eraId})}>
              <span className="play-tri">⟶</span> View era · {era.name}
            </button>
            <button className="btn ghost" onClick={() => player.playEntireShow()}>▶ Play featured show</button>
          </div>
        </div>
      </div>

      <div className="section-head">
        <h3>Bio</h3>
        <div className="descr">— compiled by the vault operator</div>
        <span className="meta">{member.core ? "FOUNDING MEMBER" : "GUEST CHAIR"}</span>
      </div>
      <p className="member-bio">{detail.bio}</p>

      <div className="section-head">
        <h3>Shows per year</h3>
        <div className="descr">— click any bar to jump to that year below</div>
        <span className="meta">N ≈ {memberTotal.toLocaleString()}</span>
      </div>

      <div className="barchart member-chart">
        {yearData.map(([y, n]) => (
          <div key={y}
               className={"bar" + (y === selectedYear ? " peak" : "") + (n === maxN ? " max" : "")}
               style={{height: ((n / maxN) * 100) + "%"}}
               onClick={() => jumpToYear(y)}
               title={y + " · " + n + " shows"}>
            <span className="val">{n}</span>
          </div>
        ))}
      </div>
      <div className="barchart-axis-dense">
        {yearData.map(([y]) => (
          <span key={y} className={y === selectedYear ? "on" : ""} onClick={() => jumpToYear(y)}>
            ’{String(y).slice(2)}
          </span>
        ))}
      </div>

      <div className="section-head">
        <h3>Signature shows</h3>
        <div className="descr">— the nights worth knowing</div>
        <span className="meta">{detail.signatureShows.length} highlights</span>
      </div>
      <div className="sig-shows">
        {detail.signatureShows.map((s, i) => (
          <div key={s.date} className="sig-show">
            <button className="sig-play" onClick={(e) => { e.stopPropagation(); player.playEntireShow(); }} title="Play show">▶</button>
            <div className="meta">
              <div className="idx">№ {String(i + 1).padStart(2, "0")}</div>
              <div className="date">{s.date}</div>
              <div className="venue">{s.venue}<span className="city">{s.city}</span></div>
              {s.note && <div className="note">— {s.note}</div>}
            </div>
            <a className="setlist-link" onClick={() => nav.go("show", {date: s.date})}>Setlist ↗</a>
          </div>
        ))}
      </div>

      <div className="section-head">
        <h3>Songs debuted in this era</h3>
        <div className="descr">— {era.name} · {era.years}</div>
        <span className="meta">{detail.debuts.length} debuts</span>
      </div>
      <div className="era-focus member-pills" style={{borderTop:0,borderBottom:0,padding:0,marginTop:0,gridTemplateColumns:"1fr"}}>
        <div className="cell" style={{borderBottom:0,padding:"4px 0 0"}}>
          <div className="pills">
            {detail.debuts.map(p => (
              <span key={p} className="pill" onClick={() => nav.go("song", {slug: slugFor(p)})}>{p}</span>
            ))}
          </div>
        </div>
      </div>

      <div className="section-head">
        <h3>Signature songs</h3>
        <div className="descr">— what they're known for</div>
        <span className="meta">{detail.signatureSongs.length} songs</span>
      </div>
      <div className="era-focus member-pills" style={{borderTop:0,borderBottom:0,padding:0,marginTop:0,gridTemplateColumns:"1fr"}}>
        <div className="cell" style={{borderBottom:0,padding:"4px 0 0"}}>
          <div className="pills">
            {detail.signatureSongs.map(p => (
              <span key={p} className="pill" onClick={() => nav.go("song", {slug: slugFor(p)})}>{p}</span>
            ))}
          </div>
        </div>
      </div>

      <div id="browse-shows" className="section-head">
        <h3>Browse shows</h3>
        <div className="descr">— full archive, paged one year at a time</div>
        <span className="meta">{selectedYear} · {browseShows.length} of {yearShowCount}</span>
      </div>

      <div className="year-strip">
        {years.map(y => (
          <button key={y} className={"year-tab" + (y === selectedYear ? " on" : "")} onClick={() => setSelectedYear(y)}>
            {y}
          </button>
        ))}
      </div>

      <table className="tbl member-tbl">
        <thead>
          <tr>
            <th>#</th>
            <th>Date</th>
            <th>Venue · City</th>
            <th className="r">Songs</th>
            <th className="r">Play</th>
            <th className="r">Setlist</th>
          </tr>
        </thead>
        <tbody>
          {browseShows.map((s, i) => (
            <tr key={s.date}>
              <td className="num">{String(i + 1).padStart(2, "0")}</td>
              <td><span className="title">{s.date}</span></td>
              <td>
                <span style={{fontFamily:"var(--serif-body)",fontStyle:"italic",fontSize:14}}>{s.venue}</span>
                <span className="sub">{s.city}</span>
              </td>
              <td className="r">{s.songs}</td>
              <td className="r">
                <button className="row-play" onClick={(e) => { e.stopPropagation(); player.playEntireShow(); }}>▶</button>
              </td>
              <td className="r">
                <a className="row-link" onClick={(e) => { e.stopPropagation(); nav.go("show", {date: s.date}); }}>open ↗</a>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="year-pager">
        <button className={"pg" + (prevYear ? "" : " muted")}
                onClick={() => prevYear && setSelectedYear(prevYear)}
                disabled={!prevYear}>
          <span className="arrow">⟵</span>
          <span className="col">
            <span className="lbl">{prevYear ? "previous year" : "start of run"}</span>
            <span className="yr">{prevYear || "—"}</span>
          </span>
        </button>
        <span className="current-year">
          <span className="lbl">viewing</span>
          <span className="yr">{selectedYear}</span>
        </span>
        <button className={"pg right" + (nextYear ? "" : " muted")}
                onClick={() => nextYear && setSelectedYear(nextYear)}
                disabled={!nextYear}>
          <span className="col">
            <span className="lbl">{nextYear ? "next year" : "end of run"}</span>
            <span className="yr">{nextYear || "—"}</span>
          </span>
          <span className="arrow">⟶</span>
        </button>
      </div>
    </section>
  );
}

// ==================================================================
// RECENT PAGE
// ==================================================================
function RecentPage({ nav, player }) {
  const total = RECENT_LOG.reduce((n, d) => n + d.entries.length, 0);
  return (
    <section className="col col-wide">
      <div className="crumbs"><a onClick={() => nav.go("home")}>HOME</a><span className="sep">/</span><span className="cur">RECENT</span></div>

      <div className="page-head">
        <div>
          <div className="kicker">Recent · your play log</div>
          <h2>What you've been <span className="italic">spinning.</span></h2>
          <div className="lede">{total} tracks stored across {RECENT_LOG.length} days of this long, strange trip.</div>
        </div>
        <div className="toolbar">
          <span className="mono">cached · 24h</span>
          <button className="btn ghost" style={{fontSize:13}}>Clear log</button>
        </div>
      </div>

      {RECENT_LOG.map(day => (
        <div className="recent-day" key={day.day}>
          <div className="day-head">
            <span className="lbl"><span style={{color:"var(--rust)",fontFamily:"var(--serif-display)",fontStyle:"italic",paddingRight:8}}>—</span>{day.day}</span>
            <span className="date">{day.date}</span>
            <span className="count">{day.entries.length} plays</span>
          </div>
          {day.entries.map((e, i) => (
            <div key={i} className="recent-entry" onClick={() => player.playEntireShow()}>
              <span className="time">{e.time}</span>
              <span className="track">{e.track}</span>
              <span className="src">{e.show}</span>
              <span className="dur">{e.dur}</span>
              <span className="played">PLAYED</span>
            </div>
          ))}
        </div>
      ))}
    </section>
  );
}

// ==================================================================
// EXPORT PAGE — two tabs
// ==================================================================
function ExportPage({ nav }) {
  const [tab, setTab] = useStateP2("builder");
  return (
    <section className="col col-wide">
      <div className="crumbs"><a onClick={() => nav.go("home")}>HOME</a><span className="sep">/</span><span className="cur">EXPORT</span></div>

      <div className="page-head">
        <div>
          <div className="kicker">Export · your own pressing</div>
          <h2>Build your <span className="italic">perfect set.</span></h2>
          <div className="lede">Compose a setlist, generate a song dossier, or pull raw CSV — leave the vault with something in hand.</div>
        </div>
      </div>

      <div className="tabs">
        <button className={"tab" + (tab === "builder" ? " active" : "")} onClick={() => setTab("builder")}>≡ Setlist Builder</button>
        <button className={"tab" + (tab === "data" ? " active" : "")} onClick={() => setTab("data")}>↓ Data Export</button>
      </div>

      {tab === "builder" && <SetlistBuilder />}
      {tab === "data" && <DataExport nav={nav} />}
    </section>
  );
}

function SetlistBuilder() {
  const [target, setTarget] = useStateP2("setI");
  const [setI, setSetI] = useStateP2([
    { slug: "scarlet", title: "Scarlet Begonias", approx: "9:00", segueOut: true },
    { slug: "fire-mountain", title: "Fire on the Mountain", approx: "11:00", segueOut: false },
  ]);
  const [setII, setSetII] = useStateP2([]);
  const [encore, setEncore] = useStateP2([
    { slug: "brokendown-palace", title: "Brokedown Palace", approx: "4:00", segueOut: false },
  ]);
  const [meta, setMeta] = useStateP2({ band: "Mostly Dead", date: "5/26/26", venue: "Buda, TX" });
  const [search, setSearch] = useStateP2("");

  const lists = { setI, setII, encore };
  const setters = { setI: setSetI, setII: setSetII, encore: setEncore };

  const addSong = (song) => {
    setters[target](prev => [...prev, { slug: song.slug, title: song.title, approx: "~5:00", segueOut: false }]);
    setSearch("");
  };
  const removeSong = (which, idx) => setters[which](prev => prev.filter((_, i) => i !== idx));
  const toggleSegue = (which, idx) => setters[which](prev => prev.map((p, i) => i === idx ? {...p, segueOut: !p.segueOut} : p));

  const searchHits = search ? SONGS.filter(s => s.title.toLowerCase().includes(search.toLowerCase())).slice(0, 6) : [];
  const total = setI.length + setII.length + encore.length;
  const approxMin = total * 6;

  return (
    <div className="builder-grid">
      {/* LEFT — search & legend */}
      <div>
        <div className="field-block">
          <div className="label">Search Songs</div>
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="China Cat, Dark Star, Bertha…" />
          {searchHits.length > 0 && (
            <div style={{marginTop:8,maxHeight:160,overflowY:"auto",border:"1px solid var(--rule)",background:"var(--paper)"}}>
              {searchHits.map(s => (
                <div key={s.slug} onClick={() => addSong(s)}
                  style={{padding:"6px 10px",borderBottom:"1px dotted var(--rule-soft)",cursor:"pointer",fontFamily:"var(--serif-body)",fontSize:13,display:"flex",justifyContent:"space-between"}}>
                  <span>{s.title}</span>
                  <span style={{fontFamily:"var(--mono)",fontSize:10,color:"var(--ink-3)"}}>{s.count}×</span>
                </div>
              ))}
            </div>
          )}
          <div className="pills" style={{marginTop:10}}>
            <span style={{fontFamily:"var(--mono)",fontSize:10,color:"var(--ink-3)",letterSpacing:"0.1em",alignSelf:"center"}}>Add to:</span>
            {["setI","setII","encore"].map(t => (
              <span key={t} className={"pill" + (target === t ? " on" : "")} onClick={() => setTarget(t)}>
                {t === "setI" ? "Set I" : t === "setII" ? "Set II" : "Encore"}
              </span>
            ))}
          </div>
        </div>

        <div className="legend-block">
          <div className="row"><span className="dot" style={{background:"var(--rust)"}}></span><span><strong style={{fontStyle:"normal"}}>Rust badge</strong> = almost always played together</span></div>
          <div className="row"><span className="dot" style={{background:"var(--forest)"}}></span><span><strong style={{fontStyle:"normal"}}>Forest</strong> = common set opener</span></div>
          <div className="row"><span className="dot" style={{background:"var(--ledger-blue)"}}></span><span><strong style={{fontStyle:"normal"}}>Blue</strong> = common set closer</span></div>
          <div className="row"><span className="dot" style={{background:"var(--ink-3)"}}></span><span><strong style={{fontStyle:"normal"}}>Grey</strong> = common encore</span></div>
          <div className="row"><span style={{color:"var(--rust)",fontFamily:"var(--mono)"}}>→</span><span>Tap → on a song to mark a segue</span></div>
        </div>
      </div>

      {/* RIGHT — metadata + sets */}
      <div>
        <div className="field-block">
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:10}}>
            <div>
              <div className="label">Band</div>
              <input value={meta.band} onChange={e => setMeta({...meta, band: e.target.value})} />
            </div>
            <div>
              <div className="label">Date</div>
              <input value={meta.date} onChange={e => setMeta({...meta, date: e.target.value})} />
            </div>
            <div>
              <div className="label">Venue</div>
              <input value={meta.venue} onChange={e => setMeta({...meta, venue: e.target.value})} />
            </div>
          </div>
        </div>

        {["setI","setII","encore"].map(which => {
          const list = lists[which];
          const totalMin = list.length * 6;
          return (
            <div key={which} className="builder-set">
              <header>
                <h4><span style={{fontFamily:"var(--serif-display)",fontStyle:"italic",color:"var(--rust)",fontSize:20,letterSpacing:0,paddingRight:6}}>{which === "setI" ? "I" : which === "setII" ? "II" : "E."}</span>{which === "setI" ? "Set I" : which === "setII" ? "Set II" : "Encore"}</h4>
                <span></span>
                <span className="meta">{list.length} songs · ~{totalMin} min</span>
              </header>
              {list.length === 0 && <div className="empty">Search songs and add them here ↑</div>}
              {list.map((s, i) => (
                <div key={i} className="builder-row">
                  <span className="num">{String(i + 1).padStart(2,"0")}</span>
                  <span className="grip">≡</span>
                  <span className="ttl">{s.title}</span>
                  <span className="approx">~{s.approx}</span>
                  <span className={"arr" + (s.segueOut ? " on" : "")} onClick={() => toggleSegue(which, i)}>→</span>
                  <span className="x" onClick={() => removeSong(which, i)}>×</span>
                </div>
              ))}
            </div>
          );
        })}

        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginTop:12,paddingTop:8,borderTop:"3px double var(--ink)"}}>
          <div className="mono" style={{fontSize:11,letterSpacing:"0.1em",color:"var(--ink-3)",textTransform:"uppercase"}}>
            {total} songs total · est. ~{approxMin} min
          </div>
          <button className="btn primary">↓ Export as PDF</button>
        </div>
      </div>
    </div>
  );
}

function DataExport({ nav }) {
  const [include, setInclude] = useStateP2({ perf: true, position: true, versions: true, aliases: true });
  const s = SAMPLE_SONG_DETAIL;

  return (
    <div style={{display:"grid",gridTemplateColumns:"320px 1fr",gap:24}}>
      <div>
        <div className="field-block">
          <div className="label">Song Dossier — choose a song</div>
          <div className="pseudo">{s.title}</div>
          <div style={{marginTop:10}}>
            <div className="label" style={{marginBottom:6}}>Sections</div>
            {[
              {k:"perf",      l:"Performance facts"},
              {k:"position",  l:"Position breakdown"},
              {k:"versions",  l:"Versions table (top 25)"},
              {k:"aliases",   l:"Aliases & attribution"},
            ].map(o => (
              <div key={o.k} className={"dossier-toggle" + (include[o.k] ? " on" : "")} onClick={() => setInclude({...include, [o.k]: !include[o.k]})}>
                <span className="chk">{include[o.k] ? "✓" : ""}</span>
                <span>{o.l}</span>
              </div>
            ))}
          </div>
          <button className="btn primary" style={{marginTop:14,width:"100%"}}>↓ Download .md</button>
        </div>

        <div className="field-block">
          <div className="label">Raw Data</div>
          <div style={{fontFamily:"var(--serif-body)",fontStyle:"italic",fontSize:13,color:"var(--ink-2)",marginBottom:10}}>
            All-time leaderboard, all 442 songs, with counts and percentages.
          </div>
          <button className="btn ghost" style={{width:"100%"}}>↓ Download leaderboard.csv</button>
        </div>

        <div className="field-block">
          <div className="label">Show Ticket — PNG poster</div>
          <div style={{fontFamily:"var(--serif-body)",fontStyle:"italic",fontSize:13,color:"var(--ink-3)"}}>
            coming in the next pressing.
          </div>
          <button className="btn ghost" style={{width:"100%",marginTop:8,opacity:0.5,cursor:"not-allowed"}}>↓ Coming soon</button>
        </div>
      </div>

      <div>
        <div style={{fontFamily:"var(--mono)",fontSize:10,letterSpacing:"0.18em",textTransform:"uppercase",color:"var(--ink-3)",marginBottom:8}}>Live preview</div>
        <div className="dossier-doc">
          <h5>{s.title} <span style={{fontFamily:"var(--serif-body)",fontStyle:"italic",fontSize:14,color:"var(--ink-3)",letterSpacing:0}}>— a dossier</span></h5>
          <div style={{fontFamily:"var(--mono)",fontSize:10,letterSpacing:"0.1em",color:"var(--ink-3)",textTransform:"uppercase"}}>
            compiled by the vault operator · MMXXVI
          </div>

          {include.perf && (
            <>
              <h6>Performance Facts</h6>
              <p>First performance: <strong>{s.first.date}</strong> at {s.first.venue}, {s.first.city}.</p>
              <p>Last performance: <strong>{s.last.date}</strong> at {s.last.venue}, {s.last.city}.</p>
              <p>Total performances: <strong>{s.count}</strong> across {s.span} years.</p>
            </>
          )}

          {include.position && (
            <>
              <h6>Position Breakdown</h6>
              <p>Opened the show: {s.opened}. Closed the show: {s.closed}. Played as encore: {s.encored}.</p>
            </>
          )}

          {include.versions && (
            <>
              <h6>Versions · top 8</h6>
              <table>
                <tbody>
                  {s.versions.map((v,i) => (
                    <tr key={i}><td>{String(i+1).padStart(2,"0")}</td><td>{v.date}</td><td>{v.venue}</td><td>{v.dur}</td></tr>
                  ))}
                </tbody>
              </table>
            </>
          )}

          {include.aliases && (
            <>
              <h6>Aliases &amp; Attribution</h6>
              <p>Also known as: {s.aliases.join(", ")}.</p>
              <p>Lyrics: Robert Hunter. Music: Jerry Garcia.</p>
            </>
          )}

          <div className="footer">— end of dossier · steal your stats, vol. xi · {include.perf || include.position || include.versions || include.aliases ? "complete" : "empty"} —</div>
        </div>
      </div>
    </div>
  );
}

Object.assign(window, {
  StatsPage, VenuesPage, ErasPage, EraDetailPage, MembersPage, MemberDetailPage, RecentPage, ExportPage,
});
