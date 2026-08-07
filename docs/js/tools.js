window.TripTools = (function () {
  const CAT_META = {
    dining: { icon: "", label: "Dining" },
    culture: { icon: "", label: "Culture" },
    shopping: { icon: "", label: "Shopping" },
    transit: { icon: "", label: "Transit" },
    attraction: { icon: "", label: "Sight" },
    hotel: { icon: "", label: "Hotel" },
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
    return Object.values(places)
      .filter((p) => (p.tags || []).includes("hotel") && p.taxiAddress)
      .map((p) => ({
        id: p.id,
        name: p.name,
        local: p.nameJa,
        address: p.taxiAddress,
        city: p.city,
        country: p.country,
      }));
  }

  function renderConverter(root) {
    const rates = TripStorage.getRates();
    root.innerHTML = `
      <div class="tool-card">
        <h3>Currency converter</h3>
        <p class="tool-sub">Edit rates anytime — saved on this device.</p>
        <div class="fx-grid">
          <label>Amount<input type="number" id="fx-amount" value="10000" inputmode="decimal" /></label>
          <label>From
            <select id="fx-from">
              <option value="JPY">JPY ¥</option>
              <option value="KRW">KRW ₩</option>
              <option value="USD">USD $</option>
              <option value="EUR">EUR €</option>
              <option value="ILS">ILS ₪</option>
            </select>
          </label>
          <label>To
            <select id="fx-to">
              <option value="USD">USD $</option>
              <option value="EUR">EUR €</option>
              <option value="ILS">ILS ₪</option>
              <option value="JPY">JPY ¥</option>
              <option value="KRW">KRW ₩</option>
            </select>
          </label>
        </div>
        <div class="fx-result" id="fx-result">—</div>
        <details class="fx-rates">
          <summary>Editable exchange rates</summary>
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
        `${Number(amount).toLocaleString()} ${from} ≈ ${out.toLocaleString(undefined, { maximumFractionDigits: 2 })} ${to}`;
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
        <h3>Taxi & hotel cards</h3>
        <p class="tool-sub">Show local script to drivers — tap copy.</p>
        <div class="taxi-grid">
          ${cards.map((c) => `
            <article class="taxi-card city-accent-${c.city}">
              <div class="taxi-city">${c.city}</div>
              <div class="taxi-name">${escape(c.name)}</div>
              <div class="taxi-local">${escape(c.local || "")}</div>
              <div class="taxi-address">${escape(c.address)}</div>
              <button type="button" class="btn-ghost" data-copy-taxi="${escape(c.address)}">Copy address</button>
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
          <button type="button" class="modal-close" id="tips-close" aria-label="Close">×</button>
          <h2 id="tips-title">Transit quick tips</h2>
          <div class="tips-cols">
            <section>
              <h3>Korea</h3>
              <ul>
                <li>Use <strong>Naver Map</strong> or <strong>Kakao Map</strong> for transit — better than Google in Seoul.</li>
                <li>Get a <strong>T-money</strong> card (or Climate Card) for subway/bus.</li>
                <li>Keep right on escalators in Seoul (local norm).</li>
              </ul>
            </section>
            <section>
              <h3>Japan</h3>
              <ul>
                <li>Add <strong>Suica / Pasmo</strong> to Apple Wallet before you go (or buy an IC card on arrival).</li>
                <li>Stay quiet on trains — phone calls are frowned upon.</li>
                <li>Queue orderly; priority seats are real — offer them freely.</li>
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
