"use client";

import { useState } from "react";

const DAY_LABELS = ["M", "T", "W", "T", "F", "S", "S"];

export function WeekView({ sessionDates }: { sessionDates: string[] }) {
  const [weekOffset, setWeekOffset] = useState(0); // 0 = current week, -1 = last week, etc.

  const dateSet = new Set(sessionDates);

  // Get Monday of the current real week, then offset
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayStr = today.toISOString().split("T")[0];

  const dow = today.getDay(); // 0=Sun, 1=Mon...
  const mondayOffset = dow === 0 ? -6 : 1 - dow;
  const monday = new Date(today);
  monday.setDate(today.getDate() + mondayOffset + weekOffset * 7);

  const days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    return d;
  });

  const weekLabel = (() => {
    const from = days[0];
    const to = days[6];
    const fromStr = from.toLocaleDateString("en-GB", { day: "numeric", month: "short" });
    const toStr = to.toLocaleDateString("en-GB", { day: "numeric", month: "short" });
    if (weekOffset === 0) return "This week";
    if (weekOffset === -1) return "Last week";
    return `${fromStr} – ${toStr}`;
  })();

  // Count workouts this displayed week
  const weekWorkouts = days.filter((d) => dateSet.has(d.toISOString().split("T")[0])).length;

  // Current streak (from today backwards)
  const streak = (() => {
    let s = 0;
    const check = new Date(today);
    while (dateSet.has(check.toISOString().split("T")[0])) {
      s++;
      check.setDate(check.getDate() - 1);
    }
    return s;
  })();

  const isCurrentWeek = weekOffset === 0;
  const isFutureWeek = weekOffset > 0;

  return (
    <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-4 space-y-3">
      {/* Header row */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => setWeekOffset((o) => o - 1)}
          className="w-7 h-7 flex items-center justify-center rounded-lg text-[var(--text-40)] hover:text-[var(--text-60)] hover:bg-[var(--input-bg)] transition-all text-sm"
        >
          ‹
        </button>

        <div className="text-center">
          <div className="text-xs font-bold text-[var(--text-40)] uppercase tracking-widest">{weekLabel}</div>
          {weekWorkouts > 0 && (
            <div className="text-[10px] text-[var(--text-25)] mt-0.5">
              {weekWorkouts} workout{weekWorkouts !== 1 ? "s" : ""}
            </div>
          )}
        </div>

        <button
          onClick={() => setWeekOffset((o) => Math.min(0, o + 1))}
          disabled={isCurrentWeek}
          className="w-7 h-7 flex items-center justify-center rounded-lg text-[var(--text-40)] hover:text-[var(--text-60)] hover:bg-[var(--input-bg)] disabled:opacity-20 disabled:cursor-default transition-all text-sm"
        >
          ›
        </button>
      </div>

      {/* Day grid */}
      <div className="grid grid-cols-7 gap-1.5">
        {days.map((d, i) => {
          const str = d.toISOString().split("T")[0];
          const isToday = str === todayStr;
          const hasWorkout = dateSet.has(str);
          const isFuture = str > todayStr;

          return (
            <div key={str} className="flex flex-col items-center gap-1">
              <span className={`text-[10px] uppercase tracking-wider font-medium ${
                isToday ? "text-orange-500" : "text-[var(--text-25)]"
              }`}>
                {DAY_LABELS[i]}
              </span>
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold transition-all ${
                isFuture
                  ? "bg-[var(--card)] text-[var(--text-20)]"
                  : hasWorkout && isToday
                  ? "bg-orange-500 text-white ring-2 ring-orange-500/30"
                  : hasWorkout
                  ? "bg-orange-500/80 text-white"
                  : isToday
                  ? "bg-[var(--input-bg)] text-[var(--text-40)] ring-1 ring-orange-500/30"
                  : "bg-[var(--input-bg)] text-[var(--text-35)]"
              }`}>
                {d.getDate()}
              </div>
            </div>
          );
        })}
      </div>

      {/* Streak */}
      {streak > 0 && isCurrentWeek && (
        <div className="text-center text-xs text-orange-400 font-bold">
          {streak} day streak 🔥
        </div>
      )}
    </div>
  );
}
