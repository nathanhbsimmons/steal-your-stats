/* THE VAULT OPERATOR — pages */
/* eslint-disable */
const { useState: useStateP, useMemo: useMemoP, useEffect: useEffectP } = React;

// ==================================================================
// HOME PAGE — featured show + ledger marginalia
// ==================================================================
function HomePage({ player, nav }) {
  const show = FEATURED_SHOW;

  return (
    <>
      <section className="col" style={{paddingTop: 2}}>
        <div className="gutter-label gutter-label-lg"><span>Featured · On This Day</span><span className="mono">PG. 1977</span></div>

        <div className="feature">
          <span className="tag"><span className="pulse"></span>On this day · 49 years gone</span>

          <h2>
            <span style={{fontSize:"0.88em"}}>
              {show.weekday}, the {show.dayRoman}<sup style={{fontSize:"0.5em",verticalAlign:"super",fontWeight:400,color:"var(--rust)"}}>th</sup>
              {" "}<span className="italic">of</span> {show.monthName}
            </span><br/>
            <span style={{fontSize:"0.85em",color:"var(--ink-3)"}} className="italic">{show.year}</span>
          </h2>

          <div className="venue">
            <strong>{show.venue}</strong> · {show.city}, {show.state}
            <span className="italic"> — “the Fabulous Fox,” a movie palace built in 1929</span>
          </div>

          <div className="meta-row">
            <div className="item">Tracks<strong>{TOTAL_TRACKS}</strong></div>
            <div className="item">Duration<strong>{fmtDur(TOTAL_SECONDS)}</strong></div>
            <div className="item rust">Opener<strong style={{fontSize:"19px"}}>Promised Land</strong></div>
            <div className="item">Closer<strong style={{fontSize:"19px"}}>U.S. Blues</strong></div>
            <div className="actions">
              <button className="btn primary" onClick={() => player.playEntireShow()}><span className="play-tri">▶</span> Play entire show</button>
              <button className="btn ghost" onClick={() => nav.go("show", {date: show.date})}>Open setlist ↗</button>
            </div>
          </div>

          <TimelineStrip show={show} player={player} />
        </div>

        <SetlistBlock player={player} show={show} />

        <div className="margin-note" style={{marginTop:18}}>
          <span className="head">Provenance</span>
          Source · {show.tape}. Transferred from cassette ‘77-A2-Reel-04, two passes, no EQ.
          Confidence: <strong style={{fontStyle:"normal",color:"var(--forest)"}}>9.4 / 10</strong> per the vault committee.
        </div>
      </section>

      <RightLedger player={player} nav={nav} />
    </>
  );
}

function TimelineStrip({ show, player }) {
  const sets = show.sets;
  const setTotals = sets.map(s => s.tracks.reduce((n, t) => n + parseDur(t.dur), 0));
  const grandTotal = setTotals.reduce((a, b) => a + b, 0);

  // current playing track position
  const currentId = player.current ? player.current.id : null;
  const currentSetIdx = sets.findIndex(s => s.tracks.some(t => t.id === currentId));
  let elapsedInShow = 0;
  if (currentSetIdx >= 0) {
    for (let si = 0; si < currentSetIdx; si++) elapsedInShow += setTotals[si];
    const set = sets[currentSetIdx];
    for (const t of set.tracks) {
      if (t.id === currentId) { elapsedInShow += player.elapsed; break; }
      elapsedInShow += parseDur(t.dur);
    }
  }
  const showProgress = player.entireShowMode && currentId ? (elapsedInShow / grandTotal) * 100 : null;

  return (
    <>
      <div className="duration-axis" style={{marginTop: 14}}>
        {sets.map((s, si) => (
          <span key={s.label}
                className={"axis-seg set-" + si}
                style={{flexBasis: (setTotals[si] / grandTotal * 100) + "%"}}>
            {s.label} · {fmtDur(setTotals[si])}
          </span>
        ))}
      </div>
      <div className="duration-timeline">
        {sets.map((set, si) => set.tracks.map(t => {
          const dur = parseDur(t.dur);
          const isCurrent = player.current && player.current.id === t.id;
          const isPlaying = isCurrent && player.playing;
          const isQueued = !isCurrent && player.queue.some(q => q.id === t.id);
          return (
            <div key={t.id}
              className={"slice set-" + si + (isCurrent ? " playing" : "") + (isQueued ? " queued" : "")}
              style={{flex: dur}}
              title={t.title + " · " + t.dur}
              onClick={() => player.playTrack(t.id)}
            >
              <span className="num">{ALL_TRACKS.findIndex(x => x.id === t.id) + 1}</span>
              <span className="ttl">{t.title}</span>
            </div>
          );
        }))}
        {showProgress !== null && (
          <div className="progress-needle" style={{left: showProgress + "%"}}></div>
        )}
      </div>
    </>
  );
}

