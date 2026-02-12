-- CreateEnum
CREATE TYPE "DeadlineType" AS ENUM ('INVESTIGATION_COMPLETION', 'CHARGE_SHEET_FILING', 'COURT_HEARING', 'EVIDENCE_SUBMISSION', 'DOCUMENT_SUBMISSION', 'WITNESS_STATEMENT');

-- CreateEnum
CREATE TYPE "DeadlineStatus" AS ENUM ('PENDING', 'COMPLETED', 'OVERDUE', 'EXTENDED');

-- CreateEnum
CREATE TYPE "DeadlinePriority" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL');

-- CreateTable
CREATE TABLE "deadlines" (
    "id" UUID NOT NULL,
    "caseId" UUID NOT NULL,
    "type" "DeadlineType" NOT NULL,
    "dueDate" TIMESTAMP(3) NOT NULL,
    "assignedTo" UUID NOT NULL,
    "status" "DeadlineStatus" NOT NULL DEFAULT 'PENDING',
    "priority" "DeadlinePriority" NOT NULL DEFAULT 'MEDIUM',
    "title" TEXT NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),
    "extendedTo" TIMESTAMP(3),
    "remarks" TEXT,

    CONSTRAINT "deadlines_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "deadlines_caseId_idx" ON "deadlines"("caseId");

-- CreateIndex
CREATE INDEX "deadlines_assignedTo_idx" ON "deadlines"("assignedTo");

-- CreateIndex
CREATE INDEX "deadlines_dueDate_idx" ON "deadlines"("dueDate");

-- CreateIndex
CREATE INDEX "deadlines_status_idx" ON "deadlines"("status");

-- AddForeignKey
ALTER TABLE "deadlines" ADD CONSTRAINT "deadlines_caseId_fkey" FOREIGN KEY ("caseId") REFERENCES "cases"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "deadlines" ADD CONSTRAINT "deadlines_assignedTo_fkey" FOREIGN KEY ("assignedTo") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
