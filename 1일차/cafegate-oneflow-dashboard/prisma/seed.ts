import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import { PrismaClient } from "../app/generated/prisma/client";

const adapter = new PrismaBetterSqlite3({ url: process.env["DATABASE_URL"] ?? "file:./dev.db" });

const prisma = new PrismaClient({ adapter });

async function main() {
  // 사용자 데이터
  await prisma.user.createMany({
    data: [
      { name: "김인호", email: "inho@cafegate.co.kr", team: "PURCHASING", role: "MANAGER" },
      { name: "박지수", email: "jisu@cafegate.co.kr", team: "PURCHASING", role: "MEMBER" },
      { name: "이유진", email: "yujin@cafegate.co.kr", team: "MENU_DEV", role: "MANAGER" },
      { name: "최민준", email: "minjun@cafegate.co.kr", team: "MENU_DEV", role: "MEMBER" },
      { name: "한소연", email: "soyeon@cafegate.co.kr", team: "OPERATIONS", role: "MANAGER" },
      { name: "정다은", email: "daeun@cafegate.co.kr", team: "OPERATIONS", role: "MEMBER" },
      { name: "오본부장", email: "director@cafegate.co.kr", team: "EXECUTIVE", role: "EXECUTIVE" },
    ],
  });

  // 프로젝트 데이터
  const spring = await prisma.project.create({
    data: {
      projectName: "2026 봄 신메뉴 출시",
      launchDate: new Date("2026-03-15"),
      status: "IN_PROGRESS",
      description: "봄 시즌 5종 신메뉴 및 관련 원재료 코드 등록",
    },
  });

  const summer = await prisma.project.create({
    data: {
      projectName: "2026 여름 한정 메뉴",
      launchDate: new Date("2026-06-01"),
      status: "PLANNING",
      description: "냉음료 중심 여름 한정판 4종",
    },
  });

  const collab = await prisma.project.create({
    data: {
      projectName: "외부 브랜드 콜라보 기획",
      launchDate: new Date("2026-04-20"),
      status: "IN_PROGRESS",
      description: "제과 브랜드 협업 디저트 음료 2종",
    },
  });

  // 프로젝트 담당 업무
  await prisma.projectTask.createMany({
    data: [
      { projectId: spring.id, teamName: "MENU_DEV", taskName: "신메뉴 레시피 확정", dueDate: new Date("2026-02-01"), status: "DONE", assignee: "이유진", weeklyUpdate: "5종 레시피 최종 확정 완료" },
      { projectId: spring.id, teamName: "MENU_DEV", taskName: "원재료 리스트 제출", dueDate: new Date("2026-02-10"), status: "DONE", assignee: "최민준", weeklyUpdate: "구매팀에 리스트 전달 완료" },
      { projectId: spring.id, teamName: "PURCHASING", taskName: "신규 코드 등록 요청", dueDate: new Date("2026-02-20"), status: "IN_PROGRESS", assignee: "김인호", weeklyUpdate: "아사이베리베이스 등 3건 처리 중" },
      { projectId: spring.id, teamName: "OPERATIONS", taskName: "매장 운영 교육 자료 작성", dueDate: new Date("2026-03-05"), status: "TODO", assignee: "한소연", weeklyUpdate: "" },
      { projectId: summer.id, teamName: "MENU_DEV", taskName: "냉음료 컨셉 기획", dueDate: new Date("2026-03-01"), status: "IN_PROGRESS", assignee: "이유진", weeklyUpdate: "3종 컨셉안 검토 중" },
      { projectId: summer.id, teamName: "PURCHASING", taskName: "원재료 소싱 조사", dueDate: new Date("2026-03-15"), status: "TODO", assignee: "박지수", weeklyUpdate: "" },
      { projectId: collab.id, teamName: "MENU_DEV", taskName: "콜라보 음료 레시피 개발", dueDate: new Date("2026-03-20"), status: "IN_PROGRESS", assignee: "이유진", weeklyUpdate: "파트너사와 레시피 조율 중" },
      { projectId: collab.id, teamName: "PURCHASING", taskName: "협업 원재료 코드 등록", dueDate: new Date("2026-03-25"), status: "TODO", assignee: "김인호", weeklyUpdate: "" },
    ],
  });

  // 코드 요청 데이터 (누락 위험 포함)
  const now = new Date();
  const daysAgo = (d: number) => new Date(now.getTime() - d * 86400000);

  await prisma.codeRequest.createMany({
    data: [
      {
        productName: "아사이베리베이스(카페게이트용 2kg/EA)",
        category: "음료베이스",
        storageType: "냉동",
        supplierName: "(주)베리팜",
        supplierContact: "홍길동",
        supplierPhone: "02-1234-5678",
        supplierEmail: "hong@berryfarm.com",
        shelfLife: "제조일로부터 12개월",
        leadTime: 7,
        initialLeadTime: 14,
        monthlyUsage: 200,
        initialOrderQty: 50,
        cjDeliveryDate: new Date("2026-02-25"),
        taxType: "과세",
        moqDelivery: "20EA",
        unitWeight: 2000,
        packBoxQty: 6,
        requestType: "NEW",
        requestTeam: "MENU_DEV",
        requesterName: "이유진",
        receivedDate: daysAgo(10),
        receivedConfirmed: true,
        cjRequested: false,
        status: "RECEIVED",
        note: "봄 신메뉴 출시용",
        projectId: spring.id,
      },
      {
        productName: "딸기퓨레(냉동 1kg)",
        category: "음료베이스",
        storageType: "냉동",
        supplierName: "(주)프레시베리",
        supplierContact: "김민수",
        supplierPhone: "02-9876-5432",
        supplierEmail: "kim@freshberry.com",
        shelfLife: "제조일로부터 18개월",
        leadTime: 5,
        monthlyUsage: 150,
        initialOrderQty: 30,
        cjDeliveryDate: new Date("2026-02-27"),
        taxType: "면세",
        packBoxQty: 12,
        requestType: "NEW",
        requestTeam: "MENU_DEV",
        requesterName: "최민준",
        receivedDate: daysAgo(3),
        receivedConfirmed: true,
        cjRequested: false,
        status: "RECEIVED",
        projectId: spring.id,
      },
      {
        productName: "오트밀크(1L, 바리스타용)",
        category: "원재료",
        storageType: "실온",
        supplierName: "오틀리코리아",
        supplierContact: "박성희",
        supplierPhone: "02-5555-1234",
        supplierEmail: "park@oatly.kr",
        shelfLife: "제조일로부터 12개월",
        leadTime: 10,
        monthlyUsage: 500,
        initialOrderQty: 100,
        cjDeliveryDate: new Date("2026-02-28"),
        taxType: "과세",
        moqDelivery: "12EA",
        unitWeight: 1000,
        packBoxQty: 12,
        requestType: "NEW",
        requestTeam: "OPERATIONS",
        requesterName: "한소연",
        receivedDate: daysAgo(8),
        receivedConfirmed: true,
        cjRequested: false,
        status: "RECEIVED",
        note: "여름 메뉴 준비용",
        projectId: summer.id,
      },
      {
        productName: "무설탕 바닐라시럽(1L)",
        category: "음료베이스",
        storageType: "실온",
        supplierName: "모닌코리아",
        supplierContact: "이진혁",
        supplierPhone: "02-3333-7890",
        supplierEmail: "lee@monin.kr",
        shelfLife: "제조일로부터 24개월",
        leadTime: 3,
        monthlyUsage: 80,
        initialOrderQty: 20,
        cjDeliveryDate: new Date("2026-02-20"),
        taxType: "과세",
        packBoxQty: 6,
        requestType: "NEW",
        requestTeam: "MENU_DEV",
        requesterName: "이유진",
        receivedDate: daysAgo(5),
        receivedConfirmed: true,
        cjRequested: true,
        cjRequestedDate: daysAgo(2),
        completed: false,
        status: "CJ_REQUESTED",
        projectId: spring.id,
      },
      {
        productName: "라즈베리 농축액(500ml)",
        category: "음료베이스",
        storageType: "냉장",
        supplierName: "(주)베리팜",
        supplierContact: "홍길동",
        supplierPhone: "02-1234-5678",
        supplierEmail: "hong@berryfarm.com",
        shelfLife: "개봉 후 30일",
        leadTime: 7,
        monthlyUsage: 60,
        initialOrderQty: 15,
        taxType: "과세",
        requestType: "NEW",
        requestTeam: "MENU_DEV",
        requesterName: "최민준",
        receivedDate: daysAgo(1),
        receivedConfirmed: false,
        cjRequested: false,
        status: "DRAFT",
        projectId: collab.id,
      },
      {
        productName: "콜드브루 농축액(1L)",
        category: "음료베이스",
        storageType: "냉장",
        supplierName: "커피빈코리아",
        supplierContact: "정상우",
        supplierPhone: "02-7777-4321",
        supplierEmail: "jung@coffeebean.kr",
        shelfLife: "제조일로부터 6개월",
        leadTime: 5,
        monthlyUsage: 120,
        initialOrderQty: 24,
        cjDeliveryDate: new Date("2026-03-05"),
        taxType: "과세",
        packBoxQty: 6,
        requestType: "NEW",
        requestTeam: "OPERATIONS",
        requesterName: "정다은",
        receivedDate: daysAgo(2),
        receivedConfirmed: true,
        cjRequested: false,
        status: "RECEIVED",
        projectId: summer.id,
      },
      {
        productName: "그래놀라(500g, 토핑용)",
        category: "원재료",
        storageType: "실온",
        supplierName: "아침바람",
        supplierContact: "윤채원",
        supplierPhone: "031-2222-8888",
        supplierEmail: "yoon@granola.co.kr",
        shelfLife: "제조일로부터 9개월",
        leadTime: 7,
        monthlyUsage: 40,
        initialOrderQty: 10,
        taxType: "면세",
        packBoxQty: 12,
        requestType: "NEW",
        requestTeam: "MENU_DEV",
        requesterName: "이유진",
        receivedDate: daysAgo(14),
        receivedConfirmed: true,
        cjRequested: false,
        status: "RECEIVED",
        note: "리드타임 고려 시 긴급 처리 필요",
        projectId: collab.id,
      },
      {
        productName: "친환경 종이컵(16oz, 500개입)",
        category: "포장재",
        storageType: "실온",
        supplierName: "그린팩코리아",
        supplierContact: "강도현",
        supplierPhone: "032-4444-9999",
        supplierEmail: "kang@greenpack.kr",
        leadTime: 14,
        monthlyUsage: 2000,
        initialOrderQty: 500,
        cjDeliveryDate: new Date("2026-03-01"),
        taxType: "과세",
        moqDelivery: "100개입 1박스",
        requestType: "NEW",
        requestTeam: "OPERATIONS",
        requesterName: "한소연",
        receivedDate: daysAgo(0),
        receivedConfirmed: true,
        cjRequested: false,
        status: "RECEIVED",
      },
      {
        productName: "코코넛밀크(400ml)",
        category: "원재료",
        storageType: "실온",
        supplierName: "차오코",
        supplierContact: "신민아",
        supplierPhone: "02-6666-3333",
        supplierEmail: "shin@chaokoh.kr",
        shelfLife: "제조일로부터 24개월",
        leadTime: 10,
        monthlyUsage: 100,
        initialOrderQty: 24,
        taxType: "면세",
        packBoxQty: 12,
        requestType: "NEW",
        requestTeam: "MENU_DEV",
        requesterName: "이유진",
        receivedDate: daysAgo(4),
        receivedConfirmed: true,
        cjRequested: true,
        cjRequestedDate: daysAgo(1),
        status: "CJ_REQUESTED",
        projectId: summer.id,
      },
      {
        productName: "유기농 말차파우더(100g)",
        category: "원재료",
        storageType: "실온",
        supplierName: "오가닉녹차원",
        supplierContact: "류민정",
        supplierPhone: "061-1111-2222",
        supplierEmail: "ryu@organic.co.kr",
        shelfLife: "제조일로부터 18개월",
        leadTime: 7,
        monthlyUsage: 30,
        initialOrderQty: 10,
        cjDeliveryDate: new Date("2026-03-10"),
        taxType: "면세",
        packBoxQty: 10,
        requestType: "CHANGE",
        requestTeam: "MENU_DEV",
        requesterName: "최민준",
        receivedDate: daysAgo(6),
        receivedConfirmed: true,
        cjRequested: false,
        status: "RECEIVED",
        note: "기존 스펙 변경 (100g → 200g)",
        projectId: spring.id,
      },
    ],
  });

  // KPI 로그 (최근 4주)
  const kpiNames = ["누락건수", "양식사용률", "업데이트이행률", "CJ긴급요청"];
  const targets = [0, 100, 100, 0];
  for (let week = 4; week >= 1; week--) {
    const date = new Date(now.getTime() - week * 7 * 86400000);
    for (let i = 0; i < kpiNames.length; i++) {
      await prisma.kpiLog.create({
        data: {
          measureDate: date,
          kpiName: kpiNames[i],
          value: i === 0 ? Math.max(0, 4 - week) : Math.min(100, 60 + week * 10),
          target: targets[i],
        },
      });
    }
  }

  console.log("✅ 더미 데이터 삽입 완료!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
