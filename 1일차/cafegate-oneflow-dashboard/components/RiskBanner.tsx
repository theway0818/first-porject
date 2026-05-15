"use client";

interface RiskItem {
  id: number;
  productName: string;
  riskLevel: "urgent" | "warning";
  riskReason: string;
}

interface RiskBannerProps {
  risks: RiskItem[];
}

export default function RiskBanner({ risks }: RiskBannerProps) {
  if (risks.length === 0) return null;

  const urgent = risks.filter((r) => r.riskLevel === "urgent");
  const warning = risks.filter((r) => r.riskLevel === "warning");

  return (
    <div className="space-y-2">
      {urgent.length > 0 && (
        <div className="bg-[#FEF2F2] border border-[#FECACA] rounded-2xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <span className="w-2 h-2 rounded-full bg-[#EF4444] flex-shrink-0" />
            <span className="text-sm font-bold text-[#EF4444]">
              긴급 — CJ 요청 즉시 필요 ({urgent.length}건)
            </span>
          </div>
          <ul className="space-y-1 pl-4">
            {urgent.map((r) => (
              <li key={r.id} className="text-sm text-[#475569]">
                <span className="font-medium text-[#0F172A]">{r.productName}</span>
                <span className="text-[#94A3B8]"> — {r.riskReason}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
      {warning.length > 0 && (
        <div className="bg-[#FFFBEB] border border-[#FDE68A] rounded-2xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <span className="w-2 h-2 rounded-full bg-[#F59E0B] flex-shrink-0" />
            <span className="text-sm font-bold text-[#D97706]">
              누락 위험 — 처리 필요 ({warning.length}건)
            </span>
          </div>
          <ul className="space-y-1 pl-4">
            {warning.map((r) => (
              <li key={r.id} className="text-sm text-[#475569]">
                <span className="font-medium text-[#0F172A]">{r.productName}</span>
                <span className="text-[#94A3B8]"> — {r.riskReason}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
