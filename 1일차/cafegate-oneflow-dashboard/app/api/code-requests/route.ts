import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { apiLogger } from "@/lib/logger";

const logger = apiLogger("api/code-requests");

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status");
    const team = searchParams.get("team");

    const where: Record<string, string> = {};
    if (status) where.status = status;
    if (team) where.requestTeam = team;

    const requests = await prisma.codeRequest.findMany({
      where,
      include: { project: true },
      orderBy: { receivedDate: "desc" },
    });
    return NextResponse.json(requests);
  } catch (e) {
    logger.error("GET 조회 실패", e);
    return NextResponse.json({ error: "데이터 조회 실패" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const created = await prisma.codeRequest.create({ data: body });
    logger.info(`POST 등록 완료 id=${created.id}`);
    return NextResponse.json(created, { status: 201 });
  } catch (e) {
    logger.error("POST 등록 실패", e);
    return NextResponse.json({ error: "등록 실패" }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();
    const { id, ...data } = body;
    if (!id) return NextResponse.json({ error: "id 필요" }, { status: 400 });
    const updated = await prisma.codeRequest.update({ where: { id: Number(id) }, data });
    logger.info(`PATCH 수정 완료 id=${id}`);
    return NextResponse.json(updated);
  } catch (e) {
    logger.error("PATCH 수정 실패", e);
    return NextResponse.json({ error: "업데이트 실패" }, { status: 500 });
  }
}
