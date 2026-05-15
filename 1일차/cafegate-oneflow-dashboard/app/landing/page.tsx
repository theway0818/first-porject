import Link from "next/link";
import OneFlowLogo from "@/components/OneFlowLogo";

const features = [
  {
    number: "01",
    title: "요청이 사라지지 않습니다",
    description: "카카오톡에 묻히던 업무 요청이 ONE FLOW 안에서 접수되고, 처리될 때까지 추적됩니다.",
  },
  {
    number: "02",
    title: "임원이 보고서를 기다리지 않습니다",
    description: "KPI와 프로젝트 현황은 실시간으로 갱신됩니다. 보고서 수작업은 없습니다.",
  },
  {
    number: "03",
    title: "마감을 팀이 함께 압니다",
    description: "일정과 태스크가 팀 전체에 공유됩니다. 누군가만 알고 있는 마감은 없습니다.",
  },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white text-[#0F172A]">

      {/* ── HEADER ── */}
      <header className="sticky top-0 z-50 bg-white/90 backdrop-blur-md border-b border-[#F1F5F9]">
        <div className="max-w-5xl mx-auto px-6 h-14 flex items-center justify-between">
          <OneFlowLogo variant="horizontal" height={32} />
          <Link
            href="/"
            className="text-xs font-medium bg-[#0F172A] text-white px-5 py-2 rounded-full hover:bg-[#1E293B] transition-colors"
          >
            앱으로 이동 →
          </Link>
        </div>
      </header>

      {/* ── HERO ── */}
      <section className="max-w-5xl mx-auto px-6 pt-28 pb-32 text-center">
        <p className="text-sm font-medium text-[#2563EB] tracking-widest uppercase mb-8">
          운영팀 업무 흐름 관리
        </p>
        <h1 className="text-5xl sm:text-7xl font-black tracking-tight leading-[1.05] mb-6">
          모든 업무.<br />
          <span className="text-[#2563EB]">하나의 흐름으로.</span>
        </h1>
        <p className="text-lg text-[#64748B] max-w-sm mx-auto leading-relaxed mb-12">
          업무 정보의 파편화를 끝냅니다.
        </p>
        <Link
          href="/"
          className="inline-flex items-center gap-2 bg-[#0F172A] text-white px-8 py-4 rounded-full text-sm font-medium hover:bg-[#1E293B] transition-colors"
        >
          팀으로 입장하기
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <path d="M2 7h10M7 2l5 5-5 5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </Link>
      </section>

      {/* ── DIVIDER ── */}
      <div className="max-w-5xl mx-auto px-6">
        <div className="border-t border-[#E2E8F0]" />
      </div>

      {/* ── FEATURES ── */}
      <section className="max-w-5xl mx-auto px-6 py-24">
        <p className="text-xs font-medium text-[#94A3B8] tracking-widest uppercase mb-12">왜 ONE FLOW인가</p>
        <div className="space-y-0">
          {features.map((f, i) => (
            <div
              key={i}
              className="grid sm:grid-cols-[72px_1fr] gap-6 py-10 border-b border-[#F1F5F9] last:border-none"
            >
              <span className="text-3xl font-black text-[#E2E8F0] leading-none pt-1 select-none">{f.number}</span>
              <div>
                <h3 className="text-xl font-bold text-[#0F172A] mb-2">{f.title}</h3>
                <p className="text-[#64748B] leading-relaxed max-w-lg">{f.description}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── DIVIDER ── */}
      <div className="max-w-5xl mx-auto px-6">
        <div className="border-t border-[#E2E8F0]" />
      </div>

      {/* ── BRAND STATEMENT ── */}
      <section className="max-w-5xl mx-auto px-6 py-28 text-center">
        <p className="text-2xl sm:text-3xl font-bold text-[#0F172A] max-w-xl mx-auto leading-snug mb-6">
          "우리 팀이 지금 어디에 있는지,<br />
          <span className="text-[#2563EB]">나는 알고 있다."</span>
        </p>
        <p className="text-sm text-[#94A3B8] leading-relaxed max-w-sm mx-auto">
          ONE FLOW가 운영팀에게 드리는 단 하나의 약속입니다.
        </p>
      </section>

      {/* ── FOOTER ── */}
      <footer className="border-t border-[#F1F5F9]">
        <div className="max-w-5xl mx-auto px-6 py-8 flex items-center justify-between">
          <OneFlowLogo variant="icon" height={24} />
          <p className="text-xs text-[#CBD5E1] tracking-widest uppercase">All Work. One Flow.</p>
        </div>
      </footer>

    </div>
  );
}
