document.addEventListener("DOMContentLoaded", () => {

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
  }


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

  if (!videoGrid) {
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
   * Create one video card.
   */
  const createVideoCard = (video) => {

    const article = document.createElement("article");

    article.className = "dynamic-video-card";

    const title = escapeHTML(video.title);
    const description = escapeHTML(
      getDescription(video.description)
    );

    const thumbnail = escapeHTML(video.thumbnail);
    const url = escapeHTML(video.url);

    const publishedDate = formatDate(video.publishedAt);

    article.innerHTML = `
      <a
        class="dynamic-video-thumbnail"
        href="${url}"
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Watch ${title} on YouTube"
      >

        <img
          src="${thumbnail}"
          alt="${title}"
          loading="lazy"
          onerror="this.onerror=null;this.src='assets/logo/bank-so-it-logo.jpg';"
        >

        <span class="dynamic-video-play">
          ▶
        </span>

      </a>


      <div class="dynamic-video-content">

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
          publishedDate
            ? `<div class="dynamic-video-date">${publishedDate}</div>`
            : ""
        }

        <p>
          ${description}
        </p>

        <a
          class="dynamic-video-link"
          href="${url}"
          target="_blank"
          rel="noopener noreferrer"
        >
          Watch on YouTube ↗
        </a>

      </div>
    `;

    return article;
  };


  /*
   * Load videos.json
   */
  const loadVideos = async () => {

    try {

      /*
       * Cache-busting query parameter.
       *
       * This prevents the browser from displaying an
       * older cached videos.json after a GitHub Action update.
       */
      const response = await fetch(
        `data/videos.json?v=${Date.now()}`,
        {
          cache: "no-store"
        }
      );


      if (!response.ok) {
        throw new Error(
          `HTTP ${response.status}`
        );
      }


      const data = await response.json();


      if (!data || !Array.isArray(data.videos)) {
        throw new Error(
          "Invalid video data"
        );
      }


      /*
       * Clear loading state
       */
      videoGrid.innerHTML = "";


      /*
       * Render videos
       */
      data.videos.forEach((video) => {

        if (!video || !video.url || !video.title) {
          return;
        }

        videoGrid.appendChild(
          createVideoCard(video)
        );

      });


      /*
       * Hide loading state
       */
      videoLoading.hidden = true;


      /*
       * Update status
       */
      const count = data.videos.length;

      videoStatus.textContent =
        `${count} videos • Automatically synced from YouTube`;


      /*
       * If no videos were returned
       */
      if (count === 0) {

        videoStatus.textContent =
          "No videos available yet.";

        videoError.hidden = false;
      }

    } catch (error) {

      console.error(
        "Bank SO IT video loading failed:",
        error
      );


      videoLoading.hidden = true;

      videoError.hidden = false;

      videoStatus.textContent =
        "Unable to load videos right now.";

    }

  };


  /*
   * Start loading videos
   */
  loadVideos();

});