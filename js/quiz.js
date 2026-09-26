(() => {
  const app = document.getElementById("quiz-app");
  if (!app) return;

  const id = new URLSearchParams(location.search).get("id");
  const esc = (value) => String(value ?? "").replace(/[&<>"']/g, (char) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#039;"
  }[char]));

  let quiz;
  let meta;
  let index = 0;
  let score = 0;
  let selected = null;
  let submitted = false;
  let answers = [];

  const load = async () => {
    try {
      if (!id) throw new Error("Missing quiz id");

      const cacheBust = `v=${Date.now()}`;
      const indexUrls = [
        `/data/quizzes-index.json?${cacheBust}`,
        `../data/quizzes-index.json?${cacheBust}`
      ];
      let catalog = null;
      let lastError = null;
      for (const url of indexUrls) {
        try {
          const indexResponse = await fetch(url, { cache: "no-store" });
          if (!indexResponse.ok) throw new Error(`HTTP ${indexResponse.status}`);
          catalog = await indexResponse.json();
          break;
        } catch (error) {
          lastError = error;
        }
      }
      if (!catalog && Array.isArray(window.BANK_SO_IT_QUIZ_CATALOG)) {
        catalog = { quizzes: window.BANK_SO_IT_QUIZ_CATALOG };
      }
      if (!catalog) throw lastError || new Error("Quiz catalog unavailable");
      meta = (catalog.quizzes || []).find((item) => item.id === id);
      if (!meta && window.BANK_SO_IT_QUIZ_DATA && window.BANK_SO_IT_QUIZ_DATA[id]) {
        const fallback = window.BANK_SO_IT_QUIZ_DATA[id];
        meta = { id, title: fallback.title, description: fallback.description, category: fallback.category, topic: fallback.topic, subtopic: fallback.subtopic, questionCount: fallback.questionCount, difficulty: "Exam Practice", file: `data/quizzes/${id}.json` };
      }
      if (!meta) throw new Error("Quiz not found");

      document.title = `${meta.title} | Bank SO IT`;
      const descriptionMeta = document.querySelector('meta[name="description"]');
      if (descriptionMeta && meta.description) {
        descriptionMeta.setAttribute("content", meta.description);
      }

      const quizUrls = [
        `/${meta.file}?${cacheBust}`,
        `../${meta.file}?${cacheBust}`
      ];
      let quizPayload = null;
      for (const url of quizUrls) {
        try {
          const quizResponse = await fetch(url, { cache: "no-store" });
          if (!quizResponse.ok) throw new Error(`HTTP ${quizResponse.status}`);
          quizPayload = await quizResponse.json();
          break;
        } catch (error) {
          lastError = error;
        }
      }
      if (!quizPayload && window.BANK_SO_IT_QUIZ_DATA && window.BANK_SO_IT_QUIZ_DATA[id]) {
        quizPayload = window.BANK_SO_IT_QUIZ_DATA[id];
      }
      if (!quizPayload) throw lastError || new Error("Quiz unavailable");

      quiz = quizPayload;
      render();
    } catch (error) {
      app.innerHTML = `
        <div class="quiz-error">
          <h2>Quiz could not be loaded</h2>
          <p>The requested quiz is not available right now. Please return to Daily Quiz and try again.</p>
          <a class="btn btn-primary" href="/quizzes/">Back to Daily Quiz</a>
        </div>
      `;
    }
  };

  const hint = (question) => {
    if (/Each|Every|Both|Who|Whom|R0[1-3]/i.test(question.question)) {
      return "Identify the grammatical role or construction being tested, then compare each option with the relevant rule.";
    }
    return "Recall the relevant concept, timeline, category or definition before choosing.";
  };

  const render = () => {
    const question = quiz.questions[index];
    const percent = Math.round((index / quiz.questions.length) * 100);

    app.innerHTML = `
      <div class="quiz-head">
        <span class="eyebrow dark">${esc(meta.category)} · ${esc(meta.topic)}</span>
        <h1>${esc(quiz.title || meta.title)}</h1>
        <p class="quiz-subtitle">${esc(quiz.description || quiz.subtitle || meta.description)}</p>
      </div>

      <div class="quiz-progress-row">
        <span>Question ${index + 1} of ${quiz.questions.length}</span>
        <span>${percent}% complete</span>
      </div>
      <div class="quiz-progress"><span style="width:${percent}%"></span></div>

      <article class="quiz-question-card">
        <div class="quiz-qno">QUESTION ${index + 1}</div>
        <div class="quiz-question">${esc(question.question)}</div>
        <div class="quiz-options">
          ${question.options.map((option) => `
            <button class="quiz-option ${selected === option.id ? "selected" : ""}" data-o="${esc(option.id)}" ${submitted ? "disabled" : ""}>
              <span class="quiz-key">${esc(option.id)}</span>
              <span>${esc(option.text)}</span>
            </button>
          `).join("")}
        </div>

        <details class="quiz-hint">
          <summary>Need a hint?</summary>
          <p>${esc(hint(question))}</p>
        </details>

        ${submitted ? `
          <div class="quiz-feedback">
            <div class="feedback">
              <h4>${selected === question.answer ? "✓ Answer explained" : "✕ Review your answer"}</h4>
              <p>${esc(question.explanation)}</p>
            </div>
            <div class="feedback">
              <h4>⭐ Most Important Point</h4>
              <p>${esc(question.importantPoint)}</p>
            </div>
            ${question.examTrap ? `<div class="feedback"><h4>⚠️ Exam Trap</h4><p>${esc(question.examTrap)}</p></div>` : ""}
          </div>
        ` : ""}

        <div class="quiz-actions">
          ${submitted
            ? `<button class="quiz-next">${index === quiz.questions.length - 1 ? "View Results" : "Next Question →"}</button>`
            : `<button class="quiz-submit" disabled>Submit answer</button>`}
        </div>
      </article>
    `;

    app.querySelectorAll(".quiz-option").forEach((button) => {
      button.addEventListener("click", () => {
        if (!submitted) {
          selected = button.dataset.o;
          render();
        }
      });
    });

    const submit = app.querySelector(".quiz-submit");
    if (submit) {
      submit.disabled = !selected;
      submit.addEventListener("click", () => {
        submitted = true;
        answers[index] = selected;
        if (selected === question.answer) score += 1;
        render();

        app.querySelectorAll(".quiz-option").forEach((button) => {
          if (button.dataset.o === question.answer) button.classList.add("correct");
          if (button.dataset.o === selected && selected !== question.answer) button.classList.add("wrong");
        });
      });
    }

    const next = app.querySelector(".quiz-next");
    if (next) {
      next.addEventListener("click", () => {
        if (index === quiz.questions.length - 1) {
          results();
          return;
        }
        index += 1;
        selected = null;
        submitted = false;
        render();
        window.scrollTo({ top: 0, behavior: "smooth" });
      });
    }
  };

  const results = () => {
    const percent = Math.round((score / quiz.questions.length) * 100);

    app.innerHTML = `
      <div class="quiz-result">
        <span class="eyebrow dark">QUIZ COMPLETE</span>
        <h1>${esc(quiz.title || meta.title)}</h1>
        <p class="quiz-subtitle">${esc(meta.description || quiz.subtitle || "")}</p>
        <div class="score">${score}/${quiz.questions.length}</div>
        <p>${percent}% accuracy</p>
        <div class="result-actions">
          <button class="quiz-retry" id="retry">Retry Quiz</button>
          <a href="/quizzes/">All Daily Quizzes</a>
        </div>
        <div class="review">
          <h2>Review Answers</h2>
          ${quiz.questions.map((question, i) => `
            <div class="review-item">
              <strong>${i + 1}. ${esc(question.question)}</strong>
              <p>${answers[i] === question.answer ? "✓ Correct" : "✕ Review"} · Your answer: ${esc(answers[i] || "Not answered")} · Correct: ${esc(question.answer)}</p>
              <p>${esc(question.explanation)}</p>
              <p><strong>⭐ ${esc(question.importantPoint)}</strong></p>
              ${question.examTrap ? `<p><strong>⚠️ ${esc(question.examTrap)}</strong></p>` : ""}
            </div>
          `).join("")}
        </div>
      </div>
    `;

    document.getElementById("retry").addEventListener("click", () => {
      index = 0;
      score = 0;
      selected = null;
      submitted = false;
      answers = [];
      render();
      window.scrollTo({ top: 0, behavior: "smooth" });
    });
  };

  load();
})();
