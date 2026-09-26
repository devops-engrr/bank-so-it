(() => {
  const catalog = document.getElementById("quiz-catalog");
  const categoryNav = document.getElementById("quiz-category-nav");
  const totalCount = document.getElementById("quiz-total-count");
  if (!catalog) return;

  const CATEGORY_META = {
    "IT Professional Knowledge": { icon: "💻", description: "DBMS, Networking, Operating Systems, DSA, OOP, Cybersecurity, Cloud and more." },
    "English": { icon: "📖", description: "Grammar, vocabulary, comprehension and exam-oriented English practice." },
    "Quant & Reasoning": { icon: "🧮", description: "Quantitative aptitude, reasoning and banking-exam problem solving." },
    "Banking Awareness": { icon: "🏦", description: "Banking history, banking system, RBI and other exam-focused banking topics." }
  };
  const CATEGORY_ORDER = ["IT Professional Knowledge", "English", "Quant & Reasoning", "Banking Awareness"];
  const esc = (value) => String(value ?? "").replace(/[&<>"']/g, (char) => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;", "'":"&#039;"}[char]));
  const slug = (value) => String(value || "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

  async function fetchJson(url) {
    const response = await fetch(url, { cache: "no-store" });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    return response.json();
  }

  async function loadCatalog() {
    const cacheBust = `v=${Date.now()}`;
    const urls = [
      new URL(`/data/quizzes-index.json?${cacheBust}`, location.origin).href,
      new URL(`../data/quizzes-index.json?${cacheBust}`, location.href).href
    ];
    let lastError;
    for (const url of urls) {
      try { return await fetchJson(url); } catch (error) { lastError = error; }
    }
    if (Array.isArray(window.BANK_SO_IT_QUIZ_CATALOG)) return { quizzes: window.BANK_SO_IT_QUIZ_CATALOG };
    throw lastError || new Error("Quiz catalog request failed");
  }

  function render(quizzes) {
    if (totalCount) {
      const totalQuestions = quizzes.reduce((sum, quiz) => sum + Number(quiz.questionCount || 0), 0);
      totalCount.textContent = `${quizzes.length} ${quizzes.length === 1 ? "Quiz" : "Quizzes"} · ${totalQuestions} Questions`;
    }
    const grouped = new Map();
    quizzes.forEach((quiz) => { if (!grouped.has(quiz.category)) grouped.set(quiz.category, []); grouped.get(quiz.category).push(quiz); });
    const discovered = [...grouped.keys()];
    const categories = [...new Set([...CATEGORY_ORDER, ...discovered])].sort((a,b) => {
      const ai=CATEGORY_ORDER.indexOf(a), bi=CATEGORY_ORDER.indexOf(b);
      return (ai===-1?999:ai)-(bi===-1?999:bi) || a.localeCompare(b);
    });
    if (categoryNav) {
      categoryNav.innerHTML = categories.map((category) => {
        const meta=CATEGORY_META[category] || {icon:"📝",description:"Topic-wise exam practice."};
        const count=grouped.get(category)?.length || 0;
        const card=`<span class="quiz-category-icon">${meta.icon}</span><strong>${esc(category)}</strong><span>${count ? `${count} ${count===1?"quiz":"quizzes"}` : "Coming soon"}</span>`;
        return count ? `<a class="quiz-category-card" href="#category-${slug(category)}">${card}</a>` : `<div class="quiz-category-card is-empty" aria-disabled="true">${card}</div>`;
      }).join("");
    }
    catalog.innerHTML = categories.filter(category => (grouped.get(category)||[]).length).map((category) => {
      const meta=CATEGORY_META[category] || {icon:"📝",description:"Topic-wise exam practice."};
      const items=(grouped.get(category)||[]).slice().sort((a,b)=>String(a.topic||"").localeCompare(String(b.topic||"")) || Number(a.part||0)-Number(b.part||0) || String(a.title||"").localeCompare(String(b.title||"")));
      const topicGroups=new Map();
      items.forEach(q=>{const key=q.topic||"General";if(!topicGroups.has(key))topicGroups.set(key,[]);topicGroups.get(key).push(q);});
      return `<section class="quiz-category-section" id="category-${slug(category)}"><div class="quiz-category-heading"><div><span class="quiz-category-label">${meta.icon} ${esc(category)}</span><h2>${esc(category)}</h2><p>${esc(meta.description)}</p></div></div>${[...topicGroups.entries()].map(([topic,qs])=>`<div class="quiz-topic-group"><div class="quiz-topic-heading"><h3>${esc(topic)}</h3><span>${qs.length} ${qs.length===1?"quiz":"quizzes"}</span></div><div class="quiz-card-grid">${qs.map(q=>`<a class="quiz-card" href="/quiz/?id=${encodeURIComponent(q.id)}"><span class="quiz-card-kicker">${esc(q.subtopic||topic)}</span><h3>${esc(q.title)}</h3><p>${esc(q.description)}</p><div class="quiz-card-meta"><span>${esc(q.questionCount)} Questions · ${esc(q.difficulty||"Exam Practice")}</span><span>Start →</span></div></a>`).join("")}</div></div>`).join("")}</section>`;
    }).join("");
  }

  loadCatalog().then(payload => render(Array.isArray(payload.quizzes) ? payload.quizzes : [])).catch(() => {
    catalog.innerHTML = `<div class="quiz-error"><h2>Quizzes could not be loaded</h2><p>Please try again in a moment.</p></div>`;
    if (totalCount) totalCount.textContent = "Quiz catalog unavailable";
  });
})();
