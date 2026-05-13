import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
  const now = new Date();
  const weekAgo = new Date(now.getTime() - 7 * 86400000);
  const weekLater = new Date(now.getTime() + 7 * 86400000);

  const completedRequests = await prisma.codeRequest.findMany({
    where: { completedDate: { gte: weekAgo }, completed: true },
  });

  const pendingRequests = await prisma.codeRequest.findMany({
    where: {
      cjRequested: false,
      completed: false,
      receivedDate: { gte: weekAgo },
    },
  });

  const upcomingDeadlines = await prisma.projectTask.findMany({
    where: { dueDate: { gte: now, lte: weekLater }, status: { not: "DONE" } },
    include: { project: true },
  });

  const projects = await prisma.project.findMany({
    where: { status: "IN_PROGRESS" },
    include: { tasks: true },
  });

  const weekOfYear = Math.ceil(
    (now.getTime() - new Date(now.getFullYear(), 0, 1).getTime()) /
      (7 * 86400000)
  );

  const summary = `# 카페게이트 구매물류팀 주간 공유 (${now.getFullYear()}년 ${weekOfYear}주차)

📅 기준일: ${now.toLocaleDateString("ko-KR")}

---

## ✅ 이번 주 완료된 일
${
  completedRequests.length > 0
    ? completedRequests
        .map((r) => `- [완료] ${r.productName} 코드 등록 (${r.requestTeam} 요청)`)
        .join("\n")
    : "- 이번 주 완료된 코드 요청이 없습니다."
}

---

## 🔄 다음 주 진행 예정
${
  pendingRequests.length > 0
    ? pendingRequests
        .map((r) => `- [처리 중] ${r.productName} CJ 요청 예정 (${r.requestTeam})`)
        .join("\n")
    : "- 대기 중인 코드 요청이 없습니다."
}

${
  upcomingDeadlines.length > 0
    ? upcomingDeadlines
        .map(
          (t) =>
            `- [마감 임박] ${t.project?.projectName ?? "프로젝트"} - ${t.taskName} (${new Date(t.dueDate).toLocaleDateString("ko-KR")}, ${t.assignee ?? "담당자 미정"})`
        )
        .join("\n")
    : ""
}

---

## 🚧 막힌 일 / 이슈
${
  projects.length > 0
    ? projects
        .map((p) => {
          const blockedTasks = p.tasks.filter((t) => t.status === "BLOCKED");
          return blockedTasks.length > 0
            ? blockedTasks.map((t) => `- [블로킹] ${p.projectName}: ${t.taskName}`).join("\n")
            : "";
        })
        .filter(Boolean)
        .join("\n") || "- 현재 블로킹 이슈 없음"
    : "- 현재 블로킹 이슈 없음"
}

---
*카페게이트 ONE FLOW 대시보드 자동 생성*`;

  return NextResponse.json({ summary, generatedAt: now.toISOString() });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "주간 초안 생성 실패" }, { status: 500 });
  }
}
