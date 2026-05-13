import Link from "next/link";
import { prisma } from "@/lib/prisma";
import ProjectCard from "@/components/ProjectCard";

export default async function ProjectsPage() {
  const projects = await prisma.project.findMany({
    include: { tasks: true, codeRequests: true },
    orderBy: { launchDate: "asc" },
  });

  return (
    <div className="min-h-screen bg-[#FAF6F0]">
      <header className="bg-white border-b border-amber-100 px-6 py-4 sticky top-0 z-40">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/" className="w-9 h-9 bg-[#6B4226] rounded-xl flex items-center justify-center text-white font-bold text-sm">CG</Link>
            <div>
              <div className="font-bold text-[#6B4226]">프로젝트 협업 보드</div>
              <div className="text-xs text-gray-500">신메뉴 출시 프로젝트 현황</div>
            </div>
          </div>
          <Link href="/" className="text-sm text-gray-500 hover:text-[#6B4226]">← 홈으로</Link>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-8">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-xl font-bold text-[#6B4226]">진행 중인 프로젝트</h1>
          <span className="text-sm text-gray-500">총 {projects.length}개</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {projects.map((project) => (
            <ProjectCard key={project.id} project={{
              ...project,
              launchDate: project.launchDate.toISOString(),
              tasks: project.tasks.map((t) => ({
                ...t,
                dueDate: t.dueDate.toISOString(),
              })),
            }} />
          ))}
        </div>
      </main>
    </div>
  );
}
