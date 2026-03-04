import Link from "next/link";
import { prisma } from "@/lib/prisma";

export default async function Home() {
  const recentSessions = await prisma.workoutSession.findMany({
    orderBy: { startedAt: "desc" },
    take: 5,
    include: { exercises: { include: { sets: true } } },
  });

  const templates = await prisma.workoutTemplate.findMany({
    orderBy: { name: "asc" },
    take: 6,
    include: { exercises: true },
  });

  const totalSessions = await prisma.workoutSession.count();
  const totalSets = await prisma.set.count();
  const allSets = await prisma.set.findMany({ select: { reps: true, weightKg: true } });
  const totalVolume = allSets.reduce((sum, s) => sum + s.reps * s.weightKg, 0);

  // Heatmap: last 365 days of sessions
  const oneYearAgo = new Date();
  oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
  const sessionDates = (await prisma.workoutSession.findMany({
    where: { startedAt: { gte: oneYearAgo } },
    select: { startedAt: true },
  })).map((s) => s.startedAt.toISOString().split("T")[0]);

  const templateNames = await prisma.workoutTemplate.findMany({ select: { id: true, name: true } });
  const templateNameMap = new Map(templateNames.map((t) => [t.id, t.name]));

  function sessionTitle(s: (typeof recentSessions)[number]) {
    if (s.templateId && templateNameMap.has(s.templateId)) return templateNameMap.get(s.templateId)!;
    if (s.exercises.length === 0) return "Empty session";
    const names = s.exercises.map((e) => e.exerciseName).slice(0, 2).join(", ");
    return s.exercises.length > 2 ? `${names} +${s.exercises.length - 2}` : names;
  }

  function sessionVolume(s: (typeof recentSessions)[number]) {
    return s.exercises.flatMap((e) => e.sets).reduce((sum, set) => sum + set.reps * set.weightKg, 0);
  }

  function sessionSetCount(s: (typeof recentSessions)[number]) {
    return s.exercises.flatMap((e) => e.sets).length;
  }

  const fmtVolume = (v: number) =>
    v >= 1000 ? `${(v / 1000).toFixed(1)}k` : v.toFixed(0);

  return (
    <main className="min-h-screen p-5 pb-10">
      <div className="mx-auto max-w-3xl space-y-8">

        {/* Header */}
        <header className="pt-4">
          <div className="flex items-end gap-3">
            <h1 className="text-4xl font-black tracking-tighter uppercase text-white">
              Fitness<span className="text-orange-500">.</span>
            </h1>
          </div>
          <p className="mt-1 text-sm text-white/40 tracking-wide uppercase text-xs">Track your lifts. See your progress.</p>
        </header>

        {/* Heatmap */}
        <section className="space-y-3">
          <h2 className="text-xs font-bold uppercase tracking-widest text-white/40">Consistency</h2>
          <WorkoutHeatmap sessionDates={sessionDates} />
        </section>

        {/* Stats */}
        <section className="grid grid-cols-3 gap-3">
          {[
            { label: "Workouts", value: totalSessions.toString() },
            { label: "Sets logged", value: totalSets.toLocaleString() },
            { label: "Total volume", value: `${fmtVolume(totalVolume)} kg` },
          ].map(({ label, value }) => (
            <div key={label} className="rounded-xl border border-white/[0.07] bg-white/[0.03] p-4">
              <div className="text-2xl font-black text-orange-500 tracking-tight">{value}</div>
              <div className="mt-1 text-xs text-white/40 uppercase tracking-wider">{label}</div>
            </div>
          ))}
        </section>

        {/* Quick start */}
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-bold uppercase tracking-widest text-white/40">Quick Start</h2>
            <Link href="/templates" className="text-xs text-orange-500/70 hover:text-orange-400 uppercase tracking-wider">
              All templates →
            </Link>
          </div>
          {templates.length === 0 ? (
            <div className="rounded-xl border border-white/[0.07] p-6 text-center">
              <p className="text-white/40 text-sm">No templates yet.</p>
              <Link href="/templates/new" className="mt-2 inline-block text-sm text-orange-500 hover:text-orange-400">
                Create your first template →
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              {templates.map((t) => (
                <Link key={t.id} href={`/templates/${t.id}`}
                  className="group rounded-xl border border-white/[0.07] bg-white/[0.03] p-3 hover:border-orange-500/40 hover:bg-orange-500/5 transition-all">
                  <div className="font-semibold text-sm truncate group-hover:text-orange-400 transition-colors">{t.name}</div>
                  <div className="mt-1 text-xs text-white/35">
                    {t.exercises.length} exercise{t.exercises.length !== 1 ? "s" : ""}
                  </div>
                </Link>
              ))}
            </div>
          )}
        </section>

        {/* Recent sessions */}
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-bold uppercase tracking-widest text-white/40">Recent Sessions</h2>
            <Link href="/history" className="text-xs text-orange-500/70 hover:text-orange-400 uppercase tracking-wider">
              Full history →
            </Link>
          </div>
          {recentSessions.length === 0 ? (
            <div className="rounded-xl border border-white/[0.07] p-6 text-center">
              <p className="text-white/40 text-sm">No sessions yet — start a workout to begin tracking.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {recentSessions.map((s) => (
                <Link key={s.id} href={`/sessions/${s.id}`}
                  className="flex items-center justify-between rounded-xl border border-white/[0.07] bg-white/[0.03] p-3 hover:border-orange-500/30 hover:bg-orange-500/5 transition-all group">
                  <div className="min-w-0">
                    <div className="font-medium text-sm truncate group-hover:text-white transition-colors">{sessionTitle(s)}</div>
                    <div className="mt-0.5 text-xs text-white/35">
                      {new Date(s.startedAt).toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short" })}
                    </div>
                  </div>
                  <div className="ml-4 shrink-0 text-right">
                    <div className="text-sm font-semibold text-white/70">{sessionSetCount(s)} sets</div>
                    <div className="text-xs text-white/35">{fmtVolume(sessionVolume(s))} kg</div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </section>

        {/* Bottom nav */}
        <nav className="grid grid-cols-4 gap-2 border-t border-white/[0.07] pt-6">
          {[
            { href: "/templates", label: "Templates", icon: "◈" },
            { href: "/programs", label: "Programs", icon: "◉" },
            { href: "/history", label: "History", icon: "◷" },
            { href: "/progress", label: "Progress", icon: "◈" },
          ].map(({ href, label, icon }) => (
            <Link key={href} href={href}
              className="flex flex-col items-center gap-1 rounded-xl border border-white/[0.07] p-3 hover:border-orange-500/40 hover:bg-orange-500/5 transition-all group">
              <span className="text-lg text-white/25 group-hover:text-orange-500 transition-colors">{icon}</span>
              <span className="text-xs text-white/40 group-hover:text-white/70 uppercase tracking-wider">{label}</span>
            </Link>
          ))}
        </nav>

      </div>
    </main>
  );
}

function WorkoutHeatmap({ sessionDates }: { sessionDates: string[] }) {
  const dateSet = new Set(sessionDates);

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayStr = today.toISOString().split("T")[0];

  // Build a grid starting from a Monday ~52 weeks back
  const startDate = new Date(today);
  startDate.setDate(startDate.getDate() - 52 * 7);
  const dow = startDate.getDay();
  startDate.setDate(startDate.getDate() - (dow === 0 ? 6 : dow - 1));

  const weeks: string[][] = [];
  const cur = new Date(startDate);
  while (cur <= today) {
    const week: string[] = [];
    for (let d = 0; d < 7; d++) {
      week.push(cur.toISOString().split("T")[0]);
      cur.setDate(cur.getDate() + 1);
    }
    weeks.push(week);
  }

  // Month labels: show label at the first week of each month
  const monthLabels: { label: string; col: number }[] = [];
  weeks.forEach((week, wi) => {
    const d = new Date(week[0]);
    if (d.getDate() <= 7) {
      monthLabels.push({
        label: d.toLocaleDateString("en-GB", { month: "short" }),
        col: wi,
      });
    }
  });

  const totalWorkouts = sessionDates.length;
  const currentStreak = (() => {
    let streak = 0;
    const check = new Date(today);
    while (true) {
      const s = check.toISOString().split("T")[0];
      if (!dateSet.has(s)) break;
      streak++;
      check.setDate(check.getDate() - 1);
    }
    return streak;
  })();

  return (
    <div className="rounded-xl border border-white/[0.07] bg-white/[0.03] p-4 space-y-3">
      <div className="flex items-center justify-between text-xs text-white/35">
        <span>{totalWorkouts} workout{totalWorkouts !== 1 ? "s" : ""} in the last year</span>
        {currentStreak > 0 && (
          <span className="text-orange-400 font-bold">{currentStreak} day streak 🔥</span>
        )}
      </div>

      {/* Grid */}
      <div className="overflow-x-auto">
        <div className="relative" style={{ minWidth: `${weeks.length * 12}px` }}>
          {/* Month labels */}
          <div className="relative h-4 mb-1">
            {monthLabels.map(({ label, col }) => (
              <span key={`${label}-${col}`}
                className="absolute text-[9px] text-white/25 uppercase tracking-wider"
                style={{ left: `${col * 12}px` }}>
                {label}
              </span>
            ))}
          </div>

          {/* Cells */}
          <div className="flex gap-[2px]">
            {weeks.map((week, wi) => (
              <div key={wi} className="flex flex-col gap-[2px]">
                {week.map((dateStr) => {
                  const isFuture = dateStr > todayStr;
                  const isToday = dateStr === todayStr;
                  const hasWorkout = dateSet.has(dateStr);
                  return (
                    <div key={dateStr}
                      title={dateStr}
                      className={`w-[10px] h-[10px] rounded-[2px] transition-colors ${
                        isFuture ? "opacity-0" :
                        isToday && hasWorkout ? "bg-orange-400 ring-1 ring-orange-300/50" :
                        isToday ? "bg-white/10 ring-1 ring-white/20" :
                        hasWorkout ? "bg-orange-500" :
                        "bg-white/[0.06]"
                      }`}
                    />
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
