/* THE VAULT OPERATOR — extended fixtures */

// ============================== SONGS CATALOG
const SONGS = [
  { slug: "althea",            title: "Althea",              aliases: [],                              count: 272, first: "1979-08-04", last: "1995-07-08", role: "ballad" },
  { slug: "bertha",            title: "Bertha",              aliases: [],                              count: 397, first: "1971-02-18", last: "1995-07-09", role: "opener" },
  { slug: "birdsong",          title: "Bird Song",           aliases: [],                              count: 296, first: "1971-02-19", last: "1995-06-30", role: "jam vehicle" },
  { slug: "boxofrain",         title: "Box of Rain",         aliases: ["Box O' Rain"],                 count: 197, first: "1972-10-09", last: "1995-07-09", role: "closer" },
  { slug: "brokendown-palace", title: "Brokedown Palace",    aliases: ["Brokendown Palace"],           count: 219, first: "1970-08-18", last: "1995-07-09", role: "encore" },
  { slug: "casey-jones",       title: "Casey Jones",         aliases: [],                              count: 318, first: "1969-12-04", last: "1984-10-15", role: "anthem" },
  { slug: "china-cat",         title: "China Cat Sunflower", aliases: ["China Cat"],                   count: 572, first: "1968-01-17", last: "1995-06-25", role: "jam vehicle" },
  { slug: "comes-a-time",      title: "Comes a Time",        aliases: [],                              count: 73,  first: "1971-10-19", last: "1995-06-22", role: "ballad" },
  { slug: "dancing",           title: "Dancing in the Street", aliases: [],                            count: 154, first: "1966-07-16", last: "1987-09-23", role: "anthem" },
  { slug: "dark-star",         title: "Dark Star",           aliases: [],                              count: 232, first: "1967-12-13", last: "1994-03-30", role: "jam vehicle" },
  { slug: "drums",             title: "Drums",               aliases: ["Rhythm Devils"],               count: 1508, first: "1976-06-03", last: "1995-07-09", role: "jam vehicle" },
  { slug: "el-paso",           title: "El Paso",             aliases: [],                              count: 393, first: "1969-12-26", last: "1995-06-30", role: "cover" },
  { slug: "estimated",         title: "Estimated Prophet",   aliases: [],                              count: 391, first: "1977-02-26", last: "1995-07-08", role: "jam vehicle" },
  { slug: "eyes",              title: "Eyes of the World",   aliases: ["Eyes"],                        count: 388, first: "1973-02-09", last: "1995-07-08", role: "jam vehicle" },
  { slug: "fire-mountain",     title: "Fire on the Mountain", aliases: ["Fire"],                       count: 296, first: "1977-03-18", last: "1995-07-08", role: "jam vehicle" },
  { slug: "franklins",         title: "Franklin's Tower",    aliases: ["Franklins"],                   count: 217, first: "1975-06-17", last: "1995-07-02", role: "ballad" },
  { slug: "good-lovin",        title: "Good Lovin'",         aliases: [],                              count: 432, first: "1966-04-22", last: "1995-07-08", role: "anthem" },
  { slug: "hes-gone",          title: "He's Gone",           aliases: [],                              count: 213, first: "1972-04-17", last: "1995-07-08", role: "ballad" },
  { slug: "hell-bucket",       title: "Hell in a Bucket",    aliases: [],                              count: 219, first: "1983-05-13", last: "1995-07-09", role: "opener" },
  { slug: "iko-iko",           title: "Iko Iko",             aliases: [],                              count: 175, first: "1977-05-15", last: "1995-07-08", role: "cover" },
  { slug: "jack-straw",        title: "Jack Straw",          aliases: [],                              count: 477, first: "1971-10-19", last: "1995-07-09", role: "opener" },
  { slug: "lazy-river",        title: "Lazy River Road",     aliases: [],                              count: 32,  first: "1993-02-21", last: "1995-06-25", role: "ballad" },
  { slug: "looks-like-rain",   title: "Looks Like Rain",     aliases: [],                              count: 287, first: "1972-03-05", last: "1995-07-05", role: "ballad" },
  { slug: "loser",             title: "Loser",               aliases: [],                              count: 348, first: "1971-02-18", last: "1995-07-05", role: "ballad" },
  { slug: "me-uncle",          title: "Me and My Uncle",     aliases: [],                              count: 634, first: "1966-11-29", last: "1995-06-30", role: "cover" },
  { slug: "morning-dew",       title: "Morning Dew",         aliases: [],                              count: 287, first: "1967-03-18", last: "1995-07-09", role: "anthem" },
  { slug: "not-fade-away",     title: "Not Fade Away",       aliases: ["NFA"],                         count: 533, first: "1966-12-01", last: "1995-07-08", role: "cover" },
  { slug: "other-one",         title: "The Other One",       aliases: ["Other One"],                   count: 565, first: "1967-10-31", last: "1995-06-22", role: "jam vehicle" },
  { slug: "passenger",         title: "Passenger",           aliases: [],                              count: 87,  first: "1977-04-22", last: "1981-08-31", role: "cover" },
  { slug: "peggy-o",           title: "Peggy-O",             aliases: [],                              count: 265, first: "1973-02-09", last: "1995-06-22", role: "ballad" },
  { slug: "playing-band",      title: "Playing in the Band", aliases: ["Playin'"],                     count: 639, first: "1971-02-18", last: "1995-07-05", role: "jam vehicle" },
  { slug: "promised-land",     title: "Promised Land",       aliases: [],                              count: 432, first: "1971-08-26", last: "1995-07-05", role: "opener" },
  { slug: "row-jimmy",         title: "Row Jimmy",           aliases: [],                              count: 152, first: "1973-02-09", last: "1995-06-19", role: "ballad" },
  { slug: "ripple",            title: "Ripple",              aliases: [],                              count: 41,  first: "1970-08-18", last: "1988-09-23", role: "ballad" },
  { slug: "samson",            title: "Samson and Delilah",  aliases: ["Samson"],                      count: 364, first: "1976-06-03", last: "1995-07-09", role: "opener" },
  { slug: "scarlet",           title: "Scarlet Begonias",    aliases: ["Scarlet"],                     count: 318, first: "1974-03-23", last: "1995-07-08", role: "jam vehicle" },
  { slug: "shakedown",         title: "Shakedown Street",    aliases: [],                              count: 165, first: "1978-08-31", last: "1995-07-02", role: "opener" },
  { slug: "ship-fools",        title: "Ship of Fools",       aliases: [],                              count: 233, first: "1974-02-22", last: "1995-07-05", role: "ballad" },
  { slug: "space",             title: "Space",               aliases: ["Drums/Space"],                 count: 1087, first: "1978-04-19", last: "1995-07-09", role: "jam vehicle" },
  { slug: "st-stephen",        title: "St. Stephen",         aliases: [],                              count: 167, first: "1968-06-14", last: "1983-10-31", role: "anthem" },
  { slug: "sugar-magnolia",    title: "Sugar Magnolia",      aliases: ["Sugar Mag"],                   count: 602, first: "1970-06-07", last: "1995-07-08", role: "closer" },
  { slug: "sugaree",           title: "Sugaree",             aliases: [],                              count: 363, first: "1971-07-31", last: "1995-07-05", role: "ballad" },
  { slug: "tennessee-jed",     title: "Tennessee Jed",       aliases: [],                              count: 437, first: "1971-10-19", last: "1995-07-05", role: "ballad" },
  { slug: "terrapin",          title: "Terrapin Station",    aliases: ["Terrapin"],                    count: 302, first: "1977-02-26", last: "1995-07-02", role: "anthem" },
  { slug: "throwing-stones",   title: "Throwing Stones",     aliases: [],                              count: 268, first: "1982-09-17", last: "1995-07-08", role: "anthem" },
  { slug: "truckin",           title: "Truckin'",            aliases: [],                              count: 524, first: "1970-08-18", last: "1995-07-09", role: "anthem" },
  { slug: "uncle-johns",       title: "Uncle John's Band",   aliases: ["UJB"],                         count: 332, first: "1969-11-08", last: "1995-07-08", role: "anthem" },
  { slug: "us-blues",          title: "U.S. Blues",          aliases: [],                              count: 318, first: "1974-02-22", last: "1995-07-09", role: "encore" },
  { slug: "viola-lee",         title: "Viola Lee Blues",     aliases: ["Viola Lee"],                   count: 86,  first: "1966-11-29", last: "1995-06-19", role: "jam vehicle" },
];

