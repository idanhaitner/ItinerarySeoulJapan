#!/usr/bin/env python3
"""Generate a refined English PDF itinerary for the Haitner family Japan trip (Sep 1–25, 2026)."""

from pathlib import Path
from playwright.sync_api import sync_playwright

OUT_DIR = Path(__file__).resolve().parent
HTML_PATH = OUT_DIR / "Haitner_Japan_Trip_Itinerary.html"
PDF_PATH = OUT_DIR / "Haitner_Japan_Trip_Itinerary.pdf"

DAYS = [
    {
        "date": "September 1, 2026",
        "weekday": "Tuesday",
        "city": "Tokyo",
        "hotel": "Keio Plaza Hotel Tokyo",
        "tagline": "Touchdown in Tokyo",
        "summary": "Land at Narita, private transfer to Shinjuku, and ease into Japan with a gentle first evening.",
        "food": "Early dinner near the hotel — try a simple ramen shop or conveyor-belt sushi to keep it easy after the flight.",
        "attractions": [
            {
                "title": "Narita Airport Arrival",
                "subtitle": "Private transfer · ~1h 30m",
                "badge": None,
                "body": "A driver meets you at the airport and takes you to Keio Plaza Hotel Tokyo in Shinjuku. After check-in, keep the evening light so jet lag does not win.",
            },
            {
                "title": "Shinjuku Evening Stroll",
                "subtitle": "Godzilla · neon · first bites",
                "badge": "Food",
                "body": "Wander Shinjuku’s shopping streets, spot the Godzilla statue, and feel the city’s energy without a packed agenda. Perfect first taste of Tokyo’s scale and nightlife glow.",
            },
        ],
        "transport": [
            "Airport → hotel: private driver pickup (~1h 30m).",
            "Stay near the hotel this evening — no long transit needed.",
        ],
        "tips": [
            "Treat today as jet-lag recovery — early dinner, early sleep.",
            "Buy a Suica/Pasmo (or use iPhone Suica) for trains tomorrow.",
            "Convenience stores (7-Eleven, Lawson) are excellent for water, snacks, and SIM/eSIM top-ups.",
        ],
    },
    {
        "date": "September 2, 2026",
        "weekday": "Wednesday",
        "city": "Tokyo",
        "hotel": "Keio Plaza Hotel Tokyo",
        "tagline": "Shibuya, Meiji Shrine & Harajuku",
        "summary": "Tokyo icons in one walkable arc: the scramble crossing, a forest shrine, Takeshita Street, Cat Street, and Omotesando.",
        "food": "Harajuku crepes on Takeshita; later, café-hop on Omotesando or Cat Street.",
        "attractions": [
            {
                "title": "Shibuya Crossing",
                "subtitle": "Scramble · Hachiko · Hikarie view",
                "badge": "Must-see",
                "body": "Cross the famous scramble, meet Hachiko, then ride up Shibuya Hikarie for a free 11th-floor view over the intersection. Miyashita Park is a good rest/shopping pause.",
            },
            {
                "title": "Meiji Jingu",
                "subtitle": "Forest shrine in the city",
                "badge": "Culture",
                "body": "One of Japan’s great Shinto shrines, wrapped in quiet woodland. Write a wish on an ema plaque. On some days you may see a traditional wedding procession.",
            },
            {
                "title": "Takeshita Street & Cat Street",
                "subtitle": "Harajuku youth culture",
                "badge": "Food",
                "body": "Takeshita is colorful, crowded, and crepe-famous. Cat Street is calmer and more stylish — today’s Harajuku fashion energy lives here.",
            },
            {
                "title": "Omotesando",
                "subtitle": "Tokyo’s tree-lined avenue",
                "badge": None,
                "body": "Elegant boutiques, architecture, and cafés along a shaded avenue often called Tokyo’s Champs-Élysées. A grown-up contrast to Takeshita Street.",
            },
        ],
        "transport": [
            "Hotel → Shibuya (~20m): Yamanote Line to Shibuya.",
            "Shibuya → Meiji Shrine (~15m): Yamanote to Yoyogi, then walk.",
            "Meiji → Takeshita (~10m walk); Cat Street (~5–10m more).",
            "Return via Harajuku Station → Shinjuku (~30m).",
        ],
        "tips": [
            "Lots of walking — schedule café breaks.",
            "Bring passports for tax-free shopping (usually ¥5,000+).",
            "If jet lag hits, you are close enough to return to the hotel midday.",
        ],
    },
    {
        "date": "September 3, 2026",
        "weekday": "Thursday",
        "city": "Tokyo",
        "hotel": "Keio Plaza Hotel Tokyo",
        "tagline": "Tokyo DisneySea — full park day",
        "summary": "A full day at DisneySea — Japan’s unique ocean-adventure Disney park and a highlight for amusement-park lovers.",
        "food": "Park dining is part of the fun — book popular restaurants early in the app if you can.",
        "attractions": [
            {
                "title": "Tokyo DisneySea",
                "subtitle": "Full day · rope drop recommended",
                "badge": "Park",
                "body": "DisneySea is unique to Japan — Mediterranean Harbor, Mysterious Island, Mermaid Lagoon, and more. Arrive for opening, use the official app for waits, and prioritize must-do rides first.",
            },
            {
                "title": "Evening return to Shinjuku",
                "subtitle": "Easy night after a long park day",
                "badge": None,
                "body": "If energy remains, a casual late ramen near the hotel is perfect. Otherwise, rest — tomorrow is culture and temples.",
            },
        ],
        "transport": [
            "Typical route: JR to Maihama / Resort Gateway, then Disney Resort Line.",
            "Allow buffer both ways — park days run long.",
        ],
        "tips": [
            "Buy dated tickets in advance.",
            "Comfortable shoes, portable charger, sunscreen, light rain layer.",
            "Consider Disney Premier Access for 1–2 top rides if waits look brutal.",
        ],
    },
    {
        "date": "September 4, 2026",
        "weekday": "Friday",
        "city": "Tokyo",
        "hotel": "Keio Plaza Hotel Tokyo",
        "tagline": "Asakusa, Kappabashi & Skytree",
        "summary": "Old Tokyo’s temple heart, kitchen-town souvenirs, and Japan’s tallest tower.",
        "food": "Nakamise snacks, melon pan, and Asakusa classics — try Hatoya, Benizuru Pancake, or Fruits Parlor Gotō.",
        "attractions": [
            {
                "title": "Asakusa & Senso-ji",
                "subtitle": "Kaminarimon · Nakamise · Kannon temple",
                "badge": "Must-see",
                "body": "Start at the Asakusa Culture Tourist Information Center (Kengo Kuma design, 8th-floor view), walk Nakamise shopping street, then visit vivid Senso-ji — Tokyo’s most beloved temple.",
            },
            {
                "title": "Kappabashi Street",
                "subtitle": "Kitchen town",
                "badge": "Food",
                "body": "Nearly 1 km of chef-supply shops: knives, cookware, plastic food samples, lanterns. Excellent practical souvenirs for food lovers.",
            },
            {
                "title": "Tokyo Skytree & Solamachi",
                "subtitle": "634m views",
                "badge": "Must-see",
                "body": "Observation decks at 350m / 450m. Clear days may reveal Mt. Fuji. Shop and eat in Solamachi at the base.",
            },
        ],
        "transport": [
            "Hotel → Asakusa (~35–45m): subway via Asakusa Line / transfers.",
            "Senso-ji → Kappabashi: ~10m walk.",
            "Kappabashi → Skytree (~25m): Tobu Skytree Line.",
            "Return to Shinjuku by subway/JR (~40–50m).",
        ],
        "tips": [
            "Senso-ji is busiest ~16:00–18:30 — earlier is calmer.",
            "Buy a quality kitchen knife at Kappabashi if you want one keepsake.",
            "Book Skytree tickets online to skip some queues.",
        ],
    },
    {
        "date": "September 5, 2026",
        "weekday": "Saturday",
        "city": "Tokyo",
        "hotel": "Keio Plaza Hotel Tokyo",
        "tagline": "Tsukiji breakfast, palace & Ginza",
        "summary": "A food-first morning at Tsukiji Outer Market, then Imperial Palace gardens and polished Ginza shopping.",
        "food": "Tsukiji breakfast is the main event — tamagoyaki, grilled seafood, fresh sashimi bowls.",
        "attractions": [
            {
                "title": "Tsukiji Outer Market",
                "subtitle": "Tokyo’s legendary food stroll",
                "badge": "Food",
                "body": "The outer market remains one of Tokyo’s best breakfast experiences. Graze stall to stall — egg omelets, seafood bowls, grilled scallops — before the day crowds thicken.",
            },
            {
                "title": "Imperial Palace East Gardens",
                "subtitle": "Quiet green heart of the capital",
                "badge": "Culture",
                "body": "Free gardens on the former castle grounds — moats, walls, lawns, and a calm contrast to central Tokyo. Pair with a Marunouchi café stop afterward.",
            },
            {
                "title": "Marunouchi & Ginza",
                "subtitle": "Elegant shopping streets",
                "badge": None,
                "body": "Shin-Marunouchi Building, Nakadori Avenue, then Ginza: Uniqlo flagship, GINZA SIX, Mitsukoshi rooftop terrace, Ginza Loft, and Kabuki-za. Architecture itself is part of the fun.",
            },
        ],
        "transport": [
            "Hotel → Tsukiji (~35–40m by subway).",
            "Tsukiji → Imperial Palace East Gardens: walk / short subway.",
            "Palace area → Ginza: easy walk via Marunouchi.",
            "Return to Shinjuku by subway/JR.",
        ],
        "tips": [
            "Arrive Tsukiji early (before 9:00) for the best energy.",
            "Passport for tax-free Ginza shopping.",
            "Keep the afternoon flexible — this is a rich but walkable day.",
        ],
    },
    {
        "date": "September 6, 2026",
        "weekday": "Sunday",
        "city": "Tokyo",
        "hotel": "Keio Plaza Hotel Tokyo",
        "tagline": "teamLab Planets & Odaiba",
        "summary": "Immersive digital art, then futuristic waterfront fun — Gundam, malls, and optional indoor rides.",
        "food": "Odaiba has everything from ramen to dessert museums — DiverCity and Aqua City are easy food bases.",
        "attractions": [
            {
                "title": "teamLab Planets Tokyo",
                "subtitle": "Barefoot immersive art world",
                "badge": "Must-see",
                "body": "Walk through water, mirrors, and light installations. Timed tickets sell out — book ahead. One of the most memorable modern-Japan experiences for first-timers.",
            },
            {
                "title": "Odaiba Waterfront",
                "subtitle": "Gundam · DiverCity · bay views",
                "badge": "Park",
                "body": "See the life-size Gundam at DiverCity, wander waterfront malls, and soak up the man-made island vibe. Optional: Tokyo Joypolis indoor amusement park if you still want rides.",
            },
        ],
        "transport": [
            "Hotel → teamLab Planets (Toyosu area): ~40–50m by subway.",
            "Planets → Odaiba: Yurikamome or Rinkai Line (~15–25m).",
            "Return to Shinjuku via Rinkai/JR or subway (~45–60m).",
        ],
        "tips": [
            "Book teamLab Planets weeks ahead if possible.",
            "Wear clothes you can roll up — some rooms involve water.",
            "Joypolis is optional; skip if the day already feels full.",
        ],
    },
    {
        "date": "September 7, 2026",
        "weekday": "Monday",
        "city": "Tokyo",
        "hotel": "Keio Plaza Hotel Tokyo",
        "tagline": "Ueno, Akihabara & Golden Gai",
        "summary": "Market grazing in Ameyoko, pop culture in Akihabara, tiny bars in Golden Gai.",
        "food": "Arrive Ameyoko hungry. Pre-Golden Gai dinner idea: Yakitori Izakaya Gekibutori.",
        "attractions": [
            {
                "title": "Ameyoko Market (Ueno)",
                "subtitle": "Street-food market under the tracks",
                "badge": "Food",
                "body": "Lively stalls between Okachimachi and Ueno — seafood skewers, fruit, snacks, and market chaos in the best way. Most shops roughly 10:00–20:00.",
            },
            {
                "title": "Ueno Park (optional add-on)",
                "subtitle": "Museums & temple pause",
                "badge": "Culture",
                "body": "If you want culture between snacks: Ueno Park holds major museums and shrines. Even a short stroll resets the pace before Akihabara.",
            },
            {
                "title": "Akihabara Electric Town",
                "subtitle": "Arcades · anime · maid cafés",
                "badge": "Park",
                "body": "Electronics, gaming, and otaku culture. Try GiGO / TAITO / Namco arcades. For a playful stop: @home café or Maidreamin — funny even for one coffee.",
            },
            {
                "title": "Golden Gai Night Out",
                "subtitle": "Shinjuku’s tiny bar maze",
                "badge": "Must-see",
                "body": "Dozens of microscopic bars with unique personalities. Enter one or two, order a drink, and enjoy the intimate Tokyo nightlife classic.",
            },
        ],
        "transport": [
            "Hotel → Ameyoko (~40m): Yamanote to Okachimachi.",
            "Ameyoko → Akihabara (~15m): Yamanote.",
            "Akihabara → hotel (~45m), then walk ~15m to Golden Gai.",
        ],
        "tips": [
            "Some Golden Gai bars are Japanese-only or regulars-only — just try the next door.",
            "Expect a one-drink minimum; sometimes a small cover.",
            "Arcades are cash-friendly — keep coins handy.",
        ],
    },
    {
        "date": "September 8, 2026",
        "weekday": "Tuesday",
        "city": "Tokyo",
        "hotel": "Keio Plaza Hotel Tokyo",
        "tagline": "Daikanyama, Nakameguro & New York Bar",
        "summary": "Stylish quieter Tokyo — books, riverside walks, boutiques, and a cinematic nightcap.",
        "food": "Nakameguro is excellent for lunch and dinner — pick by vibe. Starbucks Reserve Roastery for coffee theater.",
        "attractions": [
            {
                "title": "Daikanyama T-Site",
                "subtitle": "Tsutaya bookstore complex",
                "badge": "Culture",
                "body": "Elegant neighborhood with design shops and the iconic Tsutaya. Nearby Starbucks Reserve Roastery Tokyo is a multi-floor coffee landmark overlooking Meguro River.",
            },
            {
                "title": "Meguro River & Nakameguro",
                "subtitle": "Local, stylish, walkable",
                "badge": "Food",
                "body": "Canal promenade, independent boutiques, bakeries, and intimate restaurants. Ideal unstructured wandering day.",
            },
            {
                "title": "New York Bar — Park Hyatt Tokyo",
                "subtitle": "Lost in Translation rooftop",
                "badge": "Must-see",
                "body": "Panoramic views, polished cocktails, sometimes live jazz. Smart-casual dress; short waits are common. A perfect Tokyo finale before Hakone.",
            },
        ],
        "transport": [
            "Hotel → Daikanyama (~30m): Fukutoshin to Daikan-yama.",
            "Continue on foot along Meguro River to Nakameguro.",
            "Return (~25m), then ~10m walk to New York Bar.",
        ],
        "tips": [
            "Send large bags ahead to Kyoto tomorrow; travel light to Hakone.",
            "Hotel Musse Kyoto Shijo-Kawaramachi Meitetsu is your Kyoto base.",
            "Take this day slowly — it’s designed for atmosphere.",
        ],
    },
    {
        "date": "September 9, 2026",
        "weekday": "Wednesday",
        "city": "Hakone",
        "hotel": "Hotel Kajikaso",
        "tagline": "Onsen country — art, volcano & Lake Ashi",
        "summary": "Leave the megacity for mountains, open-air sculpture, volcanic Owakudani, a pirate-ship cruise, and Hakone Shrine.",
        "food": "Black eggs and black ice cream at Owakudani; hotel dinner may include kaiseki/onsen-ryokan style — a cultural food highlight.",
        "attractions": [
            {
                "title": "Hakone Open-Air Museum",
                "subtitle": "Sculpture in the mountains",
                "badge": "Culture",
                "body": "Outdoor sculptures against valley views, plus indoor galleries. Easy to spend calm hours combining art and mountain air.",
            },
            {
                "title": "Owakudani",
                "subtitle": "Active volcanic valley",
                "badge": "Must-see",
                "body": "Sulfur vents and hot springs. On clear days, Mt. Fuji appears. Taste the famous black eggs.",
            },
            {
                "title": "Lake Ashi Cruise & Hakone Shrine",
                "subtitle": "Pirate ship + lakeside torii",
                "badge": "Must-see",
                "body": "Sightseeing “pirate” ship across Lake Ashinoko, then Hakone Shrine’s forest setting and dramatic red torii — including one standing in the water.",
            },
        ],
        "transport": [
            "Shinjuku → Hakone-Yumoto (~1h 45m): Romancecar.",
            "Hotel → Open-Air Museum (~25m by bus).",
            "Museum → Owakudani (~30m); Owakudani → Togendai by ropeway.",
            "Pirate ship to Moto-Hakone → shrine; bus back to hotel.",
        ],
        "tips": [
            "Start early — Hakone transfers take time.",
            "If behind schedule, skip the Open-Air Museum.",
            "Enjoy the onsen at Hotel Kajikaso in the evening — rinse first, no swimsuits in traditional baths.",
        ],
    },
    {
        "date": "September 10, 2026",
        "weekday": "Thursday",
        "city": "Kyoto",
        "hotel": "Hotel Musse Kyoto Shijo-Kawaramachi Meitetsu",
        "tagline": "Arrive Kyoto — markets, Gion & Pontocho",
        "summary": "Shinkansen to Kyoto, then Nishiki Market grazing and lantern-lit Gion and Pontocho.",
        "food": "Nishiki is Kyoto’s kitchen — pickles, tofu sweets, skewers, and seasonal bites as you walk.",
        "attractions": [
            {
                "title": "Travel Hakone → Kyoto",
                "subtitle": "~2h 30m via Odawara Shinkansen",
                "badge": None,
                "body": "Hakone Tozan to Odawara, Hikari Shinkansen to Kyoto, taxi to Hotel Musse near Kawaramachi. Bags may already be waiting if you forwarded them.",
            },
            {
                "title": "Nishiki Market",
                "subtitle": "Kyoto’s pantry street",
                "badge": "Food",
                "body": "A narrow covered market of 100+ shops — seafood, sweets, knives, Kyoto specialties. About 5 minutes from the hotel.",
            },
            {
                "title": "Gion & Pontocho",
                "subtitle": "Geisha district · dinner alley",
                "badge": "Must-see",
                "body": "Best around 17:00–18:00 as lanterns light Hanamikoji and Shirakawa. Dinner in Pontocho, then stroll the Kamogawa River.",
            },
        ],
        "transport": [
            "Hakone → Kyoto hotel (~2h 30m) + taxi.",
            "Hotel → Nishiki: ~5m walk; Nishiki → Gion: ~10m walk.",
        ],
        "tips": [
            "Everything tonight is walkable — rest as needed after transit.",
            "Be respectful photographing in Gion — no chasing geisha/maiko.",
        ],
    },
    {
        "date": "September 11, 2026",
        "weekday": "Friday",
        "city": "Kyoto",
        "hotel": "Hotel Musse Kyoto Shijo-Kawaramachi Meitetsu",
        "tagline": "Arashiyama bamboo & temples",
        "summary": "West Kyoto’s classic day: bridge views, bamboo grove, monkey park, and Tenryu-ji’s Zen garden.",
        "food": "Street snacks near Togetsukyo; yudofu (hot tofu) is a local Arashiyama classic if you want a sit-down lunch.",
        "attractions": [
            {
                "title": "Togetsukyo Bridge & Bamboo Grove",
                "subtitle": "Arashiyama icons",
                "badge": "Must-see",
                "body": "The famous bridge area plus the towering bamboo path. Arrive early for softer light and fewer people.",
            },
            {
                "title": "Iwatayama Monkey Park",
                "subtitle": "Hilltop Kyoto panorama",
                "badge": "Park",
                "body": "About 20 minutes uphill (¥600). Japanese macaques roam freely; feed them only from inside the designated hut. Views over Kyoto are excellent.",
            },
            {
                "title": "Tenryu-ji Temple",
                "subtitle": "UNESCO Zen landscape garden",
                "badge": "Culture",
                "body": "A major Rinzai Zen temple with one of Japan’s finest borrowed-scenery gardens — quiet contrast after the bamboo crowds.",
            },
        ],
        "transport": [
            "Hotel → Arashiyama (~35m): Hankyu via Katsura.",
            "Return by JR San-In to Kyoto Station, then taxi/subway to hotel.",
        ],
        "tips": [
            "Leave before 08:00 for the bamboo grove.",
            "Good shoes and water for the monkey-park climb.",
            "Keep distance from monkeys and follow park rules.",
        ],
    },
    {
        "date": "September 12, 2026",
        "weekday": "Saturday",
        "city": "Kyoto",
        "hotel": "Hotel Musse Kyoto Shijo-Kawaramachi Meitetsu",
        "tagline": "Fushimi Inari, Uji & tea ceremony",
        "summary": "Thousand vermillion torii, Uji’s matcha world, Byodo-in, then a traditional tea ceremony.",
        "food": "Uji is matcha heaven — soft serve, sweets, and tea soba along the river and Omotesando.",
        "attractions": [
            {
                "title": "Fushimi Inari Taisha",
                "subtitle": "Torii tunnel mountain paths",
                "badge": "Must-see",
                "body": "Japan’s most iconic shrine experience. Walk the first crowded gates or continue higher for quieter trails and city views. Fox messengers of Inari appear throughout.",
            },
            {
                "title": "Uji Bridge, Omotesando & Byodo-in",
                "subtitle": "Matcha capital · Phoenix Hall",
                "badge": "Food",
                "body": "Historic bridge, tea shops, and UNESCO Byodo-in — the Phoenix Hall on Japan’s ¥10 coin. A calmer, greener half-day after Fushimi.",
            },
            {
                "title": "Tea Ceremony",
                "subtitle": "MAIKOYA Karasuma Shijo",
                "badge": "Culture",
                "body": "Chanoyu with matcha, precise ritual, and English explanation — a peaceful cultural anchor for the day.",
            },
        ],
        "transport": [
            "Hotel → Fushimi Inari (~25m): Keihan to Fushimi-Inari.",
            "Fushimi → Uji (~30m): JR Nara Line.",
            "Leave Uji ~15:00 for tea ceremony timing.",
        ],
        "tips": [
            "Arrive Fushimi early — it gets extremely busy.",
            "Comfortable shoes for continuous climbing.",
            "Sip slowly in Uji; this day is about taste and atmosphere.",
        ],
    },
    {
        "date": "September 13, 2026",
        "weekday": "Sunday",
        "city": "Kyoto",
        "hotel": "Hotel Musse Kyoto Shijo-Kawaramachi Meitetsu",
        "tagline": "Higashiyama — stone streets & temples",
        "summary": "Kiyomizu-dera, Sannenzaka & Ninenzaka, Yasaka Pagoda, Kodai-ji, and the tatami Starbucks.",
        "food": "Matcha desserts and street snacks all along Sannenzaka/Ninenzaka — graze as you descend.",
        "attractions": [
            {
                "title": "Kiyomizu-dera",
                "subtitle": "Wooden stage over the city",
                "badge": "Must-see",
                "body": "Founded 778 — vast timber terrace built without nails, panoramic views, and Otowa Waterfall’s three blessing streams (choose only one).",
            },
            {
                "title": "Sannenzaka, Ninenzaka & Yasaka Pagoda",
                "subtitle": "Old Kyoto postcard lanes",
                "badge": "Must-see",
                "body": "Stone streets, wooden townhouses, tea shops, and one of Japan’s most photographed pagoda views — magical near sunset.",
            },
            {
                "title": "Kodai-ji & Higashiyama wander",
                "subtitle": "Zen gardens · optional tatami Starbucks",
                "badge": "Culture",
                "body": "A calmer Zen temple with gardens and bamboo. Then simply wander. Optional: Starbucks Ninenzaka in a century-old wooden house with tatami seating.",
            },
        ],
        "transport": [
            "Hotel → Kiyomizu (~25m): City Bus 207.",
            "Most sites are 5–10 minutes apart on foot.",
            "Return by bus 207 or taxi.",
        ],
        "tips": [
            "Arrive Kiyomizu early.",
            "Hills and stairs all day — good shoes essential.",
            "Stay into dusk for the best lantern atmosphere.",
        ],
    },
    {
        "date": "September 14, 2026",
        "weekday": "Monday",
        "city": "Kyoto",
        "hotel": "Hotel Musse Kyoto Shijo-Kawaramachi Meitetsu",
        "tagline": "Golden Pavilion & classic north Kyoto",
        "summary": "Must-see Kinkaku-ji, a Zen rock garden or Nijo Castle, then a freer Kyoto afternoon for food and browsing.",
        "food": "Nishiki revisit for specialties you skipped; evening kaiseki or casual izakaya near Kawaramachi.",
        "attractions": [
            {
                "title": "Kinkaku-ji (Golden Pavilion)",
                "subtitle": "Japan’s most famous temple view",
                "badge": "Must-see",
                "body": "A shimmering gold pavilion reflected in a mirror pond — one of the essential first-timer images of Japan. Go earlier for softer crowds and better photos.",
            },
            {
                "title": "Ryoan-ji or Nijo Castle",
                "subtitle": "Choose your culture chapter",
                "badge": "Culture",
                "body": "Ryoan-ji: the iconic Zen rock garden of raked gravel and stones. Or Nijo Castle: Tokugawa palace architecture and “nightingale” floors. Both are outstanding; pick by mood.",
            },
            {
                "title": "Free Kyoto afternoon",
                "subtitle": "Shopping · cafés · second looks",
                "badge": "Food",
                "body": "Return south for shopping around Shijo/Kawaramachi, another Nishiki tasting lap, or simply sit by the Kamogawa with a drink. Luggage tip: forward bags to Osaka tonight/tomorrow.",
            },
        ],
        "transport": [
            "Hotel → Kinkaku-ji: bus ~40–50m (or taxi).",
            "Kinkaku-ji → Ryoan-ji: short bus/taxi.",
            "Return to central Kyoto by bus.",
        ],
        "tips": [
            "Kinkaku-ji is very popular — earlier is better.",
            "Forward luggage to Cross Hotel Osaka before Hiroshima.",
            "Keep tomorrow’s transfer bags light.",
        ],
    },
    {
        "date": "September 15, 2026",
        "weekday": "Tuesday",
        "city": "Hiroshima",
        "hotel": "Daiwa Roynet Hotel Hiroshima",
        "tagline": "Hiroshima — garden calm & Peace Memorial",
        "summary": "Shinkansen west to Hiroshima: Shukkeien Garden, then Peace Park and Museum. Optional Nagarekawa evening.",
        "food": "Hiroshima-style okonomiyaki is mandatory — layered cabbage, noodles, and savory batter on a teppan.",
        "attractions": [
            {
                "title": "Travel Kyoto → Hiroshima",
                "subtitle": "~2h 30m Nozomi Shinkansen",
                "badge": None,
                "body": "Taxi to Kyoto Station, Nozomi to Hiroshima, tram to Chuden-mae, walk to Daiwa Roynet Hotel.",
            },
            {
                "title": "Shukkeien Garden",
                "subtitle": "Miniature landscape garden",
                "badge": "Culture",
                "body": "A classical stroll garden of “shrunken scenery.” Walk the pond loop slowly — a gentle landing in the city.",
            },
            {
                "title": "Peace Memorial Park & Museum",
                "subtitle": "A-Bomb Dome · testimony · remembrance",
                "badge": "Must-see",
                "body": "Dome, Children’s Peace Monument, Cenotaph, Peace Flame, and a powerful museum. Allow 1.5–2 hours. Essential, emotional, unforgettable.",
            },
        ],
        "transport": [
            "Kyoto → hotel (~2h 30m + tram).",
            "Hotel → Shukkeien / Peace Park: short taxi hops (~10m each).",
        ],
        "tips": [
            "Give the museum real time — don’t rush it.",
            "Okonomiyaki for dinner helps settle a heavy afternoon.",
            "Nagarekawa nightlife is optional if energy remains.",
        ],
    },
    {
        "date": "September 16, 2026",
        "weekday": "Wednesday",
        "city": "Hiroshima",
        "hotel": "Daiwa Roynet Hotel Hiroshima",
        "tagline": "Miyajima Island day",
        "summary": "Floating torii, island snacks, and Mt. Misen views — one of Japan’s most beautiful day trips.",
        "food": "Momiji manju maple cakes, fresh oysters (season), and grilled conger eel along Omotesando.",
        "attractions": [
            {
                "title": "Omotesando Shopping Street",
                "subtitle": "Island food & souvenirs",
                "badge": "Food",
                "body": "About 350m of shops leading to the shrine — wooden rice paddles, maple-leaf cakes, and seafood stalls.",
            },
            {
                "title": "Itsukushima Shrine",
                "subtitle": "Visit at high tide and low tide if you can",
                "badge": "Must-see",
                "body": "The world-famous “floating” torii and shrine on stilts. High tide = classic floating look; low tide = walk near the gate. Check tide times in advance.",
            },
            {
                "title": "Mt. Misen",
                "subtitle": "Ropeway + summit hike",
                "badge": "Park",
                "body": "Island high point with Seto Inland Sea panoramas. Ropeway up, then extra walking to viewpoints. See Reikado’s eternal flame tradition.",
            },
        ],
        "transport": [
            "Hotel → Miyajimaguchi (~55m): tram + JR.",
            "Ferry ~10m; island sights mostly on foot + ropeway.",
            "Return same way (~50m to hotel after ferry).",
        ],
        "tips": [
            "Leave early to beat island crowds.",
            "Check tide tables — it changes the shrine experience.",
            "Good shoes for Misen’s extra climb beyond the ropeway.",
        ],
    },
    {
        "date": "September 17, 2026",
        "weekday": "Thursday",
        "city": "Osaka",
        "hotel": "Cross Hotel Osaka",
        "tagline": "Osaka arrival — markets, castle, neon",
        "summary": "Shinkansen to Osaka, Kuromon Market grazing, Osaka Castle, then Dotonbori under your hotel.",
        "food": "Kuromon snacks by day; takoyaki, okonomiyaki, and kushikatsu in Dotonbori by night.",
        "attractions": [
            {
                "title": "Travel Hiroshima → Osaka",
                "subtitle": "~2h 30m to Namba / Cross Hotel",
                "badge": None,
                "body": "Nozomi to Shin-Osaka, Midosuji Line to Namba, walk to Cross Hotel Osaka — brilliantly placed for food nights.",
            },
            {
                "title": "Kuromon Market",
                "subtitle": "Osaka’s kitchen",
                "badge": "Food",
                "body": "~600m covered market of fish, meat, produce, and sweets. Arrive hungry and graze.",
            },
            {
                "title": "Osaka Castle",
                "subtitle": "History museum + parkland",
                "badge": "Culture",
                "body": "A landmark of Japan’s unification era with museum exhibits and broad castle grounds for walking and photos.",
            },
            {
                "title": "Dotonbori",
                "subtitle": "Glico sign · street-food neon",
                "badge": "Must-see",
                "body": "Osaka’s most famous night strip — only ~5 minutes from the hotel. Eat, photograph, and wander without a rigid plan.",
            },
        ],
        "transport": [
            "Hiroshima → hotel (~2h 30m).",
            "Hotel → Kuromon: ~15m walk.",
            "Kuromon → Castle (~35m subway); Castle → hotel (~40m).",
            "Hotel → Dotonbori: ~5m walk.",
        ],
        "tips": [
            "Rest at the hotel before Dotonbori.",
            "Castle grounds are larger than they look.",
            "Tonight is about tasting Osaka’s loud, delicious personality.",
        ],
    },
    {
        "date": "September 18, 2026",
        "weekday": "Friday",
        "city": "Osaka",
        "hotel": "Cross Hotel Osaka",
        "tagline": "Universal Studios Japan",
        "summary": "Full amusement-park day — Super Nintendo World, Harry Potter, and Hollywood thrill rides.",
        "food": "Park food is fun (butterbeer, themed snacks). Evening ramen back near Namba if you leave hungry for “real” Osaka.",
        "attractions": [
            {
                "title": "Universal Studios Japan",
                "subtitle": "Full park day",
                "badge": "Park",
                "body": "One of Asia’s best theme parks. Super Nintendo World is a standout (express/area entry strategy helps). Arrive at opening and prioritize headliners.",
            },
            {
                "title": "Evening wind-down in Namba",
                "subtitle": "Easy food near the hotel",
                "badge": "Food",
                "body": "After park legs give out, keep dinner simple near Cross Hotel — Dotonbori is right there if you still want neon.",
            },
        ],
        "transport": [
            "Hotel → USJ: subway to Universal City Station (~25–35m).",
            "Return same way.",
        ],
        "tips": [
            "Buy tickets + Express Pass strategy in advance if possible.",
            "Nintendo World may need timed entry — check current rules.",
            "Same park-day kit: charger, sunscreen, rain layer, comfy shoes.",
        ],
    },
    {
        "date": "September 19, 2026",
        "weekday": "Saturday",
        "city": "Osaka",
        "hotel": "Cross Hotel Osaka",
        "tagline": "Nara deer park & Shinsekai",
        "summary": "Day trip to Nara’s temples and friendly deer, then retro Shinsekai back in Osaka.",
        "food": "Try kakinoha-zushi in Nara; Nakatanidou fresh mochi; kushikatsu in Shinsekai at night.",
        "attractions": [
            {
                "title": "Nara Park & Todai-ji",
                "subtitle": "Deer · Great Buddha · Kasuga Taisha",
                "badge": "Must-see",
                "body": "Free-roaming sacred deer, Todai-ji’s enormous bronze Buddha, Kasuga Taisha’s lanterns, and optional garden stops (Yoshikien / Isuien). Magical for first-timers.",
            },
            {
                "title": "Nakatanidou Mochi",
                "subtitle": "Lightning-fast mochi pounding",
                "badge": "Food",
                "body": "Watch (and taste) freshly pounded mochi — a fun cultural food moment if timing lines up.",
            },
            {
                "title": "Shinsekai & Tsutenkaku",
                "subtitle": "Retro Osaka night",
                "badge": "Food",
                "body": "Nostalgic streets under Tsutenkaku Tower — old-school arcades, street food, and a local vibe very different from Dotonbori.",
            },
        ],
        "transport": [
            "Hotel → Nara (~45m): Kintetsu Rapid Express from Osaka-Namba.",
            "Nara → Shinsekai (~55m); Shinsekai → hotel (~25m).",
        ],
        "tips": [
            "Leave for Nara by 08:00–08:30.",
            "Deer crackers are fun — guard bags and maps.",
            "If tired, shorten temples or skip Shinsekai.",
        ],
    },
    {
        "date": "September 20, 2026",
        "weekday": "Sunday",
        "city": "Osaka",
        "hotel": "Cross Hotel Osaka",
        "tagline": "Arcade shopping & Umeda views",
        "summary": "Japan’s longest covered shopping street, then panoramic views from Umeda Sky Building.",
        "food": "Local lunch along Tenjinbashi-suji — takoyaki, croquettes (Nakamuraya), cheap tasty set meals.",
        "attractions": [
            {
                "title": "Tenjinbashi-suji Shopping Street",
                "subtitle": "Japan’s longest arcade (~2.6 km)",
                "badge": "Food",
                "body": "Hundreds of local shops from tea and knives to snack stalls. Start near Osaka Tenmangu Shrine, then wander north.",
            },
            {
                "title": "Umeda Sky Building",
                "subtitle": "Floating Garden Observatory",
                "badge": "Must-see",
                "body": "Twin towers linked at the 39th floor with indoor and open-air city panoramas — one of Osaka’s best views.",
            },
        ],
        "transport": [
            "Hotel → Tenjinbashi-suji (~25m): Sakaisuji Line to Ogimachi.",
            "Arcade → Umeda Sky (~20m); return to Namba (~30m).",
        ],
        "tips": [
            "Seek small local shops, not only chains.",
            "Passport for tax-free purchases.",
            "Great lighter day after Nara and USJ.",
        ],
    },
    {
        "date": "September 21, 2026",
        "weekday": "Monday",
        "city": "Osaka",
        "hotel": "Cross Hotel Osaka",
        "tagline": "Osaka food & culture deep dive",
        "summary": "A flexible favorite day: Instant Ramen Museum, aquarium or Den Den Town, and one last Dotonbori feast.",
        "food": "Design your own Cup Noodle; later chase any Osaka bites you still haven’t tried.",
        "attractions": [
            {
                "title": "Momofuku Ando Instant Ramen Museum",
                "subtitle": "Ikeda · make your own Cup Noodle",
                "badge": "Food",
                "body": "Fun, family-friendly food museum in Ikeda where you design and take home your own Cup Noodle. Perfect for food lovers and a memorable souvenir.",
            },
            {
                "title": "Choose your afternoon",
                "subtitle": "Kaiyukan · Den Den Town · Hozenji",
                "badge": "Park",
                "body": "Osaka Aquarium Kaiyukan (one of the world’s great aquariums), Den Den Town for electronics/anime, or atmospheric Hozenji Yokocho alley for mossy shrine charm and quieter dining.",
            },
            {
                "title": "Final Osaka night",
                "subtitle": "Dotonbori or hidden alleys",
                "badge": "Food",
                "body": "One last neon food crawl — or a nicer sit-down dinner if you want a calmer send-off before Tokyo.",
            },
        ],
        "transport": [
            "Hotel → Instant Ramen Museum (Ikeda): ~40–50m by Hankyu.",
            "Afternoon option depends on choice (Kaiyukan is Tempozan area).",
        ],
        "tips": [
            "Ramen Museum can queue — go earlier.",
            "Forward or pack carefully for tomorrow’s Tokyo shinkansen.",
            "Keep tomorrow morning realistic — it’s a transit day.",
        ],
    },
    {
        "date": "September 22, 2026",
        "weekday": "Tuesday",
        "city": "Tokyo",
        "hotel": "Solaria Nishitetsu Hotel",
        "tagline": "Return to Tokyo — Ginza ease",
        "summary": "Shinkansen back to Tokyo. Soft landing in Ginza/Marunouchi after Osaka’s intensity.",
        "food": "Ginza sushi, department-store depachika food halls, or a simple celebratory dinner.",
        "attractions": [
            {
                "title": "Travel Osaka → Tokyo",
                "subtitle": "~3h 20m Nozomi to Ginza area",
                "badge": None,
                "body": "Midosuji to Shin-Osaka, Nozomi Shinkansen, then local line to Higashi-ginza and Solaria Nishitetsu Hotel.",
            },
            {
                "title": "Marunouchi & Ginza at your pace",
                "subtitle": "Architecture · shopping · cafés",
                "badge": "Food",
                "body": "All walkable from the hotel. Explore depachika basement food halls — one of Japan’s great culinary treasures for first-timers.",
            },
        ],
        "transport": [
            "Osaka → Tokyo hotel (~3h 20m).",
            "Afternoon sights are walking distance.",
        ],
        "tips": [
            "Keep the day easy after transit.",
            "Depachika (department basement) is perfect for picnic-style dinner items.",
            "Check sumo ticket availability for tomorrow.",
        ],
    },
    {
        "date": "September 23, 2026",
        "weekday": "Wednesday",
        "city": "Tokyo",
        "hotel": "Solaria Nishitetsu Hotel",
        "tagline": "Sumo culture day (Aki basho season)",
        "summary": "September often brings Tokyo’s Autumn Grand Sumo Tournament — a bucket-list cultural experience if tickets are available.",
        "food": "Chanko nabe (sumo stew) in Ryogoku; otherwise classic Tokyo lunch near the arena.",
        "attractions": [
            {
                "title": "Grand Sumo at Ryogoku Kokugikan",
                "subtitle": "Book ahead if possible",
                "badge": "Must-see",
                "body": "If the Autumn tournament is on, spend an afternoon at the stadium — rituals, pageantry, and explosive matches. Even a few hours is unforgettable. If sold out, visit the Sumo Museum area and watch highlights elsewhere.",
            },
            {
                "title": "Ryogoku neighborhood",
                "subtitle": "Sumo stables district · Edo-Tokyo Museum",
                "badge": "Culture",
                "body": "Wander Ryogoku’s sumo-town atmosphere. The Edo-Tokyo Museum (confirm open/status) or nearby history spots deepen the cultural day.",
            },
            {
                "title": "Backup plan if no sumo tickets",
                "subtitle": "Shimokitazawa or Tokyo Disneyland",
                "badge": "Park",
                "body": "Option A: Shimokitazawa for vintage shops and indie cafés. Option B: Tokyo Disneyland as a second park day if you want more rides after DisneySea.",
            },
        ],
        "transport": [
            "Hotel → Ryogoku: ~25–35m by subway.",
            "Return to Ginza area in the evening.",
        ],
        "tips": [
            "Sumo tickets can sell out — check official channels early.",
            "Tournament days run long; afternoon sessions are popular with visitors.",
            "No-show backup keeps the day excellent either way.",
        ],
    },
    {
        "date": "September 24, 2026",
        "weekday": "Thursday",
        "city": "Tokyo",
        "hotel": "Solaria Nishitetsu Hotel",
        "tagline": "Last full day — favorites & shopping",
        "summary": "A flexible finale: revisit a favorite neighborhood, finish gifts, and bookend the trip with something you loved most.",
        "food": "Return to a favorite meal — sushi, ramen, or izakaya. Celebrate the trip.",
        "attractions": [
            {
                "title": "Choose your encore",
                "subtitle": "Build your perfect last day",
                "badge": "Must-see",
                "body": "Ideas: teamLab revisit vibes elsewhere, more Ginza shopping, Meiji/Harajuku again, a cookware finish in Kappabashi, or a calm museum morning (teamLab already done — maybe a craft/whisky tasting or onsen-style spa).",
            },
            {
                "title": "Gift & packing afternoon",
                "subtitle": "KitKat flavors · snacks · last tax-free",
                "badge": "Food",
                "body": "Don Quijote and depachika are excellent for last-minute edible souvenirs. Keep liquids/food rules in mind for flights.",
            },
            {
                "title": "Farewell Tokyo evening",
                "subtitle": "Skyline drink or quiet dinner",
                "badge": "Food",
                "body": "A rooftop/bar with a view, or a quiet sushi counter — your call. Pack tonight so tomorrow morning stays calm.",
            },
        ],
        "transport": [
            "Depends on your encore choice — Ginza base makes many options easy.",
        ],
        "tips": [
            "Confirm Narita transfer timing for tomorrow evening flight.",
            "Set aside passports, tickets, and a personal-item kit tonight.",
            "Don’t overschedule — leave space to enjoy.",
        ],
    },
    {
        "date": "September 25, 2026",
        "weekday": "Friday",
        "city": "Tokyo",
        "hotel": "Departure day",
        "tagline": "Tsukiji morning & Narita departure",
        "summary": "One last Tokyo breakfast at Tsukiji Outer Market, then evening departure from Narita.",
        "food": "Final Tsukiji feast — make it count.",
        "attractions": [
            {
                "title": "Tsukiji Outer Market",
                "subtitle": "Last breakfast in Japan",
                "badge": "Food",
                "body": "Return for a final graze — tamagoyaki, sashimi bowls, grilled seafood. A delicious full-circle goodbye if you loved Day 5.",
            },
            {
                "title": "Hotel · pack · airport transfer",
                "subtitle": "Evening departure from Narita",
                "badge": None,
                "body": "Return to collect luggage, then transfer to Narita with generous buffer. Aim to be at the airport well ahead of your flight (often 22:30-style evening departures need an early-evening leave from central Tokyo).",
            },
        ],
        "transport": [
            "Hotel/Tsukiji → Narita: allow 2.5–3+ hours door-to-gate.",
            "Private transfer is easiest with luggage.",
        ],
        "tips": [
            "Eat first, pack second, airport third.",
            "Keep yen for last snacks and station/airport purchases.",
            "Say goodbye properly — Japan rewards unhurried endings.",
        ],
    },
]

