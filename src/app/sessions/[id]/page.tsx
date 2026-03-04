import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { LogSet } from "./LogSet";
import { FinishWorkoutButton } from "./FinishWorkoutButton";

type PrevSet = { setNumber: number; reps: number; weightKg: number; rpe: number | null };

function volumeComparison(kg: number): { emoji: string; text: string } {
  if (kg < 50)     return { emoji: "🐱", text: "like lifting a cat" };
  if (kg < 200)    return { emoji: "🐕", text: `like lifting ${Math.round(kg / 30)} dogs` };
  if (kg < 600)    return { emoji: "🧍", text: `like lifting ${Math.round(kg / 75)} people` };
  if (kg < 2000)   return { emoji: "🐎", text: `like lifting ${(kg / 450).toFixed(1)} horses` };
  if (kg < 6000)   return { emoji: "🚗", text: `like lifting ${(kg / 1500).toFixed(1)} cars` };
  if (kg < 25000)  return { emoji: "🐘", text: `like lifting ${(kg / 5000).toFixed(1)} elephants` };
  if (kg < 80000)  return { emoji: "🚌", text: `like lifting ${(kg / 12000).toFixed(1)} double-decker buses` };
  return             { emoji: "🐋", text: `like lifting ${(kg / 150000).toFixed(2)} blue whales` };
}

