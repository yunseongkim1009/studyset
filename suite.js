/* ============================================================
   StudySet — shared runtime
   One localStorage namespace, shared subjects, common UI helpers.
   All apps are served from the same origin, so they share this data.
   ============================================================ */
(function () {
  "use strict";

  const NS = "studyset:";
  const Store = {
    get(key, fallback) {
      try {
        const raw = localStorage.getItem(NS + key);
        return raw == null ? fallback : JSON.parse(raw);
      } catch (e) { return fallback; }
    },
    set(key, val) {
      try { localStorage.setItem(NS + key, JSON.stringify(val)); } catch (e) {}
      return val;
    },
    push(key, item) {
      const arr = Store.get(key, []);
      arr.push(item);
      Store.set(key, arr);
      return arr;
    },
  };

  /* ---------- subjects (shared across every app) ---------- */
  const SUBJECT_COLORS = [
    "#5b4bd6", "#d6524b", "#3f9d6b", "#c98a2b",
    "#2f81b8", "#8b5cf6", "#e0679a", "#0f9e93",
  ];
  const DEFAULT_SUBJECTS = [
    { id: "s_bio", name: "Biology", color: "#3f9d6b" },
    { id: "s_hist", name: "History", color: "#c98a2b" },
    { id: "s_math", name: "Calculus", color: "#5b4bd6" },
    { id: "s_chem", name: "Chemistry", color: "#2f81b8" },
  ];
  function subjects() {
    let s = Store.get("subjects", null);
    if (!s) { s = DEFAULT_SUBJECTS.slice(); Store.set("subjects", s); }
    return s;
  }
  function subject(id) { return subjects().find((s) => s.id === id) || null; }
  function subjectName(id) { const s = subject(id); return s ? s.name : "General"; }
  function subjectColor(id) { const s = subject(id); return s ? s.color : "var(--muted)"; }
  function addSubject(name) {
    const list = subjects();
    const color = SUBJECT_COLORS[list.length % SUBJECT_COLORS.length];
    const s = { id: "s_" + Math.random().toString(36).slice(2, 8), name: name.trim(), color };
    list.push(s); Store.set("subjects", list); return s;
  }

  /* build a <select> of subjects; value "" = All / General */
  function subjectSelect(opts) {
    opts = opts || {};
    const sel = document.createElement("select");
    sel.className = "input";
    if (opts.allowAll) sel.add(new Option(opts.allLabel || "All subjects", ""));
    else if (opts.allowNone) sel.add(new Option("— none —", ""));
    subjects().forEach((s) => sel.add(new Option(s.name, s.id)));
    if (opts.value != null) sel.value = opts.value;
    return sel;
  }

  /* ---------- ids, dates ---------- */
  const uid = (p) => (p || "id") + "_" + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
  const todayISO = () => new Date().toISOString().slice(0, 10);
  function daysBetween(aISO, bISO) {
    const a = new Date(aISO + "T00:00:00"), b = new Date(bISO + "T00:00:00");
    return Math.round((b - a) / 86400000);
  }
  function relDay(iso) {
    const d = daysBetween(todayISO(), iso);
    if (d === 0) return "today";
    if (d === 1) return "tomorrow";
    if (d === -1) return "yesterday";
    if (d < 0) return Math.abs(d) + "d ago";
    return "in " + d + "d";
  }
  function fmtDate(iso) {
    try { return new Date(iso + "T00:00:00").toLocaleDateString(undefined, { month: "short", day: "numeric" }); }
    catch (e) { return iso; }
  }
  function fmtClock(sec) {
    sec = Math.max(0, Math.round(sec));
    const m = Math.floor(sec / 60), s = sec % 60;
    return m + ":" + String(s).padStart(2, "0");
  }
  function fmtDur(min) {
    min = Math.round(min);
    if (min < 60) return min + "m";
    const h = Math.floor(min / 60), m = min % 60;
    return h + "h" + (m ? " " + m + "m" : "");
  }

  /* ---------- theme ---------- */
  function initTheme() {
    const saved = Store.get("theme", null);
    const sys = matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
    document.documentElement.dataset.theme = saved || sys;
  }
  function toggleTheme() {
    const cur = document.documentElement.dataset.theme === "dark" ? "dark" : "light";
    const next = cur === "dark" ? "light" : "dark";
    document.documentElement.dataset.theme = next;
    Store.set("theme", next);
  }

  /* ---------- shared demo seed (runs once, so every page incl. hub has data) ---------- */
  function seedAll() {
    if (Store.get("_seeded", false)) return;
    const c = (front, back) => ({ id: uid("c"), front, back, box: 0, due: todayISO(), reps: 0, lapses: 0 });
    if (!Store.get("decks", null)) Store.set("decks", [
      { id: uid("d"), name: "Cell Biology", subject: "s_bio", cards: [
        c("What organelle is the powerhouse of the cell?", "The mitochondrion — it produces ATP via cellular respiration."),
        c("What is the function of ribosomes?", "Protein synthesis (translation of mRNA into polypeptides)."),
        c("Define osmosis.", "Diffusion of water across a semipermeable membrane, from low to high solute concentration."),
        c("What separates the nucleus from the cytoplasm?", "The nuclear envelope (a double membrane with nuclear pores)."),
      ]},
      { id: uid("d"), name: "SAT Vocabulary", subject: "", cards: [
        c("Ephemeral", "Lasting a very short time; fleeting."),
        c("Pragmatic", "Dealing with things sensibly and realistically."),
        c("Ubiquitous", "Present, appearing, or found everywhere."),
      ]},
    ]);
    if (!Store.get("quizzes", null)) Store.set("quizzes", [{
      id: uid("q"), name: "Photosynthesis Basics", subject: "s_bio",
      questions: [
        { id: uid("i"), prompt: "Where in the plant cell does photosynthesis primarily occur?", options: ["Mitochondria","Chloroplast","Nucleus","Ribosome"], correct: 1 },
        { id: uid("i"), prompt: "Which gas is released as a by-product of photosynthesis?", options: ["Carbon dioxide","Nitrogen","Oxygen","Hydrogen"], correct: 2 },
        { id: uid("i"), prompt: "Photosynthesis converts light energy into chemical energy stored in glucose.", options: ["True","False"], correct: 0 },
        { id: uid("i"), prompt: "What pigment gives leaves their green colour and absorbs light?", options: ["Carotene","Melanin","Chlorophyll","Xanthophyll"], correct: 2 },
      ],
    }]);
    if (!Store.get("notes", null)) Store.set("notes", [{
      id: uid("n"), title: "French Revolution — Causes", subject: "s_hist",
      cue: "• Financial crisis?\n• Social inequality?\n• Enlightenment ideas?\n• Immediate trigger?",
      body: "France was effectively bankrupt after costly wars (incl. American Revolution). The Three Estates system taxed the poor (Third Estate) while nobility & clergy were largely exempt.\n\nEnlightenment thinkers (Rousseau, Voltaire) spread ideas of liberty & popular sovereignty.\n\nBad harvests in 1788 spiked bread prices. The Estates-General of 1789 collapsed into the National Assembly.",
      summary: "Bankruptcy + rigid estate inequality + Enlightenment ideas + a bread crisis converged in 1789 to spark revolution.",
      updated: Date.now(),
    }]);
    if (!Store.get("exams", null)) {
      const d9 = new Date(); d9.setDate(d9.getDate() + 9);
      const d21 = new Date(); d21.setDate(d21.getDate() + 21);
      Store.set("exams", [
        { id: uid("e"), name: "Biology Midterm", subject: "s_bio", date: d9.toISOString().slice(0,10), topics: "Cells, Photosynthesis, Genetics" },
        { id: uid("e"), name: "Calculus Test — Ch. 4", subject: "s_math", date: d21.toISOString().slice(0,10), topics: "Derivatives, Chain rule, Optimization" },
      ]);
    }
    if (!Store.get("tasks", null)) Store.set("tasks", [
      { id: uid("t"), title: "Review chapter 3 flashcards", subject: "s_bio", due: todayISO(), done: false, exam: null },
      { id: uid("t"), title: "Do practice test #1", subject: "s_math", due: "", done: false, exam: null },
      { id: uid("t"), title: "Summarize lecture notes", subject: "s_hist", due: "", done: true, exam: null },
    ]);
    if (!Store.get("sheets", null)) Store.set("sheets", [{
      id: uid("sh"), title: "Calculus Derivative Rules", subject: "s_math", view: "read",
      sections: [
        { id: uid("se"), h: "Core rules", body: "**Power rule:** d/dx[xⁿ] = n·xⁿ⁻¹\n**Constant:** d/dx[c] = 0\n**Sum:** (f+g)' = f' + g'\n**Product:** (fg)' = f'g + fg'\n**Quotient:** (f/g)' = (f'g − fg')/g²", collapsed: false },
        { id: uid("se"), h: "Chain rule", body: "d/dx[f(g(x))] = f'(g(x))·g'(x)\n\nExample: d/dx[sin(x²)] = cos(x²)·2x", collapsed: false },
        { id: uid("se"), h: "Common derivatives", body: "d/dx[sin x] = cos x\nd/dx[cos x] = −sin x\nd/dx[eˣ] = eˣ\nd/dx[ln x] = 1/x", collapsed: false },
      ],
    }]);
    subjects();
    Store.set("_seeded", true);
  }

  /* ---------- top bar ---------- */
  /* ---------- SVG line icons (Lucide-style, currentColor) ---------- */
  const ICON_PATHS = {
    hub:        '<rect x="3" y="3" width="7.5" height="7.5" rx="2"/><rect x="13.5" y="3" width="7.5" height="7.5" rx="2"/><rect x="3" y="13.5" width="7.5" height="7.5" rx="2"/><rect x="13.5" y="13.5" width="7.5" height="7.5" rx="2"/>',
    flashcards: '<rect x="2.5" y="5.5" width="15" height="11" rx="2.5" transform="rotate(-6 10 11)"/><rect x="6.5" y="7.5" width="15" height="11" rx="2.5"/><path d="M10 12.5h8M10 15h5"/>',
    quiz:       '<path d="M9 11.5l2 2 4-4.5"/><rect x="4" y="3.5" width="16" height="17" rx="2.5"/><path d="M9 3.5V6h6V3.5"/>',
    notes:      '<path d="M12 6.5C10.5 5 8 4.5 4 4.7v13c4-.2 6.5.3 8 1.8 1.5-1.5 4-2 8-1.8v-13c-4-.2-6.5.3-8 1.8z"/><path d="M12 6.5V19"/>',
    planner:    '<rect x="3.5" y="4.5" width="17" height="16" rx="2.5"/><path d="M3.5 9h17M8 2.5v4M16 2.5v4"/><path d="M7.5 13h3M7.5 16.5h6"/>',
    focus:      '<circle cx="12" cy="13.5" r="7.5"/><path d="M12 13.5V9M9.5 2.5h5M18.5 6l1.5-1.5"/>',
    reference:  '<path d="M4 4h7a2.5 2.5 0 012.5 2.5V20a2 2 0 00-2-2H4z"/><path d="M20 4h-7a2.5 2.5 0 00-2.5 2.5V20a2 2 0 012-2H20z"/>',
    add:        '<path d="M12 5v14M5 12h14"/>',
    print:      '<path d="M6 9V3.5h12V9M6 18H4.5A1.5 1.5 0 013 16.5V11a2 2 0 012-2h14a2 2 0 012 2v5.5a1.5 1.5 0 01-1.5 1.5H18"/><rect x="6.5" y="14.5" width="11" height="6" rx="1"/>',
    search:     '<circle cx="11" cy="11" r="7"/><path d="M21 21l-4.3-4.3"/>',
    fire:       '<path d="M12 3s5 4 5 9a5 5 0 01-10 0c0-1.5.5-2.5 1.2-3.4C8.8 10.5 10 12 10 12s0-3.5 2-9z"/>',
    check:      '<path d="M5 12.5l4.5 4.5L19 7"/>',
  };
  function icon(name, size) {
    const p = ICON_PATHS[name]; if (!p) return "";
    const s = size || 22;
    return `<svg width="${s}" height="${s}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.85" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${p}</svg>`;
  }

  const APPS = [
    { id: "index",     name: "Hub",        file: "index.html",     icon: "hub" },
    { id: "flashcards",name: "Flashcards", file: "flashcards.html",icon: "flashcards" },
    { id: "quiz",      name: "Quizzes",    file: "quiz.html",      icon: "quiz" },
    { id: "notes",     name: "Notes",      file: "notes.html",     icon: "notes" },
    { id: "planner",   name: "Planner",    file: "planner.html",   icon: "planner" },
    { id: "focus",     name: "Focus",      file: "focus.html",     icon: "focus" },
    { id: "reference", name: "Sheets",     file: "reference.html", icon: "reference" },
  ];
  function topbar(current) {
    initTheme();
    seedAll();
    const cur = APPS.find((a) => a.id === current) || {};
    const bar = document.createElement("div");
    bar.className = "topbar";
    bar.innerHTML = `
      <div class="topbar-inner">
        <a class="brand" href="index.html" title="StudySet home">
          <span class="brand-mark">S</span>
          <span><b>StudySet</b></span>
        </a>
        ${cur.name ? `<span class="app-name">${cur.icon ? icon(cur.icon, 15) : ""}${cur.name}</span>` : ""}
        <span class="spacer"></span>
        <button class="icon-btn" id="_navBtn" title="Switch app" aria-label="Apps">
          <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/></svg>
        </button>
        <button class="icon-btn" id="_themeBtn" title="Toggle light / dark" aria-label="Toggle theme">
          <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.1" stroke-linecap="round"><circle cx="12" cy="12" r="4.2"/><path d="M12 2v2M12 20v2M4.2 4.2l1.4 1.4M18.4 18.4l1.4 1.4M2 12h2M20 12h2M4.2 19.8l1.4-1.4M18.4 5.6l1.4-1.4"/></svg>
        </button>
      </div>`;
    document.body.prepend(bar);
    document.getElementById("_themeBtn").onclick = toggleTheme;

    // app switcher popover
    const pop = document.createElement("div");
    pop.style.cssText = "position:fixed;z-index:60;display:none;";
    pop.innerHTML = `<div class="card" style="position:absolute;right:20px;top:62px;padding:10px;width:276px;box-shadow:var(--sh-4);border-color:var(--line-strong)">
      <div style="font-size:11px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;color:var(--muted);padding:4px 8px 8px">Jump to</div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:6px">
        ${APPS.map((a) => `<a href="${a.file}" style="text-decoration:none;display:flex;align-items:center;gap:9px;padding:10px 11px;border-radius:12px;border:1px solid ${a.id === current ? "var(--accent-line)" : "transparent"};background:${a.id === current ? "var(--accent-wash)" : "transparent"};transition:background .15s,border-color .15s" onmouseover="if(!this.dataset.on)this.style.background='var(--card-2)'" onmouseout="if(!this.dataset.on)this.style.background='transparent'" ${a.id === current ? 'data-on=1' : ''}>
          <span style="width:30px;height:30px;border-radius:7px;display:grid;place-items:center;flex:none;background:${a.id === current ? "var(--accent)" : "var(--card-3)"};color:${a.id === current ? "#fff" : "var(--muted)"}">${icon(a.icon, 17)}</span>
          <span style="font-weight:600;font-size:13.5px;color:var(--ink)">${a.name}</span></a>`).join("")}
      </div></div>`;
    document.body.appendChild(pop);
    const navBtn = document.getElementById("_navBtn");
    navBtn.onclick = (e) => { e.stopPropagation(); pop.style.display = pop.style.display === "block" ? "none" : "block"; };
    document.addEventListener("click", () => (pop.style.display = "none"));
    pop.onclick = (e) => e.stopPropagation();
  }

  /* ---------- toast ---------- */
  let toastEl, toastT;
  function toast(msg) {
    if (!toastEl) { toastEl = document.createElement("div"); toastEl.id = "toast"; document.body.appendChild(toastEl); }
    toastEl.textContent = msg;
    toastEl.classList.add("show");
    clearTimeout(toastT);
    toastT = setTimeout(() => toastEl.classList.remove("show"), 2000);
  }

  /* ---------- modal ---------- */
  function modal(opts) {
    // opts: {title, bodyHTML | bodyEl, okText, onOk, cancelText, wide}
    const back = document.createElement("div");
    back.className = "modal-back";
    const m = document.createElement("div");
    m.className = "modal";
    if (opts.wide) m.style.width = "min(720px,100%)";
    m.innerHTML = `<div class="modal-head"><b class="h2">${opts.title || ""}</b><span class="spacer"></span><button class="icon-btn" data-x>✕</button></div>`;
    const body = document.createElement("div"); body.className = "modal-body";
    if (opts.bodyEl) body.appendChild(opts.bodyEl); else body.innerHTML = opts.bodyHTML || "";
    m.appendChild(body);
    if (opts.okText || opts.cancelText !== null) {
      const foot = document.createElement("div"); foot.className = "modal-foot";
      foot.innerHTML = `<button class="btn ghost" data-x>${opts.cancelText || "Cancel"}</button>` +
        (opts.okText ? `<button class="btn primary" data-ok>${opts.okText}</button>` : "");
      m.appendChild(foot);
    }
    back.appendChild(m);
    document.body.appendChild(back);
    requestAnimationFrame(() => back.classList.add("show"));
    const close = () => { back.classList.remove("show"); setTimeout(() => back.remove(), 200); };
    back.addEventListener("click", (e) => { if (e.target === back) close(); });
    m.querySelectorAll("[data-x]").forEach((b) => (b.onclick = close));
    const ok = m.querySelector("[data-ok]");
    if (ok) ok.onclick = () => { if (opts.onOk && opts.onOk(body) === false) return; close(); };
    return { el: m, body, close };
  }

  function confirmDialog(msg, onYes, yesText) {
    modal({
      title: "Are you sure?",
      bodyHTML: `<p style="margin:0;color:var(--muted)">${msg}</p>`,
      okText: yesText || "Delete",
      onOk: () => { onYes && onYes(); },
    });
    // make the ok button danger-styled
    const b = document.querySelector(".modal-foot [data-ok]");
    if (b) { b.classList.remove("primary"); b.classList.add("danger"); b.style.borderColor = "var(--rose)"; }
  }

  const esc = (s) => String(s == null ? "" : s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

  window.Suite = {
    Store, uid, todayISO, daysBetween, relDay, fmtDate, fmtClock, fmtDur,
    subjects, subject, subjectName, subjectColor, addSubject, subjectSelect,
    topbar, toast, modal, confirmDialog, toggleTheme, esc, APPS, icon, seedAll,
  };
})();
