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
          <label>סכום<input type="number" id="fx-amount" value="10000" inputmode="decimal" /></label>
          <label>מ־
            <select id="fx-from">
              <option value="JPY">JPY ¥</option>
              <option value="KRW">KRW ₩</option>
              <option value="USD">USD $</option>
              <option value="EUR">EUR €</option>
              <option value="ILS">ILS ₪</option>
            </select>
          </label>
          <label>ל־
            <select id="fx-to">
              <option value="ILS" selected>ILS ₪</option>
              <option value="USD">USD $</option>
              <option value="EUR">EUR €</option>
              <option value="JPY">JPY ¥</option>
              <option value="KRW">KRW ₩</option>
            </select>
          </label>
        </div>
        <div class="fx-result" id="fx-result">—</div>
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
      document.getElementById("fx-result").textContent =
        `${Number(amount).toLocaleString("he-IL")} ${from} ≈ ${out.toLocaleString("he-IL", { maximumFractionDigits: 2 })} ${to}`;
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

  return { categoryMeta, convert, renderConverter, renderTaxiCards, openTipsModal, hotelTaxiCards };
})();
