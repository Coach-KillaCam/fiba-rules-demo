import React, { useEffect, useMemo, useState } from "react";

/**
 * FIBA Ref Rules – Duolingo‑style Demo (JS version for App.jsx)
 *
 * Modes included:
 * 1) Recall (type answer)
 * 2) Multiple Choice
 * 3) Quick Swipe (legal vs illegal)
 *
 * Features:
 * - Streak + XP with localStorage persistence
 * - Spaced repetition queue: missed items get re‑queued
 * - Session summary
 *
 * HOW TO USE:
 * - Paste this entire file into src/App.jsx in your Vite React app and save.
 */

// ---------- Modes ----------
const MODES = ["Recall", "Multiple Choice", "Quick Swipe"];

// ---------- Question Bank (seeded with Article 24 example) ----------
const bank = [
  {
    id: "art24-double-dribble",
    article: 24,
    topic: "Dribbling",
    tags: ["violations", "ball-handling"],
    canonical: {
      prompt: "Can a player start a new dribble after ending a previous dribble?",
      answer: "No, unless another player touched the ball in between.",
      rubric: ["no", "unless", "another player", "touched", "in between"],
    },
    mcq: {
      stem:
        "A player ends their dribble, then starts a new one without any other touch. What’s the call?",
      choices: [
        { key: "a", text: "Legal play" },
        { key: "b", text: "Double dribble", correct: true },
        { key: "c", text: "Travelling" },
        { key: "d", text: "Play on" },
      ],
      explanation:
        "Once a dribble has ended, the same player may not start a new one unless another player has touched the ball in between (FIBA OBR Article 24: Dribbling).",
    },
    swipe: {
      situation: "Player ends dribble → dribbles again with no intervening touch.",
      legal: false,
      explanation:
        "This is a double dribble. Exception only if another player touched the ball between dribbles (OBR Art. 24).",
    },
    cite: "OBR Article 24: Dribbling",
  },
];

// ---------- Local Storage Helpers ----------
const LS = {
  XP: "fiba_demo_xp",
  STREAK: "fiba_demo_streak",
  LAST_DAY: "fiba_demo_last_day",
};

function readNum(key, def = 0) {
  const raw = localStorage.getItem(key);
  if (!raw) return def;
  const n = Number(raw);
  return Number.isFinite(n) ? n : def;
}

function todayStr() {
  const now = new Date();
  const mm = String(now.getMonth() + 1).padStart(2, "0");
  const dd = String(now.getDate()).padStart(2, "0");
  return `${now.getFullYear()}-${mm}-${dd}`;
}

function updateStreakOnSessionStart() {
  const last = localStorage.getItem(LS.LAST_DAY);
  const today = todayStr();
  if (!last) {
    localStorage.setItem(LS.STREAK, "1");
    localStorage.setItem(LS.LAST_DAY, today);
    return 1;
  }
  if (last === today) return readNum(LS.STREAK, 1);

  const y = new Date();
  y.setDate(y.getDate() - 1);
  const mm = String(y.getMonth() + 1).padStart(2, "0");
  const dd = String(y.getDate()).padStart(2, "0");
  const yStr = `${y.getFullYear()}-${mm}-${dd}`;

  if (last === yStr) {
    const next = readNum(LS.STREAK, 0) + 1;
    localStorage.setItem(LS.STREAK, String(next));
    localStorage.setItem(LS.LAST_DAY, today);
    return next;
  }
  localStorage.setItem(LS.STREAK, "1");
  localStorage.setItem(LS.LAST_DAY, today);
  return 1;
}

// ---------- Small UI helpers ----------
function Pill({ children }) {
  return (
    <span className="px-2 py-0.5 rounded-full text-xs border bg-white/5 border-white/10">
      {children}
    </span>
  );
}

