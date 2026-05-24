/* THE VAULT OPERATOR — main app shell + router */

const { useState, useEffect, useRef, useMemo, useCallback } = React;

// -------------------------------------------------------------- player hook
function usePlayer() {
  const [queue, setQueue] = useState([]);
  const [index, setIndex] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [volume, setVolume] = useState(0.72);
  const [showQueue, setShowQueue] = useState(false);
  const [entireShowMode, setEntireShowMode] = useState(false);

  const current = queue[index] || null;
  const currentDur = current ? parseDur(current.dur) : 0;

  useEffect(() => {
    if (!playing || !current) return;
    const id = setInterval(() => {
      setElapsed(e => {
        if (e + 0.25 >= currentDur) {
          if (index + 1 < queue.length) { setIndex(index + 1); return 0; }
          setPlaying(false); return currentDur;
        }
        return e + 0.25;
      });
    }, 250);
    return () => clearInterval(id);
  }, [playing, current, currentDur, index, queue.length]);

  const playTrack = useCallback((trackId, contextTracks) => {
    const list = contextTracks || ALL_TRACKS;
    const i = list.findIndex(t => t.id === trackId);
    if (i < 0) return;
    setQueue(list); setIndex(i); setElapsed(0); setPlaying(true);
    setEntireShowMode(list.length === ALL_TRACKS.length);
  }, []);

  const playEntireShow = useCallback(() => {
    setQueue(ALL_TRACKS); setIndex(0); setElapsed(0); setPlaying(true); setEntireShowMode(true);
  }, []);

  const toggle = useCallback(() => {
    if (!current) { playEntireShow(); return; }
    setPlaying(p => !p);
  }, [current, playEntireShow]);

  const next = useCallback(() => {
    if (index + 1 < queue.length) { setIndex(index + 1); setElapsed(0); }
  }, [index, queue.length]);

  const prev = useCallback(() => {
    if (elapsed > 3 || index === 0) { setElapsed(0); return; }
    setIndex(index - 1); setElapsed(0);
  }, [elapsed, index]);

  const seek = useCallback((fraction) => {
    setElapsed(Math.max(0, Math.min(1, fraction)) * currentDur);
  }, [currentDur]);

  const removeFromQueue = useCallback((trackId) => {
    setQueue(q => {
      const i = q.findIndex(t => t.id === trackId);
      if (i < 0) return q;
      const nx = q.slice(0, i).concat(q.slice(i + 1));
      if (i < index) setIndex(idx => idx - 1);
      else if (i === index) setElapsed(0);
      return nx;
    });
  }, [index]);

  const clearAndPlayShow = useCallback(() => { playEntireShow(); }, [playEntireShow]);
  const clearQueue = useCallback(() => { setQueue([]); setIndex(0); setElapsed(0); setPlaying(false); setEntireShowMode(false); }, []);

  return {
    queue, index, current, currentDur, playing, elapsed, volume,
    showQueue, entireShowMode, setVolume, setShowQueue,
    playTrack, playEntireShow, toggle, next, prev, seek,
    removeFromQueue, clearAndPlayShow, clearQueue,
  };
}

