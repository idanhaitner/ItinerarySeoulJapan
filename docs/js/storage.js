/* localStorage helpers */
window.TripStorage = (function () {
  const PREFIX = "trip2026:";

  function get(key, fallback) {
    try {
      const raw = localStorage.getItem(PREFIX + key);
      if (raw == null) return fallback;
      return JSON.parse(raw);
    } catch {
      return fallback;
    }
  }

  function set(key, value) {
    localStorage.setItem(PREFIX + key, JSON.stringify(value));
  }

  function activityKey(dayId, item) {
    return `${dayId}:${item.time}:${item.title}`;
  }

  return {
    getChecklist() {
      return get("checklist", {});
    },
    setChecklist(map) {
      set("checklist", map);
    },
    toggleChecklist(id) {
      const map = this.getChecklist();
      map[id] = !map[id];
      this.setChecklist(map);
      return !!map[id];
    },
    getCompleted() {
      return get("completed", {});
    },
    setCompleted(map) {
      set("completed", map);
    },
    toggleCompleted(dayId, item) {
      const key = activityKey(dayId, item);
      const map = this.getCompleted();
      map[key] = !map[key];
      this.setCompleted(map);
      return !!map[key];
    },
    isCompleted(dayId, item) {
      return !!this.getCompleted()[activityKey(dayId, item)];
    },
    getFavorites() {
      return get("favorites", {});
    },
    setFavorites(map) {
      set("favorites", map);
    },
    toggleFavorite(dayId, item) {
      const key = activityKey(dayId, item);
      const map = this.getFavorites();
      map[key] = !map[key];
      this.setFavorites(map);
      return !!map[key];
    },
    isFavorite(dayId, item) {
      return !!this.getFavorites()[activityKey(dayId, item)];
    },
    getRates() {
      return get("fxRates", {
        USD_JPY: 150,
        USD_KRW: 1350,
        EUR_USD: 1.08,
        ILS_USD: 0.27,
      });
    },
    setRates(rates) {
      set("fxRates", rates);
    },
    resetChecklist() {
      this.setChecklist({});
    },
  };
})();
