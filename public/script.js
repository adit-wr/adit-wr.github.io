/* ------------------------------------------------------------------
   Theme toggle (light / dark) + scroll reveal
------------------------------------------------------------------- */
(function () {
  const root = document.documentElement;

  // 0. Splash screen — runs on index.html whenever #splash is present
  (function () {
    const splash = document.getElementById("splash");
    if (!splash) return;

    function hideSplash() {
      splash.classList.add("is-hidden");
      splash.addEventListener(
        "transitionend",
        () => splash.remove(),
        { once: true }
      );
      // Fallback if the transition event never fires
      setTimeout(() => splash.remove(), 1500);
    }

    // Play glow & title animation, then smoothly fade out
    window.addEventListener("load", () => setTimeout(hideSplash, 2600));
    // Safety net: never leave the splash stuck on screen
    setTimeout(hideSplash, 5000);
  })();

  const readTheme = () => (root.classList.contains("dark") ? "dark" : "light");

  // Sync button UI with the current theme (no persistence).
  function syncUI(theme) {
    const dark = theme === "dark";
    const label = document.getElementById("theme-label");
    const sun = document.getElementById("theme-icon-sun");
    const moon = document.getElementById("theme-icon-moon");
    const button = document.getElementById("theme-toggle");

    if (label) label.textContent = dark ? "Light" : "Dark";
    if (sun) sun.classList.toggle("hidden", !dark);
    if (moon) moon.classList.toggle("hidden", dark);
    if (button) {
      button.setAttribute(
        "aria-label",
        dark ? "Switch to light mode" : "Switch to dark mode"
      );
      button.setAttribute("aria-pressed", String(dark));
    }
  }

  function storeTheme(theme) {
    try {
      localStorage.setItem("theme", theme);
    } catch (e) {
      /* storage unavailable (e.g. private mode) — session only */
    }
  }

  function applyTheme(theme) {
    root.classList.toggle("dark", theme === "dark");
    storeTheme(theme);
    syncUI(theme);
  }

  document.addEventListener("DOMContentLoaded", () => {
    // 1. Theme toggle with expanding circular ripple animation
    syncUI(readTheme());
    const toggle = document.getElementById("theme-toggle");
    if (toggle) {
      toggle.addEventListener("click", (event) => {
        const nextTheme = readTheme() === "dark" ? "light" : "dark";

        // Check if browser supports View Transition API and user prefers motion
        const isReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
        if (!document.startViewTransition || isReduced) {
          applyTheme(nextTheme);
          return;
        }

        const rect = toggle.getBoundingClientRect();
        const x = event.clientX || rect.left + rect.width / 2;
        const y = event.clientY || rect.top + rect.height / 2;

        const endRadius = Math.hypot(
          Math.max(x, window.innerWidth - x),
          Math.max(y, window.innerHeight - y)
        );

        const transition = document.startViewTransition(() => {
          applyTheme(nextTheme);
        });

        transition.ready.then(() => {
          const clipPath = [
            `circle(0px at ${x}px ${y}px)`,
            `circle(${endRadius}px at ${x}px ${y}px)`
          ];

          document.documentElement.animate(
            {
              clipPath: clipPath
            },
            {
              duration: 500,
              easing: "ease-in-out",
              pseudoElement: "::view-transition-new(root)"
            }
          );
        });
      });
    }

    // 2. Live Surakarta Clock (WIB: UTC+7)
    function updateClock() {
      const clockElements = document.querySelectorAll(".live-clock");
      if (!clockElements.length) return;

      const now = new Date();
      // Format time in Asia/Jakarta timezone
      const timeStr = now.toLocaleTimeString("en-GB", {
        timeZone: "Asia/Jakarta",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hour12: false
      });

      clockElements.forEach((el) => {
        el.innerHTML = `<span class="font-light tracking-wide text-muted">Surakarta</span> <span class="font-mono font-bold text-accent">${timeStr}</span> <span class="font-normal text-muted">WIB</span>`;
      });
    }

    updateClock();
    setInterval(updateClock, 1000);

    // 3. Scroll reveal
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          entry.target.classList.toggle("active", entry.isIntersecting);
        });
      },
      { threshold: 0.1 }
    );

    document
      .querySelectorAll(".fade-in-left, .fade-in-right, .fade-in-top, .fade-in-bot, .fade, .swiss-line, .reveal-mask")
      .forEach((el) => observer.observe(el));

    // 4. Selected Work Filter Tabs
    const filterButtons = document.querySelectorAll(".project-filter-btn");
    const projectRows = document.querySelectorAll(".project-row");

    if (filterButtons.length && projectRows.length) {
      filterButtons.forEach((btn) => {
        btn.addEventListener("click", () => {
          const filter = btn.getAttribute("data-filter");

          // Update active button state
          filterButtons.forEach((b) => {
            b.classList.remove("bg-fg", "text-bg");
            b.classList.add("hover:bg-fg/10");
            b.setAttribute("aria-selected", "false");
          });
          btn.classList.add("bg-fg", "text-bg");
          btn.classList.remove("hover:bg-fg/10");
          btn.setAttribute("aria-selected", "true");

          // Filter projects
          projectRows.forEach((row) => {
            const category = row.getAttribute("data-category");
            if (filter === "all" || category === filter) {
              row.style.display = "flex";
            } else {
              row.style.display = "none";
            }
          });
        });
      });
    }

  });
})();
