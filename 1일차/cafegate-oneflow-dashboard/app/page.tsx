import Link from "next/link";

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

export default function HomePage() {
  const today = new Date().toLocaleDateString("ko-KR", {
    year: "numeric",
    month: "long",
    day: "numeric",
    weekday: "long",
  });

  return (
    <div className="min-h-screen bg-[#FAF6F0]">
      <header className="bg-white border-b border-amber-100 px-6 py-4">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-[#6B4226] rounded-xl flex items-center justify-center text-white font-bold text-sm">
              CG
            </div>
            <div>
              <div className="font-bold text-[#6B4226] text-base leading-tight">카페게이트</div>
              <div className="text-xs text-gray-500">ONE FLOW 대시보드</div>
            </div>
          </div>
          <div className="text-sm text-gray-500">{today}</div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-12">
        <div className="text-center mb-10">
          <h1 className="text-3xl font-bold text-[#6B4226] mb-2">어떤 팀으로 입장할까요?</h1>
          <p className="text-gray-500 text-sm">역할에 맞는 대시보드로 이동합니다</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          {roles.map((role) => (
            <Link key={role.id} href={role.href}>
              <div className={`rounded-2xl p-6 transition-all cursor-pointer shadow-sm hover:shadow-lg ${role.color}`}>
                <div className="text-4xl mb-3">{role.emoji}</div>
                <h2 className="font-bold text-xl mb-1">{role.label}</h2>
                <p className="text-sm opacity-80 leading-relaxed">{role.description}</p>
              </div>
            </Link>
          ))}
        </div>

        <div className="mt-10 flex flex-wrap gap-3 justify-center">
          <Link href="/projects" className="text-sm text-[#6B4226] border border-amber-200 rounded-full px-4 py-2 hover:bg-amber-50">
            🗂 프로젝트 협업 보드
          </Link>
          <Link href="/request/new" className="text-sm text-[#6B4226] border border-amber-200 rounded-full px-4 py-2 hover:bg-amber-50">
            ➕ 코드 요청 등록
          </Link>
          <Link href="/executive" className="text-sm text-[#6B4226] border border-amber-200 rounded-full px-4 py-2 hover:bg-amber-50">
            📋 본부장 보고 뷰
          </Link>
        </div>
      </main>
    </div>
  );
}
