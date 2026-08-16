window.TripTools = (function () {
  const CAT_META = {
    dining: { icon: "", label: "אוכל" },
    culture: { icon: "", label: "תרבות" },
    shopping: { icon: "", label: "קניות" },
    transit: { icon: "", label: "תחבורה" },
    attraction: { icon: "", label: "אטרקציה" },
    hotel: { icon: "", label: "מלון" },
  };

  function categoryMeta(cat) {
    return CAT_META[cat] || CAT_META.attraction;
  }

  const TRAVEL_LABELS = {
    flight: "טיסה",
    shinkansen: "שינקנסן",
    express: "רכבת מהירה",
    ropeway: "רכבל",
    bus: "אוטובוס",
    subway: "רכבת תחתית",
    taxi: "מונית",
    train: "רכבת",
  };

  const TRAVEL_ICONS = {
    flight:
      '<svg class="travel-icon" viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M21 16v-2l-8-5V3.5A1.5 1.5 0 0 0 11.5 2 1.5 1.5 0 0 0 10 3.5V9L2 14v2l8-2.5V19l-2 1.5V22l3.5-1 3.5 1v-1.5L13 19v-5.5z"/></svg>',
    shinkansen:
      '<svg class="travel-icon" viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M4 14c0-5 4.2-8 10.2-8H20v2.2c-1.6 1.4-2.6 3.4-2.8 5.8H4zm0 2h18v2H4zm2.2 3 .8 2h2.2l-.8-2zm8.6 0 .8 2h2.2l-.8-2zM7 12.5a1 1 0 1 0 0-2 1 1 0 0 0 0 2zm5.5 0a1 1 0 1 0 0-2 1 1 0 0 0 0 2z"/></svg>',
    express:
      '<svg class="travel-icon" viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M3 11h3l1.2-3h9.6L18 11h3v2h-1.2c-.5 2.2-2.2 4-4.5 4.7L16 20h-2l-.6-2h-2.8L10 20H8l.7-2.3C6.4 17 4.7 15.2 4.2 13H3zm5.3 0h7.4l-.6-1.6H8.9zm.2 4.2c.4.5 1 .8 1.6.8h3.8c.6 0 1.2-.3 1.6-.8.2-.3.4-.6.5-1H7.9c.1.4.3.7.6 1z"/></svg>',
    train:
      '<svg class="travel-icon" viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M6.5 3h11A3.5 3.5 0 0 1 21 6.5V15a3 3 0 0 1-3 3h-.4l.9 2h-2.1l-.8-2H8.4l-.8 2H5.5l.9-2H6a3 3 0 0 1-3-3V6.5A3.5 3.5 0 0 1 6.5 3zM6 8h12v5H6zm2.5 7.2a1.3 1.3 0 1 0 0-2.6 1.3 1.3 0 0 0 0 2.6zm7 0a1.3 1.3 0 1 0 0-2.6 1.3 1.3 0 0 0 0 2.6z"/></svg>',
    subway:
      '<svg class="travel-icon" viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M5 4h14a2 2 0 0 1 2 2v9a3 3 0 0 1-3 3h-.2l.7 2h-2.1l-.7-2H8.3l-.7 2H5.5l.7-2H6a3 3 0 0 1-3-3V6a2 2 0 0 1 2-2zm1 3h12v6H6zm2.5 8.2a1.2 1.2 0 1 0 0-2.4 1.2 1.2 0 0 0 0 2.4zm7 0a1.2 1.2 0 1 0 0-2.4 1.2 1.2 0 0 0 0 2.4zM8 6.6h8v1.2H8z"/></svg>',
    bus:
      '<svg class="travel-icon" viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M5 4h14a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2h-.3l.8 2h-2.1l-.8-2H7.4l-.8 2H4.5l.8-2H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2zm1 3h12v6H6zm2.3 8.3a1.2 1.2 0 1 0 0-2.4 1.2 1.2 0 0 0 0 2.4zm7.4 0a1.2 1.2 0 1 0 0-2.4 1.2 1.2 0 0 0 0 2.4z"/></svg>',
    ropeway:
      '<svg class="travel-icon" viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M2 5.2 22 3v1.8L13 6.6V8h3.5A2.5 2.5 0 0 1 19 10.5V18a3 3 0 0 1-3 3H8a3 3 0 0 1-3-3v-7.5A2.5 2.5 0 0 1 7.5 8H11V6.8zM7 12h10v7H7z"/></svg>',
    taxi:
      '<svg class="travel-icon" viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M6.8 8 8 5h8l1.2 3H20v2h-1.1l.1.4L20 16v4h-2v-2H6v2H4v-4l1-5.6.1-.4H4V8zm2.4 0h5.6l-.6-1.6H9.8zM7.2 16.2a1.2 1.2 0 1 0 0-2.4 1.2 1.2 0 0 0 0 2.4zm9.6 0a1.2 1.2 0 1 0 0-2.4 1.2 1.2 0 0 0 0 2.4z"/></svg>',
  };

  const TYPE_PREFIX = {
    flight: /^(?:טיסת|טיסה|Travel by)\s+/i,
    shinkansen: /^(?:שינקנסן|Travel by)\s+/i,
    express: /^(?:רכבת מהירה|Travel by)\s+/i,
    ropeway: /^(?:רכבל),?\s*(?:כבלים ו־Tozan\s+)?/i,
    bus: /^(?:אוטובוס(?:\s+בין-עירוני)?|Travel by)\s+/i,
    subway: /^(?:רכבת תחתית|מטרו)(?:\s+או\s+\S+)?\s+|^(?:Travel by)\s+/i,
    taxi: /^(?:מונית)\s+|^(?:Travel by taxi(?:\s*\/\s*)?)\s*/i,
    train: /^(?:רכבת(?:\s+מקומית)?|Travel by)\s+/i,
  };

  function classifyTravelType(title, note) {
    const raw = title || "";
    const blob = `${raw} ${note || ""}`;
    const low = blob.toLowerCase();

    if (/טיסת|טיסה\b|flight|ethiopian|air premia|emirates|\byt0|\byp\d|airlines/.test(low)) return "flight";
    if (/שינקנסן|shinkansen|\bhikari\b|\bnozomi\b/.test(low)) return "shinkansen";
    if (/spacia|n['’]?ex\b|arex|special rapid|limited express|ltd\.?\s*exp|limousine|לימוזינה|chuo rapid/.test(low)) {
      return "express";
    }

    if (/^(אוטובוס|travel by .{0,50}\bbus\b|travel by intercity|travel by red line|travel by fujikyu bus|travel by hakone tozan bus)/i.test(raw)) {
      return "bus";
    }
    if (/^(רכבת תחתית|מטרו|travel by subway|travel by metro)/i.test(raw)) return "subway";
    if (/^(רכבל|travel by .{0,40}(ropeway|cable))/i.test(raw)) return "ropeway";
    if (/^(מונית|travel by taxi)/i.test(raw)) return "taxi";
    if (/^(רכבת|jr |hankyu|kintetsu|enoden|eizan|yurikamome|travel by )/i.test(raw)) return "train";

    if (/\bbus\b|אוטובוס|red line|tozan bus/.test(low)) return "bus";
    if (/רכבת תחתית|subway|\bmetro\b|מטרו/.test(low)) return "subway";
    if (/רכבל|ropeway|cable car|\bcable\b|כבלים/.test(low)) return "ropeway";
    if (/מונית|\btaxi\b/.test(low)) return "taxi";
    return "train";
  }

  function extractTravelRoute(title) {
    const raw = title || "";
    const en = raw.match(/(?:·\s*)?(from\s+.+?\s+to\s+.+)$/i);
    if (en) return { route: en[1].trim(), rest: raw.slice(0, en.index).replace(/[·,\s]+$/, "").trim() };

    const toward = raw.match(/(לכיוון\s+.+)$/);
    if (toward) return { route: toward[1].trim(), rest: raw.slice(0, toward.index).trim() };

    const back = raw.match(/(חזרה\s+ל.+)$/);
    if (back) return { route: back[1].trim(), rest: raw.slice(0, back.index).trim() };

    const dash = raw.match(/(מ[־].+?\s+ל[־].+)$/);
    if (dash) return { route: dash[1].trim(), rest: raw.slice(0, dash.index).trim() };

    const glued = raw.match(/((?:^|\s)מ(?!ונית)(?:ה)?\S.*?\s+ל\S.+)$/);
    if (glued) return { route: glued[1].trim(), rest: raw.slice(0, glued.index).trim() };

    const destOnly = raw.match(/\s(ל[־]?\S.+)$/);
    if (destOnly && !/או הליכה/.test(raw.slice(0, destOnly.index + 1))) {
      return { route: destOnly[1].trim(), rest: raw.slice(0, destOnly.index).trim() };
    }
    return { route: "", rest: raw };
  }

  function travelInfo(item) {
    const raw = (item && item.title) || "";
    const type = classifyTravelType(raw, (item && item.note) || "");
    const { route, rest } = extractTravelRoute(raw);
    const prefix = TYPE_PREFIX[type];
    let headline = rest.replace(/^(?:נסיעה ב־|Travel by )\s*/i, "").trim();
    const mixed = / או | \/ /.test(headline);
    if (!mixed && prefix) headline = headline.replace(prefix, "").trim();
    headline = headline.replace(/[·,]\s*$/, "").trim();
    if (!mixed) headline = headline.replace(/^(?:או)\s+/, "").trim();
    if (!headline || headline === TRAVEL_LABELS[type]) {
      headline = route || raw;
      return {
        type,
        label: TRAVEL_LABELS[type] || "נסיעה",
        title: headline,
        route: headline === route ? "" : route,
        icon: TRAVEL_ICONS[type] || TRAVEL_ICONS.train,
      };
    }
    return {
      type,
      label: TRAVEL_LABELS[type] || "נסיעה",
      title: headline,
      route,
      icon: TRAVEL_ICONS[type] || TRAVEL_ICONS.train,
    };
  }

  function isTravelItem(item) {
    if (!item) return false;
    if (item.category === "transit") return true;
    const title = item.title || "";
    if (/^(Travel by |נסיעה)/.test(title)) return true;
    if (/^(טיסת|טיסה |אוטובוס|רכבת|מטרו|שינקנסן|מונית|Hikari|Nozomi|N['’]EX|AREX|Tobu |Hankyu|Kintetsu|JR )/.test(title)) {
      return true;
    }
    if (/^רכבל/.test(title) && /(?:מ[־]|\sמ(?!ונית)\S.*\sל)/.test(title)) return true;
    return false;
  }

  /** Short Hebrew “what is this place?” label from tags/name. */
  function placeKindHe(place) {
    if (!place) return "";
    const tags = place.tags || [];
    const name = `${place.name || ""} ${place.nameJa || ""} ${place.blurb || ""}`.toLowerCase();
    if (tags.includes("hotel") && (tags.includes("onsen") || /ryokan|ריוקאן|宿/.test(name))) {
      return "ריוקאן";
    }
    if (tags.includes("hotel")) return "מלון";
    if (tags.includes("shrine")) return "מקדש שינטו";
    if (tags.includes("temple")) return "מקדש";
    if (tags.includes("market")) return "שוק";
    if (tags.includes("onsen") && !tags.includes("hotel")) return "אונסן / ספא";
    if (/teamlab|museum|ミュージアム/.test(name) || (tags.includes("culture") && /museum|teamlab/.test(name))) {
      if (/teamlab/.test(name)) return "מוזיאון / teamLab";
    }
    if (tags.includes("park") && (tags.includes("must-see") || /highland|world|universal|disney|fuji-q/.test(name))) {
      return "פארק שעשועים";
    }
    if (tags.includes("park") || tags.includes("nature")) return "פארק / טבע";
    if (tags.includes("view") || tags.includes("icon")) return "תצפית / אייקון";
    if (tags.includes("food") && !tags.includes("neighborhood")) return "אוכל / מסעדה";
    if (tags.includes("shopping")) return "קניות";
    if (tags.includes("nightlife")) return "בילוי / לילה";
    if (tags.includes("neighborhood")) return "שכונה / אזור";
    if (tags.includes("transport") || tags.includes("airport")) return "תחבורה";
    if (tags.includes("culture")) return "תרבות / אתר";
    return "";
  }

  function convert(amount, from, to, rates) {
    const n = Number(amount);
    if (!Number.isFinite(n)) return 0;
    const toUsd = (code, val) => {
      if (code === "USD") return val;
      if (code === "JPY") return val / rates.USD_JPY;
      if (code === "KRW") return val / rates.USD_KRW;
      if (code === "EUR") return val * rates.EUR_USD;
      if (code === "ILS") return val * rates.ILS_USD;
      return val;
    };
    const fromUsd = (code, usd) => {
      if (code === "USD") return usd;
      if (code === "JPY") return usd * rates.USD_JPY;
      if (code === "KRW") return usd * rates.USD_KRW;
      if (code === "EUR") return usd / rates.EUR_USD;
      if (code === "ILS") return usd / rates.ILS_USD;
      return usd;
    };
    return fromUsd(to, toUsd(from, n));
  }

  function hotelTaxiCards(places) {
    const cityHe = {
      Seoul: "סיאול",
      Tokyo: "טוקיו",
      Hakone: "הקונה",
      Kawaguchiko: "קוואגוצ׳יקו",
      Kyoto: "קיוטו",
      Osaka: "אוסקה",
      Kobe: "קובה",
      Hiroshima: "הירושימה",
    };
    return Object.values(places)
      .filter((p) => (p.tags || []).includes("hotel") && (p.tags || []).includes("booked") && p.taxiAddress)
      .map((p) => ({
        id: p.id,
        name: p.name,
        local: p.nameJa,
        address: p.taxiAddress,
        city: p.city,
        cityLabel: cityHe[p.city] || p.city,
        country: p.country,
      }));
  }

  function renderConverter(root) {
    const rates = TripStorage.getRates();
    root.innerHTML = `
      <div class="tool-card">
        <h3>מחשבון מטבע</h3>
        <p class="tool-sub">אפשר לערוך שערים בכל רגע — נשמר במכשיר.</p>
        <div class="fx-grid">
          <label class="fx-field">סכום<input type="number" id="fx-amount" value="10000" inputmode="decimal" dir="ltr" /></label>
          <label class="fx-field">מ־
            <select id="fx-from" dir="ltr">
              <option value="JPY">¥ JPY</option>
              <option value="KRW" selected>₩ KRW</option>
              <option value="USD">$ USD</option>
              <option value="EUR">€ EUR</option>
              <option value="ILS">₪ ILS</option>
            </select>
          </label>
          <label class="fx-field">ל־
            <select id="fx-to" dir="ltr">
              <option value="ILS" selected>₪ ILS</option>
              <option value="USD">$ USD</option>
              <option value="EUR">€ EUR</option>
              <option value="JPY">¥ JPY</option>
              <option value="KRW">₩ KRW</option>
            </select>
          </label>
        </div>
        <div class="fx-result" id="fx-result" dir="ltr">—</div>
        <details class="fx-rates">
          <summary>שערי חליפין לעריכה</summary>
          <div class="fx-rate-grid">
            <label>USD→JPY<input type="number" data-rate="USD_JPY" value="${rates.USD_JPY}" /></label>
            <label>USD→KRW<input type="number" data-rate="USD_KRW" value="${rates.USD_KRW}" /></label>
            <label>EUR→USD<input type="number" step="0.01" data-rate="EUR_USD" value="${rates.EUR_USD}" /></label>
            <label>ILS→USD<input type="number" step="0.01" data-rate="ILS_USD" value="${rates.ILS_USD}" /></label>
          </div>
        </details>
      </div>`;

    function update() {
      const amount = document.getElementById("fx-amount").value;
      const from = document.getElementById("fx-from").value;
      const to = document.getElementById("fx-to").value;
      const r = TripStorage.getRates();
      const out = convert(amount, from, to, r);
      const n = Number(amount);
      if (!Number.isFinite(n)) {
        document.getElementById("fx-result").textContent = "—";
        return;
      }
      const amt = n.toLocaleString("en-US", { maximumFractionDigits: 2 });
      const converted = out.toLocaleString("en-US", { maximumFractionDigits: 2 });
      // LTR isolate so RTL page bidi doesn't scramble "219,000 KRW ≈ 465.76 ILS"
      document.getElementById("fx-result").innerHTML =
        `<span class="fx-result-from">${amt}&nbsp;${from}</span>` +
        `<span class="fx-result-approx" aria-hidden="true">≈</span>` +
        `<span class="fx-result-to">${converted}&nbsp;${to}</span>`;
    }

    root.querySelectorAll("[data-rate]").forEach((input) => {
      input.addEventListener("change", () => {
        const r = TripStorage.getRates();
        r[input.dataset.rate] = Number(input.value);
        TripStorage.setRates(r);
        update();
      });
    });
    ["fx-amount", "fx-from", "fx-to"].forEach((id) => {
      root.querySelector("#" + id).addEventListener("input", update);
      root.querySelector("#" + id).addEventListener("change", update);
    });
    update();
  }

  function renderTaxiCards(root, places) {
    const cards = hotelTaxiCards(places);
    root.innerHTML = `
      <div class="tool-card">
        <h3>כרטיסי מונית ומלון</h3>
        <p class="tool-sub">הציגו לנהג בשפה המקומית — לחצו להעתקה.</p>
        <div class="taxi-grid">
          ${cards.map((c) => `
            <article class="taxi-card city-accent-${c.city}">
              <div class="taxi-city">${c.cityLabel || c.city}</div>
              <div class="taxi-name">${escape(c.name)}</div>
              <div class="taxi-local">${escape(c.local || "")}</div>
              <div class="taxi-address">${escape(c.address)}</div>
              <button type="button" class="btn-ghost" data-copy-taxi="${escape(c.address)}">העתק כתובת</button>
            </article>`).join("")}
        </div>
      </div>`;
  }

  function escape(str) {
    return String(str || "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function openTipsModal() {
    let modal = document.getElementById("tips-modal");
    if (!modal) {
      modal = document.createElement("div");
      modal.id = "tips-modal";
      modal.className = "modal-backdrop";
      modal.innerHTML = `
        <div class="modal" role="dialog" aria-modal="true" aria-labelledby="tips-title">
          <button type="button" class="modal-close" id="tips-close" aria-label="סגור">×</button>
          <h2 id="tips-title">טיפים מהירים לתחבורה</h2>
          <div class="tips-cols">
            <section>
              <h3>קוריאה</h3>
              <ul>
                <li><strong>Google Maps</strong> לא עובד לניווט רגלי או לתחבורה בקוריאה — <strong>Kakao Map</strong> או <strong>Naver Map</strong> הן חובה.</li>
                <li>קחו <strong>Climate Card</strong> (3/5/7 ימים למטרו/אוטובוס בסיאול) וגם <strong>T-Money</strong> לגיבוי. Climate Card לא תקף ב־AREX Express — רק ב־All-Stop.</li>
                <li>בסיאול עומדים בדרך כלל מימין בדרגנוע.</li>
              </ul>
            </section>
            <section>
              <h3>יפן</h3>
              <ul>
                <li>הוסיפו <strong>Suica / Pasmo</strong> ל־Apple Wallet לפני הנסיעה (או קנו Welcome Suica בהגעה).</li>
                <li>שקט ברכבות — שיחות טלפון לא מקובלות.</li>
                <li>תור מסודר; מושבי עדיפות אמיתיים — הציעו אותם בלב שלם.</li>
              </ul>
            </section>
          </div>
        </div>`;
      document.body.appendChild(modal);
      modal.addEventListener("click", (e) => {
        if (e.target === modal || e.target.id === "tips-close") modal.classList.remove("open");
      });
    }
    modal.classList.add("open");
  }

  return { categoryMeta, placeKindHe, convert, renderConverter, renderTaxiCards, openTipsModal, hotelTaxiCards, travelInfo, isTravelItem };
})();