// ============================== SHOWS LIST (sample)
const SHOWS = [
  { date: "1965-12-04", venue: "Big Beat Acid Test",       city: "San Jose, CA",       songs: 18, era: "primal"  },
  { date: "1966-07-16", venue: "Fillmore Auditorium",       city: "San Francisco, CA", songs: 14, era: "primal"  },
  { date: "1967-09-03", venue: "Dance Hall",                city: "Rio Nido, CA",       songs: 12, era: "primal"  },
  { date: "1968-08-24", venue: "Shrine Exposition Hall",    city: "Los Angeles, CA",    songs: 16, era: "primal"  },
  { date: "1969-02-27", venue: "Fillmore West",             city: "San Francisco, CA",  songs: 19, era: "primal"  },
  { date: "1970-05-02", venue: "Harpur College",            city: "Binghamton, NY",     songs: 22, era: "primal"  },
  { date: "1971-04-29", venue: "Fillmore East",             city: "New York, NY",       songs: 24, era: "primal"  },
  { date: "1972-05-03", venue: "Olympia Theatre",           city: "Paris, France",      songs: 18, era: "europe72"},
  { date: "1972-05-26", venue: "Strand Lyceum",             city: "London, England",    songs: 23, era: "europe72"},
  { date: "1973-02-09", venue: "Maples Pavilion",           city: "Stanford, CA",       songs: 21, era: "europe72"},
  { date: "1974-06-23", venue: "Jai-Alai Fronton",          city: "Miami, FL",          songs: 20, era: "europe72"},
  { date: "1976-06-09", venue: "Boston Music Hall",         city: "Boston, MA",         songs: 18, era: "hiatus"  },
  { date: "1977-05-08", venue: "Barton Hall",               city: "Ithaca, NY",         songs: 19, era: "hiatus"  },
  { date: "1977-05-19", venue: "Fox Theatre",               city: "Atlanta, GA",        songs: 18, era: "hiatus", star: true  },
  { date: "1978-04-22", venue: "Spring Tour Civic",         city: "Nassau, NY",         songs: 17, era: "hiatus"  },
  { date: "1979-11-01", venue: "The Spectrum",              city: "Philadelphia, PA",   songs: 18, era: "hiatus"  },
  { date: "1981-03-22", venue: "Rainbow Theatre",           city: "London, England",    songs: 17, era: "brent"   },
  { date: "1983-09-11", venue: "Boise State Pavilion",      city: "Boise, ID",          songs: 18, era: "brent"   },
  { date: "1985-06-30", venue: "Merriweather Post Pavilion",city: "Columbia, MD",       songs: 18, era: "brent"   },
  { date: "1986-07-07", venue: "RFK Stadium",               city: "Washington, DC",     songs: 19, era: "brent"   },
  { date: "1988-04-02", venue: "Brendan Byrne Arena",       city: "East Rutherford, NJ",songs: 18, era: "brent"   },
  { date: "1989-10-09", venue: "Hampton Coliseum",          city: "Hampton, VA",        songs: 19, era: "brent"   },
  { date: "1990-03-29", venue: "Nassau Coliseum",           city: "Uniondale, NY",      songs: 18, era: "brent"   },
  { date: "1991-09-10", venue: "Madison Square Garden",     city: "New York, NY",       songs: 17, era: "final"   },
  { date: "1993-06-26", venue: "Sandstone Amphitheatre",    city: "Bonner Springs, KS", songs: 17, era: "final"   },
  { date: "1994-10-04", venue: "Boston Garden",             city: "Boston, MA",         songs: 16, era: "final"   },
  { date: "1995-07-09", venue: "Soldier Field",             city: "Chicago, IL",        songs: 15, era: "final", star: true },
];

