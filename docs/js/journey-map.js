/* Chronological journey map (Leaflet) */
window.JourneyMap = (function () {
  const CITY_COLORS = {
    Seoul: "#e11d48",
    Tokyo: "#2563eb",
    Hakone: "#059669",
    Kawaguchiko: "#0891b2",
    Kyoto: "#ea580c",
    Hiroshima: "#6366f1",
    Osaka: "#ca8a04",
  };

  const CITY_HE = {
    Seoul: "סיאול",
    Tokyo: "טוקיו",
    Hakone: "הקונה",
    Kawaguchiko: "קוואגוצ׳יקו",
    Kyoto: "קיוטו",
    Hiroshima: "הירושימה",
    Osaka: "אוסקה",
  };

  let map = null;
  let layerGroup = null;
  let resizeObserver = null;

  function cityColor(city) {
    return CITY_COLORS[city] || "#2f2b28";
  }

  function cityLabel(city) {
    return CITY_HE[city] || city;
  }

  function placeScore(place, hotelId) {
    const tags = place.tags || [];
    if (place.id === hotelId || tags.includes("hotel")) return 0;
    if (tags.includes("transport")) return 1;
    if (tags.includes("must-see")) return 5;
    if (tags.includes("temple") || tags.includes("shrine") || tags.includes("culture")) return 4;
    if (tags.includes("attraction") || tags.includes("view") || tags.includes("park")) return 3;
    return 2;
  }

  function placeCandidates(day, places) {
    const hotelId = day.hotelId;
    const seen = new Set();
    const list = [];

    function add(id) {
      if (!id || seen.has(id)) return;
      const p = places[id];
      if (!p || p.lat == null || p.lng == null) return;
      seen.add(id);
      list.push(p);
    }

    (day.timeline || []).forEach((item) => add(item.placeId));
    (day.placeIds || []).forEach(add);
    if (hotelId) add(hotelId);

    return list.sort((a, b) => placeScore(b, hotelId) - placeScore(a, hotelId));
  }

  function coordKey(lat, lng) {
    return `${Number(lat).toFixed(4)},${Number(lng).toFixed(4)}`;
  }

  function dayPoint(day, places, usedCoords) {
    const candidates = placeCandidates(day, places);
    if (!candidates.length) return null;

    for (const p of candidates) {
      const key = coordKey(p.lat, p.lng);
      if (usedCoords && usedCoords.has(key)) continue;
      if (usedCoords) usedCoords.add(key);
      return { lat: p.lat, lng: p.lng, label: p.name, placeId: p.id };
    }

    const fallback = candidates[0];
    const key = coordKey(fallback.lat, fallback.lng);
    if (usedCoords) usedCoords.add(key);
    return {
      lat: fallback.lat,
      lng: fallback.lng,
      label: fallback.name,
      placeId: fallback.id,
    };
  }

  function buildStops(days, places, filterCity) {
    const usedCoords = new Set();
    return days
      .map((day, index) => {
        if (filterCity && filterCity !== "all" && day.city !== filterCity) return null;
        const pt = dayPoint(day, places, usedCoords);
        if (!pt) return null;
        return {
          day,
          index,
          n: index + 1,
          lat: pt.lat,
          lng: pt.lng,
          label: pt.label,
        };
      })
      .filter(Boolean);
  }

  function markerIcon(n, city) {
    const color = cityColor(city);
    return L.divIcon({
      className: "journey-marker",
      html: `<span class="journey-marker-dot" style="background:${color}">${String(n).padStart(2, "0")}</span>`,
      iconSize: [34, 34],
      iconAnchor: [17, 17],
      popupAnchor: [0, -16],
    });
  }

  function ensureMap(container) {
    if (map && map.getContainer() !== container) {
      destroy();
    }
    if (map) return map;
    map = L.map(container, {
      scrollWheelZoom: false,
      zoomControl: true,
      attributionControl: true,
      tapTolerance: 15,
      touchZoom: true,
      dragging: true,
    });
    L.tileLayer("https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png", {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a> &copy; <a href="https://carto.com/">CARTO</a>',
      subdomains: "abcd",
      maxZoom: 18,
    }).addTo(map);
    layerGroup = L.layerGroup().addTo(map);

    map.on("focus", () => map.scrollWheelZoom.enable());
    map.on("blur", () => map.scrollWheelZoom.disable());
    container.addEventListener("mouseenter", () => map.scrollWheelZoom.enable());
    container.addEventListener("mouseleave", () => map.scrollWheelZoom.disable());

    if (typeof ResizeObserver !== "undefined") {
      resizeObserver = new ResizeObserver(() => {
        if (map) map.invalidateSize();
      });
      resizeObserver.observe(container);
    }
    return map;
  }

  function destroy() {
    if (resizeObserver) resizeObserver.disconnect();
    resizeObserver = null;
    if (map) {
      map.remove();
      map = null;
      layerGroup = null;
    }
  }

  function render(container, days, places, options) {
    const opts = options || {};
    const filterCity = opts.city || "all";
    const onOpenDay = opts.onOpenDay || (() => {});

    const stops = buildStops(days, places, filterCity);
    const legend = document.getElementById("journey-legend");

    if (!stops.length) {
      if (legend) legend.innerHTML = `<li class="journey-empty">אין עצירות במפה לסינון הזה.</li>`;
      if (map) {
        layerGroup.clearLayers();
      }
      return stops;
    }

    ensureMap(container);
    layerGroup.clearLayers();

    const latLngs = stops.map((s) => [s.lat, s.lng]);
    const line = L.polyline(latLngs, {
      color: "#2f2b28",
      weight: 2,
      opacity: 0.45,
      dashArray: "6 8",
      lineJoin: "round",
    }).addTo(layerGroup);

    stops.forEach((s) => {
      const marker = L.marker([s.lat, s.lng], { icon: markerIcon(s.n, s.day.city) }).addTo(layerGroup);
      marker.bindPopup(
        `<div class="journey-popup">
          <div class="jp-day">יום ${String(s.n).padStart(2, "0")} · ${cityLabel(s.day.city)}</div>
          <div class="jp-title">${escape(s.day.title)}</div>
          <div class="jp-meta">${escape(s.label)}</div>
          <button type="button" class="jp-open" data-open-day="${s.day.id}">פתח יום</button>
        </div>`
      );
      marker.on("click", () => {
        map.flyTo([s.lat, s.lng], 14, { animate: true, duration: 0.85 });
      });
      marker.on("popupopen", () => {
        const btn = document.querySelector(`[data-open-day="${s.day.id}"]`);
        if (btn) {
          btn.onclick = (e) => {
            e.preventDefault();
            onOpenDay(s.day.id);
          };
        }
      });
    });

    requestAnimationFrame(() => {
      map.invalidateSize();
      if (latLngs.length === 1) {
        map.setView(latLngs[0], 11);
      } else {
        map.fitBounds(line.getBounds(), { padding: [36, 36], maxZoom: 8 });
      }
    });

    if (legend) {
      legend.innerHTML = stops
        .map((s) => {
          return `<li>
            <button type="button" class="journey-legend-item" data-jump-day="${s.day.id}">
              <span class="jl-num" style="background:${cityColor(s.day.city)}">${String(s.n).padStart(2, "0")}</span>
              <span class="jl-copy">
                <strong>${escape(cityLabel(s.day.city))}<span class="jl-en">${escape(s.day.city)}</span></strong>
                <em>${escape(s.day.title)}</em>
              </span>
            </button>
          </li>`;
        })
        .join("");
    }

    return stops;
  }

  function escape(str) {
    return String(str || "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function focusDay(dayId, days, places) {
    if (!map) return;
    const stops = buildStops(days, places, "all");
    const stop = stops.find((s) => s.day.id === dayId);
    if (!stop) return;
    map.flyTo([stop.lat, stop.lng], 14, { animate: true, duration: 0.85 });
    layerGroup.eachLayer((layer) => {
      if (layer instanceof L.Marker) {
        const ll = layer.getLatLng();
        if (Math.abs(ll.lat - stop.lat) < 1e-6 && Math.abs(ll.lng - stop.lng) < 1e-6) {
          layer.openPopup();
        }
      }
    });
  }

  return { render, destroy, focusDay, buildStops };
})();
