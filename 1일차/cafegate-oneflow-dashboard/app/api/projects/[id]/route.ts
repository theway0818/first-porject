import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(_: Request, { params }: { params: { id: string } }) {
  try {
    const id = parseInt(params.id);
    if (isNaN(id)) return NextResponse.json({ error: "잘못된 id" }, { status: 400 });

    const project = await prisma.project.findUnique({
      where: { id },
      include: { tasks: true, codeRequests: true },
    });
    if (!project) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json(project);
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "프로젝트 조회 실패" }, { status: 500 });
  }
}
