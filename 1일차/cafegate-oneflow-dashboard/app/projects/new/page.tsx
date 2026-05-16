import Link from "next/link";
import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import OneFlowLogo from "@/components/OneFlowLogo";
import NewProjectForm from "./NewProjectForm";

export const dynamic = "force-dynamic";

export default async function NewProjectPage() {
  const supabase = createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?next=/projects/new");
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-[#0F172A]">
      <header className="sticky top-0 z-50 bg-white/90 backdrop-blur-md border-b border-[#F1F5F9]">
        <div className="max-w-3xl mx-auto px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/"><OneFlowLogo variant="icon" height={28} /></Link>
            <div className="border-l border-[#E2E8F0] pl-3">
              <p className="text-sm font-bold text-[#0F172A]">새 프로젝트</p>
            </div>
          </div>
          <Link
            href="/projects"
            className="text-xs text-[#94A3B8] hover:text-[#475569] transition-colors"
          >
            ← 프로젝트 보드
          </Link>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-6 py-10">
        <p className="text-xs font-medium text-[#94A3B8] tracking-widest uppercase mb-1">
          New Project
        </p>
        <h1 className="text-2xl font-bold text-[#0F172A] mb-1">프로젝트 만들기</h1>
        <p className="text-sm text-[#64748B] mb-8">
          {user.email} 으로 등록됩니다
        </p>

        <NewProjectForm />
      </main>
    </div>
  );
}
