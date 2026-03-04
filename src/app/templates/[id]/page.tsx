import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { ExercisePicker } from "./ExercisePicker";
import { StartSessionButton } from "./StartSessionButton";

async function removeExercise(formData: FormData) {
  "use server";
  const templateExerciseId = String(formData.get("templateExerciseId") ?? "");
  const templateId = String(formData.get("templateId") ?? "");
  if (!templateExerciseId) return;
  await prisma.templateExercise.delete({ where: { id: templateExerciseId } });
  redirect(`/templates/${templateId}`);
}

async function addExercise(formData: FormData) {
  "use server";

  const templateId = String(formData.get("templateId") ?? "");
  const exerciseId = String(formData.get("exerciseId") ?? "");
  const targetSets = Number(formData.get("targetSets") ?? 3);
  const repRangeMin = Number(formData.get("repRangeMin") ?? 8);
  const repRangeMax = Number(formData.get("repRangeMax") ?? 12);

  if (!templateId || !exerciseId) return;

  const last = await prisma.templateExercise.findFirst({
    where: { templateId },
    orderBy: { sortOrder: "desc" },
    select: { sortOrder: true },
  });

  await prisma.templateExercise.create({
    data: {
      templateId,
      exerciseId,
      sortOrder: (last?.sortOrder ?? 0) + 1,
      targetSets,
      repRangeMin,
      repRangeMax,
    },
  });

  redirect(`/templates/${templateId}`);
}

