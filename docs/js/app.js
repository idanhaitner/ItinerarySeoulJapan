(function () {
  const places = window.PLACES;
  const days = window.DAYS;
  const trip = window.TRIP;
  const storage = window.TripStorage;
  const tools = window.TripTools;
  const checklistData = window.CHECKLIST;

  const state = {
    view: "itinerary",
    city: "all",
    category: "all",
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
    cats: document.getElementById("cat-chips"),
    carousel: document.getElementById("day-carousel"),
    bookingsRoot: document.getElementById("bookings-root"),
    toolsRoot: document.getElementById("tools-root"),
    nav: document.querySelectorAll("[data-nav]"),
    resultCount: document.getElementById("result-count"),
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

  function formatDate(iso) {
    const d = new Date(iso + "T12:00:00");
    return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
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
    return [day.title, day.summary, day.food, day.city, day.weekday, day.country, placeText, timelineText, transferText, ...(day.tips || []), ...(day.transport || [])].join(" ");
  }

  function dayHasCategory(day, category) {
    if (category === "all") return true;
    return (day.timeline || []).some((t) => t.category === category);
  }

  function filteredDays() {
    return days.filter((d) => {
      const cityOk = state.city === "all" || d.city === state.city;
      const catOk = dayHasCategory(d, state.category);
      const qOk = matchesQuery(daySearchBlob(d), state.query);
      return cityOk && catOk && qOk;
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

  function renderCarousel() {
    els.carousel.innerHTML = days
      .map((d, i) => {
        const active = state.dayId === d.id ? "active" : "";
        return `<button type="button" class="day-pill ${cityClass(d.city)} ${active}" data-jump="${d.id}">
          <span class="dp-num">D${String(i + 1).padStart(2, "0")}</span>
          <span class="dp-city" aria-hidden="true"></span>
        </button>`;
      })
      .join("");
  }

  function renderChips() {
    const cities = ["all", ...trip.route.filter((c, i, arr) => arr.indexOf(c) === i)];
    els.chips.innerHTML = cities
      .map((c) => {
        const label = c === "all" ? "All cities" : c;
        return `<button type="button" class="chip ${state.city === c ? "active" : ""}" data-city="${c}">${label}</button>`;
      })
      .join("");

    const cats = [
      ["all", "All"],
      ["dining", "🍽️ Food"],
      ["culture", "⛩️ Culture"],
      ["shopping", "🛍️ Shop"],
      ["transit", "🚆 Transit"],
      ["attraction", "🎢 Fun"],
      ["hotel", "🏨 Hotel"],
    ];
    els.cats.innerHTML = cats
      .map(
        ([id, label]) =>
          `<button type="button" class="chip ${state.category === id ? "active" : ""}" data-category="${id}">${label}</button>`
      )
      .join("");
  }

  function transferHtml(transfer) {
    if (!transfer) return "";
    const modeIcon = { flight: "✈️", train: "🚄", bus: "🚌" }[transfer.mode] || "🚆";
    return `<div class="transfer-banner">
      <div class="tb-mode">${modeIcon} ${escapeHtml(transfer.mode)} transfer</div>
      <div class="tb-label">${escapeHtml(transfer.label)}</div>
      <div class="tb-meta">${escapeHtml(transfer.detail)} · ${escapeHtml(transfer.duration)}</div>
    </div>`;
  }

  function placeCardHtml(p) {
    const links = mapsLinks(p);
    return `
      <article class="place-card city-accent-${p.city}" data-place="${p.id}">
        <span class="city-pill ${cityClass(p.city)}">${p.city}</span>
        <h3>${escapeHtml(p.name)}</h3>
        <div class="place-ja" style="color:var(--soft);font-size:13px;margin-bottom:6px">${escapeHtml(p.nameJa || "")}</div>
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
      <div class="section-title">Timeline</div>
      <ol class="timeline">
        ${items
          .map((item, idx) => {
            const place = item.placeId ? places[item.placeId] : null;
            const links = place ? mapsLinks(place) : null;
            const meta = tools.categoryMeta(item.category || "attraction");
            const timeLabel = item.end ? `${item.time}–${item.end}` : item.time;
            const hidden = state.category !== "all" && item.category !== state.category ? "hidden" : "";
            const done = storage.isCompleted(day.id, item) ? "done" : "";
            const fav = storage.isFavorite(day.id, item) ? "fav" : "";
            return `
            <li class="timeline-item ${hidden} ${done} ${fav}" data-tl-idx="${idx}">
              <div class="timeline-time">${escapeHtml(timeLabel)}</div>
              <div class="timeline-card">
                <div class="cat-chip">${meta.icon} ${meta.label}</div>
                <div class="timeline-title">${escapeHtml(item.title)}</div>
                ${place ? `<div class="timeline-place">${escapeHtml(place.name)}${place.nameJa ? ` · ${escapeHtml(place.nameJa)}` : ""}</div>` : ""}
                ${item.note ? `<p class="timeline-note">${escapeHtml(item.note)}</p>` : ""}
                <div class="timeline-actions">
                  ${links ? `<a href="${links.google}" target="_blank" rel="noopener noreferrer">Maps</a>` : ""}
                  <button type="button" class="${storage.isCompleted(day.id, item) ? "active-ok" : ""}" data-complete="${idx}">${storage.isCompleted(day.id, item) ? "Done ✓" : "Complete"}</button>
                  <button type="button" class="${storage.isFavorite(day.id, item) ? "active-fav" : ""}" data-fav="${idx}">${storage.isFavorite(day.id, item) ? "Saved ★" : "Save"}</button>
                </div>
              </div>
            </li>`;
          })
          .join("")}
      </ol>`;
  }

  function renderDayList() {
    const list = filteredDays();
    els.resultCount.textContent = `${list.length} day${list.length === 1 ? "" : "s"}`;
    if (!list.length) {
      els.dayList.innerHTML = `<div class="empty">No days match your filters.</div>`;
      return;
    }
    els.dayList.innerHTML = list
      .map((d) => {
        const n = days.indexOf(d) + 1;
        const steps = (d.timeline || []).length;
        const tags = [...new Set((d.timeline || []).map((t) => t.category).filter(Boolean))].slice(0, 3);
        return `
          <button type="button" class="day-card ${cityClass(d.city)}" data-day="${d.id}">
            <div class="day-card-top">
              <span class="day-num">Day ${String(n).padStart(2, "0")}</span>
              <span class="day-date">${d.weekday} · ${formatDate(d.date)}</span>
            </div>
            <span class="city-pill ${cityClass(d.city)}">${d.city}</span>
            <h3>${escapeHtml(d.title)}</h3>
            <p>${escapeHtml(d.summary)}</p>
            ${d.transfer ? `<div class="tag-row"><span class="tag">${d.transfer.mode} transfer</span></div>` : ""}
            <div class="tag-row">
              ${steps ? `<span class="tag">${steps} stops</span>` : ""}
              ${tags.map((t) => `<span class="tag">${t}</span>`).join("")}
            </div>
          </button>`;
      })
      .join("");
  }

  function renderMaps() {
    const list = filteredPlaces();
    els.resultCount.textContent = `${list.length} place${list.length === 1 ? "" : "s"}`;
    if (!list.length) {
      els.placeList.innerHTML = `<div class="empty">No places match.</div>`;
      return;
    }
    els.placeList.innerHTML = `<div class="places-grid day-list">${list.map(placeCardHtml).join("")}</div>`;
  }

  function renderDetail(dayId) {
    const day = days.find((d) => d.id === dayId);
    if (!day) return;
    const n = days.indexOf(day) + 1;
    const hotel = day.hotelId ? places[day.hotelId] : null;
    const dayPlaces = day.placeIds.map((id) => places[id]).filter(Boolean);

    els.detail.innerHTML = `
      <button type="button" class="detail-back" id="back-btn">← Back to days</button>
      ${transferHtml(day.transfer)}
      <div class="detail-hero ${cityClass(day.city)}">
        <span class="day-num">Day ${String(n).padStart(2, "0")}</span>
        <span class="city-pill ${cityClass(day.city)}" style="margin-left:8px">${day.city}</span>
        <h2>${escapeHtml(day.title)}</h2>
        <div class="detail-meta">${day.weekday} · ${formatDate(day.date)} · ${escapeHtml(day.summary)}</div>
        ${hotel ? `<div class="tag-row"><span class="tag">Stay · ${escapeHtml(hotel.name)}</span></div>` : ""}
        ${day.food ? `<div class="food-banner"><strong>Today’s food focus</strong><span>${escapeHtml(day.food)}</span></div>` : ""}
      </div>
      <div class="detail-layout">
        <div>
          ${timelineHtml(day)}
          <div class="section-title">Places on this day</div>
          <div class="day-list">${dayPlaces.map(placeCardHtml).join("")}</div>
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
    `;
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
        <div style="margin-top:10px">
          <button type="button" class="btn-ghost" id="reset-checklist">Reset checklist</button>
        </div>
      </div>
      <div class="bookings-list">
        ${checklistData.groups
          .map(
            (g) => `
          <section class="booking-group glass">
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
  }

  function renderTools() {
    els.toolsRoot.innerHTML = `
      <div class="tools-actions">
        <button type="button" class="btn-primary" id="open-tips">Transit tips</button>
      </div>
      <div id="fx-root"></div>
      <div id="taxi-root" style="margin-top:12px"></div>
      <div class="tool-card glass" style="margin-top:12px">
        <h3>About this trip</h3>
        <p class="tool-sub">${escapeHtml(trip.dates)}</p>
        <div class="tag-row" style="margin-top:10px">${trip.route.map((c) => `<span class="tag">${c}</span>`).join("")}</div>
        <ul style="color:var(--muted);font-size:14px;margin:12px 0 0;padding-left:18px">
          ${(trip.notes || []).map((n) => `<li>${escapeHtml(n)}</li>`).join("")}
        </ul>
      </div>`;
    tools.renderConverter(document.getElementById("fx-root"));
    tools.renderTaxiCards(document.getElementById("taxi-root"), places);
  }

  function showView(view) {
    state.view = view;
    if (view !== "detail") state.dayId = null;
    Object.entries(els.panels).forEach(([key, el]) => {
      if (!el) return;
      el.classList.toggle("active", key === view);
    });
    els.nav.forEach((btn) => btn.classList.toggle("active", btn.dataset.nav === view));
    render();
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function openDay(dayId) {
    state.dayId = dayId;
    state.view = "detail";
    Object.entries(els.panels).forEach(([key, el]) => {
      if (!el) return;
      el.classList.toggle("active", key === "detail");
    });
    els.nav.forEach((btn) => btn.classList.remove("active"));
    renderCarousel();
    renderDetail(dayId);
    const pill = els.carousel.querySelector(`[data-jump="${dayId}"]`);
    if (pill) pill.scrollIntoView({ inline: "center", block: "nearest", behavior: "smooth" });
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function render() {
    renderChips();
    renderCarousel();
    if (state.view === "itinerary") renderDayList();
    if (state.view === "maps") renderMaps();
    if (state.view === "bookings") {
      els.resultCount.textContent = "Bookings";
      renderBookings();
    }
    if (state.view === "tools") {
      els.resultCount.textContent = "Tools";
      renderTools();
    }
    if (state.view === "detail" && state.dayId) renderDetail(state.dayId);
  }

  function bind() {
    els.search.addEventListener("input", (e) => {
      state.query = e.target.value.trim();
      if (state.view === "detail") showView("itinerary");
      else render();
    });

    els.chips.addEventListener("click", (e) => {
      const btn = e.target.closest("[data-city]");
      if (!btn) return;
      state.city = btn.dataset.city;
      if (state.view === "detail") showView("itinerary");
      else render();
    });

    els.cats.addEventListener("click", (e) => {
      const btn = e.target.closest("[data-category]");
      if (!btn) return;
      state.category = btn.dataset.category;
      render();
    });

    els.carousel.addEventListener("click", (e) => {
      const btn = e.target.closest("[data-jump]");
      if (btn) openDay(btn.dataset.jump);
    });

    els.dayList.addEventListener("click", (e) => {
      const card = e.target.closest("[data-day]");
      if (card) openDay(card.dataset.day);
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
      const check = e.target.closest("[data-check]");
      if (check) {
        storage.toggleChecklist(check.dataset.check);
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
        const item = day.timeline[idx];
        if (completeBtn) storage.toggleCompleted(day.id, item);
        if (favBtn) storage.toggleFavorite(day.id, item);
        renderDetail(state.dayId);
      }
    });

    els.nav.forEach((btn) => btn.addEventListener("click", () => showView(btn.dataset.nav)));
  }

  document.getElementById("stat-days").textContent = String(days.length);
  document.getElementById("stat-dates").textContent = TRIP.dates.replace("August", "Aug").replace("September", "Sep").replace(", 2026", "") || "Aug 27–Sep 23/24";
  document.getElementById("stat-regions").textContent = String(new Set(days.map((d) => d.city)).size);
  document.getElementById("stat-places").textContent = String(Object.keys(places).length);

  bind();
  showView("itinerary");
})();
