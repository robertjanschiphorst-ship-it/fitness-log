"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

function volumeComparison(kg: number): { emoji: string; text: string } {
  if (kg < 50)    return { emoji: "🐱", text: "like lifting a cat" };
  if (kg < 200)   return { emoji: "🐕", text: `like lifting ${Math.round(kg / 30)} dogs` };
  if (kg < 600)   return { emoji: "🧍", text: `like lifting ${Math.round(kg / 75)} people` };
  if (kg < 2000)  return { emoji: "🐎", text: `like lifting ${(kg / 450).toFixed(1)} horses` };
  if (kg < 6000)  return { emoji: "🚗", text: `like lifting ${(kg / 1500).toFixed(1)} cars` };
  if (kg < 25000) return { emoji: "🐘", text: `like lifting ${(kg / 5000).toFixed(1)} elephants` };
  if (kg < 80000) return { emoji: "🚌", text: `like lifting ${(kg / 12000).toFixed(1)} double-decker buses` };
  return            { emoji: "🐋", text: `like lifting ${(kg / 150000).toFixed(2)} blue whales` };
}

export function FinishWorkoutButton({
  sessionId,
  alreadyFinished,
  totalVolume,
  totalSets,
  startedAt,
}: {
  sessionId: string;
  alreadyFinished: boolean;
  totalVolume: number;
  totalSets: number;
  startedAt: string;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [showCelebration, setShowCelebration] = useState(false);
  const [durationMin, setDurationMin] = useState(0);

  if (alreadyFinished) {
    return (
      <div className="flex items-center gap-2 text-xs text-green-400/70 uppercase tracking-wider font-bold">
        <span>✓</span> Workout complete
      </div>
    );
  }

  async function handleFinish() {
    setLoading(true);
    const finishedAt = new Date();
    await fetch("/api/sessions/finish", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: sessionId }),
    });
    const mins = Math.round((finishedAt.getTime() - new Date(startedAt).getTime()) / 60000);
    setDurationMin(mins);
    setLoading(false);
    setConfirming(false);
    setShowCelebration(true);
  }

  function handleDismiss() {
    setShowCelebration(false);
    router.refresh();
  }

  // Full-screen celebration overlay
  if (showCelebration) {
    const { emoji, text } = volumeComparison(totalVolume);
    const fmtVol = totalVolume >= 1000
      ? `${(totalVolume / 1000).toFixed(1)}k`
      : totalVolume.toFixed(0);

    return (
      <div className="always-dark fixed inset-0 z-50 flex flex-col items-center justify-center bg-[var(--bg)] px-8">
        {/* Trophy */}
        <div className="text-7xl mb-6">🏆</div>

        <div className="text-center space-y-2 mb-10">
          <div className="text-4xl font-black uppercase tracking-widest text-white">
            Done!
          </div>
          <div className="text-sm text-[var(--text-40)] uppercase tracking-wider">
            Workout complete
          </div>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-3 gap-4 w-full max-w-xs mb-10">
          {[
            { value: `${durationMin}`, label: "min" },
            { value: `${totalSets}`, label: "sets" },
            { value: `${fmtVol} kg`, label: "volume" },
          ].map(({ value, label }) => (
            <div key={label} className="flex flex-col items-center rounded-2xl border border-[var(--border)] bg-[var(--card)] py-4 px-2">
              <div className="text-xl font-black text-orange-500 leading-none">{value}</div>
              <div className="text-[10px] text-[var(--text-30)] uppercase tracking-wider mt-1">{label}</div>
            </div>
          ))}
        </div>

        {/* Fun comparison */}
        <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] px-5 py-4 flex items-center gap-4 w-full max-w-xs mb-12">
          <span className="text-4xl">{emoji}</span>
          <div>
            <div className="text-sm font-bold text-white leading-snug">
              That&apos;s {text}
            </div>
            <div className="text-xs text-[var(--text-30)] mt-0.5">total volume this session</div>
          </div>
        </div>

        <button
          onClick={handleDismiss}
          className="w-full max-w-xs rounded-2xl bg-orange-500 py-4 text-sm font-black text-white uppercase tracking-widest hover:bg-orange-400 transition-colors active:scale-95"
        >
          Back to session →
        </button>
      </div>
    );
  }

  if (confirming) {
    return (
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-sm text-[var(--text-50)] w-full sm:w-auto">Finish this workout?</span>
        <button onClick={handleFinish} disabled={loading}
          className="rounded-xl bg-green-500 px-4 py-2.5 text-sm font-black text-white hover:bg-green-400 disabled:opacity-50 transition-colors uppercase tracking-wide">
          {loading ? "…" : "Yes, finish ✓"}
        </button>
        <button onClick={() => setConfirming(false)}
          className="rounded-xl bg-[var(--input-bg)] px-3 py-2.5 text-sm text-[var(--text-50)] hover:text-[var(--text-70)] transition-colors">
          Not yet
        </button>
      </div>
    );
  }

  return (
    <button onClick={() => setConfirming(true)}
      className="rounded-xl border border-green-500/40 bg-green-500/10 px-4 py-2.5 text-sm font-black text-green-400 hover:bg-green-500/20 hover:border-green-500/60 transition-all uppercase tracking-wide whitespace-nowrap">
      Finish Workout ✓
    </button>
  );
}
