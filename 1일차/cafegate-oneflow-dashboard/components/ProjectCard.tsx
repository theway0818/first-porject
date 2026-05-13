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
    (new Date(dateStr).setHours(0, 0, 0, 0) - new Date().setHours(0, 0, 0, 0)) /
      86400000
  );
  if (diff === 0) return "D-day";
  if (diff > 0) return `D-${diff}`;
  return `D+${Math.abs(diff)}`;
}

function getProgress(tasks: Task[], team: string): number {
  const teamTasks = tasks.filter((t) => t.teamName === team);
  if (teamTasks.length === 0) return 0;
  const done = teamTasks.filter((t) => t.status === "DONE").length;
  return Math.round((done / teamTasks.length) * 100);
}

const STATUS_COLORS: Record<string, string> = {
  PLANNING: "bg-gray-100 text-gray-600",
  IN_PROGRESS: "bg-yellow-100 text-yellow-800",
  COMPLETED: "bg-green-100 text-green-800",
};

const STATUS_LABELS: Record<string, string> = {
  PLANNING: "기획 중",
  IN_PROGRESS: "진행 중",
  COMPLETED: "완료",
};

export default function ProjectCard({ project }: { project: Project }) {
  const dday = getDday(project.launchDate);
  const diff = Math.ceil(
    (new Date(project.launchDate).setHours(0, 0, 0, 0) - new Date().setHours(0, 0, 0, 0)) / 86400000
  );
  const ddayColor = diff <= 7 ? "text-red-600" : diff <= 30 ? "text-amber-600" : "text-green-700";

  const teams = ["PURCHASING", "MENU_DEV", "OPERATIONS"];
  const teamLabels: Record<string, string> = {
    PURCHASING: "구매물류",
    MENU_DEV: "메뉴개발",
    OPERATIONS: "운영",
  };

  const latestUpdate = project.tasks
    .filter((t) => t.weeklyUpdate)
    .slice(-1)[0]?.weeklyUpdate;

  return (
    <Link href={`/projects/${project.id}`}>
      <div className="bg-white border border-amber-100 rounded-2xl p-5 hover:shadow-md transition-shadow cursor-pointer">
        <div className="flex items-start justify-between mb-3">
          <h3 className="font-bold text-[#6B4226] text-base leading-tight">{project.projectName}</h3>
          <span className={`font-bold text-lg ml-3 flex-shrink-0 ${ddayColor}`}>{dday}</span>
        </div>

        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_COLORS[project.status] ?? "bg-gray-100 text-gray-600"}`}>
          {STATUS_LABELS[project.status] ?? project.status}
        </span>

        <div className="mt-4 space-y-2">
          {teams.map((team) => {
            const progress = getProgress(project.tasks, team);
            return (
              <div key={team}>
                <div className="flex justify-between text-xs text-gray-600 mb-1">
                  <span>{teamLabels[team]}</span>
                  <span>{progress}%</span>
                </div>
                <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-[#6B4226] rounded-full transition-all"
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>

        {latestUpdate && (
          <p className="mt-3 text-xs text-gray-500 border-t border-amber-50 pt-2 truncate">
            💬 {latestUpdate}
          </p>
        )}

        <div className="mt-2 text-xs text-gray-400">
          출시: {new Date(project.launchDate).toLocaleDateString("ko-KR")}
        </div>
      </div>
    </Link>
  );
}
