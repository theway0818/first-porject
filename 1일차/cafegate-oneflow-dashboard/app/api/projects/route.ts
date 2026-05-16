import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function GET() {
  try {
    const projects = await prisma.project.findMany({
      include: { tasks: true, codeRequests: true },
      orderBy: { launchDate: "asc" },
    });
    return NextResponse.json(projects);
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "프로젝트 조회 실패" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const supabase = createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });
  }

  try {
    const body = await req.json();
    const projectName = (body.projectName ?? "").toString().trim();
    const launchDate = body.launchDate ? new Date(body.launchDate) : null;
    const status = (body.status ?? "PLANNING").toString();
    const description = body.description ? body.description.toString() : null;

    if (!projectName) {
      return NextResponse.json({ error: "프로젝트명을 입력해주세요." }, { status: 400 });
    }
    if (!launchDate || Number.isNaN(launchDate.getTime())) {
      return NextResponse.json({ error: "런칭 예정일을 올바르게 입력해주세요." }, { status: 400 });
    }

    const created = await prisma.project.create({
      data: { projectName, launchDate, status, description },
    });
    return NextResponse.json(created, { status: 201 });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "프로젝트 생성 실패" }, { status: 500 });
  }
}
