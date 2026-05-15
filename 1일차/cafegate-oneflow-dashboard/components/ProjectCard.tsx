"use client";

import Link from "next/link";

interface Task {
  id: number;
  teamName: string;
  status: string;
  weeklyUpdate: string | null;
}

interface Project {
  id: number;
  projectName: string;
  launchDate: string;
  status: string;
  description: string | null;
  tasks: Task[];
}

function getDday(dateStr: string): string {
  const diff = Math.ceil(
    (new Date(dateStr).setHours(0, 0, 0, 0) - new Date().setHours(0, 0, 0, 0)) / 86400000
  );
  if (diff === 0) return "D-day";
  if (diff > 0) return `D-${diff}`;
  return `D+${Math.abs(diff)}`;
}

function getProgress(tasks: Task[], team: string): number {
  const teamTasks = tasks.filter((t) => t.teamName === team);
  if (teamTasks.length === 0) return 0;
  return Math.round((teamTasks.filter((t) => t.status === "DONE").length / teamTasks.length) * 100);
}

const STATUS_STYLES: Record<string, string> = {
  PLANNING: "bg-[#F1F5F9] text-[#475569]",
  IN_PROGRESS: "bg-[#EFF6FF] text-[#2563EB]",
  COMPLETED: "bg-[#DCFCE7] text-[#16A34A]",
};

const STATUS_LABELS: Record<string, string> = {
  PLANNING: "기획 중",
  IN_PROGRESS: "진행 중",
  COMPLETED: "완료",
};

const TEAMS = [
  { key: "PURCHASING", label: "구매물류" },
  { key: "MENU_DEV", label: "메뉴개발" },
  { key: "OPERATIONS", label: "운영" },
];

export default function ProjectCard({ project }: { project: Project }) {
  const dday = getDday(project.launchDate);
  const diff = Math.ceil(
    (new Date(project.launchDate).setHours(0, 0, 0, 0) - new Date().setHours(0, 0, 0, 0)) / 86400000
  );
  const ddayColor = diff <= 7 ? "text-[#EF4444]" : diff <= 30 ? "text-[#F59E0B]" : "text-[#10B981]";

  const latestUpdate = project.tasks.filter((t) => t.weeklyUpdate).slice(-1)[0]?.weeklyUpdate;

  return (
    <Link href={`/projects/${project.id}`}>
      <div className="bg-white border border-[#E2E8F0] rounded-2xl p-5 hover:shadow-md hover:-translate-y-0.5 transition-all cursor-pointer">

        <div className="flex items-start justify-between mb-3">
          <h3 className="font-bold text-[#0F172A] text-base leading-tight">{project.projectName}</h3>
          <span className={`font-bold text-base ml-3 flex-shrink-0 ${ddayColor}`}>{dday}</span>
        </div>

        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_STYLES[project.status] ?? "bg-[#F1F5F9] text-[#475569]"}`}>
          {STATUS_LABELS[project.status] ?? project.status}
        </span>

        <div className="mt-4 space-y-2.5">
          {TEAMS.map(({ key, label }) => {
            const pct = getProgress(project.tasks, key);
            const barColor = pct === 100 ? "bg-[#10B981]" : pct >= 50 ? "bg-[#2563EB]" : "bg-[#E2E8F0]";
            return (
              <div key={key}>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-[#475569]">{label}</span>
                  <span className="text-[#94A3B8]">{pct}%</span>
                </div>
                <div className="h-1.5 bg-[#F1F5F9] rounded-full overflow-hidden">
                  <div className={`h-full rounded-full transition-all ${barColor}`} style={{ width: `${pct}%` }} />
                </div>
              </div>
            );
          })}
        </div>

        {latestUpdate && (
          <p className="mt-4 text-xs text-[#94A3B8] border-t border-[#F8FAFC] pt-3 truncate">
            {latestUpdate}
          </p>
        )}

        <p className="mt-2 text-xs text-[#CBD5E1]">
          출시 {new Date(project.launchDate).toLocaleDateString("ko-KR")}
        </p>
      </div>
    </Link>
  );
}
