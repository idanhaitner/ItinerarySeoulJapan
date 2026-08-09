/* Trip recommendations UI — Seoul cafes + Japan restaurants from MK's map */
window.Recommendations = (function () {
  const PAGE = 24;

  const CITIES = [
    { id: "Seoul", he: "סיאול", local: "서울" },
    { id: "Tokyo", he: "טוקיו", local: "東京" },
    { id: "Kyoto", he: "קיוטו", local: "京都" },
    { id: "Osaka", he: "אוסקה", local: "大阪" },
    { id: "Hakone", he: "הקונה", local: "箱根" },
    { id: "Kamakura", he: "קמאקורה", local: "鎌倉" },
    { id: "Nikko", he: "ניקו", local: "日光" },
    { id: "Nara", he: "נארה", local: "奈良" },
    { id: "Hiroshima", he: "הירושימה", local: "広島" },
  ];

  const SEOUL_DISTRICT_ORDER = [
    "마포구",
    "성동구",
    "용산구",
    "종로구",
    "서대문구",
    "성북구",
    "중구",
    "영등포구",
    "강남구",
  ];

  const TOKYO_DISTRICT_ORDER = [
    "Shinjuku",
    "Shibuya",
    "Asakusa",
    "Akihabara",
    "Ginza",
    "Roppongi",
    "Nakano",
    "Shimokitazawa",
    "Odaiba",
    "Ueno",
    "Kichijoji",
    "Tokyo",
  ];

  function escape(str) {
    return String(str || "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function restaurantCollection(cityId) {
    const meta = (window.RESTAURANT_LIST && window.RESTAURANT_LIST.meta) || {};
    const items = ((window.RESTAURANT_LIST && window.RESTAURANT_LIST.restaurants) || []).filter(
      (r) => r.city === cityId
    );
    if (!items.length) return null;
    return {
      id: "restaurants",
      kind: "restaurant",
      kindHe: "מסעדות",
      title: "מסעדות",
      kicker: "אוכל · グルメ",
      emptyHe: "לא נמצאו מסעדות להתאמה.",
      moreHe: (n) => `עוד ${n} מסעדות`,
      items,
      meta,
    };
  }

  /** Build catalog from available data sources. */
  function catalog() {
    const cafeMeta = (window.CAFE_LIST && window.CAFE_LIST.meta) || {};
    const cafeItems = ((window.CAFE_LIST && window.CAFE_LIST.cafes) || []).filter(
      (c) => c.city === "Seoul"
    );

    const out = {
      Seoul: [
        {
          id: "cafes",
          kind: "cafe",
          kindHe: "קפה",
          title: "בתי קפה",
          kicker: "קפה · 카페",
          emptyHe: "לא נמצאו המלצות להתאמה.",
          moreHe: (n) => `עוד ${n} המלצות`,
          items: cafeItems,
          meta: cafeMeta,
        },
      ],
    };

    for (const city of CITIES) {
      if (city.id === "Seoul") continue;
      const col = restaurantCollection(city.id);
      out[city.id] = col ? [col] : [];
    }
    return out;
  }

  function collectionsFor(cityId) {
    return catalog()[cityId] || [];
  }

  function districts(items, order) {
    const counts = new Map();
    items.forEach((c) => {
      const key = c.district || "기타";
      counts.set(key, (counts.get(key) || 0) + 1);
    });
    const preferred = (order || []).filter((d) => counts.has(d));
    const rest = [...counts.keys()]
      .filter((d) => !(order || []).includes(d))
      .sort((a, b) => (counts.get(b) || 0) - (counts.get(a) || 0));
    return [...preferred, ...rest].map((id) => ({
      id,
      label: (items.find((c) => c.district === id) || {}).districtHe || id,
      count: counts.get(id) || 0,
    }));
  }

  function filterItems(items, { query, district, sort }) {
    const q = (query || "").trim().toLowerCase();
    let list = items.slice();

    if (district && district !== "all") {
      list = list.filter((c) => c.district === district);
    }
    if (q) {
      list = list.filter((c) => {
        const hay = [
          c.name,
          c.nameKo,
          c.nameJa,
          c.address,
          c.roadAddress,
          c.district,
          c.districtHe,
          c.category,
          c.categoryHe,
          c.blurb,
        ]
          .join(" ")
          .toLowerCase();
        return hay.includes(q);
      });
    }

    const sorted = [...list];
    if (sort === "reviews") {
      sorted.sort((a, b) => (b.reviewCount || 0) - (a.reviewCount || 0) || (b.score || 0) - (a.score || 0));
    } else if (sort === "name") {
      sorted.sort((a, b) => String(a.name || "").localeCompare(String(b.name || ""), "en"));
    } else {
      sorted.sort(
        (a, b) =>
          Number(b.score != null) - Number(a.score != null) ||
          (b.score || 0) - (a.score || 0) ||
          (b.reviewCount || 0) - (a.reviewCount || 0) ||
          String(a.name || "").localeCompare(String(b.name || ""), "en")
      );
    }
    return sorted;
  }

  function scoreBadge(item) {
    if (item.score == null) return "";
    return `
      <div class="rec-rating" title="ציון מבקרים">
        <span class="rec-rating-star" aria-hidden="true">★</span>
        <strong>${escape(Number(item.score).toFixed(2))}</strong>
      </div>`;
  }

  function thumbsHtml(photos) {
    const extras = (photos || []).slice(1, 4);
    if (!extras.length) return "";
    return `
      <div class="rec-thumbs" aria-hidden="true">
        ${extras
          .map(
            (src) =>
              `<img src="${escape(src)}" alt="" loading="lazy" decoding="async" referrerpolicy="no-referrer" />`
          )
          .join("")}
      </div>`;
  }

  function primaryLink(item) {
    if (item.naverUrl) return { href: item.naverUrl, label: "Naver", className: "rec-btn-naver" };
    if (item.googleUrl) return { href: item.googleUrl, label: "Google", className: "rec-btn-primary" };
    if (item.url) return { href: item.url, label: "קישור", className: "rec-btn-primary" };
    return null;
  }

  function mapsUrl(item) {
    if (item.lat != null && item.lng != null) {
      return `https://www.google.com/maps/search/?api=1&query=${item.lat},${item.lng}`;
    }
    return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(item.name || "")}`;
  }

  function cardHtml(item) {
    const photos = item.photos || [];
    const cover = photos[0];
    const primary = primaryLink(item);
    const reviews =
      item.reviewCount != null
        ? `<span class="rec-meta-item">${escape(item.reviewCount.toLocaleString("he-IL"))} ביקורות</span>`
        : "";
    const category =
      item.categoryHe || item.category
        ? `<span class="rec-meta-item">${escape(item.categoryHe || item.category)}</span>`
        : "";
    const blurb = item.blurb ? `<p class="rec-blurb">${escape(item.blurb)}</p>` : "";
    const addrRaw = item.roadAddress || item.address || "";
    const addr =
      addrRaw && addrRaw !== item.blurb
        ? `<p class="rec-addr">${escape(addrRaw)}</p>`
        : "";

    return `
      <article class="rec-card">
        <div class="rec-cover ${cover ? "" : "is-empty"}">
          ${
            cover
              ? `<img src="${escape(cover)}" alt="" loading="lazy" decoding="async" referrerpolicy="no-referrer" />`
              : `<span>${escape(item.categoryHe || "מסעדה")}</span>`
          }
        </div>
        <div class="rec-body">
          <div class="rec-meta">
            <span class="rec-district">${escape(item.districtHe || item.district || "")}</span>
            ${category}
            ${scoreBadge(item)}
            ${reviews}
          </div>
          <h3 class="rec-name">${escape(item.name)}</h3>
          ${blurb}
          ${addr}
          ${thumbsHtml(photos)}
          <div class="rec-actions">
            ${
              primary
                ? `<a class="rec-btn ${primary.className}" href="${escape(primary.href)}" target="_blank" rel="noopener noreferrer">${escape(primary.label)}</a>`
                : ""
            }
            <a class="rec-btn rec-btn-ghost" href="${escape(mapsUrl(item))}" target="_blank" rel="noopener noreferrer">Maps</a>
          </div>
        </div>
      </article>`;
  }

  function cityEmptyHtml(city) {
    return `
      <div class="rec-empty-city">
        <p class="rec-empty-title">עדיין אין המלצות ל${escape(city.he)}</p>
        <p class="rec-empty-note">נוסיף כאן קפה, אוכל ומקומות בהמשך.</p>
      </div>`;
  }

  function collectionHtml(city, collection, state) {
    const list = filterItems(collection.items || [], state);
    const shown = list.slice(0, state.limit);
    const districtOrder =
      city.id === "Seoul" ? SEOUL_DISTRICT_ORDER : city.id === "Tokyo" ? TOKYO_DISTRICT_ORDER : [];
    const dists = districts(collection.items || [], districtOrder);
    const meta = collection.meta || {};
    const showDistricts = dists.length > 1;

    return `
      <div class="rec-collection">
        <div class="rec-collection-head">
          <div>
            <p class="plan-kicker">${escape(city.he)} · ${escape(collection.kicker || collection.kindHe)}</p>
            <h2 class="plan-title">${escape(collection.title)}</h2>
            <p class="journey-sub">
              ${list.length} מקומות
              ${
                meta.source
                  ? ` · <a href="${escape(meta.source)}" target="_blank" rel="noopener noreferrer">${escape(meta.sourceLabel || "מקור")}</a>`
                  : ""
              }
              ${meta.author ? ` · ${escape(meta.author)}` : ""}
            </p>
          </div>
          <label class="rec-sort">
            <span class="sr-only">מיון</span>
            <select id="rec-sort">
              <option value="rating" ${state.sort === "rating" ? "selected" : ""}>ציון גבוה</option>
              <option value="reviews" ${state.sort === "reviews" ? "selected" : ""}>הכי הרבה ביקורות</option>
              <option value="name" ${state.sort === "name" ? "selected" : ""}>א״ב</option>
            </select>
          </label>
        </div>
        ${
          showDistricts
            ? `<div class="rec-districts" role="tablist" aria-label="סינון לפי אזור">
                <button type="button" class="rec-chip ${state.district === "all" ? "active" : ""}" data-rec-district="all">הכל</button>
                ${dists
                  .map(
                    (d) =>
                      `<button type="button" class="rec-chip ${state.district === d.id ? "active" : ""}" data-rec-district="${escape(d.id)}">${escape(d.label)} <span>${d.count}</span></button>`
                  )
                  .join("")}
              </div>`
            : ""
        }
        <div class="rec-grid">
          ${shown.map(cardHtml).join("") || `<p class="rec-empty">${escape(collection.emptyHe || "לא נמצאו המלצות.")}</p>`}
        </div>
        ${
          list.length > shown.length
            ? `<button type="button" class="rec-more" id="rec-more">${escape(
                typeof collection.moreHe === "function"
                  ? collection.moreHe(list.length - shown.length)
                  : `עוד ${list.length - shown.length}`
              )}</button>`
            : ""
        }
      </div>`;
  }

  function render(root, opts = {}) {
    if (!root) return { count: 0, city: null };

    const cat = catalog();
    const defaultCity =
      opts.city ||
      CITIES.find((c) => (cat[c.id] || []).some((col) => (col.items || []).length))?.id ||
      CITIES[0].id;

    const state = {
      city: defaultCity,
      collection: opts.collection || null,
      district: opts.district || "all",
      sort: opts.sort || "rating",
      limit: opts.limit || PAGE,
      query: opts.query || "",
    };

    const city = CITIES.find((c) => c.id === state.city) || CITIES[0];
    const collections = collectionsFor(city.id);
    const activeCollection =
      collections.find((c) => c.id === state.collection) || collections[0] || null;

    if (activeCollection && !state.collection) state.collection = activeCollection.id;

    const list = activeCollection ? filterItems(activeCollection.items || [], state) : [];
    const showKindTabs = collections.length > 1;

    root.innerHTML = `
      <section class="rec-section" id="rec-section">
        <div class="rec-head">
          <div>
            <p class="plan-kicker">המלצות · おすすめ</p>
            <h2 class="plan-title">המלצות</h2>
            <p class="journey-sub">קפה בסיאול · מסעדות ביפן לפי ערי המסלול.</p>
          </div>
        </div>
        <div class="rec-cities" role="tablist" aria-label="עיר">
          ${CITIES.map((c) => {
            const has = (cat[c.id] || []).some((col) => (col.items || []).length);
            return `<button type="button" class="rec-city ${state.city === c.id ? "active" : ""} ${has ? "" : "is-empty"}" data-rec-city="${c.id}">
              <span class="rec-city-he">${escape(c.he)}</span>
              <span class="rec-city-local">${escape(c.local)}</span>
            </button>`;
          }).join("")}
        </div>
        ${
          showKindTabs
            ? `<div class="rec-kinds" role="tablist" aria-label="סוג המלצה">
                ${collections
                  .map(
                    (col) =>
                      `<button type="button" class="rec-chip ${state.collection === col.id ? "active" : ""}" data-rec-collection="${escape(col.id)}">${escape(col.kindHe)} <span>${(col.items || []).length}</span></button>`
                  )
                  .join("")}
              </div>`
            : ""
        }
        ${activeCollection ? collectionHtml(city, activeCollection, state) : cityEmptyHtml(city)}
      </section>`;

    root.querySelectorAll("[data-rec-city]").forEach((btn) => {
      btn.addEventListener("click", () => {
        render(root, {
          ...opts,
          city: btn.dataset.recCity,
          collection: null,
          district: "all",
          limit: PAGE,
          sort: state.sort,
          query: state.query,
        });
      });
    });
    root.querySelectorAll(".rec-kinds [data-rec-collection]").forEach((btn) => {
      btn.addEventListener("click", () => {
        render(root, {
          ...opts,
          ...state,
          collection: btn.dataset.recCollection,
          district: "all",
          limit: PAGE,
        });
      });
    });
    root.querySelectorAll("[data-rec-district]").forEach((btn) => {
      btn.addEventListener("click", () => {
        render(root, { ...opts, ...state, district: btn.dataset.recDistrict, limit: PAGE });
      });
    });
    const sortEl = root.querySelector("#rec-sort");
    if (sortEl) {
      sortEl.addEventListener("change", () => {
        render(root, { ...opts, ...state, sort: sortEl.value, limit: PAGE });
      });
    }
    const more = root.querySelector("#rec-more");
    if (more) {
      more.addEventListener("click", () => {
        render(root, { ...opts, ...state, limit: state.limit + PAGE });
      });
    }

    return { count: list.length, city: city.id, collection: state.collection };
  }

  return { render, catalog, CITIES };
})();

window.CafeList = window.Recommendations;
