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
    Hiroshima: "הירושימה",
    "Tel Aviv": "תל אביב",
    Bangkok: "בנגקוק",
    Tirana: "טירנה",
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
  };

  const els = {
    panels: {
      itinerary: document.getElementById("panel-itinerary"),
      flights: document.getElementById("panel-flights"),
      bookings: document.getElementById("panel-bookings"),
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
        const cityOk = state.city === "all" || p.city === state.city;
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
        return `<div class="day-group ${cityClass(g.city)} ${dim}">
          <div class="day-group-label">${cityLocal(g.city)}<span class="local">${g.city}</span></div>
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
    els.chips.innerHTML = cities
      .map((c) => {
        if (c === "all") {
          return `<button type="button" class="chip ${state.city === c ? "active" : ""}" data-city="${c}">הכל<span class="chip-local">全体</span></button>`;
        }
        return `<button type="button" class="chip ${state.city === c ? "active" : ""}" data-city="${c}">${cityLocal(c)}<span class="chip-local">${c}</span></button>`;
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

  function timelineHtml(day) {
    const items = day.timeline || [];
    return `
      <div class="section-title">לוח זמנים · 日程</div>
      <ol class="timeline">
        ${items
          .map((item, idx) => {
            const place = item.placeId ? places[item.placeId] : null;
            const links = place ? mapsLinks(place) : null;
            const meta = tools.categoryMeta(item.category || "attraction");
            const timeLabel = item.end ? `${item.time}–${item.end}` : item.time;
            const done = storage.isCompleted(day.id, item) ? "done" : "";
            const fav = storage.isFavorite(day.id, item) ? "fav" : "";
            return `
            <li class="timeline-item city-line-${day.city} ${done} ${fav}" data-tl-idx="${idx}">
              <div class="timeline-meta">
                <div class="cat-chip">${meta.label}</div>
                <div class="timeline-time">${escapeHtml(timeLabel)}</div>
              </div>
              <div class="timeline-card">
                <div class="timeline-title">${escapeHtml(item.title)}</div>
                ${place ? `<div class="timeline-place">${escapeHtml(place.name)}${place.nameJa ? ` · ${escapeHtml(place.nameJa)}` : ""}</div>` : ""}
                ${item.note ? `<p class="timeline-note">${escapeHtml(item.note)}</p>` : ""}
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
                  <span class="day-row-arrow" aria-hidden="true">←</span>
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
      if (!groups.has(p.city)) groups.set(p.city, []);
      groups.get(p.city).push(p);
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

  function renderMaps() {
    if (window.JourneyMap) window.JourneyMap.destroy();

    const list = filteredPlaces();
    const stopCount = window.JourneyMap
      ? window.JourneyMap.buildStops(days, places, state.city).length
      : 0;
    setResultCount(`${stopCount} עצירות`);

    els.placeList.innerHTML = `
      <section class="journey-section">
        <div class="journey-head">
          <div>
            <p class="plan-kicker">מפת המסע · 旅程</p>
            <h2 class="plan-title">עקבו אחרי המסלול</h2>
            <p class="journey-sub">הימים מוצגים בסדר כרונולוגי בקוריאה וביפן. לחצו על סימון או עצירה כדי לפתוח את היום.</p>
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
      ${placesGroupedHtml(list)}
    `;

    const mapEl = document.getElementById("journey-map");
    if (mapEl && window.JourneyMap && window.L) {
      window.JourneyMap.render(mapEl, days, places, {
        city: state.city,
        onOpenDay: (id) => openDay(id),
      });
    }

    const legend = document.getElementById("journey-legend");
    if (legend) {
      legend.onclick = (e) => {
        const btn = e.target.closest("[data-jump-day]");
        if (!btn) return;
        const id = btn.dataset.jumpDay;
        if (window.JourneyMap) window.JourneyMap.focusDay(id, days, places);
      };
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
      <button type="button" class="detail-back" id="back-btn">חזרה למסלול →</button>
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
          <div class="side-block">
            <div class="side-block-head">המלצות</div>
            <ul>${(day.tips || []).map((t) => `<li>${escapeHtml(t)}</li>`).join("")}</ul>
          </div>
        </div>
      </div>
      <section class="places-section">
        <div class="section-title">מקומות · 場所</div>
        <div class="places-grid">${dayPlaces.map((p) => placeCardHtml(p)).join("")}</div>
      </section>
    `;
    setResultCount(`${parts.day} ${parts.month}`);
  }

  function renderBookings() {
    const checked = storage.getChecklist();
    const allItems = checklistData.groups.flatMap((g) => g.items);
    const done = allItems.filter((i) => checked[i.id]).length;
    const total = allItems.length;
    const pct = total ? Math.round((done / total) * 100) : 0;

    els.bookingsRoot.innerHTML = `
      <div class="progress-wrap">
        <div class="progress-label"><span>${done} מתוך ${total} פריטים הוזמנו</span><span>${pct}%</span></div>
        <div class="progress-bar"><span style="width:${pct}%"></span></div>
        <div style="margin-top:14px">
          <button type="button" class="btn-ghost" id="reset-checklist">איפוס רשימה</button>
        </div>
      </div>
      <div class="bookings-list">
        ${checklistData.groups
          .map(
            (g) => `
          <section class="booking-group">
            <h3>${escapeHtml(g.title)}</h3>
            ${g.items
              .map(
                (item) => `
              <label class="booking-item ${checked[item.id] ? "done" : ""}">
                <input type="checkbox" data-check="${item.id}" ${checked[item.id] ? "checked" : ""} />
                <span>
                  <div class="booking-label">${escapeHtml(item.label)}</div>
                  <span class="window-badge">${escapeHtml(item.window)}</span>
                </span>
              </label>`
              )
              .join("")}
          </section>`
          )
          .join("")}
      </div>`;
    setResultCount(`${done}/${total}`);
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
      "tokyo-bangkok": {
        he: "תאילנד",
        en: "BANGKOK",
        jp: "バンコク",
        from: "NRT",
        to: "BKK",
        blurb: "טוקיו לבנגקוק · 1–2 ימים",
      },
      "bangkok-tirana": {
        he: "אלבניה",
        en: "TIRANA",
        jp: "ティラナ",
        from: "BKK",
        to: "TIA",
        blurb: "בנגקוק לטירנה · צריך להזמין",
      },
    };

    const flightCodes = (legs) =>
      legs
        .map((l) => l.flight)
        .filter((c) => c && c !== "—" && c !== "TBD")
        .join(" · ") || "TBD";

    els.flightsRoot.innerHTML = `
      <section class="fx-stage" aria-label="סיכום טיסות">
        <div class="fx-stage-bg" aria-hidden="true">
          <div class="fx-stage-wash"></div>
          <div class="fx-stage-grid"></div>
          <svg class="fx-route-svg" viewBox="0 0 640 160" preserveAspectRatio="none">
            <path class="fx-route-line" d="M28 118 C 110 40, 180 35, 260 78 S 400 130, 500 70 S 580 40, 612 52" fill="none" />
            <circle class="fx-route-dot" cx="28" cy="118" r="4.5" />
            <circle class="fx-route-dot" cx="180" cy="55" r="4.5" />
            <circle class="fx-route-dot" cx="320" cy="95" r="4.5" />
            <circle class="fx-route-dot" cx="460" cy="78" r="4.5" />
            <circle class="fx-route-dot" cx="612" cy="52" r="4.5" />
          </svg>
          <div class="fx-plane" aria-hidden="true">✈</div>
        </div>
        <div class="fx-stage-content">
          <div class="fx-seal" aria-hidden="true"><span>旅</span></div>
          <p class="fx-kicker">טיסות · フライト · BOARDING</p>
          <h2 class="fx-title">מסלול האוויר שלנו</h2>
          <p class="fx-lead">תל אביב → סיאול → טוקיו → בנגקוק → טירנה · כרטיסים, מספרי טיסה וסטטוס במבט אחד.</p>
          <div class="fx-pills">
            <div class="fx-pill"><em>${booked}</em><span>הוזמנו</span></div>
            <div class="fx-pill"><em>${todo}</em><span>לטפל</span></div>
            <div class="fx-pill"><em>${journeys.length}</em><span>מקטעים</span></div>
          </div>
          <div class="fx-route-labels" dir="ltr" aria-hidden="true">
            <span>TLV</span><span>ICN</span><span>NRT</span><span>BKK</span><span>TIA</span>
          </div>
        </div>
      </section>

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
            const first = j.legs[0];
            const last = j.legs[j.legs.length - 1];
            const arriveDate = last.arriveDate || last.date;
            const codes = flightCodes(j.legs);
            const midLabel =
              j.legs.length > 1
                ? `${j.legs.length} legs · ${codes}`
                : codes;
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
                  <h3>${escapeHtml(m.from)} <span aria-hidden="true">→</span> ${escapeHtml(m.to)}</h3>
                  <p class="fx-pass-flightno" dir="ltr">
                    <span class="fx-pass-flightno-label">Flight</span>
                    <strong>${escapeHtml(codes)}</strong>
                  </p>
                </div>
                ${
                  j.dayId
                    ? `<button type="button" class="fx-pass-link" data-open-day="${j.dayId}">למסלול ←</button>`
                    : ""
                }
              </header>

              <div class="fx-pass-route" dir="ltr">
                <div class="fx-end">
                  <span class="fx-code">${escapeHtml(first.from)}</span>
                  <span class="fx-city">${escapeHtml(first.fromName || "")}</span>
                  <span class="fx-clock">${escapeHtml(first.depart || "—")}</span>
                  <span class="fx-day">${escapeHtml(formatFlightDate(first.date))}</span>
                </div>
                <div class="fx-mid" aria-hidden="true">
                  <div class="fx-mid-line"><span class="fx-mid-plane">✈</span></div>
                  <span class="fx-mid-label">${escapeHtml(midLabel)}</span>
                </div>
                <div class="fx-end is-arrive">
                  <span class="fx-code">${escapeHtml(last.to)}</span>
                  <span class="fx-city">${escapeHtml(last.toName || "")}</span>
                  <span class="fx-clock">${escapeHtml(last.arrive || "—")}</span>
                  <span class="fx-day">${escapeHtml(formatFlightDate(arriveDate))}</span>
                </div>
              </div>

              <div class="fx-pass-legs">
                ${j.legs
                  .map((f, li) => {
                    const nextDay = f.arriveDate && f.arriveDate !== f.date;
                    const arriveLabel = nextDay ? `${f.arrive || "—"}` : f.arrive || "—";
                    const statusChip = f.status === "booked" ? "הוזמן" : "לטפל";
                    const durationMatch = String(f.note || "").match(/~\d+h\d*/i);
                    const duration = durationMatch ? durationMatch[0] : j.legs.length === 1 ? "direct" : "";
                    const footBits = [f.terminal, f.note].filter(Boolean);
                    return `
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
                        ${duration ? `<span class="fx-leg-dur">${escapeHtml(duration)}</span>` : ""}
                        <div class="fx-leg-track"><span>✈</span></div>
                        ${nextDay ? `<span class="fx-leg-plus">+1 day</span>` : `<span class="fx-leg-plus">&nbsp;</span>`}
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
      <div class="tools-actions">
        <button type="button" class="btn-primary" id="open-tips">טיפים לתחבורה</button>
        <button type="button" class="btn-ghost" id="open-flights-tab">לטיסות ←</button>
      </div>
      <div id="fx-root"></div>
      <div id="taxi-root" style="margin-top:12px"></div>
      <div class="tool-card" style="margin-top:12px">
        <h3>על הטיול</h3>
        <p class="tool-sub">${escapeHtml(trip.dates)}</p>
        <div class="tag-row" style="margin-top:10px">${trip.route.map((c) => `<span class="tag">${cityLocal(c)}</span>`).join("")}</div>
        <ul style="color:var(--muted);font-size:14px;font-weight:300;margin:12px 0 0;padding-inline-start:18px">
          ${(trip.notes || []).map((n) => `<li>${escapeHtml(n)}</li>`).join("")}
        </ul>
      </div>`;
    tools.renderConverter(document.getElementById("fx-root"));
    tools.renderTaxiCards(document.getElementById("taxi-root"), places);
    const goFlights = document.getElementById("open-flights-tab");
    if (goFlights) goFlights.addEventListener("click", () => showView("flights"));
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
      storage.setChecklistItem(input.dataset.check, input.checked);
      const label = input.closest(".booking-item");
      if (label) label.classList.toggle("done", input.checked);
      const checked = storage.getChecklist();
      const allItems = checklistData.groups.flatMap((g) => g.items);
      const done = allItems.filter((i) => checked[i.id]).length;
      const total = allItems.length;
      const pct = total ? Math.round((done / total) * 100) : 0;
      const bar = els.bookingsRoot.querySelector(".progress-bar > span");
      const lab = els.bookingsRoot.querySelector(".progress-label");
      if (bar) bar.style.width = `${pct}%`;
      if (lab) lab.innerHTML = `<span>${done} מתוך ${total} פריטים הוזמנו</span><span>${pct}%</span>`;
      setResultCount(`${done}/${total}`);
    });

    document.body.addEventListener("click", (e) => {
      if (e.target.id === "back-btn" || e.target.closest("#back-btn")) {
        showView("itinerary");
        return;
      }
      if (e.target.id === "open-tips") {
        tools.openTipsModal();
        return;
      }
      if (e.target.id === "reset-checklist") {
        storage.resetChecklist();
        renderBookings();
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
