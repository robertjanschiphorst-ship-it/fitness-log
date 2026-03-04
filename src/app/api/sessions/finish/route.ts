import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  const { id } = await req.json();
  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });

  await prisma.workoutSession.update({
    where: { id },
    data: { finishedAt: new Date() },
  });

  return NextResponse.json({ ok: true });
}
