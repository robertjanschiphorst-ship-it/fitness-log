import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { DeleteTemplateButton } from "./DeleteTemplateButton";

export default async function TemplatesPage() {
  const templates = await prisma.workoutTemplate.findMany({
    orderBy: { name: "asc" },
    include: { exercises: true },
  });

  return (
    <main className="min-h-screen p-5 pb-10">
      <div className="mx-auto max-w-2xl space-y-6">
        <div className="pt-4">
          <Link href="/" className="text-xs text-white/30 hover:text-white/60 uppercase tracking-wider">← Home</Link>
        </div>

        <header className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-black uppercase tracking-tight">Templates</h1>
            <p className="mt-1 text-xs text-white/40 uppercase tracking-wider">{templates.length} template{templates.length !== 1 ? "s" : ""}</p>
          </div>
          <Link
            className="rounded-xl bg-orange-500 px-4 py-2 text-sm font-bold text-white hover:bg-orange-400 transition-colors"
            href="/templates/new"
          >
            + New
          </Link>
        </header>

        {templates.length === 0 ? (
          <div className="rounded-xl border border-white/[0.07] p-10 text-center">
            <p className="text-white/40">No templates yet.</p>
            <Link href="/templates/new" className="mt-3 inline-block text-sm text-orange-500 hover:text-orange-400">
              Create your first template →
            </Link>
          </div>
        ) : (
          <ul className="space-y-2">
            {templates.map((t) => (
              <li key={t.id} className="group rounded-xl border border-white/[0.07] bg-white/[0.03] hover:border-orange-500/30 transition-all">
                <div className="flex items-center gap-4 p-4">
                  <div className="w-1 self-stretch rounded-full bg-orange-500/50 group-hover:bg-orange-500 transition-colors shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold truncate">{t.name}</div>
                    <div className="text-xs text-white/40 mt-0.5 uppercase tracking-wide">
                      {t.templateType.charAt(0) + t.templateType.slice(1).toLowerCase()} · {t.exercises.length} exercise{t.exercises.length !== 1 ? "s" : ""}
                    </div>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <DeleteTemplateButton id={t.id} />
                    <Link
                      href={`/templates/${t.id}`}
                      className="rounded-lg bg-white/[0.07] px-3 py-1.5 text-xs font-medium hover:bg-orange-500/20 hover:text-orange-400 transition-all"
                    >
                      Open →
                    </Link>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </main>
  );
}
