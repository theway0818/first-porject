-- CreateTable
CREATE TABLE "CodeRequest" (
    "id" SERIAL NOT NULL,
    "productName" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "storageType" TEXT NOT NULL,
    "supplierName" TEXT NOT NULL,
    "supplierContact" TEXT,
    "supplierPhone" TEXT,
    "supplierEmail" TEXT,
    "shelfLife" TEXT,
    "leadTime" INTEGER,
    "initialLeadTime" INTEGER,
    "monthlyUsage" INTEGER,
    "initialOrderQty" INTEGER,
    "cjDeliveryDate" TIMESTAMP(3),
    "taxType" TEXT,
    "moqDelivery" TEXT,
    "unitWeight" DOUBLE PRECISION,
    "packBoxQty" INTEGER,
    "requestType" TEXT NOT NULL DEFAULT 'NEW',
    "requestTeam" TEXT NOT NULL,
    "requesterName" TEXT NOT NULL,
    "receivedDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "receivedConfirmed" BOOLEAN NOT NULL DEFAULT false,
    "cjRequested" BOOLEAN NOT NULL DEFAULT false,
    "cjRequestedDate" TIMESTAMP(3),
    "completed" BOOLEAN NOT NULL DEFAULT false,
    "completedDate" TIMESTAMP(3),
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "note" TEXT,
    "projectId" INTEGER,

    CONSTRAINT "CodeRequest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Project" (
    "id" SERIAL NOT NULL,
    "projectName" TEXT NOT NULL,
    "launchDate" TIMESTAMP(3) NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PLANNING',
    "description" TEXT,

    CONSTRAINT "Project_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProjectTask" (
    "id" SERIAL NOT NULL,
    "projectId" INTEGER NOT NULL,
    "teamName" TEXT NOT NULL,
    "taskName" TEXT NOT NULL,
    "dueDate" TIMESTAMP(3) NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'TODO',
    "assignee" TEXT,
    "weeklyUpdate" TEXT,

    CONSTRAINT "ProjectTask_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "User" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "team" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'MEMBER',

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "KpiLog" (
    "id" SERIAL NOT NULL,
    "measureDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "kpiName" TEXT NOT NULL,
    "value" DOUBLE PRECISION NOT NULL,
    "target" DOUBLE PRECISION NOT NULL,

    CONSTRAINT "KpiLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- AddForeignKey
ALTER TABLE "CodeRequest" ADD CONSTRAINT "CodeRequest_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProjectTask" ADD CONSTRAINT "ProjectTask_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
