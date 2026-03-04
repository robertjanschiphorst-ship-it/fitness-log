import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import UseProgramButton from "../use-program-button";

export const dynamic = 'force-dynamic';

const LEVEL_LABEL: Record<string, string> = {
  BEGINNER: "Beginner",
  INTERMEDIATE: "Intermediate",
  ADVANCED: "Advanced",
};

const GOAL_LABEL: Record<string, string> = {
  STRENGTH: "Strength",
  HYPERTROPHY: "Hypertrophy",
  GENERAL: "General Fitness",
};

const GOAL_COLOR: Record<string, string> = {
  STRENGTH: "text-red-400 bg-red-500/10 border-red-500/20",
  HYPERTROPHY: "text-orange-400 bg-orange-500/10 border-orange-500/20",
  GENERAL: "text-blue-400 bg-blue-500/10 border-blue-500/20",
};

export default async function ProgramDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const program = await prisma.program.findUnique({
    where: { id },
    include: {
      workouts: {
        orderBy: { dayNumber: "asc" },
        include: {
          exercises: {
            orderBy: { sortOrder: "asc" },
            include: { exercise: true },
          },
        },
      },
    },
  });

  if (!program) return notFound();

  return (
    <main className="min-h-screen p-5 pb-10">
      <div className="mx-auto max-w-3xl space-y-6">

        <div className="pt-4">
          <Link href="/programs" className="text-xs text-white/30 hover:text-white/60 uppercase tracking-wider">← Programs</Link>
        </div>

        {/* Header */}
        <header className="flex items-start justify-between gap-4">
          <div className="space-y-2">
            <h1 className="text-3xl font-black uppercase tracking-tight">{program.name}</h1>
            <div className="flex flex-wrap gap-2">
              <span className={`text-xs px-2 py-0.5 rounded-full border font-medium ${GOAL_COLOR[program.goal] ?? "text-white/50 bg-white/5 border-white/10"}`}>
                {GOAL_LABEL[program.goal] ?? program.goal}
              </span>
              <span className="text-xs px-2 py-0.5 rounded-full border border-white/10 text-white/40">
                {LEVEL_LABEL[program.level] ?? program.level}
              </span>
              <span className="text-xs px-2 py-0.5 rounded-full border border-white/10 text-white/40">
                {program.daysPerWeek} days / week
              </span>
            </div>
          </div>
          <UseProgramButton programId={program.id} />
        </header>

        {/* Summary */}
        {(program.summary || program.details) && (
          <div className="rounded-xl border border-white/[0.07] bg-white/[0.03] p-4 space-y-2">
            {program.summary && <p className="text-white/70 leading-relaxed">{program.summary}</p>}
            {program.details && <p className="text-sm text-white/45 leading-relaxed">{program.details}</p>}
          </div>
        )}

        {/* Workouts */}
        <section className="space-y-3">
          <h2 className="text-xs font-bold uppercase tracking-widest text-white/40">Program Overview</h2>

          {program.workouts.length === 0 ? (
            <div className="rounded-xl border border-white/[0.07] p-8 text-center text-white/40">
              No workouts defined for this program.
            </div>
          ) : (
            program.workouts.map((workout) => (
              <div key={workout.id} className="rounded-xl border border-white/[0.07] bg-white/[0.03] overflow-hidden">
                <div className="flex items-center justify-between px-4 pt-3 pb-2 border-b border-white/[0.07]">
                  <div className="flex items-center gap-2">
                    <div className="w-1 h-4 rounded-full bg-orange-500 shrink-0" />
                    <h3 className="font-bold text-sm">
                      Day {workout.dayNumber} — {workout.title}
                    </h3>
                  </div>
                  <span className="text-xs text-white/35 uppercase tracking-wide">
                    {workout.exercises.length} exercise{workout.exercises.length !== 1 ? "s" : ""}
                  </span>
                </div>

                {workout.exercises.length === 0 ? (
                  <p className="p-4 text-sm text-white/35">No exercises listed.</p>
                ) : (
                  <ol className="p-4 space-y-2">
                    {workout.exercises.map((pwe, i) => (
                      <li key={pwe.id} className="flex items-start gap-3 text-sm">
                        <span className="mt-0.5 w-5 shrink-0 text-right text-xs text-orange-500/50 font-bold">{i + 1}</span>
                        <div className="flex-1">
                          <span className="font-semibold">{pwe.exercise.name}</span>
                          <span className="ml-2 text-white/40 text-xs">
                            {pwe.targetSets} × {pwe.repRangeMin}–{pwe.repRangeMax}
                            {pwe.rpeTarget != null ? ` · RPE ${pwe.rpeTarget}` : ""}
                          </span>
                        </div>
                        <span className="shrink-0 text-xs text-white/25 capitalize">
                          {pwe.exercise.equipment.toLowerCase().replace("_", " ")}
                        </span>
                      </li>
                    ))}
                  </ol>
                )}
              </div>
            ))
          )}
        </section>

        {program.workouts.length > 0 && (
          <div className="flex justify-center pt-2">
            <UseProgramButton programId={program.id} />
          </div>
        )}
      </div>
    </main>
  );
}
