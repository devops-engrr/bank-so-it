(() => {
  const catalog = document.getElementById("quiz-catalog");
  const categoryNav = document.getElementById("quiz-category-nav");
  const totalCount = document.getElementById("quiz-total-count");

  if (!catalog) return;

  const CATEGORY_META = {
    "IT Professional Knowledge": {
      icon: "💻",
      description: "DBMS, Networking, Operating Systems, DSA, OOP, Cybersecurity, Cloud and more."
    },
    "English": {
      icon: "📖",
      description: "Grammar, vocabulary, comprehension and exam-oriented English practice."
    },
    "Quant & Reasoning": {
      icon: "🧮",
      description: "Quantitative aptitude, reasoning and banking-exam problem solving."
    },
    "Banking Awareness": {
      icon: "🏦",
      description: "Banking history, banking system, RBI and other exam-focused banking topics."
    }
  };

  const CATEGORY_ORDER = [
    "IT Professional Knowledge",
    "English",
    "Quant & Reasoning",
    "Banking Awareness"
  ];

  const esc = (value) => String(value ?? "").replace(/[&<>"']/g, (char) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#039;"
  }[char]));

  const slug = (value) => String(value || "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

  const load = async () => {
    try {
      const cacheBust = `v=${Date.now()}`;
      const candidates = [
        `/data/quizzes-index.json?${cacheBust}`,
        `../data/quizzes-index.json?${cacheBust}`
      ];
      let payload = null;
      let lastError = null;

      for (const url of candidates) {
        try {
          const response = await fetch(url, { cache: "no-store" });
          if (!response.ok) throw new Error(`HTTP ${response.status}`);
          payload = await response.json();
          break;
        } catch (error) {
          lastError = error;
        }
      }

      if (!payload) throw lastError || new Error("Quiz catalog request failed");
      const quizzes = Array.isArray(payload.quizzes) ? payload.quizzes : [];

      render(quizzes);
    } catch (error) {
      catalog.innerHTML = `
        <div class="quiz-error">
          <h2>Quizzes could not be loaded</h2>
          <p>Please try again in a moment.</p>
        </div>
      `;
      if (totalCount) totalCount.textContent = "Quiz catalog unavailable";
    }
  };

  const render = (quizzes) => {
    if (totalCount) {
      const totalQuestions = quizzes.reduce((sum, quiz) => sum + Number(quiz.questionCount || 0), 0);
      totalCount.textContent = `${quizzes.length} ${quizzes.length === 1 ? "Quiz" : "Quizzes"} · ${totalQuestions} Questions`;
    }

    const grouped = new Map();
    quizzes.forEach((quiz) => {
      if (!grouped.has(quiz.category)) grouped.set(quiz.category, []);
      grouped.get(quiz.category).push(quiz);
    });

    const discoveredCategories = [...grouped.keys()];
    const categories = [...new Set([...CATEGORY_ORDER, ...discoveredCategories])].sort((a, b) => {
      const ai = CATEGORY_ORDER.indexOf(a);
      const bi = CATEGORY_ORDER.indexOf(b);
      return (ai === -1 ? 999 : ai) - (bi === -1 ? 999 : bi) || a.localeCompare(b);
    });

    if (categoryNav) {
      categoryNav.innerHTML = categories.map((category) => {
        const meta = CATEGORY_META[category] || { icon: "📝", description: "Topic-wise exam practice." };
        const count = grouped.get(category)?.length || 0;
        const card = `
          <span class="quiz-category-icon">${meta.icon}</span>
          <strong>${esc(category)}</strong>
          <span>${count ? `${count} ${count === 1 ? "quiz" : "quizzes"}` : "Coming soon"}</span>
        `;
        return count
          ? `<a class="quiz-category-card" href="#category-${slug(category)}">${card}</a>`
          : `<div class="quiz-category-card is-empty" aria-disabled="true">${card}</div>`;
      }).join("");
    }

    if (!quizzes.length) {
      catalog.innerHTML = `
        <div class="quiz-empty">
          <h2>Quizzes are coming soon</h2>
          <p>New topic-wise practice sets will appear here as they are published.</p>
        </div>
      `;
      return;
    }

    catalog.innerHTML = categories.map((category) => {
      const meta = CATEGORY_META[category] || { icon: "📝", description: "Topic-wise exam practice." };
      const items = grouped.get(category).slice().sort((a, b) => {
        const topicCompare = String(a.topic || "").localeCompare(String(b.topic || ""));
        if (topicCompare) return topicCompare;
        return Number(a.part || 0) - Number(b.part || 0) || String(a.title || "").localeCompare(String(b.title || ""));
      });

      const topicGroups = new Map();
      items.forEach((quiz) => {
        const key = quiz.topic || "General";
        if (!topicGroups.has(key)) topicGroups.set(key, []);
        topicGroups.get(key).push(quiz);
      });

      return `
        <section class="quiz-category-section" id="category-${slug(category)}">
          <div class="quiz-category-heading">
            <div>
              <span class="quiz-category-label">${meta.icon} ${esc(category)}</span>
              <h2>${esc(category)}</h2>
              <p>${esc(meta.description)}</p>
            </div>
          </div>
          ${[...topicGroups.entries()].map(([topic, topicQuizzes]) => `
            <div class="quiz-topic-group">
              <div class="quiz-topic-heading">
                <h3>${esc(topic)}</h3>
                <span>${topicQuizzes.length} ${topicQuizzes.length === 1 ? "quiz" : "quizzes"}</span>
              </div>
              <div class="quiz-card-grid">
                ${topicQuizzes.map((quiz) => `
                  <a class="quiz-card" href="/quiz/?id=${encodeURIComponent(quiz.id)}">
                    <span class="quiz-card-kicker">${esc(quiz.subtopic || topic)}</span>
                    <h3>${esc(quiz.title)}</h3>
                    <p>${esc(quiz.description)}</p>
                    <div class="quiz-card-meta">
                      <span>${esc(quiz.questionCount)} Questions · ${esc(quiz.difficulty || "Exam Practice")}</span>
                      <span>Start →</span>
                    </div>
                  </a>
                `).join("")}
              </div>
            </div>
          `).join("")}
        </section>
      `;
    }).join("");
  };

  load();
})();
