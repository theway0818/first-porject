"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

const STATUS_OPTIONS = [
  { value: "PLANNING", label: "기획" },
  { value: "IN_PROGRESS", label: "진행 중" },
  { value: "ON_HOLD", label: "보류" },
  { value: "DONE", label: "완료" },
];

export default function NewProjectForm() {
  const router = useRouter();
  const [projectName, setProjectName] = useState("");
  const [launchDate, setLaunchDate] = useState("");
  const [status, setStatus] = useState("PLANNING");
  const [description, setDescription] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const res = await fetch("/api/projects", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ projectName, launchDate, status, description }),
    });

    setLoading(false);

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? `등록 실패 (${res.status})`);
      return;
    }

    router.push("/projects");
    router.refresh();
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-white rounded-2xl border border-[#E2E8F0] p-6 space-y-5"
    >
      <div>
        <label className="block text-xs font-medium text-[#475569] mb-1.5">
          프로젝트명 <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          required
          value={projectName}
          onChange={(e) => setProjectName(e.target.value)}
          className="w-full px-4 py-2.5 text-sm border border-[#E2E8F0] rounded-xl focus:outline-none focus:border-[#0F172A] transition-colors"
          placeholder="예: 2026 봄 신메뉴 라인업"
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-medium text-[#475569] mb-1.5">
            런칭 예정일 <span className="text-red-500">*</span>
          </label>
          <input
            type="date"
            required
            value={launchDate}
            onChange={(e) => setLaunchDate(e.target.value)}
            className="w-full px-4 py-2.5 text-sm border border-[#E2E8F0] rounded-xl focus:outline-none focus:border-[#0F172A] transition-colors"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-[#475569] mb-1.5">
            상태
          </label>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="w-full px-4 py-2.5 text-sm border border-[#E2E8F0] rounded-xl focus:outline-none focus:border-[#0F172A] transition-colors bg-white"
          >
            {STATUS_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div>
        <label className="block text-xs font-medium text-[#475569] mb-1.5">
          설명
        </label>
        <textarea
          rows={4}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="w-full px-4 py-2.5 text-sm border border-[#E2E8F0] rounded-xl focus:outline-none focus:border-[#0F172A] transition-colors resize-none"
          placeholder="프로젝트 목표, 주요 일정, 참고 사항을 자유롭게 적어주세요"
        />
      </div>

      {error && (
        <p className="text-xs text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">
          {error}
        </p>
      )}

      <div className="flex items-center justify-end gap-2 pt-2">
        <button
          type="button"
          onClick={() => router.back()}
          className="text-sm text-[#475569] px-4 py-2.5 rounded-xl hover:bg-[#F1F5F9] transition-colors"
        >
          취소
        </button>
        <button
          type="submit"
          disabled={loading}
          className="text-sm font-medium bg-[#0F172A] text-white px-5 py-2.5 rounded-xl hover:bg-[#1E293B] transition-colors disabled:opacity-50"
        >
          {loading ? "등록 중..." : "프로젝트 등록"}
        </button>
      </div>
    </form>
  );
}
