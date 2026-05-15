export const dynamic = 'force-dynamic';

import Link from "next/link";
import { prisma } from "@/lib/prisma";
import ProjectCard from "@/components/ProjectCard";
import OneFlowLogo from "@/components/OneFlowLogo";

export default async function ProjectsPage() {
  const projects = await prisma.project.findMany({
    include: { tasks: true, codeRequests: true },
    orderBy: { launchDate: "asc" },
  });

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-[#0F172A]">

      <header className="sticky top-0 z-50 bg-white/90 backdrop-blur-md border-b border-[#F1F5F9]">
        <div className="max-w-5xl mx-auto px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/"><OneFlowLogo variant="icon" height={28} /></Link>
            <div className="border-l border-[#E2E8F0] pl-3">
              <p className="text-sm font-bold text-[#0F172A]">프로젝트 보드</p>
            </div>
          </div>
          <Link href="/" className="text-xs text-[#94A3B8] hover:text-[#475569] transition-colors">
            ← 홈
          </Link>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-10">
        <div className="flex items-end justify-between mb-8">
          <div>
            <p className="text-xs font-medium text-[#94A3B8] tracking-widest uppercase mb-1">Projects</p>
            <h1 className="text-2xl font-bold text-[#0F172A]">진행 중인 프로젝트</h1>
          </div>
          <span className="text-sm text-[#94A3B8]">총 {projects.length}개</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
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

        {projects.length === 0 && (
          <div className="text-center py-24 text-[#94A3B8]">
            <p className="text-3xl mb-3">🗂</p>
            <p className="font-medium text-[#475569] mb-1">등록된 프로젝트가 없어요</p>
            <p className="text-sm">프로젝트를 생성해서 팀 업무를 관리해보세요</p>
          </div>
        )}
      </main>
    </div>
  );
}
