/* THE VAULT OPERATOR — Mobile screens */

const TABS = [
  { id: "deck",   num: "I",   label: "Deck"   },
  { id: "songs",  num: "III", label: "Songs"  },
  { id: "stats",  num: "VIII",label: "Stats"  },
  { id: "search", num: "II",  label: "Search" },
];

function MvMast({ left, right }) {
  return (
    <div className="mv-mast">
      <div className="pub">
        <span className="left">{left || "Tue 19 May MMXXVI"}</span>
        <span className="right">{right || "cached · 24h"}</span>
      </div>
      <h1>Steal<span className="amp">your</span>Stats</h1>
      <div className="sub">
        The <span className="bl">Dead</span> Archive ·{" "}
        <i>by hand, through the deck</i>
      </div>
    </div>
  );
}

function MvChapter({ num, label, page }) {
  return (
    <div className="mv-chapter">
      <span><span className="num">{num}.</span>&nbsp;&nbsp;{label}</span>
      <span className="pg">{page}</span>
    </div>
  );
}

function MvTabs({ active }) {
  return (
    <div className="mv-tabs">
      {TABS.map(t => (
        <button key={t.id} className={"mv-tab" + (t.id === active ? " active" : "")}>
          <span className="num">{t.num}.</span>
          <span className="lab">{t.label}</span>
        </button>
      ))}
    </div>
  );
}

function MvMini() {
  return (
    <div className="mv-mini">
      <div className="stamp"></div>
      <div className="meta">
        <div className="title">Scarlet → Fire</div>
        <div className="sub">1977 · Cornell · Side B</div>
      </div>
      <div className="next">▶▶</div>
      <button className="pp">❚❚</button>
      <div className="hair"></div>
    </div>
  );
}

function MvDivider() {
  return <div className="mv-divider"><span className="glyph">❦</span></div>;
}

// ============================================================ SCREEN 1 — DECK
function HeroReel() {
  return (
    <div className="mv-deck-hero">
      <div className="mv-reel">
        <div className="spokes">
          <span style={{ transform: "translate(-50%, 0) rotate(0deg)" }}></span>
          <span style={{ transform: "translate(-50%, 0) rotate(60deg)" }}></span>
          <span style={{ transform: "translate(-50%, 0) rotate(120deg)" }}></span>
        </div>
        <div className="hub">A&nbsp;·&nbsp;01</div>
      </div>
      <div className="mv-now-title">
        Scarlet Begonias <span style={{color:"var(--rust)",fontStyle:"italic",fontSize:"22px",fontFamily:"var(--serif-body)"}}>→</span> Fire on the Mountain
      </div>
      <div className="mv-now-sub">
        05·08·1977 · Cornell, Barton Hall <span className="reel-tag">REEL TO REEL</span>
      </div>
    </div>
  );
}

function HeroInlay() {
  return (
    <div className="mv-hero-inlay-wrap">
      <div className="mv-hero-inlay">
        <div className="label">SBD · Side B · Reel 02 of 04</div>
        <div className="title">
          Scarlet Begonias <span className="arrow">→</span> Fire on the Mountain
        </div>
        <div className="ven">Cornell U · Barton Hall · 8 May 1977</div>
        <div className="barcode-cap">
          <span>SYS · 77·05·08</span>
          <span>21:47</span>
        </div>
        <div className="barcode">
          {/* hand-tuned variable-width "barcode" */}
          {[3,1,2,4,1,2,1,3,2,1,4,1,2,3,1,2,1,3,4,2,1,2,1,3,1,4,1,2,3,1,2,4]
            .map((w, i) => <span key={i} style={{flex: w}}></span>)}
        </div>
        <div className="stamp">REEL<br/>TO<br/>REEL</div>
      </div>
    </div>
  );
}

function HeroGrid() {
  return (
    <div className="mv-hero-grid">
      <div className="now">
        <div className="mini-reel"></div>
        <div className="meta-w">
          <div className="title">Scarlet <span className="arrow">→</span> Fire</div>
          <div className="sub">05·08·77 · Cornell · 21:47</div>
        </div>
        <button className="play">❚❚</button>
      </div>
      <div className="label-strip">
        <span className="head">From the same reel</span>
        <span>4 of 14 ›</span>
      </div>
      <div className="cards">
        <div className="card">
          <div className="corner"></div>
          <div className="date">05·08·77</div>
          <div className="title">Estimated Prophet</div>
          <div className="ven">Cornell, Set II · 1</div>
        </div>
        <div className="card">
          <div className="corner"></div>
          <div className="date">05·08·77</div>
          <div className="title">Good Lovin'</div>
          <div className="ven">Cornell, Set II · 3</div>
        </div>
        <div className="card">
          <div className="corner"></div>
          <div className="date">05·08·77</div>
          <div className="title">Drums <span style={{color:"var(--rust)",fontStyle:"italic"}}>→</span> Space</div>
          <div className="ven">Cornell, Set II · 4</div>
        </div>
        <div className="card">
          <div className="corner"></div>
          <div className="date">05·08·77</div>
          <div className="title">Not Fade Away</div>
          <div className="ven">Cornell, Set II · 5</div>
          <span className="star">✦</span>
        </div>
      </div>
    </div>
  );
}