// ============================== VENUES
const VENUES = [
  { name: "Madison Square Garden",     city: "New York",       state: "NY", country: "USA", shows: 52, first: 1979, last: 1994 },
  { name: "Boston Garden",             city: "Boston",         state: "MA", country: "USA", shows: 39, first: 1973, last: 1994 },
  { name: "Henry J. Kaiser Auditorium",city: "Oakland",        state: "CA", country: "USA", shows: 38, first: 1970, last: 1990 },
  { name: "Fillmore East",             city: "New York",       state: "NY", country: "USA", shows: 36, first: 1968, last: 1971 },
  { name: "Hampton Coliseum",          city: "Hampton",        state: "VA", country: "USA", shows: 34, first: 1979, last: 1989 },
  { name: "Nassau Coliseum",           city: "Uniondale",      state: "NY", country: "USA", shows: 33, first: 1973, last: 1994 },
  { name: "The Spectrum",              city: "Philadelphia",   state: "PA", country: "USA", shows: 53, first: 1968, last: 1995 },
  { name: "Greek Theatre",             city: "Berkeley",       state: "CA", country: "USA", shows: 25, first: 1981, last: 1989 },
  { name: "Frost Amphitheatre",        city: "Stanford",       state: "CA", country: "USA", shows: 18, first: 1982, last: 1989 },
  { name: "Cal Expo Amphitheatre",     city: "Sacramento",     state: "CA", country: "USA", shows: 22, first: 1985, last: 1993 },
  { name: "Alpine Valley Music Theatre", city: "East Troy",    state: "WI", country: "USA", shows: 23, first: 1980, last: 1989 },
  { name: "Red Rocks Amphitheatre",    city: "Morrison",       state: "CO", country: "USA", shows: 20, first: 1978, last: 1987 },
  { name: "Winterland Arena",          city: "San Francisco",  state: "CA", country: "USA", shows: 60, first: 1971, last: 1978 },
  { name: "Fillmore Auditorium",       city: "San Francisco",  state: "CA", country: "USA", shows: 51, first: 1965, last: 1970 },
  { name: "Avalon Ballroom",           city: "San Francisco",  state: "CA", country: "USA", shows: 23, first: 1966, last: 1968 },
  { name: "Fox Theatre",               city: "Atlanta",        state: "GA", country: "USA", shows: 6,  first: 1977, last: 1981 },
  { name: "Olympia Theatre",           city: "Paris",          state: "—",  country: "FRA", shows: 4,  first: 1972, last: 1972 },
  { name: "Strand Lyceum",             city: "London",         state: "—",  country: "GBR", shows: 4,  first: 1972, last: 1972 },
  { name: "Wembley Empire Pool",       city: "London",         state: "—",  country: "GBR", shows: 4,  first: 1972, last: 1981 },
  { name: "Rainbow Theatre",           city: "London",         state: "—",  country: "GBR", shows: 3,  first: 1981, last: 1981 },
  { name: "Soldier Field",             city: "Chicago",        state: "IL", country: "USA", shows: 5,  first: 1991, last: 1995 },
  { name: "Giants Stadium",            city: "East Rutherford",state: "NJ", country: "USA", shows: 14, first: 1987, last: 1995 },
  { name: "Brendan Byrne Arena",       city: "East Rutherford",state: "NJ", country: "USA", shows: 29, first: 1985, last: 1994 },
  { name: "Merriweather Post Pavilion",city: "Columbia",       state: "MD", country: "USA", shows: 22, first: 1973, last: 1989 },
  { name: "RFK Stadium",               city: "Washington",     state: "DC", country: "USA", shows: 10, first: 1973, last: 1995 },
];

