"use client";

import { useMemo, useState, useEffect } from "react";
import { useRouter } from "next/navigation";

type PriorSet = { reps: number; rpe: number | null; weightKg: number };

// no per-button labels — using range hint below the grid instead

// ── Full-screen rest timer ───────────────────────────────────────────────────
function FullScreenRestTimer({
  totalSeconds = 90,
  startedAt,
  onDismiss,
}: {
  totalSeconds?: number;
  startedAt: number;
  onDismiss: () => void;
}) {
  const calcRemaining = () =>
    Math.max(0, totalSeconds - Math.floor((Date.now() - startedAt) / 1000));

  const [remaining, setRemaining] = useState(calcRemaining);

  useEffect(() => {
    if (remaining <= 0) {
      onDismiss();
      return;
    }
    const t = setTimeout(() => setRemaining(calcRemaining()), 1000);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [remaining]);

  const pct = remaining / totalSeconds;
  const r = 80;
  const circumference = 2 * Math.PI * r;

  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-[#0d0d0f]">
      {/* Big ring */}
      <div className="relative w-56 h-56">
        <svg viewBox="0 0 200 200" className="w-56 h-56 -rotate-90">
          <circle
            cx="100" cy="100" r={r}
            fill="none" stroke="currentColor"
            strokeWidth="5" className="text-white/[0.06]"
          />
          <circle
            cx="100" cy="100" r={r}
            fill="none" stroke="currentColor"
            strokeWidth="5" className="text-orange-500 transition-all duration-1000"
            strokeDasharray={circumference}
            strokeDashoffset={circumference * (1 - pct)}
            strokeLinecap="round"
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <div className="text-7xl font-black text-white tabular-nums leading-none">
            {remaining}
          </div>
          <div className="text-xs text-white/30 uppercase tracking-widest mt-2">
            seconds
          </div>
        </div>
      </div>

      <div className="mt-6 text-lg font-black uppercase tracking-[0.3em] text-white/40">
        Rest
      </div>

      <button
        onClick={onDismiss}
        className="mt-20 rounded-2xl border border-white/10 bg-white/[0.04] px-10 py-4 text-sm font-bold text-white/40 uppercase tracking-widest hover:bg-white/[0.08] hover:text-white/60 transition-all active:scale-95"
      >
        Skip Rest →
      </button>
    </div>
  );
}

// ── RPE bottom sheet ─────────────────────────────────────────────────────────
function RpeBottomSheet({
  weight,
  reps,
  onConfirm,
}: {
  weight: number;
  reps: number;
  onConfirm: (rpe: number | "") => void;
}) {
  return (
    <div className="fixed inset-0 z-40 flex flex-col justify-end">
      {/* Backdrop — tap to skip */}
      <div
        className="absolute inset-0 bg-black/70"
        onClick={() => onConfirm("")}
      />

      {/* Sheet */}
      <div className="relative z-10 rounded-t-3xl bg-[#18181b] border-t border-white/[0.08] px-6 pt-4 pb-10 space-y-5">
        {/* Handle bar */}
        <div className="mx-auto w-10 h-1 rounded-full bg-white/20" />

        {/* Set summary */}
        <div className="text-center space-y-1">
          <div className="text-3xl font-black tracking-tight">
            {weight} kg × {reps}
          </div>
          <div className="text-sm text-white/40">How hard was that set?</div>
        </div>

        {/* RPE buttons — full 1–10 scale in a 5×2 grid */}
        <div className="grid grid-cols-5 gap-2">
          {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((r) => (
            <button
              key={r}
              onClick={() => onConfirm(r)}
              className={`flex items-center justify-center rounded-2xl border py-4 text-xl font-black active:scale-95 transition-all ${
                r <= 5
                  ? "border-white/[0.06] bg-white/[0.03] text-white/60 hover:bg-white/[0.08]"
                  : r <= 7
                  ? "border-orange-500/20 bg-orange-500/5 text-white hover:bg-orange-500/15"
                  : "border-orange-500/40 bg-orange-500/10 text-orange-300 hover:bg-orange-500/25"
              }`}
            >
              {r}
            </button>
          ))}
        </div>
        {/* Range hint */}
        <div className="flex justify-between text-[10px] text-white/25 uppercase tracking-wider px-1 -mt-1">
          <span>Easy</span>
          <span>Max effort</span>
        </div>

        <button
          onClick={() => onConfirm("")}
          className="w-full text-sm text-white/25 py-1 hover:text-white/50 transition-colors"
        >
          Skip RPE
        </button>
      </div>
    </div>
  );
}

// ── Main LogSet component ────────────────────────────────────────────────────
export function LogSet({
  sessionExerciseId,
  repRangeMax,
  targetSets,
  priorSets,
  defaultReps = 8,
  defaultWeightKg = 20,
  incrementKg = 2.5,
  rpeCutoff = 8,
  allTimePrKg,
}: {
  sessionExerciseId: string;
  repRangeMax: number;
  targetSets: number;
  priorSets: PriorSet[];
  defaultReps?: number;
  defaultWeightKg?: number;
  incrementKg?: number;
  rpeCutoff?: number;
  allTimePrKg?: number;
}) {
  const [reps, setReps] = useState(defaultReps);
  const [weight, setWeight] = useState(defaultWeightKg);
  const [loading, setLoading] = useState(false);
  const [justPR, setJustPR] = useState(false);
  const [showRpePrompt, setShowRpePrompt] = useState(false);
  const [showFullScreenTimer, setShowFullScreenTimer] = useState(false);
  const [timerStartedAt, setTimerStartedAt] = useState<number | null>(null);
  const router = useRouter();

  const setsLogged = priorSets.length;
  const targetMet = setsLogged >= targetSets;

  // Progression hints — based on already-logged sets in this session
  const suggestIncrease = useMemo(
    () =>
      priorSets.length > 0 &&
      priorSets.every(
        (s) => s.reps >= repRangeMax && (s.rpe == null || s.rpe < rpeCutoff)
      ),
    [priorSets, repRangeMax, rpeCutoff]
  );

  const suggestHoldHighRpe = useMemo(() => {
    const last = priorSets[priorSets.length - 1];
    return (
      last != null &&
      last.reps >= repRangeMax &&
      last.rpe != null &&
      last.rpe >= rpeCutoff
    );
  }, [priorSets, repRangeMax, rpeCutoff]);

  const suggestedNextWeight = useMemo(
    () => (suggestIncrease ? Math.round((weight + incrementKg) * 100) / 100 : null),
    [suggestIncrease, weight, incrementKg]
  );

  // Step 1 — user taps the button: start timer, show RPE prompt
  function handleLogSetTap() {
    setTimerStartedAt(Date.now());
    setShowRpePrompt(true);
  }

  // Step 2 — user picks RPE (or skips): submit set, show full-screen timer
  async function handleRpeConfirm(selectedRpe: number | "") {
    setShowRpePrompt(false);
    setShowFullScreenTimer(true); // timer is already counting (startedAt set above)
    setLoading(true);
    setJustPR(false);
    try {
      const res = await fetch("/api/sets/add", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          sessionExerciseId,
          reps,
          weightKg: weight,
          rpe: selectedRpe === "" ? null : selectedRpe,
        }),
      });
      const text = await res.text();
      if (!res.ok) { alert(text); return; }
      if (allTimePrKg !== undefined && weight > allTimePrKg) setJustPR(true);
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  function handleTimerDismiss() {
    setShowFullScreenTimer(false);
    setTimerStartedAt(null);
  }

  return (
    <div className="mt-4 space-y-3">

      {/* PR celebration */}
      {justPR && (
        <div className="flex items-center gap-2 rounded-xl border border-yellow-500/40 bg-yellow-500/10 px-4 py-2.5">
          <span className="text-lg">🏆</span>
          <div>
            <div className="text-sm font-black text-yellow-400 uppercase tracking-wide">New PR!</div>
            <div className="text-xs text-white/50">{weight} kg — best ever on this exercise</div>
          </div>
        </div>
      )}

      {/* Copy last set */}
      {priorSets.length > 0 && (() => {
        const last = priorSets[priorSets.length - 1];
        return (
          <button
            type="button"
            onClick={() => { setReps(last.reps); setWeight(last.weightKg); }}
            className="flex items-center gap-2 rounded-lg border border-white/[0.07] bg-white/[0.03] px-3 py-1.5 text-xs text-white/50 hover:border-orange-500/30 hover:text-orange-400 transition-all w-fit"
          >
            ↑ Same as last set — {last.weightKg} kg × {last.reps}
          </button>
        );
      })()}

      {/* Inputs — reps + weight only (RPE collected via bottom sheet after) */}
      <div className="space-y-2">
        <div className="flex items-end gap-2">
          <div className="flex-1">
            <label className="block text-xs text-white/40 uppercase tracking-wider mb-1">Reps</label>
            <input
              type="number"
              inputMode="numeric"
              value={reps}
              onChange={(e) => setReps(Number(e.target.value))}
              className="w-full rounded-lg bg-white/[0.06] px-3 py-3 text-lg font-black ring-1 ring-white/10 focus:outline-none focus:ring-orange-500/50"
            />
          </div>
          <div className="flex-1">
            <label className="block text-xs text-white/40 uppercase tracking-wider mb-1">Weight (kg)</label>
            <input
              type="number"
              inputMode="decimal"
              value={weight}
              onChange={(e) => setWeight(Number(e.target.value))}
              className="w-full rounded-lg bg-white/[0.06] px-3 py-3 text-lg font-black ring-1 ring-white/10 focus:outline-none focus:ring-orange-500/50"
            />
          </div>
        </div>

        {/* Log Set / Extra Set button */}
        {targetMet ? (
          <button
            onClick={handleLogSetTap}
            disabled={loading}
            className="w-full rounded-xl border border-white/[0.08] bg-transparent py-2 text-xs font-semibold text-white/30 hover:text-white/50 hover:border-white/20 disabled:opacity-50 transition-all uppercase tracking-widest"
          >
            {loading ? "…" : `+ Log Extra Set`}
          </button>
        ) : (
          <button
            onClick={handleLogSetTap}
            disabled={loading}
            className="w-full rounded-xl bg-orange-500 py-4 font-black text-white text-base hover:bg-orange-400 disabled:opacity-50 transition-colors uppercase tracking-widest"
          >
            {loading ? "…" : `+ Log Set  ${setsLogged + 1} / ${targetSets}`}
          </button>
        )}
      </div>

      {/* Progression hints (from logged sets) */}
      {suggestIncrease && (
        <div className="rounded-lg border border-green-500/20 bg-green-500/5 px-3 py-2 text-xs text-green-400">
          All sets at top of range → bump to{" "}
          <span className="font-bold">{suggestedNextWeight ?? weight + incrementKg} kg</span> next session
        </div>
      )}
      {suggestHoldHighRpe && (
        <div className="rounded-lg border border-yellow-500/20 bg-yellow-500/5 px-3 py-2 text-xs text-yellow-400">
          Hit top reps at high RPE → keep this weight for now
        </div>
      )}

      {/* RPE bottom sheet */}
      {showRpePrompt && (
        <RpeBottomSheet weight={weight} reps={reps} onConfirm={handleRpeConfirm} />
      )}

      {/* Full-screen rest timer */}
      {showFullScreenTimer && timerStartedAt != null && (
        <FullScreenRestTimer startedAt={timerStartedAt} onDismiss={handleTimerDismiss} />
      )}
    </div>
  );
}
