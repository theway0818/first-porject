"use client";

import { useState } from "react";

interface CodeRequest {
  id: number;
  productName: string;
  requestType: string;
  requestTeam: string;
  requesterName: string;
  receivedDate: string;
  receivedConfirmed: boolean;
  cjRequested: boolean;
  cjRequestedDate: string | null;
  completed: boolean;
  completedDate: string | null;
  status: string;
  note: string | null;
  project?: { projectName: string } | null;
}

interface TrackingTableProps {
  requests: CodeRequest[];
  onUpdate: (id: number, data: Partial<CodeRequest>) => void;
}

const STATUS_LABELS: Record<string, string> = {
  DRAFT: "초안",
  RECEIVED: "접수됨",
  CJ_REQUESTED: "CJ요청완료",
  COMPLETED: "완료",
  REJECTED: "반려",
};

const TEAM_LABELS: Record<string, string> = {
  MENU_DEV: "메뉴개발",
  OPERATIONS: "운영",
  PURCHASING: "구매물류",
};

const TYPE_LABELS: Record<string, string> = {
  NEW: "신규",
  CHANGE: "변경",
  DELETE: "삭제",
};

export default function TrackingTable({ requests, onUpdate }: TrackingTableProps) {
  const [filterStatus, setFilterStatus] = useState("");
  const [filterTeam, setFilterTeam] = useState("");
  const [selected, setSelected] = useState<CodeRequest | null>(null);

  const filtered = requests.filter((r) => {
    if (filterStatus && r.status !== filterStatus) return false;
    if (filterTeam && r.requestTeam !== filterTeam) return false;
    return true;
  });

  const formatDate = (d: string) =>
    new Date(d).toLocaleDateString("ko-KR", { month: "2-digit", day: "2-digit" });

  const statusColor = (status: string) => {
    if (status === "COMPLETED") return "bg-green-100 text-green-800";
    if (status === "CJ_REQUESTED") return "bg-blue-100 text-blue-800";
    if (status === "RECEIVED") return "bg-yellow-100 text-yellow-800";
    if (status === "REJECTED") return "bg-gray-100 text-gray-600";
    return "bg-gray-100 text-gray-500";
  };

  return (
    <div>
      {/* 필터 */}
      <div className="flex gap-3 mb-4 flex-wrap">
        <select
          className="border border-amber-200 rounded-lg px-3 py-2 text-sm bg-white"
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
        >
          <option value="">전체 상태</option>
          {Object.entries(STATUS_LABELS).map(([v, l]) => (
            <option key={v} value={v}>{l}</option>
          ))}
        </select>
        <select
          className="border border-amber-200 rounded-lg px-3 py-2 text-sm bg-white"
          value={filterTeam}
          onChange={(e) => setFilterTeam(e.target.value)}
        >
          <option value="">전체 팀</option>
          {Object.entries(TEAM_LABELS).map(([v, l]) => (
            <option key={v} value={v}>{l}</option>
          ))}
        </select>
        <span className="ml-auto text-sm text-gray-500 self-center">총 {filtered.length}건</span>
      </div>

      {/* 테이블 */}
      <div className="overflow-x-auto rounded-xl border border-amber-100">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-[#6B4226] text-white">
              <th className="px-3 py-3 text-left font-medium">접수일</th>
              <th className="px-3 py-3 text-left font-medium">품목명</th>
              <th className="px-3 py-3 text-left font-medium">유형</th>
              <th className="px-3 py-3 text-left font-medium">요청팀</th>
              <th className="px-3 py-3 text-center font-medium">접수확인</th>
              <th className="px-3 py-3 text-center font-medium">CJ요청</th>
              <th className="px-3 py-3 text-center font-medium">완료</th>
              <th className="px-3 py-3 text-left font-medium">상태</th>
              <th className="px-3 py-3 text-left font-medium">비고</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((r, i) => (
              <tr
                key={r.id}
                className={`cursor-pointer hover:bg-amber-50 transition-colors border-b border-amber-50 ${i % 2 === 0 ? "bg-white" : "bg-[#FAF6F0]"}`}
                onClick={() => setSelected(r)}
              >
                <td className="px-3 py-3 text-gray-600">{formatDate(r.receivedDate)}</td>
                <td className="px-3 py-3 font-medium max-w-[180px] truncate">{r.productName}</td>
                <td className="px-3 py-3">{TYPE_LABELS[r.requestType] ?? r.requestType}</td>
                <td className="px-3 py-3">{TEAM_LABELS[r.requestTeam] ?? r.requestTeam}</td>
                <td className="px-3 py-3 text-center">{r.receivedConfirmed ? "✅" : "⬜"}</td>
                <td className="px-3 py-3 text-center">{r.cjRequested ? "✅" : "⬜"}</td>
                <td className="px-3 py-3 text-center">{r.completed ? "✅" : "⬜"}</td>
                <td className="px-3 py-3">
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusColor(r.status)}`}>
                    {STATUS_LABELS[r.status] ?? r.status}
                  </span>
                </td>
                <td className="px-3 py-3 text-gray-500 max-w-[120px] truncate">{r.note ?? "-"}</td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={9} className="text-center py-10 text-gray-400">
                  해당하는 요청이 없습니다
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* 상세 모달 */}
      {selected && (
        <div
          className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4"
          onClick={() => setSelected(null)}
        >
          <div
            className="bg-white rounded-2xl p-6 max-w-lg w-full shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between mb-4">
              <h3 className="font-bold text-lg text-[#6B4226]">{selected.productName}</h3>
              <button onClick={() => setSelected(null)} className="text-gray-400 hover:text-gray-600 text-xl">×</button>
            </div>
            <div className="space-y-2 text-sm">
              <Row label="요청팀" value={TEAM_LABELS[selected.requestTeam] ?? selected.requestTeam} />
              <Row label="요청자" value={selected.requesterName} />
              <Row label="요청유형" value={TYPE_LABELS[selected.requestType] ?? selected.requestType} />
              <Row label="접수일" value={new Date(selected.receivedDate).toLocaleDateString("ko-KR")} />
              <Row label="프로젝트" value={selected.project?.projectName ?? "-"} />
              <Row label="상태" value={STATUS_LABELS[selected.status] ?? selected.status} />
              <Row label="CJ요청일" value={selected.cjRequestedDate ? new Date(selected.cjRequestedDate).toLocaleDateString("ko-KR") : "-"} />
              <Row label="비고" value={selected.note ?? "-"} />
            </div>
            <div className="flex gap-2 mt-5">
              {!selected.receivedConfirmed && (
                <button
                  className="flex-1 bg-amber-600 text-white rounded-lg py-2 text-sm font-medium hover:bg-amber-700"
                  onClick={() => { onUpdate(selected.id, { receivedConfirmed: true, status: "RECEIVED" }); setSelected(null); }}
                >
                  접수 확인
                </button>
              )}
              {selected.receivedConfirmed && !selected.cjRequested && (
                <button
                  className="flex-1 bg-blue-600 text-white rounded-lg py-2 text-sm font-medium hover:bg-blue-700"
                  onClick={() => { onUpdate(selected.id, { cjRequested: true, cjRequestedDate: new Date().toISOString(), status: "CJ_REQUESTED" }); setSelected(null); }}
                >
                  CJ 요청 완료 처리
                </button>
              )}
              {selected.cjRequested && !selected.completed && (
                <button
                  className="flex-1 bg-green-600 text-white rounded-lg py-2 text-sm font-medium hover:bg-green-700"
                  onClick={() => { onUpdate(selected.id, { completed: true, completedDate: new Date().toISOString(), status: "COMPLETED" }); setSelected(null); }}
                >
                  완료 처리
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex gap-3">
      <span className="w-24 text-gray-500 flex-shrink-0">{label}</span>
      <span className="font-medium text-gray-800">{value}</span>
    </div>
  );
}
