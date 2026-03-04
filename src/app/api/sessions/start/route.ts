import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const userId = session.user.email;

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

    const workoutSession = await prisma.workoutSession.create({
      data: {
        templateId: template.id,
        userId,
        startedAt: new Date(),
      },
    });

for (const te of template.exercises) {
  await prisma.sessionExercise.create({
    data: {
      sessionId: workoutSession.id,
      exerciseId: te.exerciseId,
      exerciseName: te.exercise.name,
      sortOrder: te.sortOrder,
      targetSets: te.targetSets,
      repRangeMin: te.repRangeMin,
      repRangeMax: te.repRangeMax,
    },
  });
}

    return NextResponse.json({ sessionId: workoutSession.id });
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