import Link from "next/link";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { TemplateType } from "@prisma/client";
import { auth } from "@/auth";

export const dynamic = 'force-dynamic';

async function createTemplate(formData: FormData) {
  "use server";

  const session = await auth();
  const userId = session?.user?.email ?? "";

  const name = String(formData.get("name") ?? "").trim();
  const templateType = String(formData.get("templateType") ?? "OTHER") as TemplateType;

  if (!name) return;

  await prisma.workoutTemplate.create({
    data: { name, templateType, userId },
  });

  redirect(`/templates`);
}

export default function NewTemplatePage() {
  return (
    <main className="min-h-screen p-6">
      <div className="mx-auto max-w-xl space-y-6">
        <header className="flex items-center justify-between">
          <h1 className="text-2xl font-semibold">New template</h1>
          <Link className="text-sm underline text-[var(--text-70)] hover:text-[var(--text)]" href="/templates">
            Back
          </Link>
        </header>

        <form action={createTemplate} className="space-y-4 rounded-lg border border-[var(--border)] p-4">
          <div className="space-y-1">
            <label className="text-sm text-[var(--text-70)]">Name</label>
            <input
              name="name"
              placeholder="e.g. Push A"
              className="w-full rounded-md bg-[var(--card)] px-3 py-2 outline-none ring-1 ring-[var(--border)] focus:ring-2"
              required
            />
          </div>

          <div className="space-y-1">
            <label className="text-sm text-[var(--text-70)]">Type</label>
            <select
              name="templateType"
              className="w-full rounded-md bg-[var(--card)] px-3 py-2 outline-none ring-1 ring-[var(--border)] focus:ring-2"
              defaultValue="OTHER"
            >
              {Object.values(TemplateType).map((v) => (
                <option key={v} value={v}>
                  {v}
                </option>
              ))}
            </select>
          </div>

          <button className="rounded-md bg-[var(--input-bg)] px-3 py-2 text-sm hover:bg-[var(--text-20)]">
            Create
          </button>
        </form>
      </div>
    </main>
  );
}