function DeckScreen({ heroStyle = "reel" }) {
  let hero;
  if (heroStyle === "inlay") hero = <HeroInlay />;
  else if (heroStyle === "grid") hero = <HeroGrid />;
  else hero = <HeroReel />;

  return (
    <div className="mv">
      <div className="mv-scroll no-mini">
        <MvMast />
        <MvChapter num="I" label="The Deck · Now Playing" page="0001" />

        {hero}

        <div className="mv-transport">
          <div className="mv-progress">
            <span className="t">8:14</span>
            <div className="mv-bar">
              <div className="rule"></div>
              <div className="ticks">{Array.from({length:11}).map((_,i)=><span key={i}/>)}</div>
              <div className="fill"></div>
              <div className="needle"></div>
            </div>
            <span className="t right">21:47</span>
          </div>
          <div className="mv-ctrls">
            <button className="mv-iconbtn ghost">◀◀</button>
            <button className="mv-iconbtn ghost">−10</button>
            <button className="mv-iconbtn play">❚❚</button>
            <button className="mv-iconbtn ghost">+10</button>
            <button className="mv-iconbtn ghost">▶▶</button>
          </div>
        </div>

        <div className="mv-status">
          <span><span className="lit"><span className="dot"></span>playing entire show</span> · 14 tracks</span>
          <span>1:42:08 left</span>
        </div>

        <div className="mv-setlist">
          <div className="mv-set-head">
            <span className="name">Set II</span>
            <span className="meta">7 tracks · 58:14</span>
          </div>

          <div className="mv-track">
            <span className="n">01</span>
            <span className="title">Estimated Prophet</span>
            <span className="dur">9:32</span>
            <span className="pin">+</span>
          </div>
          <div className="mv-track current">
            <span className="n">02</span>
            <span className="title">Scarlet Begonias <span className="arrow">→</span> Fire on the Mountain</span>
            <span className="dur">21:47</span>
            <span className="pin">❡</span>
          </div>
          <div className="mv-track">
            <span className="n">03</span>
            <span className="title">Good Lovin'</span>
            <span className="dur">8:04</span>
            <span className="pin">+</span>
          </div>
          <div className="mv-track">
            <span className="n">04</span>
            <span className="title">Drums <span className="arrow">→</span> Space</span>
            <span className="dur">14:11</span>
            <span className="pin">+</span>
          </div>
          <div className="mv-track">
            <span className="n">05</span>
            <span className="title">Not Fade Away</span>
            <span className="dur">7:18</span>
            <span className="pin">+</span>
          </div>

          <div className="mv-note">
            Believed by many — including the operator — to be the single finest tape in the vault. Listen on the Maxwell, not the Sony.
          </div>
        </div>
      </div>

      <MvTabs active="deck" />
    </div>
  );
}

