// Replays the questlog 0.6.2 rules from a recorded run. Without this script the board shows its starting state.
(() => {
  const DAY = 86400000;
  const t0 = Date.UTC(2026, 9, 24, 10);
  const due3 = t0 + 5 * DAY;
  const log = document.getElementById("call-log");
  const today = document.getElementById("today");
  const jump = document.getElementById("jump");
  const reset = document.getElementById("reset");
  if (!log || !jump) return;
  const motion = !matchMedia("(prefers-reduced-motion: reduce)").matches;
  let q, now, lastCall;

  function init() {
    q = {
      1: { started: false, done: false, outcome: "", unlockedBy: null, due: null },
      2: { started: false, done: false, outcome: "", unlockedBy: null, due: null },
      3: { started: false, done: false, outcome: "", unlockedBy: 1, due: due3 },
    };
    now = t0;
    lastCall = "";
  }
  const blocked = (id) => q[id].unlockedBy != null && !q[q[id].unlockedBy].done;
  const available = (id) => !q[id].done && !blocked(id);
  const ids = () => [3, 2, 1];
  const list = (f) => "[" + ids().filter(f).join(", ") + "]";
  const fmt = (t) => new Date(t).toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short", timeZone: "UTC" }).replace(",", "");

  function render() {
    for (const id of [1, 2, 3]) {
      const s = q[id];
      const el = document.getElementById("q" + id);
      const marker = el.querySelector(".marker");
      const label = el.querySelector(".q-label");
      const start = el.querySelector(".start");
      const finish = el.querySelector(".finish");
      const out = el.querySelector(".outcome");
      const isBlocked = blocked(id);
      el.classList.toggle("blocked", isBlocked);
      el.classList.toggle("done", s.done);
      marker.hidden = s.done;
      if (s.done) { label.textContent = "done"; }
      else if (s.started) { marker.textContent = "?"; label.textContent = "incomplete · in progress"; }
      else if (isBlocked) { marker.textContent = "?"; label.textContent = "incomplete"; }
      else { marker.textContent = "!"; label.textContent = "available"; }
      start.hidden = s.done || s.started || isBlocked;
      finish.hidden = s.done || !s.started;
      const ask = el.querySelector(".ask");
      if (ask) {
        ask.hidden = !isBlocked || s.started;
        if (ask.hidden) el.querySelector(".tool-refusal").textContent = "";
      }
      out.hidden = !s.done;
      out.textContent = s.outcome;
      const bs = el.querySelector(".block");
      if (bs && !isBlocked && !bs.hidden) {
        if (motion) { bs.classList.add("lift"); bs.addEventListener("animationend", () => { bs.hidden = true; bs.classList.remove("lift"); }, { once: true }); }
        else bs.hidden = true;
      } else if (bs && isBlocked) { bs.hidden = false; bs.classList.remove("lift"); }
      const ds = el.querySelector(".due");
      if (ds) ds.hidden = !(s.due != null && !s.done && s.due < now);
    }
    const later = now > t0;
    today.textContent = "Today: " + fmt(now);
    today.classList.toggle("later", later);
    jump.setAttribute("aria-pressed", String(later));
    jump.textContent = later ? "Back to today" : "Jump 7 days";
    const at = later ? ", {}, now" : "";
    const lines = [];
    if (lastCall) lines.push(lastCall, "");
    lines.push("read.listAvailableQuests(db" + at + ");\n// " + list(available));
    lines.push("read.listBlockedQuests(db" + at + ");\n// " + list((id) => !q[id].done && blocked(id)));
    if (later) lines.push("read.listOverdueQuests(db" + at + ");\n// " + list((id) => !q[id].done && q[id].due != null && q[id].due < now));
    else lines.push("read.listDueSoonQuests(db, 7 * DAY);\n// " + list((id) => !q[id].done && q[id].due != null && q[id].due >= now && q[id].due <= now + 7 * DAY));
    log.textContent = lines.join("\n");
  }

  document.querySelectorAll(".quest").forEach((el) => {
    const id = Number(el.dataset.id);
    const input = el.querySelector(".finish input");
    const finish = el.querySelector(".finish");
    const refusal = el.querySelector(".refusal");
    el.querySelector(".start").addEventListener("click", () => {
      q[id].started = true;
      lastCall = "write.startQuest(db, " + id + ");";
      render();
      input.focus();
    });
    const ask = el.querySelector(".ask");
    if (ask) ask.addEventListener("click", () => {
      lastCall = "runQuestToolHandler(db, { action: 'start', questId: " + id + " });\n// error invalid_state: Quest \"Obtain finance approval\" is blocked by Collect redlines.\n// Finish the blocking prerequisites before starting this quest, or set force to true.";
      el.querySelector(".tool-refusal").textContent = "invalid_state: blocked by Collect redlines";
      render();
    });
    const tryFinish = () => {
      const text = input.value.trim();
      if (!text) {
        lastCall = "write.finishQuest(db, " + id + ", '');\n// Error: Quest outcome must not be empty.";
        refusal.textContent = "Quest outcome must not be empty.";
        if (motion) { finish.classList.remove("shake"); void finish.offsetWidth; finish.classList.add("shake"); }
        render();
        input.focus();
        return;
      }
      refusal.textContent = "";
      q[id].done = true;
      q[id].outcome = text;
      lastCall = "write.finishQuest(db, " + id + ", " + JSON.stringify(text).replace(/^"|"$/g, "'") + ");";
      render();
    };
    el.querySelector(".do-finish").addEventListener("click", tryFinish);
    input.addEventListener("keydown", (e) => { if (e.key === "Enter") { e.preventDefault(); tryFinish(); } });
  });

  jump.addEventListener("click", () => {
    now = now > t0 ? t0 : t0 + 7 * DAY;
    lastCall = "";
    render();
  });
  reset.addEventListener("click", () => {
    init();
    document.querySelectorAll(".finish input").forEach((i) => { i.value = ""; });
    document.querySelectorAll(".refusal").forEach((r) => { r.textContent = ""; });
    render();
  });

  document.querySelectorAll(".copy").forEach((b) => {
    b.addEventListener("click", async () => {
      const input = document.getElementById(b.dataset.copy);
      if (!input) return;
      try { await navigator.clipboard.writeText(input.value); } catch { input.select(); document.execCommand("copy"); }
      const label = b.textContent;
      b.textContent = "Copied";
      setTimeout(() => { b.textContent = label; }, 2000);
    });
  });

  init();
  render();
})();
