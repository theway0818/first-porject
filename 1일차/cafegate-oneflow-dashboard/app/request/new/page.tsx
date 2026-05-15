"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import ExcelUpload from "@/components/ExcelUpload";
import OneFlowLogo from "@/components/OneFlowLogo";

interface Project {
  id: number;
  projectName: string;
}

interface FormData {
  productName: string;
  category: string;
  storageType: string;
  supplierName: string;
  supplierContact: string;
  supplierPhone: string;
  supplierEmail: string;
  shelfLife: string;
  leadTime: string;
  monthlyUsage: string;
  initialOrderQty: string;
  cjDeliveryDate: string;
  taxType: string;
  unitWeight: string;
  packBoxQty: string;
  requestType: string;
  requestTeam: string;
  requesterName: string;
  projectId: string;
  note: string;
}

const INITIAL: FormData = {
  productName: "", category: "", storageType: "실온",
  supplierName: "", supplierContact: "", supplierPhone: "", supplierEmail: "",
  shelfLife: "", leadTime: "", monthlyUsage: "", initialOrderQty: "",
  cjDeliveryDate: "", taxType: "과세", unitWeight: "", packBoxQty: "",
  requestType: "NEW", requestTeam: "MENU_DEV", requesterName: "", projectId: "", note: "",
};

const STATUS_LABELS: Record<string, string> = {
  DRAFT: "초안", RECEIVED: "접수됨", CJ_REQUESTED: "CJ요청완료", COMPLETED: "완료",
};

