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

  /* ---------- top bar ---------- */
  const APPS = [
    { id: "index",     name: "Hub",        file: "index.html",     icon: "◆" },
    { id: "flashcards",name: "Flashcards", file: "flashcards.html",icon: "▤" },
    { id: "quiz",      name: "Quizzes",    file: "quiz.html",      icon: "◈" },
    { id: "notes",     name: "Notes",      file: "notes.html",     icon: "▦" },
    { id: "planner",   name: "Planner",    file: "planner.html",   icon: "◱" },
    { id: "focus",     name: "Focus",      file: "focus.html",     icon: "◉" },
    { id: "reference", name: "Sheets",     file: "reference.html", icon: "❋" },
  ];
  function topbar(current) {
    initTheme();
    const cur = APPS.find((a) => a.id === current) || {};
    const bar = document.createElement("div");
    bar.className = "topbar";
    bar.innerHTML = `
      <div class="topbar-inner">
        <a class="brand" href="index.html">
          <span class="brand-mark">S</span>
          <span><b>StudySet</b></span>
        </a>
        <span class="app-name">${cur.name || ""}</span>
        <span class="spacer"></span>
        <button class="icon-btn" id="_navBtn" title="Switch app" aria-label="Apps">▤</button>
        <button class="icon-btn" id="_themeBtn" title="Toggle theme" aria-label="Theme">◐</button>
      </div>`;
    document.body.prepend(bar);
    document.getElementById("_themeBtn").onclick = toggleTheme;

    // app switcher popover
    const pop = document.createElement("div");
    pop.style.cssText = "position:fixed;z-index:60;display:none;";
    pop.innerHTML = `<div class="card" style="position:absolute;right:22px;top:60px;padding:8px;width:230px;box-shadow:var(--shadow-lg)">
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:6px">
        ${APPS.map((a) => `<a href="${a.file}" style="text-decoration:none;display:flex;flex-direction:column;gap:4px;padding:11px;border-radius:11px;border:1px solid ${a.id === current ? "var(--accent)" : "transparent"};background:${a.id === current ? "var(--accent-wash)" : "transparent"}">
          <span style="font-size:17px">${a.icon}</span>
          <span style="font-weight:600;font-size:13px">${a.name}</span></a>`).join("")}
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
    topbar, toast, modal, confirmDialog, toggleTheme, esc, APPS,
  };
})();
