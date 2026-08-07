/* Live destination snapshot: weather + FX */
window.DestIntel = (function () {
  const CITIES = [
    { id: "Seoul", he: "סיאול", lat: 37.5665, lng: 126.978, tz: "Asia/Seoul", flag: "KR" },
    { id: "Tokyo", he: "טוקיו", lat: 35.6762, lng: 139.6503, tz: "Asia/Tokyo", flag: "JP" },
    { id: "Kyoto", he: "קיוטו", lat: 35.0116, lng: 135.7681, tz: "Asia/Tokyo", flag: "JP" },
    { id: "Osaka", he: "אוסקה", lat: 34.6937, lng: 135.5023, tz: "Asia/Tokyo", flag: "JP" },
  ];

  const WX = {
    0: "בהיר",
    1: "כמעט בהיר",
    2: "מעונן חלקית",
    3: "מעונן",
    45: "ערפל",
    48: "ערפל",
    51: "טפטוף קל",
    53: "טפטוף",
    55: "טפטוף חזק",
    61: "גשם קל",
    63: "גשם",
    65: "גשם חזק",
    71: "שלג קל",
    73: "שלג",
    75: "שלג חזק",
    80: "ממטרים",
    81: "ממטרים",
    82: "ממטרים חזקים",
    95: "סופת רעמים",
    96: "סופת רעמים",
    99: "סופת רעמים",
  };

  function wxLabel(code) {
    if (WX[code]) return WX[code];
    if (code >= 51 && code < 60) return "טפטוף";
    if (code >= 61 && code < 70) return "גשם";
    if (code >= 71 && code < 80) return "שלג";
    if (code >= 80 && code < 90) return "ממטרים";
    return "מזג אוויר";
  }

  function escape(str) {
    return String(str || "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function localTime(tz) {
    try {
      return new Intl.DateTimeFormat("he-IL", {
        timeZone: tz,
        hour: "2-digit",
        minute: "2-digit",
      }).format(new Date());
    } catch {
      return "—";
    }
  }

  async function fetchWeather(city) {
    const url =
      `https://api.open-meteo.com/v1/forecast?latitude=${city.lat}&longitude=${city.lng}` +
      `&current=temperature_2m,weather_code,relative_humidity_2m,apparent_temperature` +
      `&timezone=${encodeURIComponent(city.tz)}`;
    const res = await fetch(url);
    if (!res.ok) throw new Error("weather");
    const data = await res.json();
    const cur = data.current || {};
    return {
      temp: Math.round(cur.temperature_2m),
      feels: Math.round(cur.apparent_temperature),
      humidity: cur.relative_humidity_2m,
      code: cur.weather_code,
      label: wxLabel(cur.weather_code),
    };
  }

  async function fetchRates() {
    const res = await fetch("https://api.frankfurter.app/latest?from=ILS&to=USD,JPY,KRW,EUR");
    if (!res.ok) throw new Error("fx");
    const data = await res.json();
    const r = data.rates || {};
    return {
      updated: data.date,
      ILS_USD: r.USD,
      ILS_JPY: r.JPY,
      ILS_KRW: r.KRW,
      ILS_EUR: r.EUR,
      USD_JPY: r.USD && r.JPY ? r.JPY / r.USD : null,
      USD_KRW: r.USD && r.KRW ? r.KRW / r.USD : null,
      EUR_USD: r.EUR && r.USD ? r.USD / r.EUR : null,
    };
  }

  function syncStorageRates(live) {
    if (!window.TripStorage || !live) return;
    const next = window.TripStorage.getRates();
    if (live.USD_JPY) next.USD_JPY = Number(live.USD_JPY.toFixed(2));
    if (live.USD_KRW) next.USD_KRW = Number(live.USD_KRW.toFixed(0));
    if (live.EUR_USD) next.EUR_USD = Number(live.EUR_USD.toFixed(4));
    if (live.ILS_USD) next.ILS_USD = Number(live.ILS_USD.toFixed(4));
    window.TripStorage.setRates(next);
  }

  function skeletonHtml() {
    return `
      <div class="dest-intel-head">
        <div>
          <p class="plan-kicker">עכשיו ביעדים</p>
          <h2 class="dest-intel-title">מזג אוויר ושערים</h2>
        </div>
        <p class="dest-intel-note">מתעדכן מהרשת…</p>
      </div>
      <div class="dest-weather-grid">
        ${CITIES.map(() => `<div class="dest-weather-card is-loading"><div class="dest-skel"></div></div>`).join("")}
      </div>
      <div class="dest-fx is-loading"><div class="dest-skel"></div></div>`;
  }

  function weatherCard(city, wx, err) {
    if (err || !wx) {
      return `
        <article class="dest-weather-card city-accent-${city.id}">
          <div class="dest-weather-top">
            <span class="dest-city">${escape(city.he)}</span>
            <span class="dest-time">${escape(localTime(city.tz))}</span>
          </div>
          <p class="dest-weather-empty">לא זמין כרגע</p>
        </article>`;
    }
    return `
      <article class="dest-weather-card city-accent-${city.id}">
        <div class="dest-weather-top">
          <span class="dest-city">${escape(city.he)}</span>
          <span class="dest-time">${escape(localTime(city.tz))}</span>
        </div>
        <div class="dest-temp">${wx.temp}°</div>
        <div class="dest-wx-label">${escape(wx.label)}</div>
        <div class="dest-wx-meta">
          <span>מרגיש כמו ${wx.feels}°</span>
          <span>לחות ${wx.humidity}%</span>
        </div>
      </article>`;
  }

  function ratesHtml(rates, err) {
    if (err || !rates) {
      return `<div class="dest-fx"><p class="dest-weather-empty">שערי חליפין לא זמינים כרגע</p></div>`;
    }
    const fmt = (n, digits) =>
      n == null ? "—" : Number(n).toLocaleString("he-IL", { maximumFractionDigits: digits });
    return `
      <div class="dest-fx">
        <div class="dest-fx-head">
          <h3>שערים חיים · ₪1</h3>
          <span>עודכן ${escape(rates.updated || "")}</span>
        </div>
        <div class="dest-fx-grid">
          <div class="dest-fx-item"><em>₩</em><strong>${fmt(rates.ILS_KRW, 0)}</strong><span>וון קוריאני</span></div>
          <div class="dest-fx-item"><em>¥</em><strong>${fmt(rates.ILS_JPY, 1)}</strong><span>ין יפני</span></div>
          <div class="dest-fx-item"><em>$</em><strong>${fmt(rates.ILS_USD, 3)}</strong><span>דולר</span></div>
          <div class="dest-fx-item"><em>€</em><strong>${fmt(rates.ILS_EUR, 3)}</strong><span>אירו</span></div>
        </div>
      </div>`;
  }

  async function render(root) {
    if (!root) return;
    root.innerHTML = skeletonHtml();

    const weatherPromise = Promise.all(
      CITIES.map(async (city) => {
        try {
          return { city, wx: await fetchWeather(city), err: false };
        } catch {
          return { city, wx: null, err: true };
        }
      })
    );

    const ratesPromise = fetchRates()
      .then((rates) => {
        syncStorageRates(rates);
        return { rates, err: false };
      })
      .catch(() => ({ rates: null, err: true }));

    const [weatherRows, ratesResult] = await Promise.all([weatherPromise, ratesPromise]);

    root.innerHTML = `
      <div class="dest-intel-head">
        <div>
          <p class="plan-kicker">עכשיו ביעדים</p>
          <h2 class="dest-intel-title">מזג אוויר ושערים</h2>
        </div>
        <p class="dest-intel-note">מתעדכן אוטומטית · Open-Meteo + Frankfurter</p>
      </div>
      <div class="dest-weather-grid">
        ${weatherRows.map(({ city, wx, err }) => weatherCard(city, wx, err)).join("")}
      </div>
      ${ratesHtml(ratesResult.rates, ratesResult.err)}
    `;
  }

  return { render, CITIES };
})();
