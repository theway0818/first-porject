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
  const diff = Math.ceil(
    (new Date(dateStr).getTime() - Date.now()) / 86400000
  );
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

  const daysToTue = day <= 2 ? 2 - day : 9 - day;
  const daysToThu = day <= 4 ? 4 - day : 11 - day;

  tuesday.setDate(now.getDate() + daysToTue);
  thursday.setDate(now.getDate() + daysToThu);

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
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <GroupCard
        title={`화요일 CJ 요청 예정`}
        subtitle={formatDate(tuesday)}
        items={tueSend}
        color="blue"
      />
      <GroupCard
        title={`목요일 CJ 요청 예정`}
        subtitle={formatDate(thursday)}
        items={thuSend}
        color="purple"
      />
    </div>
  );
}

function GroupCard({
  title,
  subtitle,
  items,
  color,
}: {
  title: string;
  subtitle: string;
  items: CodeRequest[];
  color: "blue" | "purple";
}) {
  const bg = color === "blue" ? "bg-blue-50 border-blue-200" : "bg-purple-50 border-purple-200";
  const header = color === "blue" ? "text-blue-800" : "text-purple-800";

  return (
    <div className={`border-2 rounded-xl p-4 ${bg}`}>
      <div className="flex items-center justify-between mb-1">
        <h4 className={`font-bold text-sm ${header}`}>{title}</h4>
        <span className={`text-xs ${header} opacity-70`}>{subtitle}</span>
      </div>
      {items.length === 0 ? (
        <p className="text-sm text-gray-500 mt-2">요청 예정 항목 없음</p>
      ) : (
        <ul className="mt-2 space-y-1">
          {items.map((r) => (
            <li key={r.id} className="text-sm flex items-center justify-between">
              <span className="font-medium truncate max-w-[160px]">{r.productName}</span>
              <span className="text-xs text-gray-500 ml-2 flex-shrink-0">
                {r.cjDeliveryDate ? getDday(r.cjDeliveryDate) : ""}
              </span>
            </li>
          ))}
        </ul>
      )}
      <div className="mt-2 text-xs text-gray-500">{items.length}건</div>
    </div>
  );
}
