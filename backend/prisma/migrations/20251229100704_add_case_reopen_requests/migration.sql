-- CreateEnum
CREATE TYPE "CaseReopenStatus" AS ENUM ('REQUESTED', 'APPROVED', 'REJECTED');

-- CreateTable
CREATE TABLE "case_reopen_requests" (
    "id" UUID NOT NULL,
    "caseId" UUID NOT NULL,
    "requestedBy" UUID NOT NULL,
    "reviewedBy" UUID,
    "status" "CaseReopenStatus" NOT NULL DEFAULT 'REQUESTED',
    "policeReason" TEXT NOT NULL,
    "judgeNote" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "decidedAt" TIMESTAMP(3),

    CONSTRAINT "case_reopen_requests_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "case_reopen_requests_caseId_idx" ON "case_reopen_requests"("caseId");

-- CreateIndex
CREATE INDEX "case_reopen_requests_requestedBy_idx" ON "case_reopen_requests"("requestedBy");

-- CreateIndex
CREATE INDEX "case_reopen_requests_reviewedBy_idx" ON "case_reopen_requests"("reviewedBy");

-- AddForeignKey
ALTER TABLE "case_reopen_requests" ADD CONSTRAINT "case_reopen_requests_caseId_fkey" FOREIGN KEY ("caseId") REFERENCES "cases"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "case_reopen_requests" ADD CONSTRAINT "case_reopen_requests_requestedBy_fkey" FOREIGN KEY ("requestedBy") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "case_reopen_requests" ADD CONSTRAINT "case_reopen_requests_reviewedBy_fkey" FOREIGN KEY ("reviewedBy") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
