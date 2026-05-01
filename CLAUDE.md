# MathTutor — Codebase Guide

## What this is
A static HTML/CSS/JS math tutoring site for middle-school kids who completed CTY 8th-grade honors math and need to pass a Geometry readiness placement test. No build step, no backend, no framework — open `index.html` in a browser and it works.

## File structure
```
index.html          — course home page (lesson card grid)
css/style.css       — entire design system (one file)
js/lessons.js       — LESSONS data array (single source of truth for all 27 days)
js/nav.js           — drives both the index page and every lesson page
js/problems.js      — interactive problem engine (multiple choice + fill-in)
js/katex-init.js    — runs KaTeX auto-render on page load
lessons/day-01.html … day-27.html — 27 lesson pages
lessons/template.html             — blank lesson scaffold
```

## How lessons are structured

### `js/lessons.js`
The `LESSONS` array is the single source of truth. Every entry has:
```js
{ day: 1, title: "...", unit: 1, unitName: "🔢 Number Systems & Exponents" }
```
Unit numbers 1–9 drive the color theme. Unit names include emoji prefixes and appear in the unit badge on each lesson page.

### Lesson HTML pages (`lessons/day-XX.html`)
Each page has `<body data-day="N">` — that integer is how `nav.js` knows which lesson it's on. The shell structure inside every lesson:
1. `.lesson-accent-bar` — colored top stripe (color comes from unit theme)
2. `.lesson-header` — contains `#lesson-day`, `#lesson-title`, `#unit-badge` (all populated by nav.js at runtime)
3. `.progress-dots-bar` — `#progress-dots` filled by nav.js
4. `.lesson-body` — the actual content (vocabulary, concept, worked examples, practice problems)
5. `.score-bar` — sticky bottom bar with `#score-display` and `#mark-complete` button
6. Script tags at the bottom: `lessons.js` → `nav.js` → `katex-init.js` → `problems.js`

Content sections use these classes:
- `.section-label` — section heading (emoji-decorated at runtime by nav.js)
- `.vocab-grid` / `.vocab-card` — vocabulary terms
- `.concept-text` — prose explanation
- `.callout.callout--info` / `.callout--warn` — highlighted tip/warning boxes
- `.example` — worked example with `.example__header`, `.example__problem`, `.example__steps`, `.example__answer`
- `.problems-list` — wraps all `.problem` elements

## How `nav.js` works
Single IIFE that detects context from `document.body.dataset.day`:
- **Lesson page** (`data-day` present): calls `initLesson()` which populates the header, builds progress dots, wires prev/next links, sets up the mark-complete button, and decorates section labels with emojis.
- **Index page** (no `data-day`): calls `initIndex()` which renders the unit sections and day-card grid from the LESSONS array.

Progress is persisted in `localStorage` under key `mathtutor_completed` as a JSON array of completed day numbers.

The mark-complete button starts as "🎯 Mark Complete" and becomes "🏆 Nailed It!" on click. Clicking also fires a confetti burst (canvas-confetti loaded lazily from CDN on first use).

The index progress badge shows dynamic encouragement:
- 0 done → "let's get started! 🚀"
- 1–13 done → "keep going! 💪"
- 14–26 done → "almost there! 🔥"
- All done → "you're ready! 🏆"

## How `problems.js` works
Runs on lesson pages only. Scans all `.problem` elements and initializes them based on `data-type`:

**Multiple choice** (`data-type="multiple-choice"`): `data-answer` is the integer index of the correct option button. On click, all options are disabled, correct gets `.option--correct`, chosen wrong gets `.option--incorrect`.

**Fill-in** (`data-type="fill-in"`): `data-answer` is the accepted answer string (pipe-separated for multiple accepted values, e.g. `"0.5|1/2"`). `data-tolerance` allows numeric fuzzy matching (default `0.001`). Submits on button click or Enter key.

Both types trigger CSS animations on answer: `.anim-pop` (bounce) for correct, `.anim-shake` (rattle) for incorrect. Animation classes are cleaned up via `animationend` listener.

Hints (`.hint-btn` + `.hint-box`) toggle visibility. Worked example steps (`.step`) are hidden by default and revealed one at a time via "Show Steps" button. KaTeX is re-rendered whenever hidden content is revealed.

Score display at the bottom shows correct count, answered count, and remaining count live.

## CSS design system (`css/style.css`)
One file, no preprocessor. Key conventions:
- **CSS custom properties** on `:root` for all colors, spacing, radii, shadows.
- **Unit theming** via `body[data-unit="N"]` — sets `--accent` and `--accent-light`. Nav.js applies the attribute; CSS does the rest. Nine units, nine colors.
- **Spacing scale**: `--s1` (4px) through `--s12` (48px).
- **Animations**: `.anim-pop` and `.anim-shake` keyframes for problem feedback.

## External dependencies (CDN only)
- **KaTeX 0.16.9** — math rendering (loaded in each lesson page `<head>`)
- **canvas-confetti 1.9.3** — lesson-complete celebration (lazy-loaded by nav.js on first mark-complete click)

## Adding a new lesson
1. Copy `lessons/template.html`, rename to `day-XX.html`, set `<body data-day="XX">`.
2. Add an entry to the `LESSONS` array in `js/lessons.js`.
3. Fill in vocabulary, concept, worked examples, and practice problems using the existing class patterns.
4. Update the `id="nav-next"` link in the previous day's file (nav.js populates this at runtime, but the fallback href in HTML should be correct).