export default function NewRequestPage() {
  const [tab, setTab] = useState<"manual" | "excel">("manual");
  const [form, setForm] = useState<FormData>(INITIAL);
  const [projects, setProjects] = useState<Project[]>([]);
  const [submitted, setSubmitted] = useState(false);
  const [bulkResult, setBulkResult] = useState<number | null>(null);
  const [myRequests, setMyRequests] = useState<{ id: number; productName: string; status: string; receivedDate: string }[]>([]);

  useEffect(() => {
    fetch("/api/projects")
      .then((r) => r.ok ? r.json() : [])
      .then(setProjects)
      .catch(() => {});
  }, []);

  const set = (k: keyof FormData) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setForm((prev) => ({ ...prev, [k]: e.target.value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload = {
      ...form,
      leadTime: form.leadTime ? parseInt(form.leadTime) : null,
      monthlyUsage: form.monthlyUsage ? parseInt(form.monthlyUsage) : null,
      initialOrderQty: form.initialOrderQty ? parseInt(form.initialOrderQty) : null,
      unitWeight: form.unitWeight ? parseFloat(form.unitWeight) : null,
      packBoxQty: form.packBoxQty ? parseInt(form.packBoxQty) : null,
      projectId: form.projectId ? parseInt(form.projectId) : null,
      cjDeliveryDate: form.cjDeliveryDate || null,
      receivedConfirmed: false,
      status: "DRAFT",
    };
    try {
      const res = await fetch("/api/code-requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) { alert("등록에 실패했습니다. 다시 시도해주세요."); return; }
      const created = await res.json();
      setMyRequests((prev) => [{ id: created.id, productName: created.productName, status: created.status, receivedDate: created.receivedDate }, ...prev]);
      setForm(INITIAL);
      setSubmitted(true);
      setTimeout(() => setSubmitted(false), 4000);
    } catch {
      alert("네트워크 오류가 발생했습니다.");
    }
  };

  const inputCls = "w-full border border-[#E2E8F0] rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#BFDBFE] bg-white text-[#0F172A] placeholder:text-[#CBD5E1]";
  const labelCls = "text-xs font-medium text-[#475569] mb-1.5 block tracking-wide";

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-[#0F172A]">

      <header className="sticky top-0 z-50 bg-white/90 backdrop-blur-md border-b border-[#F1F5F9]">
        <div className="max-w-3xl mx-auto px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/"><OneFlowLogo variant="icon" height={28} /></Link>
            <div className="border-l border-[#E2E8F0] pl-3">
              <p className="text-sm font-bold text-[#0F172A]">코드 요청 등록</p>
              <p className="text-xs text-[#94A3B8]">구매물류팀 단일 창구</p>
            </div>
          </div>
          <Link href="/" className="text-xs text-[#94A3B8] hover:text-[#475569] transition-colors">← 홈</Link>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-6 py-10">

        {/* 탭 */}
        <div className="flex gap-1 p-1 bg-[#F1F5F9] rounded-2xl mb-8">
          {(["manual", "excel"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`flex-1 py-2.5 rounded-xl text-sm font-medium transition-all ${
                tab === t ? "bg-white text-[#0F172A] shadow-sm" : "text-[#94A3B8] hover:text-[#475569]"
              }`}
            >
              {t === "manual" ? "직접 작성" : "엑셀 업로드"}
            </button>
          ))}
        </div>

        {/* 알림 */}
        {submitted && (
          <div className="mb-6 bg-[#DCFCE7] border border-[#BBF7D0] text-[#16A34A] rounded-2xl p-4 text-sm font-medium">
            접수 완료되었습니다. 처리 상황은 아래에서 확인하세요.
          </div>
        )}
        {bulkResult !== null && (
          <div className="mb-6 bg-[#DCFCE7] border border-[#BBF7D0] text-[#16A34A] rounded-2xl p-4 text-sm font-medium">
            {bulkResult}건이 일괄 등록되었습니다.
          </div>
        )}

        {/* 엑셀 탭 */}
        {tab === "excel" && (
          <div className="bg-white rounded-2xl p-6 border border-[#E2E8F0]">
            <p className="text-xs font-medium text-[#94A3B8] tracking-widest uppercase mb-4">엑셀 일괄 등록</p>
            <ExcelUpload
              onSuccess={(count) => {
                setBulkResult(count);
                setTimeout(() => setBulkResult(null), 5000);
              }}
            />
          </div>
        )}

        {/* 수기 작성 탭 */}
        {tab === "manual" && (
          <form onSubmit={handleSubmit} className="space-y-5">

            {/* 섹션 A */}
            <div className="bg-white rounded-2xl p-6 border border-[#E2E8F0]">
              <p className="text-xs font-medium text-[#94A3B8] tracking-widest uppercase mb-5 pb-3 border-b border-[#F1F5F9]">업체 · 제품 정보</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2">
                  <label className={labelCls}>제품명 <span className="text-[#EF4444]">*</span></label>
                  <input required className={inputCls} value={form.productName} onChange={set("productName")} placeholder="제품명을 입력하세요" />
                </div>
                <div>
                  <label className={labelCls}>상품군</label>
                  <select className={inputCls} value={form.category} onChange={set("category")}>
                    <option value="">선택</option>
                    <option>음료베이스</option>
                    <option>원재료</option>
                    <option>포장재</option>
                    <option>소모품</option>
                  </select>
                </div>
                <div>
                  <label className={labelCls}>보관방법</label>
                  <select className={inputCls} value={form.storageType} onChange={set("storageType")}>
                    <option>실온</option>
                    <option>냉장</option>
                    <option>냉동</option>
                  </select>
                </div>
                <div>
                  <label className={labelCls}>업체명 <span className="text-[#EF4444]">*</span></label>
                  <input required className={inputCls} value={form.supplierName} onChange={set("supplierName")} placeholder="(주)베리팜" />
                </div>
                <div>
                  <label className={labelCls}>담당자</label>
                  <input className={inputCls} value={form.supplierContact} onChange={set("supplierContact")} />
                </div>
                <div>
                  <label className={labelCls}>연락처</label>
                  <input className={inputCls} value={form.supplierPhone} onChange={set("supplierPhone")} placeholder="02-1234-5678" />
                </div>
                <div>
                  <label className={labelCls}>이메일</label>
                  <input type="email" className={inputCls} value={form.supplierEmail} onChange={set("supplierEmail")} />
                </div>
              </div>
            </div>

            {/* 섹션 B */}
            <div className="bg-white rounded-2xl p-6 border border-[#E2E8F0]">
              <p className="text-xs font-medium text-[#94A3B8] tracking-widest uppercase mb-5 pb-3 border-b border-[#F1F5F9]">물류 · 수량 정보</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className={labelCls}>소비기한</label>
                  <input className={inputCls} value={form.shelfLife} onChange={set("shelfLife")} placeholder="제조일로부터 12개월" />
                </div>
                <div>
                  <label className={labelCls}>리드타임 (일)</label>
                  <input type="number" className={inputCls} value={form.leadTime} onChange={set("leadTime")} placeholder="7" />
                </div>
                <div>
                  <label className={labelCls}>월 예상 사용량</label>
                  <input type="number" className={inputCls} value={form.monthlyUsage} onChange={set("monthlyUsage")} />
                </div>
                <div>
                  <label className={labelCls}>초도 입고수량</label>
                  <input type="number" className={inputCls} value={form.initialOrderQty} onChange={set("initialOrderQty")} />
                </div>
                <div>
                  <label className={labelCls}>CJ센터 납기요청일</label>
                  <input type="date" className={inputCls} value={form.cjDeliveryDate} onChange={set("cjDeliveryDate")} />
                </div>
                <div>
                  <label className={labelCls}>과세 여부</label>
                  <select className={inputCls} value={form.taxType} onChange={set("taxType")}>
                    <option>과세</option>
                    <option>면세</option>
                  </select>
                </div>
                <div>
                  <label className={labelCls}>날개중량 (g)</label>
                  <input type="number" className={inputCls} value={form.unitWeight} onChange={set("unitWeight")} />
                </div>
                <div>
                  <label className={labelCls}>팩/박스 입수량</label>
                  <input type="number" className={inputCls} value={form.packBoxQty} onChange={set("packBoxQty")} />
                </div>
              </div>
            </div>

            {/* 요청 정보 */}
            <div className="bg-white rounded-2xl p-6 border border-[#E2E8F0]">
              <p className="text-xs font-medium text-[#94A3B8] tracking-widest uppercase mb-5 pb-3 border-b border-[#F1F5F9]">요청 정보</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className={labelCls}>요청 유형</label>
                  <select className={inputCls} value={form.requestType} onChange={set("requestType")}>
                    <option value="NEW">신규 등록</option>
                    <option value="CHANGE">스펙 변경</option>
                    <option value="DELETE">코드 삭제</option>
                  </select>
                </div>
                <div>
                  <label className={labelCls}>요청 팀</label>
                  <select className={inputCls} value={form.requestTeam} onChange={set("requestTeam")}>
                    <option value="MENU_DEV">메뉴개발팀</option>
                    <option value="OPERATIONS">운영팀</option>
                    <option value="PURCHASING">구매물류팀</option>
                  </select>
                </div>
                <div>
                  <label className={labelCls}>요청자명 <span className="text-[#EF4444]">*</span></label>
                  <input required className={inputCls} value={form.requesterName} onChange={set("requesterName")} placeholder="홍길동" />
                </div>
                <div>
                  <label className={labelCls}>소속 프로젝트</label>
                  <select className={inputCls} value={form.projectId} onChange={set("projectId")}>
                    <option value="">선택 안 함</option>
                    {projects.map((p) => (
                      <option key={p.id} value={p.id}>{p.projectName}</option>
                    ))}
                  </select>
                </div>
                <div className="sm:col-span-2">
                  <label className={labelCls}>비고</label>
                  <textarea className={inputCls} rows={2} value={form.note} onChange={set("note")} placeholder="특이사항을 입력해주세요" />
                </div>
              </div>
            </div>

            <button
              type="submit"
              className="w-full bg-[#0F172A] text-white py-3.5 rounded-2xl font-bold text-sm hover:bg-[#1E293B] transition-colors"
            >
              접수하기
            </button>
          </form>
        )}

        {/* 등록 이력 */}
        {myRequests.length > 0 && (
          <div className="mt-10">
            <p className="text-xs font-medium text-[#94A3B8] tracking-widest uppercase mb-3">내 등록 이력</p>
            <div className="bg-white rounded-2xl border border-[#E2E8F0] divide-y divide-[#F8FAFC]">
              {myRequests.map((r) => (
                <div key={r.id} className="px-5 py-3 flex items-center justify-between text-sm">
                  <span className="font-medium text-[#0F172A]">{r.productName}</span>
                  <span className="text-xs text-[#94A3B8]">{STATUS_LABELS[r.status] ?? r.status}</span>
                </div>
              ))}
            </div>
          </div>
        )}

      </main>
    </div>
  );
}
