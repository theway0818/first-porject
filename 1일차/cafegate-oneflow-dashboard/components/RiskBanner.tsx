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
    <div className="space-y-2 mb-6">
      {urgent.length > 0 && (
        <div className="bg-red-600 text-white rounded-xl p-4">
          <div className="flex items-center gap-2 font-bold text-sm mb-2">
            🚨 긴급 — CJ 요청 즉시 필요 ({urgent.length}건)
          </div>
          <ul className="text-sm space-y-1">
            {urgent.map((r) => (
              <li key={r.id}>
                • <strong>{r.productName}</strong> — {r.riskReason}
              </li>
            ))}
          </ul>
        </div>
      )}
      {warning.length > 0 && (
        <div className="bg-red-50 border-2 border-red-300 text-red-800 rounded-xl p-4">
          <div className="flex items-center gap-2 font-bold text-sm mb-2">
            🔴 누락 위험 — 처리 필요 ({warning.length}건)
          </div>
          <ul className="text-sm space-y-1">
            {warning.map((r) => (
              <li key={r.id}>
                • <strong>{r.productName}</strong> — {r.riskReason}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
