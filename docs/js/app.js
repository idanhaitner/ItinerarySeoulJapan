(function () {
  const places = window.PLACES;
  const days = window.DAYS;
  const trip = window.TRIP;
  const storage = window.TripStorage;
  const tools = window.TripTools;
  const checklistData = window.CHECKLIST;

  const FILTER_VIEWS = new Set(["itinerary", "maps", "detail"]);
  const RIBBON_VIEWS = new Set(["itinerary", "detail"]);
  const MASTHEAD_VIEWS = new Set(["itinerary"]);

  const CITY_LOCAL = {
    Seoul: "서울",
    Tokyo: "東京",
    Hakone: "箱根",
    Kawaguchiko: "河口湖",
    Kyoto: "京都",
    Osaka: "大阪",
    Hiroshima: "広島",
  };

  const state = {
    view: "itinerary",
    city: "all",
    query: "",
    dayId: null,
  };

  const els = {
    panels: {
      itinerary: document.getElementById("panel-itinerary"),
      bookings: document.getElementById("panel-bookings"),
      maps: document.getElementById("panel-maps"),
      tools: document.getElementById("panel-tools"),
      detail: document.getElementById("panel-detail"),
    },
    dayList: document.getElementById("day-list"),
    placeList: document.getElementById("place-list"),
    detail: document.getElementById("detail-root"),
    search: document.getElementById("search-input"),
    chips: document.getElementById("city-chips"),
    ribbon: document.getElementById("day-ribbon"),
    topbarFilters: document.getElementById("topbar-filters"),
    topbar: document.getElementById("topbar"),
    masthead: document.getElementById("masthead"),
    bookingsRoot: document.getElementById("bookings-root"),
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
    return `city-${city}`;
  }

  function cityLocal(city) {
    return CITY_LOCAL[city] || city;
  }

  function formatDate(iso) {
    const d = new Date(iso + "T12:00:00");
    return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  }

  function dayIndex(day) {
    return days.indexOf(day) + 1;
  }

  function mapsLinks(place) {
    const country = place.country || (place.city === "Seoul" ? "KR" : "JP");
    const localName = place.nameJa || place.name;
    const q =
      country === "KR"
        ? `${place.name} ${localName} Seoul`
        : place.nameJa
          ? `${place.nameJa} ${place.name}`
          : `${place.name}, ${place.city}, Japan`;
    const encoded = encodeURIComponent(q);
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
          ? `https://map.kakao.com/link/map/${encodeURIComponent(localName)},${place.lat},${place.lng}`
          : `https://map.kakao.com/?q=${encoded}`;
      const naver = `https://map.naver.com/v5/search/${encoded}`;
      return { google, apple, local: kakao, localLabel: "Kakao Map", secondary: naver, secondaryLabel: "Naver Map" };
    }
    const yahoo =
      place.lat != null && place.lng != null
        ? `https://map.yahoo.co.jp/place?lat=${place.lat}&lon=${place.lng}&zoom=16`
        : `https://map.yahoo.co.jp/search?q=${encoded}`;
    return { google, apple, local: yahoo, localLabel: "Yahoo! MAP", secondary: apple, secondaryLabel: "Apple Maps" };
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
    const showRibbon = RIBBON_VIEWS.has(state.view);
    const showMasthead = MASTHEAD_VIEWS.has(state.view) && !state.query && state.city === "all";

    els.topbarFilters.hidden = !showFilters;
    els.chips.hidden = !showFilters;
    els.ribbon.hidden = !showRibbon;
    if (els.masthead) els.masthead.classList.toggle("is-compact", !showMasthead);

    const planIntro = document.getElementById("plan-intro");
    if (planIntro) planIntro.classList.toggle("is-hidden", !showMasthead);

    els.navButtons.forEach((btn) => {
      const nav = btn.dataset.nav;
      const active = state.view === "detail" ? nav === "itinerary" : nav === state.view;
      btn.classList.toggle("active", active);
    });

    requestAnimationFrame(updateTopbarHeight);
  }

  function updateTopbarHeight() {
    if (!els.topbar) return;
    const h = Math.ceil(els.topbar.getBoundingClientRect().height);
    document.documentElement.style.setProperty("--topbar-h", `${h}px`);
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
          <div class="day-group-label">${g.city}<span class="local">${cityLocal(g.city)}</span></div>
          <div class="day-group-days">
            ${g.items
              .map(({ day, index }) => {
                const active = state.dayId === day.id ? "active" : "";
                return `<button type="button" class="day-rail-btn ${active}" data-jump="${day.id}" title="${escapeHtml(day.title)}">${String(index + 1).padStart(2, "0")}</button>`;
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
          return `<button type="button" class="chip ${state.city === c ? "active" : ""}" data-city="${c}">All<span class="chip-local">全体</span></button>`;
        }
        return `<button type="button" class="chip ${state.city === c ? "active" : ""}" data-city="${c}">${c}<span class="chip-local">${cityLocal(c)}</span></button>`;
      })
      .join("");
  }

  function transferHtml(transfer) {
    if (!transfer) return "";
    return `<div class="transfer-banner">
      <div class="tb-mode">${escapeHtml(transfer.mode)} transfer</div>
      <div class="tb-label">${escapeHtml(transfer.label)}</div>
      <div class="tb-meta">${escapeHtml(transfer.detail)} · ${escapeHtml(transfer.duration)}</div>
    </div>`;
  }

  function placeCardHtml(p) {
    const links = mapsLinks(p);
    return `
      <article class="place-card city-accent-${p.city}" data-place="${p.id}">
        <span class="city-pill ${cityClass(p.city)}">${p.city} · ${cityLocal(p.city)}</span>
        <h3>${escapeHtml(p.name)}</h3>
        <div class="place-ja">${escapeHtml(p.nameJa || "")}</div>
        <p class="place-blurb">${escapeHtml(p.blurb || "")}</p>
        <div class="tag-row">${(p.tags || []).slice(0, 4).map((t) => `<span class="tag">${t}</span>`).join("")}</div>
        <div class="maps-actions">
          <a class="maps-btn primary" href="${links.google}" target="_blank" rel="noopener noreferrer">Google Maps</a>
          <a class="maps-btn" href="${links.local}" target="_blank" rel="noopener noreferrer">${escapeHtml(links.localLabel)}</a>
          <a class="maps-btn" href="${links.secondary}" target="_blank" rel="noopener noreferrer">${escapeHtml(links.secondaryLabel)}</a>
          <button type="button" class="maps-btn" data-copy="${p.id}">Copy name</button>
        </div>
      </article>`;
  }

  function timelineHtml(day) {
    const items = day.timeline || [];
    return `
      <div class="section-title">Schedule · 日程</div>
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
              <div class="timeline-time">${escapeHtml(timeLabel)}</div>
              <div class="timeline-card">
                <div class="cat-chip">${meta.label}</div>
                <div class="timeline-title">${escapeHtml(item.title)}</div>
                ${place ? `<div class="timeline-place">${escapeHtml(place.name)}${place.nameJa ? ` · ${escapeHtml(place.nameJa)}` : ""}</div>` : ""}
                ${item.note ? `<p class="timeline-note">${escapeHtml(item.note)}</p>` : ""}
                <div class="timeline-actions">
                  ${links ? `<a href="${links.google}" target="_blank" rel="noopener noreferrer">Maps</a>` : ""}
                  <button type="button" class="${storage.isCompleted(day.id, item) ? "active-ok" : ""}" data-complete="${idx}">${storage.isCompleted(day.id, item) ? "Done" : "Complete"}</button>
                  <button type="button" class="${storage.isFavorite(day.id, item) ? "active-fav" : ""}" data-fav="${idx}">${storage.isFavorite(day.id, item) ? "Saved" : "Save"}</button>
                </div>
              </div>
            </li>`;
          })
          .join("")}
      </ol>`;
  }

  function renderDayList() {
    const list = filteredDays();
    setResultCount(`${list.length} days`);
    if (!list.length) {
      els.dayList.innerHTML = `<div class="empty">No days match your filters.</div>`;
      return;
    }
    els.dayList.innerHTML = list
      .map((d) => {
        const n = dayIndex(d);
        const steps = (d.timeline || []).length;
        return `
          <button type="button" class="day-row ${cityClass(d.city)}" data-day="${d.id}">
            <div class="day-row-num">
              <span class="n">${String(n).padStart(2, "0")}</span>
              <span class="d">${formatDate(d.date)}</span>
            </div>
            <div class="day-row-body">
              <div class="day-row-city">
                <span class="en">${d.city}</span>
                <span class="local">${cityLocal(d.city)}</span>
              </div>
              <h3>${escapeHtml(d.title)}</h3>
              <p>${escapeHtml(d.summary)}</p>
            </div>
            <div class="day-row-meta">
              <span>${d.weekday.slice(0, 3)}</span>
              <span>${steps ? `${steps} stops` : "—"}</span>
              <span class="day-row-arrow" aria-hidden="true">→</span>
            </div>
          </button>`;
      })
      .join("");
  }

  function renderMaps() {
    if (window.JourneyMap) window.JourneyMap.destroy();

    const list = filteredPlaces();
    const stopCount = window.JourneyMap
      ? window.JourneyMap.buildStops(days, places, state.city).length
      : 0;
    setResultCount(`${stopCount} stops`);

    els.placeList.innerHTML = `
      <section class="journey-section">
        <div class="journey-head">
          <div>
            <p class="plan-kicker">Journey map · 旅程</p>
            <h2 class="plan-title">Follow the route</h2>
            <p class="journey-sub">Days plotted in chronological order across Korea &amp; Japan. Tap a marker or stop to open that day.</p>
          </div>
        </div>
        <div class="journey-layout">
          <div id="journey-map" class="journey-map" role="img" aria-label="Map of trip days in order"></div>
          <ol id="journey-legend" class="journey-legend"></ol>
        </div>
      </section>
      <div class="section-title" style="margin-top:28px">All places · 場所</div>
      ${
        list.length
          ? `<div class="places-grid">${list.map(placeCardHtml).join("")}</div>`
          : `<div class="empty">No places match.</div>`
      }
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
        openDay(id);
      };
    }
  }

  function renderDetail(dayId) {
    const day = days.find((d) => d.id === dayId);
    if (!day) return;
    const n = dayIndex(day);
    const hotel = day.hotelId ? places[day.hotelId] : null;
    const dayPlaces = day.placeIds.map((id) => places[id]).filter(Boolean);
    const local = cityLocal(day.city);

    els.detail.innerHTML = `
      <button type="button" class="detail-back" id="back-btn">← Back to itinerary</button>
      ${transferHtml(day.transfer)}
      <div class="detail-hero ${cityClass(day.city)}">
        <div class="detail-hero-top">
          <span class="day-num">Day ${String(n).padStart(2, "0")}</span>
          <span class="city-en">${day.city}</span>
          <span class="city-local">${local}</span>
          <span class="day-num">${day.weekday} · ${formatDate(day.date)}</span>
        </div>
        <div class="detail-hero-grid">
          <div>
            <h2>${escapeHtml(day.title)}</h2>
            <div class="detail-meta">${escapeHtml(day.summary)}</div>
            ${hotel ? `<div class="tag-row" style="margin-top:16px"><span class="tag">Stay · ${escapeHtml(hotel.name)}</span></div>` : ""}
          </div>
          ${day.food ? `<div class="food-banner"><strong>Food focus</strong><span>${escapeHtml(day.food)}</span></div>` : ""}
        </div>
      </div>
      <div class="detail-layout">
        <div>
          ${timelineHtml(day)}
        </div>
        <div>
          <div class="side-block">
            <div class="side-block-head">Getting around</div>
            <ol>${(day.transport || []).map((t) => `<li>${escapeHtml(t)}</li>`).join("")}</ol>
          </div>
          <div class="side-block">
            <div class="side-block-head">Recommendations</div>
            <ul>${(day.tips || []).map((t) => `<li>${escapeHtml(t)}</li>`).join("")}</ul>
          </div>
        </div>
      </div>
      <section class="places-section">
        <div class="section-title">Places · 場所</div>
        <div class="places-grid">${dayPlaces.map(placeCardHtml).join("")}</div>
      </section>
    `;
    setResultCount(`Day ${String(n).padStart(2, "0")}`);
  }

  function renderBookings() {
    const checked = storage.getChecklist();
    const allItems = checklistData.groups.flatMap((g) => g.items);
    const done = allItems.filter((i) => checked[i.id]).length;
    const total = allItems.length;
    const pct = total ? Math.round((done / total) * 100) : 0;

    els.bookingsRoot.innerHTML = `
      <div class="progress-wrap">
        <div class="progress-label"><span>${done} of ${total} items booked</span><span>${pct}%</span></div>
        <div class="progress-bar"><span style="width:${pct}%"></span></div>
        <div style="margin-top:14px">
          <button type="button" class="btn-ghost" id="reset-checklist">Reset checklist</button>
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

  function renderTools() {
    els.toolsRoot.innerHTML = `
      <div class="tools-actions">
        <button type="button" class="btn-primary" id="open-tips">Transit tips</button>
      </div>
      <div id="fx-root"></div>
      <div id="taxi-root" style="margin-top:12px"></div>
      <div class="tool-card" style="margin-top:12px">
        <h3>About this trip</h3>
        <p class="tool-sub">${escapeHtml(trip.dates)}</p>
        <div class="tag-row" style="margin-top:10px">${trip.route.map((c) => `<span class="tag">${c}</span>`).join("")}</div>
        <ul style="color:var(--muted);font-size:14px;font-weight:300;margin:12px 0 0;padding-left:18px">
          ${(trip.notes || []).map((n) => `<li>${escapeHtml(n)}</li>`).join("")}
        </ul>
      </div>`;
    tools.renderConverter(document.getElementById("fx-root"));
    tools.renderTaxiCards(document.getElementById("taxi-root"), places);
    setResultCount("Tools");
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
    else if (state.view === "maps") renderMaps();
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
        else if (state.view === "itinerary" || state.view === "maps") render();
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
      if (lab) lab.innerHTML = `<span>${done} of ${total} items booked</span><span>${pct}%</span>`;
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
  }

  function initMasthead() {
    const routeEl = document.getElementById("masthead-route");
    const uniqueCities = trip.route.filter((c, i, arr) => arr.indexOf(c) === i);
    if (routeEl) {
      routeEl.innerHTML = uniqueCities
        .map((c) => {
          return `<div class="route-stop city-${c}">
            <span class="en">${c}</span>
            <span class="local">${cityLocal(c)}</span>
          </div>`;
        })
        .join("");
    }
    const daysEl = document.getElementById("stat-days");
    const citiesEl = document.getElementById("stat-cities");
    const placesEl = document.getElementById("stat-places");
    if (daysEl) daysEl.textContent = String(days.length);
    if (citiesEl) citiesEl.textContent = String(new Set(days.map((d) => d.city)).size);
    if (placesEl) placesEl.textContent = String(Object.keys(places).length);

    const cta = document.getElementById("scroll-to-plan");
    if (cta) {
      cta.addEventListener("click", () => {
        const target = document.getElementById("topbar") || document.getElementById("day-list");
        if (target) target.scrollIntoView({ behavior: "smooth", block: "start" });
      });
    }
  }

  const dateShort = (trip.dates || "")
    .replace("August", "Aug")
    .replace("September", "Sep")
    .replace(", 2026", "");
  if (els.brandMeta) {
    els.brandMeta.textContent = `${dateShort || "Aug 27–Sep 23"} · ${days.length} days`;
  }

  initMasthead();
  bind();
  showView("itinerary");
})();
