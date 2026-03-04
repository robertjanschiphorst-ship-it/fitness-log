import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { DeleteSessionButton } from "./DeleteSessionButton";
import { auth } from "@/auth";

export const dynamic = 'force-dynamic';

export default async function HistoryPage() {
  const session = await auth();
  const userId = session?.user?.email ?? "";

  const sessions = await prisma.workoutSession.findMany({
    where: { userId },
    orderBy: { startedAt: "desc" },
    include: { exercises: { include: { sets: true } } },
  });

  const templateNames = await prisma.workoutTemplate.findMany({ where: { userId }, select: { id: true, name: true } });
  const templateNameMap = new Map(templateNames.map((t: { id: string; name: string }) => [t.id, t.name]));

  function sessionTitle(s: (typeof sessions)[number]) {
    if (s.templateId && templateNameMap.has(s.templateId)) return templateNameMap.get(s.templateId)!;
    if (s.exercises.length === 0) return "Empty session";
    const names = s.exercises.map((e) => e.exerciseName).slice(0, 2).join(", ");
    return s.exercises.length > 2 ? `${names} +${s.exercises.length - 2}` : names;
  }

  function sessionVolume(s: (typeof sessions)[number]) {
    return s.exercises.flatMap((e) => e.sets).reduce((sum, set) => sum + set.reps * set.weightKg, 0);
  }

  const grouped = new Map<string, typeof sessions>();
  for (const s of sessions) {
    const key = new Date(s.startedAt).toLocaleDateString("en-GB", { month: "long", year: "numeric" });
    if (!grouped.has(key)) grouped.set(key, []);
    grouped.get(key)!.push(s);
  }

  return (
    <main className="min-h-screen p-5 pb-10">
      <div className="mx-auto max-w-3xl space-y-6">
        <div className="pt-4">
          <Link href="/" className="text-xs text-[var(--text-30)] hover:text-[var(--text-60)] uppercase tracking-wider">← Home</Link>
        </div>

        <header>
          <h1 className="text-3xl font-black uppercase tracking-tight">History</h1>
          <p className="mt-1 text-xs text-[var(--text-40)] uppercase tracking-wider">
            {sessions.length} session{sessions.length !== 1 ? "s" : ""} logged
          </p>
        </header>

        {sessions.length === 0 ? (
          <div className="rounded-xl border border-[var(--border)] p-10 text-center space-y-3">
            <p className="text-[var(--text-40)]">No sessions logged yet.</p>
            <Link href="/templates" className="text-sm text-orange-500 hover:text-orange-400">
              Start a workout →
            </Link>
          </div>
        ) : (
          <div className="space-y-8">
            {[...grouped.entries()].map(([month, monthSessions]) => (
              <section key={month} className="space-y-2">
                <h2 className="text-xs font-bold uppercase tracking-widest text-orange-500/70 pb-1 border-b border-[var(--border)]">
                  {month}
                </h2>
                <div className="space-y-2">
                  {monthSessions.map((s) => {
                    const sets = s.exercises.flatMap((e) => e.sets);
                    const vol = sessionVolume(s);
                    const duration = s.finishedAt
                      ? Math.round((new Date(s.finishedAt).getTime() - new Date(s.startedAt).getTime()) / 60000)
                      : null;

                    return (
                      <div key={s.id} className="group flex items-center gap-1 rounded-xl border border-[var(--border)] bg-[var(--card)] hover:border-orange-500/30 transition-all">
                        <div className="w-1 self-stretch rounded-l-xl bg-orange-500/30 group-hover:bg-orange-500/60 transition-colors shrink-0" />
                        <Link href={`/sessions/${s.id}`} className="flex flex-1 items-center justify-between p-3 min-w-0">
                          <div className="min-w-0">
                            <div className="font-medium text-sm truncate">{sessionTitle(s)}</div>
                            <div className="mt-0.5 text-xs text-[var(--text-40)]">
                              {new Date(s.startedAt).toLocaleDateString("en-GB", {
                                weekday: "short", day: "numeric", month: "short",
                              })}
                              {duration != null ? ` · ${duration} min` : ""}
                            </div>
                          </div>
                          <div className="ml-4 shrink-0 text-right">
                            <div className="text-sm font-semibold text-[var(--text-70)]">{sets.length} sets</div>
                            <div className="text-xs text-[var(--text-35)]">
                              {vol >= 1000 ? `${(vol / 1000).toFixed(1)}k` : vol.toFixed(0)} kg
                            </div>
                          </div>
                        </Link>
                        <div className="pr-3 shrink-0">
                          <DeleteSessionButton id={s.id} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </section>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
