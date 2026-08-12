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
                <li>השתמשו ב־<strong>Naver Map</strong> או <strong>Kakao Map</strong> לתחבורה — טוב יותר מגוגל בסיאול.</li>
                <li>קחו כרטיס <strong>T-money</strong> (או Climate Card) למטרו/אוטובוס.</li>
                <li>בסיאול עומדים בדרך כלל מימין בדרגנוע.</li>
              </ul>
            </section>
            <section>
              <h3>יפן</h3>
              <ul>
                <li>הוסיפו <strong>Suica / Pasmo</strong> ל־Apple Wallet לפני הנסיעה (או קנו IC בהגעה).</li>
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

  return { categoryMeta, placeKindHe, convert, renderConverter, renderTaxiCards, openTipsModal, hotelTaxiCards };
})();
