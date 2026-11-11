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
  // 5. CONTACT FORM — Cybersecurity hardened with rate-limiting
  //
  // Protections:
  //  • Honeypot field (bots fill it, humans don't) — silently rejected
  //  • Daily message quota per browser (localStorage): max 3 / day
  //  • Cooldown between submissions: 10 minutes (localStorage)
  //  • Subject sanitization: strip HTML/tags & dangerous headers
  //  • Body sanitization: strip HTML tags, control chars, email header injection
  //  • Live character counter (0/120 subject, 0/1500 body)
  //  • URL / javascript: / data: payload detection & rejection (XSS)
  //  • Send button locked during cooldown with countdown
  //  • encodeURIComponent — spaces become %20 (never '+')
  // Note: mailto: itself is client-side, so a determined abuser can open their
  // mail client manually. These layers stop accidental spam, scripted bots,
  // and XSS/header injection from the messages they generate.
  // ================================================================
  const CONTACT_LIMITS = {
    DAILY_MAX: 3,                    // max messages per browser per rolling 24h
    COOLDOWN_MS: 10 * 60 * 1000,     // 10 min cooldown between sends
    STORAGE_KEY_TS: "contact_last_ts",
    STORAGE_KEY_DAILY: "contact_daily_log"
  };

  function contactReadDailyLog() {
    try {
      const raw = localStorage.getItem(CONTACT_LIMITS.STORAGE_KEY_DAILY);
      const arr = raw ? JSON.parse(raw) : [];
      const now = Date.now();
      const valid = arr.filter((ts) => now - ts < 24 * 60 * 60 * 1000);
      if (valid.length !== arr.length) {
        localStorage.setItem(CONTACT_LIMITS.STORAGE_KEY_DAILY, JSON.stringify(valid));
      }
      return valid;
    } catch (e) {
      return [];
    }
  }

  function contactWriteDailyLog(log) {
    try {
      localStorage.setItem(CONTACT_LIMITS.STORAGE_KEY_DAILY, JSON.stringify(log));
    } catch (e) {}
  }

  function contactLastSend() {
    try {
      return Number(localStorage.getItem(CONTACT_LIMITS.STORAGE_KEY_TS)) || 0;
    } catch (e) {
      return 0;
    }
  }

  function contactSetLastSend(ts) {
    try {
      localStorage.setItem(CONTACT_LIMITS.STORAGE_KEY_TS, String(ts));
    } catch (e) {}
  }

  function contactCooldownRemainingMs() {
    const last = contactLastSend();
    if (!last) return 0;
    const elapsed = Date.now() - last;
    return Math.max(0, CONTACT_LIMITS.COOLDOWN_MS - elapsed);
  }

  // Strip HTML tags, scripts and dangerous protocols from a plain-text string
  function contactSanitize(input) {
    if (!input) return "";
    return String(input)
      // remove HTML tags
      .replace(/<[^>]*>/g, "")
      // defang dangerous protocols (XSS)
      .replace(/javascript\s*:/gi, "")
      .replace(/data\s*:/gi, "")
      .replace(/vbscript\s*:/gi, "")
      .replace(/on\w+\s*=/gi, "")
      // strip control characters (except normal whitespace/newlines)
      // eslint-disable-next-line no-control-regex
      .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, "")
      .trim();
  }

  // Detect header injection (newlines + To/Cc/Bcc/Subject) inside subject
  function contactHasHeaderInjection(subject) {
    return /(\r|\n|%0d|%0a|to:|cc:|bcc:|subject:)/i.test(subject);
  }

  // Detect common script/XSS payloads anywhere in the text
  function contactHasDangerousPayload(text) {
    return /(<script|<img|<iframe|onerror\s*=|onclick\s*=|onload\s*=|<svg|<style|<link|<meta)/i.test(text);
  }

  function contactShowStatus(message, kind) {
    const status = document.getElementById("form-status");
    if (!status) return;
    status.textContent = message;
    status.classList.remove("hidden", "error", "ok");
    status.classList.add(kind === "ok" ? "ok" : "error");
  }

  function contactHideStatus() {
    const status = document.getElementById("form-status");
    if (status) {
      status.classList.add("hidden");
      status.textContent = "";
    }
  }

  function contactFormatRemaining(ms) {
    const totalSeconds = Math.ceil(ms / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
  }

  function contactUpdateLockUI() {
    const btn = document.getElementById("contact-submit-btn");
    const label = document.getElementById("contact-submit-label");
    if (!btn || !label) return;

    const remaining = contactCooldownRemainingMs();
    const dailyLog = contactReadDailyLog();
    const dailyUsed = dailyLog.length;

    if (remaining > 0) {
      btn.disabled = true;
      label.textContent = `Wait — retry in ${contactFormatRemaining(remaining)}`;
    } else if (dailyUsed >= CONTACT_LIMITS.DAILY_MAX) {
      btn.disabled = true;
      label.textContent = "Daily limit reached (3 / 24h)";
    } else {
      btn.disabled = false;
      label.textContent = "Send via Email Client";
    }
  }

  function initContactForm() {
    const form = document.getElementById("contact-form");
    if (!form) return;

    // Wipe any stale state from a previous PJAX navigation
    form._hasSubmitListener = false;

    const subjectInput = document.getElementById("contact-subject");
    const bodyInput = document.getElementById("contact-body");
    const subjectCounter = document.getElementById("subject-counter");
    const bodyCounter = document.getElementById("body-counter");
    const honeypot = document.getElementById("contact-website");

    // Live character counters
    if (subjectInput && !subjectInput._hasCounter) {
      subjectInput._hasCounter = true;
      subjectInput.addEventListener("input", () => {
        if (subjectCounter) subjectCounter.textContent = `${subjectInput.value.length} / 120`;
      });
    }
    if (bodyInput && !bodyInput._hasCounter) {
      bodyInput._hasCounter = true;
      bodyInput.addEventListener("input", () => {
        if (bodyCounter) bodyCounter.textContent = `${bodyInput.value.length} / 1500`;
      });
    }

    // Initialise lock state on load (handles refresh during cooldown)
    contactUpdateLockUI();
    // Keep the countdown ticking while the page is open
    if (!window._contactCooldownTimer) {
      window._contactCooldownTimer = setInterval(contactUpdateLockUI, 1000);
    }

    if (form._hasSubmitListener) return;
    form._hasSubmitListener = true;

    form.addEventListener("submit", (event) => {
      event.preventDefault();
      contactHideStatus();

      // 1) Honeypot — silent reject, tell bot nothing
      if (honeypot && honeypot.value.trim() !== "") {
        // Pretend success to the bot
        contactShowStatus("Message sent. I will reply within 24 hours.", "ok");
        form.reset();
        return;
      }

      // 2) Cooldown check
      const remaining = contactCooldownRemainingMs();
      if (remaining > 0) {
        contactShowStatus(`Please wait ${contactFormatRemaining(remaining)} before sending another message.`, "error");
        contactUpdateLockUI();
        return;
      }

      // 3) Daily quota check
      const dailyLog = contactReadDailyLog();
      if (dailyLog.length >= CONTACT_LIMITS.DAILY_MAX) {
        contactShowStatus("Daily message limit reached (3 messages per 24 hours). Please try again tomorrow.", "error");
        contactUpdateLockUI();
        return;
      }

      const rawSubject = subjectInput ? subjectInput.value : "";
      const rawBody = bodyInput ? bodyInput.value : "";

      // 4) Required-field check (defence in depth on top of HTML5 required)
      if (!rawSubject.trim() || !rawBody.trim()) {
        contactShowStatus("Subject and message are required.", "error");
        return;
      }

      // 5) Sanitize
      const subject = contactSanitize(rawSubject).slice(0, 120);
      const body = contactSanitize(rawBody).slice(0, 1500);

      // 6) Header injection / XSS payload detection
      if (contactHasHeaderInjection(subject)) {
        contactShowStatus("Subject contains illegal header characters.", "error");
        return;
      }
      if (contactHasDangerousPayload(rawSubject) || contactHasDangerousPayload(rawBody)) {
        contactShowStatus("Message rejected: contains unsafe content.", "error");
        return;
      }

      // 7) Length floor — blocks empty/one-char spam
      if (subject.length < 3) {
        contactShowStatus("Subject must be at least 3 characters.", "error");
        return;
      }
      if (body.length < 10) {
        contactShowStatus("Message must be at least 10 characters.", "error");
        return;
      }

      // 8) Log the send (rate-limit state) BEFORE opening the mail client,
      //    so refreshing the page cannot bypass the cooldown
      const now = Date.now();
      contactSetLastSend(now);
      contactWriteDailyLog([...dailyLog, now]);

      // 9) Standard RFC 6068 percent-encoding — spaces become %20, never '+'
      const encodedSubject = encodeURIComponent(subject);
      const encodedBody = encodeURIComponent(body);
      const mailtoUrl = `mailto:aditwichaksana@gmail.com?subject=${encodedSubject}&body=${encodedBody}`;

      // 10) Soft cap on mailto URL length (~2000 chars is safe across mail clients)
      if (mailtoUrl.length > 1800) {
        contactShowStatus("Message is too long for your mail client. Please shorten the body.", "error");
        // roll back the log entry we just added
        contactSetLastSend(0);
        contactWriteDailyLog(dailyLog);
        return;
      }

      contactShowStatus("Opening your mail client…", "ok");
      window.location.href = mailtoUrl;

      // Lock the button and start the countdown
      contactUpdateLockUI();
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