// ============================== BAND MEMBERS
const MEMBERS = [
  { id: "garcia",      name: "Jerry Garcia",       role: "Lead guitar · vocals",        years: "1965–1995", shows: 2328, core: true, born: 1942, mark: "▲" },
  { id: "weir",        name: "Bob Weir",           role: "Rhythm guitar · vocals",      years: "1965–1995", shows: 2328, core: true, born: 1947, mark: "■" },
  { id: "lesh",        name: "Phil Lesh",          role: "Bass · vocals",               years: "1965–1995", shows: 2328, core: true, born: 1940, mark: "◆" },
  { id: "kreutzmann",  name: "Bill Kreutzmann",    role: "Drums",                       years: "1965–1995", shows: 2328, core: true, born: 1946, mark: "●" },
  { id: "hart",        name: "Mickey Hart",        role: "Drums · percussion",          years: "1967–1995", shows: 2205, core: true, born: 1943, mark: "○" },
  { id: "pigpen",      name: "Ron 'Pigpen' McKernan", role: "Keys · harmonica · vocals", years: "1965–1972", shows: 815,  core: true, born: 1945, died: 1973, mark: "✕" },
  { id: "keith",       name: "Keith Godchaux",     role: "Piano",                       years: "1971–1979", shows: 685,  core: false, born: 1948, died: 1980, mark: "+" },
  { id: "donna",       name: "Donna Jean Godchaux", role: "Vocals",                     years: "1972–1979", shows: 502,  core: false, born: 1947, mark: "*" },
  { id: "brent",       name: "Brent Mydland",      role: "Keys · vocals",               years: "1979–1990", shows: 968,  core: false, born: 1952, died: 1990, mark: "†" },
  { id: "vince",       name: "Vince Welnick",      role: "Keys · vocals",               years: "1990–1995", shows: 290,  core: false, born: 1951, died: 2006, mark: "‡" },
];

// ============================== ERAS
const ERAS_DATA = [
  { id: "primal",   name: "Primal Dead",      tag: "Pigpen Era",       years: "1965–1971", from: 1965, to: 1971, shows: 729, signature: ["Lovelight", "Caution", "Viola Lee Blues"], hue: "rust" },
  { id: "europe72", name: "Europe '72",       tag: "Wall-of-Sound",    years: "1972–1974", from: 1972, to: 1974, shows: 198, signature: ["Dark Star", "Playing", "Eyes"], hue: "forest" },
  { id: "hiatus",   name: "Hiatus & Return",  tag: "Studio Era",       years: "1975–1979", from: 1975, to: 1979, shows: 261, signature: ["Estimated Prophet", "Terrapin", "Scarlet › Fire"], hue: "ledger" },
  { id: "brent",    name: "Brent Years",      tag: "Arena Dead",       years: "1980–1990", from: 1980, to: 1990, shows: 795, signature: ["Throwing Stones", "Hell in a Bucket", "Foolish Heart"], hue: "rust" },
  { id: "final",    name: "Final Tours",      tag: "Vince & Bruce",    years: "1991–1995", from: 1991, to: 1995, shows: 345, signature: ["Lazy River Road", "Days Between", "So Many Roads"], hue: "ink" },
];

// ============================== SHOWS PER YEAR (for stats bar chart)
const SHOWS_PER_YEAR = [
  [1965,  37], [1966,  73], [1967,  88], [1968, 102], [1969, 142], [1970, 149], [1971,  82],
  [1972,  86], [1973,  73], [1974,  39], [1976,  41], [1977,  60], [1978,  81], [1979,  76],
  [1980,  87], [1981,  87], [1982,  68], [1983,  73], [1984,  72], [1985,  72], [1986,  43],
  [1987,  87], [1988,  79], [1989,  72], [1990,  75], [1991,  77], [1992,  56], [1993,  82],
  [1994,  84], [1995,  46],
];

// ============================== DARK STAR POSITION DONUT
const DARK_STAR_POSITIONS = [
  { label: "Mid-set",  count: 162, pct: 70 },
  { label: "Opener",   count: 21,  pct: 9  },
  { label: "Closer",   count: 38,  pct: 16 },
  { label: "Encore",   count: 11,  pct: 5  },
];

