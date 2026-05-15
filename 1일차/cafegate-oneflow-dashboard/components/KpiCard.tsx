"use client";

interface KpiCardProps {
  name: string;
  value: number;
  target: number;
  unit: string;
  status: "good" | "warn" | "bad";
}

export default function KpiCard({ name, value, target, unit, status }: KpiCardProps) {
  const styles = {
    good: {
      card: "bg-white border-[#E2E8F0]",
      dot: "bg-[#10B981]",
      value: "text-[#0F172A]",
      label: "text-[#10B981]",
    },
    warn: {
      card: "bg-white border-[#E2E8F0]",
      dot: "bg-[#F59E0B]",
      value: "text-[#0F172A]",
      label: "text-[#F59E0B]",
    },
    bad: {
      card: "bg-[#FEF2F2] border-[#FECACA]",
      dot: "bg-[#EF4444]",
      value: "text-[#EF4444]",
      label: "text-[#EF4444]",
    },
  };

  const s = styles[status];

  return (
    <div className={`border rounded-2xl p-5 ${s.card}`}>
      <div className="flex items-center gap-2 mb-3">
        <span className={`w-2 h-2 rounded-full flex-shrink-0 ${s.dot}`} />
        <span className="text-xs font-medium text-[#475569] leading-tight">{name}</span>
      </div>
      <div className={`text-3xl font-black ${s.value}`}>
        {value}
        <span className="text-base font-normal text-[#94A3B8] ml-1">{unit}</span>
      </div>
      <div className="text-xs text-[#94A3B8] mt-2">목표 {target}{unit}</div>
    </div>
  );
}
