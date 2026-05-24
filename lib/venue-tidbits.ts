interface VenueTidbit {
  venueMatch: string[]
  city?: string[]
  text: string
}

const TIDBITS: VenueTidbit[] = [
  {
    venueMatch: ['fillmore auditorium'],
    text: 'Bill Graham launched his entire concert empire here in 1966, with the Dead as one of his first regular bookings at $2.50 a ticket.',
  },
  {
    venueMatch: ['carousel ballroom', 'fillmore west'],
    text: 'The Dead briefly co-owned this venue as part of a rock-and-roll collective in 1968 before handing the keys to Bill Graham, who renamed it.',
  },
  {
    venueMatch: ['avalon ballroom'],
    text: "The Fillmore's psychedelic rival, run by Chet Helms — the same guy who'd bankrolled Janis Joplin's bus ticket from Texas to San Francisco.",
  },
  {
    venueMatch: ['winterland'],
    text: 'The Dead played their final show here on New Year\'s Eve 1978 in front of a national FM radio broadcast, ending 13 years of Winterland shows.',
  },
  {
    venueMatch: ['cow palace'],
    text: "Built in 1941 and intended partly for livestock shows, it's one of the few arenas where the smell of the venue itself may have actually complemented the Dead's vibe.",
  },
  {
    venueMatch: ['warfield'],
    text: 'The 20-show acoustic/electric run here in September–October 1980 produced two live albums — Reckoning and Dead Set — simultaneously.',
  },
  {
    venueMatch: ['greek theater', 'greek theatre'],
    city: ['berkeley'],
    text: 'The Dead returned here every summer for years; it sits just a few blocks from Berkeley High School, where Phil Lesh studied music as a teenager.',
  },
  {
    venueMatch: ['berkeley community theater', 'berkeley community theatre'],
    text: 'Housed inside Berkeley High School, this was the site of 22 Dead shows, including 13 benefit concerts for the Rex Foundation in the 1980s.',
  },
  {
    venueMatch: ['oakland coliseum', 'oakland arena'],
    text: 'Their single most-played indoor venue at 66 shows, and the site of their final Bay Area concert on February 26, 1995.',
  },
  {
    venueMatch: ['henry j. kaiser', 'henry kaiser', 'oakland auditorium', 'kaiser auditorium'],
    text: "With 58 shows, this Beaux-Arts civic hall hosted some of the Dead's most beloved New Year's Eve runs throughout the late 1970s and early 80s.",
  },
  {
    venueMatch: ['shoreline amphitheatre', 'shoreline amphitheater'],
    text: 'Built on top of a landfill on the shores of San Francisco Bay, it became a multi-night Dead institution from the moment it opened in 1986.',
  },
  {
    venueMatch: ['frost amphitheatre', 'frost amphitheater'],
    text: 'This small Romanesque outdoor bowl on the Stanford campus became a beloved Dead stop starting in 1987, despite a capacity of only around 7,000.',
  },
  {
    venueMatch: ['hollywood bowl'],
    text: "The world's largest natural outdoor amphitheater, with the iconic band shell that the Dead played against — but they only played here a handful of times.",
  },
  {
    venueMatch: ['the forum', 'great western forum'],
    city: ['inglewood', 'los angeles'],
    text: "Home of the Lakers, this is where the Dead played when their LA following grew too massive for theater-sized venues.",
  },
  {
    venueMatch: ['irvine meadows'],
    text: 'A warm-weather hillside venue in Orange County that the Dead played almost every summer tour in the 1980s, often drawing Deadheads from across Southern California and Mexico.',
  },
  {
    venueMatch: ['cal expo', 'california exposition'],
    text: 'Built as part of the California state fairgrounds, the Dead played 25 shows here including multi-night summer runs from 1984 through 1994.',
  },
  {
    venueMatch: ['fillmore east'],
    text: "Bill Graham's East Coast twin to the Fillmore West, and the venue where Jimi Hendrix recorded Band of Gypsys on New Year's Eve 1969/70, just months before the Dead made it their own.",
  },
  {
    venueMatch: ['madison square garden'],
    text: 'The Dead played 52 shows here, grossing over a million dollars in ticket sales at MSG alone in 1977 — extraordinary for that era.',
  },
  {
    venueMatch: ['barton hall'],
    text: 'The May 8, 1977 show here was so significant it was inducted into the Library of Congress National Recording Registry and is widely considered one of the greatest rock concerts ever captured on tape.',
  },
  {
    venueMatch: ['capitol theatre', 'capitol theater'],
    city: ['port chester'],
    text: 'The Dead played a legendary 15-show run here in the early 1970s; the venue was shuttered for decades, then lovingly restored and reopened in 2012.',
  },
  {
    venueMatch: ['nassau coliseum'],
    text: "A no-frills suburban Long Island arena that the Dead played 42 times, beloved by NY-area Deadheads who couldn't always score Manhattan tickets.",
  },
  {
    venueMatch: ['watkins glen'],
    text: 'The 1973 Summer Jam here drew an estimated 600,000 people — more than twice Woodstock\'s attendance — making it one of the largest concerts in American history.',
  },
  {
    venueMatch: ['raceway park', 'englishtown'],
    text: "The Dead's September 3, 1977 show at this drag strip drew over 100,000 fans and was eventually released as Dick's Picks Vol. 15.",
  },
  {
    venueMatch: ['giants stadium'],
    text: 'The Dead co-headlined here with Bob Dylan in 1987 as part of the "Dylan & the Dead" tour, a pairing that produced one of the most divisive live albums in either artist\'s catalog.',
  },
  {
    venueMatch: ['the spectrum'],
    city: ['philadelphia'],
    text: "The Dead's second-most played arena at 53 shows, and a venue where ticket sales alone topped $1 million in 1977.",
  },
  {
    venueMatch: ['capitol centre', 'capital centre', 'capitol center', 'capital center'],
    city: ['landover'],
    text: 'The Dead played 29 shows here, including what many historians consider among the finest performances of their 1974 "Wall of Sound" era.',
  },
  {
    venueMatch: ['merriweather'],
    text: 'Named after cereal heiress Marjorie Merriweather Post, this wooded outdoor pavilion was a perennial summer stop midway between DC and Baltimore.',
  },
  {
    venueMatch: ['rfk stadium', 'rfk'],
    text: 'An aging football stadium that the Dead transformed into a festival ground in the late 1980s, with stadium tours becoming one of their primary revenue engines.',
  },
  {
    venueMatch: ['boston garden'],
    text: 'The legendarily uncomfortable arena — bad sightlines, worse acoustics — hosted 24 Dead shows including what some fans call the "last great show" on October 1, 1994.',
  },
  {
    venueMatch: ['hartford civic center'],
    text: "A primary stop on nearly every East Coast tour, and the city where the Dead performed some of their most celebrated 1970s multi-night runs.",
  },
  {
    venueMatch: ['providence civic center'],
    text: 'Just 45 minutes from Boston, the Dead played 19 shows here, and fans routinely attended consecutive nights in both cities.',
  },
  {
    venueMatch: ['cape cod coliseum'],
    text: "A tiny 4,000-seat arena on Cape Cod where the Dead played intimate October 1979 shows that are legendary among collectors for their warm, loose vibe.",
  },
  {
    venueMatch: ['cumberland county civic center'],
    text: 'The northernmost arena on the regular Dead touring circuit, a consistent stop during their fall New England runs throughout the 1970s and 1980s.',
  },
  {
    venueMatch: ['hampton coliseum'],
    text: 'Nicknamed "the Spaceship" by Deadheads for its flying-saucer architecture, and the site of the secret "Warlocks" shows in October 1989, where the Dead debuted material they hadn\'t touched in years.',
  },
  {
    venueMatch: ['the omni', 'omni coliseum'],
    city: ['atlanta'],
    text: 'Before it housed Dead shows, this arena was primarily known as the home turf of Ric Flair, Dusty Rhodes, and the NWA wrestling circuit.',
  },
  {
    venueMatch: ['fox theatre', 'fox theater'],
    city: ['atlanta'],
    text: "An ornate 1920s movie palace originally constructed as a Shriners temple, complete with a domed ceiling painted to resemble a Middle Eastern night sky.",
  },
  {
    venueMatch: ['soldier field'],
    text: "The site of the Fare Thee Well concerts in July 2015, the Dead's final performances together, pulling 70,000+ fans per night across three shows.",
  },
  {
    venueMatch: ['rosemont horizon', 'allstate arena'],
    text: "The Dead's go-to Chicago-area arena in the late 1980s and 90s; it was later rebranded so many times that locals often forgot its original name.",
  },
  {
    venueMatch: ['richfield coliseum'],
    text: 'This now-demolished arena near Cleveland was famous for its especially intense Dead crowds and was the site of multiple celebrated early 1980s shows.',
  },
  {
    venueMatch: ['alpine valley'],
    text: 'The Dead played here 20 times between 1980 and 1989; the venue gained a darker distinction in August 1990 when Stevie Ray Vaughan died in a helicopter crash leaving the grounds.',
  },
  {
    venueMatch: ['dane county coliseum'],
    text: 'One of the smaller arenas on the regular circuit, it filled to capacity on Wisconsin dates and gave Madison a loyal Deadhead scene for two decades.',
  },
  {
    venueMatch: ['red rocks'],
    text: 'Garcia called it "a sacred place," likening it to Stonehenge and the pyramids of Egypt, and after 20 shows the Dead grew too popular to fit its 9,500 seats.',
  },
  {
    venueMatch: ['mcnichols'],
    text: 'When the Dead outgrew Red Rocks in the late 1980s, they shifted Denver dates indoors to this arena, which later made way for the Pepsi Center.',
  },
  {
    venueMatch: ['renaissance faire', 'veneta'],
    text: "The Dead played this rural field in 1972 as a benefit for Ken Kesey's Springfield Creamery (makers of Nancy's Yogurt), captured in the concert film Sunshine Daydream.",
  },
  {
    venueMatch: ['autzen stadium'],
    text: "The University of Oregon's football stadium hosted the Dead for massive outdoor shows that drew much of the Pacific Northwest's Deadhead community into Eugene for a weekend.",
  },
  {
    venueMatch: ['west high school auditorium'],
    city: ['anchorage'],
    text: 'In 1980 the band played three shows in a high school auditorium in Anchorage, one of the more unlikely venue choices of their entire career.',
  },
  {
    venueMatch: ['sound and light theatre', 'great pyramid', 'giza'],
    text: 'The Dead played three shows at the Pyramids of Giza in September 1978, with the final night coinciding with a total lunar eclipse that the band had reportedly hoped to use to "levitate" the pyramids.',
  },
  {
    venueMatch: ['lyceum theatre', 'lyceum theater'],
    city: ['london'],
    text: "A venue with roots going back to 1765, the Dead's May 1972 shows here became some of the most widely traded European bootlegs in history.",
  },
  {
    venueMatch: ['wembley empire pool', 'ovo arena'],
    text: "The Dead played this massive London arena during their 1972 European tour, one of the most celebrated extended tours of their entire career.",
  },
  {
    venueMatch: ['tivoli concert hall', 'tivoli'],
    city: ['copenhagen'],
    text: 'Located inside Tivoli Gardens, one of the world\'s oldest amusement parks (opened in 1843), where the Dead played during their legendary April 1972 European run.',
  },
  {
    venueMatch: ['rheinhalle'],
    text: 'A striking Art Deco hall on the Rhine riverfront that hosted the Dead for three nights in April 1972; the recordings from this run are considered some of the finest of the entire European tour.',
  },
  {
    venueMatch: ['jahrhunderthalle'],
    text: 'This "century hall" was built in 1963 for trade shows and industry exhibitions — about as far from a hippie ballroom as you can get, yet the Dead made it work.',
  },
  {
    venueMatch: ['musikhalle'],
    text: 'A formal classical concert hall where the Dead showed up in April 1972 and played one of the most surprising sets of the European tour, given the venue\'s typically buttoned-up audience.',
  },
  {
    venueMatch: ['olympia'],
    city: ['paris'],
    text: "One of Europe's most legendary music halls, which had hosted Édith Piaf, The Beatles, and Jimi Hendrix before the Dead rolled through on their 1972 tour.",
  },
  {
    venueMatch: ['bickershaw'],
    text: 'A muddy English festival field in May 1972 where the Dead headlined alongside the Kinks and Dr. John, playing one of their longest ever European sets in persistently terrible British weather.',
  },
  {
    venueMatch: ['saratoga performing arts', 'spac'],
    text: "Set inside a state park, SPAC became famous for the miles of Deadhead campers who'd flood the surrounding woods for Dead shows every summer.",
  },
  {
    venueMatch: ['laguna seca'],
    text: "An active motorsports track in California's central coast wine country that hosted massive Dead festival shows, with fans parked along actual racing circuit curves.",
  },
  {
    venueMatch: ['market square arena'],
    text: "A round arena that became the Dead's primary Indiana stop through the 1980s, notable for being demolished via implosion in 2001 — a very un-Dead exit.",
  },
  {
    venueMatch: ['kiel auditorium'],
    text: 'A grand Beaux-Arts municipal hall in St. Louis that hosted the Dead during Midwest runs; the building still stands today as the Peabody Opera House.',
  },
  {
    venueMatch: ['starlight theatre', 'starlight theater'],
    city: ['kansas city'],
    text: "An outdoor amphitheater built into the hillside of a city park, where summer Dead shows felt genuinely different from the arena circuit grind.",
  },
]

export function getVenueTidbit(venue: string, city: string): string | null {
  const lv = venue.toLowerCase()
  const lc = city.toLowerCase()

  for (const entry of TIDBITS) {
    if (!entry.venueMatch.some(m => lv.includes(m))) continue
    if (entry.city && !entry.city.some(c => lc.includes(c))) continue
    return entry.text
  }
  return null
}