// ============================== RECENT PLAY LOG
const RECENT_LOG = [
  { day: "TODAY", date: "May 19, MMXXVI", entries: [
    { time: "16:42", track: "Peggy-O",       show: "1977-05-19 · Fox Theatre · Atlanta",       dur: "7:54" },
    { time: "16:35", track: "Promised Land", show: "1977-05-19 · Fox Theatre · Atlanta",       dur: "4:01" },
    { time: "12:08", track: "Scarlet Begonias", show: "1977-05-08 · Barton Hall · Ithaca",     dur: "9:38" },
    { time: "09:11", track: "Fire on the Mountain", show: "1977-05-08 · Barton Hall · Ithaca", dur: "11:32" },
  ]},
  { day: "YESTERDAY", date: "May 18, MMXXVI", entries: [
    { time: "23:14", track: "Dark Star",       show: "1972-05-26 · Strand Lyceum · London",    dur: "32:18" },
    { time: "21:08", track: "Sugar Magnolia",  show: "1995-07-09 · Soldier Field · Chicago",   dur: "7:24" },
    { time: "20:45", track: "U.S. Blues",      show: "1974-05-19 · Portland Memorial",         dur: "5:38" },
  ]},
  { day: "MAY XVI", date: "Three days past", entries: [
    { time: "19:02", track: "Eyes of the World",  show: "1973-11-11 · Winterland",             dur: "16:22" },
    { time: "18:30", track: "Morning Dew",        show: "1977-05-08 · Barton Hall · Ithaca",   dur: "13:46" },
    { time: "14:18", track: "China Cat Sunflower", show: "1971-04-29 · Fillmore East",         dur: "5:12" },
  ]},
];

// ============================== SCARLET BEGONIAS DETAIL (sample song detail)
const SAMPLE_SONG_DETAIL = {
  slug: "scarlet",
  title: "Scarlet Begonias",
  aliases: ["scarlet begonias", "scarlet begonias (live)", "scarlet"],
  role: "jam vehicle",
  first: { date: "1974-03-23", venue: "Cow Palace",        city: "Daly City, CA",    country: "USA" },
  last:  { date: "1995-07-08", venue: "Soldier Field",     city: "Chicago, IL",      country: "USA" },
  count: 318,
  span: 41,
  opened: 3, closed: 0, encored: 0,
  positions: [
    { label: "Set I",   count: 41, pct: 13 },
    { label: "Set II",  count: 274, pct: 86 },
    { label: "Encore",  count: 3,  pct: 1 },
  ],
  longest: { dur: "13:56", date: "1982-04-03", venue: "Scope Arena, Norfolk" },
  shortest: { dur: "7:31", date: "1991-08-16", venue: "Shoreline Amphitheatre" },
  versions: [
    { date: "1977-05-08", venue: "Barton Hall, Ithaca",         dur: "11:08", note: "the canonical Cornell" },
    { date: "1977-05-19", venue: "Fox Theatre, Atlanta",        dur: "9:38",  note: "this volume's featured" },
    { date: "1978-04-19", venue: "Capital Centre, Landover",    dur: "10:42", note: "" },
    { date: "1982-04-03", venue: "Scope Arena, Norfolk",        dur: "13:56", note: "LONGEST" },
    { date: "1985-06-30", venue: "Merriweather, Columbia",      dur: "10:22", note: "" },
    { date: "1991-08-16", venue: "Shoreline, Mountain View",    dur: "7:31",  note: "SHORTEST" },
    { date: "1993-06-26", venue: "Sandstone, Bonner Springs",   dur: "9:18",  note: "" },
    { date: "1995-07-08", venue: "Soldier Field, Chicago",      dur: "8:54",  note: "final" },
  ],
};

