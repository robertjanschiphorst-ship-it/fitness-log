"use client";

import { useState } from "react";
import Link from "next/link";

const DAY_LABELS = ["M", "T", "W", "T", "F", "S", "S"];

/** Format a Date as YYYY-MM-DD using the browser's LOCAL timezone (not UTC). */
function toLocalDateStr(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export function WeekView({
  sessions,
}: {
  sessions: { id: string; isoDate: string }[];
}) {
  const [weekOffset, setWeekOffset] = useState(0); // 0 = this week, -1 = last week, etc.

  // Build a map of local date string → session id
  const dateToSession = new Map(
    sessions.map((s) => [toLocalDateStr(new Date(s.isoDate)), s.id])
  );

  const today = new Date();
  const todayStr = toLocalDateStr(today);

  // Monday of the current real week
  const dow = today.getDay(); // 0=Sun
  const mondayOffset = dow === 0 ? -6 : 1 - dow;
  const monday = new Date(today);
  monday.setDate(today.getDate() + mondayOffset + weekOffset * 7);

  const days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    return d;
  });

  const weekLabel = (() => {
    if (weekOffset === 0) return "This week";
    if (weekOffset === -1) return "Last week";
    const fromStr = days[0].toLocaleDateString("en-GB", { day: "numeric", month: "short" });
    const toStr = days[6].toLocaleDateString("en-GB", { day: "numeric", month: "short" });
    return `${fromStr} – ${toStr}`;
  })();

  const weekWorkouts = days.filter((d) => dateToSession.has(toLocalDateStr(d))).length;

  // Weekly consistency streak: how many consecutive weeks (going back from this week) had ≥1 workout
  const weekStreak = (() => {
    let streak = 0;
    let offset = 0;
    while (streak <= 52) {
      const mon = new Date(today);
      const dayOfWeek = today.getDay();
      const monOff = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
      mon.setDate(today.getDate() + monOff + offset * 7);

      const weekDays = Array.from({ length: 7 }, (_, i) => {
        const d = new Date(mon);
        d.setDate(mon.getDate() + i);
        return toLocalDateStr(d);
      });

      // For the current week only count days up to today
      const hasWorkout = weekDays.some((ds) => ds <= todayStr && dateToSession.has(ds));
      if (!hasWorkout) break;

      streak++;
      offset--;
    }
    return streak;
  })();

  const isCurrentWeek = weekOffset === 0;

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
          <div className="text-xs font-bold text-[var(--text-40)] uppercase tracking-widest">
            {weekLabel}
          </div>
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
          const str = toLocalDateStr(d);
          const isToday = str === todayStr;
          const sessionId = dateToSession.get(str);
          const hasWorkout = !!sessionId;
          const isFuture = str > todayStr;

          const circle = (
            <div
              className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold transition-all ${
                isFuture
                  ? "bg-[var(--card)] text-[var(--text-20)]"
                  : hasWorkout && isToday
                  ? "bg-orange-500 text-white ring-2 ring-orange-500/30"
                  : hasWorkout
                  ? "bg-orange-500/80 text-white"
                  : isToday
                  ? "bg-[var(--input-bg)] text-[var(--text-40)] ring-1 ring-orange-500/30"
                  : "bg-[var(--input-bg)] text-[var(--text-35)]"
              }`}
            >
              {d.getDate()}
            </div>
          );

          return (
            <div key={str} className="flex flex-col items-center gap-1">
              <span
                className={`text-[10px] uppercase tracking-wider font-medium ${
                  isToday ? "text-orange-500" : "text-[var(--text-25)]"
                }`}
              >
                {DAY_LABELS[i]}
              </span>
              {hasWorkout && sessionId ? (
                <Link
                  href={`/sessions/${sessionId}`}
                  className="hover:scale-110 active:scale-95 transition-transform"
                >
                  {circle}
                </Link>
              ) : (
                circle
              )}
            </div>
          );
        })}
      </div>

      {/* Weekly consistency badge */}
      {weekStreak >= 2 && isCurrentWeek && (
        <div className="text-center text-xs text-orange-400 font-bold">
          {weekStreak} weeks consistent 🔥
        </div>
      )}
    </div>
  );
}