// =================================================================== ROUTER
function useRouter() {
  const parse = () => {
    const h = (window.location.hash || "#/home").replace(/^#\/?/, "").split("/");
    const route = h[0] || "home";
    const params = {};
    if (route === "song" && h[1]) params.slug = h[1];
    if (route === "show" && h[1]) params.date = h[1];
    if (route === "era" && h[1]) params.id = h[1];
    if (route === "member" && h[1]) params.id = h[1];
    if (route === "search" && h[1]) params.q = decodeURIComponent(h[1]);
    return { route, params };
  };
  const [r, setR] = useState(parse());
  useEffect(() => {
    const on = () => setR(parse());
    window.addEventListener("hashchange", on);
    return () => window.removeEventListener("hashchange", on);
  }, []);
  const go = useCallback((route, params = {}) => {
    let hash = "#/" + route;
    if (route === "song" && params.slug) hash += "/" + params.slug;
    if (route === "show" && params.date) hash += "/" + params.date;
    if (route === "era" && params.id)   hash += "/" + params.id;
    if (route === "member" && params.id) hash += "/" + params.id;
    if (route === "search" && params.q) hash += "/" + encodeURIComponent(params.q);
    window.location.hash = hash;
    window.scrollTo(0, 0);
  }, []);
  return { ...r, go };
}

// =================================================================== MASTHEAD
function Masthead({ search, setSearch, nav }) {
  const onSearch = (e) => {
    if (e.key === "Enter" && search.trim()) nav.go("search", { q: search.trim() });
  };
  return (
    <header className="masthead">
      <div className="left">
        <div>Indexed Tue 19 May MMXXVI · 04:12 EST</div>
      </div>
      <div className="center">
        <h1 onClick={() => nav.go("home")} style={{cursor:"pointer"}}>Steal<span className="amp">your</span>Stats</h1>
        <div className="sub">
          The <span className="blackletter">Dead</span> Archive ·
          <i> compiled by hand, played through the deck</i>
        </div>
      </div>
      <div className="right">
        <div className="rcol">
          <div className="weather">49°F · clear sky and a Sunshine Daydream</div>
          <label className="search">
            <span style={{color:"var(--ink-3)"}}>⌕</span>
            <input value={search} onChange={e => setSearch(e.target.value)} onKeyDown={onSearch} placeholder="search…" />
            <span className="kbd">⌘K</span>
          </label>
        </div>
      </div>
    </header>
  );
}

function EditionStrip({ nav }) {
  return (
    <div className="edition-strip">
      <div>Pp. 0001 — 2333</div>
      <div className="center-marks">
        <span className="glyph">❦</span>
        <span>An Annotated Guide to Grateful Dead Songlists</span>
        <span className="glyph">❦</span>
      </div>
      <div>setlist.fm · archive.org</div>
    </div>
  );
}

// =================================================================== CHAPTERS
const ROUTE_TO_CHAPTER = {
  home: "home", search: "search", songs: "songs", song: "songs",
  show: "home", recent: "recent", members: "members", member: "members",
  venues: "venues", eras: "eras", era: "eras",
  stats: "stats", export: "export",
};

function Chapters({ nav }) {
  const cur = ROUTE_TO_CHAPTER[nav.route] || nav.route;
  return (
    <nav className="chapters">
      {CATALOG_NAV.map(c => (
        <button key={c.id} className={cur === c.id ? "active" : ""}
          onClick={() => nav.go(c.id)}>
          <span className="num">{c.num}.</span>{c.label}
          {c.badge && <span style={{fontFamily:"var(--mono)",fontSize:"9.5px",color:"var(--ink-3)",letterSpacing:"0.05em",paddingLeft:"4px"}}>{c.badge}</span>}
        </button>
      ))}
      <div className="spacer"></div>
      <div className="meta">PG. <span style={{color:"var(--rust)"}}>0001</span> of 2333</div>
    </nav>
  );
}

// =================================================================== LEFT — INDEX
const CATALOG_NAV = [
  { id: "home",    num: "I",    label: "Home",         badge: null },
  { id: "search",  num: "II",   label: "Search",       badge: "⌘K" },
  { id: "songs",   num: "III",  label: "Songs",        badge: "442" },
  { id: "recent",  num: "IV",   label: "Recent",       badge: "12" },
  { id: "members", num: "V",    label: "Band Members", badge: null },
  { id: "venues",  num: "VI",   label: "Venues",       badge: "382" },
  { id: "eras",    num: "VII",  label: "Eras",         badge: null },
  { id: "stats",   num: "VIII", label: "Stats",        badge: null },
  { id: "export",  num: "IX",   label: "Export",       badge: null },
];

function LeftIndex({ nav, onPlayPinned }) {
  const cur = ROUTE_TO_CHAPTER[nav.route] || nav.route;
  return (
    <aside className="col">
      <div className="gutter-label"><span>Index — Catalog</span><span className="dot"></span></div>
      <ul className="cat-list">
        {CATALOG_NAV.map(c => (
          <li key={c.id} className={cur === c.id ? "active" : ""} onClick={() => nav.go(c.id)} style={{position:"relative"}}>
            <span className="num">{c.num}.</span>
            <span>{c.label}</span>
            {c.badge && <span className="badge">{c.badge}</span>}
          </li>
        ))}
      </ul>

      <div className="section-break"></div>

      <div className="gutter-label"><span>Pinned · Songs</span><span className="mono" style={{color:"var(--rust)"}}>5 ✦</span></div>
      <ul className="pin-list">
        {PINNED.map(p => (
          <li key={p.title} onClick={() => onPlayPinned && onPlayPinned(p)}>
            <span className="ribbon">❡</span>
            <span>{p.title}</span>
            <span className="plays">{p.plays}×</span>
          </li>
        ))}
      </ul>

      <div className="margin-note">
        <span className="head">Operator's Note</span>
        Pinned songs persist across sessions. Click a title to seek the earliest extant version in the vault.
      </div>

      <div className="user-card">
        <div className="avatar">J</div>
        <div className="who">jerry@archive<br/><span className="sub">cached · 24h</span></div>
        <div className="cog">⚙</div>
      </div>
    </aside>
  );
}

// =================================================================== PLAYER
function Player({ player }) {
  const { current, currentDur, playing, elapsed, volume, queue, index, entireShowMode } = player;
  const pct = currentDur ? elapsed / currentDur : 0;

  const onBarClick = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    player.seek((e.clientX - rect.left) / rect.width);
  };
  const onVolClick = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    player.setVolume(Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width)));
  };

  const remainingSec = (currentDur - elapsed) + queue.slice(index + 1).reduce((n, t) => n + parseDur(t.dur), 0);

  return (
    <div className="player">
      <div className="inner">
        <div className="now">
          <div className={"stamp " + (playing ? "spinning" : "")}>
            <div className="ring"></div>
          </div>
          <div className="meta">
            <div className="title">{current ? current.title : <span style={{color:"var(--ink-3)",fontWeight:400,fontStyle:"italic"}}>nothing in the deck</span>}</div>
            <div className="sub">
              {current
                ? <>{current.showDate} · {current.venue} · <span className="live">REEL TO REEL</span></>
                : <>cue a show to begin · <span style={{color:"var(--rust)"}}>play the featured tape</span></>}
            </div>
          </div>
        </div>

        <div className="transport">
          <div className="ctrls">
            <button className="iconbtn" onClick={player.prev}>◀◀</button>
            <button className="iconbtn play" onClick={player.toggle}>{playing ? "❚❚" : "▶"}</button>
            <button className="iconbtn" onClick={player.next}>▶▶</button>
          </div>
          <div className="progress">
            <span className="time">{current ? fmtDur(elapsed) : "0:00"}</span>
            <div className="bar" onClick={onBarClick}>
              <div className="track-rule"></div>
              <div className="ticks">{Array.from({length: 11}).map((_, i) => <span key={i}/>)}</div>
              <div className="fill" style={{width: (pct * 100) + "%"}}></div>
              <div className="needle" style={{left: (pct * 100) + "%"}}></div>
            </div>
            <span className="time right">{current ? current.dur : "0:00"}</span>
          </div>
        </div>

        <div className="right-ctrls">
          <div className="vol">
            <span className="mono" style={{fontSize:"11px",color:"var(--ink-3)"}}>VOL</span>
            <div className="slider" onClick={onVolClick}>
              <div className="rule"></div>
              <div className="fill" style={{width:(volume*100)+"%"}}></div>
              <div className="knob" style={{left:(volume*100)+"%"}}></div>
            </div>
          </div>
          <button className={"toggleq" + (player.showQueue ? " active" : "")} onClick={() => player.setShowQueue(!player.showQueue)}>
            Queue <span className="badge">{queue.length}</span>
          </button>
        </div>
      </div>

      <div className="status-row">
        <span>
          {entireShowMode
            ? <><span className="lit"><span className="dot"></span>playing entire show</span> · queue · {queue.length} tracks · {fmtDur(remainingSec)} left</>
            : queue.length > 0
              ? <>cued · {queue.length} track{queue.length === 1 ? "" : "s"} · {fmtDur(remainingSec)} left</>
              : <>standby · no queue · click a setlist track to begin</>
          }
        </span>
        <span>Side {index < TOTAL_TRACKS / 2 ? "A" : "B"} · Track {index + 1} / {queue.length || "—"} · {Math.round(volume * 100)} dB</span>
      </div>
    </div>
  );
}

