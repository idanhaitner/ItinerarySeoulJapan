(function () {
  const places = window.PLACES;
  const days = window.DAYS;
  const trip = window.TRIP;

  const state = {
    view: "itinerary", // itinerary | places | about
    city: "all",
    query: "",
    dayId: null,
  };

  const els = {
    panels: {
      itinerary: document.getElementById("panel-itinerary"),
      places: document.getElementById("panel-places"),
      about: document.getElementById("panel-about"),
      detail: document.getElementById("panel-detail"),
    },
    dayList: document.getElementById("day-list"),
    placeList: document.getElementById("place-list"),
    detail: document.getElementById("detail-root"),
    search: document.getElementById("search-input"),
    chips: document.getElementById("city-chips"),
    nav: document.querySelectorAll("[data-nav]"),
    resultCount: document.getElementById("result-count"),
  };

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
    const q = country === "KR"
      ? `${place.name} ${localName} Seoul`
      : (place.nameJa ? `${place.nameJa} ${place.name}` : `${place.name}, ${place.city}, Japan`);
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

  function openMapsChooser(place) {
    const links = mapsLinks(place);
    // Prefer Google Maps — opens Google Maps JP app on phones when installed
    window.open(links.google, "_blank", "noopener,noreferrer");
  }

  function matchesQuery(text, query) {
    if (!query) return true;
    return text.toLowerCase().includes(query.toLowerCase());
  }

  function placeSearchBlob(p) {
    return [p.name, p.nameJa, p.city, p.blurb, ...(p.tags || [])].join(" ");
  }

  function daySearchBlob(day) {
    const placeText = day.placeIds.map((id) => placeSearchBlob(places[id] || { name: id })).join(" ");
    const timelineText = (day.timeline || []).map((x) => `${x.title} ${x.note || ""}`).join(" ");
    return [day.title, day.summary, day.food, day.city, day.weekday, day.country, placeText, timelineText, ...(day.tips || []), ...(day.transport || [])].join(" ");
  }

  function filteredDays() {
    return days.filter((d) => {
      const cityOk = state.city === "all" || d.city === state.city;
      const qOk = matchesQuery(daySearchBlob(d), state.query);
      return cityOk && qOk;
    });
  }

  function filteredPlaces() {
    return Object.values(places).filter((p) => {
      const cityOk = state.city === "all" || p.city === state.city;
      const qOk = matchesQuery(placeSearchBlob(p), state.query);
      const notOnlyHotel = true;
      return cityOk && qOk && notOnlyHotel;
    });
  }

  function renderChips() {
    const cities = ["all", ...trip.route.filter((c, i, arr) => arr.indexOf(c) === i)];
    els.chips.innerHTML = cities
      .map((c) => {
        const label = c === "all" ? "All cities" : c;
        const active = state.city === c ? "active" : "";
        return `<button type="button" class="chip ${active}" data-city="${c}">${label}</button>`;
      })
      .join("");
  }

  function renderDayList() {
    const list = filteredDays();
    els.resultCount.textContent = state.view === "itinerary"
      ? `${list.length} day${list.length === 1 ? "" : "s"}`
      : "";
    if (!list.length) {
      els.dayList.innerHTML = `<div class="empty">No days match your search.</div>`;
      return;
    }
    els.dayList.innerHTML = list
      .map((d) => {
        const n = days.indexOf(d) + 1;
        const tags = [...new Set(d.placeIds.flatMap((id) => (places[id] && places[id].tags) || []))]
          .filter((t) => ["must-see", "food", "park", "culture"].includes(t))
          .slice(0, 3);
        const steps = (d.timeline || []).length;
        return `
          <button type="button" class="day-card" data-day="${d.id}">
            <div class="day-card-top">
              <span class="day-num">Day ${String(n).padStart(2, "0")}</span>
              <span class="day-date">${d.weekday} · ${formatDate(d.date)}</span>
            </div>
            <span class="city-pill ${cityClass(d.city)}">${d.city}</span>
            <h3>${escapeHtml(d.title)}</h3>
            <p>${escapeHtml(d.summary)}</p>
            <div class="tag-row">
              ${steps ? `<span class="tag">${steps} stops</span>` : ""}
              ${tags.map((t) => `<span class="tag">${t}</span>`).join("")}
            </div>
          </button>`;
      })
      .join("");
  }

  function renderPlaceList() {
    const list = filteredPlaces().sort((a, b) => a.name.localeCompare(b.name));
    els.resultCount.textContent = `${list.length} place${list.length === 1 ? "" : "s"}`;
    if (!list.length) {
      els.placeList.innerHTML = `<div class="empty">No places match your search.</div>`;
      return;
    }
    els.placeList.innerHTML = `<div class="places-grid day-list">${list.map(placeCardHtml).join("")}</div>`;
  }

  function placeCardHtml(p) {
    const links = mapsLinks(p);
    return `
      <article class="place-card" data-place="${p.id}">
        <div class="place-card-head">
          <div>
            <span class="city-pill ${cityClass(p.city)}">${p.city}</span>
            <h3>${escapeHtml(p.name)}</h3>
            <div class="place-ja">${escapeHtml(p.nameJa || "")}</div>
          </div>
        </div>
        <p class="place-blurb">${escapeHtml(p.blurb || "")}</p>
        <div class="tag-row">
          ${(p.tags || []).slice(0, 4).map((t) => `<span class="tag">${t}</span>`).join("")}
        </div>
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
    if (!items.length) return "";
    return `
      <div class="section-title">Timeline</div>
      <ol class="timeline">
        ${items.map((item) => {
          const place = item.placeId ? places[item.placeId] : null;
          const links = place ? mapsLinks(place) : null;
          const timeLabel = item.end ? `${item.time}–${item.end}` : item.time;
          return `
            <li class="timeline-item">
              <div class="timeline-time">${escapeHtml(timeLabel)}</div>
              <div class="timeline-card">
                <div class="timeline-title">${escapeHtml(item.title)}</div>
                ${place ? `<div class="timeline-place">${escapeHtml(place.name)}${place.nameJa ? ` · ${escapeHtml(place.nameJa)}` : ""}</div>` : ""}
                ${item.note ? `<p class="timeline-note">${escapeHtml(item.note)}</p>` : ""}
                ${links ? `<div class="timeline-actions">
                  <a href="${links.google}" target="_blank" rel="noopener noreferrer">Maps</a>
                  <a href="${links.local}" target="_blank" rel="noopener noreferrer">${escapeHtml(links.localLabel)}</a>
                </div>` : ""}
              </div>
            </li>`;
        }).join("")}
      </ol>`;
  }

  function renderDetail(dayId) {
    const day = days.find((d) => d.id === dayId);
    if (!day) return;
    const n = days.indexOf(day) + 1;
    const hotel = day.hotelId ? places[day.hotelId] : null;
    const dayPlaces = day.placeIds.map((id) => places[id]).filter(Boolean);
    const countryLabel = day.country === "KR" ? "Korea" : "Japan";

    els.detail.innerHTML = `
      <button type="button" class="detail-back" id="back-btn">← Back to days</button>
      <div class="detail-hero">
        <span class="day-num">Day ${String(n).padStart(2, "0")}</span>
        <span class="city-pill ${cityClass(day.city)}" style="margin-left:8px">${day.city}</span>
        <span class="tag" style="margin-left:6px">${countryLabel}</span>
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
          <div class="side-block transport">
            <div class="side-block-head">Getting around</div>
            <ol>${(day.transport || []).map((t) => `<li>${escapeHtml(t)}</li>`).join("")}</ol>
          </div>
          <div class="side-block tips">
            <div class="side-block-head">Recommendations</div>
            <ul>${(day.tips || []).map((t) => `<li>${escapeHtml(t)}</li>`).join("")}</ul>
          </div>
        </div>
      </div>
    `;
  }

  function escapeHtml(str) {
    return String(str || "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function showView(view) {
    state.view = view;
    state.dayId = null;
    Object.entries(els.panels).forEach(([key, el]) => {
      if (!el) return;
      el.classList.toggle("active", key === view);
    });
    els.nav.forEach((btn) => {
      btn.classList.toggle("active", btn.dataset.nav === view);
    });
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
    renderDetail(dayId);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function render() {
    renderChips();
    if (state.view === "itinerary") renderDayList();
    if (state.view === "places") renderPlaceList();
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

    els.dayList.addEventListener("click", (e) => {
      const card = e.target.closest("[data-day]");
      if (card) openDay(card.dataset.day);
    });

    document.body.addEventListener("click", (e) => {
      if (e.target.id === "back-btn" || e.target.closest("#back-btn")) {
        showView("itinerary");
        return;
      }
      const copyBtn = e.target.closest("[data-copy]");
      if (copyBtn) {
        const p = places[copyBtn.dataset.copy];
        if (!p) return;
        const text = p.nameJa ? `${p.name} (${p.nameJa})` : `${p.name}, ${p.city}, Japan`;
        navigator.clipboard.writeText(text).then(() => {
          const prev = copyBtn.textContent;
          copyBtn.textContent = "Copied";
          setTimeout(() => (copyBtn.textContent = prev), 1200);
        });
      }
    });

    els.nav.forEach((btn) => {
      btn.addEventListener("click", () => showView(btn.dataset.nav));
    });
  }

  // Hero stats
  document.getElementById("stat-days").textContent = String(days.length);
  document.getElementById("stat-dates").textContent = "Aug 27–Sep 25";
  document.getElementById("stat-regions").textContent = String(
    new Set(days.map((d) => d.city)).size
  );
  document.getElementById("stat-places").textContent = String(Object.keys(places).length);

  document.getElementById("about-notes").innerHTML = trip.notes
    .map((n) => `<li>${escapeHtml(n)}</li>`)
    .join("");
  document.getElementById("about-route").innerHTML = trip.route
    .map((c) => `<span>${c}</span>`)
    .join("");

  bind();
  showView("itinerary");
})();