// ============================== MEMBER DETAIL
// signature shows + per-member curated material.
// `eraId` is the "View era" target (their primary era).
const MEMBER_DETAIL = {
  garcia: {
    eraId: "europe72",
    bio: "Jerome John Garcia — guitarist, singer, reluctant figurehead. Wandered in from the Palo Alto folk scene in 1965 with banjo fingers and never put the Stratocaster down. Over thirty years his lead-guitar voice — singing, conversational, halfway to a pedal-steel sigh — defined whatever a Grateful Dead song was. He wrote most of the catalog with Robert Hunter, took the longest solos, and held the band together by drift. He died in his sleep at a rehab clinic on August 9th, 1995, five weeks after the last show.",
    signatureShows: [
      { date: "1977-05-08", venue: "Barton Hall",      city: "Ithaca, NY",     note: "the canonical Cornell · 13-min Morning Dew" },
      { date: "1973-02-09", venue: "Maples Pavilion",  city: "Stanford, CA",   note: "the Stanford Eyes · first outing" },
      { date: "1977-05-19", venue: "Fox Theatre",      city: "Atlanta, GA",    note: "this volume's featured Peggy-O" },
      { date: "1995-07-09", venue: "Soldier Field",    city: "Chicago, IL",    note: "his last show on earth" },
    ],
    debuts: ["Sugaree","Bertha","Loser","Eyes of the World","Scarlet Begonias","Althea","Lazy River Road","Brokedown Palace"],
    signatureSongs: ["Eyes of the World","Sugaree","Althea","Morning Dew","Bird Song","Stella Blue","Terrapin Station","Brokedown Palace"],
  },
  weir: {
    eraId: "brent",
    bio: "Robert Hall Weir — rhythm guitar, occasional lead, the cowboy songs. Joined at 16 after Garcia heard him goof a Jorma part. He turned the rhythm-guitar role on its head: no chord pads, just inverted voicings and counterlines that argued with Garcia all night. The Bobby ballads — Looks Like Rain, Cassidy, Estimated Prophet — anchor the back half of any setlist. He outlasted everybody and is still on the road with Dead & Company.",
    signatureShows: [
      { date: "1972-05-26", venue: "Strand Lyceum",    city: "London, England",  note: "the 32-minute Dark Star bridge" },
      { date: "1977-05-08", venue: "Barton Hall",      city: "Ithaca, NY",       note: "Estimated > Eyes" },
      { date: "1989-10-09", venue: "Hampton Coliseum", city: "Hampton, VA",      note: "the formal Dark Star revival" },
      { date: "1990-03-29", venue: "Nassau Coliseum",  city: "Uniondale, NY",    note: "Help > Slip > Franklin's, definitive" },
    ],
    debuts: ["Estimated Prophet","Jack Straw","Looks Like Rain","Hell in a Bucket","Throwing Stones","Cassidy","Black-Throated Wind"],
    signatureSongs: ["Estimated Prophet","Looks Like Rain","Jack Straw","Cassidy","Sugar Magnolia","Hell in a Bucket","Throwing Stones"],
  },
  lesh: {
    eraId: "europe72",
    bio: "Philip Chapman Lesh — bassist, trained on classical trumpet, no rock experience whatsoever when Garcia handed him a Fender Jazz in 1965. Played bass like a lead instrument, full chordal runs, walking up against Kreutzmann's drums. Wrote Box of Rain about his dying father; that was about all he wrote for the band, but it was enough. After Jerry he ran Phil Lesh & Friends in Marin for two decades.",
    signatureShows: [
      { date: "1974-06-23", venue: "Jai-Alai Fronton",   city: "Miami, FL",        note: "Wall-of-Sound era · low end you can feel" },
      { date: "1972-05-03", venue: "Olympia Theatre",    city: "Paris, France",    note: "Europe '72 · Truckin'" },
      { date: "1973-11-11", venue: "Winterland Arena",   city: "San Francisco, CA", note: "the 16-min Eyes" },
      { date: "1995-07-09", venue: "Soldier Field",      city: "Chicago, IL",      note: "his Box of Rain encore" },
    ],
    debuts: ["Box of Rain","Unbroken Chain","Pride of Cucamonga"],
    signatureSongs: ["Box of Rain","Truckin'","The Other One","Unbroken Chain","Dark Star"],
  },
  kreutzmann: {
    eraId: "europe72",
    bio: "William Kreutzmann Jr. — the band's first drummer, only drummer for the first two years and the back half of the run. A swing-feel jazz player at heart, more Elvin Jones than Keith Moon, which is what let Garcia stretch song forms into thirty-minute conversations. Held the floor through every roster change. Today he plays around Hawai'i with whoever passes through.",
    signatureShows: [
      { date: "1970-05-02", venue: "Harpur College",      city: "Binghamton, NY",   note: "acoustic + electric · classic Bill" },
      { date: "1972-05-26", venue: "Strand Lyceum",       city: "London, England",  note: "Bertha opener · drives the whole set" },
      { date: "1977-05-19", venue: "Fox Theatre",         city: "Atlanta, GA",      note: "Scarlet > Fire pocket" },
      { date: "1991-09-10", venue: "Madison Square Garden", city: "New York, NY",   note: "Bruce Hornsby tour · Bill loose" },
    ],
    debuts: ["Drums","King Solomon's Marbles"],
    signatureSongs: ["Drums","The Other One","Bertha","Playing in the Band","Truckin'"],
  },
  hart: {
    eraId: "brent",
    bio: "Mickey Hart — the second drummer. Sat in on a Halloween in 1967 and stayed twenty-eight years. Brought the band tabla, dumbek, the Beast — a wall of timpani and gongs that became Rhythm Devils. Took a leave from 1971–1974 after his father embezzled the band's money. Wrote a stack of books about percussion as world ritual. Without Mickey there is no Drums > Space.",
    signatureShows: [
      { date: "1968-08-24", venue: "Shrine Exposition Hall", city: "Los Angeles, CA",  note: "first months with the band" },
      { date: "1977-05-08", venue: "Barton Hall",            city: "Ithaca, NY",       note: "Drums > Space, formative" },
      { date: "1985-06-30", venue: "Merriweather Post Pavilion", city: "Columbia, MD", note: "the Beast in full" },
      { date: "1990-03-29", venue: "Nassau Coliseum",        city: "Uniondale, NY",    note: "Rhythm Devils, peak arrangement" },
    ],
    debuts: ["Space","Fire on the Mountain","Samson and Delilah","Iko Iko"],
    signatureSongs: ["Drums","Space","Fire on the Mountain","Samson and Delilah","Iko Iko"],
  },
  pigpen: {
    eraId: "primal",
    bio: "Ron 'Pigpen' McKernan — keys, harmonica, raconteur, the band's blues conscience. Grew up listening to his father's R&B record collection in San Bruno. Sang Lovelight, Caution, Smokestack Lightning until they were sermons. Drank himself into liver failure and died at 27 on March 8th, 1973. The band stopped playing his songs the night he died and never really started again.",
    signatureShows: [
      { date: "1969-02-27", venue: "Fillmore West",   city: "San Francisco, CA", note: "Live/Dead · the document" },
      { date: "1970-05-02", venue: "Harpur College",  city: "Binghamton, NY",    note: "Lovelight in full sermon mode" },
      { date: "1971-04-29", venue: "Fillmore East",   city: "New York, NY",      note: "last great Pig run · NFA > GDTRFB" },
      { date: "1972-05-26", venue: "Strand Lyceum",   city: "London, England",   note: "his last European show" },
    ],
    debuts: ["Lovelight","Caution","Smokestack Lightning","Hard to Handle","Mr. Charlie","Operator"],
    signatureSongs: ["Lovelight","Caution","Hard to Handle","Good Lovin'","Smokestack Lightning","Mr. Charlie"],
  },
  keith: {
    eraId: "hiatus",
    bio: "Keith Godchaux — piano, joined in late 1971 when his wife Donna walked up to Garcia after a show and said her husband should be the next keyboardist. He was. A precise, jazz-leaning player; his fills under Garcia in the '72–'74 stretch are the conversational peak of the band. By 1979 his playing had drifted; he was let go and died in a car crash in 1980.",
    signatureShows: [
      { date: "1972-05-03", venue: "Olympia Theatre",   city: "Paris, France",       note: "Europe '72 · canonical Keith" },
      { date: "1973-02-09", venue: "Maples Pavilion",   city: "Stanford, CA",        note: "first Eyes · piano definitional" },
      { date: "1974-06-23", venue: "Jai-Alai Fronton",  city: "Miami, FL",           note: "Wall-of-Sound, piano fully mic'd" },
      { date: "1977-05-08", venue: "Barton Hall",       city: "Ithaca, NY",          note: "the Scarlet > Fire" },
    ],
    debuts: ["He's Gone","Stella Blue","Eyes of the World","Row Jimmy","Wave That Flag"],
    signatureSongs: ["Eyes of the World","Stella Blue","He's Gone","Row Jimmy","Brown-Eyed Women"],
  },
  donna: {
    eraId: "hiatus",
    bio: "Donna Jean Godchaux — vocals, formerly a Muscle Shoals session singer (her voice is on Suspicious Minds and When a Man Loves a Woman). Eight years on stage with the band; her harmonies on Sunrise, Playing in the Band, Stella Blue. Left with Keith in 1979. Still records and tours in Alabama with the Donna Jean Godchaux Band.",
    signatureShows: [
      { date: "1973-02-09", venue: "Maples Pavilion",   city: "Stanford, CA",     note: "Eyes of the World · first call-and-response" },
      { date: "1974-06-23", venue: "Jai-Alai Fronton",  city: "Miami, FL",        note: "Playing in the Band · soaring" },
      { date: "1977-05-08", venue: "Barton Hall",       city: "Ithaca, NY",       note: "Morning Dew harmony" },
      { date: "1978-04-22", venue: "Spring Tour Civic", city: "Nassau, NY",       note: "Sunrise · her composition" },
    ],
    debuts: ["Sunrise","From the Heart of Me"],
    signatureSongs: ["Sunrise","Playing in the Band","Eyes of the World","Stella Blue","Loose Lucy"],
  },
  brent: {
    eraId: "brent",
    bio: "Brent Mydland — Hammond, Rhodes, lead vocals on his own songs. Eleven years, the longest tenure of any non-original member. A gruff, melodic singer; wrote Hell in a Bucket, Far From Me, Just a Little Light. Struggled with depression and chemistry; died of a speedball overdose on July 26th, 1990, days after his last show. The band never sounded the same without his harmony stack.",
    signatureShows: [
      { date: "1981-03-22", venue: "Rainbow Theatre",         city: "London, England",   note: "early Brent · still learning the book" },
      { date: "1985-06-30", venue: "Merriweather Post Pavilion", city: "Columbia, MD",   note: "peak Brent · the B3 wail" },
      { date: "1989-10-09", venue: "Hampton Coliseum",        city: "Hampton, VA",       note: "Dark Star revival · Brent leads the modulation" },
      { date: "1990-03-29", venue: "Nassau Coliseum",         city: "Uniondale, NY",     note: "his last great run" },
    ],
    debuts: ["Hell in a Bucket","Throwing Stones","Far From Me","Just a Little Light","I Will Take You Home","Blow Away"],
    signatureSongs: ["Hell in a Bucket","Far From Me","Just a Little Light","Throwing Stones","I Will Take You Home"],
  },
  vince: {
    eraId: "final",
    bio: "Vince Welnick — keys, harmonies, former Tubes synth player. Auditioned the week Brent died and was on stage in two weeks. Five years of holding the keys chair through Garcia's decline. Took the band's dissolution hard; left music for years, then took his own life in 2006. The Way You Do is his. He deserved more.",
    signatureShows: [
      { date: "1991-09-10", venue: "Madison Square Garden", city: "New York, NY",      note: "first MSG run · Vince finds the seat" },
      { date: "1993-06-26", venue: "Sandstone Amphitheatre", city: "Bonner Springs, KS", note: "Lazy River Road · the late grace note" },
      { date: "1994-10-04", venue: "Boston Garden",          city: "Boston, MA",        note: "Days Between, gorgeous" },
      { date: "1995-07-09", venue: "Soldier Field",          city: "Chicago, IL",       note: "the last show ever played" },
    ],
    debuts: ["Lazy River Road","Days Between","So Many Roads","Samba in the Rain","Easy Answers"],
    signatureSongs: ["Lazy River Road","Days Between","So Many Roads","Way to Go Home","Samba in the Rain"],
  },
};

