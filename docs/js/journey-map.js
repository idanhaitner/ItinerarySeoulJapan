/* Chronological journey map (Leaflet) */
window.JourneyMap = (function () {
  const CITY_COLORS = {
    Seoul: "#a61e4d",
    Tokyo: "#5a6f7a",
    Hakone: "#2a6b5a",
    Kawaguchiko: "#4a7d8a",
    Kyoto: "#c43c2c",
    Hiroshima: "#7a746c",
    Osaka: "#9c6b2f",
  };

  let map = null;
  let layerGroup = null;
  let resizeObserver = null;

  function cityColor(city) {
    return CITY_COLORS[city] || "#2f2b28";
  }

  function dayPoint(day, places) {
    const hotel = day.hotelId ? places[day.hotelId] : null;
    if (hotel && hotel.lat != null && hotel.lng != null) {
      return { lat: hotel.lat, lng: hotel.lng, label: hotel.name, placeId: hotel.id };
    }
    for (const id of day.placeIds || []) {
      const p = places[id];
      if (p && p.lat != null && p.lng != null) {
        return { lat: p.lat, lng: p.lng, label: p.name, placeId: p.id };
      }
    }
    return null;
  }

  function buildStops(days, places, filterCity) {
    return days
      .map((day, index) => {
        if (filterCity && filterCity !== "all" && day.city !== filterCity) return null;
        const pt = dayPoint(day, places);
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
      if (legend) legend.innerHTML = `<li class="journey-empty">No mapped stops for this filter.</li>`;
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
          <div class="jp-day">Day ${String(s.n).padStart(2, "0")} · ${s.day.city}</div>
          <div class="jp-title">${escape(s.day.title)}</div>
          <div class="jp-meta">${escape(s.label)}</div>
          <button type="button" class="jp-open" data-open-day="${s.day.id}">Open day</button>
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
                <strong>${escape(s.day.city)}</strong>
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
    const index = days.findIndex((d) => d.id === dayId);
    if (index < 0) return;
    const pt = dayPoint(days[index], places);
    if (!pt) return;
    map.flyTo([pt.lat, pt.lng], 14, { animate: true, duration: 0.85 });
    layerGroup.eachLayer((layer) => {
      if (layer instanceof L.Marker) {
        const ll = layer.getLatLng();
        if (Math.abs(ll.lat - pt.lat) < 1e-6 && Math.abs(ll.lng - pt.lng) < 1e-6) {
          layer.openPopup();
        }
      }
    });
  }

  return { render, destroy, focusDay, buildStops };
})();
