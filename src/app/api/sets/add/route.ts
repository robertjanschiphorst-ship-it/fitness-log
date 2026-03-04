import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const sessionExerciseId = body?.sessionExerciseId as string;
    const reps = Number(body?.reps);
    const weightKg = Number(body?.weightKg);
    const rpe = body?.rpe != null ? Number(body.rpe) : null;

    if (!sessionExerciseId || !reps || isNaN(weightKg)) {
      return NextResponse.json({ error: "Invalid input" }, { status: 400 });
    }

    const lastSet = await prisma.set.findFirst({
      where: { sessionExerciseId },
      orderBy: { setNumber: "desc" },
      select: { setNumber: true },
    });

    const nextSetNumber = (lastSet?.setNumber ?? 0) + 1;

await prisma.set.create({
  data: {
    setNumber: nextSetNumber,
    reps,
    weightKg,
    rpe,
    sessionExercise: {
      connect: { id: sessionExerciseId },
    },
  },
});

    return NextResponse.json({ ok: true });
  } catch (e: any) {
    console.error(e);
    return NextResponse.json(
      { error: e?.message ?? "Server error" },
      { status: 500 }
    );
  }
}