import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const requests = await prisma.codeRequest.findMany({
      where: { receivedDate: { gte: startOfMonth } },
    });

    const total = requests.length;
    const missing = requests.filter(
      (r) =>
        !r.cjRequested &&
        !r.completed &&
        r.status !== "REJECTED" &&
        (now.getTime() - new Date(r.receivedDate).getTime()) / 86400000 > 7
    ).length;

    const withForm = requests.filter((r) => r.status !== "DRAFT").length;
    const formRate = total > 0 ? Math.round((withForm / total) * 100) : 100;

    const updatedProjects = await prisma.projectTask.count({
      where: {
        weeklyUpdate: { not: "" },
        dueDate: { gte: new Date(now.getTime() - 7 * 86400000) },
      },
    });
    const totalTasks = await prisma.projectTask.count({
      where: { dueDate: { gte: new Date(now.getTime() - 7 * 86400000) } },
    });
    const updateRate = totalTasks > 0 ? Math.round((updatedProjects / totalTasks) * 100) : 100;

    const urgentCj = requests.filter((r) => {
      if (r.cjRequested || r.completed) return false;
      if (!r.cjDeliveryDate || r.leadTime == null) return false;
      const daysLeft = (new Date(r.cjDeliveryDate).getTime() - now.getTime()) / 86400000;
      return daysLeft < r.leadTime + 3;
    }).length;

    const kpis = [
      { name: "이번 달 누락 건수", value: missing, target: 0, unit: "건", status: missing === 0 ? "good" : "bad" },
      { name: "표준 양식 사용률", value: formRate, target: 100, unit: "%", status: formRate === 100 ? "good" : "warn" },
      { name: "공유 문서 업데이트 이행률", value: updateRate, target: 100, unit: "%", status: updateRate === 100 ? "good" : "warn" },
      { name: "CJ 긴급요청 건수", value: urgentCj, target: 0, unit: "건", status: urgentCj === 0 ? "good" : "bad" },
    ];

    return NextResponse.json(kpis);
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "KPI 계산 실패" }, { status: 500 });
  }
}
