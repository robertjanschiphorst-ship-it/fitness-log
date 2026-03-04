import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { ProgressChart } from "./ProgressChart";

export default async function ProgressPage() {
  const sessionExercises = await prisma.sessionExercise.findMany({
    include: {
      sets: { orderBy: { setNumber: "asc" } },
      session: { select: { startedAt: true } },
    },
    orderBy: { session: { startedAt: "asc" } },
  });

  const byExercise = new Map<string, { date: string; maxWeight: number; totalVolume: number }[]>();

  for (const se of sessionExercises) {
    if (se.sets.length === 0) continue;
    const name = se.exerciseName;
    const date = new Date(se.session.startedAt).toISOString().split("T")[0];
    const maxWeight = Math.max(...se.sets.map((s) => s.weightKg));
    const totalVolume = se.sets.reduce((sum, s) => sum + s.reps * s.weightKg, 0);

    if (!byExercise.has(name)) byExercise.set(name, []);
    const existing = byExercise.get(name)!.find((d) => d.date === date);
    if (existing) {
      existing.maxWeight = Math.max(existing.maxWeight, maxWeight);
      existing.totalVolume += totalVolume;
    } else {
      byExercise.get(name)!.push({ date, maxWeight, totalVolume });
    }
  }

  const exercises = [...byExercise.entries()]
    .filter(([, data]) => data.length >= 1)
    .sort((a, b) => b[1].length - a[1].length);

  return (
    <main className="min-h-screen p-5 pb-10">
      <div className="mx-auto max-w-3xl space-y-6">
        <div className="pt-4">
          <Link href="/" className="text-xs text-white/30 hover:text-white/60 uppercase tracking-wider">← Home</Link>
        </div>

        <header>
          <h1 className="text-3xl font-black uppercase tracking-tight">Progress</h1>
          <p className="mt-1 text-xs text-white/40 uppercase tracking-wider">Strength over time, per exercise</p>
        </header>

        {exercises.length === 0 ? (
          <div className="rounded-xl border border-white/[0.07] p-10 text-center space-y-3">
            <p className="text-white/40">No data yet — log some workouts to see your progress.</p>
            <Link href="/templates" className="text-sm text-orange-500 hover:text-orange-400">
              Start a workout →
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {exercises.map(([name, data]) => {
              const best = Math.max(...data.map((d) => d.maxWeight));
              const first = data[0].maxWeight;
              const diff = best - first;
              return (
                <div key={name} className="rounded-xl border border-white/[0.07] bg-white/[0.03] overflow-hidden">
                  <div className="flex items-center justify-between px-4 pt-4 pb-3 border-b border-white/[0.07]">
                    <div className="flex items-center gap-2">
                      <div className="w-1 h-5 rounded-full bg-orange-500 shrink-0" />
                      <h2 className="font-bold">{name}</h2>
                    </div>
                    <div className="flex items-center gap-3 text-right">
                      <div>
                        <div className="text-lg font-black text-orange-500">{best} kg</div>
                        <div className="text-xs text-white/35 uppercase tracking-wide">
                          {diff > 0 ? `+${diff.toFixed(1)} kg` : diff < 0 ? `${diff.toFixed(1)} kg` : "—"} total
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="p-4">
                    <ProgressChart data={data} />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </main>
  );
}
