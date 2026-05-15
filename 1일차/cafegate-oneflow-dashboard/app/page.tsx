export const dynamic = "force-dynamic";

import Link from "next/link";
import { prisma } from "@/lib/prisma";
import TeamCalendar, { CalendarEvent } from "@/components/TeamCalendar";

const roles = [
  {
    id: "purchasing",
    label: "구매물류팀",
    emoji: "📦",
    description: "코드 요청 트래킹 · KPI 대시보드 · CJ 요청 관리",
    href: "/dashboard/purchasing",
    color: "bg-[#6B4226] text-white hover:bg-[#8B5A3A]",
  },
  {
    id: "menu-dev",
    label: "메뉴개발팀",
    emoji: "🍵",
    description: "신규 코드 요청 등록 · 프로젝트 현황 확인",
    href: "/request/new",
    color: "bg-amber-700 text-white hover:bg-amber-800",
  },
  {
    id: "operations",
    label: "운영팀",
    emoji: "🏪",
    description: "코드 요청 접수 · 진행 상황 확인",
    href: "/request/new",
    color: "bg-amber-600 text-white hover:bg-amber-700",
  },
  {
    id: "executive",
    label: "본부장",
    emoji: "📊",
    description: "KPI 현황 · SCQA 보고 · 주요 이슈",
    href: "/executive",
    color: "bg-stone-700 text-white hover:bg-stone-800",
  },
];

function toDateStr(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

async function getCalendarEvents(): Promise<CalendarEvent[]> {
  const events: CalendarEvent[] = [];

  // 프로젝트 업무 태스크
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

  // CJ 납기 예정인 코드 요청
  const deliveries = await prisma.codeRequest.findMany({
    where: {
      cjDeliveryDate: { not: null },
      completed: false,
    },
    select: {
      id: true,
      productName: true,
      requestTeam: true,
      cjDeliveryDate: true,
      status: true,
    },
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
    <div className="min-h-screen bg-[#FAF6F0]">
      <header className="bg-white border-b border-amber-100 px-6 py-4">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xl font-black tracking-tight text-[#6B4226]">ONE</span>
            <span className="text-xl font-black tracking-tight text-amber-500">FLOW</span>
            <span className="text-sm font-medium text-gray-400 ml-1 border-l border-amber-200 pl-2">대시보드</span>
          </div>
          <div className="text-sm text-gray-500">{today}</div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-8 space-y-8">
        {/* 팀 입장 카드 */}
        <section>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {roles.map((role) => (
              <Link key={role.id} href={role.href}>
                <div className={`rounded-2xl p-4 transition-all cursor-pointer shadow-sm hover:shadow-lg ${role.color}`}>
                  <div className="text-3xl mb-2">{role.emoji}</div>
                  <h2 className="font-bold text-base mb-0.5">{role.label}</h2>
                  <p className="text-xs opacity-75 leading-relaxed">{role.description}</p>
                </div>
              </Link>
            ))}
          </div>
        </section>

        {/* 업무 일정 달력 */}
        <section>
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-bold text-[#6B4226] text-sm uppercase tracking-wide">팀별 업무 일정</h2>
            <div className="flex gap-2">
              <Link href="/projects" className="text-xs text-[#6B4226] border border-amber-200 rounded-full px-3 py-1 hover:bg-amber-50">
                🗂 프로젝트 보드
              </Link>
              <Link href="/request/new" className="text-xs text-[#6B4226] border border-amber-200 rounded-full px-3 py-1 hover:bg-amber-50">
                ➕ 요청 등록
              </Link>
            </div>
          </div>
          <div className="bg-white rounded-2xl shadow-sm border border-amber-50 p-4">
            {events.length === 0 ? (
              <div className="text-center py-16 text-gray-400">
                <div className="text-4xl mb-3">📅</div>
                <div className="font-medium">등록된 업무 일정이 없어요</div>
                <div className="text-sm mt-1">프로젝트 보드에서 업무를 등록해보세요</div>
                <Link href="/projects" className="mt-4 inline-block text-sm text-[#6B4226] underline">
                  프로젝트 보드로 이동
                </Link>
              </div>
            ) : (
              <TeamCalendar events={events} />
            )}
          </div>
        </section>
      </main>
    </div>
  );
}
