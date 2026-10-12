/* THE VAULT OPERATOR — fixtures */

// Featured show: real 1977-05-19 Fox Theatre setlist
const FEATURED_SHOW = {
  date: "1977-05-19",
  weekday: "Thursday",
  monthName: "May",
  day: 19,
  dayRoman: "19",
  year: 1977,
  yearsAgo: 49,
  venue: "Fox Theatre",
  city: "Atlanta",
  state: "Georgia",
  country: "United States",
  tour: "Spring '77 Tour",
  era: "From the Mars Hotel · Terrapin Station era",
  tape: "AUD · Betty Cantor-Jackson · soundboard",
  sets: [
    {
      label: "Set I",
      roman: "I",
      tracks: [
        { id: "t1",  title: "Promised Land",       dur: "4:01", debut: false, note: "show opener · 38th time" },
        { id: "t2",  title: "Sugaree",             dur: "7:42", note: "first ‘77 outing" },
        { id: "t3",  title: "El Paso",             dur: "4:14" },
        { id: "t4",  title: "Peggy-O",             dur: "7:54", note: "Garcia phrasing — note the bend at 5:12" },
        { id: "t5",  title: "Looks Like Rain",     dur: "8:01", note: "Bob, with feeling" },
        { id: "t6",  title: "Row Jimmy",           dur: "9:51" },
        { id: "t7",  title: "Passenger",           dur: "4:33", note: "new song · debut Apr 22 '77" },
        { id: "t8",  title: "Loser",               dur: "6:24" },
        { id: "t9",  title: "Dancing in the Street", dur: "12:27", note: "set-closer · disco-era arrangement" },
      ]
    },
    {
      label: "Set II",
      roman: "II",
      tracks: [
        { id: "t10", title: "Scarlet Begonias",    dur: "9:38", segue: ">",  note: "Scarlet › Fire pairing solidified this tour" },
        { id: "t11", title: "Fire on the Mountain", dur: "11:32" },
        { id: "t12", title: "Estimated Prophet",   dur: "9:18", note: "new — 7/4 groove" },
        { id: "t13", title: "He's Gone",           dur: "12:46", segue: ">" },
        { id: "t14", title: "Drums",               dur: "4:22", segue: ">" },
        { id: "t15", title: "Not Fade Away",       dur: "8:08", segue: ">" },
        { id: "t16", title: "Comes a Time",        dur: "10:33", segue: ">" },
        { id: "t17", title: "Sugar Magnolia",      dur: "7:24", note: "set-closer · into Sunshine Daydream" },
      ]
    },
    {
      label: "Encore",
      roman: "E.",
      tracks: [
        { id: "t18", title: "U.S. Blues",          dur: "5:38", note: "single encore · ovation 47s" },
      ]
    }
  ]
};

// Catalog index (left column nav)
const CATALOG = [
  { id: "home",    num: "I",    label: "Home",         badge: null },
  { id: "search",  num: "II",   label: "Search",       badge: "⌘K" },
  { id: "recent",  num: "III",  label: "Recent",       badge: "12" },
  { id: "members", num: "IV",   label: "Band Members", badge: null },
  { id: "venues",  num: "V",    label: "Venues",       badge: "382" },
  { id: "eras",    num: "VI",   label: "Eras",         badge: null },
  { id: "stats",   num: "VII",  label: "Stats",        badge: null },
  { id: "export",  num: "VIII", label: "Export",       badge: null },
];

const PINNED = [
  { title: "Dark Star",       plays: 232 },
  { title: "St. Stephen",     plays: 167 },
  { title: "Scarlet › Fire",  plays: 318 },
  { title: "Eyes of the World", plays: 388 },
  { title: "Morning Dew",     plays: 287 },
];

const STATS = [
  { label: "Shows Indexed",  annot: "from setlist.fm",    value: "2,333",  color: "" },
  { label: "Unique Songs",   annot: "GD catalog",         value: "442",    color: "" },
  { label: "Hours Archived", annot: "est. 2.7 hr/show",   value: "6,299",  color: "rust" },
  { label: "Last Refresh",   annot: "auto-refresh daily", value: "1h ago", color: "forest" },
];

const MOST_PLAYED = [
  { rank: "01", title: "Drums",             plays: 1508, pct: 100 },
  { rank: "02", title: "Space",             plays: 1087, pct: 72 },
  { rank: "03", title: "Playing in the Band", plays: 639, pct: 42 },
  { rank: "04", title: "Me and My Uncle",   plays: 634,  pct: 42 },
  { rank: "05", title: "Sugar Magnolia",    plays: 602,  pct: 40 },
  { rank: "06", title: "China Cat Sunflower", plays: 572, pct: 38 },
  { rank: "07", title: "The Other One",     plays: 565,  pct: 37 },
];

const ALSO_ON_THIS_DAY = [
  { year: 1965, venue: "Magoo's Pizza Parlor",     city: "Menlo Park, CA"   },
  { year: 1966, venue: "Avalon Ballroom",          city: "San Francisco, CA"},
  { year: 1974, venue: "Portland Memorial Coliseum", city: "Portland, OR"   },
  { year: 1977, venue: "Fox Theatre ★",            city: "Atlanta, GA"      },
  { year: 1992, venue: "Cal Expo Amphitheatre",    city: "Sacramento, CA"   },
  { year: 1995, venue: "Sam Boyd Stadium",         city: "Las Vegas, NV"    },
];

const TOTAL_TRACKS = FEATURED_SHOW.sets.reduce((n, s) => n + s.tracks.length, 0);
const TOTAL_SECONDS = FEATURED_SHOW.sets.reduce((n, s) =>
  n + s.tracks.reduce((m, t) => m + parseDur(t.dur), 0), 0);

function parseDur(d) { const [m, s] = d.split(":").map(Number); return m * 60 + s; }
function fmtDur(sec) {
  sec = Math.max(0, Math.round(sec));
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  const s = sec % 60;
  if (h > 0) return `${h}:${String(m).padStart(2,"0")}:${String(s).padStart(2,"0")}`;
  return `${m}:${String(s).padStart(2,"0")}`;
}

// Flat list of all tracks for queue construction
const ALL_TRACKS = FEATURED_SHOW.sets.flatMap(set =>
  set.tracks.map(t => ({ ...t, setLabel: set.label, showDate: FEATURED_SHOW.date, venue: FEATURED_SHOW.venue }))
);

Object.assign(window, {
  FEATURED_SHOW, CATALOG, PINNED, STATS, MOST_PLAYED, ALSO_ON_THIS_DAY,
  ALL_TRACKS, TOTAL_TRACKS, TOTAL_SECONDS, parseDur, fmtDur
});