// ============================================================ SCREEN 2 — SONGS
function SongsScreen() {
  const groupA = [
    { t: "Alabama Getaway", p: 78 },
    { t: "Althea", p: 274 },
    { t: "And It Stoned Me", p: 4 },
    { t: "Around and Around", p: 416 },
    { t: "Attics of My Life", p: 27 },
  ];
  const groupB = [
    { t: "Beat It On Down the Line", p: 332 },
    { t: "Bertha", p: 391 },
    { t: "Big Boss Man", p: 81 },
    { t: "Big River", p: 397 },
    { t: "Black Peter", p: 197 },
    { t: "Black-Throated Wind", p: 89 },
    { t: "Box of Rain", p: 153 },
    { t: "Brokedown Palace", p: 218 },
    { t: "Brown-Eyed Women", p: 348 },
  ];

  return (
    <div className="mv">
      <div className="mv-scroll">
        <MvChapter num="III" label="Songs · Catalog" page="442" />
        <div className="mv-search">
          <span>⌕</span>
          <input placeholder="Search songs, lyrics, dates…" defaultValue="" />
          <span className="kbd">442</span>
        </div>

        <div className="mv-alpha-head">
          <span className="letter">A</span>
          <span className="count">5 entries · Alabama → Attics</span>
        </div>
        {groupA.map(s => (
          <div className="mv-song-row" key={s.t}>
            <span className="title">{s.t}</span>
            <span className="plays">{s.p}×</span>
            <span className="chev">›</span>
          </div>
        ))}

        <div className="mv-alpha-head">
          <span className="letter">B</span>
          <span className="count">9 entries · Beat → Brown-Eyed</span>
        </div>
        {groupB.map(s => (
          <div className="mv-song-row" key={s.t}>
            <span className="title">{s.t}</span>
            <span className="plays">{s.p}×</span>
            <span className="chev">›</span>
          </div>
        ))}

        <div className="mv-alpha-head">
          <span className="letter">C</span>
          <span className="count">4 entries · Candy → Crazy</span>
        </div>
        <div className="mv-song-row">
          <span className="title">Candyman</span>
          <span className="plays">271×</span>
          <span className="chev">›</span>
        </div>
        <div className="mv-song-row">
          <span className="title">Casey Jones</span>
          <span className="plays">315×</span>
          <span className="chev">›</span>
        </div>
      </div>

      {/* alpha rail */}
      <div className="mv-alpha-rail">
        {"ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("").map((c, i) => (
          <span key={c} className={i === 0 ? "on" : ""}>{c}</span>
        ))}
      </div>

      <MvMini />
      <MvTabs active="songs" />
    </div>
  );
}

// ============================================================ SCREEN 3 — SONG DETAIL
function SongDetailScreen() {
  return (
    <div className="mv">
      <div className="mv-scroll">
        <MvChapter num="III·a" label="Songs › Detail" page="0214 / 2333" />

        <div className="mv-song-hero">
          <div className="kicker">Catalog № 0214 · An original</div>
          <h2>Scarlet Begonias</h2>
          <div className="byline">
            Composed by <strong>Garcia / Hunter</strong>, 1974.
            <br/>First performed at <strong>Cow Palace, Daly City</strong> on 23 Mar 1974.
          </div>
        </div>

        <div className="mv-kpi-row">
          <div className="mv-kpi">
            <div className="lab">Times Played</div>
            <div className="val">318</div>
          </div>
          <div className="mv-kpi">
            <div className="lab">First</div>
            <div className="val" style={{fontSize:"18px"}}>03·1974</div>
          </div>
          <div className="mv-kpi">
            <div className="lab">Last</div>
            <div className="val" style={{fontSize:"18px"}}>07·1995</div>
          </div>
        </div>

        <div className="mv-extremes">
          <div className="mv-extreme">
            <div className="lab">Shortest</div>
            <div className="dur">6:12</div>
            <div className="when">10·1974 · Winterland</div>
          </div>
          <div className="mv-extreme">
            <div className="lab">Longest</div>
            <div className="dur">14:08</div>
            <div className="when">05·1977 · Barton Hall</div>
          </div>
        </div>

        <div className="mv-sec">
          <span className="name">Recent versions</span>
          <span className="more">of 318 ›</span>
        </div>
        <div className="mv-version">
          <span className="date">07·09·1995</span>
          <span className="ven">Soldier Field <span className="city">Chicago, IL</span></span>
          <span className="dur">11:24</span>
        </div>
        <div className="mv-version">
          <span className="date">06·22·1995</span>
          <span className="ven">Knickerbocker Arena <span className="city">Albany, NY</span></span>
          <span className="dur">10:51</span>
        </div>
        <div className="mv-version">
          <span className="date">03·17·1995</span>
          <span className="ven">The Spectrum <span className="city">Philadelphia, PA</span></span>
          <span className="dur">9:48</span>
        </div>
        <div className="mv-version">
          <span className="date">12·31·1994</span>
          <span className="ven">Oakland Coliseum <span className="city">Oakland, CA</span></span>
          <span className="dur">12:02</span>
        </div>

        <div style={{padding:"0 18px"}}>
          <div className="mv-note">
            The 5·8·77 Cornell pairing with Fire on the Mountain is the canonical version — though purists will direct you to the 5·9·77 Buffalo segue, which the operator considers a near-tie.
          </div>
        </div>

        <MvDivider />
      </div>

      <MvMini />
      <MvTabs active="songs" />
    </div>
  );
}

