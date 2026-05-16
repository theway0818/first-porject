import Link from "next/link";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export default async function AuthMenu() {
  const supabase = createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return (
      <div className="flex items-center gap-2">
        <Link
          href="/login"
          className="text-xs font-medium text-[#475569] px-3 py-2 rounded-full hover:bg-[#F1F5F9] transition-colors"
        >
          로그인
        </Link>
        <Link
          href="/signup"
          className="text-xs font-medium border border-[#E2E8F0] text-[#0F172A] px-4 py-2 rounded-full hover:border-[#CBD5E1] transition-colors"
        >
          회원가입
        </Link>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <span className="text-xs text-[#475569] hidden sm:inline-block max-w-[160px] truncate">
        {user.email}
      </span>
      <form action="/auth/signout" method="post">
        <button
          type="submit"
          className="text-xs font-medium text-[#475569] px-3 py-2 rounded-full hover:bg-[#F1F5F9] transition-colors"
        >
          로그아웃
        </button>
      </form>
    </div>
  );
}
