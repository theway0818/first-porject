import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const now = new Date();

    const pendingRequests = await prisma.codeRequest.findMany({
      where: {
        cjRequested: false,
        completed: false,
        status: { notIn: ["COMPLETED", "REJECTED"] },
      },
    });

    const risks = pendingRequests
      .map((r) => {
        const daysSinceReceived =
          (now.getTime() - new Date(r.receivedDate).getTime()) / 86400000;

        let level: "urgent" | "warning" | null = null;
        let reason = "";

        if (r.cjDeliveryDate && r.leadTime != null) {
          const daysUntilDelivery =
            (new Date(r.cjDeliveryDate).getTime() - now.getTime()) / 86400000;
          if (daysUntilDelivery < r.leadTime + 3) {
            level = "urgent";
            reason = `CJ 납기까지 ${Math.round(daysUntilDelivery)}일 남음 (리드타임 ${r.leadTime}일 + 3일 여유 미달)`;
          }
        }

        if (!level && daysSinceReceived > 7) {
          level = "warning";
          reason = `등록 후 ${Math.round(daysSinceReceived)}일 경과, CJ 요청 미처리`;
        }

        return level ? { ...r, riskLevel: level, riskReason: reason } : null;
      })
      .filter((r): r is NonNullable<typeof r> => r !== null);

    return NextResponse.json(risks);
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "위험 감지 실패" }, { status: 500 });
  }
}
