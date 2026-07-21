interface VenueTidbit {
  venueMatch: string[]
  city?: string[]
  text: string
}

const TIDBITS: VenueTidbit[] = [
  {
    venueMatch: ['fillmore auditorium'],
    text: "Bill Graham's very first show as a promoter happened here on December 10, 1965, a benefit for the San Francisco Mime Troupe. It was also the first show the band played under its new name: the Grateful Dead.",
  },
  {
    venueMatch: ['carousel ballroom', 'fillmore west'],
    text: 'The Dead briefly co-owned this venue as part of a rock-and-roll collective in 1968 before handing the keys to Bill Graham, who renamed it.',
  },
  {
    venueMatch: ['avalon ballroom'],
    text: "The Fillmore's psychedelic rival, run by Chet Helms, the same guy who'd bankrolled Janis Joplin's bus ticket from Texas to San Francisco.",
  },
  {
    venueMatch: ['winterland'],
    text: 'The Dead played their final show here on New Year\'s Eve 1978, simulcast on local FM station KSAN and shown via closed-circuit TV in movie theaters, ending 12 years of Winterland shows that began in 1966.',
  },
  {
    venueMatch: ['cow palace'],
    text: "Built in 1941 and intended partly for livestock shows, it's one of the few arenas where the smell of the venue itself may have actually complemented the Dead's vibe.",
  },
  {
    venueMatch: ['warfield'],
    text: "The 15-show acoustic/electric run here in September-October 1980, the longest stand of the band's touring career, fed into the live albums Reckoning and Dead Set, alongside shows from the same tour at Radio City Music Hall and New Orleans' Saenger Theatre.",
  },
  {
    venueMatch: ['greek theater', 'greek theatre'],
    city: ['berkeley'],
    text: 'The Dead returned here every summer for years; it sits just a few blocks from Berkeley High School, where Phil Lesh studied music as a teenager.',
  },
  {
    venueMatch: ['berkeley community theater', 'berkeley community theatre'],
    text: "Housed inside Berkeley High School, this was the site of a well-known 1994 benefit concert Phil Lesh organized for the school's music program, after budget cuts eliminated it. (Note: the venue's full run of Dead-related shows here, and any additional Rex Foundation benefits beyond this one, is worth double-checking against your own database. I could not independently confirm the '13 benefit shows in the 1980s' figure from the original draft.)",
  },
  {
    venueMatch: ['oakland coliseum', 'oakland arena'],
    text: 'Their single most-played indoor venue at 66 shows, and the site of their final Bay Area concert on February 26, 1995.',
  },
  {
    venueMatch: ['henry j. kaiser', 'henry kaiser', 'kaiser auditorium'],
    text: "With 58 shows, this civic hall hosted some of the Dead's most beloved New Year's Eve runs in the late 1970s and early 80s. Note: this is the same building as Oakland Civic Auditorium below, renamed in 1984 in honor of Henry J. Kaiser. If your data pulls both names as separate venues, that's worth merging.",
  },
  {
    venueMatch: ['oakland civic auditorium'],
    text: 'This is the same building that later became the Henry J. Kaiser Convention Center, renamed in 1984. Worth checking whether your venue database is counting it twice under two names.',
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
    text: 'The Dead played a legendary run here in the early 1970s; the venue was shuttered for decades, then lovingly restored and reopened in 2012.',
  },
  {
    venueMatch: ['capitol theatre', 'capitol theater'],
    city: ['passaic'],
    text: "A different building from the Port Chester Capitol Theatre above, despite the shared name. This one hosted the April 25, 1977 show that became one of the band's most celebrated official live releases, first as part of the 30 Trips Around the Sun box set, then as its own Record Store Day vinyl release.",
  },
  {
    venueMatch: ['nassau coliseum'],
    text: "A no-frills suburban Long Island arena that the Dead played dozens of times, beloved by NY-area Deadheads who couldn't always score Manhattan tickets.",
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
    text: "The Dead's second-most played arena, and a venue where ticket sales alone topped $1 million in 1977. Later renamed CoreStates Spectrum, still the same building. Worth checking whether your database counts the two names as separate venues.",
  },
  {
    venueMatch: ['corestates spectrum'],
    text: 'Same arena as the Spectrum above, renamed after a naming-rights deal in the 1990s. Worth merging in your venue data if it currently shows up separately.',
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
    venueMatch: ['rfk stadium', 'rfk', 'robert f. kennedy'],
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
    text: 'The Dead played here 20 times between 1980 and 1989; the venue gained a darker distinction in August 1990 when Stevie Ray Vaughan died in a helicopter crash leaving the grounds after an Eric Clapton show, not a Dead show.',
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
    venueMatch: ['silva concert hall'],
    city: ['eugene'],
    text: "Part of Eugene's Hult Center for the Performing Arts, a much smaller and more formal room than nearby Autzen Stadium. I did not find a distinctive, well-documented Dead-specific story for this one beyond it being an occasional stop; worth flagging if you'd like me to dig further.",
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
    venueMatch: ['rainbow theatre'],
    city: ['london'],
    text: "I did not find a distinctive, well-documented Dead-specific story for the Rainbow Theatre beyond it being a London tour stop; worth flagging if you'd like me to dig further, since the venue itself (formerly the Astoria/Finsbury Park Astoria) has a rich history with other 60s/70s acts.",
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
  {
    venueMatch: ['memorial hall'],
    city: ['kansas city'],
    text: "A different, indoor venue from Starlight Theatre above, this one across the state line in Kansas City, Kansas. I did not find a distinctive, well-documented Dead-specific story here beyond it being a routine stop; worth flagging if you'd like me to dig further.",
  },
  {
    venueMatch: ['uptown theater', 'uptown theatre'],
    city: ['chicago'],
    text: 'A massive, ornate 1925 movie palace billed at its opening as "An Acre of Seats in a Magic City." The Dead played it 17 times between 1978 and 1981; it closed after that run and has sat empty ever since, though a restoration effort is underway.',
  },
  {
    venueMatch: ['brendan byrne arena'],
    text: "Also known as Meadowlands Arena, built in 1981 for the NBA's New Jersey Nets. Later renamed Continental Airlines Arena and then the IZOD Center before closing to the public in 2015; today it's used as a rehearsal space and soundstage for touring productions.",
  },
  {
    venueMatch: ['family dog on the great highway', 'family dog'],
    text: "Chet Helms' venue right on the beach at 660 Great Highway. In 1970, the Dead, Jefferson Airplane, and Santana were filmed here for \"A Night at the Family Dog,\" a PBS special, one of the earliest professionally shot multi-band concert broadcasts of the San Francisco scene.",
  },
  {
    venueMatch: ['music hall'],
    city: ['boston'],
    text: 'Now known as the Wang Theatre. The Dead\'s June 1976 shows here, their first tour after retiring the Wall of Sound for smaller theaters, were later released as part of the acclaimed "June 1976" box set.',
  },
  {
    venueMatch: ['deer creek music center'],
    text: "The site of the July 2, 1995 fence-crashing incident, where ticketless fans stormed the lawn and forced the band to stop mid-song. The next night's show was canceled, the first time in the band's history a Dead show was called off because of crowd behavior. It happened less than a month before Garcia's death and marked the Dead's last-ever shows at this venue.",
  },
  {
    venueMatch: ['cafe au go go', 'cafe au go-go', "caf' au go-go"],
    text: "A tiny, 400-capacity Greenwich Village basement club where the Dead played their first-ever East Coast shows in June 1967, a world away from the arena tours to come.",
  },
  {
    venueMatch: ['the matrix'],
    city: ['san francisco'],
    text: "A converted pizza parlor with a 100-person capacity, opened in 1965 as Jefferson Airplane's home base. The Dead played intimate shows here in the mid-to-late 60s, including some of Mickey Hart's earliest Hartbeats side-project jams.",
  },
  {
    venueMatch: ['knickerbocker arena'],
    city: ['albany'],
    text: "I did not turn up a distinctive, well-documented Dead-specific story for Knickerbocker Arena beyond it being a regular upstate New York stop; worth flagging if you'd like me to dig further.",
  },
  {
    venueMatch: ['long beach arena'],
    text: "A steady West Coast tour stop from 1981 through 1988. I did not find anything particularly distinctive about the Dead's history here beyond a solid run of shows; happy to keep digging if you want something more specific.",
  },
  {
    venueMatch: ['charlotte coliseum'],
    text: "I did not turn up a distinctive, well-documented Dead-specific story for Charlotte Coliseum beyond it being a regular Southeast tour stop; worth flagging if you'd like me to dig further.",
  },
  {
    venueMatch: ['centrum in worcester', 'the centrum', 'centrum'],
    city: ['worcester'],
    text: "I did not turn up a distinctive, well-documented Dead-specific story for the Centrum beyond it being a regular New England stop; worth flagging if you'd like me to dig further.",
  },
  {
    venueMatch: ['san francisco civic auditorium'],
    text: "I did not turn up a distinctive, well-documented Dead-specific story for this one beyond routine shows there in the band's earlier years; worth flagging if you'd like me to dig further, since the building (now Bill Graham Civic Auditorium) has real history with other acts.",
  },
  {
    venueMatch: ['ventura county fairgrounds'],
    text: "I did not turn up a distinctive, well-documented Dead-specific story here beyond it being a fairgrounds tour stop; worth flagging if you'd like me to dig further.",
  },
  {
    venueMatch: ['new haven veterans memorial coliseum', 'new haven coliseum'],
    text: "I did not turn up a distinctive, well-documented Dead-specific story here beyond it being a regular Connecticut stop; worth flagging if you'd like me to dig further.",
  },
  {
    venueMatch: ['rochester community war memorial'],
    text: "I did not turn up a distinctive, well-documented Dead-specific story here beyond it being a regular upstate New York stop; worth flagging if you'd like me to dig further.",
  },
  {
    venueMatch: ['springfield civic center'],
    city: ['springfield'],
    text: "I did not turn up a distinctive, well-documented Dead-specific story here beyond it being a regular New England stop; worth flagging if you'd like me to dig further.",
  },
  {
    venueMatch: ['auditorium theatre'],
    city: ['chicago'],
    text: "I did not turn up a distinctive, well-documented Dead-specific story here beyond routine shows, though the building itself, a landmark 1889 Adler & Sullivan design, has a notable architectural history worth exploring if you want that angle instead.",
  },
  {
    venueMatch: ['the palace of auburn hills', 'palace of auburn hills'],
    text: "I did not turn up a distinctive, well-documented Dead-specific story here beyond it being a regular Detroit-area stop in the late 80s and early 90s; worth flagging if you'd like me to dig further.",
  },
  {
    venueMatch: ['sam boyd silver bowl'],
    text: 'This is the same venue as Sam Boyd Stadium below, renamed in 1994. Worth checking whether your data currently splits it into two entries by name.',
  },
  {
    venueMatch: ['sam boyd stadium'],
    text: 'Originally opened in 1971 as Las Vegas Stadium, then the Las Vegas Silver Bowl, then Sam Boyd Silver Bowl, before taking its current name in 1994. Same building as the Silver Bowl entry above; worth merging if your data shows them separately.',
  },
  {
    venueMatch: ['golden hall'],
    city: ['san diego'],
    text: "I did not turn up a distinctive, well-documented Dead-specific story here beyond it being a San Diego stop; worth flagging if you'd like me to dig further.",
  },
  {
    venueMatch: ['radio city music hall'],
    text: 'The Dead played eight shows here in October 1980 as part of their acoustic/electric tour; the final two nights, on Halloween, were filmed and released as the concert movie Dead Ahead.',
  },
  {
    venueMatch: ['kinetic playground'],
    city: ['chicago'],
    text: "I did not turn up a distinctive, well-documented Dead-specific story here; worth flagging if you'd like me to dig further, since this short-lived late-60s Chicago psychedelic ballroom (also known as the Electric Theater) hosted a number of notable acts of the era.",
  },
  {
    venueMatch: ['shrine exposition hall', 'shrine auditorium'],
    city: ['los angeles'],
    text: "I did not turn up a distinctive, well-documented Dead-specific story here beyond it being an early LA stop; worth flagging if you'd like me to dig further.",
  },
  {
    venueMatch: ['los angeles sports arena'],
    text: "I did not turn up a distinctive, well-documented Dead-specific story here beyond it being a regular LA-area stop; worth flagging if you'd like me to dig further.",
  },
  {
    venueMatch: ['greensboro coliseum'],
    text: "I did not turn up a distinctive, well-documented Dead-specific story here beyond it being a regular North Carolina stop; worth flagging if you'd like me to dig further.",
  },
  {
    venueMatch: ['academy of music'],
    city: ['new york'],
    text: "The Dead's March 1972 run here came just weeks before they left for the legendary Europe '72 tour, and several songs previewed here would soon appear on that tour's setlists. Later released as Dick's Picks Vol. 30.",
  },
  {
    venueMatch: ['honolulu civic auditorium'],
    text: "I did not turn up a distinctive, well-documented Dead-specific story here beyond it being one of the band's rare Hawaii stops; worth flagging if you'd like me to dig further.",
  },
  {
    venueMatch: ["longshoremen's hall", 'longshoremens hall'],
    text: "I did not turn up a distinctive, well-documented Dead-specific story here, though this was the site of the January 1966 Trips Festival, an early landmark event in San Francisco's psychedelic scene that the Dead took part in; worth flagging if you'd like me to dig further and confirm the connection.",
  },
  {
    venueMatch: ['kings beach bowl'],
    text: "I did not turn up a distinctive, well-documented Dead-specific story here beyond it being a small, early-career Lake Tahoe-area stop; worth flagging if you'd like me to dig further.",
  },
  {
    venueMatch: ["o'keefe centre", 'okeefe centre'],
    city: ['toronto'],
    text: 'A six-night run here with Jefferson Airplane in summer 1967, billed as "The San Francisco Scene in Toronto" and financed by Bill Graham, was one of the Dead\'s earliest trips outside the US.',
  },
  {
    venueMatch: ['the in room'],
    city: ['belmont'],
    text: "I did not turn up a distinctive, well-documented Dead-specific story here beyond it being a very early, small-club stop; worth flagging if you'd like me to dig further.",
  },
  {
    venueMatch: ['miami arena'],
    text: "I did not turn up a distinctive, well-documented Dead-specific story here beyond it being a regular South Florida stop in the late 80s and early 90s; worth flagging if you'd like me to dig further.",
  },
  {
    venueMatch: ['golden gate park'],
    text: "The Dead played the Human Be-In here on January 14, 1967, the event that kicked off the Summer of Love. Their last classic-era show in the park was a free concert on November 3, 1991, a tribute to promoter Bill Graham, who had died in a helicopter crash days earlier.",
  },
  {
    venueMatch: ['civic arena'],
    city: ['pittsburgh'],
    text: 'Nicknamed "the Igloo" by locals, this was the world\'s first major arena with a fully retractable, self-supporting stainless-steel dome, built in 1961. Increasingly disruptive gate-crashing outside the arena in April 1989 was part of why the Dead moved their Pittsburgh dates to Three Rivers Stadium the following year.',
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
