"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import KpiCard from "@/components/KpiCard";
import RiskBanner from "@/components/RiskBanner";
import TrackingTable from "@/components/TrackingTable";
import CjGroupPreview from "@/components/CjGroupPreview";
import OneFlowLogo from "@/components/OneFlowLogo";

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
      setSummary(await res.json());
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
    <div className="min-h-screen bg-[#F8FAFC] text-[#0F172A]">

      <header className="sticky top-0 z-50 bg-white/90 backdrop-blur-md border-b border-[#F1F5F9]">
        <div className="max-w-6xl mx-auto px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/"><OneFlowLogo variant="icon" height={28} /></Link>
            <div className="border-l border-[#E2E8F0] pl-3">
              <p className="text-sm font-bold text-[#0F172A]">구매물류팀</p>
              <p className="text-xs text-[#94A3B8]">{today}</p>
            </div>
          </div>
          <Link href="/request/new">
            <button className="text-xs font-medium bg-[#0F172A] text-white px-4 py-2 rounded-full hover:bg-[#1E293B] transition-colors">
              새 요청 등록
            </button>
          </Link>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-10 space-y-8">

        <RiskBanner risks={risks} />

        {/* KPI */}
        <section>
          <p className="text-xs font-medium text-[#94A3B8] tracking-widest uppercase mb-4">이번 달 KPI</p>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {kpis.map((kpi) => (
              <KpiCard key={kpi.name} {...kpi} />
            ))}
          </div>
        </section>

        {/* 트래킹 */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <p className="text-xs font-medium text-[#94A3B8] tracking-widest uppercase">코드 요청 트래킹</p>
            <span className="text-xs text-[#94A3B8]">행 클릭 → 상세 보기</span>
          </div>
          <div className="bg-white rounded-2xl border border-[#E2E8F0] overflow-hidden">
            <div className="p-5">
              <TrackingTable requests={requests} onUpdate={handleUpdate} />
            </div>
          </div>
        </section>

        {/* CJ 예정 */}
        <section>
          <p className="text-xs font-medium text-[#94A3B8] tracking-widest uppercase mb-4">이번 주 CJ 요청 예정</p>
          <CjGroupPreview requests={requests} />
        </section>

        {/* 주간 초안 */}
        <section>
          <div className="bg-white rounded-2xl border border-[#E2E8F0] p-6">
            <div className="flex items-center justify-between mb-3">
              <div>
                <p className="text-xs font-medium text-[#94A3B8] tracking-widest uppercase mb-1">자동화</p>
                <h3 className="font-bold text-[#0F172A]">주간 공유 초안 생성</h3>
              </div>
              <button
                onClick={generateSummary}
                className="text-xs font-medium border border-[#E2E8F0] text-[#475569] px-4 py-2 rounded-full hover:bg-[#F8FAFC] transition-colors"
              >
                초안 생성
              </button>
            </div>
            <p className="text-sm text-[#94A3B8]">이번 주 완료·진행·이슈를 자동 정리합니다. 바로 붙여넣기 가능.</p>

            {showSummary && summary && (
              <div className="mt-5">
                <div className="flex justify-end mb-2">
                  <button
                    onClick={copySummary}
                    className="text-xs font-medium bg-[#0F172A] text-white px-3 py-1.5 rounded-full hover:bg-[#1E293B] transition-colors"
                  >
                    {copied ? "복사됨 ✓" : "복사하기"}
                  </button>
                </div>
                <pre className="bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl p-4 text-xs text-[#475569] whitespace-pre-wrap leading-relaxed overflow-auto max-h-80">
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
