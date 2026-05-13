import Link from "next/link";
import { prisma } from "@/lib/prisma";
import ScqaReport from "@/components/ScqaReport";
import KpiCard from "@/components/KpiCard";
import PrintButton from "@/components/PrintButton";

async function getKpis() {
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);

  const thisMonthReqs = await prisma.codeRequest.findMany({
    where: { receivedDate: { gte: startOfMonth } },
  });
  const lastMonthReqs = await prisma.codeRequest.findMany({
    where: { receivedDate: { gte: lastMonth, lte: endOfLastMonth } },
  });

  const calcMissing = (reqs: typeof thisMonthReqs) =>
    reqs.filter((r) => !r.cjRequested && !r.completed && r.status !== "REJECTED").length;

  const thisMonthMissing = calcMissing(thisMonthReqs);
  const lastMonthMissing = calcMissing(lastMonthReqs);

  const logs = await prisma.kpiLog.findMany({
    orderBy: { measureDate: "desc" },
    take: 20,
  });

  return {
    thisMonthMissing,
    lastMonthMissing,
    thisMonthTotal: thisMonthReqs.length,
    lastMonthTotal: lastMonthReqs.length,
    logs,
  };
}

export default async function ExecutivePage() {
  const { thisMonthMissing, lastMonthMissing, thisMonthTotal, lastMonthTotal, logs } = await getKpis();

  const now = new Date();
  const projects = await prisma.project.findMany({
    where: { status: "IN_PROGRESS" },
    include: { tasks: true, codeRequests: true },
  });

  const allPendingRequests = await prisma.codeRequest.findMany({
    where: { cjRequested: false, completed: false, status: { notIn: ["COMPLETED", "REJECTED"] } },
  });

  const urgentItems = allPendingRequests.filter((r) => {
    const days = (now.getTime() - new Date(r.receivedDate).getTime()) / 86400000;
    return days > 7;
  });

  const kpiCards: Array<{ name: string; value: number; target: number; unit: string; status: "good" | "warn" | "bad"; prev: number }> = [
    {
      name: "이번 달 누락 건수",
      value: thisMonthMissing,
      prev: lastMonthMissing,
      target: 0,
      unit: "건",
      status: thisMonthMissing === 0 ? "good" : "bad",
    },
    {
      name: "이번 달 요청 처리",
      value: thisMonthTotal,
      prev: lastMonthTotal,
      target: lastMonthTotal || thisMonthTotal,
      unit: "건",
      status: thisMonthTotal >= (lastMonthTotal || 0) ? "good" : "warn",
    },
    {
      name: "진행 중 프로젝트",
      value: projects.length,
      prev: 0,
      target: projects.length,
      unit: "건",
      status: projects.length > 0 ? "good" : "warn",
    },
    {
      name: "CJ 미요청 위험",
      value: urgentItems.length,
      prev: 0,
      target: 0,
      unit: "건",
      status: urgentItems.length === 0 ? "good" : "bad",
    },
  ];

  const inProgressTasks = projects.flatMap((p) =>
    p.tasks.filter((t) => t.status === "IN_PROGRESS").map((t) => ({ ...t, projectName: p.projectName }))
  );

  const blockedTasks = projects.flatMap((p) =>
    p.tasks.filter((t) => t.status === "BLOCKED").map((t) => ({ ...t, projectName: p.projectName }))
  );

  const nextWeekTasks = projects.flatMap((p) =>
    p.tasks.filter((t) => {
      const diff = (new Date(t.dueDate).getTime() - now.getTime()) / 86400000;
      return diff >= 0 && diff <= 7 && t.status !== "DONE";
    }).map((t) => ({ ...t, projectName: p.projectName }))
  );

  const scqa = {
    situation: [
      `현재 진행 중인 신메뉴 출시 프로젝트 ${projects.length}건`,
      `이번 달 코드 요청 접수 총 ${thisMonthTotal}건`,
      `CJ 미요청 처리 대기 ${allPendingRequests.length}건`,
    ],
    complication: [
      urgentItems.length > 0
        ? `7일 이상 지연된 코드 요청 ${urgentItems.length}건 — 즉시 처리 필요`
        : "누락 위험 항목 없음 ✅",
      blockedTasks.length > 0
        ? `블로킹 업무 ${blockedTasks.length}건 (${blockedTasks.map((t) => t.taskName).join(", ")})`
        : "블로킹 이슈 없음 ✅",
    ],
    question: [
      nextWeekTasks.length > 0
        ? `이번 주 마감 업무 ${nextWeekTasks.length}건 — 우선순위 확인 필요`
        : "이번 주 긴급 결정 사항 없음",
      urgentItems.length > 0
        ? `CJ 요청 지연 ${urgentItems.length}건 처리 방향 결정`
        : "CJ 요청 처리 정상 진행 중",
    ],
    action: [
      urgentItems.length > 0
        ? `1. CJ 미요청 ${urgentItems.length}건 화/목 일괄 요청 처리`
        : "1. 코드 요청 정상 처리 유지",
      inProgressTasks.length > 0
        ? `2. ${inProgressTasks.slice(0, 2).map((t) => t.taskName).join(", ")} 진행 상황 확인`
        : "2. 프로젝트 일정 점검",
      "3. 다음 주 신메뉴 출시 일정 확인 및 팀 간 공유",
    ],
  };

  const today = new Date().toLocaleDateString("ko-KR", {
    year: "numeric", month: "long", day: "numeric",
  });

  return (
    <div className="min-h-screen bg-[#FAF6F0]">
      <header className="bg-white border-b border-amber-100 px-6 py-4 sticky top-0 z-40 print:hidden">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/" className="w-9 h-9 bg-[#6B4226] rounded-xl flex items-center justify-center text-white font-bold text-sm">CG</Link>
            <div>
              <div className="font-bold text-[#6B4226]">본부장 보고 뷰</div>
              <div className="text-xs text-gray-500">{today} 기준</div>
            </div>
          </div>
          <PrintButton />
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-8 space-y-8">
        {/* KPI 카드 */}
        <section>
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-bold text-[#6B4226] text-sm uppercase tracking-wide">이번 달 KPI 현황</h2>
            <span className="text-xs text-gray-400">지난 달 대비 비교</span>
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {kpiCards.map((kpi) => (
              <div key={kpi.name} className="relative">
                <KpiCard name={kpi.name} value={kpi.value} target={kpi.target} unit={kpi.unit} status={kpi.status} />
                {kpi.prev !== 0 && (
                  <div className="absolute top-3 right-3 text-xs text-gray-400">
                    전월 {kpi.prev}{kpi.unit}
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>

        {/* SCQA 보고 */}
        <section>
          <h2 className="font-bold text-[#6B4226] mb-3 text-sm uppercase tracking-wide">
            SCQA 1페이지 보고
          </h2>
          <ScqaReport data={scqa} />
        </section>

        {/* 프로젝트 현황 */}
        <section>
          <h2 className="font-bold text-[#6B4226] mb-3 text-sm uppercase tracking-wide">프로젝트 진행 현황</h2>
          <div className="bg-white rounded-2xl overflow-hidden shadow-sm border border-amber-50">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-[#6B4226] text-white">
                  <th className="px-4 py-3 text-left font-medium">프로젝트</th>
                  <th className="px-4 py-3 text-left font-medium">출시일</th>
                  <th className="px-4 py-3 text-center font-medium">D-day</th>
                  <th className="px-4 py-3 text-center font-medium">코드 요청</th>
                  <th className="px-4 py-3 text-center font-medium">상태</th>
                </tr>
              </thead>
              <tbody>
                {projects.map((p, i) => {
                  const diff = Math.ceil((p.launchDate.getTime() - now.getTime()) / 86400000);
                  const dday = diff === 0 ? "D-day" : diff > 0 ? `D-${diff}` : `D+${Math.abs(diff)}`;
                  const ddayColor = diff <= 7 ? "text-red-600 font-bold" : diff <= 30 ? "text-amber-600 font-bold" : "text-green-700";
                  return (
                    <tr key={p.id} className={`border-b border-amber-50 ${i % 2 === 0 ? "bg-white" : "bg-[#FAF6F0]"}`}>
                      <td className="px-4 py-3 font-medium">{p.projectName}</td>
                      <td className="px-4 py-3 text-gray-600">{p.launchDate.toLocaleDateString("ko-KR")}</td>
                      <td className={`px-4 py-3 text-center ${ddayColor}`}>{dday}</td>
                      <td className="px-4 py-3 text-center text-gray-600">{p.codeRequests.length}건</td>
                      <td className="px-4 py-3 text-center">
                        <span className={`text-xs px-2 py-0.5 rounded-full ${
                          p.status === "COMPLETED" ? "bg-green-100 text-green-800" :
                          p.status === "IN_PROGRESS" ? "bg-yellow-100 text-yellow-800" :
                          "bg-gray-100 text-gray-600"
                        }`}>
                          {p.status === "COMPLETED" ? "완료" : p.status === "IN_PROGRESS" ? "진행 중" : "기획 중"}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>
      </main>

      {/* 인쇄 전용 푸터 */}
      <div className="hidden print:block text-center text-xs text-gray-400 py-4 mt-8">
        카페게이트 ONE FLOW 대시보드 · {today} 자동 생성
      </div>
    </div>
  );
}
