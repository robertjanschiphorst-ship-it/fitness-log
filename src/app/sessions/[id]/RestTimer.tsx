"use client";

import { useEffect, useState, useCallback } from "react";

export function RestTimer({ seconds = 90, onDismiss }: { seconds?: number; onDismiss: () => void }) {
  const [remaining, setRemaining] = useState(seconds);

  const handleDismiss = useCallback(() => onDismiss(), [onDismiss]);

  useEffect(() => {
    if (remaining <= 0) {
      handleDismiss();
      return;
    }
    const t = setTimeout(() => setRemaining((r) => r - 1), 1000);
    return () => clearTimeout(t);
  }, [remaining, handleDismiss]);

  const pct = remaining / seconds;
  const r = 18;
  const circumference = 2 * Math.PI * r;

  return (
    <div className="flex items-center gap-3 rounded-xl border border-orange-500/30 bg-orange-500/10 p-3 mt-3">
      {/* Countdown ring */}
      <div className="relative shrink-0 w-12 h-12">
        <svg viewBox="0 0 44 44" className="w-12 h-12 -rotate-90">
          <circle cx="22" cy="22" r={r} fill="none" stroke="currentColor"
            strokeWidth="3" className="text-white/10" />
          <circle cx="22" cy="22" r={r} fill="none" stroke="currentColor"
            strokeWidth="3" className="text-orange-500 transition-all duration-1000"
            strokeDasharray={circumference}
            strokeDashoffset={circumference * (1 - pct)}
            strokeLinecap="round" />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center text-sm font-black text-orange-400">
          {remaining}
        </div>
      </div>

      <div className="flex-1">
        <div className="text-sm font-bold text-orange-400">Rest</div>
        <div className="text-xs text-white/40">{remaining}s until next set</div>
      </div>

      <button onClick={handleDismiss}
        className="text-xs text-white/30 hover:text-white/70 px-2 py-1 rounded-lg hover:bg-white/5 transition-all">
        Skip →
      </button>
    </div>
  );
}
