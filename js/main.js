document.addEventListener("DOMContentLoaded", () => {

  /*
   * Theme system
   * - Uses the visitor's saved preference when available.
   * - Otherwise follows the operating-system preference.
   * - Saves the choice for future visits.
   */
  const applyTheme = (theme) => {
    document.documentElement.dataset.theme = theme;
  };

  const savedTheme = localStorage.getItem("bankSoItTheme");
  const systemTheme = window.matchMedia("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light";

  applyTheme(savedTheme === "dark" || savedTheme === "light" ? savedTheme : systemTheme);

  const navLinks = document.querySelector(".nav-links");

  if (navLinks && !document.querySelector("[data-theme-toggle]")) {
    const themeButton = document.createElement("button");
    themeButton.type = "button";
    themeButton.className = "theme-toggle";
    themeButton.setAttribute("data-theme-toggle", "true");

    const updateThemeButton = () => {
      const dark = document.documentElement.dataset.theme === "dark";
      themeButton.textContent = dark ? "☀ Light" : "🌙 Dark";
      themeButton.setAttribute("aria-label", dark ? "Switch to light mode" : "Switch to dark mode");
      themeButton.title = dark ? "Switch to light mode" : "Switch to dark mode";
    };

    themeButton.addEventListener("click", () => {
      const nextTheme = document.documentElement.dataset.theme === "dark" ? "light" : "dark";
      applyTheme(nextTheme);
      localStorage.setItem("bankSoItTheme", nextTheme);
      updateThemeButton();
    });

    const accountLink = navLinks.querySelector("[data-account-link]");
    if (accountLink) {
      accountLink.insertAdjacentElement("afterend", themeButton);
    } else {
      navLinks.appendChild(themeButton);
    }

    updateThemeButton();
  }

  /*
   * Canonical home URL
   *
   * Keep the public home URL as https://banksoit.com/ instead of
   * exposing /index.html when a visitor clicks a logo or Home link.
   */
  document.querySelectorAll('a[href="index.html"], a[href="./index.html"]').forEach((link) => {
    link.setAttribute("href", "/");
  });

  /*
   * Mobile navigation
   */
  const toggle = document.querySelector(".menu-toggle");
  const nav = document.querySelector(".nav-links");

  if (toggle && nav) {
    toggle.addEventListener("click", () => {
      const open = nav.classList.toggle("open");
      toggle.setAttribute("aria-expanded", String(open));
    });

    /*
     * Close the mobile menu after a navigation link is selected.
     */
    nav.addEventListener("click", (event) => {
      if (event.target.closest("a")) {
        nav.classList.remove("open");
        toggle.setAttribute("aria-expanded", "false");
      }
    });
  }


  /*
   * Account navigation
   *
   * Public pages only need the Supabase client to determine whether
   * the visitor has an active session. The publishable key remains in
   * js/supabase.js. Never place the Supabase secret/service-role key here.
   */
  const accountLink = document.querySelector("[data-account-link]");

  const loadScript = (src) => {
    return new Promise((resolve, reject) => {
      const existing = document.querySelector(`script[src="${src}"]`);

      if (existing) {
        if (existing.dataset.loaded === "true") {
          resolve();
          return;
        }

        existing.addEventListener("load", resolve, { once: true });
        existing.addEventListener("error", reject, { once: true });
        return;
      }

      const script = document.createElement("script");
      script.src = src;
      script.async = false;

      script.addEventListener("load", () => {
        script.dataset.loaded = "true";
        resolve();
      }, { once: true });

      script.addEventListener("error", () => {
        reject(new Error(`Unable to load ${src}`));
      }, { once: true });

      document.head.appendChild(script);
    });
  };


  const ensureSupabaseClient = async () => {

    /*
     * auth/dashboard routes already load Supabase themselves.
     * On public pages we load the same client only when needed.
     */
    if (!window.supabase) {
      await loadScript(
        "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"
      );
    }

    if (!window.bankSoItSupabase) {
      await loadScript("/js/supabase.js");
    }

    if (!window.bankSoItSupabase) {
      throw new Error("Bank SO IT Supabase client is not configured.");
    }

    return window.bankSoItSupabase;
  };


  const updateAccountLink = (session) => {

    if (!accountLink) {
      return;
    }

    const loggedIn = Boolean(session);

    accountLink.textContent = loggedIn
      ? "Dashboard"
      : "Login / Sign Up";

    accountLink.href = loggedIn
      ? "/dashboard/"
      : "/auth/";

    accountLink.classList.toggle(
      "is-authenticated",
      loggedIn
    );

    accountLink.setAttribute(
      "aria-label",
      loggedIn
        ? "Open your Bank SO IT dashboard"
        : "Login or create a Bank SO IT account"
    );
  };


  const initAccountNavigation = async () => {

    if (!accountLink) {
      return;
    }

    /*
     * Keep Login / Sign Up as the safe fallback while the session
     * is being resolved.
     */
    updateAccountLink(null);

    try {

      const client = await ensureSupabaseClient();

      const {
        data: { session }
      } = await client.auth.getSession();

      updateAccountLink(session);

      /*
       * Keep the header synchronized if the user signs in/out in
       * another tab or the session is refreshed.
       */
      client.auth.onAuthStateChange((_event, nextSession) => {
        updateAccountLink(nextSession);
      });

    } catch (error) {

      /*
       * Authentication should never prevent the rest of the public
       * website from working.
       */
      console.warn(
        "Bank SO IT account navigation could not initialize:",
        error
      );

      updateAccountLink(null);
    }
  };


  initAccountNavigation();


  /*
   * Dynamic YouTube videos
   *
   * The GitHub Action updates:
   * data/videos.json
   *
   * This page reads that file and renders the videos.
   */
  const videoGrid = document.getElementById("video-grid");
  const videoLoading = document.getElementById("video-loading");
  const videoError = document.getElementById("video-error");
  const videoStatus = document.getElementById("video-status");

  /* =========================================================
     HOME — LATEST VIDEO CAROUSEL
     ========================================================= */

  const latestViewport = document.getElementById(
    "latest-video-viewport"
  );

  const latestTrack = document.getElementById(
    "latest-video-track"
  );

  const latestDots = document.getElementById(
    "latest-video-dots"
  );

  const latestPrev = document.querySelector(
    ".latest-carousel-prev"
  );

  const latestNext = document.querySelector(
    ".latest-carousel-next"
  );

  let latestVideos = [];
  let latestCurrentIndex = 0;
  let latestAutoTimer = null;
  let latestUserInteracting = false;


  /*
   * Escape HTML
   */
  const latestEscapeHTML = (value) => {
    const div = document.createElement("div");
    div.textContent = value || "";
    return div.innerHTML;
  };


  /*
   * Format date
   */
  const latestFormatDate = (dateString) => {

    if (!dateString) {
      return "";
    }

    const date = new Date(dateString);

    if (Number.isNaN(date.getTime())) {
      return "";
    }

    return new Intl.DateTimeFormat("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric"
    }).format(date);
  };


  /*
   * Short description
   */
  const latestDescription = (description) => {

    if (!description) {
      return "Bank SO IT exam preparation, concepts and revision.";
    }

    const clean = description
      .replace(/\s+/g, " ")
      .trim();

    if (clean.length <= 110) {
      return clean;
    }

    return `${clean.substring(0, 107)}…`;
  };


  /*
   * Create latest video card
   */
  const createLatestVideoCard = (video) => {

    const article = document.createElement("article");

    article.className = "latest-video-card";

    const title = latestEscapeHTML(video.title);
    const description = latestEscapeHTML(
      latestDescription(video.description)
    );

    const thumbnail = latestEscapeHTML(video.thumbnail);
    const url = latestEscapeHTML(video.url);

    const date = latestFormatDate(video.publishedAt);

    article.innerHTML = `
      <a
        class="latest-video-thumbnail"
        href="${url}"
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Watch ${title} on YouTube"
      >

        <img
          src="${thumbnail}"
          alt="${title}"
          loading="lazy"
          decoding="async"
          onerror="this.onerror=null;this.src='/assets/logo/bank-so-it-logo.jpg';"
        >

        <span
          class="latest-video-play"
          aria-hidden="true"
        >
          ▶
        </span>

      </a>

      <div class="latest-video-content">

        <span class="pill">
          YouTube
        </span>

        <h3>
          <a
            href="${url}"
            target="_blank"
            rel="noopener noreferrer"
          >
            ${title}
          </a>
        </h3>

        ${
          date
            ? `<div class="latest-video-date">${date}</div>`
            : ""
        }

        <p>
          ${description}
        </p>

      </div>
    `;

    return article;
  };


  /*
   * Render latest carousel
   */
  const renderLatestCarousel = (videos) => {

    if (
      !latestViewport ||
      !latestTrack
    ) {
      return;
    }

    latestVideos = videos.slice(0, 8);

    latestTrack.innerHTML = "";

    if (!latestVideos.length) {

      latestTrack.innerHTML = `
        <div class="latest-video-message">
          <strong>New videos are coming soon.</strong>
          <span>
            Follow Bank SO IT on YouTube for the latest uploads.
          </span>
        </div>
      `;

      return;
    }


    latestVideos.forEach((video) => {

      latestTrack.appendChild(
        createLatestVideoCard(video)
      );

    });


    /*
     * Build dots
     */
    if (latestDots) {

      latestDots.innerHTML = "";

      latestVideos.forEach((video, index) => {

        const dot = document.createElement("button");

        dot.type = "button";
        dot.className = "latest-carousel-dot";

        dot.setAttribute(
          "aria-label",
          `Show video ${index + 1}`
        );

        dot.addEventListener("click", () => {

          latestGoTo(index);

          latestRestartAutoPlay();

        });

        latestDots.appendChild(dot);

      });

    }


    latestCurrentIndex = 0;

    latestUpdateControls();

    latestStartAutoPlay();

  };


  /*
   * Get card width
   */
  const latestGetCardWidth = () => {

    const card = latestTrack?.querySelector(
      ".latest-video-card"
    );

    if (!card) {
      return 0;
    }

    const styles = window.getComputedStyle(
      latestTrack
    );

    const gap =
      parseFloat(styles.columnGap || styles.gap) || 0;

    return card.offsetWidth + gap;
  };


  /*
   * Go to slide
   */
  const latestGoTo = (index) => {

    if (!latestViewport) {
      return;
    }

    if (!latestVideos.length) {
      return;
    }

    latestCurrentIndex = Math.max(
      0,
      Math.min(
        index,
        latestVideos.length - 1
      )
    );

    const offset =
      latestCurrentIndex *
      latestGetCardWidth();

    latestViewport.scrollTo({
      left: offset,
      behavior:
        window.matchMedia(
          "(prefers-reduced-motion: reduce)"
        ).matches
          ? "auto"
          : "smooth"
    });

    latestUpdateControls();

  };


  /*
   * Update arrows + dots
   */
  const latestUpdateControls = () => {

    if (latestPrev) {
      latestPrev.disabled =
        latestCurrentIndex <= 0;
    }

    if (latestNext) {
      latestNext.disabled =
        latestCurrentIndex >=
        latestVideos.length - 1;
    }


    if (latestDots) {

      const dots =
        latestDots.querySelectorAll(
          ".latest-carousel-dot"
        );

      dots.forEach((dot, index) => {

        dot.classList.toggle(
          "active",
          index === latestCurrentIndex
        );

      });

    }

  };


  /*
   * Previous
   */
  latestPrev?.addEventListener(
    "click",
    () => {

      latestGoTo(
        latestCurrentIndex - 1
      );

      latestRestartAutoPlay();

    }
  );


  /*
   * Next
   */
  latestNext?.addEventListener(
    "click",
    () => {

      latestGoTo(
        latestCurrentIndex + 1
      );

      latestRestartAutoPlay();

    }
  );


  /*
   * Auto-play
   *
   * Changes every 5 seconds.
   */
  const latestStartAutoPlay = () => {

    latestStopAutoPlay();

    if (
      latestVideos.length <= 1
    ) {
      return;
    }

    latestAutoTimer =
      window.setInterval(() => {

        if (latestUserInteracting) {
          return;
        }

        if (
          latestCurrentIndex >=
          latestVideos.length - 1
        ) {

          latestGoTo(0);

        } else {

          latestGoTo(
            latestCurrentIndex + 1
          );

        }

      }, 5000);

  };


  const latestStopAutoPlay = () => {

    if (latestAutoTimer) {

      window.clearInterval(
        latestAutoTimer
      );

      latestAutoTimer = null;

    }

  };


  const latestRestartAutoPlay = () => {

    latestStopAutoPlay();

    window.setTimeout(
      latestStartAutoPlay,
      1200
    );

  };


  /*
   * Pause when mouse is over carousel
   */
  latestViewport?.addEventListener(
    "mouseenter",
    () => {

      latestUserInteracting = true;
      latestStopAutoPlay();

    }
  );


  latestViewport?.addEventListener(
    "mouseleave",
    () => {

      latestUserInteracting = false;
      latestStartAutoPlay();

    }
  );


  /*
   * Pause while touching/swiping
   */
  latestViewport?.addEventListener(
    "touchstart",
    () => {

      latestUserInteracting = true;
      latestStopAutoPlay();

    },
    {
      passive: true
    }
  );


  latestViewport?.addEventListener(
    "touchend",
    () => {

      latestUserInteracting = false;
      latestStartAutoPlay();

    },
    {
      passive: true
    }
  );


  /*
   * Keyboard support
   */
  latestViewport?.addEventListener(
    "keydown",
    (event) => {

      if (event.key === "ArrowRight") {

        event.preventDefault();

        latestGoTo(
          latestCurrentIndex + 1
        );

        latestRestartAutoPlay();

      }

      if (event.key === "ArrowLeft") {

        event.preventDefault();

        latestGoTo(
          latestCurrentIndex - 1
        );

        latestRestartAutoPlay();

      }

    }
  );


  /*
   * Load latest videos for homepage
   *
   * Uses the SAME videos.json generated by
   * GitHub Actions.
   */
  const loadLatestVideos = async () => {

    if (
      !latestTrack
    ) {
      return;
    }

    /*
     * Loading skeleton
     */
    latestTrack.innerHTML = `
      <div class="latest-video-skeleton"></div>
      <div class="latest-video-skeleton"></div>
      <div class="latest-video-skeleton"></div>
    `;


    try {

      const response = await fetch(
        `/data/videos.json?v=${Date.now()}`,
        {
          cache: "no-store"
        }
      );


      if (!response.ok) {
        throw new Error(
          `HTTP ${response.status}`
        );
      }


      const data =
        await response.json();


      if (
        !data ||
        !Array.isArray(data.videos)
      ) {
        throw new Error(
          "Invalid video data"
        );
      }


      /*
       * Videos are already ordered
       * newest → oldest by the
       * GitHub sync workflow.
       */
      renderLatestCarousel(
        data.videos
      );

    } catch (error) {

      console.error(
        "Latest Bank SO IT videos failed:",
        error
      );

      latestTrack.innerHTML = `
        <div class="latest-video-message">
          <strong>Latest videos are temporarily unavailable.</strong>
          <span>
            Please try again shortly or visit the
            Bank SO IT YouTube channel.
          </span>
        </div>
      `;

    }

  };


  /*
   * Start homepage carousel
   */
  loadLatestVideos();
  /*
   * main.js is shared by multiple pages. Initialize the YouTube
   * renderer only when either the full video grid or the Home-page
   * latest-video slot exists.
   */
  if (!videoGrid && !latestTrack) {
    return;
  }


  /*
   * Escape HTML so titles/descriptions coming from
   * the JSON cannot inject HTML into the page.
   */
  const escapeHTML = (value) => {
    const div = document.createElement("div");
    div.textContent = value || "";
    return div.innerHTML;
  };


  /*
   * Format YouTube publication date
   */
  const formatDate = (dateString) => {

    if (!dateString) {
      return "";
    }

    const date = new Date(dateString);

    if (Number.isNaN(date.getTime())) {
      return "";
    }

    return new Intl.DateTimeFormat("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric"
    }).format(date);
  };


  /*
   * Create a short description for the card.
   */
  const getDescription = (description) => {

    if (!description) {
      return "Bank SO IT exam preparation, concepts and revision.";
    }

    const clean = description
      .replace(/\s+/g, " ")
      .trim();

    if (clean.length <= 150) {
      return clean;
    }

    return `${clean.substring(0, 147)}…`;
  };


  /*
   * Create one video card for the Videos page.
   */
  const createVideoCard = (video) => {

    const article = document.createElement("article");
    article.className = "dynamic-video-card";

    const title = escapeHTML(video.title);
    const description = escapeHTML(getDescription(video.description));
    const thumbnail = escapeHTML(video.thumbnail);
    const url = escapeHTML(video.url);
    const publishedDate = formatDate(video.publishedAt);

    article.innerHTML = `
      <a class="dynamic-video-thumbnail"
         href="${url}"
         target="_blank"
         rel="noopener noreferrer"
         aria-label="Watch ${title} on YouTube">
        <img src="${thumbnail}"
             alt="${title}"
             loading="lazy"
             onerror="this.onerror=null;this.src='/assets/logo/bank-so-it-logo.jpg';">
        <span class="dynamic-video-play">▶</span>
      </a>

      <div class="dynamic-video-content">
        <span class="pill">YouTube</span>
        <h3><a href="${url}" target="_blank" rel="noopener noreferrer">${title}</a></h3>
        ${publishedDate ? `<div class="dynamic-video-date">${publishedDate}</div>` : ""}
        <p>${description}</p>
        <a class="dynamic-video-link" href="${url}" target="_blank" rel="noopener noreferrer">Watch on YouTube ↗</a>
      </div>
    `;

    return article;
  };


  /*
   * Load videos.json
   */
  const loadVideos = async () => {

    try {
      const response = await fetch(`/data/videos.json?v=${Date.now()}`, {
        cache: "no-store"
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const data = await response.json();

      if (!data || !Array.isArray(data.videos)) {
        throw new Error("Invalid video data");
      }

      const validVideos = data.videos
        .filter((video) => video && video.url && video.title)
        .sort((a, b) => {
          const aTime = Date.parse(a.publishedAt || "");
          const bTime = Date.parse(b.publishedAt || "");
          return (Number.isNaN(bTime) ? 0 : bTime) - (Number.isNaN(aTime) ? 0 : aTime);
        });

      /* Videos page: render the complete synchronized library. */
      if (videoGrid) {
        videoGrid.innerHTML = "";

        validVideos.forEach((video) => {
          videoGrid.appendChild(createVideoCard(video));
        });

        if (videoLoading) {
          videoLoading.hidden = true;
        }

        if (videoStatus) {
          videoStatus.textContent = validVideos.length
            ? `${validVideos.length} videos • Automatically synced from YouTube`
            : "No videos available yet.";
        }

        if (validVideos.length === 0 && videoError) {
          videoError.hidden = false;
        }
      }

    } catch (error) {
      console.error("Bank SO IT video loading failed:", error);

      if (videoLoading) {
        videoLoading.hidden = true;
      }

      if (videoError) {
        videoError.hidden = false;
      }

      if (videoStatus) {
        videoStatus.textContent = "Unable to load videos right now.";
      }

      if (latestLoading) {
        }

      if (latestError) {
        }
    }
  };


  /*
   * Start loading videos
   */
  loadVideos();

});