HOTELS = [
    ("Tokyo (first stay)", "Keio Plaza Hotel Tokyo", "Sep 1–9", "Shinjuku"),
    ("Hakone", "Hotel Kajikaso", "Sep 9–10", "Hakone-Yumoto area"),
    ("Kyoto", "Hotel Musse Kyoto Shijo-Kawaramachi Meitetsu", "Sep 10–15", "Kawaramachi"),
    ("Hiroshima", "Daiwa Roynet Hotel Hiroshima", "Sep 15–17", "Central Hiroshima"),
    ("Osaka", "Cross Hotel Osaka", "Sep 17–22", "Namba / Dotonbori"),
    ("Tokyo (return)", "Solaria Nishitetsu Hotel", "Sep 22–25", "Ginza area"),
]

NEW_HIGHLIGHTS = [
    ("Tokyo DisneySea", "Unique-to-Japan Disney park"),
    ("teamLab Planets", "Immersive art must-do"),
    ("Universal Studios Japan", "Nintendo World & coasters"),
    ("Kinkaku-ji", "Golden Pavilion classic"),
    ("Grand Sumo (Sep)", "Cultural bucket-list if tickets allow"),
    ("Food trail", "Tsukiji, Nishiki, Kuromon, Dotonbori"),
]


def esc(s: str) -> str:
    return (
        s.replace("&", "&amp;")
        .replace("<", "&lt;")
        .replace(">", "&gt;")
        .replace('"', "&quot;")
    )


