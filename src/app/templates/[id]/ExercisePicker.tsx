"use client";

import { useMemo, useState } from "react";

type Exercise = { id: string; name: string };

export function ExercisePicker({
  allExercises,
  suggestedExercises,
}: {
  allExercises: { id: string; name: string }[];
  suggestedExercises: { id: string; name: string }[];
}) {
  const [q, setQ] = useState("");

  const filteredAll = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return allExercises.slice(0, 200);
    return allExercises.filter((e) => e.name.toLowerCase().includes(s)).slice(0, 200);
  }, [q, allExercises]);

  const filteredSuggested = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return suggestedExercises.slice(0, 50);
    // If user searches, suggestions should also filter
    return suggestedExercises.filter((e) => e.name.toLowerCase().includes(s)).slice(0, 50);
  }, [q, suggestedExercises]);

  return (
    <div className="space-y-3">
      <div className="space-y-1">
        <label className="text-sm text-[var(--text-70)]">Search</label>
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="bench, squat, row..."
          className="w-full rounded-md bg-[var(--card)] px-3 py-2 outline-none ring-1 ring-[var(--border)] focus:ring-2"
        />
      </div>

      <div className="space-y-1">
        <label className="text-sm text-[var(--text-70)]">Exercise</label>
        <select
          name="exerciseId"
          className="w-full rounded-md bg-[var(--card)] px-3 py-2 outline-none ring-1 ring-[var(--border)] focus:ring-2"
        >
          {filteredSuggested.length > 0 && (
            <optgroup label="Suggested">
              {filteredSuggested.map((e) => (
                <option key={e.id} value={e.id}>
                  {e.name}
                </option>
              ))}
            </optgroup>
          )}

          <optgroup label="All">
            {filteredAll.map((e) => (
              <option key={e.id} value={e.id}>
                {e.name}
              </option>
            ))}
          </optgroup>
        </select>
        <p className="text-xs text-[var(--text-60)]">
          Suggested shows up to 50 • All shows up to 200.
        </p>
      </div>
    </div>
  );
}