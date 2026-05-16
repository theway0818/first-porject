"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import OneFlowLogo from "@/components/OneFlowLogo";

export default function SignupPage() {
  const router = useRouter();
  const supabase = createSupabaseBrowserClient();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setInfo(null);
    setLoading(true);

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    });

    setLoading(false);

    if (error) {
      setError(error.message);
      return;
    }

    if (data.session) {
      router.push("/");
      router.refresh();
      return;
    }

    setInfo("가입 확인 메일을 보냈어요. 메일함에서 인증 링크를 눌러주세요.");
  }

  return (
    <div className="min-h-screen bg-white flex items-center justify-center px-6">
      <div className="w-full max-w-sm">
        <div className="flex justify-center mb-8">
          <Link href="/landing">
            <OneFlowLogo variant="horizontal" height={32} />
          </Link>
        </div>

        <h1 className="text-xl font-bold text-[#0F172A] text-center mb-1">회원가입</h1>
        <p className="text-sm text-[#94A3B8] text-center mb-8">
          업무의 흐름, ONE FLOW와 함께
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-[#475569] mb-1.5">
              이메일
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-2.5 text-sm border border-[#E2E8F0] rounded-xl focus:outline-none focus:border-[#0F172A] transition-colors"
              placeholder="you@example.com"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-[#475569] mb-1.5">
              비밀번호
            </label>
            <input
              type="password"
              required
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-2.5 text-sm border border-[#E2E8F0] rounded-xl focus:outline-none focus:border-[#0F172A] transition-colors"
              placeholder="6자 이상"
            />
          </div>

          {error && (
            <p className="text-xs text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">
              {error}
            </p>
          )}
          {info && (
            <p className="text-xs text-emerald-700 bg-emerald-50 border border-emerald-100 rounded-lg px-3 py-2">
              {info}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[#0F172A] text-white text-sm font-medium py-2.5 rounded-xl hover:bg-[#1E293B] transition-colors disabled:opacity-50"
          >
            {loading ? "가입 중..." : "회원가입"}
          </button>
        </form>

        <p className="text-xs text-[#94A3B8] text-center mt-6">
          이미 계정이 있으신가요?{" "}
          <Link href="/login" className="text-[#0F172A] font-medium hover:underline">
            로그인
          </Link>
        </p>
      </div>
    </div>
  );
}
