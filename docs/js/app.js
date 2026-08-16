(function () {
  const places = window.PLACES;
  const days = window.DAYS;
  const trip = window.TRIP;
  const storage = window.TripStorage;
  const tools = window.TripTools;
  const checklistData = window.CHECKLIST;

  const FILTER_VIEWS = new Set(["itinerary", "maps", "recs", "detail"]);
  const CITY_CHIP_VIEWS = new Set(["itinerary", "maps", "detail"]);
  const RIBBON_VIEWS = new Set(["itinerary", "detail"]);
  const MASTHEAD_VIEWS = new Set(["itinerary"]);

  const CITY_LOCAL = {
    Seoul: "סיאול",
    Tokyo: "טוקיו",
    Hakone: "הקונה",
    Kawaguchiko: "קוואגוצ׳יקו",
    Kyoto: "קיוטו",
    Osaka: "אוסקה",
    Kobe: "קובה",
    Hiroshima: "הירושימה",
    "Tel Aviv": "תל אביב",
    Bangkok: "בנגקוק",
    Tirana: "טירנה",
    Dubai: "דובאי",
  };

  const WEEKDAY_HE = {
    Sunday: "יום ראשון",
    Monday: "יום שני",
    Tuesday: "יום שלישי",
    Wednesday: "יום רביעי",
    Thursday: "יום חמישי",
    Friday: "יום שישי",
    Saturday: "יום שבת",
  };

  const WEEKDAY_SHORT_HE = {
    Sunday: "א׳",
    Monday: "ב׳",
    Tuesday: "ג׳",
    Wednesday: "ד׳",
    Thursday: "ה׳",
    Friday: "ו׳",
    Saturday: "ש׳",
  };

  const TAG_HE = {
    architecture: "אדריכלות",
    culture: "תרבות",
    food: "אוכל",
    hotel: "מלון",
    icon: "אייקון",
    market: "שוק",
    "must-see": "חובה",
    nature: "טבע",
    neighborhood: "שכונה",
    nightlife: "חיי לילה",
    onsen: "אונסן",
    park: "פארק",
    shopping: "קניות",
    shrine: "מקדש שינטו",
    temple: "מקדש",
    transport: "תחבורה",
    view: "נוף",
  };

  function tagLabel(t) {
    return TAG_HE[t] || t;
  }

  const state = {
    view: "itinerary",
    city: "all",
    query: "",
    dayId: null,
    focusBookingId: null,
    bookingsFilter: "open",
    guideCountry: "kr",
  };

  const els = {
    panels: {
      itinerary: document.getElementById("panel-itinerary"),
      flights: document.getElementById("panel-flights"),
      bookings: document.getElementById("panel-bookings"),
      guide: document.getElementById("panel-guide"),
      maps: document.getElementById("panel-maps"),
      recs: document.getElementById("panel-recs"),
      tools: document.getElementById("panel-tools"),
      detail: document.getElementById("panel-detail"),
    },
    dayList: document.getElementById("day-list"),
    placeList: document.getElementById("place-list"),
    recsRoot: document.getElementById("recs-root"),
    detail: document.getElementById("detail-root"),
    search: document.getElementById("search-input"),
    chips: document.getElementById("city-chips"),
    ribbon: document.getElementById("day-ribbon"),
    topbarFilters: document.getElementById("topbar-filters"),
    topbar: document.getElementById("topbar"),
    masthead: document.getElementById("masthead"),
    bookingsRoot: document.getElementById("bookings-root"),
    guideRoot: document.getElementById("guide-root"),
    flightsRoot: document.getElementById("flights-root"),
    toolsRoot: document.getElementById("tools-root"),
    navButtons: document.querySelectorAll("[data-nav]"),
    resultCount: document.getElementById("result-count"),
    brandMeta: document.getElementById("brand-meta"),
  };

  function escapeHtml(str) {
    return String(str || "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function cityClass(city) {
    return `city-${String(city || "").replace(/\s+/g, "-")}`;
  }

  function cityLocal(city) {
    return CITY_LOCAL[city] || city;
  }

  function isHotelNight(day, index) {
    if (!day || !day.hotelId) return false;
    return Boolean(days[index + 1]);
  }

  function hotelNightsByCity() {
    const nights = {};
    days.forEach((d, i) => {
      if (!isHotelNight(d, i)) return;
      nights[d.city] = (nights[d.city] || 0) + 1;
    });
    return nights;
  }

  function hotelNightsLabel(count) {
    if (!count) return "";
    return `<span class="nights">(${count})</span>`;
  }

  function formatDate(iso) {
    const d = new Date(iso + "T12:00:00");
    return d.toLocaleDateString("he-IL", { day: "numeric", month: "short" });
  }

  function formatDateParts(iso) {
    const d = new Date(iso + "T12:00:00");
    return {
      day: String(d.getDate()),
      month: d.toLocaleDateString("he-IL", { month: "short" }),
      short: `${d.getDate()}.${d.getMonth() + 1}`,
      label: d.toLocaleDateString("he-IL", { weekday: "short", day: "numeric", month: "short" }),
    };
  }

  function weekdayHe(day) {
    return WEEKDAY_HE[day.weekday] || day.weekday;
  }

  function weekdayShortHe(day) {
    return WEEKDAY_SHORT_HE[day.weekday] || day.weekday.slice(0, 3);
  }

  function dayIndex(day) {
    return days.indexOf(day) + 1;
  }

  function mapsLinks(place) {
    const country = place.country || (place.city === "Seoul" ? "KR" : "JP");
    const localName = place.nameJa || place.name;
    const q =
      country === "KR"
        ? `${localName} ${place.name}`
        : place.nameJa
          ? `${place.nameJa} ${place.name}`
          : `${place.name}, ${place.city}, Japan`;
    const encoded = encodeURIComponent(q);
    const localEncoded = encodeURIComponent(localName);
    const google =
      place.lat != null && place.lng != null
        ? `https://www.google.com/maps/search/?api=1&query=${place.lat},${place.lng}`
        : `https://www.google.com/maps/search/?api=1&query=${encoded}`;
    const apple =
      place.lat != null && place.lng != null
        ? `https://maps.apple.com/?ll=${place.lat},${place.lng}&q=${encoded}`
        : `https://maps.apple.com/?q=${encoded}`;

    if (country === "KR") {
      const kakao =
        place.lat != null && place.lng != null
          ? `https://map.kakao.com/link/map/${localEncoded},${place.lat},${place.lng}`
          : `https://map.kakao.com/?q=${localEncoded}`;
      const naver =
        place.lat != null && place.lng != null
          ? `https://map.naver.com/v5/?c=${place.lng},${place.lat},16,0,0,0,dh&query=${localEncoded}`
          : `https://map.naver.com/v5/search/${localEncoded}`;
      return {
        country,
        primary: { href: kakao, label: "Kakao Map" },
        actions: [
          { href: kakao, label: "Kakao Map", primary: true },
          { href: naver, label: "Naver Map" },
          { href: google, label: "Google Maps" },
        ],
      };
    }

    const yahoo =
      place.lat != null && place.lng != null
        ? `https://map.yahoo.co.jp/place?lat=${place.lat}&lon=${place.lng}&zoom=16`
        : `https://map.yahoo.co.jp/search?q=${encoded}`;
    return {
      country,
      primary: { href: yahoo, label: "Yahoo! MAP" },
      actions: [
        { href: yahoo, label: "Yahoo! MAP", primary: true },
        { href: google, label: "Google Maps" },
        { href: apple, label: "Apple Maps" },
      ],
    };
  }

  function matchesQuery(text, query) {
    if (!query) return true;
    return text.toLowerCase().includes(query.toLowerCase());
  }

  function placeSearchBlob(p) {
    return [p.name, p.nameJa, p.city, p.blurb, p.taxiAddress, ...(p.tags || [])].join(" ");
  }

  function daySearchBlob(day) {
    const placeText = day.placeIds.map((id) => placeSearchBlob(places[id] || { name: id })).join(" ");
    const timelineText = (day.timeline || []).map((x) => `${x.title} ${x.note || ""} ${x.category || ""}`).join(" ");
    const transferText = day.transfer ? `${day.transfer.label} ${day.transfer.detail}` : "";
    return [
      day.title,
      day.summary,
      day.food,
      day.city,
      day.weekday,
      day.country,
      placeText,
      timelineText,
      transferText,
      ...(day.tips || []),
      ...(day.transport || []),
    ].join(" ");
  }

  function filteredDays() {
    return days.filter((d) => {
      const cityOk = state.city === "all" || d.city === state.city;
      const qOk = matchesQuery(daySearchBlob(d), state.query);
      return cityOk && qOk;
    });
  }

  function filteredPlaces() {
    return Object.values(places)
      .filter((p) => {
        const placeCity = p.city === "Tel Aviv" ? "Seoul" : p.city;
        const cityOk = state.city === "all" || placeCity === state.city;
        const qOk = matchesQuery(placeSearchBlob(p), state.query);
        return cityOk && qOk;
      })
      .sort((a, b) => a.name.localeCompare(b.name));
  }

  function syncChrome() {
    const showFilters = FILTER_VIEWS.has(state.view);
    const showChips = CITY_CHIP_VIEWS.has(state.view);
    const showRibbon = RIBBON_VIEWS.has(state.view);
    const showMasthead = MASTHEAD_VIEWS.has(state.view) && !state.query && state.city === "all";

    els.topbarFilters.hidden = !showFilters;
    els.chips.hidden = !showChips;
    els.ribbon.hidden = !showRibbon;
    if (els.masthead) els.masthead.classList.toggle("is-compact", !showMasthead);

    const planIntro = document.getElementById("plan-intro");
    if (planIntro) planIntro.classList.toggle("is-hidden", !showMasthead);
    const destIntel = document.getElementById("dest-intel");
    if (destIntel) destIntel.classList.toggle("is-hidden", !showMasthead || state.view !== "itinerary");

    if (els.search) {
      els.search.placeholder =
        state.view === "recs"
          ? "חיפוש המלצות, אזור…"
          : "חיפוש ימים, מקומות, המלצות…";
    }

    els.navButtons.forEach((btn) => {
      const nav = btn.dataset.nav;
      const active = state.view === "detail" ? nav === "itinerary" : nav === state.view;
      btn.classList.toggle("active", active);
      if (active) btn.setAttribute("aria-current", "page");
      else btn.removeAttribute("aria-current");
    });

    requestAnimationFrame(updateTopbarHeight);
  }

  function updateTopbarHeight() {
    if (!els.topbar) return;
    const h = Math.ceil(els.topbar.getBoundingClientRect().height);
    document.documentElement.style.setProperty("--topbar-h", `${h}px`);
  }

  function setChromeMinimized(minimized) {
    if (!els.topbar) return;
    const next = Boolean(minimized);
    if (els.topbar.classList.contains("is-minimized") === next) {
      updateTopbarHeight();
      return;
    }
    els.topbar.classList.toggle("is-minimized", next);
    if (els.ribbon) els.ribbon.classList.toggle("is-minimized", next);
    requestAnimationFrame(updateTopbarHeight);
    // After CSS transition finishes, remeasure sticky offset for the day rail.
    window.setTimeout(updateTopbarHeight, 300);
  }

  function syncScrollChrome() {
    const searchFocused = Boolean(els.search && document.activeElement === els.search);
    const shouldMinimize = !searchFocused && window.scrollY > 48;
    setChromeMinimized(shouldMinimize);
  }

  function setResultCount(text) {
    els.resultCount.textContent = text;
  }

  function renderRibbon() {
    const visible = new Set(filteredDays().map((d) => d.id));
    const groups = [];
    days.forEach((d, i) => {
      const last = groups[groups.length - 1];
      if (!last || last.city !== d.city) {
        groups.push({ city: d.city, items: [{ day: d, index: i }] });
      } else {
        last.items.push({ day: d, index: i });
      }
    });

    els.ribbon.innerHTML = groups
      .map((g) => {
        const anyVisible = g.items.some(({ day }) => visible.has(day.id));
        const dim =
          state.view === "itinerary" && (state.query || state.city !== "all") && !anyVisible
            ? "is-dim"
            : "";
        const nights = g.items.filter(({ day, index }) => isHotelNight(day, index)).length;
        return `<div class="day-group ${cityClass(g.city)} ${dim}">
          <div class="day-group-label">${cityLocal(g.city)}${hotelNightsLabel(nights)}<span class="local">${g.city}</span></div>
          <div class="day-group-days">
            ${g.items
              .map(({ day }) => {
                const active = state.dayId === day.id ? "active" : "";
                const parts = formatDateParts(day.date);
                return `<button type="button" class="day-rail-btn ${active}" data-jump="${day.id}" title="${escapeHtml(parts.label + " · " + day.title)}">
                  <span class="dr-day">${parts.day}</span>
                  <span class="dr-mon">${escapeHtml(parts.month)}</span>
                </button>`;
              })
              .join("")}
          </div>
        </div>`;
      })
      .join("");
  }

  function renderChips() {
    const cities = ["all", ...trip.route.filter((c, i, arr) => arr.indexOf(c) === i)];
    const nightsByCity = hotelNightsByCity();
    els.chips.innerHTML = cities
      .map((c) => {
        if (c === "all") {
          return `<button type="button" class="chip ${state.city === c ? "active" : ""}" data-city="${c}">הכל<span class="chip-local">全体</span></button>`;
        }
        return `<button type="button" class="chip ${state.city === c ? "active" : ""}" data-city="${c}">${cityLocal(c)}${hotelNightsLabel(nightsByCity[c] || 0)}<span class="chip-local">${c}</span></button>`;
      })
      .join("");
  }

  function transferModeHe(mode) {
    const map = {
      flight: "טיסה",
      train: "רכבת",
      bus: "אוטובוס",
      ferry: "מעבורת",
      car: "רכב",
      walk: "הליכה",
    };
    return map[String(mode || "").toLowerCase()] || mode || "העברה";
  }

  function transferHtml(transfer) {
    if (!transfer) return "";
    const flight = (transfer.mode || "") === "flight" ? " is-flight" : "";
    return `<div class="transfer-banner${flight}">
      <div class="tb-mode">${escapeHtml(transferModeHe(transfer.mode))}</div>
      <div class="tb-label">${escapeHtml(transfer.label)}</div>
      <div class="tb-meta">${escapeHtml(transfer.detail)} · ${escapeHtml(transfer.duration)}</div>
    </div>`;
  }

  function placeCardHtml(p) {
    const links = mapsLinks(p);
    const primary = links.actions.find((a) => a.primary) || links.actions[0];
    const secondary = links.actions.filter((a) => a !== primary);
    return `
      <article class="place-card city-accent-${p.city}" data-place="${p.id}">
        <div class="place-card-top">
          <span class="city-pill ${cityClass(p.city)}">${cityLocal(p.city)}</span>
          <span class="place-city-en">${escapeHtml(p.city)}</span>
        </div>
        <h3>${escapeHtml(p.name)}</h3>
        ${p.nameJa ? `<div class="place-ja">${escapeHtml(p.nameJa)}</div>` : ""}
        ${p.blurb ? `<p class="place-blurb">${escapeHtml(p.blurb)}</p>` : ""}
        <div class="tag-row">${(p.tags || []).slice(0, 4).map((t) => `<span class="tag">${tagLabel(t)}</span>`).join("")}</div>
        <div class="maps-actions">
          ${
            primary
              ? `<a class="maps-btn primary" href="${primary.href}" target="_blank" rel="noopener noreferrer">${escapeHtml(primary.label)}</a>`
              : ""
          }
          <div class="maps-secondary">
            ${secondary
              .map(
                (a) =>
                  `<a class="maps-link" href="${a.href}" target="_blank" rel="noopener noreferrer"><span>${escapeHtml(a.label)}</span></a>`
              )
              .join("")}
            <button type="button" class="maps-link" data-copy="${p.id}"><span>העתק שם</span></button>
          </div>
        </div>
      </article>`;
  }

  function allChecklistItems() {
    return checklistData.groups.flatMap((g) => g.items);
  }

  function isCheckinTitle(title) {
    const t = String(title || "").trim();
    return /^(hotel\s+)?check[\s-]?in\b|^צ['׳]ק[\s-]?אין/i.test(t);
  }

  function bookingsForTimelineItem(item) {
    const title = String(item.title || "");
    const hay = `${title} ${item.note || ""}`.toLowerCase();
    const matches = [];
    allChecklistItems().forEach((ci) => {
      const placeLinks = ci.linkPlaceIds || [];
      const titleLinks = ci.linkTitles || [];
      if (!placeLinks.length && !titleLinks.length && !ci.linkCheckin) return;
      let hit = false;
      if (ci.linkCheckin) {
        // Hotels: badge only on actual check-in stops — never bag drops / return-to-hotel.
        if (isCheckinTitle(title) && titleLinks.some((t) => hay.includes(String(t).toLowerCase()))) {
          hit = true;
        }
      } else {
        if (item.placeId && placeLinks.includes(item.placeId)) hit = true;
        if (!hit && titleLinks.some((t) => hay.includes(String(t).toLowerCase()))) hit = true;
      }
      if (hit) matches.push(ci);
    });
    return matches;
  }

  function timelineBookingHtml(item, seenBookingIds) {
    const bookings = bookingsForTimelineItem(item);
    if (!bookings.length) return { html: "", needs: false, open: false };

    const fresh = bookings.filter((b) => !seenBookingIds.has(b.id));
    bookings.forEach((b) => seenBookingIds.add(b.id));
    if (!fresh.length) return { html: "", needs: false, open: false };

    const checked = checklistCheckedMap();
    const openOnes = fresh.filter((b) => !checked[b.id]);
    // One badge only: still-to-book wins over already-booked when both exist (e.g. USJ).
    const primary = openOnes[0] || fresh[0];
    const isDone = openOnes.length === 0;
    const label = isDone ? "הוזמן" : "להזמין מראש";
    const hint = isDone ? "לצפייה בהזמנות" : "לסימון ברשימת ההזמנות";
    const html = `<div class="tl-book-row">
      <a class="tl-book-link ${isDone ? "is-done" : "is-todo"}" href="#bookings" data-open-booking="${escapeHtml(primary.id)}" title="${escapeHtml(hint)}">
        <span class="tl-book-mark" aria-hidden="true">${isDone ? "✓" : "!"}</span>
        <span class="tl-book-label">${label}</span>
      </a>
    </div>`;
    return { html, needs: true, open: !isDone };
  }

  function openBookingsFocus(bookingId) {
    state.focusBookingId = bookingId || null;
    if (bookingId) {
      const checked = checklistCheckedMap();
      if (checked[bookingId]) state.bookingsFilter = "all";
      else state.bookingsFilter = "open";
      const item = allChecklistItems().find((i) => i.id === bookingId);
      if (item && !isOpenCritical(item, checked)) {
        const group = bookingGroupForItem(bookingId);
        if (group) storage.setBookingFold(group.id, true);
      }
    }
    showView("bookings");
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        const id = state.focusBookingId;
        state.focusBookingId = null;
        if (!id) return;
        const el = document.getElementById(`booking-${id}`);
        if (!el) return;
        el.classList.add("booking-flash");
        el.scrollIntoView({ behavior: "smooth", block: "center" });
        window.setTimeout(() => el.classList.remove("booking-flash"), 2200);
      });
    });
  }

  function timelineHtml(day) {
    const items = day.timeline || [];
    const seenBookingIds = new Set();
    return `
      <div class="section-title">לוח זמנים · 日程</div>
      <ol class="timeline">
        ${items
          .map((item, idx) => {
            const place = item.placeId ? places[item.placeId] : null;
            const links = place ? mapsLinks(place) : null;
            const timeLabel = item.end ? `${item.time}–${item.end}` : item.time;
            const done = storage.isCompleted(day.id, item) ? "done" : "";
            const fav = storage.isFavorite(day.id, item) ? "fav" : "";
            const booking = timelineBookingHtml(item, seenBookingIds);
            const isTravel = tools.isTravelItem(item);

            let travelHtml = "";
            if (isTravel) {
              const info = tools.travelInfo(item);
              travelHtml = `
            <li class="timeline-item is-travel travel-mode-${info.type} city-line-${day.city} ${done} ${fav}" data-tl-idx="${idx}">
              <div class="timeline-meta">
                <div class="timeline-time">${escapeHtml(timeLabel)}</div>
              </div>
              <div class="timeline-card travel-card">
                <div class="travel-body">
                  <div class="travel-kicker">
                    ${info.icon}
                    <span class="travel-eyebrow">${escapeHtml(info.label)}</span>
                  </div>
                  <div class="timeline-title travel-mode">${escapeHtml(info.title)}</div>
                  ${info.route ? `<div class="travel-route">${escapeHtml(info.route)}</div>` : ""}
                  ${item.note ? `<p class="timeline-note">${escapeHtml(item.note)}</p>` : ""}
                  ${booking.html}
                  <div class="timeline-actions">
                    ${links ? `<a href="${links.primary.href}" target="_blank" rel="noopener noreferrer">${escapeHtml(links.primary.label)}</a>` : ""}
                    <button type="button" class="${storage.isCompleted(day.id, item) ? "active-ok" : ""}" data-complete="${idx}">${storage.isCompleted(day.id, item) ? "בוצע" : "סיימתי"}</button>
                    <button type="button" class="${storage.isFavorite(day.id, item) ? "active-fav" : ""}" data-fav="${idx}">${storage.isFavorite(day.id, item) ? "שמור" : "שמירה"}</button>
                  </div>
                </div>
              </div>
            </li>`;
            }

            return isTravel
              ? travelHtml
              : `
            <li class="timeline-item city-line-${day.city} ${done} ${fav}" data-tl-idx="${idx}">
              <div class="timeline-meta">
                <div class="timeline-time">${escapeHtml(timeLabel)}</div>
              </div>
              <div class="timeline-card">
                <div class="timeline-title">${escapeHtml(item.title)}</div>
                ${place ? `<div class="timeline-place">${(() => {
                  const kind = tools.placeKindHe(place);
                  const kindBit = kind ? `<span class="place-kind">${escapeHtml(kind)}</span><span class="place-kind-sep"> · </span>` : "";
                  const ja = place.nameJa ? ` · ${escapeHtml(place.nameJa)}` : "";
                  return `${kindBit}<span class="place-name">${escapeHtml(place.name)}</span>${ja}`;
                })()}</div>` : ""}
                ${place && place.blurb ? `<p class="timeline-what">${escapeHtml(place.blurb)}</p>` : ""}
                ${item.note && item.note !== (place && place.blurb) ? `<p class="timeline-note">${escapeHtml(item.note)}</p>` : ""}
                ${booking.html}
                <div class="timeline-actions">
                  ${links ? `<a href="${links.primary.href}" target="_blank" rel="noopener noreferrer">${escapeHtml(links.primary.label)}</a>` : ""}
                  <button type="button" class="${storage.isCompleted(day.id, item) ? "active-ok" : ""}" data-complete="${idx}">${storage.isCompleted(day.id, item) ? "בוצע" : "סיימתי"}</button>
                  <button type="button" class="${storage.isFavorite(day.id, item) ? "active-fav" : ""}" data-fav="${idx}">${storage.isFavorite(day.id, item) ? "שמור" : "שמירה"}</button>
                </div>
              </div>
            </li>`;
          })
          .join("")}
      </ol>`;
  }

  function renderDayList() {
    const list = filteredDays();
    setResultCount(`${list.length} ימים`);
    if (!list.length) {
      els.dayList.innerHTML = `<div class="empty">אין ימים שמתאימים לסינון.</div>`;
      return;
    }
    els.dayList.innerHTML = list
      .map((d) => {
        const parts = formatDateParts(d.date);
        const steps = (d.timeline || []).length;
        return `
          <button type="button" class="day-row ${cityClass(d.city)}" data-day="${d.id}">
            <div class="day-row-num">
              <span class="n">${parts.day}</span>
              <span class="d">${escapeHtml(parts.month)}</span>
            </div>
            <div class="day-row-body">
              <div class="day-row-top">
                <div class="day-row-city">
                  <span class="he">${cityLocal(d.city)}</span>
                  <span class="en">${d.city}</span>
                </div>
                <div class="day-row-meta">
                  <span>${weekdayHe(d)}</span>
                  <span class="dot" aria-hidden="true">·</span>
                  <span>${steps ? `${steps} עצירות` : "—"}</span>
                  
                </div>
              </div>
              <h3>${escapeHtml(d.title)}</h3>
              <p>${escapeHtml(d.summary)}</p>
            </div>
          </button>`;
      })
      .join("");
  }

  function placesByCity(list) {
    const order = trip.route.filter((c, i, arr) => arr.indexOf(c) === i);
    const groups = new Map();
    list.forEach((p) => {
      // Departure airport only — don't surface Tel Aviv as a trip city.
      const city = p.city === "Tel Aviv" ? "Seoul" : p.city;
      if (!groups.has(city)) groups.set(city, []);
      groups.get(city).push(p);
    });
    const ordered = [];
    order.forEach((city) => {
      if (groups.has(city)) {
        ordered.push({ city, items: groups.get(city) });
        groups.delete(city);
      }
    });
    [...groups.keys()]
      .sort((a, b) => a.localeCompare(b))
      .forEach((city) => ordered.push({ city, items: groups.get(city) }));
    return ordered;
  }

  function placesGroupedHtml(list) {
    if (!list.length) return `<div class="empty">אין מקומות שמתאימים לסינון.</div>`;
    const groups = placesByCity(list);
    const openCity = state.city !== "all" ? state.city : groups[0] && groups[0].city;
    return `
      <div class="places-by-city">
        ${groups
          .map((g) => {
            const open = g.city === openCity ? "open" : "";
            return `
          <details class="city-fold ${cityClass(g.city)}" data-city-fold="${g.city}" ${open}>
            <summary class="city-fold-summary">
              <span class="city-fold-label">
                <span class="en">${cityLocal(g.city)}</span>
                <span class="local">${g.city}</span>
              </span>
              <span class="city-fold-meta">
                <span class="count">${g.items.length}</span>
                <span class="chev" aria-hidden="true"></span>
              </span>
            </summary>
            <div class="places-grid city-fold-body">
              ${g.items.map(placeCardHtml).join("")}
            </div>
          </details>`;
          })
          .join("")}
      </div>`;
  }

  function ensureMapsShell() {
    let mapEl = document.getElementById("journey-map");
    let legend = document.getElementById("journey-legend");
    let placesHost = document.getElementById("places-host");
    if (mapEl && legend && placesHost) {
      return { mapEl, legend, placesHost };
    }

    els.placeList.innerHTML = `
      <section class="journey-section">
        <div class="journey-head">
          <div>
            <p class="plan-kicker">מפות · 地図</p>
            <h2 class="plan-title">עקבו אחרי המסלול</h2>
            <p class="journey-sub">הימים מוצגים בסדר כרונולוגי. לחצו על סימון או עצירה כדי לפתוח את היום.</p>
          </div>
        </div>
        <div class="journey-layout">
          <div id="journey-map" class="journey-map" role="img" aria-label="מפת ימי הטיול לפי סדר"></div>
          <ol id="journey-legend" class="journey-legend"></ol>
        </div>
      </section>
      <div class="places-all-head">
        <div class="section-title">כל המקומות · 場所</div>
        <p class="journey-sub">מקובצים לפי עיר — פתחו עיר כדי לדפדף במקומות שלה.</p>
      </div>
      <div id="places-host"></div>
    `;

    mapEl = document.getElementById("journey-map");
    legend = document.getElementById("journey-legend");
    placesHost = document.getElementById("places-host");

    if (legend) {
      legend.onclick = (e) => {
        const btn = e.target.closest("[data-jump-day]");
        if (!btn) return;
        const id = btn.dataset.jumpDay;
        if (window.JourneyMap) window.JourneyMap.focusDay(id, days, places);
      };
    }

    return { mapEl, legend, placesHost };
  }

  function renderMaps() {
    const list = filteredPlaces();
    const { mapEl, placesHost } = ensureMapsShell();
    const stopCount = window.JourneyMap
      ? window.JourneyMap.buildStops(days, places, state.city).length
      : 0;
    setResultCount(`${stopCount} עצירות`);

    if (placesHost) placesHost.innerHTML = placesGroupedHtml(list);

    if (mapEl && window.JourneyMap && window.L) {
      window.JourneyMap.render(mapEl, days, places, {
        city: state.city,
        onOpenDay: (id) => openDay(id),
      });
    }
  }

  function renderRecs() {
    if (!window.Recommendations || !els.recsRoot) {
      setResultCount("—");
      return;
    }
    const result = window.Recommendations.render(els.recsRoot, { query: state.query });
    setResultCount(result.count ? `${result.count} המלצות` : "—");
  }

  function renderDetail(dayId) {
    const day = days.find((d) => d.id === dayId);
    if (!day) return;
    const parts = formatDateParts(day.date);
    const hotel = day.hotelId ? places[day.hotelId] : null;
    const dayPlaces = day.placeIds.map((id) => places[id]).filter(Boolean);
    const local = cityLocal(day.city);

    els.detail.innerHTML = `
      <button type="button" class="detail-back" id="back-btn">חזרה למסלול</button>
      ${transferHtml(day.transfer)}
      <div class="detail-hero ${cityClass(day.city)}">
        <div class="detail-hero-top">
          <span class="day-num">${parts.day} ${escapeHtml(parts.month)}</span>
          <span class="city-en">${local}</span>
          <span class="city-local">${day.city}</span>
          <span class="day-num">${weekdayHe(day)}</span>
        </div>
        <div class="detail-hero-grid">
          <div>
            <h2>${escapeHtml(day.title)}</h2>
            <div class="detail-meta">${escapeHtml(day.summary)}</div>
            ${
              hotel
                ? `<div class="tag-row" style="margin-top:16px"><span class="tag">לינה · ${escapeHtml(hotel.name)}</span></div>`
                : day.city !== "Seoul"
                  ? `<div class="tag-row" style="margin-top:16px"><span class="tag tag-warn">לינה · עדיין לא הוזמן</span></div>`
                  : ""
            }
          </div>
          ${day.food ? `<div class="food-banner"><strong>אוכל היום</strong><span>${escapeHtml(day.food)}</span></div>` : ""}
        </div>
      </div>
      <div class="detail-layout">
        <div>
          ${timelineHtml(day)}
        </div>
        <div>
          <div class="side-block">
            <div class="side-block-head">איך מגיעים</div>
            <ol>${(day.transport || []).map((t) => `<li>${escapeHtml(t)}</li>`).join("")}</ol>
          </div>
          ${
            (day.tips || []).length
              ? `<div class="side-block">
            <div class="side-block-head">המלצות</div>
            <ul>${day.tips.map((t) => `<li>${escapeHtml(t)}</li>`).join("")}</ul>
          </div>`
              : ""
          }
        </div>
      </div>
      <section class="places-section">
        <div class="section-title">מקומות · 場所</div>
        <div class="places-grid">${dayPlaces.map((p) => placeCardHtml(p)).join("")}</div>
      </section>
    `;
    setResultCount(`${parts.day} ${parts.month}`);
  }

  function checklistCheckedMap() {
    const stored = storage.getChecklist();
    const map = { ...stored };
    checklistData.groups.forEach((g) => {
      g.items.forEach((item) => {
        if (!(item.id in map) && item.done) map[item.id] = true;
      });
    });
    return map;
  }

  const BOOKING_PRIORITY = { critical: 0, high: 1, medium: 2, low: 3 };

  function bookingWhenStamp(item) {
    const when = String(item.when || "");
    if (/עכשיו/.test(when)) return 0;
    const m = when.match(/(\d{1,2})\s*\/\s*(\d{1,2})/);
    if (m) return Number(m[2]) * 32 + Number(m[1]);
    if (/לפני/.test(when)) return 1;
    return 900;
  }

  function bookingUrgencyStamp(item) {
    const blob = `${item.when || ""} ${item.window || ""}`;
    if (/עכשיו/.test(blob)) return 0;
    if (/לטפל/.test(blob)) return 1;
    if (/בהקדם|ברגע שנפתח/.test(blob)) return 2;
    return 10;
  }

  function sortBookingItems(items, checked) {
    return [...items].sort((a, b) => {
      const doneA = checked[a.id] ? 1 : 0;
      const doneB = checked[b.id] ? 1 : 0;
      if (doneA !== doneB) return doneA - doneB;
      const pa = BOOKING_PRIORITY[a.priority] ?? 2;
      const pb = BOOKING_PRIORITY[b.priority] ?? 2;
      if (pa !== pb) return pa - pb;
      const ua = bookingUrgencyStamp(a);
      const ub = bookingUrgencyStamp(b);
      if (ua !== ub) return ua - ub;
      return bookingWhenStamp(a) - bookingWhenStamp(b);
    });
  }

  function isOpenCritical(item, checked) {
    return item.priority === "critical" && !checked[item.id];
  }

  function bookingGroupForItem(itemId) {
    return checklistData.groups.find((g) => g.items.some((item) => item.id === itemId)) || null;
  }

  function snapshotBookingFolds() {
    if (!els.bookingsRoot) return;
    els.bookingsRoot.querySelectorAll("details[data-booking-group]").forEach((d) => {
      storage.setBookingFold(d.getAttribute("data-booking-group"), d.open);
    });
  }

  const BOOKING_KIND_HE = {
    document: "מסמך",
    flight: "טיסה",
    hotel: "מלון",
    ryokan: "ריוקאן",
    train: "רכבת",
    bus: "אוטובוס",
    attraction: "אטרקציה",
    meal: "ארוחה",
    clinic: "טיפול",
  };

  function bookingKindLabel(item) {
    return BOOKING_KIND_HE[item.kind] || "";
  }

  function bookingItemHtml(item, checked) {
    const done = !!checked[item.id];
    const critical = item.priority === "critical" && !done;
    const kind = bookingKindLabel(item);
    const meta = [item.when, item.window].filter(Boolean).join(" · ");
    return `
      <label id="booking-${escapeHtml(item.id)}" class="booking-item${done ? " done" : ""}${critical ? " booking-critical" : ""}">
        <input type="checkbox" data-check="${item.id}" ${done ? "checked" : ""} />
        <span class="booking-body">
          <span class="booking-top">
            ${kind ? `<span class="booking-kind">${escapeHtml(kind)}</span>` : ""}
            <span class="booking-label">${escapeHtml(item.label)}</span>
            ${critical ? `<span class="booking-flag">דחוף</span>` : ""}
            ${done ? `<span class="booking-flag is-done">הוזמן</span>` : ""}
          </span>
          ${item.note ? `<span class="booking-note">${escapeHtml(item.note)}</span>` : ""}
          ${meta ? `<span class="booking-meta">${escapeHtml(meta)}</span>` : ""}
        </span>
      </label>`;
  }

  function bookingGroupHtml(opts) {
    const { id, title, items, checked, open, urgent } = opts;
    const openInGroup = items.filter((item) => !checked[item.id]).length;
    const countLabel = urgent
      ? `${items.length} לסגור`
      : openInGroup
        ? `${openInGroup} פתוחים`
        : "הכול סגור";
    const list = sortBookingItems(items, checked)
      .map((item) => bookingItemHtml(item, checked))
      .join("");
    if (urgent) {
      return `
        <section class="booking-group is-urgent">
          <header class="booking-group-head is-static">
            <span class="booking-group-title">${escapeHtml(title)}</span>
            <span class="booking-group-meta"><span>${escapeHtml(countLabel)}</span></span>
          </header>
          <div class="booking-group-list">${list}</div>
        </section>`;
    }
    return `
      <details class="booking-group" data-booking-group="${escapeHtml(id)}"${open ? " open" : ""}>
        <summary class="booking-group-head">
          <span class="booking-group-title">${escapeHtml(title)}</span>
          <span class="booking-group-meta">
            <span>${escapeHtml(countLabel)}</span>
            <span class="chev" aria-hidden="true"></span>
          </span>
        </summary>
        <div class="booking-group-list">${list}</div>
      </details>`;
  }

  function renderBookings() {
    const checked = checklistCheckedMap();
    const allItems = allChecklistItems();
    const doneCount = allItems.filter((i) => checked[i.id]).length;
    const openCount = allItems.length - doneCount;
    const filter = state.bookingsFilter === "all" ? "all" : "open";
    const folds = storage.getBookingFolds();
    const focusId = state.focusBookingId;

    const urgentItems = sortBookingItems(
      allItems.filter((item) => isOpenCritical(item, checked)),
      checked
    );
    const urgentIds = new Set(urgentItems.map((item) => item.id));

    const groups = [...checklistData.groups]
      .map((g) => {
        const items = g.items.filter((item) => {
          if (filter !== "all" && checked[item.id]) return false;
          if (urgentIds.has(item.id)) return false;
          return true;
        });
        const minOpen = Math.min(
          ...g.items
            .filter((item) => !checked[item.id])
            .map((item) => BOOKING_PRIORITY[item.priority] ?? 2),
          50
        );
        return { g, items, minOpen };
      })
      .filter((row) => row.items.length)
      .sort((a, b) => a.minOpen - b.minOpen || a.g.title.localeCompare(b.g.title, "he"));

    const urgentHtml = urgentItems.length
      ? bookingGroupHtml({
          id: "urgent",
          title: "דחוף עכשיו",
          items: urgentItems,
          checked,
          open: true,
          urgent: true,
        })
      : "";

    const groupsHtml = groups
      .map(({ g, items }) => {
        const focusedHere = focusId && items.some((item) => item.id === focusId);
        const open = focusedHere || folds[g.id] === true;
        return bookingGroupHtml({ id: g.id, title: g.title, items, checked, open, urgent: false });
      })
      .join("");

    const body = urgentHtml + groupsHtml;

    els.bookingsRoot.innerHTML = `
      <div class="plan-intro">
        <p class="plan-kicker">הזמנות · 予約</p>
        <h2 class="plan-title">הזמנות</h2>
        <p class="plan-lead">טיסות, מלונות, כרטיסי אטרקציות, רכבות ארוכות וסעודות שדורשות הזמנה מראש.</p>
      </div>
      <div class="bookings-toolbar">
        <p class="bookings-count"><strong>${openCount}</strong> נשארו לסגור${doneCount ? ` · ${doneCount} כבר הוזמנו` : ""}</p>
        <div class="bookings-filters" role="tablist" aria-label="סינון הזמנות">
          <button type="button" class="bookings-filter${filter === "open" ? " is-on" : ""}" data-bookings-filter="open">פתוחים</button>
          <button type="button" class="bookings-filter${filter === "all" ? " is-on" : ""}" data-bookings-filter="all">הכול</button>
        </div>
      </div>
      <div class="bookings-list">
        ${
          body ||
          `<p class="bookings-empty">אין הזמנות פתוחות.</p>`
        }
      </div>`;
    setResultCount(`${openCount} פתוחים`);
  }

  function renderGuide() {
    const Guide = window.TripGuide;
    if (!Guide || !els.guideRoot) return;
    Guide.render(els.guideRoot, { country: state.guideCountry || "kr" });
    const label = state.guideCountry === "kr" ? "קוריאה" : "יפן";
    setResultCount(label);
  }


  function sectionStage(opts) {
    const {
      theme = "days",
      seal = "旅",
      kicker = "",
      title = "",
      lead = "",
      pills = [],
      labels = [],
      motif = "",
      route = "",
      aria = title,
    } = opts;
    const pillsHtml = pills.length
      ? `<div class="sec-pills">${pills
          .map(
            (p) =>
              `<div class="sec-pill"><em>${escapeHtml(String(p.em))}</em><span>${escapeHtml(p.span)}</span></div>`
          )
          .join("")}</div>`
      : "";
    const labelsHtml =
      !route && labels.length
        ? `<div class="sec-route-labels" dir="ltr" aria-hidden="true">${labels
            .map((l) => `<span>${escapeHtml(l)}</span>`)
            .join("")}</div>`
        : "";
    return `
      <section class="sec-stage theme-${escapeHtml(theme)}" aria-label="${escapeHtml(aria)}">
        <div class="sec-stage-bg" aria-hidden="true">
          <div class="sec-stage-wash"></div>
          <div class="sec-stage-grid"></div>
          ${motif}
        </div>
        <div class="sec-stage-content">
          <div class="sec-seal" aria-hidden="true"><span>${escapeHtml(seal)}</span></div>
          <p class="sec-kicker">${kicker}</p>
          <h2 class="sec-title">${title}</h2>
          <p class="sec-lead">${lead}</p>
          ${pillsHtml}
          ${labelsHtml}
        </div>
        ${route}
      </section>`;
  }

  function flightRouteHtml(labels) {
    const codes = labels.length ? labels : ["TLV", "ICN", "NRT", "DXB", "TIA"];
    const n = codes.length;
    const W = 1000;
    const H = 88;
    const padX = 28;
    const pts = codes.map((_, i) => {
      const t = n === 1 ? 0.5 : i / (n - 1);
      const x = padX + t * (W - padX * 2);
      const y = 44 + Math.sin(t * Math.PI) * -22 + (i % 2 === 0 ? 6 : -6);
      return { x: Number(x.toFixed(1)), y: Number(y.toFixed(1)) };
    });
    let d = `M${pts[0].x} ${pts[0].y}`;
    for (let i = 1; i < pts.length; i++) {
      const a = pts[i - 1];
      const b = pts[i];
      const dx = b.x - a.x;
      d += ` C ${a.x + dx * 0.35} ${a.y}, ${b.x - dx * 0.35} ${b.y}, ${b.x} ${b.y}`;
    }
    const dots = pts
      .map((p) => {
        const left = `${((p.x / W) * 100).toFixed(2)}%`;
        const top = `${((p.y / H) * 100).toFixed(1)}%`;
        return `<span class="sec-flight-dot" style="left:${left};top:${top}"></span>`;
      })
      .join("");
    const stops = codes
      .map((code, i) => {
        const left = `${((pts[i].x / W) * 100).toFixed(2)}%`;
        return `<span class="sec-flight-code" style="left:${left}">${escapeHtml(code)}</span>`;
      })
      .join("");
    return `
      <div class="sec-flight-route" dir="ltr" aria-hidden="true">
        <div class="sec-flight-route-track">
          <svg class="sec-flight-route-svg" viewBox="0 0 ${W} ${H}" preserveAspectRatio="none">
            <path class="sec-motif-line" d="${d}" fill="none" />
          </svg>
          <div class="sec-flight-dots">${dots}</div>
          <div class="sec-flight-plane" aria-hidden="true">✈</div>
        </div>
        <div class="sec-flight-stops">${stops}</div>
      </div>`;
  }

  function motifFlights() {
    return "";
  }

  function flightStatusHe(status) {
    if (status === "booked") return "הוזמן";
    if (status === "todo") return "לטפל";
    return status || "";
  }

  function formatFlightDate(iso) {
    if (!iso) return "";
    const d = new Date(iso + "T12:00:00");
    return d.toLocaleDateString("he-IL", { weekday: "short", day: "numeric", month: "short" });
  }

  function flightMinutes(hhmm) {
    const m = String(hhmm || "").match(/^(\d{1,2}):(\d{2})$/);
    if (!m) return null;
    return Number(m[1]) * 60 + Number(m[2]);
  }

  function layoverMinutes(prev, next) {
    const arr = flightMinutes(prev && prev.arrive);
    const dep = flightMinutes(next && next.depart);
    if (arr == null || dep == null) return null;
    let mins = dep - arr;
    const arrDate = prev.arriveDate || prev.date;
    const depDate = next.date;
    if (arrDate && depDate) {
      const a = new Date(arrDate + "T12:00:00");
      const b = new Date(depDate + "T12:00:00");
      mins += Math.round((b - a) / 86400000) * 24 * 60;
    } else if (mins < 0) {
      mins += 24 * 60;
    }
    return mins >= 0 ? mins : null;
  }

  function formatWaitHe(mins) {
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    if (h && m) return h === 1 ? `שעה ו־${m} דקות` : `${h} שעות ו־${m} דקות`;
    if (h) return h === 1 ? "שעה" : `${h} שעות`;
    return `${m} דקות`;
  }

  function formatLegDuration(f) {
    const raw = f.duration || f.note || "";
    const match = String(raw).match(/~(\d+)\s*h\s*(\d*)/i);
    if (!match) return "";
    return match[2] ? `~${match[1]}H${match[2]}` : `~${match[1]}H`;
  }

  function renderFlights() {
    const flights = trip.flights || [];
    const booked = flights.filter((f) => f.status === "booked").length;
    const todo = flights.filter((f) => f.status !== "booked").length;

    const journeys = [];
    const seen = new Set();
    flights.forEach((f) => {
      const key = f.journey || f.id;
      if (seen.has(key)) return;
      seen.add(key);
      journeys.push({
        id: key,
        label: f.journeyLabel || f.note || key,
        status: f.status,
        dayId: f.dayId,
        legs: flights.filter((x) => (x.journey || x.id) === key),
      });
    });

    const meta = {
      outbound: {
        he: "יציאה",
        en: "DEPARTURE",
        jp: "出発",
        from: "TLV",
        to: "ICN",
        blurb: "Ethiopian · דרך אדיס אבבה",
      },
      "seoul-tokyo": {
        he: "מעבר",
        en: "TRANSFER",
        jp: "乗継",
        from: "ICN",
        to: "NRT",
        blurb: "Air Premia · סיאול לטוקיו",
      },
      "tokyo-tirana": {
        he: "חזרה",
        en: "RETURN",
        jp: "帰国",
        from: "NRT",
        to: "TIA",
        blurb: "אמירייטס · מנריטה לדובאי לטירנה",
      },
    };

    const flightCodes = (legs) =>
      legs
        .map((l) => l.flight)
        .filter((c) => c && c !== "—" && c !== "TBD")
        .join(" · ") || "TBD";

    const stage = sectionStage({
      theme: "flights",
      seal: "旅",
      kicker: "טיסות · フライト · BOARDING",
      title: "מסלול האוויר שלנו",
      lead: "מתל אביב לסיאול, לטוקיו, לטירנה (דרך דובאי) · כרטיסים וסטטוס במבט אחד.",
      pills: [
        { em: booked, span: "הוזמנו" },
        { em: todo, span: "לטפל" },
        { em: journeys.length, span: "מקטעים" },
      ],
      labels: ["TLV", "ICN", "NRT", "DXB", "TIA"],
      route: flightRouteHtml(["TLV", "ICN", "NRT", "DXB", "TIA"]),
      motif: "",
      aria: "סיכום טיסות",
    });

    els.flightsRoot.innerHTML = `
      ${stage}

      <div class="fx-passes">
        ${journeys
          .map((j, idx) => {
            const status = j.legs.every((l) => l.status === "booked")
              ? "booked"
              : j.legs.some((l) => l.status === "booked")
                ? "partial"
                : "todo";
            const statusLabel =
              status === "booked" ? "הוזמן" : status === "partial" ? "חלקי" : "לטפל";
            const m = meta[j.id] || {
              he: j.label,
              en: "FLIGHT",
              jp: "便",
              from: "—",
              to: "—",
              blurb: "",
            };
            const codes = flightCodes(j.legs);
            return `
          <article class="fx-pass status-${status}" style="--d:${0.08 + idx * 0.1}s">
            <div class="fx-pass-stub">
              <div class="fx-pass-stub-top">
                <span class="fx-pass-jp">${escapeHtml(m.jp)}</span>
                <span class="fx-pass-en">${escapeHtml(m.en)}</span>
              </div>
              <div class="fx-pass-stub-num">${String(idx + 1).padStart(2, "0")}</div>
              <div class="fx-stamp ${status}">${escapeHtml(statusLabel)}</div>
            </div>
            <div class="fx-pass-body">
              <header class="fx-pass-head">
                <div>
                  <p class="fx-pass-kicker">${escapeHtml(m.he)} · ${escapeHtml(m.blurb)}</p>
                  <h3>מ־${escapeHtml(m.from)} ל־${escapeHtml(m.to)}</h3>
                  <p class="fx-pass-flightno" dir="ltr">
                    <span class="fx-pass-flightno-label">Flight</span>
                    <strong>${escapeHtml(codes)}</strong>
                  </p>
                </div>
                ${
                  j.dayId
                    ? `<button type="button" class="fx-pass-link" data-open-day="${j.dayId}">למסלול</button>`
                    : ""
                }
              </header>

              <div class="fx-pass-legs">
                ${j.legs
                  .map((f, li) => {
                    const prev = li > 0 ? j.legs[li - 1] : null;
                    const waitMins = prev ? layoverMinutes(prev, f) : null;
                    const nextDay = f.arriveDate && f.arriveDate !== f.date;
                    const arriveLabel = f.arrive || "—";
                    const statusChip = f.status === "booked" ? "הוזמן" : "לטפל";
                    const duration = formatLegDuration(f);
                    const footBits = [f.terminal, f.aircraft, f.cabin].filter(Boolean);
                    const waitHtml =
                      waitMins != null
                        ? `<div class="fx-connect" dir="rtl">
                            <span class="fx-connect-kicker">המתנה בשדה</span>
                            <strong>${escapeHtml(formatWaitHe(waitMins))}</strong>
                            <span class="fx-connect-place">${escapeHtml(f.fromName || f.from)} · ${escapeHtml(f.from)}</span>
                          </div>`
                        : "";
                    return `
                  ${waitHtml}
                  <article class="fx-leg${f.status !== "booked" ? " is-todo" : ""}" dir="ltr">
                    <header class="fx-leg-top">
                      <div class="fx-leg-id">
                        <strong>${escapeHtml(f.flight || "TBD")}</strong>
                        <span>${escapeHtml(f.airline || "Airline TBD")}</span>
                      </div>
                      <div class="fx-leg-badges">
                        ${j.legs.length > 1 ? `<span class="fx-leg-badge">LEG ${li + 1}</span>` : ""}
                        <span class="fx-leg-status ${f.status === "booked" ? "is-booked" : "is-todo"}">${escapeHtml(statusChip)}</span>
                      </div>
                    </header>

                    <div class="fx-leg-route">
                      <div class="fx-leg-end">
                        <em>${escapeHtml(f.from)}</em>
                        <span class="fx-leg-city">${escapeHtml(f.fromName || "")}</span>
                        <strong>${escapeHtml(f.depart || "—")}</strong>
                        <span class="fx-leg-date">${escapeHtml(formatFlightDate(f.date))}</span>
                      </div>
                      <div class="fx-leg-mid" aria-hidden="true">
                        ${duration ? `<span class="fx-leg-dur">${escapeHtml(duration)}</span>` : `<span class="fx-leg-dur fx-leg-dur-empty">&nbsp;</span>`}
                        <div class="fx-leg-track">
                          <span class="fx-leg-track-line"></span>
                          <span class="fx-leg-plane">
                            <svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M21 16v-2l-8-5V3.5A1.5 1.5 0 0 0 11.5 2 1.5 1.5 0 0 0 10 3.5V9L2 14v2l8-2.5V19l-2 1.5V22l3.5-1 3.5 1v-1.5L13 19v-5.5z"/></svg>
                          </span>
                        </div>
                        ${nextDay ? `<span class="fx-leg-plus">+1 DAY</span>` : `<span class="fx-leg-plus fx-leg-plus-empty">&nbsp;</span>`}
                      </div>
                      <div class="fx-leg-end is-arr">
                        <em>${escapeHtml(f.to)}</em>
                        <span class="fx-leg-city">${escapeHtml(f.toName || "")}</span>
                        <strong>${escapeHtml(arriveLabel)}</strong>
                        <span class="fx-leg-date">${escapeHtml(formatFlightDate(f.arriveDate || f.date))}</span>
                      </div>
                    </div>

                    ${
                      footBits.length
                        ? `<footer class="fx-leg-foot">${footBits
                            .map((bit) => `<span>${escapeHtml(bit)}</span>`)
                            .join("")}</footer>`
                        : ""
                    }
                  </article>`;
                  })
                  .join("")}
              </div>
            </div>
          </article>`;
          })
          .join("")}
      </div>
      <p class="flights-footnote">השעות לפי לוח מפורסם — תמיד לאשר מול הכרטיס / כרטיס עלייה למטוס.</p>`;

    setResultCount(`${booked} הוזמנו · ${todo} לטפל`);
  }

  function renderTools() {
    els.toolsRoot.innerHTML = `
      <div class="plan-intro">
        <p class="plan-kicker">כלים · 便利</p>
        <h2 class="plan-title">הערכה לדרך</h2>
      </div>
      <div class="tools-actions">
        <button type="button" class="btn-primary" id="open-tips">טיפים לתחבורה</button>
        <button type="button" class="btn-ghost" id="open-guide-tab">מדריך למדינה</button>
        <button type="button" class="btn-ghost" id="open-flights-tab">לטיסות</button>
      </div>
      <div id="fx-root"></div>
      <div id="taxi-root" style="margin-top:12px"></div>`;
    tools.renderConverter(document.getElementById("fx-root"));
    tools.renderTaxiCards(document.getElementById("taxi-root"), places);
    const goFlights = document.getElementById("open-flights-tab");
    if (goFlights) goFlights.addEventListener("click", () => showView("flights"));
    const goGuide = document.getElementById("open-guide-tab");
    if (goGuide) goGuide.addEventListener("click", () => showView("guide"));
    setResultCount("כלים");
  }

  function applyPanelVisibility() {
    Object.entries(els.panels).forEach(([key, el]) => {
      if (!el) return;
      const on = key === state.view;
      el.classList.toggle("active", on);
      el.hidden = !on;
    });
  }

  function showView(view) {
    if (!els.panels[view] && view !== "detail") return;
    state.view = view;
    if (view !== "detail") state.dayId = null;
    applyPanelVisibility();
    syncChrome();
    render();
    if (view === "maps" && window.JourneyMap && typeof window.JourneyMap.invalidate === "function") {
      requestAnimationFrame(() => window.JourneyMap.invalidate());
    }
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function openDay(dayId) {
    const day = days.find((d) => d.id === dayId);
    if (!day) return;
    state.dayId = dayId;
    state.view = "detail";
    applyPanelVisibility();
    syncChrome();
    renderRibbon();
    renderDetail(dayId);
    const pill = els.ribbon.querySelector(`[data-jump="${dayId}"]`);
    if (pill) pill.scrollIntoView({ inline: "center", block: "nearest", behavior: "smooth" });
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function render() {
    renderChips();
    if (RIBBON_VIEWS.has(state.view)) renderRibbon();

    if (state.view === "itinerary") renderDayList();
    else if (state.view === "flights") renderFlights();
    else if (state.view === "maps") renderMaps();
    else if (state.view === "recs") renderRecs();
    else if (state.view === "bookings") renderBookings();
    else if (state.view === "guide") renderGuide();
    else if (state.view === "tools") renderTools();
    else if (state.view === "detail" && state.dayId) renderDetail(state.dayId);

    syncChrome();
  }

  function bind() {
    let searchTimer = null;
    els.search.addEventListener("input", (e) => {
      const value = e.target.value.trim();
      clearTimeout(searchTimer);
      searchTimer = setTimeout(() => {
        state.query = value;
        if (state.view === "detail") showView("itinerary");
        else if (state.view === "itinerary" || state.view === "maps" || state.view === "recs") render();
      }, 120);
    });

    els.chips.addEventListener("click", (e) => {
      const btn = e.target.closest("[data-city]");
      if (!btn) return;
      state.city = btn.dataset.city;
      if (state.view === "detail") showView("itinerary");
      else if (FILTER_VIEWS.has(state.view)) render();
    });

    els.ribbon.addEventListener("click", (e) => {
      const btn = e.target.closest("[data-jump]");
      if (btn) openDay(btn.dataset.jump);
    });

    els.dayList.addEventListener("click", (e) => {
      const row = e.target.closest("[data-day]");
      if (row) openDay(row.dataset.day);
    });

    els.bookingsRoot.addEventListener("change", (e) => {
      const input = e.target.closest("input[data-check]");
      if (!input) return;
      snapshotBookingFolds();
      storage.setChecklistItem(input.dataset.check, input.checked);
      renderBookings();
    });

    els.bookingsRoot.addEventListener("click", (e) => {
      const filterBtn = e.target.closest("[data-bookings-filter]");
      if (!filterBtn) return;
      snapshotBookingFolds();
      state.bookingsFilter = filterBtn.getAttribute("data-bookings-filter") === "all" ? "all" : "open";
      renderBookings();
    });

    els.bookingsRoot.addEventListener(
      "toggle",
      (e) => {
        const details = e.target;
        if (!details || details.tagName !== "DETAILS") return;
        const id = details.getAttribute("data-booking-group");
        if (!id) return;
        storage.setBookingFold(id, details.open);
      },
      true
    );

    if (els.guideRoot) {
      els.guideRoot.addEventListener("click", (e) => {
        const countryBtn = e.target.closest("[data-guide-country]");
        if (countryBtn) {
          state.guideCountry = countryBtn.getAttribute("data-guide-country") === "kr" ? "kr" : "jp";
          renderGuide();
          window.scrollTo({ top: 0, behavior: "smooth" });
          return;
        }
        const jump = e.target.closest("[data-guide-jump]");
        if (jump) {
          e.preventDefault();
          if (window.TripGuide && typeof window.TripGuide.jump === "function") {
            window.TripGuide.jump(jump.getAttribute("data-guide-jump"));
          }
        }
      });
    }

    document.body.addEventListener("click", (e) => {
      const bookingJump = e.target.closest("[data-open-booking]");
      if (bookingJump) {
        e.preventDefault();
        openBookingsFocus(bookingJump.getAttribute("data-open-booking"));
        return;
      }
      if (e.target.id === "back-btn" || e.target.closest("#back-btn")) {
        showView("itinerary");
        return;
      }
      if (e.target.id === "open-tips") {
        tools.openTipsModal();
        return;
      }
      const openFlightDay = e.target.closest("[data-open-day]");
      if (openFlightDay) {
        openDay(openFlightDay.getAttribute("data-open-day"));
        return;
      }
      const copyTaxi = e.target.closest("[data-copy-taxi]");
      if (copyTaxi) {
        navigator.clipboard.writeText(copyTaxi.getAttribute("data-copy-taxi")).then(() => {
          const prev = copyTaxi.textContent;
          copyTaxi.textContent = "Copied";
          setTimeout(() => (copyTaxi.textContent = prev), 1000);
        });
        return;
      }
      const copyBtn = e.target.closest("[data-copy]");
      if (copyBtn) {
        const p = places[copyBtn.dataset.copy];
        if (!p) return;
        const text = p.nameJa ? `${p.name} (${p.nameJa})` : `${p.name}, ${p.city}`;
        navigator.clipboard.writeText(text).then(() => {
          const prev = copyBtn.textContent;
          copyBtn.textContent = "Copied";
          setTimeout(() => (copyBtn.textContent = prev), 1000);
        });
        return;
      }
      const completeBtn = e.target.closest("[data-complete]");
      const favBtn = e.target.closest("[data-fav]");
      if ((completeBtn || favBtn) && state.dayId) {
        const day = days.find((d) => d.id === state.dayId);
        const idx = Number((completeBtn || favBtn).dataset.complete || (completeBtn || favBtn).dataset.fav);
        const item = day && day.timeline[idx];
        if (!item) return;
        if (completeBtn) storage.toggleCompleted(day.id, item);
        if (favBtn) storage.toggleFavorite(day.id, item);
        renderDetail(state.dayId);
      }
    });

    els.navButtons.forEach((btn) => {
      btn.addEventListener("click", () => {
        const view = btn.dataset.nav;
        if (view) showView(view);
      });
    });

    window.addEventListener("resize", updateTopbarHeight);

    let scrollRaf = 0;
    window.addEventListener(
      "scroll",
      () => {
        if (scrollRaf) return;
        scrollRaf = requestAnimationFrame(() => {
          scrollRaf = 0;
          syncScrollChrome();
        });
      },
      { passive: true }
    );
    if (els.search) {
      els.search.addEventListener("focus", () => setChromeMinimized(false));
      els.search.addEventListener("blur", () => syncScrollChrome());
    }
    syncScrollChrome();
  }

  function animateCount(el, target, duration) {
    if (!el) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce) {
      el.textContent = String(target);
      return;
    }
    const start = performance.now();
    const from = 0;
    const tick = (now) => {
      const t = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - t, 3);
      el.textContent = String(Math.round(from + (target - from) * eased));
      if (t < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }

  function initMasthead() {
    const routeEl = document.getElementById("masthead-route");
    const uniqueCities = trip.route.filter((c, i, arr) => arr.indexOf(c) === i);
    if (routeEl) {
      routeEl.innerHTML = uniqueCities
        .map((c) => {
          return `<div class="route-stop city-${c}">
            <span class="en">${cityLocal(c)}</span>
            <span class="local">${c}</span>
          </div>`;
        })
        .join("");
    }
    const daysEl = document.getElementById("stat-days");
    const citiesEl = document.getElementById("stat-cities");
    const placesEl = document.getElementById("stat-places");
    const cityCount = new Set(days.map((d) => d.city)).size;
    const placeCount = Object.keys(places).length;
    animateCount(daysEl, days.length, 1100);
    animateCount(citiesEl, cityCount, 900);
    animateCount(placesEl, placeCount, 1300);

    const cta = document.getElementById("scroll-to-plan");
    if (cta) {
      cta.addEventListener("click", () => {
        const target = document.getElementById("topbar") || document.getElementById("day-list");
        if (target) target.scrollIntoView({ behavior: "smooth", block: "start" });
      });
    }
  }

  const dateShort = (trip.dates || "")
    .replace("August", "אוג׳")
    .replace("September", "ספט׳")
    .replace(", 2026", "")
    .replace("אוגוסט", "אוג׳")
    .replace("ספטמבר", "ספט׳");
  if (els.brandMeta) {
    els.brandMeta.textContent = `${dateShort || "27 אוג׳–23 ספט׳"} · ${days.length} ימים`;
  }

  initMasthead();
  bind();
  showView("itinerary");
  if (window.DestIntel) {
    window.DestIntel.render(document.getElementById("dest-intel"));
  }
})();
