import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { apiLogger } from "@/lib/logger";

const logger = apiLogger("api/code-requests/bulk");

export async function POST(req: NextRequest) {
  try {
    const rows = await req.json();
    if (!Array.isArray(rows) || rows.length === 0) {
      return NextResponse.json({ error: "데이터가 없습니다" }, { status: 400 });
    }

    const toData = (r: Record<string, unknown>) => ({
      productName:     String(r.productName ?? ""),
      category:        String(r.category ?? ""),
      storageType:     String(r.storageType ?? "실온"),
      supplierName:    String(r.supplierName ?? ""),
      supplierContact: r.supplierContact ? String(r.supplierContact) : null,
      supplierPhone:   r.supplierPhone   ? String(r.supplierPhone)   : null,
      supplierEmail:   r.supplierEmail   ? String(r.supplierEmail)   : null,
      shelfLife:       r.shelfLife       ? String(r.shelfLife)       : null,
      leadTime:        r.leadTime        ? Number(r.leadTime)        : null,
      monthlyUsage:    r.monthlyUsage    ? Number(r.monthlyUsage)    : null,
      initialOrderQty: r.initialOrderQty ? Number(r.initialOrderQty) : null,
      cjDeliveryDate:  r.cjDeliveryDate  ? new Date(String(r.cjDeliveryDate)) : null,
      taxType:         r.taxType         ? String(r.taxType)         : null,
      unitWeight:      r.unitWeight      ? Number(r.unitWeight)      : null,
      packBoxQty:      r.packBoxQty      ? Number(r.packBoxQty)      : null,
      requestType:     String(r.requestType  ?? "NEW"),
      requestTeam:     String(r.requestTeam  ?? ""),
      requesterName:   String(r.requesterName ?? ""),
      note:            r.note ? String(r.note) : null,
      status:          "DRAFT",
    });

    const results = await Promise.all(
      rows.map((r: Record<string, unknown>) => prisma.codeRequest.create({ data: toData(r) }))
    );

    logger.info(`일괄 등록 완료 ${results.length}건`);
    return NextResponse.json({ count: results.length }, { status: 201 });
  } catch (e) {
    logger.error("일괄 등록 실패", e);
    return NextResponse.json({ error: "일괄 등록 실패" }, { status: 500 });
  }
}
