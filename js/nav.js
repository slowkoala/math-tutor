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
    initMarkComplete(currentDay);
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

  function initMarkComplete(currentDay) {
    const btn = document.getElementById("mark-complete");
    if (!btn) return;

    const completed = getCompleted();
    if (completed.has(currentDay)) {
      setCompletedState(btn);
    }

    btn.addEventListener("click", () => {
      const c = getCompleted();
      c.add(currentDay);
      saveCompleted(c);
      setCompletedState(btn);
      buildProgressDots(currentDay); // refresh dots
    });
  }

  function setCompletedState(btn) {
    btn.textContent = "✓ Lesson Complete";
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
      progressEl.textContent = `${completed.size} of ${LESSONS.length} lessons complete`;
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
