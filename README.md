# StudySet

A complete, offline-first study suite for students — a hub plus six focused study apps that share one design system and one local data store, so your subjects, decks, exams, and stats line up across every tool.

No build step, no dependencies, no accounts. Everything saves to your browser's `localStorage`.

## Apps

| App | What it does |
|-----|--------------|
| **◆ Hub** (`index.html`) | Rolls up everything: flashcards due, days to your next exam, tasks today, focus this week, a cross-app activity feed, and a shared subject manager |
| **▤ Flashcards** (`flashcards.html`) | Leitner-box spaced repetition — flip a card, grade Again/Hard/Good/Easy, and it reschedules. "Study all due" spans every deck |
| **◈ Quizzes** (`quiz.html`) | Build multiple-choice / true-false practice tests, take them timed, get a score ring and per-question review. Import a flashcard deck straight into questions |
| **▦ Notes** (`notes.html`) | Cornell-method notes (cues / notes / summary) with search and subject filter. Turn cues into a flashcard deck in one click |
| **◱ Planner** (`planner.html`) | Exam countdowns, a task board, and an auto-generated day-by-day study plan you can push into tasks |
| **◉ Focus** (`focus.html`) | A Pomodoro timer that logs real study minutes → streak + 28-day heatmap, and surfaces what's due for the subject you pick |
| **❋ Sheets** (`reference.html`) | Collapsible, printable formula & cheat sheets with lightweight markdown (`**bold**`, `` `code` ``, bullets) |

## How it fits together

All apps are served from one origin and share a single `localStorage` namespace (`studyset:`) plus a shared design system (`suite.css` / `suite.js`). That means:

- **Subjects are colour-coded consistently everywhere.**
- Data flows between tools: notes → flashcards → quizzes; exams → tasks → focus.
- The hub aggregates activity from all six apps in real time.

## Running it

It must be served over HTTP (the apps share files and `localStorage`), not opened as `file://`. Any static server works:

```bash
python3 -m http.server 5400
# then open http://localhost:5400
```

Each app seeds realistic demo data (biology, calculus, history) on first open. The hub has a **reset demo data** link to clear everything.

## Tech

Plain HTML/CSS/JS. No frameworks, no bundler. Light + dark theme. Works fully offline.

---

Built with [Claude Code](https://claude.com/claude-code).
