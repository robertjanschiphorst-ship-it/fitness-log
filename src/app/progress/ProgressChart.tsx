"use client";

type DataPoint = { date: string; maxWeight: number; totalVolume: number };

export function ProgressChart({ data }: { data: DataPoint[] }) {
  if (data.length === 0) return null;

  if (data.length === 1) {
    return (
      <div className="flex items-center gap-3 text-sm">
        <span className="text-white/35 text-xs">
          {new Date(data[0].date).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}
        </span>
        <span className="font-black text-orange-500">{data[0].maxWeight} kg</span>
        <span className="text-xs text-white/25">Only one session — keep going!</span>
      </div>
    );
  }

  const maxW = Math.max(...data.map((d) => d.maxWeight));
  const minW = Math.min(...data.map((d) => d.maxWeight));
  const range = maxW - minW || 1;

  const W = 500;
  const H = 80;
  const PAD = 8;

  const points = data.map((d, i) => {
    const x = PAD + (i / (data.length - 1)) * (W - PAD * 2);
    const y = H - PAD - ((d.maxWeight - minW) / range) * (H - PAD * 2);
    return { x, y, d };
  });

  const pathD = points
    .map((p, i) => `${i === 0 ? "M" : "L"} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`)
    .join(" ");

  const areaD = `${pathD} L ${points[points.length - 1].x.toFixed(1)} ${H} L ${points[0].x.toFixed(1)} ${H} Z`;

  const improved = data[data.length - 1].maxWeight > data[0].maxWeight;
  const same = data[data.length - 1].maxWeight === data[0].maxWeight;
  const diff = data[data.length - 1].maxWeight - data[0].maxWeight;

  const lineColor = improved ? "#f97316" : same ? "rgba(255,255,255,0.3)" : "#f87171";
  const areaColor = improved ? "rgba(249,115,22,0.08)" : same ? "rgba(255,255,255,0.03)" : "rgba(248,113,113,0.06)";
  const diffColor = improved ? "text-orange-400" : same ? "text-white/35" : "text-red-400";

  const firstDate = new Date(data[0].date).toLocaleDateString("en-GB", { day: "numeric", month: "short" });
  const lastDate = new Date(data[data.length - 1].date).toLocaleDateString("en-GB", { day: "numeric", month: "short" });

  return (
    <div className="space-y-2">
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-14" preserveAspectRatio="none">
        <path d={areaD} fill={areaColor} />
        <path d={pathD} fill="none" stroke={lineColor} strokeWidth="2" />
        {/* First and last dots only */}
        <circle cx={points[0].x} cy={points[0].y} r="3" fill={lineColor} opacity="0.5" />
        <circle cx={points[points.length - 1].x} cy={points[points.length - 1].y} r="4" fill={lineColor} />
      </svg>
      <div className="flex items-center justify-between text-xs">
        <span className="text-white/30">{firstDate}</span>
        <span className={`font-bold ${diffColor}`}>
          {diff > 0 ? `+${diff} kg` : diff < 0 ? `${diff} kg` : "No change"}
        </span>
        <span className="text-white/30">{lastDate}</span>
      </div>
    </div>
  );
}
