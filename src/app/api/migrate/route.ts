import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@libsql/client/http";

export async function GET(req: NextRequest) {
  const secret = req.nextUrl.searchParams.get("secret");
  if (secret !== process.env.MIGRATE_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const client = createClient({
    url: process.env.TURSO_DATABASE_URL!,
    authToken: process.env.TURSO_AUTH_TOKEN!,
  });

  const results: string[] = [];

  const migrations = [
    `ALTER TABLE WorkoutTemplate ADD COLUMN userId TEXT NOT NULL DEFAULT ''`,
    `ALTER TABLE WorkoutSession ADD COLUMN userId TEXT NOT NULL DEFAULT ''`,
  ];

  for (const sql of migrations) {
    try {
      await client.execute(sql);
      results.push(`✓ ${sql}`);
    } catch (e: any) {
      // "duplicate column" means it already ran — safe to ignore
      if (e?.message?.includes("duplicate column")) {
        results.push(`⚠ already exists: ${sql}`);
      } else {
        results.push(`✗ FAILED: ${sql} — ${e?.message}`);
      }
    }
  }

  return NextResponse.json({ ok: true, results });
}