// ============================================================ SCREEN 4 — STATS
function StatsScreen() {
  // simple donut SVG
  const eras = [
    { nm: "Pigpen Era",     yr: "'65 – '72", pct: 24, c: "var(--rust)" },
    { nm: "Keith & Donna",  yr: "'72 – '79", pct: 22, c: "var(--forest)" },
    { nm: "Brent Years",    yr: "'79 – '90", pct: 31, c: "var(--ledger-blue)" },
    { nm: "Final Chapter",  yr: "'90 – '95", pct: 14, c: "var(--ink-2)" },
    { nm: "Reunions / etc", yr: "'95 –",     pct: 9,  c: "var(--ink-4)" },
  ];
  // donut math
  const R = 46;
  const C = 2 * Math.PI * R;
  let acc = 0;
  const arcs = eras.map(e => {
    const len = (e.pct / 100) * C;
    const dashoff = -acc;
    acc += len;
    return { len, dashoff, c: e.c };
  });

  return (
    <div className="mv">
      <div className="mv-scroll">
        <MvChapter num="VIII" label="Stats · Almanac" page="1842 / 2333" />

        <div className="mv-bigfig">
          <div className="num">2,318</div>
          <div className="lab">documented shows between <strong>1965</strong> and <strong>1995</strong></div>
        </div>

        <div className="mv-kpi-quad">
          <div className="cell">
            <div className="lab">Unique songs</div>
            <div className="val">442</div>
            <div className="foot">of which 218 are originals</div>
          </div>
          <div className="cell">
            <div className="lab">Total performances</div>
            <div className="val">41,807</div>
            <div className="foot">across thirty years</div>
          </div>
          <div className="cell">
            <div className="lab">Hours on tape</div>
            <div className="val">6,422</div>
            <div className="foot">≈ 267 days</div>
          </div>
          <div className="cell">
            <div className="lab">Venues</div>
            <div className="val">382</div>
            <div className="foot">in 31 countries</div>
          </div>
        </div>

        <div className="mv-sec">
          <span className="name">Most-played, all-time</span>
          <span className="more">view top 50 ›</span>
        </div>
        <div className="mv-ledger">
          {[
            { r: "I",   t: "Sugar Magnolia",       n: 596 },
            { r: "II",  t: "Truckin'",             n: 532 },
            { r: "III", t: "Me & My Uncle",        n: 514 },
            { r: "IV",  t: "Playing in the Band",  n: 484 },
            { r: "V",   t: "Casey Jones",          n: 315 },
            { r: "VI",  t: "Scarlet Begonias",     n: 318 },
            { r: "VII", t: "Bertha",               n: 391 },
            { r: "VIII",t: "China Cat Sunflower",  n: 561 },
          ].map((row, i) => {
            const w = Math.round((row.n / 596) * 100);
            return (
              <div className="row" key={row.t} style={{"--w": w + "%"}}>
                <span className="rank">{row.r}</span>
                <span className="name">{row.t}</span>
                <span className="num">{row.n}×</span>
                <div className="bar"></div>
              </div>
            );
          })}
        </div>

        <div className="mv-era-block">
          <div className="mv-sec" style={{borderTop:"3px solid var(--ink)", padding:"4px 0 6px", margin:"0 0 12px"}}>
            <span className="name">Era distribution</span>
            <span className="more">5 chapters ›</span>
          </div>
          <div className="mv-era-donut">
            <svg viewBox="-60 -60 120 120" width="120" height="120" style={{transform:"rotate(-90deg)"}}>
              <circle r={R} cx="0" cy="0" fill="none" stroke="var(--paper-3)" strokeWidth="14"/>
              {arcs.map((a, i) => (
                <circle key={i} r={R} cx="0" cy="0" fill="none"
                  stroke={a.c} strokeWidth="14"
                  strokeDasharray={`${a.len} ${C - a.len}`}
                  strokeDashoffset={a.dashoff} />
              ))}
              <circle r={R - 14} cx="0" cy="0" fill="none" stroke="var(--ink-2)" strokeWidth="0.5" opacity="0.4"/>
            </svg>
            <div className="mv-era-legend">
              {eras.map(e => (
                <div className="row" key={e.nm}>
                  <span className="swatch" style={{background: e.c}}></span>
                  <span className="nm">{e.nm}<span className="yr">{e.yr}</span></span>
                  <span className="pct">{e.pct}%</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <MvDivider />
      </div>

      <MvMini />
      <MvTabs active="stats" />
    </div>
  );
}

Object.assign(window, { DeckScreen, SongsScreen, SongDetailScreen, StatsScreen });
