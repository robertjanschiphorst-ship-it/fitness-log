import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { ThemeToggle } from "@/components/ThemeToggle";
import { WeekView } from "@/components/WeekView";
import { auth, signOut } from "@/auth";

export const dynamic = 'force-dynamic';

export default async function Home() {
  const session = await auth();
  const userId = session?.user?.email ?? "";

  const recentSessions = await prisma.workoutSession.findMany({
    where: { userId },
    orderBy: { startedAt: "desc" },
    take: 5,
    include: { exercises: { include: { sets: true } } },
  });

  const templates = await prisma.workoutTemplate.findMany({
    where: { userId },
    orderBy: { name: "asc" },
    take: 6,
    include: { exercises: true },
  });

  const totalSessions = await prisma.workoutSession.count({ where: { userId } });
  const totalSets = await prisma.set.count({
    where: { sessionExercise: { session: { userId } } },
  });
  const allSets = await prisma.set.findMany({
    where: { sessionExercise: { session: { userId } } },
    select: { reps: true, weightKg: true },
  });
  const totalVolume = allSets.reduce((sum, s) => sum + s.reps * s.weightKg, 0);

  // WeekView: last 365 days of sessions, with IDs for clickable days
  const oneYearAgo = new Date();
  oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
  const weekViewSessions = (await prisma.workoutSession.findMany({
    where: { startedAt: { gte: oneYearAgo } },
    select: { id: true, startedAt: true },
  })).map((s) => ({ id: s.id, isoDate: s.startedAt.toISOString() }));

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
        <header className="pt-4 flex items-start justify-between">
          <div>
            <h1 className="text-4xl font-black tracking-tighter uppercase text-[var(--text)]">
              Fitness<span className="text-orange-500">.</span>
            </h1>
            <p className="mt-1 text-[var(--text-40)] tracking-wide uppercase text-xs">Track your lifts. See your progress.</p>
          </div>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <form action={async () => { "use server"; await signOut({ redirectTo: "/sign-in" }); }}>
              <button type="submit" title="Sign out" className="w-8 h-8 flex items-center justify-center rounded-lg text-[var(--text-25)] hover:text-[var(--text-50)] hover:bg-[var(--input-bg)] transition-all text-xs">
                ⏻
              </button>
            </form>
          </div>
        </header>

        {/* Consistency is key */}
        <section className="space-y-3">
          <h2 className="text-xs font-bold uppercase tracking-widest text-[var(--text-40)]">Consistency is key</h2>
          <WeekView sessions={weekViewSessions} />
        </section>

        {/* Stats — compact single row */}
        <div className="flex items-center gap-3 text-xs text-[var(--text-35)] px-0.5">
          <span><span className="font-bold text-[var(--text-60)]">{totalSessions}</span> workouts</span>
          <span className="text-[var(--border)]">·</span>
          <span><span className="font-bold text-[var(--text-60)]">{totalSets.toLocaleString()}</span> sets</span>
          <span className="text-[var(--border)]">·</span>
          <span><span className="font-bold text-[var(--text-60)]">{fmtVolume(totalVolume)} kg</span> volume</span>
        </div>

        {/* Quick start */}
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-bold uppercase tracking-widest text-[var(--text-40)]">Quick Start</h2>
            <Link href="/templates" className="text-xs text-orange-500/70 hover:text-orange-400 uppercase tracking-wider">
              All templates →
            </Link>
          </div>
          {templates.length === 0 ? (
            <div className="rounded-xl border border-[var(--border)] p-6 text-center">
              <p className="text-[var(--text-40)] text-sm">No templates yet.</p>
              <Link href="/templates/new" className="mt-2 inline-block text-sm text-orange-500 hover:text-orange-400">
                Create your first template →
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              {templates.map((t) => (
                <Link key={t.id} href={`/templates/${t.id}`}
                  className="group rounded-xl border border-[var(--border)] bg-[var(--card)] p-3 hover:border-orange-500/40 hover:bg-orange-500/5 transition-all">
                  <div className="font-semibold text-sm truncate group-hover:text-orange-400 transition-colors">{t.name}</div>
                  <div className="mt-1 text-xs text-[var(--text-35)]">
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
            <h2 className="text-xs font-bold uppercase tracking-widest text-[var(--text-40)]">Recent Sessions</h2>
            <Link href="/history" className="text-xs text-orange-500/70 hover:text-orange-400 uppercase tracking-wider">
              Full history →
            </Link>
          </div>
          {recentSessions.length === 0 ? (
            <div className="rounded-xl border border-[var(--border)] p-6 text-center">
              <p className="text-[var(--text-40)] text-sm">No sessions yet — start a workout to begin tracking.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {recentSessions.map((s) => (
                <Link key={s.id} href={`/sessions/${s.id}`}
                  className="flex items-center justify-between rounded-xl border border-[var(--border)] bg-[var(--card)] p-3 hover:border-orange-500/30 hover:bg-orange-500/5 transition-all group">
                  <div className="min-w-0">
                    <div className="font-medium text-sm truncate group-hover:text-[var(--text)] transition-colors">{sessionTitle(s)}</div>
                    <div className="mt-0.5 text-xs text-[var(--text-35)]">
                      {new Date(s.startedAt).toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short" })}
                    </div>
                  </div>
                  <div className="ml-4 shrink-0 text-right">
                    <div className="text-sm font-semibold text-[var(--text-70)]">{sessionSetCount(s)} sets</div>
                    <div className="text-xs text-[var(--text-35)]">{fmtVolume(sessionVolume(s))} kg</div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </section>

        {/* Bottom nav */}
        <nav className="grid grid-cols-4 gap-2 border-t border-[var(--border)] pt-6">
          {[
            { href: "/templates", label: "Templates", icon: "◈" },
            { href: "/programs", label: "Programs", icon: "◉" },
            { href: "/history", label: "History", icon: "◷" },
            { href: "/progress", label: "Progress", icon: "◈" },
          ].map(({ href, label, icon }) => (
            <Link key={href} href={href}
              className="flex flex-col items-center gap-1 rounded-xl border border-[var(--border)] p-3 hover:border-orange-500/40 hover:bg-orange-500/5 transition-all group">
              <span className="text-lg text-[var(--text-25)] group-hover:text-orange-500 transition-colors">{icon}</span>
              <span className="text-xs text-[var(--text-40)] group-hover:text-[var(--text-70)] uppercase tracking-wider">{label}</span>
            </Link>
          ))}
        </nav>

      </div>
    </main>
  );
}
