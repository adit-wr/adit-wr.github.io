/* ------------------------------------------------------------------
   Swiss Portfolio — Main Script
   - Splash Screen (Initial website open only)
   - Seamless Client-Side Navigation (PJAX)
   - Theme Toggle (Light / Dark with circular transition)
   - Live Surakarta WIB Clock
   - Scroll Reveal & Interactive Filters
------------------------------------------------------------------- */
(function () {
  const root = document.documentElement;

  // ================================================================
  // 0. SPLASH SCREEN (Shown only once when the website is opened)
  // ================================================================
  (function handleSplash() {
    const splash = document.getElementById("splash");
    if (!splash) return;

    let hasOpened = false;
    try {
      hasOpened = sessionStorage.getItem("splashShown") === "1";
    } catch (e) {}

    if (hasOpened) {
      // Returning within the session (e.g. reload or navigation) — remove immediately
      splash.remove();
    } else {
      // Initial website open — display full Glow Horizon animation then fade out
      try {
        sessionStorage.setItem("splashShown", "1");
      } catch (e) {}

      function hideSplash() {
        splash.classList.add("is-hidden");
        splash.addEventListener(
          "transitionend",
          () => splash.remove(),
          { once: true }
        );
        setTimeout(() => splash.remove(), 1500);
      }

      window.addEventListener("load", () => setTimeout(hideSplash, 2600));
      setTimeout(hideSplash, 5000);
    }
  })();

  // ================================================================
  // 1. THEME TOGGLE (Light mode default + Circular ripple)
  // ================================================================
  const readTheme = () => (root.classList.contains("dark") ? "dark" : "light");

  function syncThemeUI(theme) {
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
    } catch (e) {}
  }

  function applyTheme(theme) {
    root.classList.toggle("dark", theme === "dark");
    storeTheme(theme);
    syncThemeUI(theme);
  }

  function initThemeToggle() {
    syncThemeUI(readTheme());
    const toggle = document.getElementById("theme-toggle");
    if (!toggle || toggle._hasListener) return;
    toggle._hasListener = true;

    toggle.addEventListener("click", (event) => {
      const nextTheme = readTheme() === "dark" ? "light" : "dark";
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
        document.documentElement.animate(
          {
            clipPath: [
              `circle(0px at ${x}px ${y}px)`,
              `circle(${endRadius}px at ${x}px ${y}px)`
            ]
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

  // ================================================================
  // ================================================================
  // 3. LIVE SURAKARTA TIME CLOCK (WIB / UTC+7)
  // ================================================================
  function updateClock() {
    const clockElements = document.querySelectorAll(".live-clock");
    if (!clockElements.length) return;

    const now = new Date();
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

  // ================================================================
  // 4. SCROLL REVEAL & WORK FILTERS
  // ================================================================
  let scrollObserver = null;

  function initScrollReveal() {
    if (scrollObserver) {
      scrollObserver.disconnect();
    }

    scrollObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          entry.target.classList.toggle("active", entry.isIntersecting);
        });
      },
      { threshold: 0.1 }
    );

    document
      .querySelectorAll(".fade-in-left, .fade-in-right, .fade-in-top, .fade-in-bot, .fade, .swiss-line, .reveal-mask")
      .forEach((el) => scrollObserver.observe(el));
  }

  function initProjectFilters() {
    const filterButtons = document.querySelectorAll(".project-filter-btn");
    const projectRows = document.querySelectorAll(".project-row");

    if (filterButtons.length && projectRows.length) {
      filterButtons.forEach((btn) => {
        btn.addEventListener("click", () => {
          const filter = btn.getAttribute("data-filter");

          filterButtons.forEach((b) => {
            b.classList.remove("bg-fg", "text-bg");
            b.classList.add("hover:bg-fg/10");
            b.setAttribute("aria-selected", "false");
          });
          btn.classList.add("bg-fg", "text-bg");
          btn.classList.remove("hover:bg-fg/10");
          btn.setAttribute("aria-selected", "true");

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
  }

  // ================================================================
  // 5. CONTACT FORM (Standard mailto encoding without plus '+' signs)
  // ================================================================
  function initContactForm() {
    const form = document.getElementById("contact-form");
    if (!form || form._hasSubmitListener) return;
    form._hasSubmitListener = true;

    form.addEventListener("submit", (event) => {
      event.preventDefault();
      const subjectInput = document.getElementById("contact-subject");
      const bodyInput = document.getElementById("contact-body");

      const subject = subjectInput ? subjectInput.value.trim() : "";
      const body = bodyInput ? bodyInput.value.trim() : "";

      // encodeURIComponent encodes spaces as %20, avoiding the literal plus (+) bug
      const encodedSubject = encodeURIComponent(subject);
      const encodedBody = encodeURIComponent(body);

      const mailtoUrl = `mailto:aditwichaksana@gmail.com?subject=${encodedSubject}&body=${encodedBody}`;

      window.location.href = mailtoUrl;
    });
  }

  // ================================================================
  // 6. SEAMLESS CLIENT-SIDE NAVIGATION (PJAX)
  //    Seamless page transitions without full document reloads
  // ================================================================
  function updateNavActive(targetPath) {
    const isContact = targetPath.includes("contact");

    // Desktop nav
    const desktopAbout = document.querySelector('nav[aria-label="Primary"] a[href*="index.html"]');
    const desktopContact = document.querySelector('nav[aria-label="Primary"] a[href*="contact.html"]');

    if (desktopAbout) {
      if (isContact) desktopAbout.removeAttribute("aria-current");
      else desktopAbout.setAttribute("aria-current", "page");
    }
    if (desktopContact) {
      if (isContact) desktopContact.setAttribute("aria-current", "page");
      else desktopContact.removeAttribute("aria-current");
    }

    // Mobile nav
    const mobileAbout = document.querySelector('nav[aria-label="Primary mobile"] a[href*="index.html"]');
    const mobileContact = document.querySelector('nav[aria-label="Primary mobile"] a[href*="contact.html"]');

    const activeClasses = [
      "text-accent",
      "relative",
      "after:content-['']",
      "after:absolute",
      "after:inset-x-0",
      "after:bottom-0",
      "after:h-[2.5px]",
      "after:bg-accent"
    ];

    if (mobileAbout && mobileContact) {
      if (isContact) {
        mobileAbout.classList.remove(...activeClasses);
        mobileAbout.classList.add("text-fg/80");
        mobileAbout.removeAttribute("aria-current");

        mobileContact.classList.add(...activeClasses);
        mobileContact.classList.remove("text-fg/80");
        mobileContact.setAttribute("aria-current", "page");
      } else {
        mobileContact.classList.remove(...activeClasses);
        mobileContact.classList.add("text-fg/80");
        mobileContact.removeAttribute("aria-current");

        mobileAbout.classList.add(...activeClasses);
        mobileAbout.classList.remove("text-fg/80");
        mobileAbout.setAttribute("aria-current", "page");
      }
    }
  }

  async function navigateTo(url, push = true) {
    try {
      const response = await fetch(url);
      if (!response.ok) {
        window.location.href = url;
        return;
      }
      const htmlText = await response.text();
      const parser = new DOMParser();
      const newDoc = parser.parseFromString(htmlText, "text/html");

      // 1. Update Title
      if (newDoc.title) {
        document.title = newDoc.title;
      }

      // 2. Replace <main> content
      const newMain = newDoc.querySelector("main");
      const currentMain = document.querySelector("main");
      if (newMain && currentMain) {
        currentMain.innerHTML = newMain.innerHTML;
      }

      // 3. Update active nav indicator in header
      updateNavActive(url);

      // 4. Scroll to top
      window.scrollTo({ top: 0, behavior: "instant" });

      // 5. Re-initialize page specific scripts
      initScrollReveal();
      initProjectFilters();
      initContactForm();

      // 6. Push browser history
      if (push) {
        history.pushState({ path: url }, "", url);
      }
    } catch (err) {
      // Fallback to normal navigation if fetch fails
      window.location.href = url;
    }
  }

  function initSeamlessNav() {
    document.addEventListener("click", (event) => {
      // Find closest anchor tag
      const link = event.target.closest("a");
      if (!link) return;

      const href = link.getAttribute("href");
      if (!href) return;

      // Ignore external links, mailto, target="_blank", or hash jumps
      if (
        href.startsWith("http") ||
        href.startsWith("mailto:") ||
        href.startsWith("#") ||
        link.getAttribute("target") === "_blank"
      ) {
        return;
      }

      // Internal page links (index.html or contact.html)
      if (href.includes("index.html") || href.includes("contact.html")) {
        event.preventDefault();
        navigateTo(href);
      }
    });

    window.addEventListener("popstate", (event) => {
      navigateTo(window.location.pathname || "./index.html", false);
    });
  }

  // ================================================================
  // INITIALIZATION ON DOM READY
  // ================================================================
  document.addEventListener("DOMContentLoaded", () => {
    initThemeToggle();
    updateClock();
    setInterval(updateClock, 1000);
    initScrollReveal();
    initProjectFilters();
    initContactForm();
    initSeamlessNav();
  });
})();
