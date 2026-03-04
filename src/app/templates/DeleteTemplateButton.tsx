"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function DeleteTemplateButton({ id }: { id: string }) {
  const router = useRouter();
  const [confirming, setConfirming] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleDelete() {
    setLoading(true);
    await fetch("/api/templates/delete", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    router.refresh();
  }

  if (confirming) {
    return (
      <div className="flex items-center gap-2">
        <span className="text-xs text-white/40">Delete?</span>
        <button onClick={handleDelete} disabled={loading}
          className="text-xs font-bold text-red-400 hover:text-red-300 disabled:opacity-50 transition-colors">
          {loading ? "…" : "Yes"}
        </button>
        <button onClick={() => setConfirming(false)}
          className="text-xs text-white/30 hover:text-white/60 transition-colors">
          No
        </button>
      </div>
    );
  }

  return (
    <button onClick={() => setConfirming(true)}
      className="text-xs text-white/20 hover:text-red-400 transition-colors px-1">
      ✕
    </button>
  );
}