export default async function TemplateDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const template = await prisma.workoutTemplate.findUnique({
    where: { id },
    include: {
      exercises: {
        orderBy: { sortOrder: "asc" },
        include: { exercise: true },
      },
    },
  });

  if (!template) return notFound();

  const existingExerciseIds = new Set(template.exercises.map((te) => te.exerciseId));

  const all = await prisma.exercise.findMany({
    where: { isGlobal: true },
    orderBy: { name: "asc" },
    select: { id: true, name: true, movementPattern: true, isLowerBody: true, isCompound: true },
  });

  const available = all.filter((e) => !existingExerciseIds.has(e.id));

  function score(e: (typeof available)[number]) {
    const t = template.templateType;
    if (t === "PUSH") {
      const push = e.movementPattern === "HORIZONTAL_PUSH" || e.movementPattern === "VERTICAL_PUSH";
      return (push ? 100 : 0) + (e.isCompound ? 20 : 0) + (!e.isLowerBody ? 10 : -50);
    }
    if (t === "PULL") {
      const pull = e.movementPattern === "HORIZONTAL_PULL" || e.movementPattern === "VERTICAL_PULL";
      return (pull ? 100 : 0) + (e.isCompound ? 20 : 0) + (!e.isLowerBody ? 10 : -50);
    }
    if (t === "LEGS") {
      const leg = e.isLowerBody || e.movementPattern === "SQUAT" || e.movementPattern === "HINGE";
      return (leg ? 100 : 0) + (e.isCompound ? 20 : 0);
    }
    if (t === "UPPER") {
      const upper = !e.isLowerBody;
      const big = ["HORIZONTAL_PUSH","VERTICAL_PUSH","HORIZONTAL_PULL","VERTICAL_PULL"].includes(e.movementPattern);
      return (upper ? 60 : -40) + (big ? 40 : 0) + (e.isCompound ? 10 : 0);
    }
    if (t === "LOWER") return (e.isLowerBody ? 100 : -60) + (e.isCompound ? 15 : 0);
    if (t === "FULLBODY") {
      const big = ["SQUAT","HINGE","HORIZONTAL_PUSH","VERTICAL_PUSH","HORIZONTAL_PULL","VERTICAL_PULL"].includes(e.movementPattern);
      return (big ? 60 : 0) + (e.isCompound ? 40 : 0);
    }
    return e.isCompound ? 10 : 0;
  }

  const suggestedExercises = [...available]
    .sort((a, b) => score(b) - score(a) || a.name.localeCompare(b.name))
    .slice(0, 50)
    .map((e) => ({ id: e.id, name: e.name }));

  const allExercises = available.map((e) => ({ id: e.id, name: e.name }));

  return (
    <main className="min-h-screen p-5 pb-10">
      <div className="mx-auto max-w-3xl space-y-6">

        <div className="pt-4">
          <Link href="/templates" className="text-xs text-white/30 hover:text-white/60 uppercase tracking-wider">← Templates</Link>
        </div>

        {/* Header */}
        <header className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0">
            <h1 className="text-2xl sm:text-3xl font-black uppercase tracking-tight leading-tight">{template.name}</h1>
            <p className="mt-1 text-xs text-white/40 uppercase tracking-wider">
              {template.templateType.charAt(0) + template.templateType.slice(1).toLowerCase()} · {template.exercises.length} exercise{template.exercises.length !== 1 ? "s" : ""}
            </p>
          </div>
          <div className="shrink-0">
            <StartSessionButton templateId={template.id} />
          </div>
        </header>

        {/* Exercise list */}
        <section className="rounded-xl border border-white/[0.07] bg-white/[0.03] overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-white/[0.07]">
            <h2 className="text-xs font-bold uppercase tracking-widest text-white/40">Exercises</h2>
            <span className="text-xs text-white/25">{template.exercises.length} total</span>
          </div>

          {template.exercises.length === 0 ? (
            <p className="p-6 text-center text-white/40 text-sm">No exercises yet — add some below.</p>
          ) : (
            <ol className="divide-y divide-white/[0.05]">
              {template.exercises.map((te, i) => (
                <li key={te.id} className="flex items-center gap-3 px-4 py-3 group">
                  <span className="text-xs font-black text-orange-500/40 w-5 shrink-0 text-right">{i + 1}</span>
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-sm truncate">{te.exercise.name}</div>
                    <div className="text-xs text-white/40 mt-0.5">
                      {te.targetSets} sets · {te.repRangeMin}–{te.repRangeMax} reps
                    </div>
                  </div>
                  <form action={removeExercise}>
                    <input type="hidden" name="templateExerciseId" value={te.id} />
                    <input type="hidden" name="templateId" value={template.id} />
                    <button type="submit"
                      className="text-white/25 hover:text-red-400 transition-colors text-sm sm:opacity-0 sm:group-hover:opacity-100 px-2 py-1">
                      ✕
                    </button>
                  </form>
                </li>
              ))}
            </ol>
          )}
        </section>

        {/* Add exercise */}
        <section className="rounded-xl border border-white/[0.07] bg-white/[0.03] overflow-hidden">
          <div className="px-4 py-3 border-b border-white/[0.07]">
            <h2 className="text-xs font-bold uppercase tracking-widest text-white/40">Add Exercise</h2>
          </div>

          <form action={addExercise} className="p-4 space-y-4">
            <input type="hidden" name="templateId" value={template.id} />

            <ExercisePicker
              allExercises={allExercises}
              suggestedExercises={suggestedExercises}
            />

            <div className="grid grid-cols-3 gap-3">
              {[
                { name: "targetSets", label: "Sets", defaultValue: 3 },
                { name: "repRangeMin", label: "Reps min", defaultValue: 8 },
                { name: "repRangeMax", label: "Reps max", defaultValue: 12 },
              ].map(({ name, label, defaultValue }) => (
                <div key={name} className="space-y-1">
                  <label className="text-xs text-white/40 uppercase tracking-wider">{label}</label>
                  <input
                    name={name}
                    type="number"
                    min={1}
                    defaultValue={defaultValue}
                    className="w-full rounded-lg bg-white/[0.06] px-3 py-2 text-sm font-semibold outline-none ring-1 ring-white/10 focus:ring-orange-500/50"
                  />
                </div>
              ))}
            </div>

            <button className="w-full rounded-xl bg-orange-500 px-4 py-3 text-sm font-black text-white uppercase tracking-wide hover:bg-orange-400 transition-colors">
              + Add to Template
            </button>
          </form>

          <p className="px-4 pb-4 text-xs text-white/25">
            Suggestions are based on template type and hide exercises already added.
          </p>
        </section>
      </div>
    </main>
  );
}
