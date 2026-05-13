-- CreateTable
CREATE TABLE "CodeRequest" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
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
    "cjDeliveryDate" DATETIME,
    "taxType" TEXT,
    "moqDelivery" TEXT,
    "unitWeight" REAL,
    "packBoxQty" INTEGER,
    "requestType" TEXT NOT NULL DEFAULT 'NEW',
    "requestTeam" TEXT NOT NULL,
    "requesterName" TEXT NOT NULL,
    "receivedDate" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "receivedConfirmed" BOOLEAN NOT NULL DEFAULT false,
    "cjRequested" BOOLEAN NOT NULL DEFAULT false,
    "cjRequestedDate" DATETIME,
    "completed" BOOLEAN NOT NULL DEFAULT false,
    "completedDate" DATETIME,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "note" TEXT,
    "projectId" INTEGER,
    CONSTRAINT "CodeRequest_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Project" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "projectName" TEXT NOT NULL,
    "launchDate" DATETIME NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PLANNING',
    "description" TEXT
);

-- CreateTable
CREATE TABLE "ProjectTask" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "projectId" INTEGER NOT NULL,
    "teamName" TEXT NOT NULL,
    "taskName" TEXT NOT NULL,
    "dueDate" DATETIME NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'TODO',
    "assignee" TEXT,
    "weeklyUpdate" TEXT,
    CONSTRAINT "ProjectTask_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "User" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "team" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'MEMBER'
);

-- CreateTable
CREATE TABLE "KpiLog" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "measureDate" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "kpiName" TEXT NOT NULL,
    "value" REAL NOT NULL,
    "target" REAL NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");