// ============================== Synthetic shows for member browse pagination
const _BROWSE_VENUES = [
  ["Winterland Arena",           "San Francisco, CA"],
  ["Fillmore East",              "New York, NY"],
  ["Boston Music Hall",          "Boston, MA"],
  ["Capitol Theatre",            "Passaic, NJ"],
  ["The Spectrum",               "Philadelphia, PA"],
  ["Hampton Coliseum",           "Hampton, VA"],
  ["Madison Square Garden",      "New York, NY"],
  ["Nassau Coliseum",            "Uniondale, NY"],
  ["Red Rocks Amphitheatre",     "Morrison, CO"],
  ["Henry J. Kaiser Auditorium", "Oakland, CA"],
  ["Greek Theatre",              "Berkeley, CA"],
  ["Alpine Valley Music Theatre","East Troy, WI"],
  ["Frost Amphitheatre",         "Stanford, CA"],
  ["Brendan Byrne Arena",        "East Rutherford, NJ"],
  ["Merriweather Post Pavilion", "Columbia, MD"],
  ["Sandstone Amphitheatre",     "Bonner Springs, KS"],
  ["Boise State Pavilion",       "Boise, ID"],
  ["Cal Expo Amphitheatre",      "Sacramento, CA"],
  ["Soldier Field",              "Chicago, IL"],
  ["Giants Stadium",             "East Rutherford, NJ"],
];
function browseShowsForYear(memberId, year, count) {
  // deterministic pseudo-random
  let s = (memberId.charCodeAt(0) * 13 + year * 7) >>> 0;
  const rand = () => { s = (s * 1664525 + 1013904223) >>> 0; return s; };
  const months = [1,2,3,4,5,6,7,8,9,10,11,12];
  const cap = Math.min(count, 14);
  const out = [];
  const used = new Set();
  while (out.length < cap) {
    const m = months[rand() % months.length];
    const d = (rand() % 27) + 1;
    const key = m * 100 + d;
    if (used.has(key)) continue;
    used.add(key);
    const [v, c] = _BROWSE_VENUES[rand() % _BROWSE_VENUES.length];
    out.push({
      date: `${year}-${String(m).padStart(2,"0")}-${String(d).padStart(2,"0")}`,
      venue: v, city: c,
      songs: 15 + (rand() % 11),
    });
  }
  out.sort((a, b) => a.date.localeCompare(b.date));
  return out;
}

// ============================== STATS KPIs
const STATS_KPI = [
  { label: "Total Shows",  value: "2,333",  annot: "1965–1995, indexed by hand" },
  { label: "Unique Songs", value: "442",    annot: "of the band's catalog" },
  { label: "Hours of Tape", value: "6,299", annot: "est. 2.7h average" },
  { label: "Peak Year",    value: "1970",   annot: "149 shows · most ever" },
  { label: "Avg. Jam",     value: "9:42",   annot: "across all 'jam vehicles'" },
];

Object.assign(window, {
  SONGS, SHOWS, VENUES, MEMBERS, ERAS_DATA, SHOWS_PER_YEAR, DARK_STAR_POSITIONS,
  RECENT_LOG, SAMPLE_SONG_DETAIL, STATS_KPI, MEMBER_DETAIL, browseShowsForYear,
  // re-export from data.jsx (already on window from previous file)
  FEATURED_SHOW: window.FEATURED_SHOW, CATALOG: window.CATALOG, PINNED: window.PINNED,
  STATS: window.STATS, MOST_PLAYED: window.MOST_PLAYED, ALSO_ON_THIS_DAY: window.ALSO_ON_THIS_DAY,
});
