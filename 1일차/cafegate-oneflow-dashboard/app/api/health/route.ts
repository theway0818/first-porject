import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  const checks: Record<string, string> = {};

  // DB 연결 확인
  try {
    await prisma.$queryRaw`SELECT 1`;
    checks.database = "ok";
  } catch (e) {
    checks.database = `error: ${e instanceof Error ? e.message : String(e)}`;
  }

  // 환경변수 확인 (값은 노출 안 함)
  checks.DATABASE_URL = process.env.DATABASE_URL ? "set" : "MISSING";
  checks.JWT_SECRET   = process.env.JWT_SECRET   ? "set" : "MISSING";
  checks.NODE_ENV     = process.env.NODE_ENV ?? "unknown";

  const allOk = Object.values(checks).every((v) => v === "ok" || v === "set" || v !== "MISSING");

  return NextResponse.json(
    { status: allOk ? "healthy" : "degraded", checks, ts: new Date().toISOString() },
    { status: allOk ? 200 : 503 }
  );
}
