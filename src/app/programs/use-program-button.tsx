"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export default function UseProgramButton({ programId }: { programId: string }) {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function onClick() {
    setLoading(true);
    try {
      const res = await fetch("/api/programs/use", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ programId }),
      });

      const text = await res.text();
      if (!res.ok) {
        alert(text);
        return;
      }

      router.push("/templates");
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      onClick={onClick}
      disabled={loading}
      className="rounded bg-white/10 px-3 py-1 text-sm hover:bg-white/20 disabled:opacity-50"
    >
      {loading ? "Working..." : "Use program"}
    </button>
  );
}