"use client";

interface CodeRequest {
  id: number;
  productName: string;
  cjDeliveryDate: string | null;
  requestTeam: string;
  requesterName: string;
  status: string;
}

interface CjGroupPreviewProps {
  requests: CodeRequest[];
}

function getDday(dateStr: string): string {
  const diff = Math.ceil((new Date(dateStr).getTime() - Date.now()) / 86400000);
  if (diff === 0) return "오늘";
  if (diff === 1) return "내일";
  if (diff < 0) return `D+${Math.abs(diff)}`;
  return `D-${diff}`;
}

function getNextRequestDay(): { tuesday: Date; thursday: Date } {
  const now = new Date();
  const day = now.getDay();
  const tuesday = new Date(now);
  const thursday = new Date(now);
  tuesday.setDate(now.getDate() + (day <= 2 ? 2 - day : 9 - day));
  thursday.setDate(now.getDate() + (day <= 4 ? 4 - day : 11 - day));
  return { tuesday, thursday };
}

export default function CjGroupPreview({ requests }: CjGroupPreviewProps) {
  const pending = requests.filter(
    (r) => !r.status.includes("CJ_REQUESTED") && !r.status.includes("COMPLETED")
  );

  const { tuesday, thursday } = getNextRequestDay();

  const tueSend = pending.filter((r) => {
    if (!r.cjDeliveryDate) return false;
    const diff = (new Date(r.cjDeliveryDate).getTime() - tuesday.getTime()) / 86400000;
    return diff >= 0 && diff <= 7;
  });

  const thuSend = pending.filter((r) => {
    if (!r.cjDeliveryDate) return false;
    const diff = (new Date(r.cjDeliveryDate).getTime() - thursday.getTime()) / 86400000;
    return diff >= 0 && diff <= 7;
  });

  const formatDate = (d: Date) =>
    d.toLocaleDateString("ko-KR", { month: "long", day: "numeric", weekday: "short" });

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
      <GroupCard title="화요일 CJ 요청" date={formatDate(tuesday)} items={tueSend} accent="blue" />
      <GroupCard title="목요일 CJ 요청" date={formatDate(thursday)} items={thuSend} accent="indigo" />
    </div>
  );
}

function GroupCard({
  title,
  date,
  items,
  accent,
}: {
  title: string;
  date: string;
  items: CodeRequest[];
  accent: "blue" | "indigo";
}) {
  const accentColor = accent === "blue" ? "text-[#2563EB]" : "text-[#4F46E5]";
  const dotColor = accent === "blue" ? "bg-[#2563EB]" : "bg-[#4F46E5]";

  return (
    <div className="bg-white border border-[#E2E8F0] rounded-2xl p-5">
      <div className="flex items-center gap-2 mb-1">
        <span className={`w-2 h-2 rounded-full flex-shrink-0 ${dotColor}`} />
        <span className={`text-sm font-bold ${accentColor}`}>{title}</span>
      </div>
      <p className="text-xs text-[#94A3B8] mb-4 pl-4">{date}</p>

      {items.length === 0 ? (
        <p className="text-sm text-[#94A3B8] pl-4">요청 예정 항목 없음</p>
      ) : (
        <ul className="space-y-2">
          {items.map((r) => (
            <li key={r.id} className="flex items-center justify-between text-sm">
              <span className="font-medium text-[#0F172A] truncate max-w-[160px]">{r.productName}</span>
              <span className="text-xs text-[#94A3B8] ml-2 flex-shrink-0">
                {r.cjDeliveryDate ? getDday(r.cjDeliveryDate) : ""}
              </span>
            </li>
          ))}
        </ul>
      )}
      <p className="text-xs text-[#94A3B8] mt-4 pt-3 border-t border-[#F1F5F9]">{items.length}건</p>
    </div>
  );
}