export default async function SessionPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const session = await prisma.workoutSession.findUnique({
    where: { id },
    include: {
      exercises: {
        orderBy: { sortOrder: "asc" },
        include: {
          exercise: true,
          sets: { orderBy: { setNumber: "asc" } },
        },
      },
    },
  });

  if (!session) return notFound();

  const template = session.templateId
    ? await prisma.workoutTemplate.findUnique({
        where: { id: session.templateId },
        select: { id: true, name: true },
      })
    : null;

  // Previous session per exercise
  const prevByExerciseId = new Map<string, { startedAt: Date; sets: PrevSet[] }>();

  // All-time PR per exercise (max weight, excluding current session)
  const allTimePrByExerciseId = new Map<string, number>();

  await Promise.all(
    session.exercises.map(async (se) => {
      // Previous session data
      const prevSession = await prisma.workoutSession.findFirst({
        where: {
          id: { not: session.id },
          exercises: { some: { exerciseId: se.exerciseId } },
        },
        orderBy: { startedAt: "desc" },
        include: {
          exercises: {
            where: { exerciseId: se.exerciseId },
            include: { sets: { orderBy: { setNumber: "asc" } } },
          },
        },
      });

      if (prevSession) {
        const prevSE = prevSession.exercises[0];
        if (prevSE) {
          prevByExerciseId.set(se.exerciseId, {
            startedAt: prevSession.startedAt,
            sets: prevSE.sets.map((s) => ({
              setNumber: s.setNumber,
              reps: s.reps,
              weightKg: s.weightKg,
              rpe: s.rpe,
            })),
          });
        }
      }

      // All-time max weight for this exercise (outside current session)
      const prResult = await prisma.set.aggregate({
        where: {
          sessionExercise: {
            is: {
              exerciseId: se.exerciseId,
              session: { is: { id: { not: session.id } } },
            },
          },
        },
        _max: { weightKg: true },
      });

      if (prResult._max.weightKg != null) {
        allTimePrByExerciseId.set(se.exerciseId, prResult._max.weightKg);
      }
    })
  );

  const totalSets = session.exercises.flatMap((e) => e.sets).length;
  const totalVolume = session.exercises
    .flatMap((e) => e.sets)
    .reduce((sum, s) => sum + s.reps * s.weightKg, 0);

  return (
    <main className="min-h-screen p-5 pb-10">
      <div className="mx-auto max-w-3xl space-y-6">

        {/* Breadcrumb */}
        <div className="flex items-center gap-2 pt-4 text-xs text-white/30 uppercase tracking-wider overflow-hidden">
          <Link href="/" className="hover:text-white/60 shrink-0">Home</Link>
          <span className="shrink-0">/</span>
          <Link href="/history" className="hover:text-white/60 shrink-0">History</Link>
          {template && (
            <>
              <span className="shrink-0">/</span>
              <Link href={`/templates/${template.id}`} className="hover:text-white/60 truncate min-w-0">{template.name}</Link>
            </>
          )}
        </div>

        {/* Header */}
        <header className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0">
            <h1 className="text-2xl sm:text-3xl font-black uppercase tracking-tight leading-tight">
              {template?.name ?? "Workout"}
            </h1>
            <p className="mt-1 text-xs text-white/40 uppercase tracking-wider">
              {new Date(session.startedAt).toLocaleDateString("en-GB", {
                weekday: "long", day: "numeric", month: "long", year: "numeric",
              })}
            </p>
          </div>
          <div className="shrink-0">
            <FinishWorkoutButton
              sessionId={session.id}
              alreadyFinished={!!session.finishedAt}
              totalVolume={totalVolume}
              totalSets={totalSets}
              startedAt={session.startedAt.toISOString()}
            />
          </div>
        </header>

        {/* Session stats strip */}
        {totalSets > 0 && (
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-xl border border-white/[0.07] bg-white/[0.03] p-3">
              <div className="text-xl font-black text-orange-500">{totalSets}</div>
              <div className="text-xs text-white/40 uppercase tracking-wider mt-0.5">Sets logged</div>
            </div>
            <div className="rounded-xl border border-white/[0.07] bg-white/[0.03] p-3">
              <div className="text-xl font-black text-orange-500">
                {totalVolume >= 1000 ? `${(totalVolume / 1000).toFixed(1)}k` : totalVolume.toFixed(0)} kg
              </div>
              <div className="text-xs text-white/40 uppercase tracking-wider mt-0.5">Total volume</div>
            </div>
          </div>
        )}

        {/* Workout complete celebration */}
        {session.finishedAt && totalSets > 0 && (() => {
          const { emoji, text } = volumeComparison(totalVolume);
          const durationMin = Math.round(
            (new Date(session.finishedAt).getTime() - new Date(session.startedAt).getTime()) / 60000
          );
          return (
            <div className="rounded-2xl border border-orange-500/30 bg-orange-500/[0.07] p-5 space-y-3">
              <div className="flex items-center gap-3">
                <span className="text-3xl">🏋️</span>
                <div>
                  <div className="text-base font-black uppercase tracking-wide text-orange-400">
                    Workout complete
                  </div>
                  <div className="text-xs text-white/40 mt-0.5">
                    {durationMin} min · {totalSets} sets · {totalVolume >= 1000 ? `${(totalVolume / 1000).toFixed(1)}k` : totalVolume.toFixed(0)} kg moved
                  </div>
                </div>
              </div>
              <div className="rounded-xl bg-black/20 px-4 py-3 flex items-center gap-3">
                <span className="text-2xl">{emoji}</span>
                <div>
                  <div className="text-sm font-bold text-white/80">
                    That&apos;s {text}
                  </div>
                  <div className="text-xs text-white/35 mt-0.5">total volume moved this session</div>
                </div>
              </div>
            </div>
          );
        })()}

        {/* Exercises */}
        {session.exercises.length === 0 ? (
          <div className="rounded-xl border border-white/[0.07] p-8 text-center text-white/40">
            No exercises in this session.
          </div>
        ) : (
          <div className="space-y-4">
            {session.exercises.map((se) => {
              const prev = prevByExerciseId.get(se.exerciseId);
              const allTimePr = allTimePrByExerciseId.get(se.exerciseId);
              const currentMax = se.sets.length > 0 ? Math.max(...se.sets.map((s) => s.weightKg)) : null;
              const isNewPR = currentMax != null && (allTimePr == null || currentMax > allTimePr);

              return (
                <div key={se.id} className="rounded-xl border border-white/[0.07] bg-white/[0.03] overflow-hidden">
                  {/* Exercise header */}
                  <div className="flex items-center justify-between px-4 pt-4 pb-3 border-b border-white/[0.07]">
                    <div className="flex items-center gap-2">
                      <div className="w-1 h-5 rounded-full bg-orange-500 shrink-0" />
                      <div>
                        <div className="font-bold">{se.exerciseName ?? se.exercise?.name ?? "Exercise"}</div>
                        <div className="text-xs text-white/40">
                          Target: {se.targetSets} × {se.repRangeMin}–{se.repRangeMax} reps
                          {allTimePr != null && (
                            <span className="ml-2 text-white/25">· PR: {allTimePr} kg</span>
                          )}
                        </div>
                      </div>
                    </div>
                    {isNewPR && se.sets.length > 0 && (
                      <span className="text-xs font-black text-yellow-400 uppercase tracking-wide">🏆 PR</span>
                    )}
                  </div>

                  <div className="p-4 space-y-3">
                    {/* Logged sets */}
                    {se.sets.length > 0 && (
                      <div className="space-y-1">
                        {se.sets.map((s) => (
                          <div key={s.id} className="flex items-center gap-4 text-sm">
                            <span className="text-xs text-white/30 w-10">Set {s.setNumber}</span>
                            <span className="font-semibold w-16">{s.weightKg} kg</span>
                            <span className="text-white/60">{s.reps} reps</span>
                            {s.rpe != null && <span className="text-white/35 text-xs">RPE {s.rpe}</span>}
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Previous session reference */}
                    {prev && (
                      <div className="rounded-lg bg-white/[0.04] px-3 py-2 text-xs">
                        <div className="text-white/35 uppercase tracking-wide mb-1">
                          Last time · {new Date(prev.startedAt).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}
                        </div>
                        <div className="flex flex-wrap gap-3">
                          {prev.sets.map((s) => (
                            <span key={s.setNumber} className="text-white/50">
                              {s.weightKg} kg × {s.reps}
                              {s.rpe != null ? ` @${s.rpe}` : ""}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Log set form */}
                    <LogSet
                      sessionExerciseId={se.id}
                      repRangeMax={se.repRangeMax}
                      targetSets={se.targetSets}
                      priorSets={se.sets.map((s) => ({ reps: s.reps, rpe: s.rpe, weightKg: s.weightKg }))}
                      defaultReps={se.repRangeMin}
                      defaultWeightKg={
                        prevByExerciseId.get(se.exerciseId)?.sets?.length
                          ? Math.max(...prevByExerciseId.get(se.exerciseId)!.sets.map((s) => s.weightKg))
                          : 20
                      }
                      allTimePrKg={allTimePr}
                    />
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
