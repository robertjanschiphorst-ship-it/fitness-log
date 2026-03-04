import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    const { programId } = await req.json();

    if (!programId) {
      return NextResponse.json({ error: "programId required" }, { status: 400 });
    }

    const program = await prisma.program.findUnique({
      where: { id: programId },
      include: {
        workouts: {
          orderBy: { dayNumber: "asc" },
          include: { exercises: { orderBy: { sortOrder: "asc" } } },
        },
      },
    });

    if (!program) return NextResponse.json({ error: "program not found" }, { status: 404 });

    // Create 1 WorkoutTemplate per ProgramWorkout
    const createdTemplates = [];
    for (const w of program.workouts) {
      const template = await prisma.workoutTemplate.create({
        data: {
          name: `${program.name} — Day ${w.dayNumber}: ${w.title}`,
          templateType: "OTHER",
        },
      });

      for (const ex of w.exercises) {
        await prisma.templateExercise.create({
          data: {
            templateId: template.id,
            exerciseId: ex.exerciseId,
            sortOrder: ex.sortOrder,
            targetSets: ex.targetSets,
            repRangeMin: ex.repRangeMin,
            repRangeMax: ex.repRangeMax,
          },
        });
      }

      createdTemplates.push(template);
    }

    return NextResponse.json({ ok: true, templateIds: createdTemplates.map((t) => t.id) });
  } catch (e: any) {
    console.error(e);
    return NextResponse.json({ error: e?.message ?? "Server error" }, { status: 500 });
  }
}