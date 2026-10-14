(() => {
  const app = document.getElementById("quiz-app");
  if (!app) return;

  const id = new URLSearchParams(location.search).get("id");
  const esc = (value) => String(value ?? "").replace(/[&<>"']/g, (char) => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[char]));
  const asArray = (value) => Array.isArray(value) ? value.slice().sort() : value == null ? [] : [value];
  const sameAnswer = (a, b) => {
    const aa = asArray(a), bb = asArray(b);
    return aa.length === bb.length && aa.every((value, i) => value === bb[i]);
  };
  const answerLabel = (question, answer) => {
    const ids = asArray(answer);
    if (!ids.length) return "Not answered";
    return ids.map((key) => {
      const option = question.options.find((item) => item.id === key);
      return `${key}. ${option ? option.text : key}`;
    }).join("; ");
  };

  let quiz, meta, index = 0, selections = [], submittedFlags = [], setSummaryNumber = null;
  const currentQuestion = () => quiz.questions[index];
  const currentSelection = () => selections[index] ?? (currentQuestion()?.type === "multi" ? [] : null);
  const isSubmitted = (i = index) => Boolean(submittedFlags[i]);
  const isCorrect = (question, answer) => sameAnswer(answer, question.answer);
  const getScore = (questions = quiz.questions, offset = 0) => questions.reduce((sum, q, i) => sum + (isSubmitted(offset + i) && isCorrect(q, selections[offset + i]) ? 1 : 0), 0);
  const setQuestions = (number) => quiz.questions.map((q, i) => ({ q, i })).filter(({q}) => q.setNumber === number);

  const load = async () => {
    try {
      if (!id) throw new Error("Missing quiz id");
      const cacheBust = `v=${Date.now()}`;
      const indexUrls = [`/data/quizzes-index.json?${cacheBust}`, `../data/quizzes-index.json?${cacheBust}`];
      let catalog = null, lastError = null;
      for (const url of indexUrls) {
        try { const response = await fetch(url, {cache:"no-store"}); if (!response.ok) throw new Error(`HTTP ${response.status}`); catalog = await response.json(); break; }
        catch (error) { lastError = error; }
      }
      if (!catalog && Array.isArray(window.BANK_SO_IT_QUIZ_CATALOG)) catalog = {quizzes:window.BANK_SO_IT_QUIZ_CATALOG};
      if (!catalog) throw lastError || new Error("Quiz catalog unavailable");
      meta = (catalog.quizzes || []).find((item) => item.id === id);
      if (!meta && window.BANK_SO_IT_QUIZ_DATA?.[id]) {
        const fallback = window.BANK_SO_IT_QUIZ_DATA[id];
        meta = {id,title:fallback.title,description:fallback.description,category:fallback.category,topic:fallback.topic,subtopic:fallback.subtopic,questionCount:fallback.questionCount,difficulty:"Exam Practice",file:`data/quizzes/${id}.json`};
      }
      if (!meta) throw new Error("Quiz not found");
      document.title = `${meta.title} | Bank SO IT`;
      const descriptionMeta = document.querySelector('meta[name="description"]');
      if (descriptionMeta && meta.description) descriptionMeta.setAttribute("content", meta.description);
      let payload = null;
      for (const url of [`/${meta.file}?${cacheBust}`, `../${meta.file}?${cacheBust}`]) {
        try { const response = await fetch(url, {cache:"no-store"}); if (!response.ok) throw new Error(`HTTP ${response.status}`); payload = await response.json(); break; }
        catch (error) { lastError = error; }
      }
      if (!payload && window.BANK_SO_IT_QUIZ_DATA?.[id]) payload = window.BANK_SO_IT_QUIZ_DATA[id];
      if (!payload) throw lastError || new Error("Quiz unavailable");
      quiz = payload;
      selections = Array(quiz.questions.length).fill(null);
      submittedFlags = Array(quiz.questions.length).fill(false);
      renderQuestion();
    } catch (error) {
      app.innerHTML = `<div class="quiz-error"><h2>Quiz could not be loaded</h2><p>The requested quiz is not available right now. Please return to Daily Quiz and try again.</p><a class="btn btn-primary" href="/quizzes/">Back to Daily Quiz</a></div>`;
    }
  };

  const genericHint = (question) => question.hint || "Recall the relevant concept, statutory definition, section or timeline before choosing.";
  const renderQuestion = () => {
    setSummaryNumber = null;
    const question = currentQuestion();
    const submitted = isSubmitted();
    const selected = currentSelection();
    const multi = question.type === "multi" || Array.isArray(question.answer);
    const selectedList = asArray(selected);
    const percent = Math.round((index / quiz.questions.length) * 100);
    const setLabel = question.setNumber ? `Set ${question.setNumber} · ${question.setTitle}` : `${meta.category} · ${meta.topic}`;
    app.innerHTML = `
      <div class="quiz-head"><span class="eyebrow dark">${esc(setLabel)}</span><h1>${esc(quiz.title || meta.title)}</h1><p class="quiz-subtitle">${esc(quiz.description || quiz.subtitle || meta.description)}</p></div>
      ${quiz.instructions?.length ? `<details class="quiz-instructions"><summary>Quiz instructions</summary><ul>${quiz.instructions.map((item)=>`<li>${esc(item)}</li>`).join("")}</ul></details>` : ""}
      <div class="quiz-progress-row"><span>Question ${index + 1} of ${quiz.questions.length}</span><span>${percent}% complete</span></div><div class="quiz-progress"><span style="width:${percent}%"></span></div>
      <article class="quiz-question-card"><div class="quiz-qno">QUESTION ${index + 1}${multi ? " · SELECT ALL THAT APPLY" : ""}</div><div class="quiz-question">${esc(question.question).replace(/\n/g,"<br>")}</div>
      <div class="quiz-options">${question.options.map((option)=>{
        const isSelected = selectedList.includes(option.id);
        const correctIds = asArray(question.answer);
        const isRight = correctIds.includes(option.id);
        const isWrongPick = isSelected && !isRight;
        const classes = ["quiz-option", isSelected ? "selected" : "", submitted && isRight ? "correct" : "", submitted && isWrongPick ? "wrong" : ""].filter(Boolean).join(" ");
        return `<button type="button" class="${classes}" data-o="${esc(option.id)}" aria-pressed="${isSelected}" ${submitted ? "disabled" : ""}><span class="quiz-key">${esc(option.id)}</span><span>${esc(option.text)}</span></button>`;
      }).join("")}</div>
      <details class="quiz-hint"><summary>Need a hint?</summary><p>${esc(genericHint(question))}</p></details>
      ${submitted ? `<div class="quiz-feedback"><div class="feedback"><h4>${isCorrect(question,selections[index]) ? "✓ Correct answer" : "✕ Review your answer"}</h4><p><strong>Your answer:</strong> ${esc(answerLabel(question,selections[index]))}</p><p><strong>Correct answer:</strong> ${esc(answerLabel(question,question.answer))}</p><p>${esc(question.explanation)}</p></div><div class="feedback"><h4>⭐ Most Important Point</h4><p>${esc(question.importantPoint || question.explanation)}</p></div>${question.examTrap ? `<div class="feedback"><h4>⚠️ Exam Trap</h4><p>${esc(question.examTrap)}</p></div>` : ""}${question.reviewFlag ? `<div class="feedback review-flag"><h4>Editorial verification flag</h4><p>${esc(question.reviewFlag)}</p></div>` : ""}</div>` : ""}
      <div class="quiz-actions quiz-navigation"><button type="button" class="quiz-prev" ${index===0?"disabled":""}>← Previous</button>${submitted ? `<button type="button" class="quiz-next">${question.setNumber && quiz.questions[index+1]?.setNumber !== question.setNumber ? `View Set ${question.setNumber} Summary` : index===quiz.questions.length-1 ? "View Results" : "Next Question →"}</button>` : `<button type="button" class="quiz-submit" disabled>Submit answer</button>`}</div></article>`;

    app.querySelectorAll(".quiz-option").forEach((button)=>button.addEventListener("click",()=>{
      if (isSubmitted()) return;
      const optionId=button.dataset.o;
      if (multi) {
        const next = asArray(selections[index]);
        selections[index] = next.includes(optionId) ? next.filter((x)=>x!==optionId) : [...next,optionId].sort();
      } else selections[index] = optionId;
      renderQuestion();
    }));
    const submit=app.querySelector(".quiz-submit");
    if (submit) {
      submit.disabled = asArray(selections[index]).length === 0;
      submit.addEventListener("click",()=>{ if (isSubmitted() || asArray(selections[index]).length===0) return; submittedFlags[index]=true; renderQuestion(); });
    }
    app.querySelector(".quiz-prev")?.addEventListener("click",()=>{if(index>0){index--;renderQuestion();window.scrollTo({top:0,behavior:"smooth"});}});
    app.querySelector(".quiz-next")?.addEventListener("click",()=>{
      if (!isSubmitted()) return;
      if (question.setNumber && quiz.questions[index+1]?.setNumber !== question.setNumber) { renderSetSummary(question.setNumber); return; }
      if (index===quiz.questions.length-1) { renderResults(); return; }
      index++; renderQuestion(); window.scrollTo({top:0,behavior:"smooth"});
    });
  };

  const renderSetSummary = (number) => {
    setSummaryNumber = number;
    const items=setQuestions(number), correct=items.filter(({q,i})=>isSubmitted(i)&&isCorrect(q,selections[i])).length;
    const answered=items.filter(({i})=>isSubmitted(i)).length;
    const set=quiz.sets?.find((s)=>s.number===number) || {title:items[0]?.q.setTitle || `Set ${number}`,start:items[0]?.i+1,end:items[items.length-1]?.i+1};
    app.innerHTML=`<div class="quiz-result set-summary"><span class="eyebrow dark">SET ${number} COMPLETE</span><h1>${esc(set.title)}</h1><div class="score">${correct}/${items.length}</div><p>${Math.round((correct/Math.max(1,items.length))*100)}% · ${answered-correct} question(s) to revise</p><div class="set-score-list">${items.map(({q,i})=>`<div class="set-score-row"><span>Q${i+1}. ${esc(q.question)}</span><strong class="${isCorrect(q,selections[i])?"score-good":"score-bad"}">${isCorrect(q,selections[i])?"Correct":"Review"}</strong></div>`).join("")}</div><div class="result-actions"><button type="button" class="quiz-review-set">Review this set</button><button type="button" class="quiz-continue">${number===3?"View Final Results":"Continue to Set "+(number+1)+" →"}</button></div></div>`;
    app.querySelector(".quiz-review-set").addEventListener("click",()=>{index=items[0].i;renderQuestion();window.scrollTo({top:0,behavior:"smooth"});});
    app.querySelector(".quiz-continue").addEventListener("click",()=>{if(number===3){renderResults();return;}index=quiz.questions.findIndex((q)=>q.setNumber===number+1);renderQuestion();window.scrollTo({top:0,behavior:"smooth"});});
  };

  const renderResults = () => {
    const score=quiz.questions.reduce((sum,q,i)=>sum+(isSubmitted(i)&&isCorrect(q,selections[i])?1:0),0);
    const correct=score, incorrect=quiz.questions.length-correct, percent=Math.round(score/quiz.questions.length*100);
    const sets=quiz.sets?.length ? quiz.sets.map((set)=>{const items=setQuestions(set.number);const setScore=items.filter(({q,i})=>isSubmitted(i)&&isCorrect(q,selections[i])).length;return {...set,score:setScore,count:items.length};}) : [];
    app.innerHTML=`<div class="quiz-result"><span class="eyebrow dark">QUIZ COMPLETE</span><h1>${esc(quiz.title||meta.title)}</h1><p class="quiz-subtitle">${esc(meta.description||quiz.subtitle||"")}</p><div class="score">${score}/${quiz.questions.length}</div><p>${percent}% accuracy · ${correct} correct · ${incorrect} to revise</p>${sets.length?`<div class="set-results-grid">${sets.map((s)=>`<div class="set-result-card"><span>Set ${s.number}</span><strong>${s.score}/${s.count}</strong><small>${esc(s.title)}</small></div>`).join("")}</div>`:""}<div class="result-actions"><button type="button" class="quiz-retry" id="retry">Retake Quiz</button><a href="/quizzes/">All Daily Quizzes</a></div><div class="review"><h2>Review Answers</h2><p class="review-subtitle">Questions requiring revision are marked below.</p>${quiz.questions.map((q,i)=>{const ok=isSubmitted(i)&&isCorrect(q,selections[i]);return `<div class="review-item ${ok?"review-correct":"review-incorrect"}"><strong>${i+1}. ${esc(q.question)}</strong><p><strong>${ok?"✓ Correct":"✕ Review"}</strong> · Your answer: ${esc(answerLabel(q,selections[i]))}</p><p><strong>Correct answer:</strong> ${esc(answerLabel(q,q.answer))}</p><p>${esc(q.explanation)}</p><p><strong>⭐ ${esc(q.importantPoint||q.explanation)}</strong></p>${q.examTrap?`<p><strong>⚠️ ${esc(q.examTrap)}</strong></p>`:""}${q.reviewFlag?`<p class="review-flag"><strong>Editorial verification flag:</strong> ${esc(q.reviewFlag)}</p>`:""}</div>`;}).join("")}</div></div>`;
    app.querySelector("#retry").addEventListener("click",()=>{index=0;selections=Array(quiz.questions.length).fill(null);submittedFlags=Array(quiz.questions.length).fill(false);renderQuestion();window.scrollTo({top:0,behavior:"smooth"});});
  };
  load();
})();