function SetlistBlock({ player, show }) {
  return (
    <div className="setlist">
      {show.sets.map((set, si) => (
        <div key={set.label} className={"set-block" + (si === 1 ? " alt" : "")}>
          <div className="set-head">
            <h3><span className="roman">{set.roman}</span>{set.label}</h3>
            <div className="duration">
              {set.tracks.length} songs · {fmtDur(set.tracks.reduce((m, t) => m + parseDur(t.dur), 0))}
            </div>
          </div>
          {set.tracks.map((t) => {
            const isPlaying = player.current && player.current.id === t.id && player.playing;
            const isCurrent = player.current && player.current.id === t.id;
            const isQueued = !isCurrent && player.queue.some(q => q.id === t.id);
            const trackNum = ALL_TRACKS.findIndex(x => x.id === t.id) + 1;
            return (
              <div key={t.id} className={"track" + (isCurrent ? " playing" : "") + (isQueued ? " queued" : "")} onClick={() => player.playTrack(t.id)}>
                <span className="num">{String(trackNum).padStart(2,"0")}</span>
                <span className="play-dot">{isPlaying ? "❚❚" : "▶"}</span>
                <span className="title">{t.title}{t.segue && <span className="arrow"> › </span>}</span>
                <span className="note">{t.note || ""}</span>
                <span className="dur">{t.dur}</span>
                <span className="chev">→</span>
              </div>
            );
          })}
          {si === 0 && (
            <div className="fn">
              <span className="sup">¹</span>
              Set break ran 38 minutes; soundboard rolls on for the entirety —
              hear the crew set the rig if you let the silence play.
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

function RightLedger({ player, nav }) {
  const hero = STATS.filter(s => s.label === "Shows Indexed" || s.label === "Hours Archived");
  const rest = STATS.filter(s => s.label !== "Shows Indexed" && s.label !== "Hours Archived");

  return (
    <aside className="col right-col">
      <div className="gutter-label"><span>The Ledger · Stats</span><span className="mono">MMXXVI</span></div>
      <div className="ledger-hero">
        {hero.map(s => (
          <div className="cell" key={s.label}>
            <div className="label">{s.label}</div>
            <div className={"val " + (s.color || "")}>{s.value}</div>
            <div className="annot">{s.annot}</div>
          </div>
        ))}
      </div>
      <ul className="ledger">
        {rest.map(s => (
          <li key={s.label}>
            <div className="label">{s.label}<span className="annot">{s.annot}</span></div>
            <div className={"val " + (s.color || "")}>{s.value}</div>
          </li>
        ))}
      </ul>

      <div className="gutter-label" style={{marginTop:18}}><span>Most Played · All-Time</span><span className="mono">N=2,333</span></div>
      <ul className="toptable">
        {MOST_PLAYED.map(m => (
          <li key={m.rank} onClick={() => nav.go("song", {slug: "drums"})}>
            <div className="row1"><span className="rank">{m.rank}.</span><span>{m.title}</span><span className="plays">{m.plays}</span></div>
            <div className="bar"><div className="fill" style={{width: m.pct + "%"}}></div></div>
          </li>
        ))}
      </ul>

      <div className="gutter-label" style={{marginTop:18}}><span>Also on May 19</span><span className="mono">6 SHOWS</span></div>
      <ul className="alsolist">
        {ALSO_ON_THIS_DAY.map(s => (
          <li key={s.year + s.venue} onClick={() => nav.go("show", {date: s.year + "-05-19"})}>
            <span className="yr">{s.year}</span>
            <span className="where">{s.venue}<span className="city">{s.city}</span></span>
            <span className="ext">↗</span>
          </li>
        ))}
      </ul>

      <div className="cartouche">
        <div className="quote">If you get confused, just listen to the music play.</div>
        <div className="cite">— Franklin's Tower, R. Hunter</div>
      </div>
    </aside>
  );
}

// ==================================================================
// SHOW DETAIL PAGE
// ==================================================================
function ShowDetailPage({ player, nav, params }) {
  // For the demo, all dates route to the featured Fox '77 show.
  const show = FEATURED_SHOW;
  return (
    <section className="col col-wide">
      <div className="crumbs">
        <a onClick={() => nav.go("home")}>HOME</a><span className="sep">/</span>
        <a>SHOWS</a><span className="sep">/</span>
        <span className="cur">{show.date}</span>
      </div>

      <div className="page-head">
        <div>
          <div className="kicker">Show · Grateful Dead · 1977 Spring tour</div>
          <h2>{show.weekday}, {show.monthName} {show.day}<span className="italic" style={{color:"var(--rust)"}}>, </span>{show.year}</h2>
          <div className="lede">{show.venue} · {show.city}, {show.state} · {show.country}. {show.era}.</div>
        </div>
        <div className="toolbar" style={{flexDirection:"column",alignItems:"flex-end",gap:8}}>
          <button className="btn primary" onClick={() => player.playEntireShow()}>▶ Play entire show</button>
          <button className="btn ghost">setlist.fm ↗</button>
          <span className="mono">{TOTAL_TRACKS} songs · {fmtDur(TOTAL_SECONDS)}</span>
        </div>
      </div>

      <SetlistBlock player={player} show={show} />

      <div className="margin-note" style={{marginTop:18}}>
        <span className="head">Provenance &amp; Tape Lineage</span>
        {show.tape}. Two transfers logged: ‘77-A2-Reel-04 (preferred), ‘77-A2-Reel-04b.
        Sliced track-by-track in MMXXIV by jerry@archive. Confidence <strong style={{fontStyle:"normal",color:"var(--forest)"}}>9.4 / 10</strong>.
      </div>
    </section>
  );
}

// ==================================================================
// SONG DETAIL PAGE — Scarlet Begonias sample
// ==================================================================
function SongDetailPage({ player, nav, params }) {
  const s = SAMPLE_SONG_DETAIL;
  const [open, setOpen] = useStateP({ opened: false, closed: false, encored: false });
  const [sortKey, setSortKey] = useStateP("date");
  const versions = useMemoP(() => {
    const v = [...s.versions];
    if (sortKey === "date") v.sort((a,b) => a.date.localeCompare(b.date));
    if (sortKey === "duration") v.sort((a,b) => parseDur(b.dur) - parseDur(a.dur));
    if (sortKey === "venue") v.sort((a,b) => a.venue.localeCompare(b.venue));
    return v;
  }, [sortKey]);
  const [starred, setStarred] = useStateP(true);

  // sparkline data — random consistent
  const spark = useMemoP(() => {
    let x = 11; const out = [];
    for (let y = 1974; y <= 1995; y++) {
      x = (x * 73 + 7) % 97;
      out.push({ year: y, n: 8 + (x % 22) });
    }
    return out;
  }, []);
  const maxSpark = Math.max(...spark.map(s => s.n));

  return (
    <section className="col col-wide">
      <div className="crumbs">
        <a onClick={() => nav.go("home")}>HOME</a><span className="sep">/</span>
        <a onClick={() => nav.go("songs")}>SONGS</a><span className="sep">/</span>
        <span className="cur">{s.title.toUpperCase()}</span>
      </div>

      <div className="song-hero">
        <div className="title-block">
          <div className="kicker">Song · {s.role}</div>
          <h2>{s.title}</h2>
          <div className="aliases">
            also known as
            {s.aliases.map(a => <span key={a} className="pill">{a}</span>)}
          </div>
        </div>
        <div className="actions">
          <button className="btn primary" onClick={() => player.playEntireShow()}>▶ Play longest version</button>
          <button className="btn ghost">⟵ First show, Mar 23 ’74</button>
          <button className="btn ghost">⟶ Last show, Jul 8 ’95</button>
          <button className={"btn" + (starred ? "" : " ghost")} onClick={() => setStarred(!starred)}>
            {starred ? "★" : "☆"} {starred ? "Pinned" : "Pin to margin"}
          </button>
        </div>
      </div>

      <div className="section-head">
        <h3>Performance Facts</h3>
        <div className="descr">cached locally · pulled from setlist.fm at sync time</div>
        <span className="meta">N = {s.count}</span>
      </div>

      <div className="facts-grid">
        <div className="cell">
          <div className="label">First Performance</div>
          <div className="date">{s.first.date.replace(/-/g, " · ")}</div>
          <div className="where">{s.first.venue} — {s.first.city}</div>
          <div className="view">View setlist ↗</div>
        </div>
        <div className="cell">
          <div className="label">Last Performance</div>
          <div className="date">{s.last.date.replace(/-/g, " · ")}</div>
          <div className="where">{s.last.venue} — {s.last.city}</div>
          <div className="view">View setlist ↗</div>
        </div>
        <div className="cell">
          <div className="label">Total Performances</div>
          <div className="big">{s.count}</div>
          <div className="sub">across {s.span} years</div>
          <div className="spark" style={{marginTop:10}}>
            {spark.map(d => <span key={d.year} className="stem" style={{height: ((d.n/maxSpark)*100) + "%", opacity: 0.55 + (d.n/maxSpark)*0.45}} />)}
          </div>
        </div>
      </div>

      <div className="section-head">
        <h3>Position Facts</h3>
        <div className="descr">where {s.title.toLowerCase()} landed in the set</div>
        <span className="meta">positions · click to expand</span>
      </div>
      {[
        { key: "opened",  label: "Opened the show", n: s.opened, pct: (s.opened / s.count) * 100 },
        { key: "closed",  label: "Closed the show", n: s.closed, pct: (s.closed / s.count) * 100 },
        { key: "encored", label: "Played as encore",n: s.encored, pct: (s.encored / s.count) * 100 },
      ].map(row => (
        <div key={row.key}>
          <div className="pos-row" onClick={() => setOpen({...open, [row.key]: !open[row.key]})}>
            <span className="chev">{open[row.key] ? "▼" : "▶"}</span>
            <span className="label">{row.label}</span>
            <span className="count">{row.n}</span>
            <span className="bar"><span className="fill" style={{width: Math.max(2, row.pct) + "%"}}></span></span>
          </div>
          {open[row.key] && row.n > 0 && (
            <div style={{padding:"8px 22px",borderBottom:"1px solid var(--rule-soft)",fontFamily:"var(--mono)",fontSize:"11.5px",color:"var(--ink-3)"}}>
              {Array.from({length: row.n}).map((_, i) =>
                <div key={i} style={{padding:"3px 0"}}>1974-0{i+3}-1{i} · venue placeholder · city, ST <span style={{float:"right",color:"var(--rust)",cursor:"pointer"}}>open ↗</span></div>
              )}
            </div>
          )}
        </div>
      ))}

      <div className="section-head">
        <h3>Versions <span style={{fontFamily:"var(--mono)",fontSize:"13px",letterSpacing:"0.1em",color:"var(--rust)",marginLeft:"10px"}}>· ARCHIVE.ORG</span></h3>
        <div className="descr">tracked recordings, {s.versions.length} of {s.count}</div>
        <span className="meta">sort: <a className="rust" style={{cursor:"pointer",marginLeft:6,textDecoration:sortKey==="date"?"underline":"none"}} onClick={()=>setSortKey("date")}>date</a>{" · "}
          <a className="rust" style={{cursor:"pointer",textDecoration:sortKey==="duration"?"underline":"none"}} onClick={()=>setSortKey("duration")}>duration</a>{" · "}
          <a className="rust" style={{cursor:"pointer",textDecoration:sortKey==="venue"?"underline":"none"}} onClick={()=>setSortKey("venue")}>venue</a>
        </span>
      </div>

      <div className="extreme-pair">
        <div className="cell">
          <div className="play" onClick={() => player.playEntireShow()}>▶</div>
          <div>
            <div className="lbl">⟶ Longest</div>
            <div className="dur">{s.longest.dur}</div>
            <div className="at">{s.longest.date} · {s.longest.venue}</div>
          </div>
        </div>
        <div className="cell">
          <div className="play" onClick={() => player.playEntireShow()}>▶</div>
          <div>
            <div className="lbl">⟵ Shortest</div>
            <div className="dur">{s.shortest.dur}</div>
            <div className="at">{s.shortest.date} · {s.shortest.venue}</div>
          </div>
        </div>
      </div>

      <table className="tbl" style={{marginTop:10}}>
        <thead><tr><th>#</th><th>Date</th><th>Venue · City</th><th className="r">Duration</th><th></th></tr></thead>
        <tbody>
          {versions.map((v, i) => (
            <tr key={v.date + i} className={v.note === "LONGEST" || v.note === "SHORTEST" ? "hi" : ""} onClick={() => player.playEntireShow()}>
              <td className="num">{String(i + 1).padStart(2, "0")}</td>
              <td><span className="title">{v.date}</span>{v.note && v.note !== "LONGEST" && v.note !== "SHORTEST" && <span className="sub">“{v.note}”</span>}</td>
              <td><span className="title" style={{fontStyle:"italic"}}>{v.venue}</span></td>
              <td className="r">{v.dur}</td>
              <td className="r" style={{color:"var(--rust)"}}>▶</td>
            </tr>
          ))}
        </tbody>
      </table>

      <div style={{display:"flex",justifyContent:"space-between",marginTop:10,fontFamily:"var(--mono)",fontSize:"11px",color:"var(--ink-3)",letterSpacing:"0.08em",textTransform:"uppercase"}}>
        <span>Showing 8 of {s.count}</span>
        <a className="rust" style={{cursor:"pointer"}}>Load more ↓</a>
      </div>
    </section>
  );
}

// ==================================================================
// SONGS CATALOG PAGE
// ==================================================================
function SongsCatalogPage({ nav }) {
  const [q, setQ] = useStateP("");
  const filtered = SONGS.filter(s =>
    s.title.toLowerCase().includes(q.toLowerCase()) ||
    s.aliases.some(a => a.toLowerCase().includes(q.toLowerCase()))
  );
  const groups = useMemoP(() => {
    const g = {};
    filtered.forEach(s => {
      const k = s.title[0].toUpperCase();
      const letter = /[A-Z]/.test(k) ? k : "#";
      (g[letter] = g[letter] || []).push(s);
    });
    return Object.entries(g).sort(([a], [b]) => a.localeCompare(b));
  }, [filtered]);

  return (
    <section className="col col-wide">
      <div className="crumbs"><a onClick={() => nav.go("home")}>HOME</a><span className="sep">/</span><span className="cur">SONGS</span></div>

      <div className="page-head">
        <div>
          <div className="kicker">Catalog · the complete songbook</div>
          <h2>Every song <span className="italic">they played.</span></h2>
          <div className="lede">{SONGS.length} unique titles in the catalog. Filter to narrow.</div>
        </div>
        <div className="filter-input">
          <span>⌕</span>
          <input value={q} onChange={e => setQ(e.target.value)} placeholder="filter by title or alias…" />
          {q && <span className="clear" onClick={() => setQ("")}>×</span>}
        </div>
      </div>

      <div className="alpha">
        {groups.map(([letter, songs]) => (
          <div className="group" key={letter}>
            <h4>{letter}</h4>
            {songs.map(s => (
              <div className="song" key={s.slug} onClick={() => nav.go("song", {slug: s.slug})}>
                <span className="t">
                  {s.title}
                  {s.aliases.length > 0 && <span className="alias">— {s.aliases.join(", ")}</span>}
                </span>
                <span className="c">{s.count}</span>
              </div>
            ))}
          </div>
        ))}
      </div>
    </section>
  );
}

// ==================================================================
// SEARCH PAGE
// ==================================================================
function SearchPage({ nav, searchQ, setSearchQ }) {
  const [q, setQ] = useStateP(searchQ || "scarlet");
  useEffectP(() => { setSearchQ && setSearchQ(q); }, [q]);

  const songResults = SONGS.filter(s => q && s.title.toLowerCase().includes(q.toLowerCase())).slice(0, 8);
  const topSong = songResults[0];
  const showResults = topSong ? SHOWS.slice(0, 6) : [];

  return (
    <section className="col col-wide">
      <div className="crumbs"><a onClick={() => nav.go("home")}>HOME</a><span className="sep">/</span><span className="cur">SEARCH</span></div>

      <div className="page-head">
        <div>
          <div className="kicker">Search · songs &amp; shows</div>
          <h2>Find <span className="italic">anything.</span></h2>
          <div className="lede">Let inspiration move you brightly across the catalog, the calendar, and the venues.</div>
        </div>
      </div>

      <div className="search-big">
        <span style={{fontFamily:"var(--mono)",fontSize:"20px",color:"var(--ink-3)"}}>⌕</span>
        <input value={q} onChange={e => setQ(e.target.value)} placeholder="songs, venues, dates, eras…" />
        <span className="kbd">⌘K</span>
      </div>

      <div className="results-cols">
        <div className="result-col">
          <h4>Songs · {songResults.length}</h4>
          {songResults.length === 0 && <div style={{padding:"16px 0",fontStyle:"italic",color:"var(--ink-3)"}}>No matches in the catalog.</div>}
          {songResults.map(s => (
            <div key={s.slug} className="row" onClick={() => nav.go("song", {slug: s.slug})}>
              <span><span className="t">{s.title}</span>{s.aliases.length > 0 && <span style={{fontFamily:"var(--serif-body)",fontStyle:"italic",fontSize:"12px",color:"var(--ink-3)",paddingLeft:"6px"}}>— {s.aliases.join(", ")}</span>}</span>
              <span className="s">{s.count}×</span>
            </div>
          ))}
        </div>
        <div className="result-col">
          <h4>Shows featuring “{topSong ? topSong.title : q}” · {showResults.length}</h4>
          {showResults.length === 0 && <div style={{padding:"16px 0",fontStyle:"italic",color:"var(--ink-3)"}}>—</div>}
          {showResults.map(s => (
            <div key={s.date} className="row" onClick={() => nav.go("show", {date: s.date})}>
              <span><span className="t">{s.date}</span>
                <span style={{fontFamily:"var(--serif-body)",fontStyle:"italic",fontSize:"13px",color:"var(--ink-2)",paddingLeft:"6px"}}>— {s.venue}</span>
              </span>
              <span className="s">{s.city}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

Object.assign(window, {
  HomePage, ShowDetailPage, SongDetailPage, SongsCatalogPage, SearchPage,
});
