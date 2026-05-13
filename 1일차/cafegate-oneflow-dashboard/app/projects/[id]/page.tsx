import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";

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
  TODO: "bg-gray-100 text-gray-600",
  IN_PROGRESS: "bg-yellow-100 text-yellow-800",
  DONE: "bg-green-100 text-green-800",
  BLOCKED: "bg-red-100 text-red-800",
};

function getDday(dateStr: Date): string {
  const diff = Math.ceil((dateStr.getTime() - Date.now()) / 86400000);
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
    if (teamTasks.length === 0) return 0;
    const done = teamTasks.filter((t) => t.status === "DONE").length;
    return Math.round((done / teamTasks.length) * 100);
  };

  return (
    <div className="min-h-screen bg-[#FAF6F0]">
      <header className="bg-white border-b border-amber-100 px-6 py-4 sticky top-0 z-40">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/" className="w-9 h-9 bg-[#6B4226] rounded-xl flex items-center justify-center text-white font-bold text-sm">CG</Link>
            <div>
              <div className="font-bold text-[#6B4226]">{project.projectName}</div>
              <div className="text-xs text-gray-500">출시: {project.launchDate.toLocaleDateString("ko-KR")} · {getDday(project.launchDate)}</div>
            </div>
          </div>
          <Link href="/projects" className="text-sm text-gray-500 hover:text-[#6B4226]">← 프로젝트 목록</Link>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-8 space-y-8">
        {/* 팀별 진행률 */}
        <section className="bg-white rounded-2xl p-6 shadow-sm border border-amber-50">
          <h2 className="font-bold text-[#6B4226] mb-4">팀별 진행률</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            {teams.map((team) => {
              const progress = getProgress(team);
              const color = progress === 100 ? "bg-green-500" : progress >= 50 ? "bg-amber-500" : "bg-red-400";
              return (
                <div key={team}>
                  <div className="flex justify-between text-sm mb-2">
                    <span className="font-medium">{TEAM_LABELS[team]}</span>
                    <span className="text-gray-500">{progress}%</span>
                  </div>
                  <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
                    <div className={`h-full rounded-full transition-all ${color}`} style={{ width: `${progress}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* 팀별 업무 매트릭스 */}
        {teams.map((team) => {
          const teamTasks = project.tasks.filter((t) => t.teamName === team);
          if (teamTasks.length === 0) return null;
          return (
            <section key={team} className="bg-white rounded-2xl p-6 shadow-sm border border-amber-50">
              <h2 className="font-bold text-[#6B4226] mb-4">{TEAM_LABELS[team]}</h2>
              <div className="space-y-3">
                {teamTasks.map((task) => (
                  <div key={task.id} className="flex items-start gap-4 py-3 border-b border-amber-50 last:border-0">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-medium text-sm">{task.taskName}</span>
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_COLORS[task.status] ?? "bg-gray-100 text-gray-600"}`}>
                          {STATUS_LABELS[task.status] ?? task.status}
                        </span>
                      </div>
                      <div className="text-xs text-gray-500 mt-1 flex gap-4">
                        <span>마감: {new Date(task.dueDate).toLocaleDateString("ko-KR")}</span>
                        {task.assignee && <span>담당: {task.assignee}</span>}
                      </div>
                      {task.weeklyUpdate && (
                        <div className="mt-1.5 text-xs text-gray-600 bg-amber-50 rounded-lg px-3 py-1.5">
                          💬 {task.weeklyUpdate}
                        </div>
                      )}
                    </div>
                    <div className={`text-xs font-bold flex-shrink-0 mt-1 ${(() => {
                      const d = Math.ceil((new Date(task.dueDate).getTime() - Date.now()) / 86400000);
                      return d < 0 ? "text-gray-400" : d <= 3 ? "text-red-600" : "text-gray-600";
                    })()}`}>
                      {getDday(new Date(task.dueDate))}
                    </div>
                  </div>
                ))}
              </div>
            </section>
          );
        })}

        {/* 관련 코드 요청 */}
        {project.codeRequests.length > 0 && (
          <section className="bg-white rounded-2xl p-6 shadow-sm border border-amber-50">
            <h2 className="font-bold text-[#6B4226] mb-4">관련 코드 요청 ({project.codeRequests.length}건)</h2>
            <div className="space-y-2">
              {project.codeRequests.map((r) => (
                <div key={r.id} className="flex items-center justify-between py-2 border-b border-amber-50 last:border-0 text-sm">
                  <span className="font-medium">{r.productName}</span>
                  <span className={`text-xs px-2 py-0.5 rounded-full ${
                    r.status === "COMPLETED" ? "bg-green-100 text-green-800" :
                    r.status === "CJ_REQUESTED" ? "bg-blue-100 text-blue-800" :
                    "bg-yellow-100 text-yellow-800"
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
