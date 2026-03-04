"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function StartSessionButton({ templateId }: { templateId: string }) {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleClick() {
    setLoading(true);

    try {
      const res = await fetch("/api/sessions/start", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ templateId }),
      });

      // Read as text first (prevents crash if not JSON)
      const text = await res.text();
      let data: any = null;

      try {
        data = text ? JSON.parse(text) : null;
      } catch {
        data = null;
      }

      if (!res.ok) {
        alert(data?.error ?? `Start session failed (${res.status})`);
        return;
      }

      if (!data?.sessionId) {
        alert("No sessionId returned from server");
        return;
      }

      router.push(`/sessions/${data.sessionId}`);
    } catch (err) {
      console.error(err);
      alert("Network or server error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      disabled={loading}
      onClick={handleClick}
      className="w-full sm:w-auto rounded-xl bg-orange-500 px-5 py-2.5 text-sm font-black text-white uppercase tracking-wide hover:bg-orange-400 disabled:opacity-60 transition-colors"
    >
      {loading ? "Starting…" : "▶ Start Session"}
    </button>
  );
}