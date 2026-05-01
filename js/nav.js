(function () {
  const STORAGE_KEY = "mathtutor_completed";

  function getCompleted() {
    try {
      return new Set(JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]"));
    } catch {
      return new Set();
    }
  }

  function saveCompleted(set) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify([...set]));
  }

  function padDay(n) {
    return String(n).padStart(2, "0");
  }

  // ── Lesson page init ────────────────────────────────────────────────────────

  function initLesson() {
    const body = document.body;
    const currentDay = parseInt(body.dataset.day, 10);
    if (!currentDay || typeof LESSONS === "undefined") return;

    const lesson = LESSONS.find((l) => l.day === currentDay);
    if (!lesson) return;

    // Apply unit color theme
    body.setAttribute("data-unit", lesson.unit);

    // Populate header text
    const elDay   = document.getElementById("lesson-day");
    const elTitle = document.getElementById("lesson-title");
    const elUnit  = document.getElementById("unit-badge");
    if (elDay)   elDay.textContent   = `Day ${lesson.day} of ${LESSONS.length}`;
    if (elTitle) elTitle.textContent = lesson.title;
    if (elUnit)  elUnit.textContent  = lesson.unitName;

    buildProgressDots(currentDay);
    buildPrevNext(currentDay);
    ensureScoreBar();
    initMarkComplete(currentDay);
    decorateSectionLabels();
  }

  function buildProgressDots(currentDay) {
    const bar = document.getElementById("progress-dots");
    if (!bar) return;

    const completed = getCompleted();
    const html = LESSONS.map((l) => {
      let cls = "dot";
      if (l.day === currentDay) cls += " dot-current";
      else if (completed.has(l.day)) cls += " dot-done";

      const href = `day-${padDay(l.day)}.html`;
      return `<a href="${href}" class="${cls}" title="Day ${l.day}: ${l.title}" aria-label="Day ${l.day}"></a>`;
    }).join("");

    bar.innerHTML = html;
  }

  function buildPrevNext(currentDay) {
    const idx  = LESSONS.findIndex((l) => l.day === currentDay);
    const prev = LESSONS[idx - 1];
    const next = LESSONS[idx + 1];

    const prevEl = document.getElementById("nav-prev");
    const nextEl = document.getElementById("nav-next");

    if (prevEl) {
      if (prev) {
        prevEl.href        = `day-${padDay(prev.day)}.html`;
        prevEl.textContent = `← Day ${prev.day}: ${prev.title}`;
      } else {
        prevEl.href        = "../index.html";
        prevEl.textContent = "← Course Home";
      }
    }

    if (nextEl) {
      if (next) {
        nextEl.href        = `day-${padDay(next.day)}.html`;
        nextEl.textContent = `Day ${next.day}: ${next.title} →`;
      } else {
        nextEl.style.display = "none";
      }
    }
  }

  function fireConfetti() {
    function launch() {
      window.confetti({
        particleCount: 160,
        spread: 80,
        origin: { x: 0.5, y: 0.85 },
        colors: ["#3B82F6","#10B981","#F59E0B","#8B5CF6","#EF4444","#EC4899"],
      });
    }
    if (window.confetti) {
      launch();
    } else {
      const s = document.createElement("script");
      s.src = "https://cdn.jsdelivr.net/npm/canvas-confetti@1.9.3/dist/confetti.browser.min.js";
      s.onload = launch;
      document.head.appendChild(s);
    }
  }

  function decorateSectionLabels() {
    const emojiMap = {
      "vocabulary":        "📚",
      "key vocabulary":    "📚",
      "concept":           "💡",
      "worked examples":   "✏️",
      "practice problems": "🏋️",
    };
    document.querySelectorAll(".section-label, .section-heading").forEach((el) => {
      const key = el.textContent.trim().toLowerCase();
      const emoji = emojiMap[key];
      if (emoji) el.textContent = emoji + " " + el.textContent.trim();
    });
  }

  function ensureScoreBar() {
    if (document.getElementById("mark-complete")) return;
    const bar = document.createElement("div");
    bar.className = "score-bar";
    bar.innerHTML = `<span id="score-display"></span><button class="btn-complete" id="mark-complete">🎯 Mark Complete</button>`;
    document.body.appendChild(bar);
  }

  function initMarkComplete(currentDay) {
    const btn = document.getElementById("mark-complete");
    if (!btn) return;
    btn.textContent = "🎯 Mark Complete";

    const completed = getCompleted();
    if (completed.has(currentDay)) {
      setCompletedState(btn);
    }

    btn.addEventListener("click", () => {
      const c = getCompleted();
      c.add(currentDay);
      saveCompleted(c);
      setCompletedState(btn);
      buildProgressDots(currentDay);
      fireConfetti();
    });
  }

  function setCompletedState(btn) {
    btn.textContent = "🏆 Nailed It!";
    btn.classList.add("btn-completed");
    btn.disabled = true;
  }

  // ── Index page init ──────────────────────────────────────────────────────────

  function initIndex() {
    if (typeof LESSONS === "undefined") return;

    const completed = getCompleted();

    // Progress summary
    const progressEl = document.getElementById("course-progress");
    if (progressEl) {
      const n = completed.size;
      const total = LESSONS.length;
      let msg;
      if (n === 0)           msg = `0 of ${total} — let's get started! 🚀`;
      else if (n === total)  msg = `All ${total} done — you're ready! 🏆`;
      else if (n >= total/2) msg = `${n} of ${total} — almost there! 🔥`;
      else                   msg = `${n} of ${total} — keep going! 💪`;
      progressEl.textContent = msg;
    }

    // Render the day grid grouped by unit
    const gridEl = document.getElementById("course-grid");
    if (!gridEl) return;

    const unitMap = new Map();
    LESSONS.forEach((l) => {
      if (!unitMap.has(l.unit)) unitMap.set(l.unit, { name: l.unitName, unit: l.unit, lessons: [] });
      unitMap.get(l.unit).lessons.push(l);
    });

    let html = "";
    unitMap.forEach(({ name, unit, lessons }) => {
      html += `<section class="unit-section unit-${unit}-theme">`;
      html += `<h2 class="unit-heading"><span class="unit-pill">Unit ${unit}</span>${name}</h2>`;
      html += `<div class="day-grid">`;
      lessons.forEach((l) => {
        const done = completed.has(l.day);
        const href = `lessons/day-${padDay(l.day)}.html`;
        html += `
          <a href="${href}" class="day-card${done ? " day-card--done" : ""}" data-unit="${l.unit}">
            <span class="day-card__num">Day ${l.day}</span>
            <span class="day-card__title">${l.title}</span>
            ${done ? '<span class="day-card__check" aria-label="Complete">✓</span>' : ""}
          </a>`;
      });
      html += `</div></section>`;
    });

    gridEl.innerHTML = html;
  }

  // ── Boot ─────────────────────────────────────────────────────────────────────

  document.addEventListener("DOMContentLoaded", () => {
    if (document.body.dataset.day) {
      initLesson();
    } else {
      initIndex();
    }
  });

  window.navUtils = { getCompleted, saveCompleted };
})();
