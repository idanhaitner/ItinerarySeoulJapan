/* Live destination snapshot: weather + FX ticker */
window.DestIntel = (function () {
  const CITIES = [
    { id: "Seoul", he: "סיאול", lat: 37.5665, lng: 126.978, tz: "Asia/Seoul" },
    { id: "Tokyo", he: "טוקיו", lat: 35.6762, lng: 139.6503, tz: "Asia/Tokyo" },
    { id: "Kyoto", he: "קיוטו", lat: 35.0116, lng: 135.7681, tz: "Asia/Tokyo" },
    { id: "Osaka", he: "אוסקה", lat: 34.6937, lng: 135.5023, tz: "Asia/Tokyo" },
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
    try {
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
    } catch {
      const res = await fetch("https://open.er-api.com/v6/latest/ILS");
      if (!res.ok) throw new Error("fx");
      const data = await res.json();
      const r = data.rates || {};
      return {
        updated: (data.time_last_update_utc || "").slice(0, 16),
        ILS_USD: r.USD,
        ILS_JPY: r.JPY,
        ILS_KRW: r.KRW,
        ILS_EUR: r.EUR,
        USD_JPY: r.USD && r.JPY ? r.JPY / r.USD : null,
        USD_KRW: r.USD && r.KRW ? r.KRW / r.USD : null,
        EUR_USD: r.EUR && r.USD ? r.USD / r.EUR : null,
      };
    }
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
      <div class="dest-ticker is-loading" aria-hidden="true"><div class="dest-skel"></div></div>
      <div class="dest-weather-grid">
        ${CITIES.map(() => `<div class="dest-weather-card is-loading"><div class="dest-skel"></div></div>`).join("")}
      </div>`;
  }

  function wxKind(code) {
    const c = Number(code);
    if (!Number.isFinite(c)) return "cloudy";
    if (c === 0) return "sunny";
    if (c === 1 || c === 2) return "partly";
    if (c === 3) return "cloudy";
    if (c === 45 || c === 48) return "fog";
    if (c >= 51 && c <= 57) return "drizzle";
    if ((c >= 61 && c <= 67) || (c >= 80 && c <= 82)) return "rain";
    if ((c >= 71 && c <= 77) || (c >= 85 && c <= 86)) return "snow";
    if (c >= 95) return "storm";
    return "cloudy";
  }

  function wxAnimHtml(kind) {
    if (kind === "sunny") {
      return `<div class="wx-anim wx-sunny" aria-hidden="true"><span class="wx-sun"></span><span class="wx-ray"></span></div>`;
    }
    if (kind === "partly") {
      return `<div class="wx-anim wx-partly" aria-hidden="true"><span class="wx-sun"></span><span class="wx-cloud"></span></div>`;
    }
    if (kind === "cloudy") {
      return `<div class="wx-anim wx-cloudy" aria-hidden="true"><span class="wx-cloud c1"></span><span class="wx-cloud c2"></span></div>`;
    }
    if (kind === "fog") {
      return `<div class="wx-anim wx-fog" aria-hidden="true"><span class="wx-fog-line l1"></span><span class="wx-fog-line l2"></span><span class="wx-fog-line l3"></span></div>`;
    }
    if (kind === "drizzle") {
      return `<div class="wx-anim wx-drizzle" aria-hidden="true"><span class="wx-cloud"></span><span class="wx-drop d1"></span><span class="wx-drop d2"></span><span class="wx-drop d3"></span></div>`;
    }
    if (kind === "rain") {
      return `<div class="wx-anim wx-rain" aria-hidden="true"><span class="wx-cloud"></span><span class="wx-drop d1"></span><span class="wx-drop d2"></span><span class="wx-drop d3"></span><span class="wx-drop d4"></span></div>`;
    }
    if (kind === "snow") {
      return `<div class="wx-anim wx-snow" aria-hidden="true"><span class="wx-cloud"></span><span class="wx-flake f1"></span><span class="wx-flake f2"></span><span class="wx-flake f3"></span></div>`;
    }
    return `<div class="wx-anim wx-storm" aria-hidden="true"><span class="wx-cloud"></span><span class="wx-bolt"></span><span class="wx-drop d1"></span><span class="wx-drop d2"></span></div>`;
  }

  function weatherCard(city, wx, err) {
    if (err || !wx) {
      return `
        <article class="dest-weather-card city-accent-${city.id}">
          <div class="dest-weather-top">
            <span class="dest-city">${escape(city.he)}</span>
            <span class="dest-time">${escape(localTime(city.tz))}</span>
          </div>
          <p class="dest-weather-empty">לא זמין</p>
        </article>`;
    }
    const kind = wxKind(wx.code);
    return `
      <article class="dest-weather-card city-accent-${city.id} wx-${kind}">
        ${wxAnimHtml(kind)}
        <div class="dest-weather-top">
          <span class="dest-city">${escape(city.he)}</span>
          <span class="dest-time">${escape(localTime(city.tz))}</span>
        </div>
        <div class="dest-weather-main">
          <span class="dest-temp">${wx.temp}°</span>
          <span class="dest-wx-label">${escape(wx.label)}</span>
        </div>
        <div class="dest-wx-meta">
          <span>מרגיש ${wx.feels}°</span>
          <span>${wx.humidity}%</span>
        </div>
      </article>`;
  }

  function ratesTickerHtml(rates, err) {
    if (err || !rates) {
      return `<div class="dest-ticker"><div class="dest-ticker-static">שערי חליפין לא זמינים כרגע</div></div>`;
    }
    const fmt = (n, digits) =>
      n == null ? "—" : Number(n).toLocaleString("he-IL", { maximumFractionDigits: digits });
    const items = [
      { sym: "₩", val: fmt(rates.ILS_KRW, 0), label: "וון" },
      { sym: "¥", val: fmt(rates.ILS_JPY, 1), label: "ין" },
      { sym: "$", val: fmt(rates.ILS_USD, 3), label: "דולר" },
      { sym: "€", val: fmt(rates.ILS_EUR, 3), label: "אירו" },
    ];
    const chunk = items
      .map(
        (it) =>
          `<span class="dest-ticker-item"><em>${it.sym}</em><strong>${it.val}</strong><span>${it.label}</span></span>`
      )
      .join('<span class="dest-ticker-sep" aria-hidden="true">·</span>');
    const lead = `<span class="dest-ticker-lead">שערים חיים · ₪1</span><span class="dest-ticker-sep" aria-hidden="true">·</span>`;
    const updated = `<span class="dest-ticker-sep" aria-hidden="true">·</span><span class="dest-ticker-meta">עודכן ${escape(
      rates.updated || ""
    )}</span>`;
    const sequence = `${lead}${chunk}${updated}<span class="dest-ticker-sep" aria-hidden="true">·</span>`;
    return `
      <div class="dest-ticker" aria-label="שערי חליפין חיים">
        <div class="dest-ticker-track">
          <div class="dest-ticker-group">${sequence}</div>
          <div class="dest-ticker-group" aria-hidden="true">${sequence}</div>
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
      ${ratesTickerHtml(ratesResult.rates, ratesResult.err)}
      <div class="dest-weather-grid" aria-label="מזג אוויר ביעדים">
        ${weatherRows.map(({ city, wx, err }) => weatherCard(city, wx, err)).join("")}
      </div>
    `;
  }

  return { render, CITIES };
})();