function Header({ mode, streak, xp, setMode }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <div>
        <h1 className="text-2xl font-bold">FIBA Ref Rules</h1>
        <p className="text-sm opacity-80">Duolingo‑style daily practice</p>
      </div>
      <div className="flex items-center gap-3">
        <Pill>🔥 Streak: {streak}d</Pill>
        <Pill>⭐ XP: {xp}</Pill>
        <select
          className="bg-transparent border rounded-xl px-3 py-1 text-sm"
          value={mode}
          onChange={(e) => setMode(e.target.value)}
        >
          {MODES.map((m) => (
            <option key={m} value={m}>
              {m}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}

function ProgressBar({ value }) {
  return (
    <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden">
      <div className="h-full bg-white/70" style={{ width: `${Math.min(100, value)}%` }} />
    </div>
  );
}

// ---------- Mode Components ----------
function RecallCard({ q, onResult }) {
  const [text, setText] = useState("");
  const [checked, setChecked] = useState(null);

  const ok = useMemo(() => {
    const t = text.toLowerCase();
    return q.canonical.rubric.every((r) => t.includes(r));
  }, [text, q]);

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold">Recall</h2>
      <p className="opacity-90">{q.canonical.prompt}</p>
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        className="w-full h-28 p-3 rounded-xl border bg-white/5"
        placeholder="Type your answer…"
      />
      {checked !== null && (
        <div
          className={`p-3 rounded-xl border ${ok ? "border-green-500/40 bg-green-500/10" : "border-red-500/40 bg-red-500/10"}`}
        >
          {ok ? (
            "Correct!"
          ) : (
            <>
              <div className="font-semibold mb-1">Model Answer</div>
              <div className="text-sm">{q.canonical.answer}</div>
            </>
          )}
          <div className="text-xs mt-2 opacity-80">{q.cite}</div>
        </div>
      )}
      <div className="flex gap-2">
        <button
          onClick={() => {
            setChecked(ok);
            onResult(ok);
          }}
          className="px-4 py-2 rounded-xl border hover:bg-white/10"
        >
          Check
        </button>
        <button
          onClick={() => {
            setText("");
            setChecked(null);
          }}
          className="px-4 py-2 rounded-xl border hover:bg-white/10"
        >
          Reset
        </button>
      </div>
    </div>
  );
}

function MCQCard({ q, onResult }) {
  const [picked, setPicked] = useState(null);
  const correctChoice = q.mcq.choices.find((c) => c.correct);
  const correctKey = correctChoice ? correctChoice.key : null;

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold">Multiple Choice</h2>
      <p className="opacity-90">{q.mcq.stem}</p>
      <div className="grid gap-2">
        {q.mcq.choices.map((c) => (
          <button
            key={c.key}
            onClick={() => {
              if (!picked) setPicked(c.key);
              onResult(Boolean(c.correct));
            }}
            className={`text-left px-4 py-3 rounded-xl border hover:bg-white/10 ${
              picked
                ? c.key === correctKey
                  ? "border-green-500/40 bg-green-500/10"
                  : c.key === picked
                  ? "border-red-500/40 bg-red-500/10"
                  : "opacity-60"
                : ""
            }`}
          >
            <span className="font-mono mr-2">{c.key.toUpperCase()}.</span>
            {c.text}
          </button>
        ))}
      </div>
      {picked && (
        <div className="text-sm opacity-90">
          {q.mcq.explanation}
          <div className="text-xs mt-2 opacity-80">{q.cite}</div>
        </div>
      )}
    </div>
  );
}

function SwipeCard({ q, onResult }) {
  const [decision, setDecision] = useState(null);

  function decide(val) {
    if (decision !== null) return;
    setDecision(val);
    onResult(val === q.swipe.legal);
  }

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold">Quick Swipe</h2>
      <div className="opacity-90">{q.swipe.situation}</div>
      <div className="flex gap-3">
        <button onClick={() => decide(true)} className="px-4 py-2 rounded-xl border hover:bg-white/10">
          ✅ Legal
        </button>
        <button onClick={() => decide(false)} className="px-4 py-2 rounded-xl border hover:bg-white/10">
          ❌ Illegal
        </button>
      </div>
      {decision !== null && (
        <div
          className={`p-3 rounded-xl border ${
            decision === q.swipe.legal
              ? "border-green-500/40 bg-green-500/10"
              : "border-red-500/40 bg-red-500/10"
          }`}
        >
          {q.swipe.explanation}
          <div className="text-xs mt-2 opacity-80">{q.cite}</div>
        </div>
      )}
    </div>
  );
}