function QueueDrawer({ player }) {
  if (!player.showQueue) return null;
  const { queue, index, currentDur, elapsed } = player;
  const totalLeft = (currentDur - elapsed) + queue.slice(index + 1).reduce((n, t) => n + parseDur(t.dur), 0);
  return (
    <div className="queue">
      <header>
        <h4>Queue <span style={{fontFamily:"var(--mono)",fontWeight:400,fontSize:"11px",color:"var(--ink-3)",letterSpacing:"0.08em"}}> {queue.length} TRACKS · {fmtDur(totalLeft)}</span></h4>
        <div style={{display:"flex",gap:10,alignItems:"baseline"}}>
          <button className="close" onClick={() => player.clearQueue()}>clear all</button>
          <button className="close" onClick={() => player.setShowQueue(false)}>×</button>
        </div>
      </header>
      <div className="list">
        {queue.length === 0 && (
          <div style={{padding:"22px 16px",textAlign:"center",color:"var(--ink-3)",fontStyle:"italic"}}>The deck is empty. Cue a track to begin.</div>
        )}
        {queue.map((t, i) => (
          <div key={t.id + i} className={"qrow" + (i === index ? " current" : "")} onClick={() => player.playTrack(t.id, queue)}>
            <span className="qnum">{String(i + 1).padStart(2,"0")}</span>
            <span>
              <div className="qtitle">{t.title}</div>
              <div className="qsub">{t.showDate} · {t.venue}</div>
            </span>
            <span className="qdur">{t.dur}</span>
            <span className="qx" onClick={(e) => { e.stopPropagation(); player.removeFromQueue(t.id); }}>×</span>
          </div>
        ))}
      </div>
      <footer>
        <span>{queue.length} cued</span>
        <button onClick={() => player.clearAndPlayShow()}>Clear &amp; play entire show</button>
      </footer>
    </div>
  );
}

