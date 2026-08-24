/* Access gate — passcode unlock for the trip site */
(function () {
  const CODE = "2608";
  const STORAGE_KEY = "tripGateUnlocked_v2";
  const LENGTH = 4;

  const root = document.getElementById("access-gate");
  if (!root) return;

  if (sessionStorage.getItem(STORAGE_KEY) === "1") {
    document.documentElement.classList.remove("gate-locked");
    root.remove();
    return;
  }

  document.documentElement.classList.add("gate-locked");

  const dotsEl = root.querySelector("[data-gate-dots]");
  const padEl = root.querySelector("[data-gate-pad]");
  const msgEl = root.querySelector("[data-gate-msg]");
  const panelEl = root.querySelector(".gate-panel");

  let value = "";
  let busy = false;

  function renderDots() {
    dotsEl.innerHTML = Array.from({ length: LENGTH }, (_, i) => {
      const filled = i < value.length;
      const just = i === value.length - 1;
      return `<span class="gate-dot${filled ? " is-filled" : ""}${just ? " is-pop" : ""}" aria-hidden="true"></span>`;
    }).join("");
  }

  function setMsg(text, kind) {
    msgEl.textContent = text || "";
    msgEl.dataset.kind = kind || "";
  }

  function wrong() {
    busy = true;
    setMsg("קוד שגוי — נסו שוב", "error");
    panelEl.classList.remove("is-shake");
    // reflow to retrigger animation
    void panelEl.offsetWidth;
    panelEl.classList.add("is-shake");
    dotsEl.classList.add("is-wrong");
    root.classList.add("is-wrong-flash");

    window.setTimeout(() => {
      value = "";
      renderDots();
      dotsEl.classList.remove("is-wrong");
      root.classList.remove("is-wrong-flash");
      panelEl.classList.remove("is-shake");
      busy = false;
    }, 620);
  }

  function unlock() {
    busy = true;
    setMsg("נפתח…", "ok");
    sessionStorage.setItem(STORAGE_KEY, "1");
    root.classList.add("is-unlocking");
    panelEl.classList.add("is-success");
    dotsEl.classList.add("is-success");

    window.setTimeout(() => {
      document.documentElement.classList.remove("gate-locked");
      document.documentElement.classList.add("gate-unlocked");
      root.classList.add("is-gone");
      window.setTimeout(() => root.remove(), 700);
    }, 780);
  }

  function pushDigit(d) {
    if (busy || value.length >= LENGTH) return;
    value += d;
    renderDots();
    setMsg("", "");
    if (value.length === LENGTH) {
      busy = true;
      window.setTimeout(() => {
        if (value === CODE) unlock();
        else wrong();
      }, 140);
    }
  }

  function backspace() {
    if (busy || !value.length) return;
    value = value.slice(0, -1);
    renderDots();
    setMsg("", "");
  }

  padEl.addEventListener("click", (e) => {
    const btn = e.target.closest("[data-digit], [data-action]");
    if (!btn) return;
    if (btn.dataset.digit != null) pushDigit(btn.dataset.digit);
    if (btn.dataset.action === "del") backspace();
  });

  window.addEventListener("keydown", (e) => {
    if (!document.documentElement.classList.contains("gate-locked")) return;
    if (e.key >= "0" && e.key <= "9") {
      e.preventDefault();
      pushDigit(e.key);
    } else if (e.key === "Backspace") {
      e.preventDefault();
      backspace();
    }
  });

  renderDots();
  setMsg("הזינו את קוד הגישה", "");
})();