// ---------- Main App ----------
export default function App() {
  const [mode, setMode] = useState("Multiple Choice");
  const [queue, setQueue] = useState(bank.map((b) => b.id));
  const [idx, setIdx] = useState(0);
  const [xp, setXp] = useState(readNum(LS.XP, 0));
  const [streak, setStreak] = useState(1);
  const [correctCount, setCorrectCount] = useState(0);
  const [incorrectCount, setIncorrectCount] = useState(0);

  useEffect(() => {
    setStreak(updateStreakOnSessionStart());
  }, []);

  const current = useMemo(() => bank.find((b) => b.id === queue[idx]), [queue, idx]);
  const progress = (idx / Math.max(1, queue.length)) * 100;

  function handleResult(ok) {
    // XP: +10 correct, +2 attempt
    setXp((x) => {
      const next = x + (ok ? 10 : 2);
      localStorage.setItem(LS.XP, String(next));
      return next;
    });

    if (ok) setCorrectCount((c) => c + 1);
    else setIncorrectCount((c) => c + 1);

    // SRS queue logic: if wrong, push to end; if right, advance
    setQueue((q) => {
      const id = q[idx];
      const next = [...q];
      if (!ok) next.push(id);
      return next;
    });

    setIdx((i) => Math.min(i + 1, queue.length));
  }

  const finished = idx >= queue.length;

  return (
    <div className="min-h-screen bg-gradient-to-b from-neutral-900 to-neutral-950 text-white">
      <div className="max-w-2xl mx-auto p-6 space-y-6">
        <Header mode={mode} streak={streak} xp={xp} setMode={setMode} />
        <div className="flex items-center gap-3">
          <ProgressBar value={finished ? 100 : progress} />
          <Pill>
            {finished ? "Done" : `${Math.min(queue.length, idx + 1)} / ${queue.length}`}
          </Pill>
        </div>

        <div className="grid gap-6 rounded-2xl border border-white/10 p-6 bg-white/[0.03]">
          {finished ? (
            <Summary correct={correctCount} incorrect={incorrectCount} />
          ) : mode === "Recall" ? (
            <RecallCard q={current} onResult={handleResult} />
          ) : mode === "Multiple Choice" ? (
            <MCQCard q={current} onResult={handleResult} />
          ) : (
            <SwipeCard q={current} onResult={handleResult} />
          )}

          <div className="text-xs opacity-70">
            Tip: Add more questions to the <code>bank</code> array to expand the deck.
          </div>
        </div>

        <CuratorPanel />
      </div>
    </div>
  );
}

function Summary({ correct, incorrect }) {
  const total = correct + incorrect;
  const pct = total ? Math.round((correct / total) * 100) : 0;
  return (
    <div className="space-y-3">
      <h2 className="text-xl font-semibold">Session Summary</h2>
      <div className="grid grid-cols-3 gap-3 text-center">
        <div className="rounded-xl border p-3">
          <div className="text-2xl font-bold">{correct}</div>
          <div className="text-xs opacity-80">Correct</div>
        </div>
        <div className="rounded-xl border p-3">
          <div className="text-2xl font-bold">{incorrect}</div>
          <div className="text-xs opacity-80">Incorrect</div>
        </div>
        <div className="rounded-xl border p-3">
          <div className="text-2xl font-bold">{pct}%</div>
          <div className="text-xs opacity-80">Accuracy</div>
        </div>
      </div>
      <div className="text-sm opacity-80">
        Spaced repetition is on: missed items were re‑queued. Keep your streak alive tomorrow to strengthen memory.
      </div>
    </div>
  );
}

function CuratorPanel() {
  const [open, setOpen] = useState(false);
  return (
    <div className="border border-white/10 rounded-2xl p-4">
      <button
        onClick={() => setOpen((o) => !o)}
        className="text-left w-full flex items-center justify-between"
      >
        <span className="font-semibold">Curriculum Curator (for senior officials)</span>
        <span className="opacity-70">{open ? "▲" : "▼"}</span>
      </button>
      {open && (
        <div className="mt-3 text-sm space-y-2 opacity-90">
          <p>
            This demo shows three practice modes reading from a single <code>bank</code> item
            (OBR Article 24). To expand:
          </p>
          <ol className="list-decimal ml-5 space-y-1">
            <li>
              Duplicate the <code>bank[0]</code> object and change <code>id</code>, <code>article</code>,
              and prompts (e.g., Article 23 Out‑of‑Bounds; Article 10 Playing time; etc.).
            </li>
            <li>
              Use <code>canonical.rubric</code> keywords to mark correct recall answers without
              requiring exact phrasing.
            </li>
            <li>
              Add <code>mcq.choices</code> with one <code>correct: true</code>.
            </li>
            <li>
              For swipe mode, set <code>legal</code> to true/false and write a one‑line explanation.
            </li>
          </ol>
          <p className="opacity-80">
            Roadmap: per‑article decks, timing & scoring engine (24s/14s), bonus ‘Mechanics & Signals’ pack,
            and OBRI cross‑refs.
          </p>
        </div>
      )}
    </div>
  );
}