def city_class(city: str) -> str:
    c = city.lower()
    if "hakone" in c:
        return "city-hakone"
    if "kyoto" in c:
        return "city-kyoto"
    if "hiroshima" in c:
        return "city-hiroshima"
    if "osaka" in c:
        return "city-osaka"
    return "city-tokyo"


def badge_html(badge: str | None) -> str:
    if not badge:
        return ""
    cls = {
        "Must-see": "badge-must",
        "Food": "badge-food",
        "Culture": "badge-culture",
        "Park": "badge-park",
    }.get(badge, "badge-must")
    return f'<span class="badge {cls}">{esc(badge)}</span>'


def render_day(day: dict, index: int) -> str:
    n = index + 1
    attractions = "".join(
        f"""
        <div class="attraction">
          <div class="attraction-num">{i:02d}</div>
          <div class="attraction-body">
            <div class="attraction-top">
              <h3>{esc(a['title'])}</h3>
              {badge_html(a.get('badge'))}
            </div>
            <p class="sub">{esc(a['subtitle'])}</p>
            <p>{esc(a['body'])}</p>
          </div>
        </div>
        """
        for i, a in enumerate(day["attractions"], 1)
    )
    transport = "".join(
        f'<li><span class="step-index">{i}</span><span>{esc(t)}</span></li>'
        for i, t in enumerate(day["transport"], 1)
    )
    tips = "".join(f"<li>{esc(t)}</li>" for t in day["tips"])
    food = day.get("food")
    food_block = (
        f"""
        <div class="food-ribbon">
          <div class="food-label">Today’s food focus</div>
          <div class="food-text">{esc(food)}</div>
        </div>
        """
        if food
        else ""
    )
    return f"""
    <section class="day-page {city_class(day['city'])}">
      <div class="day-header">
        <div class="day-meta">
          <span class="day-number">Day {n:02d}</span>
          <span class="day-date">{esc(day['weekday'])} · {esc(day['date'])}</span>
        </div>
        <div class="day-city">{esc(day['city'])}</div>
        <h2>{esc(day['tagline'])}</h2>
        <p class="day-summary">{esc(day['summary'])}</p>
        <div class="hotel-chip"><span class="chip-label">Stay</span>{esc(day['hotel'])}</div>
        {food_block}
      </div>

      <div class="day-grid">
        <div class="col-main">
          <h4 class="section-label">Itinerary</h4>
          {attractions}
        </div>
        <aside class="col-side">
          <div class="side-card transport-card">
            <div class="side-card-head">
              <span class="side-icon transport-icon"></span>
              <h4>Getting around</h4>
            </div>
            <ul class="step-list">{transport}</ul>
          </div>
          <div class="side-card tips-card">
            <div class="side-card-head">
              <span class="side-icon tips-icon"></span>
              <h4>Recommendations</h4>
            </div>
            <ul class="tip-list">{tips}</ul>
          </div>
        </aside>
      </div>
      <div class="page-foot">Haitner Family · Japan 2026 · Day {n:02d} of 25</div>
    </section>
    """


