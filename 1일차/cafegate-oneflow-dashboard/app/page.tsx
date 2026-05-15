export const dynamic = "force-dynamic";

import Link from "next/link";
import { prisma } from "@/lib/prisma";
import TeamCalendar, { CalendarEvent } from "@/components/TeamCalendar";
import OneFlowLogo from "@/components/OneFlowLogo";

const roles = [
  {
    id: "purchasing",
    label: "구매물류팀",
    emoji: "📦",
    description: "코드 요청 · KPI · 납기",
    href: "/dashboard/purchasing",
    bg: "bg-[#1E3A5F] hover:bg-[#274D7A]",
  },
  {
    id: "menu-dev",
    label: "메뉴개발팀",
    emoji: "🍵",
    description: "코드 요청 · 프로젝트",
    href: "/request/new",
    bg: "bg-[#2563EB] hover:bg-[#1D4ED8]",
  },
  {
    id: "operations",
    label: "운영팀",
    emoji: "🏪",
    description: "요청 접수 · 진행 현황",
    href: "/request/new",
    bg: "bg-[#0284C7] hover:bg-[#0369A1]",
  },
  {
    id: "executive",
    label: "본부장",
    emoji: "📊",
    description: "KPI · 보고 · 이슈",
    href: "/executive",
    bg: "bg-[#0F172A] hover:bg-[#1E293B]",
  },
];

function toDateStr(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

async function getCalendarEvents(): Promise<CalendarEvent[]> {
  const events: CalendarEvent[] = [];

  const tasks = await prisma.projectTask.findMany({
    where: { status: { not: "DONE" } },
    include: { project: { select: { projectName: true } } },
  });

  tasks.forEach((t) => {
    events.push({
      id: `task-${t.id}`,
      date: toDateStr(new Date(t.dueDate)),
      title: t.taskName,
      team: t.teamName,
      type: "task",
      status: t.status,
    });
  });

  const deliveries = await prisma.codeRequest.findMany({
    where: { cjDeliveryDate: { not: null }, completed: false },
    select: { id: true, productName: true, requestTeam: true, cjDeliveryDate: true, status: true },
  });

  deliveries.forEach((r) => {
    if (!r.cjDeliveryDate) return;
    events.push({
      id: `delivery-${r.id}`,
      date: toDateStr(new Date(r.cjDeliveryDate)),
      title: `🚚 ${r.productName}`,
      team: r.requestTeam,
      type: "delivery",
      status: r.status,
    });
  });

  return events;
}

export default async function HomePage() {
  const today = new Date().toLocaleDateString("ko-KR", {
    year: "numeric",
    month: "long",
    day: "numeric",
    weekday: "long",
  });

  const events = await getCalendarEvents();

  return (
    <div className="min-h-screen bg-white text-[#0F172A]">

      {/* ── HEADER ── */}
      <header className="sticky top-0 z-50 bg-white/90 backdrop-blur-md border-b border-[#F1F5F9]">
        <div className="max-w-5xl mx-auto px-6 h-14 flex items-center justify-between">
          <Link href="/landing">
            <OneFlowLogo variant="horizontal" height={32} />
          </Link>
          <div className="flex items-center gap-3">
            <span className="text-xs text-[#94A3B8] hidden sm:block">{today}</span>
            <Link
              href="/request/new"
              className="text-xs font-medium bg-[#0F172A] text-white px-4 py-2 rounded-full hover:bg-[#1E293B] transition-colors"
            >
              요청 등록
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-10 space-y-10">

        {/* ── 팀 입장 ── */}
        <section>
          <p className="text-xs font-medium text-[#94A3B8] tracking-widest uppercase mb-4">팀별 입장</p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {roles.map((role) => (
              <Link key={role.id} href={role.href}>
                <div className={`${role.bg} rounded-2xl p-5 text-white group transition-all hover:-translate-y-0.5 hover:shadow-lg`}>
                  <div className="text-2xl mb-4">{role.emoji}</div>
                  <p className="font-bold text-sm mb-1">{role.label}</p>
                  <p className="text-[11px] opacity-50 mb-4">{role.description}</p>
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <span className="text-[10px] font-medium">입장</span>
                    <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                      <path d="M2 5h6M5 2l3 3-3 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </section>

        {/* ── 업무 일정 ── */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <p className="text-xs font-medium text-[#94A3B8] tracking-widest uppercase">업무 일정</p>
            <div className="flex gap-2">
              <Link
                href="/projects"
                className="text-xs text-[#475569] border border-[#E2E8F0] rounded-full px-3 py-1.5 hover:border-[#CBD5E1] transition-colors"
              >
                프로젝트 보드
              </Link>
            </div>
          </div>
          <div className="rounded-2xl border border-[#E2E8F0] overflow-hidden">
            {events.length === 0 ? (
              <div className="text-center py-20 text-[#94A3B8]">
                <p className="text-3xl mb-3">📅</p>
                <p className="font-medium text-[#475569] mb-1">등록된 업무 일정이 없어요</p>
                <p className="text-sm mb-5">프로젝트 보드에서 업무를 등록해보세요</p>
                <Link href="/projects" className="text-sm font-medium text-[#2563EB] hover:underline">
                  프로젝트 보드로 이동 →
                </Link>
              </div>
            ) : (
              <div className="p-5">
                <TeamCalendar events={events} />
              </div>
            )}
          </div>
        </section>

      </main>
    </div>
  );
}
