(function () {
  // ── Score tracker ────────────────────────────────────────────────────────────

  const score = { correct: 0, total: 0 };

  function updateScoreDisplay() {
    const el = document.getElementById("score-display");
    if (!el) return;
    const answered = document.querySelectorAll(".problem[data-answered]").length;
    const remaining = score.total - answered;
    el.innerHTML = `
      <span class="score-correct">${score.correct} correct</span>
      &nbsp;·&nbsp;
      <span>${answered} of ${score.total} answered</span>
      ${remaining > 0 ? `&nbsp;·&nbsp;<span>${remaining} remaining</span>` : ""}
    `;
  }

  function reRenderKatex(el) {
    if (typeof renderMathInElement !== "undefined") {
      renderMathInElement(el, {
        delimiters: [
          { left: "$$",  right: "$$",  display: true  },
          { left: "$",   right: "$",   display: false },
          { left: "\\(", right: "\\)", display: false },
          { left: "\\[", right: "\\]", display: true  },
        ],
        throwOnError: false,
      });
    }
  }

  // ── Feedback helpers ─────────────────────────────────────────────────────────

  function showFeedback(problemEl, isCorrect) {
    const feedbackEl     = problemEl.querySelector(".feedback");
    const explanationEl  = problemEl.querySelector(".explanation");

    if (feedbackEl) {
      feedbackEl.hidden    = false;
      feedbackEl.className = `feedback ${isCorrect ? "feedback--correct" : "feedback--incorrect"}`;
      feedbackEl.textContent = isCorrect ? "✓ Correct!" : "✗ Not quite — see the explanation below.";
    }

    if (explanationEl) {
      explanationEl.hidden = false;
      reRenderKatex(explanationEl);
    }
  }

  function recordAnswer(problemEl, isCorrect) {
    problemEl.dataset.answered = "true";
    score.correct += isCorrect ? 1 : 0;
    showFeedback(problemEl, isCorrect);
    updateScoreDisplay();
  }

  // ── Multiple choice ──────────────────────────────────────────────────────────

  function initMultipleChoice(el) {
    const correct = parseInt(el.dataset.answer, 10);

    el.querySelectorAll(".option").forEach((btn) => {
      btn.addEventListener("click", () => {
        if (el.dataset.answered) return;

        const chosen    = parseInt(btn.dataset.value, 10);
        const isCorrect = chosen === correct;

        el.querySelectorAll(".option").forEach((b) => {
          b.disabled = true;
          if (parseInt(b.dataset.value, 10) === correct) b.classList.add("option--correct");
          else if (b === btn) b.classList.add("option--incorrect");
        });

        const animCls = isCorrect ? "anim-pop" : "anim-shake";
        btn.classList.add(animCls);
        btn.addEventListener("animationend", () => btn.classList.remove(animCls), { once: true });

        recordAnswer(el, isCorrect);
      });
    });
  }

  // ── Fill-in ──────────────────────────────────────────────────────────────────

  function normalizeAnswer(str) {
    return str.trim().toLowerCase().replace(/\s+/g, "");
  }

  function numericMatch(val, correct, tolerance) {
    const n = parseFloat(val);
    const c = parseFloat(correct);
    return !isNaN(n) && !isNaN(c) && Math.abs(n - c) <= tolerance;
  }

  function checkFillIn(val, correctAnswers, tolerance) {
    const norm = normalizeAnswer(val);
    for (const ca of correctAnswers) {
      if (norm === normalizeAnswer(ca)) return true;
      if (numericMatch(val, ca, tolerance))   return true;
    }
    return false;
  }

  function initFillIn(el) {
    const correctAnswers = el.dataset.answer.split("|");
    const tolerance      = parseFloat(el.dataset.tolerance ?? "0.001");
    const input          = el.querySelector(".answer-input");
    const checkBtn       = el.querySelector(".check-btn");

    function attempt() {
      if (el.dataset.answered || !input.value.trim()) return;

      const isCorrect = checkFillIn(input.value, correctAnswers, tolerance);
      input.disabled  = true;
      if (checkBtn) checkBtn.disabled = true;
      input.classList.add(isCorrect ? "input--correct" : "input--incorrect");

      const animCls = isCorrect ? "anim-pop" : "anim-shake";
      input.classList.add(animCls);
      input.addEventListener("animationend", () => input.classList.remove(animCls), { once: true });

      recordAnswer(el, isCorrect);
    }

    if (checkBtn) checkBtn.addEventListener("click", attempt);
    input.addEventListener("keydown", (e) => { if (e.key === "Enter") attempt(); });
  }

  // ── Hints ────────────────────────────────────────────────────────────────────

  function initHint(el) {
    const btn     = el.querySelector(".hint-btn");
    const hintBox = el.querySelector(".hint-box");
    if (!btn || !hintBox) return;

    btn.addEventListener("click", () => {
      const isHidden = hintBox.hidden;
      hintBox.hidden = !isHidden;
      btn.textContent = isHidden ? "💡 Hide Hint" : "💡 Hint";
      if (isHidden) reRenderKatex(hintBox);
    });
  }

  // ── Normalize days-14+ HTML structure to standard structure ─────────────────

  function normalizeProblem(el) {
    // 1. Convert .problem-stem → .problem__header / .problem-question
    const stem = el.querySelector(".problem-stem");
    if (stem) {
      const header = document.createElement("div");
      header.className = "problem__header";
      const numSpan = document.createElement("span");
      numSpan.className = "problem-number";
      const qP = document.createElement("p");
      qP.className = "problem-question";
      qP.innerHTML = stem.innerHTML;
      header.appendChild(numSpan);
      header.appendChild(qP);
      stem.replaceWith(header);
    }

    // 2. Convert <ol class="choices"><li> → <div class="options"><button data-value="i">
    const choicesList = el.querySelector("ol.choices");
    if (choicesList) {
      const items = [...choicesList.querySelectorAll("li")];
      const optionsDiv = document.createElement("div");
      optionsDiv.className = "options";
      items.forEach((li, i) => {
        const btn = document.createElement("button");
        btn.className = "option";
        btn.dataset.value = String(i);
        btn.innerHTML = li.innerHTML;
        optionsDiv.appendChild(btn);
      });
      choicesList.replaceWith(optionsDiv);
    }

    // 3. Inject .fill-in-area for fill-in problems that have none
    if (el.dataset.type === "fill-in" && !el.querySelector(".fill-in-area")) {
      const area = document.createElement("div");
      area.className = "fill-in-area";
      const input = document.createElement("input");
      input.type = "text";
      input.className = "answer-input";
      input.placeholder = "?";
      const btn = document.createElement("button");
      btn.className = "check-btn";
      btn.textContent = "Check";
      area.appendChild(input);
      area.appendChild(btn);
      const header = el.querySelector(".problem__header");
      if (header) header.after(area);
      else el.appendChild(area);
    }

    // 4. Ensure .problem__footer exists for feedback
    if (!el.querySelector(".problem__footer")) {
      const footer = document.createElement("div");
      footer.className = "problem__footer";
      footer.innerHTML = '<div class="feedback" hidden></div>';
      el.appendChild(footer);
    }

    reRenderKatex(el);
  }

  // ── Worked example steps ─────────────────────────────────────────────────────

  function initExample(el) {
    const showBtn = el.querySelector(".show-steps-btn");
    if (!showBtn) return;

    const steps = el.querySelectorAll(".step");

    if (steps.length > 0) {
      // Old structure: individual .step elements revealed one at a time
      let revealed = 0;
      steps.forEach((s) => (s.hidden = true));
      showBtn.addEventListener("click", () => {
        if (revealed < steps.length) {
          steps[revealed].hidden = false;
          reRenderKatex(steps[revealed]);
          revealed++;
          if (revealed === steps.length) showBtn.textContent = "All steps shown";
        }
      });
    } else {
      // New structure: one hidden .example-steps block revealed all at once
      const stepsDiv = el.querySelector(".example-steps");
      if (!stepsDiv) return;
      showBtn.addEventListener("click", () => {
        stepsDiv.hidden = false;
        reRenderKatex(stepsDiv);
        showBtn.textContent = "Steps shown";
        showBtn.disabled = true;
      });
    }
  }

  // ── Boot ─────────────────────────────────────────────────────────────────────

  document.addEventListener("DOMContentLoaded", () => {
    const problems = document.querySelectorAll(".problem");
    score.total    = problems.length;

    problems.forEach((el, i) => {
      normalizeProblem(el);

      // Auto-number
      const numEl = el.querySelector(".problem-number");
      if (numEl) numEl.textContent = i + 1;

      const type = el.dataset.type;
      if (type === "multiple-choice") initMultipleChoice(el);
      else if (type === "fill-in")    initFillIn(el);

      initHint(el);
    });

    document.querySelectorAll(".example").forEach(initExample);

    updateScoreDisplay();
  });
})();