def build_html() -> str:
    overview_rows = "".join(
        f"""
        <tr>
          <td class="td-day">Day {i:02d}</td>
          <td>{esc(d['date'].replace(', 2026', ''))}</td>
          <td>{esc(d['weekday'][:3])}</td>
          <td><span class="pill {city_class(d['city'])}">{esc(d['city'])}</span></td>
          <td>{esc(d['tagline'])}</td>
        </tr>
        """
        for i, d in enumerate(DAYS, 1)
    )
    hotel_cards = "".join(
        f"""
        <div class="hotel-card">
          <div class="hotel-city">{esc(city)}</div>
          <div class="hotel-name">{esc(name)}</div>
          <div class="hotel-meta">{esc(dates)} · {esc(area)}</div>
        </div>
        """
        for city, name, dates, area in HOTELS
    )
    highlight_cards = "".join(
        f"""
        <div class="highlight-card">
          <div class="highlight-title">{esc(title)}</div>
          <div class="highlight-sub">{esc(sub)}</div>
        </div>
        """
        for title, sub in NEW_HIGHLIGHTS
    )
    days_html = "".join(render_day(d, i) for i, d in enumerate(DAYS))

    return f"""<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8" />
<title>Haitner Family — Japan Trip 2026</title>
<link rel="preconnect" href="https://fonts.googleapis.com" />
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
<link href="https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,500;9..144,600;9..144,700&family=Outfit:wght@350;400;500;600;700&display=swap" rel="stylesheet" />
<style>
  :root {{
    --ink: #1a1714;
    --muted: #6a6158;
    --soft: #8a8075;
    --paper: #f4efe6;
    --paper-2: #ebe3d6;
    --white: #fffcf7;
    --line: #ddd2c3;
    --navy: #13233b;
    --navy-2: #1c3354;
    --vermillion: #c44536;
    --gold: #9a7340;
    --gold-soft: #c4a36a;
    --tokyo: #1c3354;
    --hakone: #2f5d50;
    --kyoto: #8b3a2a;
    --hiroshima: #3d4f6f;
    --osaka: #7a4a28;
  }}

  * {{ box-sizing: border-box; }}
  html, body {{
    margin: 0;
    padding: 0;
    background: var(--paper);
    color: var(--ink);
    font-family: "Outfit", sans-serif;
    font-size: 10.2pt;
    font-weight: 400;
    line-height: 1.5;
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
  }}

  h1, h2, h3, .display {{
    font-family: "Fraunces", Georgia, serif;
    font-weight: 600;
    letter-spacing: -0.01em;
  }}

  .page {{
    width: 210mm;
    min-height: 297mm;
    padding: 16mm 16mm 18mm;
    page-break-after: always;
    position: relative;
    overflow: hidden;
  }}

  /* COVER */
  .cover {{
    background:
      radial-gradient(ellipse at 12% 18%, rgba(196,69,54,0.22), transparent 42%),
      radial-gradient(ellipse at 88% 78%, rgba(154,115,64,0.18), transparent 38%),
      linear-gradient(155deg, #0d1728 0%, #17304d 48%, #101c2e 100%);
    color: #f7f2ea;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    padding: 20mm 18mm 18mm;
  }}
  .cover::before {{
    content: "";
    position: absolute;
    inset: 10mm;
    border: 1px solid rgba(247,242,234,0.12);
    pointer-events: none;
  }}
  .cover-top {{
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    font-size: 8.5pt;
    letter-spacing: 0.22em;
    text-transform: uppercase;
    opacity: 0.72;
    position: relative;
    z-index: 1;
  }}
  .cover-seal {{
    width: 46px;
    height: 46px;
    border: 1.5px solid rgba(247,242,234,0.5);
    border-radius: 50%;
    display: grid;
    place-items: center;
    font-family: "Fraunces", serif;
    font-size: 16pt;
    color: #e8b4a0;
  }}
  .cover-main {{ margin-top: 34mm; position: relative; z-index: 1; }}
  .cover-kicker {{
    font-size: 9.5pt;
    letter-spacing: 0.3em;
    text-transform: uppercase;
    color: var(--gold-soft);
    margin-bottom: 16px;
  }}
  .cover h1 {{
    font-size: 58pt;
    line-height: 0.92;
    margin: 0 0 18px;
    font-weight: 600;
    max-width: 8ch;
  }}
  .cover-sub {{
    font-size: 12.5pt;
    max-width: 34ch;
    color: rgba(247,242,234,0.8);
    font-weight: 350;
    line-height: 1.45;
  }}
  .cover-bottom {{
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 12px;
    border-top: 1px solid rgba(247,242,234,0.2);
    padding-top: 16px;
    position: relative;
    z-index: 1;
  }}
  .cover-stat {{
    font-size: 7.5pt;
    letter-spacing: 0.14em;
    text-transform: uppercase;
    opacity: 0.7;
  }}
  .cover-stat strong {{
    display: block;
    font-family: "Fraunces", serif;
    font-size: 17pt;
    font-weight: 600;
    letter-spacing: 0;
    text-transform: none;
    margin-top: 5px;
    color: #fff;
    opacity: 1;
  }}
  .cover-ornament {{
    position: absolute;
    right: -36mm;
    top: 26mm;
    width: 145mm;
    height: 145mm;
    border: 1px solid rgba(224,176,137,0.22);
    border-radius: 50%;
  }}
  .cover-ornament::after {{
    content: "";
    position: absolute;
    inset: 16mm;
    border: 1px solid rgba(224,176,137,0.14);
    border-radius: 50%;
  }}

  /* INTRO PAGES */
  .overview-page h2, .hotels-page h2, .highlights-page h2 {{
    font-size: 28pt;
    margin: 0 0 6px;
    color: var(--navy);
    line-height: 1.05;
  }}
  .lead {{
    color: var(--muted);
    margin: 0 0 12px;
    max-width: 58ch;
    font-size: 10pt;
  }}
  .route-strip {{
    display: flex;
    flex-wrap: wrap;
    gap: 7px;
    margin-bottom: 12px;
  }}
  .route-chip {{
    background: var(--navy);
    color: var(--paper);
    padding: 7px 11px;
    font-size: 8pt;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    font-weight: 500;
  }}
  .route-chip span {{ opacity: 0.45; margin: 0 5px; }}

  table.overview {{
    width: 100%;
    border-collapse: collapse;
    font-size: 7.8pt;
  }}
  table.overview th {{
    text-align: left;
    font-size: 6.8pt;
    letter-spacing: 0.14em;
    text-transform: uppercase;
    color: var(--soft);
    border-bottom: 1.5px solid var(--ink);
    padding: 5px 4px;
    font-weight: 600;
  }}
  table.overview td {{
    padding: 4.8px 4px;
    border-bottom: 1px solid var(--line);
    vertical-align: middle;
  }}
  table.overview tr:nth-child(even) td {{ background: rgba(255,252,247,0.65); }}
  .td-day {{
    font-weight: 600;
    color: var(--vermillion);
    white-space: nowrap;
  }}
  .pill {{
    display: inline-block;
    padding: 2px 7px;
    color: #fff;
    font-size: 7.2pt;
    letter-spacing: 0.05em;
    text-transform: uppercase;
    font-weight: 600;
  }}
  .pill.city-tokyo, .city-tokyo .day-city {{ background: var(--tokyo); }}
  .pill.city-hakone, .city-hakone .day-city {{ background: var(--hakone); }}
  .pill.city-kyoto, .city-kyoto .day-city {{ background: var(--kyoto); }}
  .pill.city-hiroshima, .city-hiroshima .day-city {{ background: var(--hiroshima); }}
  .pill.city-osaka, .city-osaka .day-city {{ background: var(--osaka); }}

  .hotel-grid, .highlight-grid {{
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 11px;
    margin-top: 14px;
  }}
  .hotel-card, .highlight-card {{
    border: 1px solid var(--line);
    background:
      linear-gradient(180deg, var(--white) 0%, #f7f1e7 100%);
    padding: 15px 15px 13px;
    position: relative;
    overflow: hidden;
  }}
  .hotel-card::before, .highlight-card::before {{
    content: "";
    position: absolute;
    left: 0; top: 0; bottom: 0;
    width: 3px;
    background: var(--vermillion);
  }}
  .hotel-city, .highlight-sub {{
    font-size: 7.5pt;
    letter-spacing: 0.16em;
    text-transform: uppercase;
    color: var(--vermillion);
    margin-bottom: 6px;
    font-weight: 600;
  }}
  .hotel-name, .highlight-title {{
    font-family: "Fraunces", serif;
    font-size: 14pt;
    line-height: 1.2;
    margin-bottom: 7px;
    color: var(--navy);
  }}
  .hotel-meta {{
    font-size: 8.8pt;
    color: var(--muted);
  }}

  .notes-box {{
    margin-top: 18px;
    padding: 16px 18px;
    background: linear-gradient(135deg, var(--navy) 0%, var(--navy-2) 100%);
    color: #f6f1e8;
  }}
  .notes-box h3 {{
    margin: 0 0 8px;
    font-size: 15pt;
    color: var(--gold-soft);
  }}
  .notes-box ul {{ margin: 0; padding-left: 16px; }}
  .notes-box li {{ margin-bottom: 4px; font-size: 9.5pt; }}

  /* DAY PAGES */
  .day-page {{
    width: 210mm;
    min-height: 297mm;
    padding: 12mm 14mm 14mm;
    page-break-after: always;
    background:
      radial-gradient(ellipse at 100% 0%, rgba(154,115,64,0.06), transparent 40%),
      linear-gradient(180deg, #fffcf7 0%, var(--paper) 100%);
    display: flex;
    flex-direction: column;
  }}
  .day-header {{
    border-bottom: 1.5px solid rgba(26,23,20,0.85);
    padding-bottom: 11px;
    margin-bottom: 12px;
  }}
  .day-meta {{
    display: flex;
    justify-content: space-between;
    align-items: baseline;
    margin-bottom: 7px;
  }}
  .day-number {{
    font-size: 8.5pt;
    letter-spacing: 0.22em;
    text-transform: uppercase;
    color: var(--vermillion);
    font-weight: 700;
  }}
  .day-date {{
    font-size: 8.5pt;
    color: var(--muted);
    letter-spacing: 0.02em;
  }}
  .day-city {{
    display: inline-block;
    color: #fff;
    padding: 3px 9px;
    font-size: 7.5pt;
    letter-spacing: 0.14em;
    text-transform: uppercase;
    margin-bottom: 7px;
    font-weight: 600;
  }}
  .day-header h2 {{
    margin: 0 0 5px;
    font-size: 22pt;
    line-height: 1.08;
    color: var(--navy);
    max-width: 24ch;
  }}
  .day-summary {{
    margin: 0 0 9px;
    color: var(--muted);
    max-width: 68ch;
    font-size: 9.6pt;
  }}
  .hotel-chip {{
    display: inline-flex;
    align-items: center;
    gap: 8px;
    font-size: 8.3pt;
    color: var(--ink);
    border: 1px solid var(--line);
    padding: 4px 10px;
    background: rgba(255,252,247,0.8);
    margin-bottom: 8px;
  }}
  .chip-label {{
    font-size: 7pt;
    letter-spacing: 0.14em;
    text-transform: uppercase;
    color: var(--gold);
    font-weight: 700;
  }}
  .food-ribbon {{
    display: grid;
    grid-template-columns: auto 1fr;
    gap: 10px;
    align-items: start;
    background: rgba(196,69,54,0.07);
    border: 1px solid rgba(196,69,54,0.16);
    padding: 8px 11px;
  }}
  .food-label {{
    font-size: 7pt;
    letter-spacing: 0.12em;
    text-transform: uppercase;
    color: var(--vermillion);
    font-weight: 700;
    white-space: nowrap;
    padding-top: 1px;
  }}
  .food-text {{
    font-size: 8.8pt;
    color: var(--ink);
    line-height: 1.4;
  }}

  .day-grid {{
    display: grid;
    grid-template-columns: 1.28fr 0.95fr;
    gap: 14px;
    flex: 1;
  }}
  .section-label {{
    margin: 0 0 8px;
    font-size: 7.5pt;
    letter-spacing: 0.18em;
    text-transform: uppercase;
    color: var(--gold);
    font-weight: 700;
  }}
  .attraction {{
    display: grid;
    grid-template-columns: 26px 1fr;
    gap: 8px;
    padding: 8px 0;
    border-bottom: 1px solid var(--line);
  }}
  .attraction:last-child {{ border-bottom: none; }}
  .attraction-num {{
    font-family: "Fraunces", serif;
    font-size: 14pt;
    color: var(--vermillion);
    line-height: 1.1;
    padding-top: 1px;
  }}
  .attraction-top {{
    display: flex;
    align-items: baseline;
    justify-content: space-between;
    gap: 8px;
  }}
  .attraction h3 {{
    margin: 0;
    font-size: 12.2pt;
    color: var(--navy);
    line-height: 1.15;
  }}
  .badge {{
    flex-shrink: 0;
    font-family: "Outfit", sans-serif;
    font-size: 6.5pt;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    font-weight: 700;
    padding: 2px 6px;
    border: 1px solid currentColor;
  }}
  .badge-must {{ color: var(--vermillion); }}
  .badge-food {{ color: #a35a12; }}
  .badge-culture {{ color: #3d5a80; }}
  .badge-park {{ color: #2f5d50; }}
  .attraction .sub {{
    margin: 1px 0 3px;
    font-size: 8pt;
    color: var(--gold);
    letter-spacing: 0.02em;
  }}
  .attraction p {{
    margin: 0;
    color: var(--muted);
    font-size: 8.9pt;
    line-height: 1.42;
  }}

  /* Improved side cards */
  .side-card {{
    background: var(--white);
    border: 1px solid var(--line);
    padding: 0;
    margin-bottom: 11px;
    overflow: hidden;
    box-shadow: 0 1px 0 rgba(26,23,20,0.03);
  }}
  .side-card-head {{
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 9px 12px;
    border-bottom: 1px solid var(--line);
  }}
  .transport-card .side-card-head {{
    background: linear-gradient(90deg, rgba(19,35,59,0.07), transparent 70%);
    border-left: 3px solid var(--navy);
  }}
  .tips-card .side-card-head {{
    background: linear-gradient(90deg, rgba(196,69,54,0.08), transparent 70%);
    border-left: 3px solid var(--vermillion);
  }}
  .side-card h4 {{
    margin: 0;
    font-family: "Outfit", sans-serif;
    font-size: 7.8pt;
    letter-spacing: 0.16em;
    text-transform: uppercase;
    color: var(--navy);
    font-weight: 700;
  }}
  .tips-card h4 {{ color: #8f2f24; }}
  .side-icon {{
    width: 14px;
    height: 14px;
    border-radius: 50%;
    position: relative;
    flex-shrink: 0;
  }}
  .transport-icon {{
    background: var(--navy);
  }}
  .transport-icon::after {{
    content: "";
    position: absolute;
    inset: 4px;
    border-right: 1.5px solid #fff;
    border-bottom: 1.5px solid #fff;
    transform: rotate(-45deg);
    height: 4px;
    width: 4px;
    top: 3px; left: 3px;
  }}
  .tips-icon {{
    background: var(--vermillion);
  }}
  .tips-icon::before, .tips-icon::after {{
    content: "";
    position: absolute;
    left: 6px;
    width: 2px;
    background: #fff;
    border-radius: 1px;
  }}
  .tips-icon::before {{ top: 3px; height: 5px; }}
  .tips-icon::after {{ bottom: 3px; height: 2px; }}

  .step-list, .tip-list {{
    list-style: none;
    margin: 0;
    padding: 10px 12px 11px;
  }}
  .step-list li {{
    display: grid;
    grid-template-columns: 16px 1fr;
    gap: 8px;
    margin-bottom: 8px;
    font-size: 8.3pt;
    line-height: 1.4;
    color: var(--ink);
  }}
  .step-list li:last-child {{ margin-bottom: 0; }}
  .step-index {{
    width: 16px;
    height: 16px;
    border-radius: 50%;
    background: var(--navy);
    color: #fff;
    font-size: 7pt;
    font-weight: 700;
    display: grid;
    place-items: center;
    margin-top: 1px;
  }}
  .tip-list li {{
    position: relative;
    padding-left: 12px;
    margin-bottom: 8px;
    font-size: 8.3pt;
    line-height: 1.4;
    color: var(--ink);
  }}
  .tip-list li:last-child {{ margin-bottom: 0; }}
  .tip-list li::before {{
    content: "";
    position: absolute;
    left: 0;
    top: 6px;
    width: 5px;
    height: 5px;
    background: var(--vermillion);
    border-radius: 1px;
    transform: rotate(45deg);
  }}

  .page-foot {{
    margin-top: 10px;
    padding-top: 7px;
    border-top: 1px solid var(--line);
    font-size: 7.2pt;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    color: var(--soft);
  }}

  @page {{ size: A4; margin: 0; }}
</style>
</head>
<body>

  <section class="page cover">
    <div class="cover-ornament"></div>
    <div class="cover-top">
      <div>Haitner Family Journey</div>
      <div class="cover-seal">日</div>
    </div>
    <div class="cover-main">
      <div class="cover-kicker">Itinerary · Food · Culture · Parks</div>
      <h1>Japan<br/>2026</h1>
      <p class="cover-sub">Twenty-five days across Tokyo, Hakone, Kyoto, Hiroshima, and Osaka — designed for first-timers who love food, culture, and amusement parks.</p>
    </div>
    <div class="cover-bottom">
      <div class="cover-stat">Dates<strong>Sep 1 – 25</strong></div>
      <div class="cover-stat">Days<strong>25</strong></div>
      <div class="cover-stat">Regions<strong>5</strong></div>
      <div class="cover-stat">Nights<strong>24</strong></div>
    </div>
  </section>

  <section class="page overview-page">
    <h2>Trip at a Glance</h2>
    <p class="lead">An expanded first-timer route: more Tokyo to settle in, classic Kyoto temples including the Golden Pavilion, Hiroshima’s remembrance and Miyajima, Osaka’s food and Universal Studios, then a Tokyo finale with sumo season potential.</p>
    <div class="route-strip">
      <div class="route-chip">Tokyo</div>
      <div class="route-chip"><span>→</span>Hakone</div>
      <div class="route-chip"><span>→</span>Kyoto</div>
      <div class="route-chip"><span>→</span>Hiroshima</div>
      <div class="route-chip"><span>→</span>Osaka</div>
      <div class="route-chip"><span>→</span>Tokyo</div>
    </div>
    <table class="overview">
      <thead>
        <tr>
          <th>#</th>
          <th>Date</th>
          <th>Day</th>
          <th>City</th>
          <th>Focus</th>
        </tr>
      </thead>
      <tbody>
        {overview_rows}
      </tbody>
    </table>
  </section>

  <section class="page highlights-page">
    <h2>New & Must-See Highlights</h2>
    <p class="lead">Additions beyond the original spreadsheet — chosen for first-time visitors who want iconic culture, great food, and park days.</p>
    <div class="highlight-grid">
      {highlight_cards}
    </div>
    <div class="notes-box" style="margin-top:22px;">
      <h3>How to use this guide</h3>
      <ul>
        <li>Each day lists the plan, transport steps, and recommendations — follow the order, or swap blocks if weather/energy shifts.</li>
        <li>Badges mark Must-see, Food, Culture, and Park moments so you can prioritize quickly.</li>
        <li>Food ribbons highlight what to eat that day without turning every stop into a restaurant list.</li>
      </ul>
    </div>
  </section>

  <section class="page hotels-page">
    <h2>Hotels & Practical Notes</h2>
    <p class="lead">Same hotel logic as your plan, shifted to Sep 1–25. Confirm exact nightly blocks when you rebook.</p>
    <div class="hotel-grid">
      {hotel_cards}
    </div>
    <div class="notes-box">
      <h3>Before you go</h3>
      <ul>
        <li>Bring passports for tax-free shopping (usually ¥5,000+ at participating stores).</li>
        <li>Comfortable walking shoes are essential almost every day.</li>
        <li>Use luggage forwarding (takkyubin) between cities — especially Tokyo→Kyoto and Kyoto→Osaka.</li>
        <li>Book timed tickets early: DisneySea, teamLab Planets, Universal Studios, and sumo if available.</li>
        <li>September can be warm and rainy; pack a light rain jacket and portable charger.</li>
      </ul>
    </div>
  </section>

  {days_html}

</body>
</html>
"""


def main() -> None:
    html = build_html()
    HTML_PATH.write_text(html, encoding="utf-8")
    print(f"Wrote HTML: {HTML_PATH}")

    with sync_playwright() as p:
        browser = p.chromium.launch()
        page = browser.new_page()
        page.goto(HTML_PATH.as_uri(), wait_until="networkidle")
        # Ensure fonts are applied
        page.evaluate("() => document.fonts.ready")
        page.pdf(
            path=str(PDF_PATH),
            format="A4",
            print_background=True,
            prefer_css_page_size=True,
            margin={"top": "0", "right": "0", "bottom": "0", "left": "0"},
        )
        browser.close()

    print(f"Wrote PDF: {PDF_PATH}")
    print(f"Size: {PDF_PATH.stat().st_size / 1024:.1f} KB")


if __name__ == "__main__":
    main()