function Colophon() {
  return (
    <footer className="colophon">
      <span>© MMXXVI · Steal Your Stats Press · Made by hand</span>
      <span className="center"><span className="glyph">❦</span>&nbsp;&nbsp;If you get confused, listen to the music play&nbsp;&nbsp;<span className="glyph">❦</span></span>
      <span>v.11.5 · cached locally · last sync 1h ago</span>
    </footer>
  );
}

// =================================================================== APP
function App() {
  const nav = useRouter();
  const [search, setSearch] = useState("");
  const player = usePlayer();

  const onPlayPinned = (pinned) => {
    const match = ALL_TRACKS.find(t => t.title.toLowerCase().includes(pinned.title.toLowerCase().split(" ")[0]));
    if (match) player.playTrack(match.id);
    else player.playEntireShow();
  };

  // Routes that use a 2-column layout (no right-col gutter content)
  const wideRoutes = new Set(["show","song","songs","search","stats","venues","eras","members","member","recent","export"]);
  const isWide = wideRoutes.has(nav.route);

  let body;
  if (nav.route === "home") body = <HomePage player={player} nav={nav} />;
  else if (nav.route === "show")    body = <ShowDetailPage player={player} nav={nav} params={nav.params} />;
  else if (nav.route === "song")    body = <SongDetailPage player={player} nav={nav} params={nav.params} />;
  else if (nav.route === "songs")   body = <SongsCatalogPage nav={nav} />;
  else if (nav.route === "search")  body = <SearchPage nav={nav} searchQ={nav.params.q || search} setSearchQ={setSearch} />;
  else if (nav.route === "stats")   body = <StatsPage nav={nav} />;
  else if (nav.route === "venues")  body = <VenuesPage nav={nav} />;
  else if (nav.route === "eras")    body = <ErasPage nav={nav} />;
  else if (nav.route === "era")     body = <EraDetailPage nav={nav} params={nav.params} />;
  else if (nav.route === "members") body = <MembersPage nav={nav} />;
  else if (nav.route === "member")  body = <MemberDetailPage nav={nav} params={nav.params} player={player} />;
  else if (nav.route === "recent")  body = <RecentPage nav={nav} player={player} />;
  else if (nav.route === "export")  body = <ExportPage nav={nav} />;
  else body = <HomePage player={player} nav={nav} />;

  return (
    <div className="page">
      <Masthead search={search} setSearch={setSearch} nav={nav} />
      <EditionStrip nav={nav} />
      <Chapters nav={nav} />

      <div className={"grid" + (isWide && nav.route !== "era" ? " wide" : "")}>
        {body}
      </div>

      <Colophon />

      <Player player={player} />
      <QueueDrawer player={player} />
    </div>
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(<App />);
