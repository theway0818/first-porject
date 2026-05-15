export const dynamic = 'force-dynamic';

import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import OneFlowLogo from "@/components/OneFlowLogo";

const TEAM_LABELS: Record<string, string> = {
  PURCHASING: "구매물류팀",
  MENU_DEV: "메뉴개발팀",
  OPERATIONS: "운영팀",
};

const STATUS_LABELS: Record<string, string> = {
  TODO: "예정",
  IN_PROGRESS: "진행 중",
  DONE: "완료",
  BLOCKED: "블로킹",
};

const STATUS_COLORS: Record<string, string> = {
  TODO: "bg-[#F1F5F9] text-[#475569]",
  IN_PROGRESS: "bg-[#EFF6FF] text-[#2563EB]",
  DONE: "bg-[#DCFCE7] text-[#16A34A]",
  BLOCKED: "bg-[#FEF2F2] text-[#EF4444]",
};

function getDday(date: Date): string {
  const diff = Math.ceil((date.getTime() - Date.now()) / 86400000);
  if (diff === 0) return "D-day";
  if (diff > 0) return `D-${diff}`;
  return `D+${Math.abs(diff)}`;
}

export default async function ProjectDetailPage({ params }: { params: { id: string } }) {
  const project = await prisma.project.findUnique({
    where: { id: parseInt(params.id) },
    include: { tasks: { orderBy: { dueDate: "asc" } }, codeRequests: true },
  });

  if (!project) notFound();

  const teams = ["PURCHASING", "MENU_DEV", "OPERATIONS"];

  const getProgress = (team: string) => {
    const teamTasks = project.tasks.filter((t) => t.teamName === team);
    if (teamTasks.length === 0) return null;
    const done = teamTasks.filter((t) => t.status === "DONE").length;
    return { pct: Math.round((done / teamTasks.length) * 100), done, total: teamTasks.length };
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-[#0F172A]">

      <header className="sticky top-0 z-50 bg-white/90 backdrop-blur-md border-b border-[#F1F5F9]">
        <div className="max-w-5xl mx-auto px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/"><OneFlowLogo variant="icon" height={28} /></Link>
            <div className="border-l border-[#E2E8F0] pl-3">
              <p className="text-sm font-bold text-[#0F172A] truncate max-w-[200px]">{project.projectName}</p>
              <p className="text-xs text-[#94A3B8]">출시 {project.launchDate.toLocaleDateString("ko-KR")} · {getDday(project.launchDate)}</p>
            </div>
          </div>
          <Link href="/projects" className="text-xs text-[#94A3B8] hover:text-[#475569] transition-colors">
            ← 프로젝트 목록
          </Link>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-10 space-y-6">

        {/* 팀별 진행률 */}
        <section className="bg-white rounded-2xl p-6 border border-[#E2E8F0]">
          <p className="text-xs font-medium text-[#94A3B8] tracking-widest uppercase mb-5">팀별 진행률</p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            {teams.map((team) => {
              const prog = getProgress(team);
              if (!prog) return null;
              const barColor = prog.pct === 100 ? "bg-[#10B981]" : prog.pct >= 50 ? "bg-[#2563EB]" : "bg-[#EF4444]";
              return (
                <div key={team}>
                  <div className="flex justify-between text-sm mb-2">
                    <span className="font-medium text-[#0F172A]">{TEAM_LABELS[team]}</span>
                    <span className="text-[#94A3B8]">{prog.done}/{prog.total}</span>
                  </div>
                  <div className="h-2 bg-[#F1F5F9] rounded-full overflow-hidden">
                    <div className={`h-full rounded-full transition-all ${barColor}`} style={{ width: `${prog.pct}%` }} />
                  </div>
                  <p className="text-xs text-[#94A3B8] mt-1 text-right">{prog.pct}%</p>
                </div>
              );
            })}
          </div>
        </section>

        {/* 팀별 업무 */}
        {teams.map((team) => {
          const teamTasks = project.tasks.filter((t) => t.teamName === team);
          if (teamTasks.length === 0) return null;
          return (
            <section key={team} className="bg-white rounded-2xl border border-[#E2E8F0] overflow-hidden">
              <div className="px-6 py-4 border-b border-[#F1F5F9]">
                <p className="text-xs font-medium text-[#94A3B8] tracking-widest uppercase">{TEAM_LABELS[team]}</p>
              </div>
              <div className="divide-y divide-[#F8FAFC]">
                {teamTasks.map((task) => {
                  const d = Math.ceil((new Date(task.dueDate).getTime() - Date.now()) / 86400000);
                  const ddayColor = d < 0 ? "text-[#94A3B8]" : d <= 3 ? "text-[#EF4444]" : "text-[#475569]";
                  return (
                    <div key={task.id} className="flex items-start gap-4 px-6 py-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap mb-1">
                          <span className="font-medium text-sm text-[#0F172A]">{task.taskName}</span>
                          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_COLORS[task.status] ?? "bg-[#F1F5F9] text-[#475569]"}`}>
                            {STATUS_LABELS[task.status] ?? task.status}
                          </span>
                        </div>
                        <div className="text-xs text-[#94A3B8] flex gap-4">
                          <span>마감 {new Date(task.dueDate).toLocaleDateString("ko-KR")}</span>
                          {task.assignee && <span>담당 {task.assignee}</span>}
                        </div>
                        {task.weeklyUpdate && (
                          <div className="mt-2 text-xs text-[#475569] bg-[#EFF6FF] rounded-lg px-3 py-2">
                            {task.weeklyUpdate}
                          </div>
                        )}
                      </div>
                      <span className={`text-xs font-bold flex-shrink-0 mt-0.5 ${ddayColor}`}>
                        {getDday(new Date(task.dueDate))}
                      </span>
                    </div>
                  );
                })}
              </div>
            </section>
          );
        })}

        {/* 관련 코드 요청 */}
        {project.codeRequests.length > 0 && (
          <section className="bg-white rounded-2xl border border-[#E2E8F0] overflow-hidden">
            <div className="px-6 py-4 border-b border-[#F1F5F9]">
              <p className="text-xs font-medium text-[#94A3B8] tracking-widest uppercase">관련 코드 요청 ({project.codeRequests.length}건)</p>
            </div>
            <div className="divide-y divide-[#F8FAFC]">
              {project.codeRequests.map((r) => (
                <div key={r.id} className="flex items-center justify-between px-6 py-3 text-sm">
                  <span className="font-medium text-[#0F172A]">{r.productName}</span>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                    r.status === "COMPLETED" ? "bg-[#DCFCE7] text-[#16A34A]" :
                    r.status === "CJ_REQUESTED" ? "bg-[#EFF6FF] text-[#2563EB]" :
                    "bg-[#FEF9C3] text-[#CA8A04]"
                  }`}>
                    {r.status === "COMPLETED" ? "완료" : r.status === "CJ_REQUESTED" ? "CJ요청완료" : "진행 중"}
                  </span>
                </div>
              ))}
            </div>
          </section>
        )}

      </main>
    </div>
  );
}
