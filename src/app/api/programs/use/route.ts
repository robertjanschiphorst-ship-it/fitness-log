import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const programId = body?.programId as string | undefined;

    if (!programId) {
      return NextResponse.json({ error: "programId required" }, { status: 400 });
    }

    const program = await prisma.program.findUnique({
      where: { id: programId },
      include: {
        workouts: {
          orderBy: { dayNumber: "asc" },
          include: {
            exercises: { orderBy: { sortOrder: "asc" } },
          },
        },
      },
    });

    if (!program) {
      return NextResponse.json({ error: "Program not found" }, { status: 404 });
    }

    // Determine copy number to avoid overwriting existing templates
    const existing = await prisma.workoutTemplate.count({
      where: { name: { startsWith: `${program.name} — Day ` } },
    });

    const copySuffix = existing > 0 ? ` (Copy ${Math.floor(existing / program.daysPerWeek) + 1})` : "";

    const createdTemplateIds: string[] = [];

    for (const w of program.workouts) {
      const template = await prisma.workoutTemplate.create({
        data: {
          name: `${program.name} — Day ${w.dayNumber}: ${w.title}${copySuffix}`,
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

      createdTemplateIds.push(template.id);
    }

    return NextResponse.json({ ok: true, templateIds: createdTemplateIds });
  } catch (e: any) {
    console.error(e);
    return NextResponse.json({ error: e?.message ?? "Server error" }, { status: 500 });
  }
}