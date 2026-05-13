"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import KpiCard from "@/components/KpiCard";
import RiskBanner from "@/components/RiskBanner";
import TrackingTable from "@/components/TrackingTable";
import CjGroupPreview from "@/components/CjGroupPreview";

interface KpiData {
  name: string;
  value: number;
  target: number;
  unit: string;
  status: "good" | "warn" | "bad";
}

interface RiskItem {
  id: number;
  productName: string;
  riskLevel: "urgent" | "warning";
  riskReason: string;
}

interface CodeRequest {
  id: number;
  productName: string;
  requestType: string;
  requestTeam: string;
  requesterName: string;
  receivedDate: string;
  receivedConfirmed: boolean;
  cjRequested: boolean;
  cjRequestedDate: string | null;
  completed: boolean;
  completedDate: string | null;
  status: string;
  note: string | null;
  cjDeliveryDate: string | null;
  project?: { projectName: string } | null;
}

interface WeeklySummary {
  summary: string;
  generatedAt: string;
}

export default function PurchasingDashboard() {
  const [kpis, setKpis] = useState<KpiData[]>([]);
  const [risks, setRisks] = useState<RiskItem[]>([]);
  const [requests, setRequests] = useState<CodeRequest[]>([]);
  const [summary, setSummary] = useState<WeeklySummary | null>(null);
  const [showSummary, setShowSummary] = useState(false);
  const [copied, setCopied] = useState(false);

  const fetchAll = useCallback(async () => {
    try {
      const [kpiRes, riskRes, reqRes] = await Promise.all([
        fetch("/api/kpi"),
        fetch("/api/automation/risk-check"),
        fetch("/api/code-requests"),
      ]);
      if (kpiRes.ok) setKpis(await kpiRes.json());
      if (riskRes.ok) setRisks(await riskRes.json());
      if (reqRes.ok) setRequests(await reqRes.json());
    } catch (e) {
      console.error("데이터 로드 실패:", e);
    }
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const handleUpdate = async (id: number, data: Partial<CodeRequest>) => {
    try {
      const res = await fetch("/api/code-requests", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, ...data }),
      });
      if (res.ok) fetchAll();
    } catch (e) {
      console.error("업데이트 실패:", e);
    }
  };

  const generateSummary = async () => {
    try {
      const res = await fetch("/api/automation/weekly-summary");
      if (!res.ok) return;
      const data = await res.json();
      setSummary(data);
      setShowSummary(true);
    } catch (e) {
      console.error("주간 초안 생성 실패:", e);
    }
  };

  const copySummary = () => {
    if (!summary) return;
    navigator.clipboard.writeText(summary.summary);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const today = new Date().toLocaleDateString("ko-KR", {
    year: "numeric", month: "long", day: "numeric", weekday: "long",
  });

  return (
    <div className="min-h-screen bg-[#FAF6F0]">
      {/* 헤더 */}
      <header className="bg-white border-b border-amber-100 px-6 py-4 sticky top-0 z-40">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/" className="w-9 h-9 bg-[#6B4226] rounded-xl flex items-center justify-center text-white font-bold text-sm">
              CG
            </Link>
            <div>
              <div className="font-bold text-[#6B4226]">구매물류팀 대시보드</div>
              <div className="text-xs text-gray-500">{today}</div>
            </div>
          </div>
          <Link href="/request/new">
            <button className="bg-[#6B4226] text-white px-4 py-2 rounded-xl text-sm font-medium hover:bg-[#8B5A3A] transition-colors">
              ➕ 새 요청 등록
            </button>
          </Link>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-8 space-y-8">
        {/* 누락 위험 배너 */}
        <RiskBanner risks={risks} />

        {/* KPI 카드 */}
        <section>
          <h2 className="font-bold text-[#6B4226] mb-3 text-sm uppercase tracking-wide">이번 달 KPI</h2>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {kpis.map((kpi) => (
              <KpiCard key={kpi.name} {...kpi} />
            ))}
          </div>
        </section>

        {/* 코드 요청 트래킹 시트 */}
        <section>
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-bold text-[#6B4226] text-sm uppercase tracking-wide">코드 요청 트래킹</h2>
            <span className="text-xs text-gray-400">행 클릭 → 상세 보기 및 처리</span>
          </div>
          <div className="bg-white rounded-2xl p-5 shadow-sm border border-amber-50">
            <TrackingTable requests={requests} onUpdate={handleUpdate} />
          </div>
        </section>

        {/* 화/목 CJ 요청 예정 */}
        <section>
          <h2 className="font-bold text-[#6B4226] mb-3 text-sm uppercase tracking-wide">이번 주 CJ 요청 예정</h2>
          <CjGroupPreview requests={requests} />
        </section>

        {/* 주간 공유 초안 */}
        <section>
          <div className="bg-white rounded-2xl p-5 shadow-sm border border-amber-50">
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-bold text-[#6B4226]">📝 주간 공유 초안 자동 생성</h2>
              <button
                onClick={generateSummary}
                className="bg-amber-100 text-amber-800 px-4 py-2 rounded-xl text-sm font-medium hover:bg-amber-200"
              >
                초안 생성
              </button>
            </div>
            <p className="text-sm text-gray-500">이번 주 완료/진행/이슈를 자동으로 정리합니다. 카톡·메일에 그대로 붙여넣기 가능.</p>

            {showSummary && summary && (
              <div className="mt-4">
                <div className="flex justify-end mb-2">
                  <button
                    onClick={copySummary}
                    className="text-sm bg-[#6B4226] text-white px-3 py-1.5 rounded-lg hover:bg-[#8B5A3A]"
                  >
                    {copied ? "✅ 복사됨" : "📋 복사하기"}
                  </button>
                </div>
                <pre className="bg-gray-50 border border-gray-200 rounded-xl p-4 text-xs text-gray-700 whitespace-pre-wrap leading-relaxed overflow-auto max-h-80">
                  {summary.summary}
                </pre>
              </div>
            )}
          </div>
        </section>
      </main>
    </div>
  );
}
