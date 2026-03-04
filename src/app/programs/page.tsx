import Link from "next/link";
import { prisma } from "@/lib/prisma";
import UseProgramButton from "./use-program-button";

const GOAL_LABEL: Record<string, string> = {
  STRENGTH: "Strength",
  HYPERTROPHY: "Hypertrophy",
  GENERAL: "General Fitness",
};

const LEVEL_LABEL: Record<string, string> = {
  BEGINNER: "Beginner",
  INTERMEDIATE: "Intermediate",
  ADVANCED: "Advanced",
};

const GOAL_COLOR: Record<string, string> = {
  STRENGTH: "text-red-400 bg-red-500/10 border-red-500/20",
  HYPERTROPHY: "text-orange-400 bg-orange-500/10 border-orange-500/20",
  GENERAL: "text-blue-400 bg-blue-500/10 border-blue-500/20",
};

export default async function ProgramsPage() {
  const programs = await prisma.program.findMany({
    orderBy: { name: "asc" },
  });

  return (
    <main className="min-h-screen p-5 pb-10">
      <div className="mx-auto max-w-3xl space-y-6">
        <div className="pt-4">
          <Link href="/" className="text-xs text-white/30 hover:text-white/60 uppercase tracking-wider">← Home</Link>
        </div>

        <header className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-black uppercase tracking-tight">Programs</h1>
            <p className="mt-1 text-xs text-white/40 uppercase tracking-wider">{programs.length} program{programs.length !== 1 ? "s" : ""}</p>
          </div>
          <Link href="/templates" className="text-xs text-orange-500/70 hover:text-orange-400 uppercase tracking-wider">
            Templates →
          </Link>
        </header>

        {programs.length === 0 ? (
          <div className="rounded-xl border border-white/[0.07] p-10 text-center">
            <p className="text-white/40">No programs found.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {programs.map((p) => (
              <div key={p.id} className="group rounded-xl border border-white/[0.07] bg-white/[0.03] hover:border-orange-500/30 transition-all overflow-hidden">
                <div className="flex items-start gap-0">
                  <div className="w-1 self-stretch bg-orange-500/40 group-hover:bg-orange-500 transition-colors shrink-0" />
                  <div className="flex flex-1 items-start justify-between gap-4 p-4">
                    <div className="space-y-2 min-w-0">
                      <div className="font-bold text-lg leading-tight">{p.name}</div>
                      <div className="flex flex-wrap gap-2">
                        <span className={`text-xs px-2 py-0.5 rounded-full border font-medium ${GOAL_COLOR[p.goal] ?? "text-white/50 bg-white/5 border-white/10"}`}>
                          {GOAL_LABEL[p.goal] ?? p.goal}
                        </span>
                        <span className="text-xs px-2 py-0.5 rounded-full border border-white/10 text-white/40">
                          {LEVEL_LABEL[p.level] ?? p.level}
                        </span>
                        <span className="text-xs px-2 py-0.5 rounded-full border border-white/10 text-white/40">
                          {p.daysPerWeek}×/week
                        </span>
                      </div>
                      {p.summary && (
                        <p className="text-sm text-white/50 leading-relaxed">{p.summary}</p>
                      )}
                    </div>
                    <div className="flex flex-col gap-2 shrink-0">
                      <Link
                        className="rounded-lg bg-white/[0.07] px-3 py-1.5 text-xs font-medium text-center hover:bg-white/[0.12] transition-colors"
                        href={`/programs/${p.id}`}
                      >
                        Preview
                      </Link>
                      <UseProgramButton programId={p.id} />
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
