"use client";

interface KpiCardProps {
  name: string;
  value: number;
  target: number;
  unit: string;
  status: "good" | "warn" | "bad";
}

export default function KpiCard({ name, value, target, unit, status }: KpiCardProps) {
  const colors = {
    good: "bg-green-50 border-green-200 text-green-700",
    warn: "bg-yellow-50 border-yellow-200 text-yellow-700",
    bad: "bg-red-50 border-red-200 text-red-700",
  };
  const icons = { good: "🟢", warn: "🟡", bad: "🔴" };

  return (
    <div className={`border-2 rounded-xl p-5 ${colors[status]}`}>
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-medium opacity-80">{name}</span>
        <span className="text-lg">{icons[status]}</span>
      </div>
      <div className="text-3xl font-bold">
        {value}
        <span className="text-lg font-normal ml-1">{unit}</span>
      </div>
      <div className="text-xs mt-1 opacity-70">목표: {target}{unit}</div>
    </div>
  );
}
