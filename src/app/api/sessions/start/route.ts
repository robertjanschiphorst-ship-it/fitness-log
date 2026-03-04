import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const templateId = body?.templateId as string | undefined;

    if (!templateId) {
      return NextResponse.json({ error: "templateId required" }, { status: 400 });
    }

const template = await prisma.workoutTemplate.findUnique({
  where: { id: templateId },
  include: {
    exercises: {
      orderBy: { sortOrder: "asc" },
      include: { exercise: true },
    },
  },
});

    if (!template) {
      return NextResponse.json({ error: "template not found" }, { status: 404 });
    }

    const session = await prisma.workoutSession.create({
      data: {
        templateId: template.id,
        startedAt: new Date(),
      },
    });

for (const te of template.exercises) {
  await prisma.sessionExercise.create({
    data: {
      sessionId: session.id,
      exerciseId: te.exerciseId,
      exerciseName: te.exercise.name,
      sortOrder: te.sortOrder,
      targetSets: te.targetSets,
      repRangeMin: te.repRangeMin,
      repRangeMax: te.repRangeMax,
    },
  });
}

    return NextResponse.json({ sessionId: session.id });
} catch (e: any) {
  console.error(e);
  return NextResponse.json(
    {
      error: e?.message ?? "Unknown error",
      code: e?.code,
      meta: e?.meta,
    },
    { status: 500 }
  );
}
}